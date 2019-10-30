import { AdzerkRequest, AdzerkResponse, AdzerkFetcher } from '../adzerk';
import { ExtendableAudio } from '../audio';
import { DovetailFetcher, DovetailResponse } from './dovetail-fetcher';
import { DovetailAudioEvent } from './dovetail-audio-event';
import { DovetailSegment } from './dovetail-segment';
import { VanillaAudioError } from './dovetail-errors';

type AllUnion = [
  DovetailResponse | PromiseLike<DovetailResponse>,
  AdzerkResponse | PromiseLike<AdzerkResponse>
];

interface DovetailSegmentEvent extends DovetailAudioEvent {
  segment: DovetailSegment;
}

type AllResult = [DovetailResponse, AdzerkResponse];
type PromiseResolver<x> = (value?: x | PromiseLike<x>) => void;

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
  TIME_UPDATE, SEEKED, PLAYING, ABORT, CAN_PLAY, CAN_PLAY_THROUGH
];

export class DovetailAudio extends ExtendableAudio {
  private arrangement: DovetailSegment[] = [];
  private index: number;

  private _dovetailOriginalUrl: string;
  private _dovetailLoading = false;

  private adzerkFetcher = new AdzerkFetcher();
  private dovetailFetcher = new DovetailFetcher();

  private currentPromise: Promise<any>;
  private currentAdzerkPromise: Promise<AdzerkResponse>;
  private resumeOnLoad: false|PromiseResolver<void> = false;
  private _playbackRate: number;

  constructor(url: string) {
    super(undefined);
    this._audio.addEventListener(ERROR, this.listenerOnError.bind(this));
    this._audio.addEventListener(DURATION_CHANGE, this.listenerOnDurationChange.bind(this));
    this._audio.addEventListener(ENDED, this.listenerOnEnded.bind(this));
    this.$$forwardEvent = this.$$forwardEvent.bind(this);
    this.$$forwardEvents(PROXIED_EVENTS);
    this.finishConstructor();
    this.addEventListener(SEGMENT_START, this.$$logDownload.bind(this));
    this.addEventListener(SEGMENT_END, this.$$logImpression.bind(this));
    this._toSetUrl = url;
  }

