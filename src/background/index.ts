import { SETTINGS_STORAGE_KEY, defaultSettings, mergeSettings } from "../settings";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Background service worker installed.");
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "TWITCH_AD_STATE") {
    return;
  }

  const tabId = sender.tab?.id;
  if (typeof tabId !== "number") {
    return;
  }

  chrome.storage.local.get<{ extensionSettings?: unknown }>(SETTINGS_STORAGE_KEY, (items) => {
    const settings = mergeSettings(items.extensionSettings as Partial<
      typeof defaultSettings
    > | undefined);

    const shouldMute = settings.twitch.muteDuringAd && Boolean(message.isAdPlaying);
    chrome.tabs.update(tabId, { muted: shouldMute });
  });
});
