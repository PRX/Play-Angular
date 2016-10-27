import { DovetailAudio } from './dovetail_audio';

export class DovetailAudioEvent {
  static build(eventName: string, audio: DovetailAudio, extras?: {}) {
    let event = new Event(eventName);
    Object.defineProperty(event, 'target', {
      value: audio,
      writable: false
    });
    Object.defineProperty(event, 'currentTarget', {
      value: audio,
      writable: false
    });
    if (extras) {
      for (let property in extras) {
        if (extras.hasOwnProperty(property)) {
          try {
            event[property] = extras[property];
          } catch (e) {/* Noop */}
        }
      }
    }
    return event;
  }
}
