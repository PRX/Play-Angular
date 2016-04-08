import {Component, Input, OnChanges, SimpleChange, OnInit} from 'angular2/core';
import {RouteParams} from 'angular2/router';
import {AsyncPipe} from 'angular2/common';
import {DovetailAudio} from '../../lib/dovetail_audio';
import {Observable, Observer} from 'rxjs/Rx';
import 'rxjs/add/operator/share';
import ProgressBarComponent from './progress_bar.component';
import TimeIndicatorComponent from './time_indicator.component';

const AUDIO_URL = 'audioUrl';

@Component({
  directives: [ProgressBarComponent, TimeIndicatorComponent],
  pipes: [AsyncPipe],
  selector: 'player',
  styleUrls: ['src/app/player/player.component.css'],
  templateUrl: 'src/app/player/player.component.html'
})
export class PlayerComponent implements OnChanges, OnInit {
  private player: DovetailAudio;
  private adPlaying = false;

  @Input() private audioUrl: string;
  private currentTime: Observable<number>;
  private duration: Observable<number>;

  private isHeld: boolean;

  constructor(private routeParams: RouteParams) {}

  play() {
    this.player.play();
  }

  pause() {
    this.player.pause();
  }

  get paused() {
    return this.player.paused;
  }

  ngOnInit() {
    this.player = new DovetailAudio(this.audioUrl);
    this.player.addEventListener('adstart', () => this.adPlaying = true);
    this.player.addEventListener('adend', () => this.adPlaying = false);

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
      console.error('if this were real, it would handle this.');
    }
  }

  onSeek(position: number) {
    this.seekTo(position);
  }

  onHold(hold: boolean) {
    if (hold && !this.paused) {
      this.pause();
      this.isHeld = true;
    } else if (!hold && this.isHeld) {
      this.play();
      this.isHeld = false;
    }
  }

  handleHotkey(event: KeyboardEvent): void {
    const key = event.code || event.key;
    switch (key) {
      case 'Space':
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
        if (this.paused) { this.seekBy(-1 / 30); }
        break;
      case 'Period':
        if (this.paused) { this.seekBy(1 / 30); }
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

  private togglePlayPause() {
    if (this.paused) {
        this.play();
    } else {
      this.pause();
    }
  }

  private protectedTime(position: number) {
    return Math.min(Math.max(0, position), this.player.duration);
  }

  private seekBy(seconds: number) {
    this.player.currentTime = this.protectedTime(this.player.currentTime + seconds);
  }

  private seekTo(position: number) {
    this.player.currentTime = this.protectedTime(position);
  }

  private seekToRelative(ratio: number) {
    this.seekTo(this.player.duration * ratio);
  }
}
