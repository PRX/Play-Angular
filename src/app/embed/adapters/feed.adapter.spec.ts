import { testService, injectHttp } from '../../../testing';
import { FeedAdapter } from './feed.adapter';
import { EMBED_FEED_URL_PARAM, EMBED_EPISODE_GUID_PARAM, EMBED_SHOW_PLAYLIST_PARAM } from '../embed.constants';

describe('FeedAdapter', () => {

  testService(FeedAdapter);

  beforeEach(() => {
    FeedAdapter['logError'] = jest.fn();
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
        <atom:link rel="me" href="https://podcasts.apple.com/us/podcast/the-adventure-zone/id947899573"/>
        <atom:link rel="me"
          href="https://podcasts.google.com/?feed=aHR0cDovL2ZlZWRzLjk5cGVyY2VudGludmlzaWJsZS5vcmcvOTlwZXJjZW50aW52aXNpYmxl" />
        <item>
          <guid isPermaLink="false">guid-1</guid>
          <title>Title #1</title>
          <itunes:image href="http://item1/image.png"/>
          <itunes:duration>1:00</itunes:duration>
          <enclosure url="http://item1/enclosure.mp3"/>
          <feedburner:origEnclosureLink>http://item1/original.mp3</feedburner:origEnclosureLink>
        </item>
        <item>
          <guid isPermaLink="false">guid-23</guid>
          <itunes:duration>34:03:05</itunes:duration>
          <title>Title #23</title>
          <enclosure url="http://item23/enclosure.mp3"/>
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

  const TEST_FEED_MULTIPLE_SELF_LINKS = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
      <channel>
        <title>The Channel Title</title>
        <itunes:image href="http://channel/image.png"/>
        <atom:link rel="self" href="http://atom/self/link/html"/>
        <atom:link rel="self" type="application/rss+xml" href="http://atom/self/link/xml"/>
        <item>
          <guid isPermaLink="false">guid-1</guid>
          <title>Title #1</title>
          <itunes:image href="http://item1/image.png"/>
          <itunes:duration>1:00</itunes:duration>
          <enclosure url="http://item1/enclosure.mp3"/>
        </item>
      </channel>
    </rss>
  `;

  const TEST_FEED_NO_SELF_LINKS = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
      <channel>
        <title>The Channel Title</title>
        <itunes:image href="http://channel/image.png"/>
        <item>
          <guid isPermaLink="false">guid-1</guid>
          <title>Title #1</title>
          <itunes:image href="http://item1/image.png"/>
          <itunes:duration>1:00</itunes:duration>
          <enclosure url="http://item1/enclosure.mp3"/>
        </item>
      </channel>
    </rss>
  `;

  // helper to sync-get properties
  const getProperties = (feed, feedUrl?, guid?, numEps?): any => {
    const props = {};
    const params = {
      [EMBED_FEED_URL_PARAM]: feedUrl,
      [EMBED_EPISODE_GUID_PARAM]: guid,
      [EMBED_SHOW_PLAYLIST_PARAM]: numEps
    };
    feed.getProperties(params).subscribe(result => Object.assign(props, result));
    return props;
  };

  it('only runs when feedUrl is set', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    expect(getProperties(feed)).toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml')).not.toEqual({});
    expect(getProperties(feed, undefined, '1234')).toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml', '1234')).not.toEqual({});
    expect(getProperties(feed, 'http://some.where/feed.xml', '1234', 2)).not.toEqual({});
  }));

  it('parses feeds', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-1', 2);
    expect(props.audioUrl).toEqual('http://item1/original.mp3');
    expect(props.title).toEqual('Title #1');
    expect(props.subtitle).toEqual('The Channel Title');
    expect(props.subscribeUrl).toEqual('http://atom/self/link');
    expect(props.subscribeTarget).toBeUndefined();
    expect(props.artworkUrl).toEqual('http://item1/image.png');
    expect(props.feedArtworkUrl).toEqual('http://channel/image.png');
    expect(props.episodes.length).toEqual(2);
  }));

  it ('parses app links', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    const props = getProperties(feed, 'https://example.com/feed.xml');
    expect(props.appLinks).toBeDefined();
    expect(props.appLinks.apple).toEqual('https://podcasts.apple.com/us/podcast/the-adventure-zone/id947899573');
    expect(props.appLinks.google)
      .toEqual('https://podcasts.google.com/?feed=aHR0cDovL2ZlZWRzLjk5cGVyY2VudGludmlzaWJsZS5vcmcvOTlwZXJjZW50aW52aXNpYmxl');
    expect(props.appLinks.rss).toEqual('http://atom/self/link');
  }));

  describe('atom self link parsing', () => {
    it ('works when multiple self links are included', injectHttp((feed: FeedAdapter, mocker) => {
      mocker(TEST_FEED_MULTIPLE_SELF_LINKS);
      const props = getProperties(feed, 'https://example.com/feed.xml');
      expect(props.appLinks.rss).toEqual('http://atom/self/link/xml');
    }));

    it ('falls back to the requested URL when no self links are included', injectHttp((feed: FeedAdapter, mocker) => {
      mocker(TEST_FEED_NO_SELF_LINKS);
      const props = getProperties(feed, 'https://example.com/feed.xml');
      expect(props.appLinks.rss).toEqual('https://example.com/feed.xml');
    }));
  });

  it('does not fallback to channel artwork at this level', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-2');
    expect(props.artworkUrl).toBeUndefined();
    expect(props.feedArtworkUrl).toEqual('http://channel/image.png');
  }));

  it('falls back to the enclosure for audioUrl', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-2');
    expect(props.audioUrl).toEqual('http://item2/enclosure.mp3');
  }));

  it('can not find a guid', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-not-found');
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
    expect(getProperties(feed, 'whatev').title).toEqual('Title #1');
  }));

  it('looks for a fully matched guid', injectHttp((feed: FeedAdapter, mocker) => {
    mocker(TEST_FEED);
    const props = getProperties(feed, 'http://some.where/feed.xml', 'guid-2', 3);
    expect(props.episodes[2].title).toEqual('Title #2');
  }));

});
