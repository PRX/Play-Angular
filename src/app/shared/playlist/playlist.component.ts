import { Component, Input } from '@angular/core';

@Component({
  selector: 'play-playlist',
  styleUrls: ['playlist.component.css'],
  template: `
  <div class="playlist">
  <h1>PLAYLIST COMPONENT</h1>
    <div *ngFor="let episode of episodes">{{episode.title}}</div>
  </div>`
})

export class PlaylistComponent {
  @Input() episodes: Array<any>;
  // @Input() duration: string;
  // @Input() length: number;

}
