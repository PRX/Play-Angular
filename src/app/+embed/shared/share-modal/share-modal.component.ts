import { Component, EventEmitter, Output } from '@angular/core';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';

@Component({
  directives: [ROUTER_DIRECTIVES],
  selector: 'share-modal',
  styleUrls: ['app/+embed/shared/share-modal/share-modal.component.css'],
  templateUrl: 'app/+embed/shared/share-modal/share-modal.component.html'
})
export class ShareModalComponent {
  @Output() toggleShareModal = new EventEmitter<boolean>();

  constructor(
    private router: Router
  ) {}

  get horizontalCode() {
    const href = window.location.href;
    const iframe = `<iframe frameborder="0" height="200" scrolling="no" src="${href}" width="100%"></iframe>`;

    return iframe;
  }

  get squareCode() {
    const href = window.location.href;
    const iframe = `<iframe frameborder="0" height="500" scrolling="no" src="${href}" width="500"></iframe>`;

    return iframe;
  }

  get customizeHref() {
    return `/${window.location.search}`;
  }

  close() {
    this.toggleShareModal.emit(false);
  }

  reset(el: any) {
    el.innerHTML = 'Copy';
  }

  copy(el: any) {
    const sel = el.dataset.copytarget;
    const inp = document.querySelector(sel);

    if (inp && inp.select) {
      inp.select();

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
