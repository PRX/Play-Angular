import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  HostListener, Input, Output } from '@angular/core';

import { Range } from '../range'

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'volume-control',
  styleUrls: ['volume.component.css'],
  /* tslint:disable:no-access-missing-member */
  template: `
    <div class="bar" [style.width.%]="100.0"></div>
    <div class="highlight" [style.width.%]="value * 100.0"></div>
  `
  /* tslint:enable:no-access-missing-member */
})

export class VolumeComponent extends Range {

  @Output() volChange = new EventEmitter<number>();

  constructor(protected el: ElementRef) {
    super(el);
  }

  sendUpdate() {
    super.sendUpdate();
    this.sendVolChange();
  }

  private sendVolChange() {
    this.volChange.emit(Math.min(1, Math.max(0, this.provisionalValue)));
  }
}
