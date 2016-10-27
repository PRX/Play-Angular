import { AdzerkRequest } from './adzerk';
import { DovetailArrangementEntry } from './dovetail_arrangement';
import {
  CancelledError,
  DovetailFetchError,
  HttpRequestError,
  NonDovetailUrlError
} from './dovetail_errors';

const GET = 'GET';
const ACCEPT = 'Accept';
const MIME_TYPE = 'application/vnd.dovetail.v1+json';
const CONTENT_TYPE = 'Content-Type';
const APPLICATION_JSON = 'application/json';

export interface DovetailResponse {
  program: {
    id: string;
    siteId: number;
    networkId: number;
  };
  arrangement: DovetailArrangementEntry[];
  request: AdzerkRequest;
}

export class DovetailFetcher {
  private activePromise: Promise<DovetailResponse>;
  private currentRequest: XMLHttpRequest;
  private currentUrl: string;
  private toResolve: (value?: DovetailResponse | PromiseLike<DovetailResponse>) => void;
  private toReject: (reason?: DovetailFetchError) => any;

  public fetch(url: string) {
    url = url.replace('www.podtrac.com/pts/redirect.mp3/', '');
    if (this.currentUrl !== url) {
      this.cancel();
      this.currentUrl = url;

      this.activePromise = new Promise<DovetailResponse>((resolve, reject) => {
        this.toResolve = resolve;
        this.toReject = reject;

        let request = this.currentRequest = new XMLHttpRequest();
        request.onreadystatechange = this.onReadyStateChange.bind(this, request);
        request.onerror = this.onError.bind(this, request);

        this.currentRequest.open(GET, url, true);
        this.currentRequest.setRequestHeader(ACCEPT, MIME_TYPE);
        this.currentRequest.send();
      });
    }

    return this.activePromise;
  }

  public cancel() {
    if (this.currentRequest) { this.currentRequest.abort(); }
    if (this.toReject) { this.toReject(new CancelledError); }
  }

  private onReadyStateChange(request: XMLHttpRequest) {
    if (request == this.currentRequest && request.readyState >= 2) {
      if (request.getResponseHeader(CONTENT_TYPE) == APPLICATION_JSON) {
        if (request.readyState >= 4) {
          let response =  JSON.parse(request.responseText) as DovetailResponse;
          for (let entry of response.arrangement) {
            if (!entry.type) {
              entry.type = 'ad';
            }
            if (typeof entry.duration == 'string') {
              entry.duration = parseFloat('' + entry.duration);
            }
          }
          this.toResolve(response);
        }
      } else {
        request.abort();
        this.toReject(new NonDovetailUrlError(this.currentUrl));
      }
    }
  }

  private onError(request: XMLHttpRequest) {
    if (request == this.currentRequest) {
      this.toReject(new HttpRequestError(request.statusText, this.currentUrl));
    }
  }
}
