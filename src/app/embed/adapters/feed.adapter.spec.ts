import { testService, injectHttp } from '../../../testing';
import { FeedAdapter } from './feed.adapter';
import { EMBED_FEED_URL_PARAM, EMBED_EPISODE_GUID_PARAM } from '../embed.constants';

describe('FeedAdapter', () => {

  testService(FeedAdapter);

  beforeEach(() => {
    spyOn(FeedAdapter, 'logError').and.stub();
  });

  const TEST_FEED = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"
         xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
         xmlns:feedburner="http://rssnamespace.org/feedburner/ext/1.0">
      <channel>
        <title>The Channel Title</title>
        <itunes:image href="http://channel/image.png"/>
        <atom10:link xmlns:atom10="http://www.w3.org/2005/Atom" rel="self" href="http://atom/self/link"/>
        <atom10:link xmlns:atom10="http://www.w3.org/2005/Atom" rel="hub" href="http://pubsubhubbub.appspot.com/"/>
        <item>
          <guid isPermaLink="false">guid-1</guid>
          <title>Title #1</title>
          <itunes:image href="http://item1/image.png"/>
          <itunes:duration>1:00</itunes:duration>
          <enclosure url="http://item1/enclosure.mp3"/>
          <feedburner:origEnclosureLink>http://item1/original.mp3</feedburner:origEnclosureLink>
        </item>
        <item>
          <guid isPermaLink="false">guid-2</guid>
          <itunes:duration>38:00:12</itunes:duration>
          <title>Title #2</title>
          <enclosure url="http://item2/enclosure.mp3"/>
        </item>
      </channel>
    </rss>
  `;

  // helper to sync-get properties
  const getProperties = (feed, feedUrl = null, guid = null): any => {
    let params = {}, props = {};
    if (feedUrl) { params[EMBED_FEED_URL_PARAM] = feedUrl; }
    if (guid) { params[EMBED_EPISODE_GUID_PARAM] = guid; }
    feed.getProperties(params).subscribe(result => {
      Object.keys(result).forEach(k => props[k] = result[k]);
    });
    return props;
  };

  it('only runs when feedUrl is set', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    expect(getProperties(feed, null, null)).toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml', null)).not.toEqual({});
    expect(getProperties(feed, null, '1234')).toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml', '1234')).not.toEqual({});
  }));

  it('parses feeds', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    let props = getProperties(feed, 'http://some.where/feed.xml', 'guid-1');
    expect(props.audioUrl).toEqual('http://item1/original.mp3');
    expect(props.title).toEqual('Title #1');
    expect(props.subtitle).toEqual('The Channel Title');
    expect(props.subscribeUrl).toEqual('http://atom/self/link');
    expect(props.subscribeTarget).toBeUndefined();
    expect(props.artworkUrl).toEqual('http://item1/image.png');
    expect(props.feedArtworkUrl).toEqual('http://channel/image.png');
  }));

  it('does not fallback to channel artwork at this level', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    let props = getProperties(feed, 'http://some.where/feed.xml', 'guid-2');
    expect(props.artworkUrl).toBeUndefined();
    expect(props.feedArtworkUrl).toEqual('http://channel/image.png');
  }));

  it('falls back to the enclosure for audioUrl', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    let props = getProperties(feed, 'http://some.where/feed.xml', 'guid-2');
    expect(props.audioUrl).toEqual('http://item2/enclosure.mp3');
  }));

  it('can not find a guid', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    let props = getProperties(feed, 'http://some.where/feed.xml', 'guid-not-found');
    expect(props.audioUrl).toBeUndefined();
    expect(props.title).toBeUndefined();
    expect(props.subtitle).toEqual('The Channel Title');
    expect(props.subscribeUrl).toEqual('http://atom/self/link');
    expect(props.subscribeTarget).toBeUndefined();
    expect(props.artworkUrl).toBeUndefined();
    expect(props.feedArtworkUrl).toEqual('http://channel/image.png');
  }));

  it('can not find anything at all', injectHttp((feed: FeedAdapter, mocker) => {
    mocker('');
    expect(getProperties(feed, 'whatev', 'guid')).toEqual({});
  }));

  it('handles parser errors', injectHttp((feed: FeedAdapter, mocker) => {
    mocker('{"some":"json"}');
    expect(getProperties(feed, 'whatev', 'guid')).toEqual({});
  }));

  it('handles http errors', injectHttp((feed: FeedAdapter, mocker) => {
    mocker('', 500);
    expect(getProperties(feed, 'whatev', 'guid')).toEqual({});
  }));

  it('configures a proxy url', injectHttp((feed: FeedAdapter, mocker) => {
    expect(feed.proxyUrl('http://some.where/out/there')).toEqual('/proxy?url=http://some.where/out/there');
    window['ENV'] = {FEED_PROXY_URL: 'http://google.com/'};
    expect(feed.proxyUrl('http://some.where/out/there')).toEqual('http://google.com/http://some.where/out/there');
  }));

  it('defaults to the first item', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    expect(getProperties(feed, 'whatev').title).toEqual("Title #1");
  }));

});
