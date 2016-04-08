import {Pipe, PipeTransform} from 'angular2/core';

@Pipe({name: 'duration'})
export class DurationPipe implements PipeTransform {
  transform(value: number, args: string[]): any {
    if (!value) { return '00:00'; }

    let hours = Math.floor(value / 3600);
    let hr = `${hours}:`;
    if (hours < 10) { hr = `0${hr}`; }
    if (hours < 1) { hr = ''; }

    let minutes = Math.floor((value - (hours * 3600)) / 60);
    let min = `${minutes}`;
    if (minutes < 10) { min = `0${min}`; }

    let seconds = value - (hours * 3600) - (minutes * 60);
    let sec = `${Math.round(seconds)}`;
    if (seconds < 10) { sec = `0${sec}`; }

    return `${hr}${min}:${sec}`
  }
}
