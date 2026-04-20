import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SETTINGS_STORAGE_KEY, defaultSettings, mergeSettings, type ExtensionSettings } from "../settings";
import linkedinIcon from "../assets/tab-icon/linkedin.png";
import redditIcon from "../assets/tab-icon/reddit.png";
import twitchIcon from "../assets/tab-icon/twitch.png";
import youtubeIcon from "../assets/tab-icon/youtube.png";

type TabKey = "twitch" | "linkedin" | "reddit" | "youtube";

type ToggleRowProps = {
  checked: boolean;
  label: string;
  onChange: () => void;
};

type ExpandableToggleRowProps = ToggleRowProps & {
  expanded: boolean;
  onToggleExpanded: () => void;
  children?: React.ReactNode;
};

const tabIcons: Record<TabKey, { src: string; alt: string }> = {
  twitch: { src: twitchIcon, alt: "Twitch" },
  linkedin: { src: linkedinIcon, alt: "LinkedIn" },
  reddit: { src: redditIcon, alt: "Reddit" },
  youtube: { src: youtubeIcon, alt: "YouTube" },
};

function getTabFromUrl(url?: string): TabKey | null {
  if (!url) {
    return null;
  }

  if (url.startsWith("https://www.twitch.tv/")) {
    return "twitch";
  }

  if (url.startsWith("https://www.linkedin.com/")) {
    return "linkedin";
  }

  if (url.startsWith("https://www.reddit.com/")) {
    return "reddit";
  }

  if (url.startsWith("https://www.youtube.com/")) {
    return "youtube";
  }

  return null;
}

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        borderRadius: "12px",
        padding: "12px 14px",
        background: "rgba(255, 255, 255, 0.035)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          color: "#e8edf3",
          fontSize: "13px",
          lineHeight: 1.35,
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <input
        checked={checked}
        onChange={onChange}
        style={{
          width: "16px",
          height: "16px",
          accentColor: "#f97316",
          cursor: "pointer",
          flexShrink: 0,
        }}
        type="checkbox"
      />
    </label>
  );
}

