import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter,
  HostListener, Input, Output } from '@angular/core';

import { Range } from '../range';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'play-progress',
  styleUrls: ['progress.component.css'],
  /* tslint:disable:no-access-missing-member */
  template: `
    <div class="bar" [class.disabled]="isDisabled" [style.width.%]="progress * 100.0"></div>
    <div class="highlight" *ngIf="isHover && !isDragging && !isDisabled"
      [style.width.%]="provisionalProgress * 100.0"></div>
    <div class="scrub-detector" *ngIf="isDragging"></div>
  `
  /* tslint:enable:no-access-missing-member */
})

export class ProgressComponent extends Range {
  @Input() disabled = false;

  @Output() seek = new EventEmitter<number>();

  constructor(protected el: ElementRef) {
    super(el);
  }

  get isDisabled() {
    return this.disabled;
  }

  get provisionalProgress() {
    return this.provisionalValue / this.range;
  }

  sendUpdate() {
    super.sendUpdate()
    this.sendSeek()
  }

  private sendSeek() {
    this.seek.emit(this.provisionalValue);
  }
}
