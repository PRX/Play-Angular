import { Observable } from 'rxjs/Observable';

export const PropNames = [
  'audioUrl',
  'title',
  'subtitle',
  'subscribeUrl',
  'subscribeTarget',
  'artworkUrl',
  'feedArtworkUrl',
  'episodes',
  'episodeLink',
  'programLink',
  'programId',
  'pointerFeedName',
  'pointerFeedUrl'
];

export interface AdapterProperties {
  audioUrl?: string;
  duration?: number;
  title?: string;
  subtitle?: string;
  subscribeUrl?: string;
  subscribeTarget?: string;
  artworkUrl?: string;
  feedArtworkUrl?: string;
  episodes?: Array<AdapterProperties>;
  index?: number;
  episodeLink?: string;
  programLink?: string;
  programId?: string;
  pointerFeedName?: string;
  pointerFeedUrl?: string;
}

export interface DataAdapter {
  getProperties: (params: Object) => Observable<AdapterProperties>;
}