  play(): Promise<void> {
    if (this._toSetUrl) {
      this.setSegments(this.fallback(this._toSetUrl));
      this._toSetUrl = null;
      return this.play();
    } else {
      this.$$sendEvent(PLAY);
      if (this._dovetailLoading) {
        return new Promise<void>(resolve => {
          this.resumeOnLoad = resolve;
        });
      } else if (this.arrangement[this.index] && this.arrangement[this.index].unplayable) {
        return new Promise<void>(resolve => {
          this.skipToFile(this.index + 1, resolve);
        });
      } else {
        return this.playItSafe();
      }
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

  get paused(): boolean {
    return this._audio.paused && !this._dovetailLoading;
  }

  get playbackRate() {
    if (!this._playbackRate) {
      this._playbackRate = this._audio.playbackRate;
    }
    return this._playbackRate;
  }

  set playbackRate(rate: number) {
    if (this._playbackRate !== rate) {
      this._playbackRate = rate;
      this._audio.playbackRate = this._playbackRate;
      this.$$sendEvent(RATE_CHANGE);
    }
  }

  get duration() {
    return this.arrangement.map(s => s.duration).reduce((a, b) => a + b, 0);
  }

  get currentTime() {
    let segments = this.arrangement.slice(0, this.index).map(s => s.duration);
    return segments.reduce((a, b) => a + b, 0) + this._audio.currentTime;
  }

  set currentTime(position: number) {
    if (this.currentTime !== position) {
      let event = DovetailAudioEvent.build(SEEKING, this);
      this.emit(event);
      if (this.onseeking) { this.onseeking(event); }
      if (this.duration >= position) {
        let soFar = 0, paused = this.paused;
        for (let i = 0; i < this.arrangement.length; i++) {
          let duration = this.arrangement[i].duration;
          if (soFar + duration > position) {
            if (this.index !== i) {
              this.skipToFile(i);
              const newTime = position - soFar;
              if (this._audio.currentTime !== newTime) {
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
    if (this.dovetailFetcher.transform(url)) {
      this._dovetailOriginalUrl = url;
      url += (url.indexOf('?') < 0 ? '?' : '&') + 'debug';
    }
    if (this._audio.paused) {
      this._toSetUrl = url;
    } else {
      this.setSegments(this.fallback(url));
    }
  }

  private playItSafe(): Promise<void> {
    let safePlay = new Promise<void>(resolve => resolve(this._audio.play()));
    return safePlay.then(
      () => null,
      err => this.playErrorHandler(err)
    );
  }

  private playErrorHandler(err): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (this._dovetailLoading) {
        this.resumeOnLoad = resolve;
      } else if (this._dovetailOriginalUrl && err.name === 'NotSupportedError') {
        this._dovetailLoading = true;
        this.resumeOnLoad = resolve;
      } else {
        reject(err);
      }
    });
  }

  private fallback(url: string): DovetailSegment[] {
    return [DovetailSegment.forUrl(url)];
  }

  private getDovetailDebug(url: string) {
    this._dovetailLoading = true;
    let promise = this.currentPromise = this.dovetailFetcher.fetch(url).then(
      result => {
        if (!result.request.placements.length) {
          throw new VanillaAudioError();
        } else if (this.currentPromise === promise) {
          let data: AllUnion  = [result, this.getArrangement(result.request)];
          return Promise.all<any>(data);
        }
      }
    ).then(([dovetailResponse, adzerkResponse]: AllResult) =>  {
      return this.calculateSegments(dovetailResponse, adzerkResponse);
    }).catch(error => {
      if (error instanceof VanillaAudioError) {
        let directUrl = this.dovetailFetcher.transform(url);
        return this.fallback(directUrl);
      } else {
        return this.fallback(url);
      }
    }).then(arrangement => {
      if (this.currentPromise === promise) {
        this._dovetailLoading = false;
        this.$$debug('Arranged:\n' + arrangement.map(a => `  ${a.id} ${a.audioUrl}`).join('\n'));
        this.setSegments(arrangement);
      }
    });
  }

  private getArrangement(adzerkRequestBody: AdzerkRequest, retries = 5) {
    let promise = this.currentAdzerkPromise = this.adzerkFetcher.fetch(adzerkRequestBody).catch(
      error => {
        if (this.currentAdzerkPromise === promise && retries > 0) {
          return this.getArrangement(adzerkRequestBody, retries - 1);
        } else {
          throw error;
        }
      }
    );
    return this.currentAdzerkPromise;
  }

  private calculateSegments(dovetail: DovetailResponse, adzerk: AdzerkResponse) {
    let result: DovetailSegment[] = [], isFirst = true;
    for (let entry of dovetail.arrangement) {
      if (adzerk.decisions[entry.id]) {
        result.push(new DovetailSegment(entry, adzerk.decisions[entry.id], dovetail.tracker, isFirst));
        isFirst = false;
      } else if (entry.type === 'original') {
        result.push(new DovetailSegment(entry, null, dovetail.tracker, isFirst));
        isFirst = false;
      }
    }
    return result;
  }

  private setSegments(segments: DovetailSegment[]) {
    this.arrangement = segments;
    this.skipToFile(0, this.resumeOnLoad);
  }

  private listenerOnError(event: Event) {
    event.stopImmediatePropagation();
    let el = <HTMLMediaElement> event.target;
    let unsupported = el.error.code === el.error.MEDIA_ERR_SRC_NOT_SUPPORTED;

    if (this._dovetailOriginalUrl && unsupported) {
      let url = this._dovetailOriginalUrl;
      this._dovetailOriginalUrl = null;
      this._audio.src = '';
      this.index = -1;
      this.getDovetailDebug(url);
    } else if (this.index > -1 && unsupported) {
      this.arrangement[this.index].unplayable = true;
      this.$$sendEvent(DURATION_CHANGE);
      if (this.index > 0) {
        this.listenerOnEnded(event); // skip to next segment
      }
    } else {
      this.$$sendEvent(ERROR, event);
    }
  }

  private listenerOnDurationChange(event: Event) {
    event.stopImmediatePropagation();
    if (this._audio.src === this.arrangement[this.index].audioUrl) {
      this.arrangement[this.index].duration = this._audio.duration;
      this.$$sendEvent(DURATION_CHANGE);
    }
  }

  private listenerOnEnded(event: Event) {
    event.stopImmediatePropagation();
    if (this._audio.src === this.arrangement[this.index].audioUrl) {
      if (!this.skipToFile(this.index + 1, _ => {})) {
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

  private skipToFile(index: number, resume: false|PromiseResolver<void> = false): boolean {
    if (this.index !== index && this.arrangement.length > index) {
      if (this.index !== -1) {
        this.$$sendEvent(SEGMENT_END, {segment: this.arrangement[this.index]});
      }
      this.index = index;
      let nextSegment = this.arrangement[index];
      this.$$debug(`Goto: ${nextSegment.id}`);

      // skip unplayable / 0-length audio
      if (nextSegment.unplayable) {
        return this.skipToFile(index + 1, resume);
      }

      this._audio.src = nextSegment.audioUrl;
      this._audio.playbackRate = this.playbackRate;
      if (resume) { resume(this.playItSafe()); }

      this.$$sendEvent(SEGMENT_START, {segment: nextSegment});

      return true;
    } else {
      return false;
    }
  }

  private $$logDownload(event: DovetailSegmentEvent) {
    if (event.segment && event.segment.trackBefore()) {
      this.$$debug(`Download: ${event.segment.id}`);
    }
  }

  private $$logImpression(event: DovetailSegmentEvent) {
    if (event.segment && event.segment.trackAfter()) {
      this.$$debug(`Impress: ${event.segment.id}`);
    }
  }

  private $$debug(msg: string) {
    if (window.location.search.match(/[\?\&]debug/)) {
      console.log(msg);
    }
  }
}
