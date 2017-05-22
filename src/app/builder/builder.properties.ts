import { EMBED_FEED_URL_PARAM, EMBED_EPISODE_GUID_PARAM,
  EMBED_TITLE_PARAM, EMBED_SUBTITLE_PARAM, EMBED_CTA_TITLE_PARAM,
  EMBED_AUDIO_URL_PARAM, EMBED_IMAGE_URL_PARAM,
  EMBED_CTA_URL_PARAM, EMBED_SUBSCRIBE_URL_PARAM, EMBED_SUBSCRIBE_TARGET,
  EMBED_SHOW_PLAYLIST_PARAM } from '../embed';

export class BuilderProperties {

  static decode(params: any): BuilderProperties {
    return new BuilderProperties(
      params[EMBED_FEED_URL_PARAM],
      params[EMBED_EPISODE_GUID_PARAM],
      params[EMBED_TITLE_PARAM],
      params[EMBED_SUBTITLE_PARAM],
      params[EMBED_CTA_TITLE_PARAM],
      params[EMBED_AUDIO_URL_PARAM],
      params[EMBED_IMAGE_URL_PARAM],
      params[EMBED_CTA_URL_PARAM],
      params[EMBED_SUBSCRIBE_URL_PARAM],
      params[EMBED_SUBSCRIBE_TARGET],
      params[EMBED_SHOW_PLAYLIST_PARAM]
    );
  }

  static hasParams(params: any): boolean {
    return params[EMBED_TITLE_PARAM] !== undefined;
  }

  constructor(
    public feedUrl?: string,
    public episodeGuid?: string,
    // overrides
    public title?: string,
    public subtitle?: string,
    public ctaTitle?: string,
    public audioUrl?: string,
    public imageUrl?: string,
    public ctaUrl?: string,
    public subscribeUrl?: string,
    public subscribeTarget?: string,
    public playlistLength?: number
  ) {}

  get allParams () {
    return {
      feedUrl: EMBED_FEED_URL_PARAM,
      episodeGuid: EMBED_EPISODE_GUID_PARAM,
      title: EMBED_TITLE_PARAM,
      subtitle: EMBED_SUBTITLE_PARAM,
      ctaTitle: EMBED_CTA_TITLE_PARAM,
      audioUrl: EMBED_AUDIO_URL_PARAM,
      imageUrl: EMBED_IMAGE_URL_PARAM,
      ctaUrl: EMBED_CTA_URL_PARAM,
      subscribeUrl: EMBED_SUBSCRIBE_URL_PARAM,
      subscribeTarget: EMBED_SUBSCRIBE_TARGET,
      playlistLength: EMBED_SHOW_PLAYLIST_PARAM
    };
  }

  get paramString() {
    let str: string[] = [];
    for (let param in this.allParams) {
      if (this[param]) {
        str.push(`${this.allParams[param]}=${this.encode(this[param])}`);
      }
    }
    return str.join('&');
  }

  get embeddableUrl() {
    return `${window.location.origin}/e?${this.paramString}`;
  }

  iframeHtml(width: string, height: string) {
    const url = this.embeddableUrl;
    return `<iframe frameborder="0" height="${height}" width="${width}" src="${url}"></iframe>`;
  }

  get squareIframeHtml() {
    return this.iframeHtml('500', '500');
  }

  get horizontalIframeHtml() {
    return this.iframeHtml('100%', '200');
  }

  private encode(str: string) {
    return encodeURIComponent(str)
      .replace(/[!'()*]/g, (c) => (`%${c.charCodeAt(0).toString(16)}`));
  }

}
