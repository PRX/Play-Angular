import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';

import { PlayerComponent } from './player.component';
import { ProgressComponent } from '../progress';
import { PlaylistComponent } from '../playlist';
import { DurationPipe } from '../duration';

describe('PlayerComponent', () => {

  let comp:    PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;
  let de:      DebugElement;
  let el:      HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayerComponent, DurationPipe, ProgressComponent, PlaylistComponent ],
    });
    fixture = TestBed.createComponent(PlayerComponent);
    comp = fixture.componentInstance;
    de = fixture.debugElement.query(By.css('.player-container'));
    el = de.nativeElement;
    comp.title = 'Foo';
    comp.subtitle = 'Bar';
    fixture.detectChanges();
  });

  it('shows info about the playing episode', () => {
    expect(el.textContent).toContain('Foo');
    expect(el.textContent).toContain('Bar');
  });

  it('can show a playlist', () => {
    expect(de.queryAll(By.css('play-playlist')).length).toEqual(0);
    comp.showPlaylist = true;
    comp.episodes = [{ foo: 'bar' }];
    fixture.detectChanges();
    expect(de.queryAll(By.css('play-playlist')).length).toEqual(1);
  });

  it('should raise Share event when share button clicked', () => {
    let sharing = false;
    comp.share.subscribe((newSharing: boolean) => sharing = newSharing );
    let shareButton = de.query(By.css('#share-button'));
    shareButton.triggerEventHandler('click', null);
    expect(sharing).toBe(true);
  });
});
