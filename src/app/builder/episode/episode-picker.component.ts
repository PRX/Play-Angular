import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Episode } from './episode';
import { InvalidFeedError } from '../builder-errors';

const customProxyUri = window['ENV']['FEED_PROXY_URL'] || '/proxy?url=';

@Component({
  selector: 'play-episode-picker',
  styleUrls: ['episode-picker.component.css'],
  template: `
    <select (change)="selectEpisode(select.value)" #select>
      <option *ngIf="selectedEpisode" [value]="selectedEpisode.guid">{{selectedEpisode.title}}</option>
      <option *ngFor="let ep of episodes | async" [value]="ep.guid">{{ep.title}}</option>
    </select>
  `
})

export class EpisodePickerComponent implements OnChanges, OnInit {

  @Input() feedUrl: string;
  @Input() selectedGUID: string;
  @Output() select = new EventEmitter<Episode>();
  @Output() invalidFeed = new EventEmitter<InvalidFeedError>();

  episodes: Observable<Episode[]>;
  _episodes: Episode[];
  selectedEpisode: Episode;

  constructor (private http: Http) {}

  ngOnInit() {
    this.getEpisodes();
  }

  ngOnChanges(changes: any) {
    if (changes.feedUrl && changes.feedUrl.currentValue) {
      this.getEpisodes();
    }
  }

  selectEpisode(guid: string) {
    const episode = this._episodes.find(e => e.guid === guid);
    this.select.emit(episode);
  }

  private get proxiedFeedUri() {
    return `${customProxyUri}${this.feedUrl}`;
  }

  private getEpisodes() {
    this.episodes = this.http.get(this.proxiedFeedUri).map((res: Response) => {

      let episodes: Episode[] = [];

      let xml = res.text();

      let parser = new DOMParser();
      let doc = <XMLDocument> parser.parseFromString(xml, 'application/xml');
      if (!doc.querySelector('channel')) {
        this.invalidFeed.emit(new InvalidFeedError(this.feedUrl));
        return;
      }
      let feedImg: string;

      let _img = Array.from(doc.querySelectorAll('channel > *[href]')).filter(e => e.nodeName === 'itunes:image')[0];
      if (_img) {
        feedImg = _img.getAttribute('href');
      }

      let artist = doc.querySelector('channel > title').innerHTML;

      let elements = doc.querySelectorAll('item');

      for (let i = 0; i < elements.length; ++i) {
        let item = <Element> elements[i];

        let title = function (html: string) {
          let txt = <HTMLTextAreaElement> document.createElement('textarea');
          txt.innerHTML = html;
          return txt.value;
        }(item.querySelector('title').innerHTML);

        let encUrl = null;
        let enc = item.querySelector('enclosure');
        if (enc) {
          encUrl = enc.getAttribute('url');
        }

        let epImg = feedImg;
        let __img = Array.from(item.querySelectorAll('*[href]')).filter(e => e.nodeName === 'itunes:image')[0];
        if (__img) {
          epImg = __img.getAttribute('href');
        }

        let fbOrigEncUrl = item.querySelector('origEnclosureLink');
        if (fbOrigEncUrl) {
          encUrl = fbOrigEncUrl.textContent;
        }

        let guid = item.querySelector('guid').textContent;

        episodes.push(new Episode(encUrl, guid, title, artist, feedImg, epImg));
      }

      this._episodes = episodes;
      if (this.selectedGUID) {
        this.selectedEpisode = this._episodes.find(e => e.guid === this.selectedGUID);
        this.select.emit(this.selectedEpisode);
      } else {
        this.select.emit(this._episodes[0]);
      };
      return episodes;
    }).catch(err => {
      this.invalidFeed.emit(new InvalidFeedError(this.feedUrl));
      return [];
    });
  }

}
