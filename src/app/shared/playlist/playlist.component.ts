import { Component, Input, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'play-playlist',
  styleUrls: ['playlist.component.css'],
  templateUrl: 'playlist.component.html'
})

export class PlaylistComponent {
  @Input() episodes: Array<any>;
  @Input() subtitle: string;
  @Input() episodeIndex: number;
  @Input() playing: boolean;
  @Input() channelArt: string;
  @Output() playlistItemClicked = new EventEmitter<number>();

  // @Input() duration: string;
  // @Input() length: number;
  get totalDuration(): number {
    return this.episodes.reduce((accum, ep) => accum + +ep.duration, 0);
  }

}
