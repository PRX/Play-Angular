import { testService, injectHttp } from '../../../testing';
import { DraperAdapter } from './draper.adapter';
import { FeedAdapter } from './feed.adapter';
import { EMBED_FEED_ID_PARAM, EMBED_EPISODE_GUID_PARAM } from '../embed.constants';
import { AdapterProperties } from './adapter.properties';

describe('DraperAdapter', () => {

  testService(DraperAdapter);

  beforeEach(() => {
    FeedAdapter['logError'] = jest.fn();
  });

  const TEST_DRAPE = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"
         xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
         xmlns:feedburner="http://rssnamespace.org/feedburner/ext/1.0"
         xmlns:rp="https://www.w3id.org/rp/v1">
      <channel>
        <title>The Channel Title</title>
        <itunes:image href="http://channel/image.png"/>
        <rp:image href="http://channel/rp/image.png"/>
        <rp:program-id>foo</rp:program-id>
        <rp:slug>agreatslug</rp:slug>
        <atom10:link xmlns:atom10="http://www.w3.org/2005/Atom" rel="self" href="http://atom/self/link"/>
        <atom10:link xmlns:atom10="http://www.w3.org/2005/Atom" rel="hub" href="http://pubsubhubbub.appspot.com/"/>
        <item></item>
        <item>
          <guid isPermaLink="false">guid-1</guid>
          <title>Title #1</title>
          <itunes:image href="http://item1/image.png"/>
          <rp:image href="http://item1/rp/image.png"/>
          <enclosure url="http://item1/enclosure.mp3"/>
          <feedburner:origEnclosureLink>http://item1/original.mp3</feedburner:origEnclosureLink>
        </item>
        <item>
          <guid isPermaLink="false">guid-2</guid>
          <title>Title #2</title>
          <itunes:image href="http://item2/image.png"/>
          <enclosure url="http://item2/enclosure.mp3"/>
        </item>
        <item></item>
      </channel>
    </rss>
  `;

  // helper to sync-get properties
  const getProperties = (feed: DraperAdapter, feedId?: string, guid?: string): AdapterProperties => {
    const params = {
      [EMBED_FEED_ID_PARAM]: feedId,
      [EMBED_EPISODE_GUID_PARAM]: guid
    };
    const props = {};
    feed.getProperties(params).subscribe(result => Object.assign(props, result));
    return props;
  };

  it('only runs when feedId is set', injectHttp((feed: DraperAdapter, mocker) => {
    mocker(TEST_DRAPE);
    expect(getProperties(feed)).toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml')).not.toEqual({});
    expect(getProperties(feed, undefined, '1234')).toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml', '1234')).not.toEqual({});
  }));

  it('parses feeds', injectHttp((feed: DraperAdapter, mocker) => {
    mocker(TEST_DRAPE);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-1');
    expect(props.audioUrl).toEqual('http://item1/original.mp3');
    expect(props.title).toEqual('Title #1');
    expect(props.subtitle).toEqual('The Channel Title');
    expect(props.subscribeUrl).toEqual('https://radiopublic.com/agreatslug/ep/s1!e661165c969fa6801bb8a7711daa73544b5149e9');
    expect(props.subscribeTarget).toEqual('_top');
    expect(props.artworkUrl).toEqual('http://item1/rp/image.png');
    expect(props.feedArtworkUrl).toEqual('http://channel/rp/image.png');
  }));

  it('always includes RadioPublic in appLinks', injectHttp((feed: DraperAdapter, mocker) => {
    mocker(TEST_DRAPE);
    const props = getProperties(feed, 'http://some.where/feed.xml');
    expect(props.appLinks.radiopublic).toEqual('https://radiopublic.com/agreatslug');
  }));

  it('falls back to the itunes:image if no rp:image', injectHttp((feed: DraperAdapter, mocker) => {
    mocker(TEST_DRAPE);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-2');
    expect(props.artworkUrl).toEqual('http://item2/image.png');
  }));

  it('can not find a guid', injectHttp((feed: DraperAdapter, mocker) => {
    mocker(TEST_DRAPE);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-not-found');
    expect(props.audioUrl).toBeUndefined();
    expect(props.title).toBeUndefined();
    expect(props.subtitle).toEqual('The Channel Title');
    expect(props.subscribeUrl).toEqual('https://radiopublic.com/agreatslug/ep/s1!f0ac9c9a4b7ad98f1663f828eb6b5587dfce3434');
    expect(props.subscribeTarget).toEqual('_top');
    expect(props.artworkUrl).toBeUndefined();
    expect(props.feedArtworkUrl).toEqual('http://channel/rp/image.png');
  }));

  it('handles http errors', injectHttp((feed: DraperAdapter, mocker) => {
    mocker('', 500);
    expect(getProperties(feed, 'whatev', 'guid')).toEqual({});
  }));

});
