import { Component, Input } from '@angular/core';
import { AdapterProperties } from '../adapters/adapter.properties';

@Component({
  selector: 'play-playlist',
  styleUrls: ['playlist.component.css'],
  template: `<div class="playlist"> Playlist goes here </div>`
})

export class PlaylistComponent {
  @Input() episodes: Array<AdapterProperties>;
  // @Input() duration: string;
  // @Input() length: number;
  // @Input() feedDescription: string;

}
