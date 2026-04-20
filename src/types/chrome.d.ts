declare namespace chrome {
  namespace runtime {
    function getURL(path: string): string;
    function sendMessage(
      message: { type: string; isAdPlaying?: boolean },
      callback?: () => void,
    ): void;

    const onInstalled: {
      addListener(callback: () => void): void;
    };

    const onMessage: {
      addListener(
        callback: (
          message: { type?: string; isAdPlaying?: boolean },
          sender: { tab?: { id?: number } },
        ) => void,
      ): void;
    };
  }

  namespace tabs {
    function query(
      queryInfo: { active?: boolean; currentWindow?: boolean },
      callback: (tabs: Array<{ id?: number; url?: string }>) => void,
    ): void;
    function update(tabId: number, updateProperties: { muted: boolean }): void;
  }

  namespace storage {
    namespace local {
      function get<T>(
        keys: string | string[] | Record<string, unknown> | null,
        callback: (items: T) => void,
      ): void;
      function set(items: Record<string, unknown>, callback?: () => void): void;
    }

    const onChanged: {
      addListener(
        callback: (
          changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
          areaName: string,
        ) => void,
      ): void;
    };
  }
}

interface Window {
  __tw_route_hook_installed?: boolean;
  __tw_route_loader_installed?: boolean;
}
