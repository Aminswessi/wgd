(function (window, document) {
  "use strict";

  const VERSION = "0.12.0-alpha.2";
  const intents = ["why", "evidence", "compare", "challenge", "confidence", "provenance"];
  let config = window.WGD_CONFIG || {};
  let iconSequence = 0;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function parseContext(value) {
    if (!value) return {};
    try { return JSON.parse(value); } catch { return {}; }
  }

  function icon(intent) {
    const marks = {
      why: '<path d="M8 7.5a4 4 0 0 1 8 0c0 2.7-4 2.8-4 5"/><circle cx="12" cy="17.5" r="1.2" class="wgd-fill" stroke="none"/>',
      evidence: '<rect x="5.25" y="4.75" width="13.5" height="14.5" rx="2"/><path d="m8 10 1.5 1.5L12.5 8.5M14.5 9h2.25M14.5 12.5h2.25M8 15.75h8.75"/>',
      compare: '<path d="M5 8h13m-3-3 3 3-3 3M19 16H6m3-3-3 3 3 3"/>',
      challenge: '<path d="M5 8h14M8 8l-3 6h6L8 8zm8 0-3 6h6l-3-6zM12 4v16"/>',
      confidence: '<path d="M5 17a7 7 0 0 1 14 0M12 12l4-3"/><circle cx="12" cy="17" r="1.2" class="wgd-fill" stroke="none"/>',
      provenance: '<circle cx="7" cy="12" r="2"/><circle cx="17" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="m9 11 6-3m-6 5 6 3"/>'
    };
    const gradientId = `wgd-ai-${intent}-${++iconSequence}`;
    return `<span class="wgd-icon-frame" aria-hidden="true">
      <svg class="wgd-main" viewBox="0 0 24 24">${marks[intent] || marks.why}</svg>
      <svg class="wgd-spark" viewBox="0 0 16 16">
        <defs><linearGradient id="${gradientId}" x1="1" y1="1" x2="13" y2="13" gradientUnits="userSpaceOnUse"><stop stop-color="#4285F4"/><stop offset="1" stop-color="#8B5CF6"/></linearGradient></defs>
        <path d="M5.2.8c.34 2.55 1.42 3.63 3.97 3.97C6.62 5.11 5.54 6.19 5.2 8.74 4.86 6.19 3.78 5.11 1.23 4.77 3.78 4.43 4.86 3.35 5.2.8Z" fill="url(#${gradientId})"/>
        <path d="M12.05.95c.17 1.3.72 1.85 2.02 2.02-1.3.17-1.85.72-2.02 2.02-.17-1.3-.72-1.85-2.02-2.02 1.3-.17 1.85-.72 2.02-2.02Z" fill="#8B5CF6"/>
      </svg>
    </span>`;
  }

  function layer() {
    let root = document.querySelector(".wgd-layer");
    if (root) return root;

    root = document.createElement("div");
    root.className = "wgd-layer";
    root.innerHTML = `
      <section class="wgd-pop" role="dialog" aria-modal="false">
        <button class="wgd-close" type="button" aria-label="Close">×</button>
        <div class="wgd-body"></div>
      </section>`;
    document.body.appendChild(root);

    root.querySelector(".wgd-close").addEventListener("click", close);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    document.addEventListener("click", (event) => {
      if (!root.classList.contains("open")) return;
      if (event.target.closest(".wgd-pop") || event.target.closest(".wgd-trigger")) return;
      close();
    });
    window.addEventListener("scroll", () => {
      if (root.classList.contains("open")) close();
    }, { passive: true });

    return root;
  }

  function place(popover, trigger) {
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(420, window.innerWidth - 24);
    const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
    popover.style.width = `${width}px`;
    popover.style.left = `${left}px`;

    requestAnimationFrame(() => {
      const height = Math.min(popover.offsetHeight, window.innerHeight * 0.6);
      const below = window.innerHeight - rect.bottom;
      const top = below > height + 12 ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
      popover.style.top = `${top}px`;
    });
  }

  async function requestReasoning(target, intent) {
    const request = {
      version: "1",
      requestId: window.crypto?.randomUUID?.() || `wgd-${Date.now()}`,
      intent,
      subject: {
        id: target.id || undefined,
        type: target.dataset.wgdType || undefined,
        label: target.dataset.wgdLabel || undefined
      },
      context: parseContext(target.dataset.wgdContext)
    };

    if (typeof config.resolver === "function") {
      return config.resolver(request, target);
    }

    const endpoint = config.endpoint || target.dataset.wgdEndpoint;
    if (!endpoint) {
      return {
        version: "1",
        requestId: request.requestId,
        intent,
        status: "insufficient_context",
        title: target.dataset.wgdLabel || intent,
        reasons: [{ label: "WGD installed", detail: "No reasoning endpoint is configured. Nothing was transmitted." }]
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", ...(config.headers || {}) },
      credentials: config.credentials || "same-origin",
      body: JSON.stringify(request)
    });

    if (!response.ok) throw new Error(`WGD gateway returned ${response.status}`);
    return response.json();
  }

  async function open(target, intent, trigger) {
    const root = layer();
    const popover = root.querySelector(".wgd-pop");
    const body = root.querySelector(".wgd-body");

    root.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    body.innerHTML = `<div class="wgd-title">${escapeHTML(target.dataset.wgdLabel || intent)}</div><div class="wgd-row"><b>status</b><span>Reasoning…</span></div>`;
    place(popover, trigger);

    try {
      const result = await requestReasoning(target, intent);
      const reasons = Array.isArray(result.reasons) ? result.reasons : [];
      body.innerHTML = `<div class="wgd-title">${escapeHTML(result.title || target.dataset.wgdLabel || intent)}</div>` +
        reasons.map((reason) => `<div class="wgd-row"><b>${escapeHTML(reason.label)}</b><span>${escapeHTML(reason.detail)}</span></div>`).join("");
      place(popover, trigger);
    } catch (error) {
      body.innerHTML = `<div class="wgd-title">${escapeHTML(target.dataset.wgdLabel || intent)}</div><div class="wgd-row"><b>unavailable</b><span>${escapeHTML(error.message)}</span></div>`;
    }
  }

  function close() {
    const root = document.querySelector(".wgd-layer");
    if (!root) return;
    root.classList.remove("open");
    document.querySelectorAll('.wgd-trigger[aria-expanded="true"]').forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  function enhance(target) {
    if (target.dataset.wgdReady) return;
    const intent = (target.dataset.wgd || "").toLowerCase();
    if (!intents.includes(intent)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "wgd-trigger";
    button.innerHTML = icon(intent);
    button.setAttribute("aria-label", target.dataset.wgdLabel || `WGD ${intent}`);
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => open(target, intent, button));

    target.insertAdjacentElement(target.dataset.wgdPosition === "before" ? "beforebegin" : "afterend", button);
    target.dataset.wgdReady = "1";
  }

  function init() {
    const script = document.currentScript || [...document.scripts].find((item) => item.src.includes("wgd.js"));
    if (script && !document.querySelector("link[data-wgd-css]")) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = new URL("wgd.css", script.src);
      link.dataset.wgdCss = "1";
      document.head.appendChild(link);
    }
    document.querySelectorAll("[data-wgd]").forEach(enhance);
  }

  window.WGD = {
    version: VERSION,
    init,
    configure(next) { Object.assign(config, next || {}); return window.WGD; },
    close
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