function ExpandableToggleRow({
  checked,
  label,
  onChange,
  expanded,
  onToggleExpanded,
  children,
}: ExpandableToggleRowProps) {
  return (
    <div
      style={{
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.035)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 14px",
        }}
      >
        <button
          onClick={onToggleExpanded}
          style={{
            width: "24px",
            height: "24px",
            border: 0,
            padding: 0,
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.06)",
            color: "#e8edf3",
            fontSize: "12px",
            cursor: "pointer",
            flexShrink: 0,
          }}
          type="button"
        >
          {expanded ? "-" : "+"}
        </button>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flex: 1,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              color: "#e8edf3",
              fontSize: "13px",
              lineHeight: 1.35,
              fontWeight: 500,
            }}
          >
            {label}
          </span>
          <input
            checked={checked}
            onChange={onChange}
            style={{
              width: "16px",
              height: "16px",
              accentColor: "#f97316",
              cursor: "pointer",
              flexShrink: 0,
            }}
            type="checkbox"
          />
        </label>
      </div>
      {expanded ? (
        <div
          style={{
            padding: "0 14px 14px 50px",
            color: "#9aa4b2",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

function Popup() {
  const [activeTab, setActiveTab] = useState<TabKey>("twitch");
  const [settings, setSettings] = useState<ExtensionSettings>(defaultSettings);
  const [linkedinCompanyNamesExpanded, setLinkedinCompanyNamesExpanded] = useState(false);
  const [youtubeSpeedExpanded, setYoutubeSpeedExpanded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get<{ extensionSettings?: unknown }>(SETTINGS_STORAGE_KEY, (items) => {
      const nextSettings = mergeSettings(items.extensionSettings as Partial<
        ExtensionSettings
      > | undefined);
      setSettings(nextSettings);
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const matchedTab = getTabFromUrl(tabs[0]?.url);
      if (matchedTab) {
        setActiveTab(matchedTab);
      }
    });
  }, []);

  const updateSettings = (nextSettings: ExtensionSettings) => {
    setSettings(nextSettings);
    chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: nextSettings });
  };

  const tabButtonStyle = (tab: TabKey) => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "9px 8px",
    background:
      activeTab === tab
        ? "linear-gradient(180deg, rgba(249, 115, 22, 0.28) 0%, rgba(249, 115, 22, 0.12) 100%)"
        : "rgba(255, 255, 255, 0.03)",
    color: activeTab === tab ? "#fff3eb" : "#9aa4b2",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "none" as const,
    cursor: "pointer",
    transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
  });

  return (
    <>
      <style>{`
        :root {
          color-scheme: dark;
          font-family: "Segoe UI", "Helvetica Neue", sans-serif;
          background:
            radial-gradient(circle at top, rgba(82, 82, 91, 0.2), transparent 50%),
            #0f1115;
        }

        body {
          margin: 0;
          min-width: 340px;
          min-height: 440px;
          background: #0f1115;
          color: #f5f7fa;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
      <main
        style={{
          minHeight: "100vh",
          padding: "16px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)",
        }}
      >
        <section
          style={{
            display: "flex",
            minHeight: "calc(100vh - 32px)",
            flexDirection: "column",
            gap: "14px",
            borderRadius: "16px",
            padding: "14px",
            background: "rgba(9, 10, 14, 0.42)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                color: "#9aa4b2",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Dashboard
            </p>
            <h1
              style={{
                margin: "10px 0 0",
                fontSize: "28px",
                lineHeight: 1.05,
                fontWeight: 700,
              }}
            >
              Home
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "8px",
              }}
            >
              {(["twitch", "linkedin", "reddit", "youtube"] as const).map((tab) => (
                <button
                  aria-label={tabIcons[tab].alt}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={tabButtonStyle(tab)}
                  type="button"
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    src={tabIcons[tab].src}
                    style={{
                      width: "20px",
                      height: "20px",
                      objectFit: "contain",
                      opacity: activeTab === tab ? 1 : 0.85,
                    }}
                  />
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {activeTab === "twitch" ? (
                <>
                  <p
                    style={{
                      margin: 0,
                      color: "#9aa4b2",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Twitch Settings
                  </p>
                  <ToggleRow
                    checked={settings.twitch.disableHomepageAutoplay}
                    label="Disable home page auto play"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        twitch: {
                          ...settings.twitch,
                          disableHomepageAutoplay: !settings.twitch.disableHomepageAutoplay,
                        },
                      })
                    }
                  />
                  <ToggleRow
                    checked={settings.twitch.disableFooter}
                    label="Disable footer"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        twitch: {
                          ...settings.twitch,
                          disableFooter: !settings.twitch.disableFooter,
                        },
                      })
                    }
                  />
                  <ToggleRow
                    checked={settings.twitch.muteDuringAd}
                    label="Mute during ad"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        twitch: {
                          ...settings.twitch,
                          muteDuringAd: !settings.twitch.muteDuringAd,
                        },
                      })
                    }
                  />
                </>
              ) : activeTab === "linkedin" ? (
                <>
                  <p
                    style={{
                      margin: 0,
                      color: "#9aa4b2",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    LinkedIn Settings
                  </p>
                  <ToggleRow
                    checked={settings.linkedin.hideEasyApplyJobs}
                    label="Hide Easy Apply jobs"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        linkedin: {
                          ...settings.linkedin,
                          hideEasyApplyJobs: !settings.linkedin.hideEasyApplyJobs,
                        },
                      })
                    }
                  />
                  <ExpandableToggleRow
                    checked={settings.linkedin.hideCompanyNames}
                    expanded={linkedinCompanyNamesExpanded}
                    label="Hide jobs base off company names"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        linkedin: {
                          ...settings.linkedin,
                          hideCompanyNames: !settings.linkedin.hideCompanyNames,
                        },
                      })
                    }
                    onToggleExpanded={() =>
                      setLinkedinCompanyNamesExpanded((value) => !value)
                    }
                  >
                    <textarea
                      onChange={(event) =>
                        updateSettings({
                          ...settings,
                          linkedin: {
                            ...settings.linkedin,
                            companyNamesText: event.target.value,
                          },
                        })
                      }
                      placeholder="One company name per line"
                      style={{
                        width: "100%",
                        minHeight: "96px",
                        maxHeight: "140px",
                        resize: "none",
                        overflowY: "auto",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "#f5f7fa",
                        padding: "8px 10px",
                        outline: "none",
                        lineHeight: 1.45,
                      }}
                      value={settings.linkedin.companyNamesText}
                    />
                  </ExpandableToggleRow>
                </>
              ) : activeTab === "reddit" ? (
                <>
                  <p
                    style={{
                      margin: 0,
                      color: "#9aa4b2",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Reddit Settings
                  </p>
                  <ToggleRow
                    checked={settings.reddit.hideGamesDrawer}
                    label="Hide games drawer"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        reddit: {
                          hideGamesDrawer: !settings.reddit.hideGamesDrawer,
                        },
                      })
                    }
                  />
                </>
              ) : (
                <>
                  <p
                    style={{
                      margin: 0,
                      color: "#9aa4b2",
                      fontSize: "11px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    YouTube Settings
                  </p>
                  <ExpandableToggleRow
                    checked={settings.youtube.isCustomVideoSpeedEnabled}
                    expanded={youtubeSpeedExpanded}
                    label="Custom video speed"
                    onChange={() =>
                      updateSettings({
                        ...settings,
                        youtube: {
                          ...settings.youtube,
                          isCustomVideoSpeedEnabled: !settings.youtube.isCustomVideoSpeedEnabled,
                        },
                      })
                    }
                    onToggleExpanded={() => setYoutubeSpeedExpanded((value) => !value)}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#d8dee7",
                      }}
                    >
                      <span>Speed:</span>
                      <input
                        min="0"
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          updateSettings({
                            ...settings,
                            youtube: {
                              ...settings.youtube,
                              speed: Number.isFinite(value) ? value : defaultSettings.youtube.speed,
                            },
                          });
                        }}
                        step="0.1"
                        style={{
                          width: "72px",
                          borderRadius: "8px",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          background: "rgba(255, 255, 255, 0.05)",
                          color: "#f5f7fa",
                          padding: "6px 8px",
                          outline: "none",
                        }}
                        type="number"
                        value={settings.youtube.speed}
                      />
                    </label>
                  </ExpandableToggleRow>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>,
  );
}
