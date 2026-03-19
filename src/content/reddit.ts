import { SETTINGS_STORAGE_KEY, defaultSettings, mergeSettings } from "../settings";

const GAMES_DRAWER_SELECTOR =
  'faceplate-tracker[source="nav"][action="view"][noun="games_drawer"]';
const HIDDEN_STYLE_ATTR = "data-myext-hidden-games-drawer";

export function runRedditContent() {
  let hideGamesDrawerEnabled = defaultSettings.reddit.hideGamesDrawer;

  const applyGamesDrawerVisibility = (root: ParentNode) => {
    root.querySelectorAll(GAMES_DRAWER_SELECTOR).forEach((element) => {
      if (!(element instanceof HTMLElement)) {
        return;
      }

      if (hideGamesDrawerEnabled) {
        element.style.setProperty("display", "none", "important");
        element.setAttribute(HIDDEN_STYLE_ATTR, "true");
      } else if (element.hasAttribute(HIDDEN_STYLE_ATTR)) {
        element.style.removeProperty("display");
        element.removeAttribute(HIDDEN_STYLE_ATTR);
      }
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        if (node.matches(GAMES_DRAWER_SELECTOR) && node instanceof HTMLElement) {
          if (hideGamesDrawerEnabled) {
            node.style.setProperty("display", "none", "important");
            node.setAttribute(HIDDEN_STYLE_ATTR, "true");
          }
        }

        applyGamesDrawerVisibility(node);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  chrome.storage.local.get<{ extensionSettings?: unknown }>(SETTINGS_STORAGE_KEY, (items) => {
    const settings = mergeSettings(items.extensionSettings as Partial<
      typeof defaultSettings
    > | undefined);
    hideGamesDrawerEnabled = settings.reddit.hideGamesDrawer;
    applyGamesDrawerVisibility(document);
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
    hideGamesDrawerEnabled = settings.reddit.hideGamesDrawer;
    applyGamesDrawerVisibility(document);
  });
}
