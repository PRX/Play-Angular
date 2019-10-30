import { AdzerkRequest } from '../adzerk';
import { CancelledError, DovetailFetchError, HttpRequestError, NonDovetailUrlError } from './dovetail-errors';

const GET = 'GET';
const ACCEPT = 'Accept';
const MIME_TYPE = 'application/vnd.dovetail.v1+json';
const CONTENT_TYPE = 'Content-Type';
const APPLICATION_JSON = 'application/json';
export const DOVETAIL_MATCHER = /\/dovetail(.+)?\.prxu\.org\//;

export interface DovetailResponseEntry {
  id: string;
  type: 'original' | 'ad' | 'sonicId' | 'billboard' | 'houseAd' | 'fallback';
  duration?: number | string;
  audioUrl?: string;
}

export interface DovetailResponse {
  program: {
    id: string;
    siteId: number;
    networkId: number;
  };
  arrangement: DovetailResponseEntry[];
  request: AdzerkRequest;
  tracker: string;
}

export class DovetailFetcher {
  private activePromise: Promise<DovetailResponse>;
  private currentRequest: XMLHttpRequest;
  private currentUrl: string;
  private toResolve: (value?: DovetailResponse | PromiseLike<DovetailResponse>) => void;
  private toReject: (reason?: DovetailFetchError) => any;

  public transform(url: string): string {
    let match = url.match(DOVETAIL_MATCHER);
    if (match) {
      return 'https:/' + match[0] + url.split(match[0])[1];
    } else {
      return null;
    }
  }

  public fetch(url: string) {
    if (this.currentUrl !== url) {
      this.cancel();
      this.currentUrl = url;

      this.activePromise = new Promise<DovetailResponse>((resolve, reject) => {
        this.toResolve = resolve;
        this.toReject = reject;

        let request = this.currentRequest = new XMLHttpRequest();
        request.onreadystatechange = this.onReadyStateChange.bind(this, request);
        request.onerror = this.onError.bind(this, request);

        let directUrl = this.transform(url);
        if (directUrl) {
          this.currentRequest.open(GET, directUrl, true);
          this.currentRequest.setRequestHeader(ACCEPT, MIME_TYPE);
          this.currentRequest.send();
        } else {
          reject(new Error(`Tried to fetch non-dovetail URL: ${url}`));
        }
      });
    }

    return this.activePromise;
  }

  public cancel() {
    if (this.currentRequest) { this.currentRequest.abort(); }
    if (this.toReject) { this.toReject(new CancelledError); }
  }

  private onReadyStateChange(request: XMLHttpRequest) {
    if (request === this.currentRequest && request.readyState >= 2) {
      if (request.getResponseHeader(CONTENT_TYPE) === APPLICATION_JSON) {
        if (request.readyState >= 4) {
          let response =  JSON.parse(request.responseText) as DovetailResponse;
          this.toResolve(response);
        }
      } else {
        request.abort();
        this.toReject(new NonDovetailUrlError(this.currentUrl));
      }
    }
  }

  private onError(request: XMLHttpRequest) {
    if (request === this.currentRequest) {
      this.toReject(new HttpRequestError(request.statusText, this.currentUrl));
    }
  }
}
