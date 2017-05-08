import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DurationPipe } from './duration';
import { PlayerComponent } from './player';
import { ProgressComponent } from './progress';
import { PlaylistComponent } from './playlist';

@NgModule({
  declarations: [
    DurationPipe,
    PlayerComponent,
    ProgressComponent,
    PlaylistComponent
  ],
  exports: [
    CommonModule,
    DurationPipe,
    PlayerComponent,
    PlaylistComponent
  ],
  imports: [
    CommonModule
  ],
  providers: []
})

export class SharedModule { }
