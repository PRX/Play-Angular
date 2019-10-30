import { DovetailResponseEntry } from './dovetail-fetcher';
import { AdzerkDecision } from '../adzerk';
import { DovetailSegment } from './dovetail-segment';

describe('DovetailSegment', () => {

  let entry: DovetailResponseEntry, decision: AdzerkDecision, tracker: string, pixels: string[];
  beforeEach(() => {
    entry = {id: 'foo', type: 'ad', duration: 1234, audioUrl: 'http://foo/bar.mp3'};
    decision = {
      adId: 12,
      campaignId: 34,
      creativeId: 56,
      flightId: 78,
      clickUrl: 'http://some/thing',
      impressionUrl: 'http://impression/url/here',
      contents: [{body: '', data: {fileName: 'foo.mp3', imageUrl: 'http://bar/foo.mp3', width: 123}, template: '', type: ''}],
      events: []
    };
    tracker = 'http://dovetail/tracker{?ad,campaign,creative,flight}';
    const els = document.body.querySelectorAll('img.dt-tracker');
    for (let i = 0; i < els.length; i++) { document.body.removeChild(els[i]); }
    pixels = [];
  });

  const getPixels = () => {
    pixels = [];
    const els = document.body.querySelectorAll('img.dt-tracker');
    for (let i = 0; i < els.length; i++) { pixels.push(els[i].getAttribute('src')); }
    return pixels.length;
  };

  it('sets dovetail response properties', () => {
    const seg = new DovetailSegment(entry);
    expect(seg.id).toEqual('foo');
    expect(seg.type).toEqual('ad');
    expect(seg.duration).toEqual(1234);
    expect(seg.audioUrl).toEqual('http://foo/bar.mp3');
    expect(seg.unplayable).toEqual(false);
  });

  it('parses durations', () => {
    const seg1 = new DovetailSegment({id: 'foo', type: 'ad', duration: 1234});
    const seg2 = new DovetailSegment({id: 'foo', type: 'ad', duration: '1234'});
    const seg3 = new DovetailSegment({id: 'foo', type: 'ad', duration: '12.34'});
    expect(seg1.duration).toEqual(1234);
    expect(seg2.duration).toEqual(1234);
    expect(seg3.duration).toEqual(12.34);
  });

  it('sets adzerk decision properties', () => {
    const seg = new DovetailSegment(entry, decision);
    expect(seg.id).toEqual('foo');
    expect(seg.type).toEqual('ad');
    expect(seg.duration).toEqual(10);
    expect(seg.audioUrl).toEqual('http://bar/foo.mp3');
    expect(seg.unplayable).toEqual(false);
  });

  it('tracks playability', () => {
    const seg = new DovetailSegment(entry, decision);
    seg.setUnsupported();
    expect(seg.duration).toEqual(0);
    expect(seg.unplayable).toEqual(true);
  });

  it('constructs a fallback segment', () => {
    const seg = DovetailSegment.forUrl('http://some/audio.mp3');
    expect(seg.id).toEqual('fallback');
    expect(seg.type).toEqual('fallback');
    expect(seg.duration).toEqual(0);
    expect(seg.audioUrl).toEqual('http://some/audio.mp3');
    expect(seg.unplayable).toEqual(false);
  });

  it('tracks adzerk impressions', () => {
    const seg = new DovetailSegment(entry, decision);
    expect(getPixels()).toEqual(0);
    
    seg.trackBefore();
    expect(getPixels()).toEqual(0);

    seg.trackAfter();
    expect(getPixels()).toEqual(1);
    expect(pixels[0]).toEqual('http://impression/url/here');
  });

  it('tracks dovetail pixel impressions', () => {
    const seg = new DovetailSegment(entry, decision, tracker);
    expect(getPixels()).toEqual(0);
    seg.trackBefore();
    expect(getPixels()).toEqual(0);
    seg.trackAfter();
    expect(getPixels()).toEqual(2);
    expect(pixels[0]).toEqual('http://impression/url/here');
    expect(pixels[1]).toEqual('http://dovetail/tracker?ad=12&campaign=34&creative=56&flight=78');
  });

  it('optionally tracks dovetail pixels before', () => {
    const seg = new DovetailSegment(entry, decision, tracker, true);
    expect(getPixels()).toEqual(0);
    seg.trackBefore();
    expect(getPixels()).toEqual(1);
    expect(pixels[0]).toEqual('http://dovetail/tracker');
  });

  it('skips missing impressions', () => {
    const seg = new DovetailSegment(entry);
    seg.trackAfter();
    expect(getPixels()).toEqual(0);
  });

  it('tracks only a download', () => {
    const seg = new DovetailSegment(entry, null, tracker, true);
    seg.trackBefore();
    expect(getPixels()).toEqual(1);
  });

  it('skips dovetail impressions when decision is missing', () => {
    const seg = new DovetailSegment(entry, null, tracker);
    seg.trackAfter();
    expect(getPixels()).toEqual(0);
  });

});
