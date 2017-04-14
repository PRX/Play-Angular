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
      this.previewIframeSrc = this._previewIframeSrc;
    });
  }

  get _previewIframeSrc() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`/e?${this.props.paramString}`);
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
      this.router.navigate(['/'], { queryParams: { uf: value } });
    }
  }

  onInvalidFeedNavigate(error: InvalidFeedError) {
    this.feedError = true;
  }

  onEpisodeSelect(episode: Episode) {
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
      '_blank'
    );
    this.defaults = {
      title: episode.title,
      subtitle: episode.artist,
      audioUrl: episode.url,
      imageUrl: episode.imageUrl,
      subscribeUrl: this.feedUrl
    };
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
