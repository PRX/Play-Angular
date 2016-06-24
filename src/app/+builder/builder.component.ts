import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  NgForm,
  FormBuilder,
  FORM_DIRECTIVES,
  Control,
  ControlGroup
} from '@angular/common';
import {
  DomSanitizationService,
  SafeResourceUrl
} from '@angular/platform-browser';
import {Router} from '@angular/router';

import {EpisodePickerComponent, Episode} from './shared/index';
import {EmbedProperties} from '../+embed/shared/index';

@Component({
  directives: [NgForm, EpisodePickerComponent, FORM_DIRECTIVES],
  selector: 'player',
  styleUrls: ['app/+builder/builder.component.css'],
  templateUrl: 'app/+builder/builder.component.html'
})
export class BuilderComponent implements OnInit, OnDestroy {
  private feedUrl: string;
  private embedProps: EmbedProperties;
  private previewIframeSrc: SafeResourceUrl;
  private propsForm: ControlGroup;
  private sub: any;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private sanitationService: DomSanitizationService
  ) {
    this.propsForm = new ControlGroup({
      title: new Control(''),
      subtitle: new Control(''),
      subscribeUrl: new Control(''),
      subscribeTarget: new Control(''),
      ctaUrl: new Control(''),
      ctaTitle: new Control(''),
      imageUrl: new Control(''),
      audioUrl: new Control('')
    });

    this.propsForm.valueChanges
      .debounceTime(3500)
      .subscribe(d => this.previewIframeSrc = this._previewIframeSrc);
  }

  ngOnInit() {
    this.sub = this.router
      .routerState
      .queryParams
      .subscribe(params => {
        const feedUrlKey = 'feedUrl';

        if (params[feedUrlKey]) {
          this.feedUrl = decodeURIComponent(params[feedUrlKey]);
        }
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  get _previewIframeSrc() {
    return this
            .sanitationService
            .bypassSecurityTrustResourceUrl(`/e?${this.embedProps.paramString}`);
  }

  onFeedUrlSubmit(url: string): void {
    let encodedUrl = encodeURIComponent(url);
    this.router.navigate(['builder'], { queryParams: { feedUrl: encodedUrl } });
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

  private onEpisodeSelect(episode: Episode) {
    this.embedProps = new EmbedProperties(
      episode.title,
      episode.artist,
      '',
      episode.url,
      episode.imageUrl,
      this.feedUrl,
      '',
      this.feedUrl,
      '_blank'
    );
  }
};
