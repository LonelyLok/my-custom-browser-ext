import { SETTINGS_STORAGE_KEY, defaultSettings, mergeSettings } from "../settings";

const SPEED_MIN = 0;
const SPEED_MAX = 16;

function clampPlaybackRate(value: number) {
    return Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));
}

function isLive() {
    return document.querySelector('meta[itemprop="isLiveBroadcast"]')?.getAttribute("content") === "True";
}

export function runYouTubeContent() {
    let isCustomVideoSpeedEnabled = defaultSettings.youtube.isCustomVideoSpeedEnabled;
    let playbackSpeed = defaultSettings.youtube.speed;
    const originalPlaybackRates = new WeakMap<HTMLVideoElement, number>();

    function rememberOriginalPlaybackSpeed(video: HTMLVideoElement) {
        if (!originalPlaybackRates.has(video)) {
            originalPlaybackRates.set(video, video.playbackRate);
        }
    }

    function restorePlaybackSpeed(video: HTMLVideoElement) {
        const originalPlaybackRate = originalPlaybackRates.get(video);
        if (typeof originalPlaybackRate !== "number") {
            return;
        }

        if (video.playbackRate !== originalPlaybackRate) {
            video.playbackRate = originalPlaybackRate;
        }
    }

    function applyPlaybackSpeed(video: HTMLVideoElement) {
        if (!isCustomVideoSpeedEnabled) {
            restorePlaybackSpeed(video);
            return;
        }

        rememberOriginalPlaybackSpeed(video);

        const nextRate = isLive() ? 1 : clampPlaybackRate(playbackSpeed);
        if (video.playbackRate !== nextRate) {
            video.playbackRate = nextRate;
        }
    }

    function applyToAllVideos() {
        document.querySelectorAll("video").forEach((video) => {
            if (video instanceof HTMLVideoElement) {
                applyPlaybackSpeed(video);
            }
        });
    }

    function syncSettings(rawSettings?: Partial<typeof defaultSettings>) {
        const settings = mergeSettings(rawSettings);
        isCustomVideoSpeedEnabled = settings.youtube.isCustomVideoSpeedEnabled;
        playbackSpeed = settings.youtube.speed;
        applyToAllVideos();
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (!(node instanceof Element)) {
                    continue;
                }

                if (node instanceof HTMLVideoElement) {
                    applyPlaybackSpeed(node);
                    continue;
                }

                node.querySelectorAll("video").forEach((video) => {
                    if (video instanceof HTMLVideoElement) {
                        applyPlaybackSpeed(video);
                    }
                });
            }
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener(
        "play",
        (event) => {
            const target = event.target;
            if (target instanceof HTMLVideoElement) {
                applyPlaybackSpeed(target);
            }
        },
        true,
    );

    chrome.storage.local.get<{ extensionSettings?: unknown }>(SETTINGS_STORAGE_KEY, (items) => {
        syncSettings(items.extensionSettings as Partial<typeof defaultSettings> | undefined);
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "local") {
            return;
        }

        const changedSettings = changes[SETTINGS_STORAGE_KEY];
        if (!changedSettings) {
            return;
        }

        syncSettings(changedSettings.newValue as Partial<typeof defaultSettings> | undefined);
    });

    applyToAllVideos();
    setInterval(applyToAllVideos, 1000);
}
