import {
  Component, Input, Output, EventEmitter, ElementRef,
  HostListener, ChangeDetectionStrategy
} from 'angular2/core';
import {DurationPipe} from './duration.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  pipes: [DurationPipe],
  selector: 'time-indicator',
  ///styleUrls: ['src/app/player/time_indicator.component.css'],
  template: `
    <span>{{seconds | duration}}</span>
  `
})
export default class TimeIndicatorComponent {
  @Input() seconds: number = 0;
}
