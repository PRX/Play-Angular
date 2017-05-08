import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BuilderComponent, EpisodePickerComponent } from './builder';
import { EmbedComponent, ShareModalComponent } from './embed';
import { DemoComponent } from './demo';

export const routes: Routes = [
  { path: '',     component: BuilderComponent },
  { path: 'e',    component: EmbedComponent },
  { path: 'demo', component: DemoComponent }
];

export const routingComponents: any[] = [
  BuilderComponent,
  DemoComponent,
  EmbedComponent,
  EpisodePickerComponent,
  ShareModalComponent
];

export const routingProviders: any[] = [];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
