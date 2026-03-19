(function () {
  if (window.__tw_route_hook_installed) {
    return;
  }

  window.__tw_route_hook_installed = true;

  function emit(name: string) {
    try {
      window.dispatchEvent(
        new CustomEvent("tw-route", {
          detail: { name, href: location.href },
        }),
      );
    } catch {}
  }

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    const result = originalPushState.apply(this, args);
    emit("pushState");
    return result;
  };

  const originalReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    const result = originalReplaceState.apply(this, args);
    emit("replaceState");
    return result;
  };

  window.addEventListener("popstate", () => emit("popstate"));
})();
