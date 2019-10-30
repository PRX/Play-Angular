import { Component, OnInit, HostListener, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MergeAdapter } from './adapters/merge.adapter';
import { QSDAdapter } from './adapters/qsd.adapter';
import { DraperAdapter } from './adapters/draper.adapter';
import { FeedAdapter } from './adapters/feed.adapter';
import { AdapterProperties } from './adapters/adapter.properties';
import { PlayerComponent } from '../shared/player/player.component';
import { EMBED_SHOW_PLAYLIST_PARAM } from './embed.constants';
import { VisibilityService } from '../shared/visibility';

const PYM_MESSAGE_DELIMITER = 'xPYMx';
const PYM_CHILD_ID_PARAM = 'childId';

// Category
const CTA_MODAL = 'CTA Modal';

// Action
const DISPLAY = 'Display';
const DISMISS = 'Dismiss';

// Label
const DOWNLOAD = 'download';
const ENDED = 'ended';
const PAUSED = 'paused';
const BACKGROUNDED = 'backgrounded';

// Category
const EXIT = 'Exit';

// Action
const ANDROID = 'AndroidApp';
const IOS = 'iOSApp';

const BEACON = 'beacon';
const EVENT = 'event';

const RequestAnimationFrame = window['requestAnimationFrame']
                           || window['mozRequestAnimationFrame']
                           || window['webkitRequestAnimationFrame']
                           || window['msRequestAnimationFrame']
                           || (cb=>setTimeout(cb,0));

@Component({
  selector: 'play-embed',
  styleUrls: ['embed.component.css'],
  providers: [MergeAdapter, QSDAdapter, DraperAdapter, FeedAdapter],
  template: `
    <play-share-modal *ngIf="showShareModal" (close)="hideModal()"></play-share-modal>
    <play-player [feedArtworkUrl]="feedArtworkUrl" [audioUrl]="audioUrl" [title]="title" [subtitle]="subtitle"
      [subscribeUrl]="subscribeUrl" [subscribeTarget]="subscribeTarget" [artworkUrl]="artworkUrl" (share)="showModal()"
      [showPlaylist]="showPlaylist" [episodes]="episodes" (play)="onPlay($event)" (pause)="onPause($event)"
      (ended)="onEnded($event)" (download)="onDownload($event)" (downloadUrl)="onDownloadUrl($event)" [duration]="duration">
      <ng-template let-dismiss="dismiss">
        <div class="app-overlay" (window:keydown)="handleKeypress($event)">
          <p>Never miss an episode from <strong>{{this.subtitle}}</strong>
            and other great podcasts when you download the free RadioPublic app.</p>
          <ul class="app-selection">
            <li *ngIf="!isiOSDevice"><a [href]="playStoreLink()"
              [target]="subscribeTarget" (click)="noticeExit('AndroidApp')"><img src="/assets/images/google-play.png" alt="Google Play Store" /></a></li>
            <li *ngIf="!isAndroidDevice"><a [href]="appStoreLink()"
              [target]="subscribeTarget" (click)="noticeExit('iOSApp')"><img src="/assets/images/app-store.svg" alt="App Store" /></a></li>
            <li *ngIf="isiOSDevice">or the <a [href]="playStoreLink()"
              [target]="subscribeTarget" (click)="noticeExit('AndroidApp')">Google Play Store</a></li>
            <li *ngIf="isAndroidDevice">or the <a href="appStoreLink()"
              [target]="subscribeTarget" (click)="noticeExit('iOSApp')">App Store</a></li>
          </ul>
          <p class="aside" *ngIf="downloadRequested">You can also <a [href]="downloadAudioUrl"
            [target]="subscribeTarget">download the audio file</a> if you're on a computer.</p>
        </div>
      </ng-template>
    </play-player>
  `
})

export class EmbedComponent implements OnInit {

  showShareModal = false;
  hasInteracted = false;
  downloadRequested = false;
  downloadAudioUrl: string;

  // player params
  audioUrl: string;
  duration: number;
  title: string;
  subtitle: string;
  subscribeUrl: string;
  subscribeTarget: string;
  artworkUrl: string;
  feedArtworkUrl: string;
  pymId?: string;

  modalDisplayReason?: string;

  // playlist
  showPlaylist: boolean;
  episodes: AdapterProperties[];

  isiOSDevice = /iphone|ipad|ios/i.test(navigator.userAgent);
  isAndroidDevice = /android/i.test(navigator.userAgent);

