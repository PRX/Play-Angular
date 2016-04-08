import {
  Component, Input, Output, EventEmitter, ElementRef,
  HostListener, ChangeDetectionStrategy
} from 'angular2/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'progress-bar',
  styleUrls: ['src/app/player/progress_bar.component.css'],
  template: `
    <bar
      [style.width.%]="progress * 100.0"></bar>
    <highlight
      *ngIf="isHover && !isScrubbing"
      [style.width.%]="provisionalProgress * 100.0"></highlight>
    <scrub-detector
      [style.display]="isScrubbing ? 'block' : 'none'"></scrub-detector>
  `
})
export default class ProgressBarComponent {
  @Input() value: number = 0;
  @Input() minimum: number = 0;
  @Input() maximum: number = 1;

  @Output() seek = new EventEmitter<number>();
  @Output() scrubbing = new EventEmitter<boolean>();

  private provisionalValue: number;
  private previousMousemoveEvent: MouseEvent;

  private isScrubbing = false;
  private isHover = false;

  constructor(private el: ElementRef) {}

  private get range() {
    return this.maximum - this.minimum;
  }

  private get progress() {
    return this.value / this.range;
  }

  private get provisionalProgress() {
    return this.provisionalValue / this.range;
  }

  @HostListener('mouseover', ['$event'])
  onMouseover(event: MouseEvent) {
    if (event.target === this.el.nativeElement) {
      this.isHover = true;
    }
  }

  @HostListener('mousedown', ['$event'])
  onMousedown(event: MouseEvent) {
    this.isScrubbing = true;
    this.scrubbing.emit(true);

    if (event.target === this.el.nativeElement) {
      const width = this.el.nativeElement.getBoundingClientRect().width;
      const ratio = event.offsetX / width;
      this.provisionalValue = this.range * ratio;
      this.sendSeek();
    }
  }

  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent) {
    if (event.target === this.el.nativeElement) {
      this.onBasicMousemove(event);
    } else if (event.target === this.el.nativeElement.querySelector('scrub-detector')) {
      this.onFancyMousemove(event);
    }

    if (this.isScrubbing) {
      this.sendSeek();
    }

    this.previousMousemoveEvent = event;
  }

  @HostListener('mouseup', ['$event'])
  onMouseup(event: MouseEvent) {
    this.isScrubbing = false;

    // During a click (ie, no mousemove) this seek ends up being
    ///a dupe of the seek from mousedown
    this.sendSeek();

    this.scrubbing.emit(false);
  }

  @HostListener('mouseout', ['$event'])
  onMouseout(event: MouseEvent) {
    if (event.target === this.el.nativeElement) {
      this.isHover = false;
    }
  }

  private onBasicMousemove(event: MouseEvent) {
    const width = this.el.nativeElement.getBoundingClientRect().width;
    const ratio = event.offsetX / width;
    this.provisionalValue = this.range * ratio;
  }

  private onVariableSpeedMousemove(event: MouseEvent) {
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

  private onFancyMousemove(event: MouseEvent) {
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

  private sendSeek() {
    this.seek.emit(this.provisionalValue);
  }
}
