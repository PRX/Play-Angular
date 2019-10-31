import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { EMBED_FEED_ID_PARAM, EMBED_EPISODE_GUID_PARAM } from './../embed.constants';
import { AdapterProperties, AppLinks } from './adapter.properties';
import { FeedAdapter } from './feed.adapter';

const RADIOPUBLIC_NAMESPACE = 'https://www.w3id.org/rp/v1';

@Injectable()
export class DraperAdapter extends FeedAdapter {

  constructor(http: Http) {
    super(http);
  }

  getProperties(params): Observable<AdapterProperties> {
    const feedId = params[EMBED_FEED_ID_PARAM];
    const episodeGuid = params[EMBED_EPISODE_GUID_PARAM];
    if (feedId) {
      return this.processFeed(feedId, episodeGuid);
    } else {
      return Observable.of({});
    }
  }

  processFeed(feedUrl: string, episodeGuid?: string): Observable<AdapterProperties> {
    return super.processFeed(feedUrl, episodeGuid).map(props => {
      if (Object.keys(props).length) {
        props.subscribeTarget = '_top';
      }
      if (episodeGuid) {
        if (!this.isEncoded(episodeGuid)) {
          episodeGuid = this.encodeGuid(episodeGuid);
        }
        if (props.subscribeUrl && !/\/ep\//.test(props.subscribeUrl)) {
          props.subscribeUrl = `${props.subscribeUrl}/ep/${episodeGuid}`;
        }
      }
      return props;
    });
  }

  protected getAppLinks(doc: XMLDocument, requestedUrl?: string): AppLinks {
    const appLinks = super.getAppLinks(doc) || {};
    if (!appLinks.radiopublic) {
      appLinks.radiopublic = `https://radiopublic.com/${this.getTagTextNS(doc, RADIOPUBLIC_NAMESPACE, 'slug')}`;
    }
    return appLinks;
  }

  processDoc(doc: XMLDocument, props: AdapterProperties = {}): AdapterProperties {
    props = super.processDoc(doc, props);
    props.feedArtworkUrl = this.getTagAttributeNS(doc, RADIOPUBLIC_NAMESPACE, 'image', 'href')
                        || props.feedArtworkUrl;
    props.subscribeUrl = `https://radiopublic.com/${this.getTagTextNS(doc, RADIOPUBLIC_NAMESPACE, 'slug')}`;
    return props;
  }

  processEpisode(item: Element, props: AdapterProperties = {}): AdapterProperties {
    props = super.processEpisode(item, props);
    props.artworkUrl = this.getTagAttributeNS(item, RADIOPUBLIC_NAMESPACE, 'image', 'href')
                    || props.artworkUrl;
    props.duration = parseInt(this.getTagTextNS(item, RADIOPUBLIC_NAMESPACE, 'duration') || (props.duration || 0).toString(), 10);
    return props;
  }

  proxyUrl(feedId: string): string {
    return `https://draper.radiopublic.com/transform?program_id=${feedId}&target=radiopublic/embed`;
  }

  protected getItemGuid(el: Element | XMLDocument): string {
    // If the item has no guid, fall back to the rp:item-id added by Draper.
    return super.getItemGuid(el) || this.getTagText(el, 'rp:item-id');
  }
}
