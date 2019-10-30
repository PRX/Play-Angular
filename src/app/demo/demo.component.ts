import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'play-demo',
  styleUrls: ['demo.component.css'],
  template: `
    <div id="color" [style.background-color]="backgroundColor">

      <div id="toolbar">
        <label for="bg-color">Background color:</label>
        <input type="text" [(ngModel)]="backgroundColor" id="bg-color">
        <label for="feed-url">Feed url:</label>
        <input type="text" [ngModel]="feedUrl" (ngModelChange)="setFeedUrl($event)" id="feed-url" style="width:300px">
      </div>

      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Natus, ratione ad labore nobis ipsam nihil atque. Harum necessitatibus a,
        commodi impedit corrupti asperiores. Recusandae error soluta ut. Eius modi, non.</p>

      <div style="margin: 20px auto; width: 650px; height: 200px; z-index: 20; position: relative;">
        <iframe [src]="demoSrc" frameborder="0" width="650" height="200"></iframe>
      </div>

      <div style="margin: 20px; text-align: center">
        <a [href]="demoSrc" target="_blank">Open iframe link</a>
      </div>

      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus, r
        atione ad labore nobis ipsam nihil atque. Harum necessitatibus a, commodi
        impedit corrupti asperiores. Recusandae error soluta ut. Eius modi, non.</p>

      <div style="margin: 20px auto; width: 500px; z-index: 20; position: relative;">
        <iframe [src]="demoSrc" frameborder="0" width="500"></iframe>
      </div>

      <div style="margin: 20px; text-align: center">
        <a [href]="demoSrc" target="_blank">Open iframe link</a>
      </div>

      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus, r
        atione ad labore nobis ipsam nihil atque. Harum necessitatibus a, commodi
        impedit corrupti asperiores. Recusandae error soluta ut. Eius modi, non.</p>

      <div style="margin: auto; width: 600px; height: 650px; z-index: 20; position: relative; border: 1px solid #ddd">
        <iframe [src]="demoPlaylist" frameborder="0" width="600" height="100%"></iframe>
      </div>

      <div style="margin: 20px; text-align: center">
        <a [href]="demoPlaylist" target="_blank">Open iframe link</a>
      </div>

    </div>
  `
})

export class DemoComponent {

  backgroundColor = 'white';

  feedUrl = 'http://feeds.99percentinvisible.org/99percentinvisible';

  demoSrc: SafeResourceUrl;
  demoPlaylist: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    this.setFeedUrl(this.feedUrl);
  }

  setFeedUrl(url: string) {
    this.feedUrl = url;
    const src = '/e?' + this.toQueryString({uf: url});
    this.demoSrc = this.sanitizer.bypassSecurityTrustResourceUrl(src);
    const list = '/e?' + this.toQueryString({uf: url, sp: 5});
    this.demoPlaylist = this.sanitizer.bypassSecurityTrustResourceUrl(list);
  }

  private toQueryString(obj: {}) {
    return Object.keys(obj).reduce((a, k) => {
      a.push(k + '=' + encodeURIComponent(obj[k]));
      return a;
    }, []).join('&');
  }

}
