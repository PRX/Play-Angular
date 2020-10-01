import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'play-share-modal',
  styleUrls: ['share-modal.component.css'],
  template: `
    <button class="close-btn" (click)="closeModal()" (window:keydown)="handleKeypress($event)">✖</button>
    <template [ngIf]="mode == 'share'">
      <h1>Use this player on your site</h1>
      <p>You can embed this player on your own site by including the following <code>iframe</code> tag.</p>

      <div class="embed-code">
      <strong>Horizontal</strong>
      <input type="text" [value]="horizontalCode" id="share-embed-small" readonly>
      <button (mouseover)="reset(small)" (click)="copy(small)" data-copytarget="#share-embed-small" #small>Copy</button>
      </div>

      <a [href]="customizeHref" id="customize-btn" target="_blank">Customize this player</a>
    </template>
    <template [ngIf]="mode == 'cookie'">
      <h1>Cookie Policy</h1>
      <p>
        We use cookies to help improve our player. See our
        <a target="blank" href="https://exchange.prx.org/privacy-policy">Privacy Policy</a>
        for more details.
      </p>
    </template>
  `
})

export class ShareModalComponent {

  @Input() mode = 'share';
  @Output() close = new EventEmitter<boolean>();

  get horizontalCode() {
    const href = window.location.href;
    const iframe = `<iframe frameborder="0" height="200" scrolling="no" src="${href}" width="100%"></iframe>`;
    return iframe;
  }

  get customizeHref() {
    return `/${window.location.search}`;
  }

  handleKeypress(event) {
    const key = event.code || event.key;
    if (key === 'Escape') {
      event.preventDefault();
      this.close.emit(true);
    }
  }

  closeModal() {
    this.close.emit(true);
  }

  reset(el: any) {
    el.innerHTML = 'Copy';
  }

  copy(el: any) {
    const sel = el.dataset.copytarget;
    const inp = document.querySelector(sel);

    if (inp && inp['select']) {
      inp['select']();
      try {
        document.execCommand('copy');
        inp.blur();
        el.innerHTML = 'Copied';
      } catch (err) {
        /// alert('please press Ctrl/Cmd+C to copy');
      }
    }
  }
}
