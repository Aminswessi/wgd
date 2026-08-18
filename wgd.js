(function (window, document) {
  "use strict";

  const VERSION = "0.12.0-alpha.1";
  const intents = ["why", "evidence", "compare", "challenge", "confidence", "provenance"];
  let config = window.WGD_CONFIG || {};

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

  function sparkle() {
    return '<span class="wgd-spark" aria-hidden="true">✦</span>';
  }

  function icon(intent) {
    const marks = {
      why: "?",
      evidence: "✓",
      compare: "↔",
      challenge: "⚖",
      confidence: "◒",
      provenance: "⌘"
    };
    return `<span class="wgd-glyph" aria-hidden="true">${marks[intent] || "?"}</span>${sparkle()}`;
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
