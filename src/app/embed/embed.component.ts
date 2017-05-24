import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MergeAdapter } from './adapters/merge.adapter';
import { QSDAdapter } from './adapters/qsd.adapter';
import { DraperAdapter } from './adapters/draper.adapter';
import { FeedAdapter } from './adapters/feed.adapter';
import { AdapterProperties } from './adapters/adapter.properties';
import { EMBED_SHOW_PLAYLIST_PARAM } from './embed.constants';

const PYM_MESSAGE_DELIMITER = 'xPYMx';
const PYM_CHILD_ID_PARAM = 'childId';

@Component({
  selector: 'play-embed',
  styleUrls: ['embed.component.css'],
  providers: [MergeAdapter, QSDAdapter, DraperAdapter, FeedAdapter],
  template: `
    <play-share-modal *ngIf="showShareModal" (close)="hideModal()">
    </play-share-modal>
    <play-player [feedArtworkUrl]="feedArtworkUrl" [audioUrl]="audioUrl" [title]="title" [subtitle]="subtitle"
      [subscribeUrl]="subscribeUrl" [subscribeTarget]="subscribeTarget" [artworkUrl]="artworkUrl" (share)="showModal()"
      [showPlaylist]="showPlaylist" [episodes]="episodes">
    </play-player>
  `
})

export class EmbedComponent implements OnInit {

  showShareModal = false;

  // player params
  audioUrl: string;
  title: string;
  subtitle: string;
  subscribeUrl: string;
  subscribeTarget: string;
  artworkUrl: string;
  feedArtworkUrl: string;
  pymId?: string;

  // playlist
  showPlaylist: boolean;
  episodes: AdapterProperties[];

  constructor(private route: ActivatedRoute, private adapter: MergeAdapter) {}

  ngOnInit() {
    this.route.queryParams.forEach(params => {
      this.pymId = params[PYM_CHILD_ID_PARAM];
      this.showPlaylist = typeof params[EMBED_SHOW_PLAYLIST_PARAM] !== 'undefined';
      this.setEmbedHeight();
      this.adapter.getProperties(params).subscribe(props => {
        this.assignEpisodePropertiesToPlayer(props);
      });
    });
  }

  showModal() {
    this.showShareModal = true;
  }

  hideModal() {
    this.showShareModal = false;
  }

  private assignEpisodePropertiesToPlayer(properties: AdapterProperties) {
    this.audioUrl = ( properties.audioUrl || this.audioUrl );
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

}
