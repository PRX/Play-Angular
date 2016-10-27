import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChange
} from '@angular/core';
import { Router } from '@angular/router';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

const FEED_URL = 'feedUrl'

export class Episode {
  constructor(
    public url: string,
    public guid: string,
    public title: string,
    public artist: string,
    public imageUrl: string
  ) {}

  paramURL(): string {
    return encodeURIComponent(this.url);
  }
}

@Component({
  selector: 'episode-picker',
  styleUrls: ['app/+builder/shared/episode-picker/episode-picker.component.css'],
  templateUrl: 'app/+builder/shared/episode-picker/episode-picker.component.html'
})
export class EpisodePickerComponent implements OnChanges, OnInit {
  @Output() select = new EventEmitter<Episode>();
  @Input() private feedUrl: string;

  private episodes: Observable<Episode[]>;
  private _episodes: Episode[];

  constructor (private http: Http) {}

  ngOnInit() {
    this.getEpisodes();
  }

  ngOnChanges(changes: { [key: string]: SimpleChange }) {
    if (changes[FEED_URL] && changes[FEED_URL].currentValue) {
      this.feedUrl = changes[FEED_URL].currentValue;
      this.getEpisodes();
    }
  }

  private selectEpisode(guid: string) {
    const episode = this._episodes.find(e => e.guid === guid);
    this.select.emit(episode);
  }

  private getEpisodes() {
    const feedUrl = decodeURIComponent(this.feedUrl);
    const proxyUrl = `/proxy?url=${feedUrl}`;
    this.episodes = this.http.get(proxyUrl).map((res: Response) => {
      let episodes: Episode[] = [];

      let xml = res.text();

      let parser = new DOMParser();
      let doc = <XMLDocument> parser.parseFromString(xml, 'application/xml');

      let img: string;

      let _img = Array.from(doc.querySelectorAll('channel > *[href]')).filter(e => e.nodeName === 'itunes:image')[0];
      if (_img) {
        img = _img.getAttribute('href');
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

        let encUrl = item.querySelector('enclosure').getAttribute('url');

        let __img = Array.from(item.querySelectorAll('*[href]')).filter(e => e.nodeName === 'itunes:image')[0];
        if (__img) {
          img = __img.getAttribute('href');
        }

        let fbOrigEncUrl = item.querySelector('origEnclosureLink');
        if (fbOrigEncUrl) {
          encUrl = fbOrigEncUrl.innerHTML;
        }

        let guid = item.querySelector('guid').innerHTML;

        episodes.push(new Episode(encUrl, guid, title, artist, img));
      }

      this._episodes = episodes;
      return episodes;
    });
  }
}
