import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import { EMBED_FEED_ID_PARAM, EMBED_EPISODE_GUID_PARAM } from './../embed.constants';
import { AdapterProperties } from './adapter.properties';
import { FeedAdapter } from './feed.adapter';

@Injectable()
export class DraperAdapter extends FeedAdapter {

  constructor(http: Http) {
    super(http);
  }

  getProperties(params): Observable<AdapterProperties> {
    let feedId = params[EMBED_FEED_ID_PARAM];
    let episodeGuid = params[EMBED_EPISODE_GUID_PARAM];
    if (feedId) {
      return this.processFeed(feedId, episodeGuid);
    } else {
      return Observable.of({});
    }
  }

  processFeed(feedUrl: string, episodeGuid?: string, numEpisodes?: number | string, baseProperties?: AdapterProperties): Observable<AdapterProperties> {
    return super.processFeed(feedUrl, episodeGuid, numEpisodes, baseProperties).map(props => {
      if (Object.keys(props).length) {
        props.subscribeTarget = '_top';
      }
      if (episodeGuid && props.subscribeUrl.indexOf('/ep/') === -1) {
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

  processDoc(doc: XMLDocument, props: AdapterProperties = {}): AdapterProperties {
    props = super.processDoc(doc, props);
    props.feedArtworkUrl = this.getTagAttributeNS(doc, 'rp', 'image', 'href')
                        || props.feedArtworkUrl;
    props.programId = this.getTagTextNS(doc, 'rp', 'slug');
    props.subscribeUrl = `https://play.radiopublic.com/${props.programId}`;
    props.programLink = props.subscribeUrl;
    return props;
  }

  processEpisode(item: Element, props: AdapterProperties = {}): AdapterProperties {
    props = super.processEpisode(item, props);
    props.artworkUrl = this.getTagAttributeNS(item, 'rp', 'image', 'href')
                    || props.artworkUrl;
    props.episodeLink = `${props.programLink}/ep/${this.encodeGuid(this.getTagText(item, 'guid'))}`;
    return props;
  }

  proxyUrl(feedId: string): string {
    if (/^http/i.test(feedId)) {
      return `https://draper.radiopublic.com/transform?url=${feedId}`;
    }
    return `https://draper.radiopublic.com/transform?program_id=${feedId}`;
  }

}
