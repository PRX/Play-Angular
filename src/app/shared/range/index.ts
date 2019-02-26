import { ElementRef, EventEmitter,
  HostListener, Input, Output } from '@angular/core';

export class Range {
  @Input() value = 0;
  @Input() minimum = 0;
  @Input() maximum = 1;

  @Output() dragging = new EventEmitter<boolean>();

  provisionalValue: number;
  isDragging = false;
  isHover = false;
  didMove = false;
  isMousedown = false;
  previousMousemoveEvent: MouseEvent;

  constructor(protected el: ElementRef) {
    this.el = el;
  }

  get range() {
    return this.maximum - this.minimum;
  }

  get progress() {
    return this.value / this.range;
  }

  @HostListener('mouseover', ['$event'])
  onMouseover(event: MouseEvent) {
    if (event.target === this.el.nativeElement) {
      this.isHover = true;
    }
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent) {
    this.didMove = false;
    this.isMousedown = true;

    if (event.target === this.el.nativeElement) {
      const width = this.el.nativeElement.getBoundingClientRect().width;
      const ratio = event.offsetX / width;
      this.provisionalValue = this.range * ratio;
      this.sendUpdate();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    if (!this.didMove && this.isMousedown) {
      this.didMove = true;
      this.isDragging = true;
      this.dragging.emit(true);
    }

    if (event.target === this.el.nativeElement) {
      this.onBasicMousemove(event);
    } else if (event.target === this.el.nativeElement.querySelector('.scrub-detector')) {
      this.onFancyMousemove(event);
    }

    if (this.isDragging) {
      this.sendUpdate();
    }

    this.previousMousemoveEvent = event;
  }

  @HostListener('mouseup', ['$event'])
  onMouseup(event: MouseEvent) {
    this.isMousedown = false;

    if (this.didMove) {
      this.isDragging = false;
      this.sendUpdate();
      this.dragging.emit(false);
    }
  }

  @HostListener('mouseout', ['$event'])
  onMouseout(event: MouseEvent) {
    if (event.target === this.el.nativeElement) {
      this.isHover = false;
    }
  }

  onBasicMousemove(event: MouseEvent) {
    const width = this.el.nativeElement.getBoundingClientRect().width;
    const ratio = event.offsetX / width;
    this.provisionalValue = this.range * ratio;
  }

  onVariableSpeedMousemove(event: MouseEvent) {
    let barRect = this.el.nativeElement.getBoundingClientRect();

    const secondsPerPixel = this.range / barRect.width;

    const max = 50;
    let factor: number;

    if (event.offsetY > barRect.bottom) {
      let amt = Math.min(max, event.offsetY - barRect.bottom);
      factor = amt / max;
    } else if (event.offsetY < barRect.top) {
      let amt = Math.min(max, barRect.top - event.offsetY);
      factor = amt / max;
    } else {
      factor = 0;
    }

    let rate = 1.0 - (0.95 * factor);

    let mouseDeltaX = 0;

    if (this.previousMousemoveEvent) {
      mouseDeltaX = event.offsetX - this.previousMousemoveEvent.offsetX;
    }

    let adjMouseDeltaX = mouseDeltaX * rate;
    let deltaValue = adjMouseDeltaX * secondsPerPixel;
    this.provisionalValue = this.value + deltaValue;
  }

  onFancyMousemove(event: MouseEvent) {
    let barRect = this.el.nativeElement.getBoundingClientRect();

    let inBarX = event.offsetX >= barRect.left && event.offsetX <= barRect.right;
    let inBarY = event.offsetY >= barRect.top && event.offsetY <= barRect.bottom;
    let inBar = inBarX && inBarY;

    if (inBar) {
      const xOffsetInBar = event.offsetX - barRect.left;
      const ratio = xOffsetInBar / barRect.width;
      this.provisionalValue = this.range * ratio;
    } else {
      this.onVariableSpeedMousemove(event);
    }
  }

  sendUpdate() {
    /* Noop */
  }
}
