import 'core-js';
import 'reflect-metadata';
import 'zone.js';
import { enableProdMode } from '@angular/core';
import { bootstrap } from '@angular/platform-browser-dynamic';
import { disableDeprecatedForms, provideForms } from '@angular/forms';
import { HTTP_PROVIDERS } from '@angular/http';
import 'rxjs/Rx';

import { AppComponent } from './app.component';
import { APP_ROUTER_PROVIDERS } from './app.routes';

if (!window.location.hostname.match(/localhost|\.dev|\.docker/)) {
  enableProdMode();
}

bootstrap(AppComponent, [
  HTTP_PROVIDERS,
  disableDeprecatedForms(),
  provideForms(),
  APP_ROUTER_PROVIDERS
])
.catch(err => console.error(err));
