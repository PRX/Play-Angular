import { AdzerkRequest, AdzerkResponse } from './adzerk';
import { AdzerkFetcher } from './adzerk_fetcher';
import { ExtendableAudio } from '../javascript/extendable_audio';
import { DovetailFetcher, DovetailResponse } from './dovetail_fetcher';
import { DovetailAudioEvent } from './dovetail_audio_event';
import { DovetailArrangement, DovetailArrangementEntry } from './dovetail_arrangement';

type AllUnion = [
  DovetailResponse | PromiseLike<DovetailResponse>,
  AdzerkResponse | PromiseLike<AdzerkResponse>
];

type AllResult = [DovetailResponse, AdzerkResponse];

function sumDuration(collector: number, entry: {duration?: number}) {
  return collector + entry.duration || 0;
}

export interface SegmentEventData {
  segmentType: string;
  segment: DovetailArrangementEntry;
}

const DURATION_CHANGE = 'durationchange';
const TIME_UPDATE = 'timeupdate';
const ENDED = 'ended';
const SEEKING = 'seeking';
const SEEKED = 'seeked';
const ERROR = 'error';
const SEGMENT_START = 'segmentstart';
const SEGMENT_END = 'segmentend';
const PLAY = 'play';
const PAUSE = 'pause';
const PLAYING = 'playing';
const RATE_CHANGE = 'ratechange';
const ABORT = 'abort';
const CAN_PLAY = 'canplay';
const CAN_PLAY_THROUGH = 'canplaythrough';

const PROXIED_EVENTS = [
  TIME_UPDATE, SEEKED, ERROR, PLAYING, ABORT, CAN_PLAY, CAN_PLAY_THROUGH
];

export class DovetailAudio extends ExtendableAudio {
  private arrangement: DovetailArrangement = {entries: []};
  private index: number;

  private _dovetailLoading = false;

  private adzerkFetcher = new AdzerkFetcher();
  private dovetailFetcher = new DovetailFetcher();

  private currentPromise: Promise<any>;
  private currentAdzerkPromise: Promise<AdzerkResponse>;
  private resumeOnLoad = false;
  private _playbackRate: number;

  private _imgElem: HTMLImageElement;

  constructor(url: string) {
    super(url);
    this._audio.addEventListener(DURATION_CHANGE, this.listenerOnDurationChange.bind(this));
    this._audio.addEventListener(ENDED, this.listenerOnEnded.bind(this));
    this.$$forwardEvent = this.$$forwardEvent.bind(this);
    this.$$forwardEvents(PROXIED_EVENTS);
    this.finishConstructor();
    this.addEventListener(SEGMENT_END, this.$$logImpression.bind(this));
  }

  play() {
    this.$$sendEvent(PLAY);
    if (this._dovetailLoading) {
      this.resumeOnLoad = true;
    } else {
      this._audio.play();
    }
  }

  pause() {
    this.$$sendEvent(PAUSE);
    if (this._dovetailLoading) {
      this.resumeOnLoad = false;
    } else {
      this._audio.pause();
    }
  }

  get playbackRate() {
    if (!this._playbackRate) {
      this._playbackRate = this._audio.playbackRate;
    }
    return this._playbackRate;
  }

  set playbackRate(rate: number) {
    if (this._playbackRate != rate) {
      this._playbackRate = rate;
      this._audio.playbackRate = this._playbackRate;
      this.$$sendEvent(RATE_CHANGE);
    }
  }

  get duration() {
    if (typeof this.arrangement.duration === 'undefined') {
      this.arrangement.duration = this.arrangement.entries.reduce(sumDuration, 0);
    }
    return this.arrangement.duration;
  }

  get currentTime() {
    return this._audio.currentTime +
      this.arrangement.entries.slice(0, this.index).reduce(sumDuration, 0);
  }

  set currentTime(position: number) {
    if (this.currentTime != position) {
      let event = DovetailAudioEvent.build(SEEKING, this);
      this.emit(event);
      if (this.onseeking) { this.onseeking(event); }
      if (this.duration >= position) {
        let soFar = 0, paused = this.paused;
        for (let i = 0; i < this.arrangement.entries.length; i++) {
          let duration = this.arrangement.entries[i].duration;
          if (soFar + duration > position) {
            if (this.index != i) {
              this.skipToFile(i);
              const newTime = position - soFar;
              if (this._audio.currentTime != newTime) {
                this._audio.currentTime = newTime;
              } else {
                // Still send out an event since the overall time has changed
                this.$$sendEvent(TIME_UPDATE);
              }
              if (!paused) { this.play(); }
            } else {
              this._audio.currentTime = position - soFar;
            }
            return;
          } else {
            soFar += duration;
          }
        }
      }
    }
  }

