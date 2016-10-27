import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'duration'})
export class DurationPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (!value) { return '00:00'; }

    value = Math.floor(value);

    let hours = Math.floor(value / 3600);
    let hh = `${hours}:`;
    if (hours < 1) { hh = ''; }

    let minutes = Math.floor((value - (hours * 3600)) / 60);
    let mm = `00${minutes}`.slice(-2);

    let seconds = value - (hours * 3600) - (minutes * 60);
    let ss = `00${Math.round(seconds)}`.slice(-2);

    return `${hh}${mm}:${ss}`;
  }
}