  @ViewChild(PlayerComponent) private player: PlayerComponent;

  constructor(private route: ActivatedRoute, private adapter: MergeAdapter, private visibility: VisibilityService) {}

  ngOnInit() {
    this.route.queryParams.forEach(params => {
      this.pymId = params[PYM_CHILD_ID_PARAM];
      this.showPlaylist = typeof params[EMBED_SHOW_PLAYLIST_PARAM] !== 'undefined';
      this.setEmbedHeight();
      this.loadOnInFrame(params);
    });
    this.visibility.addVisibilityListener((event, hidden) => {
      if (this.hasInteracted) {
        this.player.displayOverlay();
        this.modalDisplayReason = BACKGROUNDED;
      }
    });
  }

  showModal() {
    this.showShareModal = true;
  }

  hideModal() {
    this.showShareModal = false;
  }

  onPlay(e) {
    this.hasInteracted = true;
    if (this.modalDisplayReason) {
      this.logEvent(CTA_MODAL, DISMISS, this.modalDisplayReason);
      this.modalDisplayReason = undefined;
    }
    this.player.dismissOverlay();
  }

  onPause(e) {
    this.hasInteracted = true;
    this.modalDisplayReason = PAUSED;
    this.logEvent(CTA_MODAL, DISPLAY, this.modalDisplayReason);
    this.player.displayOverlay();
  }

  onEnded(e) {
    if (!e.hasNextTrack) {
      this.modalDisplayReason = ENDED;
      this.logEvent(CTA_MODAL, DISPLAY, this.modalDisplayReason);
      this.player.displayOverlay();
    }
  }

  onDownload(e) {
    e.preventDefault();
    this.downloadRequested = true;
    this.modalDisplayReason = DOWNLOAD;
    this.logEvent(CTA_MODAL, DISPLAY, this.modalDisplayReason);
    this.player.displayOverlay();
  }

  onDownloadUrl(url: string) {
    this.downloadAudioUrl = url;
  }

  playStoreLink() {
    return `https://play.radiopublic.com/${encodeURIComponent(this.subscribeUrl)}?getApp=1&platform=android`;
  }

  appStoreLink() {
    return `https://play.radiopublic.com/${encodeURIComponent(this.subscribeUrl)}?getApp=1&platform=ios`;
  }

  private assignEpisodePropertiesToPlayer(properties: AdapterProperties) {
    this.audioUrl = ( properties.audioUrl || this.audioUrl );
    this.duration = ( properties.duration || this.duration || 0 );
    this.title = ( properties.title || this.title );
    this.subtitle = ( properties.subtitle || this.subtitle );
    this.subscribeUrl = ( properties.subscribeUrl || this.subscribeUrl );
    this.subscribeTarget = ( properties.subscribeTarget || this.subscribeTarget || '_blank');
    this.artworkUrl = ( properties.artworkUrl || this.artworkUrl );
    this.feedArtworkUrl = ( properties.feedArtworkUrl || this.feedArtworkUrl );
    this.episodes = properties.episodes || [];

    // fallback to feed image
    this.artworkUrl = this.artworkUrl || this.feedArtworkUrl;
  }

  noticeExit(platform: string) {
    this.logEvent(EXIT, platform, this.modalDisplayReason);
  }

  handleKeypress(event) {
    const key = event.code || event.key;
    if (key === 'Escape') {
      event.preventDefault();
      if (this.modalDisplayReason) {
        this.logEvent(CTA_MODAL, DISMISS, this.modalDisplayReason);
        this.modalDisplayReason = undefined;
      }
      this.player.dismissOverlay();
    }
  }

  @HostListener("window:resize", [])
  setEmbedHeight() {
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage(JSON.stringify({
        src: window.location.toString(),
        context: 'iframe.resize',
        height: 185
      }), '*');
      if (this.pymId) {
        window.parent.postMessage([
          'pym', this.pymId, 'height', 185
        ].join(PYM_MESSAGE_DELIMITER), '*');
      }
    }
  }

  private logEvent(category: string, action: string, label: string) {
    if (window['ga']) {
      window['ga']('send', {
        transport: BEACON, hitType: EVENT,
        eventCategory: category, eventAction: action, eventLabel: label
      });
    }
  }

  private loadOnInFrame(params) {
    RequestAnimationFrame(() => {
      this.adapter.getProperties(params).subscribe(props => {
        this.assignEpisodePropertiesToPlayer(props);
      });
    });
  }

}
