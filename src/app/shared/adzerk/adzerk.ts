interface Placement {
  divName: string;
  networkId: number;
  siteId: number;
  adTypes: number[];
  zoneIds?: number[];
  campaignId?: number;
  flightId?: number;
  adId?: number;
  clickUrl?: string;
  eventIds?: number[];
  properties?: {};
  contentKeys?: {};
}

interface User {
  key: string;
}

interface RequestProperties {
  guid?: string;
  publishedAt?: number;
  publishedAtPlus30?: number;
  duration?: number;
  backsaw?: boolean;
}

export interface AdzerkRequest {
  placements: Placement[];
  user?: User;
  keywords?: string[];
  referer?: string;
  url?: string;
  time?: number;
  ip?: string;
  blockedCreatives?: number[];
  flightViewTimes?: {};
  isMobile?: boolean;
  properties?: RequestProperties;
}

interface Ad {
  body: string;
  data: {
    fileName: string,
    imageUrl: string,
    width: number,
    customData?: {
      pingbacks?: string[],
    },
  };
  template: string;
  type: string;
}

export interface AdzerkDecision {
  adId: number;
  creativeId: number;
  flightId: number;
  campaignId: number;
  clickUrl: string;
  contents: Ad[];
  impressionUrl: string;
  events: {}[];
}

export interface AdzerkResponse {
  decisions: {[key: string]: AdzerkDecision};
  user?: User;
}
