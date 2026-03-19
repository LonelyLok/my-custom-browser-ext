import { SETTINGS_STORAGE_KEY, defaultSettings, mergeSettings } from "../settings";

type VideoBlockerRecord = {
  blocker: EventListener;
  events: string[];
  id: ReturnType<typeof setInterval>;
};

const FOOTER_SELECTOR = "#twilight-sticky-footer-root";
const HIDDEN_FOOTER_ATTR = "data-myext-hidden-footer";

export function runTwitchContent() {
  function isHomepage() {
    return location.pathname === "/" || location.pathname === "";
  }

  function isAdPlaying() {
    return Boolean(document.querySelector('span[data-a-target="video-ad-label"]'));
  }

  let disableHomepageAutoplayEnabled = defaultSettings.twitch.disableHomepageAutoplay;
  let disableFooterEnabled = defaultSettings.twitch.disableFooter;
  let muteDuringAdEnabled = defaultSettings.twitch.muteDuringAd;
  let lastAdState = false;

  setInterval(() => {
    if (isHomepage()) {
      if (lastAdState) {
        lastAdState = false;
        chrome.runtime.sendMessage({ type: "TWITCH_AD_STATE", isAdPlaying: false });
      }
      return;
    }

    const adPlaying = isAdPlaying();
    if (adPlaying !== lastAdState) {
      lastAdState = adPlaying;
      chrome.runtime.sendMessage({
        type: "TWITCH_AD_STATE",
        isAdPlaying: muteDuringAdEnabled ? adPlaying : false,
      });
    }
  }, 3000);

  const blockers = new WeakMap<HTMLVideoElement, VideoBlockerRecord>();

  function neuterVideo(video: HTMLVideoElement) {
    if (blockers.has(video)) {
      return;
    }

    video.autoplay = false;
    video.removeAttribute("autoplay");
    video.preload = "none";

    const blocker: EventListener = (event) => {
      video.pause();
      if (event instanceof Event) {
        event.stopImmediatePropagation();
      }
    };

    const events = ["play", "playing", "canplay", "loadedmetadata"];
    events.forEach((eventName) => video.addEventListener(eventName, blocker, true));

    const startedAt = performance.now();
    const id = setInterval(() => {
      if (performance.now() - startedAt > 3000) {
        clearInterval(id);
        return;
      }

      if (!video.paused) {
        video.pause();
      }
    }, 100);

    blockers.set(video, { blocker, events, id });
  }

  function restoreVideo(video: HTMLVideoElement) {
    const record = blockers.get(video);
    if (!record) {
      return;
    }

    record.events.forEach((eventName) => {
      video.removeEventListener(eventName, record.blocker, true);
    });
    clearInterval(record.id);
    blockers.delete(video);
  }

  function restoreAllVideos() {
    document.querySelectorAll("video").forEach(restoreVideo);
  }

  function applyHomepageAutoplaySetting() {
    if (isHomepage() && disableHomepageAutoplayEnabled) {
      document.querySelectorAll("video").forEach(neuterVideo);
      return;
    }

    restoreAllVideos();
  }

  function installRouteHook() {
    if (window.__tw_route_loader_installed) {
      return;
    }

    window.__tw_route_loader_installed = true;

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("route-hook.js");
    script.defer = true;
    (document.documentElement || document.head || document.body).appendChild(script);
  }

  function applyFooterVisibility() {
    const footer = document.querySelector(FOOTER_SELECTOR);
    if (!(footer instanceof HTMLElement)) {
      return;
    }

    if (!isHomepage() && disableFooterEnabled) {
      footer.style.setProperty("display", "none", "important");
      footer.setAttribute(HIDDEN_FOOTER_ATTR, "true");
    } else if (footer.hasAttribute(HIDDEN_FOOTER_ATTR)) {
      footer.style.removeProperty("display");
      footer.removeAttribute(HIDDEN_FOOTER_ATTR);
    }
  }

  function applyMuteDuringAdSetting() {
    chrome.runtime.sendMessage({
      type: "TWITCH_AD_STATE",
      isAdPlaying: muteDuringAdEnabled ? lastAdState : false,
    });
  }

  function onRouteChange() {
    applyHomepageAutoplaySetting();
    applyFooterVisibility();
    applyMuteDuringAdSetting();
  }

  applyHomepageAutoplaySetting();

  const observer = new MutationObserver((mutations) => {
    if (!isHomepage() || !disableHomepageAutoplayEnabled) {
      return;
    }

    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        if (node instanceof HTMLVideoElement) {
          neuterVideo(node);
        }

        node.querySelectorAll("video").forEach(neuterVideo);
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  chrome.storage.local.get<{ extensionSettings?: unknown }>(SETTINGS_STORAGE_KEY, (items) => {
    const settings = mergeSettings(items.extensionSettings as Partial<
      typeof defaultSettings
    > | undefined);
    disableHomepageAutoplayEnabled = settings.twitch.disableHomepageAutoplay;
    disableFooterEnabled = settings.twitch.disableFooter;
    muteDuringAdEnabled = settings.twitch.muteDuringAd;
    onRouteChange();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    const changedSettings = changes[SETTINGS_STORAGE_KEY];
    if (!changedSettings) {
      return;
    }

    const settings = mergeSettings(changedSettings.newValue as Partial<
      typeof defaultSettings
    > | undefined);
    disableHomepageAutoplayEnabled = settings.twitch.disableHomepageAutoplay;
    disableFooterEnabled = settings.twitch.disableFooter;
    muteDuringAdEnabled = settings.twitch.muteDuringAd;
    onRouteChange();
  });

  installRouteHook();
  window.addEventListener("tw-route", onRouteChange);
  window.addEventListener("popstate", onRouteChange);

  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      onRouteChange();
    }

    applyFooterVisibility();
  }, 500);
}
