import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import {
  EMBED_FEED_URL_PARAM,
  EMBED_EPISODE_GUID_PARAM,
  EMBED_SHOW_PLAYLIST_PARAM
} from './../embed.constants';
import { AdapterProperties, DataAdapter } from './adapter.properties';
import { sha1 }  from './sha1';

const GUID_PREFIX = 's1!';

@Injectable()
export class FeedAdapter implements DataAdapter {

  static logError(msg: string | Error) {
    console.error(`${msg}`);
  }

  constructor(private http: Http) {}

  getProperties(params): Observable<AdapterProperties> {
    let feedUrl = params[EMBED_FEED_URL_PARAM];
    let episodeGuid = params[EMBED_EPISODE_GUID_PARAM];
    let numEpisodes;
    if (typeof params[EMBED_SHOW_PLAYLIST_PARAM] !== 'undefined') {
      numEpisodes = params[EMBED_SHOW_PLAYLIST_PARAM] || 10;
    }
    if (feedUrl) {
      return this.processFeed(feedUrl, episodeGuid, numEpisodes);
    } else {
      return Observable.of({});
    }
  }

  processFeed(feedUrl: string, episodeGuid?: string, numEpisodes?: number): Observable<AdapterProperties> {
    return this.fetchFeed(feedUrl).map(body => {
      let props = this.parseFeed(body, episodeGuid, numEpisodes);
      Object.keys(props).filter(k => props[k] === undefined).forEach(key => delete props[key]);
      return props;
    }).catch(err => {
      FeedAdapter.logError(err);
      return Observable.of({}); // TODO: really ignore errors?
    });
  }

  fetchFeed(feedUrl: string): Observable<string> {
    let proxied = this.proxyUrl(feedUrl);
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

  parseFeed(xml: string, episodeGuid?: string, numEpisodes?: number): AdapterProperties {
    let parser = new DOMParser();
    let doc = <XMLDocument> parser.parseFromString(xml, 'application/xml');
    let props = this.processDoc(doc);

    if (numEpisodes) {
      let episodes = this.parseFeedEpisodes(doc, numEpisodes);
      props.episodes = episodes;
    }
    let episode = this.parseFeedEpisode(doc, episodeGuid);
    if (episode) {
      props = this.processEpisode(episode, props);
    } else {
      FeedAdapter.logError(`Could not find item with guid ${episodeGuid}`);
    }

    return props;
  }

  parseFeedEpisode(doc: XMLDocument, episodeGuid?: string): Element {
    let items = doc.querySelectorAll('item');

    if (typeof episodeGuid !== 'undefined') {
      for (let i = 0; i < items.length; i++) {
        let itemGuid = this.getTagText(items[i], 'guid');
        if (itemGuid) {
          if (!this.isEncoded(itemGuid) && this.isEncoded(episodeGuid)) {
            itemGuid = this.encodeGuid(itemGuid);
          }
          if (itemGuid.indexOf(episodeGuid) !== -1) {
            return items[i];
          }
        }
      }
    } else if (items.length > 0) {
      return items[0];
    }
  }

  parseFeedEpisodes(doc: XMLDocument, numEpisodes: number): AdapterProperties[] {
    let episodes = Array.from(doc.querySelectorAll('item'));
    return episodes.slice(0, numEpisodes).map((item, index ) => {
      let props = this.processEpisode(item);
      props.index = index;
      return props;
    });
  }

  processDoc(doc: XMLDocument, props: AdapterProperties = {}): AdapterProperties {
    props.subtitle = this.getTagText(doc, 'title');
    props.subscribeUrl = this.getTagAttributeNS(doc, 'atom', 'link', 'href'); // TODO: what if this isn't the first link?
    props.feedArtworkUrl = this.getTagAttributeNS(doc, 'itunes', 'image', 'href');
    return props;
  }

  processEpisode(item: Element, props: AdapterProperties = {}): AdapterProperties {
    props.title = this.getTagText(item, 'title');
    props.audioUrl = this.getTagTextNS(item, 'feedburner', 'origEnclosureLink')
                  || this.getTagAttribute(item, 'enclosure', 'url');
    props.artworkUrl = this.getTagAttributeNS(item, 'itunes', 'image', 'href');
    let duration = this.getTagTextNS(item, 'itunes', 'duration');
    props.duration = this.durationInSec(duration);
    return props;
  }

  proxyUrl(feedUrl: string): string {
    if (window['ENV'] && window['ENV']['FEED_PROXY_URL']) {
      return window['ENV']['FEED_PROXY_URL'] + feedUrl;
    } else {
      return `/proxy?url=${feedUrl}`;
    }
  }

  protected isEncoded(guid): boolean {
    return (guid.indexOf(GUID_PREFIX) === 0);
  }

  protected encodeGuid(guid): string {
    return `${GUID_PREFIX}${sha1.hash(guid)};`;
  }

  protected getTagText(el: Element | XMLDocument, tag: string): string {
    let found = el.getElementsByTagName(tag);
    if (found.length) {
      return found[0].textContent;
    }
  }

  protected getTagTextNS(el: Element | XMLDocument, ns: string, tag: string): string {
    let namespace = el.lookupNamespaceURI(ns);
    let found = el.getElementsByTagNameNS(namespace, tag);
    if (found.length) {
      return found[0].textContent;
    }
  }

  protected getTagAttribute(el: Element | XMLDocument, tag: string, attr: string): string {
    let found = el.getElementsByTagName(tag);
    if (found.length) {
      return found[0].getAttribute(attr);
    }
  }

  protected getTagAttributeNS(el: Element | XMLDocument, ns: string, tag: string, attr: string): string {
    let namespace = el.lookupNamespaceURI(ns);
    let found = el.getElementsByTagNameNS(namespace, tag);
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
