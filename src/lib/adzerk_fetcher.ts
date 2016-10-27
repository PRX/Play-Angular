import { AdzerkRequest, AdzerkResponse } from './adzerk';

const API_ENDPOINT = 'https://engine.adzerk.net/api/v2';
const POST = 'POST';
const CONTENT_TYPE = 'Content-Type';
const APPLICATION_JSON = 'application/json';

class CancelledError extends Error {}

export class AdzerkFetcher {
  private activePromise: Promise<AdzerkResponse>;
  private activeRequest: AdzerkRequest;
  private currentRequest: XMLHttpRequest;
  private toResolve: (result?: AdzerkResponse) => any;
  private toReject: (cause?: any) => void;

  public fetch(data: AdzerkRequest) {
    if (this.activeRequest !== data) {
      this.cancel();
      this.activeRequest = data;

      this.activePromise = new Promise<AdzerkResponse>((resolve, reject) => {
        this.toResolve = resolve;
        this.toReject = reject;

        let request = this.currentRequest = new XMLHttpRequest();
        request.onreadystatechange = this.onReadyStateChange.bind(this, request);
        request.onerror = this.onError.bind(this, request);

        this.currentRequest.open(POST, API_ENDPOINT, true);
        this.currentRequest.setRequestHeader(CONTENT_TYPE, APPLICATION_JSON);
        this.currentRequest.send(JSON.stringify(data));
      });
    }

    return this.activePromise;
  }

  private cancel() {
    if (this.currentRequest) { this.currentRequest.abort(); }
    if (this.toReject) { this.toReject(new CancelledError); }
  }

  private onReadyStateChange(request: XMLHttpRequest) {
    if (this.currentRequest == request) {
      if (request.readyState >= 4) {
        this.toResolve(<AdzerkResponse> JSON.parse(request.responseText));
      }
    }
  }

  private onError(request: XMLHttpRequest) {
    if (this.currentRequest == request) {
      this.toReject(new Error(request.statusText));
    }
  }
}
