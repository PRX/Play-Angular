import { Observable } from 'rxjs/Observable';


export const PropNames = [
  'audioUrl',
  'title',
  'subtitle',
  'subscribeUrl',
  'subscribeTarget',
  'artworkUrl',
  'feedArtworkUrl'
]

export interface AdapterProperties { 
  audioUrl?: string;
  title?: string;
  subtitle?: string;
  subscribeUrl?: string;
  subscribeTarget?: string;
  artworkUrl?: string;
  feedArtworkUrl?: string;
} 

export interface DataAdapter {
  getProperties: (params:Object) => Observable<AdapterProperties>
}

export function hasMinimumParams(props): boolean {
  return (props.audioUrl !== undefined) &&
    (props.title !== undefined) &&
    (props.subtitle !== undefined) &&
    (props.subscribeUrl !== undefined) &&
    (props.subscribeTarget !== undefined) &&
    (props.artworkUrl !== undefined)
}
export function getMergedValues(...data: AdapterProperties[]):AdapterProperties {
  const result: AdapterProperties = {};
  for (let datum of data ) {
    for (let property of PropNames) {
      if (typeof datum[property] !== 'undefined') {
        result[property] = datum[property];
      }
    }
  }
  return result;
}

