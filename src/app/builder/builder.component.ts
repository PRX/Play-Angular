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
  feedError = false;

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

  resetPreviewIframe() {
    this.previewIframeSrc = this._previewIframeSrc;
  }

  setEmptyDefaults() {
    this.defaults = {
      title:   '',
      subtitle: '',
      audioUrl: '',
      imageUrl: '',
      subscribeUrl: ''
    };
  }

  onFeedUrlSubmit(value: string) {
    if (value) {
      this.feedError = false;
      this.router.navigate(['/'], { queryParams: { uf: value } });
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
      '', // image
      '', // CTA url
      '', // subscriptionURL
      '_blank', // subscribe target
      playlistEps // number of eps in playlist
    );
    this.defaults = {
      title: episode.title,
      subtitle: episode.artist,
      audioUrl: episode.url,
      imageUrl: episode.imageUrl,
      subscribeUrl: this.feedUrl
    };
    this.resetPreviewIframe();
  }

  resetCopyButton(el: Element) {
    el.innerHTML = 'Copy';
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
