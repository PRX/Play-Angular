import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PlaylistComponent } from './playlist.component';
import { DurationPipe } from '../duration';

describe('PlaylistComponent', () => {

  let comp:    PlaylistComponent;
  let fixture: ComponentFixture<PlaylistComponent>;
  let de:      DebugElement;
  let el:      HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ PlaylistComponent, DurationPipe ],
    });
    fixture = TestBed.createComponent(PlaylistComponent);
    comp = fixture.componentInstance;
    de = fixture.debugElement.query(By.css('.playlist-container'));
    el = de.nativeElement;
    el.style.display = 'none';

    comp.episodes = [
      { index: 0, title: 'Foo', duration: 10 },
      { index: 1, title: 'Bar', duration: 15 },
    ];
    fixture.detectChanges();
  });

  it('shows up on the page', () => {
    expect(el.textContent).toContain('2 episodes');
  });

  it('displays episode information', () => {
    expect(de.queryAll(By.css('.entry-title')).length).toEqual(2);
    expect(el.textContent).toContain('Foo');
    expect(el.textContent).toContain('Bar');
  });

  it('shows a pause button for the playing episode', () => {
    expect(de.queryAll(By.css('.pauseButton')).length).toEqual(0);
    comp.episodeIndex = 0;
    comp.playing = true;
    fixture.detectChanges();
    expect(de.queryAll(By.css('.pauseButton')).length).toEqual(1);
  });

  it('should raise playlistItemClicked event when clicked', () => {
    let selectedEpisodeIndex: number;
    comp.playlistItemClicked.subscribe((index: number) => selectedEpisodeIndex = index);
    let firstEp = de.query(By.css('.playlist-entry'));
    firstEp.triggerEventHandler('click', null);
    expect(selectedEpisodeIndex).toBe(0);
  });

  it('can sum up episode durations', () => {
    comp.episodes = [{duration: '27'}, {duration: '31'}];
    expect(comp.totalDuration).toEqual(58);
  });

  it('can estimate durations', () => {
    // This allows for discrepancy between player-detected duration, which can
    // vary moment to moment based on what ads are served, and itunes:duration from feed.
    // TODO: store ad duration with ad in Adzerk and use that to calculate duration instead.
    expect(comp.estDuration(1643)).toEqual('27m');
    expect(comp.estDuration(3661)).toEqual('1h 1m');
    expect(comp.estDuration(4801312)).toEqual('55d 13h 41m');
  });
});
