import { Component } from '@angular/core';

@Component({
  selector: 'play-demo',
  styleUrls: ['demo.component.css'],
  template: `
    <div id="color" [style.background-color]="backgroundColor">

      <div id="toolbar">
        <label for="bg-color">Background color:</label>
        <input type="text" id="bg-color" (change)="setColor(colorInput.value)" #colorInput>
      </div>

      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.
        Natus, ratione ad labore nobis ipsam nihil atque. Harum necessitatibus a,
        commodi impedit corrupti asperiores. Recusandae error soluta ut. Eius modi, non.</p>

      <div style="margin: 20px auto; width: 650px; height: 200px; z-index: 20; position: relative;">
        <iframe [src]="demoSrc" frameborder="0" width="650" height="200"></iframe>
      </div>

      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus, r
        atione ad labore nobis ipsam nihil atque. Harum necessitatibus a, commodi
        impedit corrupti asperiores. Recusandae error soluta ut. Eius modi, non.</p>

      <div style="margin: 20px auto; width: 500px; height: 500px; z-index: 20; position: relative;">
        <iframe [src]="demoSrc" frameborder="0" width="500" height="500"></iframe>
      </div>

      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
        nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
        officia deserunt mollit anim id est laborum.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
        quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
        fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
        culpa qui officia deserunt mollit anim id est laborum.</p>

    </div>
  `
})

export class DemoComponent {

  backgroundColor = 'white';

  demoSrc = '/e?tt=214-%20Loud%20and%20Clear&amp;ts=99%25%20Invisible&amp;' +
             'tc=&amp;ua=http%3A%2F%2Fwww.podtrac.com%2Fpts%2Fredirect.mp3%2F' +
             'media.blubrry.com%2F99percentinvisible%2Fdovetail.prxu.org%2F99pi' +
             '%2F874c3465-0dfc-456e-bf4b-14dcfc29b665%2F214-Loud-and-Clear.mp3&amp;' +
             'ui=http%3A%2F%2Fcdn.99percentinvisible.org%2Fwp-content%2Fuploads%2F' +
             'powerpress%2F99invisible-logo-1400.jpg&amp;uf=https%3A%2F%2Fprx-feed.' +
             's3.amazonaws.com%2F99pi%2Ffeed-rss.xml&amp;uc=&amp;us=https%3A%2F%2F' +
             'itunes.apple.com%2Fus%2Fpodcast%2F99-invisible%2Fid394775318&amp;gs=_blank';

  setColor(color: string) {
    this.backgroundColor = color;
  }

}
