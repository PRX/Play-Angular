import { Component, Input } from '@angular/core';

@Component({
  selector: 'play-playlist',
  styleUrls: ['playlist.component.css'],
  templateUrl: 'playlist.component.html'
})

export class PlaylistComponent {
  @Input() episodes: Array<any>;
  @Input() subtitle: string;
  // @Input() duration: string;
  // @Input() length: number;

}
