import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import {
  EMBED_FEED_URL_PARAM,
  EMBED_EPISODE_GUID_PARAM,
  EMBED_SHOW_PLAYLIST_PARAM,
  EMBED_PLAYLIST_SEASON_PARAM
} from './../embed.constants';
import { AdapterProperties, DataAdapter } from './adapter.properties';
import { sha1 } from './sha1';

const GUID_PREFIX = 's1!';
const CDATA = '<![CDATA[';
const ATOM_NAMESPACE = 'http://www.w3.org/2005/Atom';
const ITUNES_NAMESPACE = 'http://www.itunes.com/dtds/podcast-1.0.dtd';
const FEEDBURNER_NAMESPACE = 'http://rssnamespace.org/feedburner/ext/1.0';

@Injectable()
export class FeedAdapter implements DataAdapter {

  static logError(msg: string | Error) {
    console.error(`${msg}`);
  }

  constructor(private http: Http) {}

  getProperties(params): Observable<AdapterProperties> {
    const feedUrl = params[EMBED_FEED_URL_PARAM];
    const episodeGuid = this.removeCDATA(params[EMBED_EPISODE_GUID_PARAM]);
    let numEpisodes;
    if (typeof params[EMBED_SHOW_PLAYLIST_PARAM] !== 'undefined') {
      numEpisodes = params[EMBED_SHOW_PLAYLIST_PARAM] || 10;
    }
    const season = params[EMBED_PLAYLIST_SEASON_PARAM];
    if (feedUrl) {
      return this.processFeed(feedUrl, episodeGuid, numEpisodes, season);
    } else {
      return Observable.of({});
    }
  }

  processFeed(feedUrl: string, episodeGuid?: string, numEpisodes?: number | string, season?: number | string): Observable<AdapterProperties> {
    return this.fetchFeed(feedUrl).map(body => {
      const props = this.parseFeed(body, episodeGuid, numEpisodes, season);
      Object.keys(props).filter(k => props[k] === undefined).forEach(key => delete props[key]);
      return props;
    }).catch(err => {
      FeedAdapter.logError(err);
      return Observable.of({}); // TODO: really ignore errors?
    });
  }

  fetchFeed(feedUrl: string): Observable<string> {
    const proxied = this.proxyUrl(feedUrl);
    return this.http.get(proxied).map(res => {
      if (res.ok && res.text()) {
        return res.text();
      } else if (res.ok) {
        throw new Error(`Got empty response from ${proxied}`);
      } else {
        throw new Error(`Got ${res.status} from ${proxied}`);
      }
    });
  }

  parseFeed(xml: string, episodeGuid?: string, numEpisodes?: number | string, season?: number | string): AdapterProperties {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml') as XMLDocument;
    let props = this.processDoc(doc);

    if (numEpisodes) {
      const episodes = this.parseFeedEpisodes(doc, numEpisodes, season);
      props.episodes = episodes;
    }
    const episode = this.parseFeedEpisode(doc, episodeGuid);
    if (episode) {
      props = this.processEpisode(episode, props);
    } else {
      FeedAdapter.logError(`Could not find item with guid ${episodeGuid}`);
    }

    return props;
  }

  parseFeedEpisode(doc: XMLDocument, episodeGuid?: string): Element {
    const items = doc.querySelectorAll('item');

    if (typeof episodeGuid !== 'undefined') {
      for (const item of Array.from(items)) {
        let itemGuid = this.getItemGuid(item);
        if (itemGuid) {
          if (!this.isEncoded(itemGuid) && this.isEncoded(episodeGuid)) {
            itemGuid = this.encodeGuid(itemGuid);
          }
          if (itemGuid === episodeGuid) {
            return item;
          }
        }
      }
    } else if (items.length > 0) {
      return items[0];
    }
  }

  parseFeedEpisodes(doc: XMLDocument, numEpisodes: number | string, season: number | string): AdapterProperties[] {
    let episodes = Array.from(doc.querySelectorAll('item'));
    if (this.getTagTextNS(doc, ITUNES_NAMESPACE, 'type') === 'serial') {
      episodes = episodes.reverse();
    }
    if (season) {
      episodes = episodes.filter(el => this.getTagTextNS(el, ITUNES_NAMESPACE, 'season') === `${season}`);
    }
    if (!isNaN(+numEpisodes)) {
      episodes = episodes.slice(0, +numEpisodes);
    }
    return episodes.map((item, index) => {
      const ep = this.processEpisode(item);
      ep.index = index;
      return ep;
    });
  }

  processDoc(doc: XMLDocument, props: AdapterProperties = {}): AdapterProperties {
    props.subtitle = this.getTagText(doc, 'title');
    props.subscribeUrl = this.getTagAttributeNS(doc, ATOM_NAMESPACE, 'link', 'href'); // TODO: what if this isn't the first link?
    props.feedArtworkUrl = this.getTagAttributeNS(doc, ITUNES_NAMESPACE, 'image', 'href');

    return props;
  }

  processEpisode(item: Element, props: AdapterProperties = {}): AdapterProperties {
    props.title = this.getTagText(item, 'title');
    props.audioUrl = this.getTagTextNS(item, FEEDBURNER_NAMESPACE, 'origEnclosureLink')
                  || this.getTagAttribute(item, 'enclosure', 'url') || null;
    props.artworkUrl = this.getTagAttributeNS(item, ITUNES_NAMESPACE, 'image', 'href');
    const duration = this.getTagTextNS(item, ITUNES_NAMESPACE, 'duration');
    props.duration = duration ? this.durationInSec(duration) : 0;
    return props;
  }

  proxyUrl(feedUrl: string): string {
    if (window['ENV'] && window['ENV']['FEED_PROXY_URL']) {
      return window['ENV']['FEED_PROXY_URL'] + feedUrl;
    } else {
      return `/proxy?url=${feedUrl}`;
    }
  }

  protected hasCDATA(guid): boolean {
    return guid ? (guid.indexOf(CDATA) > -1) : false;
  }

  protected removeCDATA(guid): string {
    return this.hasCDATA(guid) ? guid.replace(CDATA, '').replace(/\]\]\>/, '') : guid;
  }

  protected isEncoded(guid): boolean {
    return (guid.indexOf(GUID_PREFIX) === 0);
  }

  protected encodeGuid(guid): string {
    return `${GUID_PREFIX}${sha1.hash(guid)}`;
  }

  protected getItemGuid(el: Element | XMLDocument): string {
    return this.getTagText(el, 'guid');
  }

  protected getTagText(el: Element | XMLDocument, tag: string): string {
    const found = el.getElementsByTagName(tag);
    if (found.length) {
      return found[0].textContent;
    }
  }


  protected getTagTextNS(el: Element | XMLDocument, namespace: string, tag: string): string {
    const found = el.getElementsByTagNameNS(namespace, tag);
    if (found.length) {
      return found[0].textContent;
    }
  }

  protected getTagAttribute(el: Element | XMLDocument, tag: string, attr: string): string {
    const found = el.getElementsByTagName(tag);
    if (found.length) {
      return found[0].getAttribute(attr);
    }
  }

  protected getTagAttributeNS(el: Element | XMLDocument, namespace: string, tag: string, attr: string): string {
    const found = el.getElementsByTagNameNS(namespace, tag);
    if (found.length) {
      return found[0].getAttribute(attr);
    }
  }

  protected durationInSec(duration: string): number {
    if (duration.match(/:/)) {
      let seconds = 0;
      duration.split(':').reverse().forEach((time, index) => {
        seconds += +time * 60 ** index;
      });
      return seconds;
    } else {
      return +duration;
    }
  }

}