  set src(url: string) {
    this.index = -1;
    this._dovetailLoading = true;
    let promise = this.currentPromise = this.dovetailFetcher.fetch(url).then(
      result => {
        if (this.currentPromise == promise) {
          let data: AllUnion  = [result, this.getArrangement(result.request)];
          return Promise.all<any>(data);
        }
      }
    ).then(([dovetailResponse, adzerkResponse]: AllResult) =>  {
      return this.calculateArrangement(dovetailResponse.arrangement, adzerkResponse);
    }).catch(error => {
      return [{
        audioUrl: url,
        duration: 0,
        id: 'fallback',
        type: 'fallback'
      }];
    }).then(arrangement => {
      if (this.currentPromise == promise) {
        this._dovetailLoading = false;
        this.setSegments(arrangement);
      }
    });
  }

  private getArrangement(adzerkRequestBody: AdzerkRequest, retries = 5) {
    let promise = this.currentAdzerkPromise = this.adzerkFetcher.fetch(adzerkRequestBody).catch(
      error => {
        if (this.currentAdzerkPromise == promise && retries > 0) {
          return this.getArrangement(adzerkRequestBody, retries - 1);
        } else {
          throw error;
        }
      }
    );
    return this.currentAdzerkPromise;
  }

  private calculateArrangement(
    arrangementTemplate: DovetailArrangementEntry[], response: AdzerkResponse) {
    let result: DovetailArrangementEntry[] = [];
    for (let entry of arrangementTemplate) {
      if (response.decisions[entry.id]) {
        result.push(entry);
        entry.audioUrl = response.decisions[entry.id].contents[0].data.imageUrl;
        entry.duration = 10;
        entry.impressionUrl = response.decisions[entry.id].impressionUrl;
      } else if (entry.type == 'original') {
        result.push(entry);
      }
    }
    return result;
  }

  private setSegments(segments: DovetailArrangementEntry[]) {
    this.arrangement = {entries: segments};
    this.skipToFile(0, this.resumeOnLoad);
  }

  private listenerOnDurationChange(event: Event) {
    event.stopImmediatePropagation();
    if (this._audio.src == this.arrangement.entries[this.index].audioUrl) {
      this.arrangement.entries[this.index].duration = this._audio.duration;
      this.arrangement.duration = undefined;
      this.$$sendEvent(DURATION_CHANGE);
    }
  }

  private listenerOnEnded(event: Event) {
    event.stopImmediatePropagation();
    if (this._audio.src == this.arrangement.entries[this.index].audioUrl) {
      if (!this.skipToFile(this.index + 1, true)) {
        this.$$sendEvent(ENDED);
      }
    }
  }

  private $$forwardEvents(eventTypes: string[]) {
    for (let type of eventTypes) {
      this._audio.addEventListener(type, this.$$forwardEvent);
    }
  }

  private $$forwardEvent(event: Event) {
    event.stopImmediatePropagation();
    this.$$sendEvent(event.type, event);
  }

  private $$sendEvent(eventType: string, extras?: {}) {
    const handler = this[`on${eventType}`];
    const e = DovetailAudioEvent.build(eventType, this, extras);
    this.emit(e);
    if (typeof handler === 'function') { handler.call(this, e); }
  }

  private skipToFile(index: number, resume = false) {
    if (this.index != index && this.arrangement.entries.length > index) {
      if (this.index != -1) {
        const eventData: SegmentEventData = {
          segment: this.arrangement.entries[this.index],
          segmentType: this.arrangement.entries[this.index].type
        };
        this.$$sendEvent(SEGMENT_END, eventData);
      }
      this.index = index;
      this._audio.src = this.arrangement.entries[index].audioUrl;
      this._audio.playbackRate = this.playbackRate;
      if (resume) { this._audio.play(); }

      this.$$sendEvent(SEGMENT_START, {
        segment: this.arrangement.entries[index],
        segmentType: this.arrangement.entries[index].type
      });

      return true;
    } else {
      return false;
    }
  }

  private $$logImpression(event: Event, data: SegmentEventData) {
    const type: string = data.segmentType;
    const segment: DovetailArrangementEntry = data.segment;

    if (type == 'ad' || type == 'houseAd') {
      if (typeof this._imgElem == 'undefined') {
          this._imgElem = document.createElement('img');
          this._imgElem.width = 1;
          this._imgElem.height = 1;
          this._imgElem.style.position = 'absolute';
          document.body.appendChild(this._imgElem);
      }
      this._imgElem.src = segment.impressionUrl;
    }
  }
}
