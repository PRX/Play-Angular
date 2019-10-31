interface AppLinkMatchers {
  apple: RegExp;
  google: RegExp;
  stitcher: RegExp;
  iheartradio: RegExp;
  podbean: RegExp;
  tunein: RegExp;
  soundcloud: RegExp;
  anchor: RegExp;
  breaker: RegExp;
  spotify: RegExp;
  overcast: RegExp;
  castbox: RegExp;
  googleplay: RegExp;
  castro: RegExp;
  pocketcasts: RegExp;
  playerfm: RegExp;
  radiopublic: RegExp;
}

const APP_MATCHERS: AppLinkMatchers = {
  apple: /^https?:\/\/(?:itunes|podcasts)\.apple\.com\//i,
  google: /^https:\/\/podcasts\.google\.com\//i,
  stitcher: /^https?:\/\/(?:www\.)?stitcher\.com\//i,
  iheartradio: /^https?:\/\/(?:www\.)?iheart\.com\//i,
  podbean: /^https?:\/\/(?:www\.)?([a-z0-9]+)\.podbean\.com\//i,
  tunein: /^https?:\/\/(?:www\.)?tunein\.com\//i,
  soundcloud: /^https?:\/\/(?:www\.)?soundcloud\.com\//i,
  anchor: /^https?:\/\/(?:www\.)?anchor\.fm\//i,
  breaker: /^https?:\/\/(?:www\.)?breaker\.audio\//i,
  spotify: /^https?:\/\/open\.spotify\.com\//i,
  overcast: /^https?:\/\/(?:www\.)?overcast\.fm\//i,
  castbox: /^https?:\/\/(?:www\.)?castbox\.fm\//i,
  googleplay: /^https:\/\/play\.google\.com\//i,
  castro: /^https?:\/\/(?:www\.)?castro\.fm\//i,
  pocketcasts: /^https?:\/\/pca.st\//i,
  playerfm: /^https?:\/\/(?:www\.)?player\.fm\//i,
  radiopublic: /^https:\/\/(?:play\.)?radiopublic\.com\//i
};

export type AppLinks = { [A in keyof AppLinkMatchers]?: string } & { rss?: string };

export function toAppLinks(links: string[]): AppLinks | undefined {
  const result: AppLinks = {};
  for (const appKey of Object.keys(APP_MATCHERS)) {
    const matchedLink = links.find(link => APP_MATCHERS[appKey].test(link));
    if (matchedLink) {
      result[appKey] = matchedLink;
    }
  }
  if (Object.keys(result).some(key => result[key])) {
    return result;
  }
  return;
}
