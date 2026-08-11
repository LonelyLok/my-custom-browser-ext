import { SETTINGS_STORAGE_KEY, defaultSettings, mergeSettings } from "../settings";

const JOB_CARD_SELECTOR =
  'div:has(> div[data-display-contents="true"] > div[role="button"][componentkey^="job-card-component-ref-"])';
const COMPANY_NAME_SELECTOR =
  'div[data-display-contents="true"]:has(> p) + div > p';
const DISMISS_BUTTON_SELECTOR = 'button[aria-label*="Dismiss"]';
const HIDDEN_JOB_ATTR = "data-myext-hidden-linkedin-job";
const DISMISSED_JOB_ATTR = "data-myext-dismissed-linkedin-job";

function normalizeCompanyName(value: string) {
  return value.trim().toLowerCase();
}

function getCompanyName(card: Element) {
  const companyName = card.querySelector(COMPANY_NAME_SELECTOR)?.textContent;
  return companyName ? normalizeCompanyName(companyName) : "";
}

function isEasyApplyJob(card: Element) {
  const hasEasyApplyText = card.textContent?.includes("Easy Apply") ?? false;
  const hasLinkedInApplyMarker = Array.from(
    card.querySelectorAll("svg#linkedin-bug-small ~ p"),
  ).some((label) => label.textContent?.trim().toLowerCase() === "apply");

  return hasEasyApplyText || hasLinkedInApplyMarker;
}

function parseCompanyNames(value: string) {
  return new Set(
    value
      .split(/\r?\n/)
      .map(normalizeCompanyName)
      .filter(Boolean),
  );
}

function hideJobCard(card: HTMLElement) {
  card.style.setProperty("display", "none", "important");
  card.setAttribute(HIDDEN_JOB_ATTR, "true");
}

function dismissJobCard(card: HTMLElement) {
  if (card.hasAttribute(DISMISSED_JOB_ATTR)) {
    return;
  }

  const dismissButton = card.querySelector(DISMISS_BUTTON_SELECTOR);
  if (!(dismissButton instanceof HTMLButtonElement)) {
    return;
  }

  card.setAttribute(DISMISSED_JOB_ATTR, "true");
  dismissButton.click();
}

function restoreJobCard(card: HTMLElement) {
  if (!card.hasAttribute(HIDDEN_JOB_ATTR)) {
    return;
  }

  card.style.removeProperty("display");
  card.removeAttribute(HIDDEN_JOB_ATTR);
}

export function runLinkedInContent() {
  let hideEasyApplyJobsEnabled = defaultSettings.linkedin.hideEasyApplyJobs;
  let hideCompanyNamesEnabled = defaultSettings.linkedin.hideCompanyNames;
  let hiddenCompanyNames = parseCompanyNames(defaultSettings.linkedin.companyNamesText);

  const applyToJobCard = (card: HTMLElement) => {
    if (card.hasAttribute(DISMISSED_JOB_ATTR)) {
      hideJobCard(card);
      return;
    }

    const shouldHideForEasyApply = hideEasyApplyJobsEnabled && isEasyApplyJob(card);
    const companyName = getCompanyName(card);
    const shouldHideForCompanyName =
      hideCompanyNamesEnabled &&
      companyName.length > 0 &&
      hiddenCompanyNames.has(companyName);

    if (shouldHideForEasyApply || shouldHideForCompanyName) {
      hideJobCard(card);
      dismissJobCard(card);
      return;
    }

    restoreJobCard(card);
  };

  const applyJobCardVisibility = (root: ParentNode) => {
    if (root instanceof HTMLElement && root.matches(JOB_CARD_SELECTOR)) {
      applyToJobCard(root);
    }

    root.querySelectorAll(JOB_CARD_SELECTOR).forEach((card) => {
      if (card instanceof HTMLElement) {
        applyToJobCard(card);
      }
    });
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const targetJobCard =
        mutation.target instanceof Element
          ? mutation.target.closest<HTMLElement>(JOB_CARD_SELECTOR)
          : null;

      if (targetJobCard) {
        applyToJobCard(targetJobCard);
      }

      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) {
          continue;
        }

        applyJobCardVisibility(node);
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
    hideEasyApplyJobsEnabled = settings.linkedin.hideEasyApplyJobs;
    hideCompanyNamesEnabled = settings.linkedin.hideCompanyNames;
    hiddenCompanyNames = parseCompanyNames(settings.linkedin.companyNamesText);
    applyJobCardVisibility(document);
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
    hideEasyApplyJobsEnabled = settings.linkedin.hideEasyApplyJobs;
    hideCompanyNamesEnabled = settings.linkedin.hideCompanyNames;
    hiddenCompanyNames = parseCompanyNames(settings.linkedin.companyNamesText);
    applyJobCardVisibility(document);
  });

  setInterval(() => {
    applyJobCardVisibility(document);
  }, 1000);
}
