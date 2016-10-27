import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ShareModalComponent } from './shared/index';
import { PlayerComponent } from '../+player/index.ts';
import * as constants from './shared/index';

@Component({
  directives: [PlayerComponent, ShareModalComponent],
  styleUrls: ['app/+embed/embed.component.css'],
  template: `
    <share-modal
      *ngIf="showShareModal"
      (toggleShareModal)="toggleShareModal($event)">
    </share-modal>
    <player
      [audioUrl]="audioUrl"
      (toggleShareModal)="toggleShareModal($event)">
    </player>
  `
})
export class EmbedComponent implements OnDestroy, OnInit {
  private audioUrl: string;
  private showShareModal: boolean;
  private routerParams: any;

  constructor(private router: Router) {
    this.showShareModal = false;
  }

  ngOnInit() {
    this.routerParams = this.router
      .routerState
      .queryParams
      .subscribe(params => {
        const audioUrlInput = params[constants.EMBED_AUDIO_URL_PARAM];

        if (audioUrlInput) {
          this.audioUrl = decodeURIComponent(audioUrlInput);
        }
      });
  }

  ngOnDestroy() {
    this.routerParams.unsubscribe();
  }

  toggleShareModal(show: boolean) {
    this.showShareModal = show;
  }
}
