import { DovetailAudio } from './dovetail_audio';

// UA-164824-54

const GA_SEND = 'send';
const GA_TRANSPORT = 'transport';
const GA_BEACON = 'beacon';
const HIT_TYPE_EVENT = 'event';
const EVENT_CATEGORY_AUDIO = 'Audio';
const EVENT_ACTION_PLAYBACK = 'playback';
const EVENT_ACTION_WAITING = 'waiting';
const METRIC_PLAYBACK = 'metric1';
const DIMENSION_SHOW_NAME = 'dimension1';
const DIMENSION_EPISODE_TITLE = 'dimension2';
const DIMENSION_PLAYBACK_BOUNDARIES_10S = 'dimension3';
const DIMENSION_PLAYBACK_BOUNDARIES_PERCENT = 'dimension4';
const HEARTBEAT_INTERVAL = 10;
const FLUSH_INTERVAL = 20;

export class Logger {
  private listeningBlocks: number[][] = [[]];
  private isSeeking: boolean;
  private waitingSince: Date;
  private isUnloading: boolean;

  get currentBlock() {
    return this.listeningBlocks[this.listeningBlocks.length - 1];
  }

  constructor(private player: DovetailAudio, private label: string, private artist: string) {
    player.addEventListener('segmentstart',() => this.onSegmentstart());
    player.addEventListener('canplay', () => this.onCanplay());
    player.addEventListener('timeupdate', () => this.onTimeupdate());
    player.addEventListener('seeking', () => this.onSeeking());
    player.addEventListener('seeked', () => this.onSeeked());

    setInterval(this.flushListeningBlocks.bind(this), (FLUSH_INTERVAL * 1000));

    window.addEventListener('unload', () => this.onUnload());
  }

  // On a periodic basis, listening blocks are flushed to GA. All blocks,
  ///including the current block, even if it's still being updated, are flushed,
  ///and the listening block data are reset. Each block is processed, and some
  ///number of GA events are to record the listening behavior the blocks
  ///represent.
  private flushListeningBlocks() {
    if (this.listeningBlocks.length) {
      const allBlocks = this.listeningBlocks.slice(0);

      // When the current block being flushed is potentially still in progress,
      ///copy the end value over to start a new block in the new set of
      ///listening blocks
      const lastBlock = allBlocks[allBlocks.length - 1];
      if (lastBlock.length === 2) {
        this.listeningBlocks = [[lastBlock[1] + 0.001]];
      } else {
        this.listeningBlocks = [[]];
      }

      const flushableBlocks = allBlocks.filter(block => block.length === 2);
      for (let block of flushableBlocks) {
        this.flushBlock(block);
      }
    }
  }

  private flushBlock(block: number[]) {
    if (block[0] < 0.5) { block[0] = 0; }

    let heartbeat = HEARTBEAT_INTERVAL * Math.ceil(block[0] / HEARTBEAT_INTERVAL);
    while (heartbeat <= block[1]) {
      const fields = {
        [METRIC_PLAYBACK]: HEARTBEAT_INTERVAL,
        eventAction: EVENT_ACTION_PLAYBACK,
        eventCategory: EVENT_CATEGORY_AUDIO,
        [DIMENSION_EPISODE_TITLE]: this.label,
        [DIMENSION_SHOW_NAME]: this.artist,
        eventLabel: this.label,
        hitType: HIT_TYPE_EVENT,
        [DIMENSION_PLAYBACK_BOUNDARIES_10S]: `000000${heartbeat}`.slice(-5)
      };

      // Figure out if this heartbeat crosses a 10% boundary, and add that
      ///dimension to the event if it does
      const secondsPer10Percent = (this.player.duration / 10);
      const perBlock = secondsPer10Percent * Math.ceil(heartbeat / secondsPer10Percent);
      if (perBlock >= heartbeat && perBlock <= (heartbeat + HEARTBEAT_INTERVAL)) {
        const percent = perBlock / this.player.duration;
        fields[DIMENSION_PLAYBACK_BOUNDARIES_PERCENT] = `${percent * 100}%`;
      }

      if (this.isUnloading) {
        fields[GA_TRANSPORT] = GA_BEACON;
      }

      ga(GA_SEND, fields);

      heartbeat += HEARTBEAT_INTERVAL;
    }
  }

  // When seeking begins, if the current block has a start and end, the seek
  ///represents a discontiguous jump, so a new block should be started. If
  ///the current block is a new (empty) block, we don't need another new block.
  ///If the current block only has a start value, no listening has actually
  ///happened yet on this block, so we just need to update the start value so
  ///it's ready for when listening does start frealz.
  private onSeeking() {
    this.isSeeking = true;

    if (this.currentBlock.length === 2) {
      this.listeningBlocks.push([]);
    } else if (this.currentBlock.length === 1) {
      this.currentBlock[0] = this.player.currentTime;
    }
  }

  // Once seeking is completed, in cases where the current block only has a
  ///start time, make sure that value reflects the seek position
  private onSeeked() {
    this.isSeeking = false;

    if (this.currentBlock.length === 1) {
      this.currentBlock[0] = this.player.currentTime;
    }
  }

  // Ignoring and time updates when the player is paused of seeking, set the
  ///start value on virgin blocks, or update the end value for the currentTime
  ///block.
  private onTimeupdate() {
    if (!this.player.paused && !this.isSeeking) {
      if (!this.currentBlock.length) {
        this.currentBlock[0] = this.player.currentTime;
      } else if (this.currentBlock[0] !== this.player.currentTime
          && this.player.currentTime - this.currentBlock[0] > 1.0) {
        this.currentBlock[1] = this.player.currentTime;
      }
    }
  }

  private onSegmentstart() {
    this.waitingSince = new Date();
  }

  //
  private onCanplay() {
    if (this.waitingSince) {
      const now = new Date();
      const wait: number = ((+now) - (+this.waitingSince)) / 1000.0;
      const value = Math.max(0, Math.min(wait, 10));
      this.waitingSince = undefined;

      ga(GA_SEND, {
        eventAction: EVENT_ACTION_WAITING,
        eventCategory: EVENT_CATEGORY_AUDIO,
        [DIMENSION_EPISODE_TITLE]: this.label,
        [DIMENSION_SHOW_NAME]: this.artist,
        eventLabel: this.label,
        eventValue: value,
        hitType: HIT_TYPE_EVENT
      });
    }
  }

  private onUnload() {
    this.isUnloading = true;
    this.player.pause();
    this.flushListeningBlocks();
  }
}
