import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { Episode } from './episode';
import { BuilderProperties } from './builder.properties';
import { InvalidFeedError } from './builder-errors';


@Component({
  selector: 'play-builder',
  styleUrls: ['builder.component.css'],
  templateUrl: 'builder.component.html'
})

export class BuilderComponent implements OnInit {

  feedUrl: string;
  episodeGuid: string;
  defaults: {};
  props: BuilderProperties;
  previewIframeSrc: SafeResourceUrl;
  editMode = false;
  playLatest = false;
  playPlaylist = false;
  playSeason = false;
  feedError = false;
  sslError: string = null;

  @ViewChild('builderForm') builderForm;

  constructor(private route: ActivatedRoute, private router: Router, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.route.queryParams.forEach((params: any) => {
      if (params.uf) {
        this.editMode = false;
        this.props = null;
        this.feedUrl = params.uf;
        this.episodeGuid = params.ge;
      } else if (BuilderProperties.hasParams(params)) {
        this.editMode = true;
        this.props = BuilderProperties.decode(params);
        this.feedUrl = null;
        this.setEmptyDefaults();
      } else {
        this.editMode = false;
        this.props = null;
        this.feedUrl = null;
      }
    });
    this.builderForm.control.valueChanges.debounceTime(3500).forEach(() => {
      this.resetPreviewIframe();
      this.checkForSSL();
    });
  }

  get _previewIframeSrc() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`/e?${this.props.paramString}`);
  }

  togglePlayLatest() {
    this.playLatest = !this.playLatest;
    if (this.playLatest) {
      this.props.episodeGuid = '';
    }
  }

  togglePlayPlaylist() {
    this.playPlaylist = !this.playPlaylist;
    if (this.playPlaylist) {
      this.props.playlistLength = this.props.playlistLength || 10;
    } else {
      this.props.playlistLength = 0;
    }
    this.resetPreviewIframe();
  }

  togglePlaySeason() {
    this.playSeason = !this.playSeason;
    if (this.playSeason) {
      this.props.playlistSeason = this.props.playlistSeason || 1;
      this.props.playlistLength = 'all';
    } else {
      this.props.playlistSeason = null;
    }
    this.resetPreviewIframe();
  }

  resetPreviewIframe() {
    this.previewIframeSrc = this._previewIframeSrc;
  }

  setEmptyDefaults() {
    this.defaults = {
      title:   '',
      subtitle: '',
      audioUrl: '',
      feedImageUrl: '',
      epImageUrl: '',
      subscribeUrl: ''
    };
  }

  onFeedUrlSubmit(value: string) {
    this.feedError = false;
    if (value) {
      value = /^https?:\/\//i.test(value) ? value : `http://${value}`;
      if (/(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/.test(value)) {
        this.router.navigate(['/'], { queryParams: { uf: value } });
      } else {
        this.feedError = true;
      }
    }
  }

  onInvalidFeedNavigate(error: InvalidFeedError) {
    this.feedError = true;
  }

  onEpisodeSelect(episode: Episode) {
    this.playLatest = false;
    let playlistEps = this.props && this.props.playlistLength ? this.props.playlistLength : 0;
    this.props = new BuilderProperties(
      this.feedUrl,
      episode.guid,
      '', // title
      '', // subtitle
      '', // CTA title
      '', // audio url
      '', // feed image
      '', // episode image
      '', // CTA url
      '', // subscriptionURL
      '_blank', // subscribe target
      playlistEps // number of eps in playlist
    );
    this.defaults = {
      title: episode.title,
      subtitle: episode.artist,
      audioUrl: episode.url,
      feedImageUrl: episode.feedImageUrl,
      epImageUrl: episode.epImageUrl,
      subscribeUrl: this.feedUrl
    };
    this.checkForSSL();
    this.resetPreviewIframe();
  }

  resetCopyButton(el: Element) {
    el.innerHTML = 'Copy';
  }

  checkForSSL() {
    this.sslError = null;
    if (this.props || this.defaults) {
      const urlFields = {
        audioUrl: 'Audio URL',
        epImageUrl: 'Spotlight Artwork URL',
        feedImageUrl: 'Background Artwork URL'
      };
      Object.keys(urlFields).forEach(field => {
        let fieldToCheck = this.props[field] || this.defaults[field];
        if (fieldToCheck && fieldToCheck.match(/http:\/\//)) {
          this.sslError = `Play.prx.org supports SSL. In order to comply, the ${urlFields[field]} ` +
          ` should be served over HTTPS. This insecure URL may cause some unpredictable behavior.`;
          return;
        }
      });
    }
  }
  // Copies the HTML code in an input associated with the element (<button>)
  // that is passed in
  copyCode(inp: HTMLInputElement, button: Element) {
    if (inp && inp.select) {
      inp.select();
      try {
        document.execCommand('copy');
        inp.blur();
        button.innerHTML = 'Copied';
      } catch (err) {
        alert('please press Ctrl/Cmd+C to copy');
      }
    }
  }

}
