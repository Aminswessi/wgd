# WGD.ai

**Give the web new verbs.**

WGD is an open interaction layer for AI-native interfaces. It adds small reasoning affordances to existing interface objects without replacing the host product, CTA, model, or backend.

Current primitives:

- **Why** — expose why something appeared, changed, or was recommended
- **Evidence** — reveal supporting facts, sources, and gaps
- **Compare** — surface alternatives and tradeoffs
- **Challenge** — generate the strongest countercase
- **Confidence** — separate knowns, inference, and uncertainty
- **Provenance** — expose origin, inputs, and transformations

## Install

React:

```bash
npm install @wgd-ai/react
```

Core runtime only:

```bash
npm install @wgd-ai/core
```

Icons only:

```bash
npm install @wgd-ai/icons
```

## Vanilla embed

```html
<script>
  window.WGD_CONFIG = { endpoint: "https://wgd-dev-alpha.vercel.app/api/wgd" };
</script>
<script src="https://wgd-dev-alpha.vercel.app/wgd.js" defer></script>
```

Then attach intent to an existing object:

```html
<span
  data-wgd="evidence"
  data-wgd-label="Show the evidence"
  data-wgd-context='{"claim":"Lowest price in 60 days","facts":{"currentPrice":135.75}}'>
  Lowest price in 60 days
</span>
```

WGD does not scrape arbitrary DOM or require a browser-side AI key. Hosts explicitly provide context and can route requests to their own reasoning endpoint.

## Current status

`0.12 alpha` — interface and integration contract under active development.

Public demo: `https://wgd-dev-alpha.vercel.app`

## Repository layout

- `packages/core` — provider-neutral reasoning contracts and runtime
- `packages/react` — React components
- `packages/icons` — self-contained React icons
- `wgd.js` — vanilla embed runtime
- `wgd.css` — embed styles
- `api/wgd.js` — deterministic public demo gateway
- `examples/basic.html` — copy-paste integration example
- `vercel.json` — Vercel deployment configuration

## Design principle

> Keep your model. Keep your backend. Add a reasoning interface.

The public demo gateway is deterministic and uses only explicit supplied context. Production adopters should connect WGD to their own server-side model or internal AI gateway.

## License

MIT License. See `LICENSE`.
