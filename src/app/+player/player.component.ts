import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange
} from '@angular/core';
import { Router } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { Observable, Observer } from 'rxjs/Rx';
import 'rxjs/add/operator/share';

import { DovetailAudio } from '../../lib/dovetail_audio';
import { Logger } from '../../lib/logger';
import { ProgressBarComponent } from './shared/index';
import { DurationPipe } from '../shared/index';
import * as constants from '../+embed/shared/embed-constants/embed-constants';

const AUDIO_URL = 'audioUrl';
const SEGMENT_TYPE = 'segmentType';

@Component({
  directives: [ProgressBarComponent],
  pipes: [AsyncPipe, DurationPipe],
  selector: 'player',
  styleUrls: ['app/+player/player.component.css'],
  templateUrl: 'app/+player/player.component.html'
})
export class PlayerComponent implements OnChanges, OnDestroy, OnInit {
  @Output() toggleShareModal = new EventEmitter<boolean>();
  private player: DovetailAudio;
  private logger: Logger;

  private currentSegmentType: string; // TODO Maybe this should be an enum
  private isUnrestricted: boolean;
  private isScrubbing: boolean;

  // True if playback is being held until seeking is completed
  private isHeld: boolean;

  @Input() private audioUrl: string;
  private currentTime: Observable<number>;
  private duration: Observable<number>;

  private title: string;
  private subtitle: string;
  private subscribeUrl: string;
  private subscribeTarget: string;
  private artworkUrl: string;

  private routerParams: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.player = new DovetailAudio(this.audioUrl);
    this.player.addEventListener('segmentstart', e => this.currentSegmentType = e[SEGMENT_TYPE]);

    this.routerParams = this.router
      .routerState
      .queryParams
      .subscribe(params => {
        this.title = decodeURIComponent(params[constants.EMBED_TITLE_PARAM]);
        this.subtitle = decodeURIComponent(params[constants.EMBED_SUBTITLE_PARAM]);
        this.subscribeUrl = decodeURIComponent(params[constants.EMBED_SUBSCRIBE_URL_PARAM]);
        this.subscribeTarget = decodeURIComponent(params[constants.EMBED_SUBSCRIBE_TARGET]);
        this.artworkUrl = `url(${decodeURIComponent(params[constants.EMBED_IMAGE_URL_PARAM])})`;

        this.logger = new Logger(this.player, this.title, this.subtitle);
      });

    this.duration = Observable.create((observer: Observer<number>) => {
      observer.next(0);
      this.player.ondurationchange = () => observer.next(this.player.duration);
      return (): void => this.player.ondurationchange = undefined;
    }).share();

    this.currentTime = Observable.create((observer: Observer<number>) => {
      observer.next(0);
      this.player.ontimeupdate = () => observer.next(this.player.currentTime);
      return (): void => this.player.ontimeupdate = undefined;
    }).share();
  }

  ngOnChanges(changes: { [key: string]: SimpleChange }) {
    if (changes[AUDIO_URL]) {
      // TODO: fix this stupid thing.
      // TODO make sure logger is updated (make a new logger)
      // console.error('if this were real, it would handle this.');
    }
  }

  ngOnDestroy() {
    this.routerParams.unsubscribe();
  }

  showShareModal() {
    this.toggleShareModal.emit(true);
  }

  onSeek(position: number) {
    this.seekTo(position);
  }

  onScrub(scrubbing: boolean) {
    this.isScrubbing = scrubbing;

    if (scrubbing && !this.player.paused) {
      this.player.pause();
      this.isHeld = true;
    } else if (!scrubbing && this.isHeld) {
      this.player.play();
      this.isHeld = false;
    }
  }

  cyclePlaybackRate(): void {
    if (this.player.playbackRate === 1) {
      this.player.playbackRate = 1.25;
    } else if (this.player.playbackRate === 1.25) {
      this.player.playbackRate = 1.5;
    } else if (this.player.playbackRate === 1.5) {
      this.player.playbackRate = 2;
    } else if (this.player.playbackRate === 2) {
      this.player.playbackRate = 1;
    }
  }

  handleHotkey(event: KeyboardEvent): void {
    const key = event.code || event.key;
    switch (key) {
      case 'KeyQ':
        this.isUnrestricted = !this.isUnrestricted;
        break;
      case 'KeyS':
        this.player.playbackRate = (3 - this.player.playbackRate);
        break;
      case 'KeyM':
        this.toggleMute();
        break;
      case 'Space':
        event.preventDefault();
        this.togglePlayPause();
        break;
      case 'KeyK':
        this.togglePlayPause();
        break;
      case 'KeyJ':
        this.seekBy(-10);
        break;
      case 'KeyL':
        this.seekBy(10);
        break;
      case 'ArrowLeft':
        this.seekBy(-5);
        break;
      case 'ArrowRight':
        this.seekBy(5);
        break;
      case 'Comma':
        if (this.player.paused) { this.seekBy(-1 / 30); }
        break;
      case 'Period':
        if (this.player.paused) { this.seekBy(1 / 30); }
        break;
      case 'Home':
        this.seekTo(0);
        break;
      case 'End':
        this.seekToRelative(1);
        break;
      case 'Digit1':
        this.seekToRelative(0.1);
        break;
      case 'Digit2':
        this.seekToRelative(0.2);
        break;
      case 'Digit3':
        this.seekToRelative(0.3);
        break;
      case 'Digit4':
        this.seekToRelative(0.4);
        break;
      case 'Digit5':
        this.seekToRelative(0.5);
        break;
      case 'Digit6':
        this.seekToRelative(0.6);
        break;
      case 'Digit7':
        this.seekToRelative(0.7);
        break;
      case 'Digit8':
        this.seekToRelative(0.8);
        break;
      case 'Digit9':
        this.seekToRelative(0.9);
        break;
      case 'Digit0':
        this.seekTo(0);
        break;
      default:
        break;
    }
  }

  private toggleMute() {
    if (this.player.volume === 0) {
      this.player.volume = 1;
    } else {
      this.player.volume = 0;
    }
  }

  private togglePlayPause() {
    if (this.player.paused) {
      this.player.play();
    } else {
      this.player.pause();
    }
  }

  private boundedTime(time: number) {
    return Math.min(Math.max(0, time), this.player.duration);
  }

  private seekTo(time: number) {
    this.player.currentTime = this.boundedTime(time);
  }

  private seekBy(seconds: number) {
    this.seekTo(this.player.currentTime + seconds);
  }

  private seekToRelative(ratio: number) {
    this.seekTo(this.player.duration * ratio);
  }
}
