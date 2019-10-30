import * as urlTemplate from 'url-template';
import { AdzerkDecision } from '../adzerk';
import { DovetailResponseEntry } from './dovetail-fetcher';

export class DovetailSegment {
  
  id: string;
  type: string;
  duration: number;
  audioUrl: string;
  unplayable = false;

  private beforeTrackers: string[] = [];
  private afterTrackers: string[] = [];
  private pixels: HTMLImageElement[] = [];

  constructor(
    entry: DovetailResponseEntry, 
    decision?: AdzerkDecision, 
    tracker?: any, 
    countDownload?: boolean
  ) {
    this.id = entry.id;
    this.type = entry.type || 'ad';
    if (entry.duration && typeof(entry.duration) === 'string') {
      this.duration = parseFloat('' + entry.duration);
    } else if (entry.duration && typeof(entry.duration) === 'number') {
      this.duration = entry.duration;
    } else {
      this.duration = 0;
    }
    this.audioUrl = entry.audioUrl;

    // optional adzerk data
    if (decision) {
      this.audioUrl = decision.contents[0].data.imageUrl;
      this.duration = 10;
      // TODO: why only ads?
      if (this.type === 'ad' || this.type === 'houseAd') {
        this.afterTrackers.push(decision.impressionUrl);
      }
      // TODO: also concat decision.contents[0].data.customData.pingbacks[]
    }

    // optional dovetail pixel tracker (for downloads and impressions)
    if (tracker) {
      const tpl = urlTemplate.parse(tracker);
      if (countDownload) {
        this.beforeTrackers.push(tpl.expand({}));
      }
      if (decision) {
        this.afterTrackers.push(tpl.expand({
          ad: decision.adId,
          campaign: decision.campaignId,
          creative: decision.creativeId,
          flight: decision.flightId,
        }));
      }
    }
  }

  static forUrl(url: string) {
    return new DovetailSegment({id: 'fallback', type: 'fallback', duration: 0, audioUrl: url});
  }

  setUnsupported() {
    this.duration = 0;
    this.unplayable = true;
  }

  trackBefore() {
    this.trackUrls(this.beforeTrackers);
    return this.beforeTrackers.length;
  }

  trackAfter() {
    this.trackUrls(this.afterTrackers);
    return this.afterTrackers.length;
  }

  private trackUrls(urls: string[]) {
    while (this.pixels.length < urls.length) {
      const el = document.createElement('img');
      el.className = 'dt-tracker';
      el.width = 1;
      el.height = 1;
      el.style.position = 'absolute';
      document.body.appendChild(el);
      this.pixels.push(el);
    }
    for (let i = 0; i < urls.length; i++) {
      this.pixels[i].src = urls[i];
    }
  }

}
