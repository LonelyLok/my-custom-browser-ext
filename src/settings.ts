export type ExtensionSettings = {
  twitch: {
    disableHomepageAutoplay: boolean;
    disableFooter: boolean;
    muteDuringAd: boolean;
  };
  linkedin: {
    hideEasyApplyJobs: boolean;
    hideCompanyNames: boolean;
    companyNamesText: string;
  };
  reddit: {
    hideGamesDrawer: boolean;
  };
  youtube: {
    isCustomVideoSpeedEnabled: boolean;
    speed: number;
  };
};

export const SETTINGS_STORAGE_KEY = "extensionSettings";

export const defaultSettings: ExtensionSettings = {
  twitch: {
    disableHomepageAutoplay: true,
    disableFooter: true,
    muteDuringAd: true,
  },
  linkedin: {
    hideEasyApplyJobs: true,
    hideCompanyNames: true,
    companyNamesText: "",
  },
  reddit: {
    hideGamesDrawer: true,
  },
  youtube: {
    isCustomVideoSpeedEnabled: true,
    speed: 2.5,
  },
};

export function mergeSettings(
  partial: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  return {
    twitch: {
      disableHomepageAutoplay:
        partial?.twitch?.disableHomepageAutoplay ??
        defaultSettings.twitch.disableHomepageAutoplay,
      disableFooter:
        partial?.twitch?.disableFooter ?? defaultSettings.twitch.disableFooter,
      muteDuringAd:
        partial?.twitch?.muteDuringAd ?? defaultSettings.twitch.muteDuringAd,
    },
    linkedin: {
      hideEasyApplyJobs:
        partial?.linkedin?.hideEasyApplyJobs ?? defaultSettings.linkedin.hideEasyApplyJobs,
      hideCompanyNames:
        partial?.linkedin?.hideCompanyNames ?? defaultSettings.linkedin.hideCompanyNames,
      companyNamesText:
        partial?.linkedin?.companyNamesText ?? defaultSettings.linkedin.companyNamesText,
    },
    reddit: {
      hideGamesDrawer:
        partial?.reddit?.hideGamesDrawer ?? defaultSettings.reddit.hideGamesDrawer,
    },
    youtube: {
      isCustomVideoSpeedEnabled:
        partial?.youtube?.isCustomVideoSpeedEnabled ??
        defaultSettings.youtube.isCustomVideoSpeedEnabled,
      speed: partial?.youtube?.speed ?? defaultSettings.youtube.speed,
    },
  };
}
