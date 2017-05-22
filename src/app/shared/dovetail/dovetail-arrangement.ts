export interface DovetailArrangementEntry {
  id: string;
  type: 'original'|'ad'|'sonicId'|'billboard'|'houseAd'|'fallback';
  duration?: number;
  audioUrl?: string;
  impressionUrl: string;
  unplayable: boolean;
}

export interface DovetailArrangement {
  entries: DovetailArrangementEntry[];
  duration?: number;
}
