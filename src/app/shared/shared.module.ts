import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DurationPipe } from './duration';
import { PlayerComponent, MediaSessionService } from './player';
import { ProgressComponent } from './progress';
import { PlaylistComponent } from './playlist';
import { VolumeComponent } from './volume';

@NgModule({
  declarations: [
    DurationPipe,
    PlayerComponent,
    ProgressComponent,
    PlaylistComponent,
    VolumeComponent
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
  providers: [
    MediaSessionService
  ]
})

export class SharedModule { }
