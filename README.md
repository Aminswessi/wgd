# WGD.ai

**Give the web new verbs.**

WGD adds small reasoning affordances to existing UI: **Why, Evidence, Compare, Challenge, Confidence, and Provenance.** Keep your product, model, and backend. Add a reasoning interface.

> Current release: `0.12.0-alpha.2`

## Try it in 5 minutes

### React

Install the current alpha:

```bash
npm install @wgd-ai/react@alpha
```

Import the component and styles:

```tsx
import { Wgd } from "@wgd-ai/react";
import "@wgd-ai/core/style.css";

const config = {
  resolver: async (request) => ({
    version: "1",
    requestId: request.requestId,
    intent: request.intent,
    status: "ok",
    title: "Show the evidence",
    reasons: [
      {
        label: "support",
        detail: "Your host application supplied this evidence."
      }
    ]
  })
};

export function PriceClaim() {
  return (
    <Wgd
      intent="evidence"
      label="Show the evidence"
      context={{ claim: "Lowest price in 60 days" }}
      config={config}
    >
      <strong>Lowest price in 60 days</strong>
    </Wgd>
  );
}
```

That is a complete local integration. No API key is required and nothing is transmitted unless you configure a resolver or endpoint.

**Live external install proof:** https://wgd-react-install-proof.vercel.app

### Connect it to your AI/backend

Replace the local resolver with your server endpoint:

```tsx
const config = {
  endpoint: "/api/wgd"
};
```

WGD sends a small structured request containing the intent, subject, and **explicit context you provide**. Your server can route that request to OpenAI, Anthropic, Gemini, an internal model, deterministic business logic, or any other reasoning system.

```json
{
  "version": "1",
  "requestId": "...",
  "intent": "evidence",
  "subject": { "label": "Show the evidence" },
  "context": { "claim": "Lowest price in 60 days" }
}
```

Your endpoint returns:

```json
{
  "version": "1",
  "requestId": "...",
  "intent": "evidence",
  "status": "ok",
  "title": "Show the evidence",
  "reasons": [
    { "label": "support", "detail": "Observed price history supports the claim." }
  ]
}
```

## Vanilla HTML

No React required:

```html
<script>
  window.WGD_CONFIG = {
    endpoint: "https://wgd-dev-alpha.vercel.app/api/wgd"
  };
</script>
<script src="https://wgd-dev-alpha.vercel.app/wgd.js" defer></script>

<span
  data-wgd="evidence"
  data-wgd-label="Show the evidence"
  data-wgd-context='{"claim":"Lowest price in 60 days","facts":{"currentPrice":135.75}}'>
  Lowest price in 60 days
</span>
```

See `examples/basic.html` for the complete copy-paste example.

## The six primitives

| Primitive | Use it when someone needs to… |
|---|---|
| **Why** | understand why something appeared, changed, or was recommended |
| **Evidence** | inspect supporting facts, sources, and gaps |
| **Compare** | evaluate alternatives and tradeoffs |
| **Challenge** | see the strongest reasonable countercase |
| **Confidence** | distinguish certainty, inference, and unknowns |
| **Provenance** | inspect origin, inputs, and transformations |

## One rule

**WGD should not invent an explanation for a system that cannot support it.** Hosts supply the context. WGD supplies the interaction contract and interface.

WGD does not scrape arbitrary DOM, does not require a browser-side model key, and ships no telemetry by default.

## Packages

```bash
npm install @wgd-ai/react@alpha
npm install @wgd-ai/core@alpha
npm install @wgd-ai/icons@alpha
```

- `@wgd-ai/core` — provider-neutral contracts and resolver runtime
- `@wgd-ai/react` — React reasoning affordances
- `@wgd-ai/icons` — self-contained React icons

## Examples and source

- `examples/react-install-proof` — fresh Vite app consuming WGD from npm
- `examples/basic.html` — vanilla copy-paste integration
- `packages/core` — request/response contract and runtime
- `packages/react` — React component
- `packages/icons` — icon package

Public demo: https://wgd-dev-alpha.vercel.app

## Status

`0.12 alpha` — the interaction and integration contract is intentionally small and still being hardened through real integrations.

## License

MIT. See `LICENSE`.
