import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { Observable, Observer } from 'rxjs';
import 'player.js';

import { DovetailAudio } from '../dovetail';
import { Logger } from '../logger';

const SEGMENT_TYPE = 'segmentType';
const playerjsAdapter = window['playerjs']['HTML5Adapter'];

@Component({
  selector: 'play-player',
  styleUrls: ['player.component.css'],
  templateUrl: 'player.component.html'
})

export class PlayerComponent implements OnInit, OnChanges {

  @Input() audioUrl: string;
  @Input() title: string;
  @Input() subtitle: string;
  @Input() subscribeUrl: string;
  @Input() subscribeTarget: string;
  @Input() artworkUrl: string;
  @Input() feedArtworkUrl: string;
  @Input() episodes: any[];
  @Input() showPlaylist: boolean;
  @Output() share = new EventEmitter<boolean>();

  artworkSafe: SafeStyle;
  feedArtworkSafe: SafeStyle;
  artworkSafeLoaded: SafeStyle;

  // for playlist feature
  episodeIndex = 0;

  private player: DovetailAudio;
  private logger: Logger;

  private currentSegmentType: string; // TODO Maybe this should be an enum
  private isUnrestricted: boolean;
  private isScrubbing: boolean;

  // True if playback is being held until seeking is completed
  private isHeld: boolean;

  private currentTime: Observable<number>;
  private duration: Observable<number>;

  private logoSrc: string;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.player = new DovetailAudio(this.audioUrl);
    this.player.addEventListener('segmentstart', e => this.currentSegmentType = e[SEGMENT_TYPE]);
    this.player.addEventListener('ended', e => {
      if (this.episodes && this.episodes.length > 0) {
        this.episodeIndex++;
        this.updatePlayingEpisode(this.episodeIndex);
      }
    });
    this.logger = new Logger(this.player, this.title, this.subtitle);

    this.artworkSafe = this.sanitizer.bypassSecurityTrustStyle(`url('${this.artworkUrl}')`);
    this.feedArtworkSafe = this.sanitizer.bypassSecurityTrustStyle(`url('${this.feedArtworkUrl}')`);

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

    if (window['ENV'] && window['ENV']['LOGO_NAME']) {
      this.logoSrc = `/assets/images/${window['ENV']['LOGO_NAME']}-logo.svg`;
    } else {
      this.logoSrc = '';
    }
    playerjsAdapter(this.player).ready();
  }

  ngOnChanges(changes: any) {
    if (this.player) {
      if (changes.audioUrl || changes.title || changes.subtitle) {
        this.logger = new Logger(this.player, this.title, this.subtitle);
      }
    }
    if (changes.feedArtworkUrl) {
      this.feedArtworkSafe = this.sanitizer.bypassSecurityTrustStyle(`url('${this.feedArtworkUrl}')`);
    }
    if (changes.artworkUrl) {
      this.artworkSafe = this.sanitizer.bypassSecurityTrustStyle(`url('${this.artworkUrl}')`);
    }
    if (this.player && changes.audioUrl) {
      this.player.src = this.audioUrl;
    }
    if (changes.episodes) {
      const playingFirstEp = this.showPlaylist && this.episodes && this.audioUrl === this.episodes[0].audioUrl;
      this.episodeIndex = playingFirstEp ?  0 : -1;
    }
  }

  showShareModal() {
    this.share.emit(true);
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

  skipTrack() {
    this.navigatePlaylist(this.episodeIndex + 1);
  }

  navigatePlaylist(index: number) {
    if (this.episodeIndex === index) {
      this.togglePlayPause();
    } else {
      this.updatePlayingEpisode(index);
    }
  }

  updatePlayingEpisode(index: number) {
    let newEpisode = this.episodes[index];
    if (newEpisode) {
      this.episodeIndex = index;
      this.title = newEpisode.title;
      this.artworkUrl = newEpisode.artworkUrl;
      this.audioUrl = this.player.src = newEpisode.audioUrl;
      this.player.addEventListener('canplay', e => this.player.play());
      this.player.removeEventListener();
    } else {
      console.log('fin');
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

  artworkLoaded() {
    this.artworkSafeLoaded = this.artworkSafe;
  }

  isPaused() {
    return this.player.paused;
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
