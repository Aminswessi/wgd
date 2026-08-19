# WGD.ai

**Give the web new verbs.**

WGD is an open interaction protocol and interface layer for reasoning over application state. It attaches six reasoning intents to existing product objects:

**Why · Evidence · Compare · Challenge · Confidence · Provenance**

Keep your product. Keep your model. Keep your backend. Add a reasoning interface.

> Package release: `0.12.0-alpha.3`  
> Protocol: `WGD Protocol v0.1`

## Live proof

WGD Protocol v0.1 is running publicly now.

- **Resolver:** `https://wgd-dev-alpha.vercel.app/api/wgd`
- **Independent conformance proof:** `https://wgd-conformance-proof.vercel.app/api/check`
- **External npm consumer:** `https://wgd-react-install-proof.vercel.app`
- **Proof record:** [`PROTOCOL_PROOF.md`](./PROTOCOL_PROOF.md)

The live conformance runner currently reports **24 passed · 0 failed · conformant: true** against the production resolver.

Published from GitHub Actions with npm provenance:

- `@wgd-ai/core@0.12.0-alpha.3`
- `@wgd-ai/icons@0.12.0-alpha.3`
- `@wgd-ai/react@0.12.0-alpha.3`

## The protocol is the product contract

The React component is optional. WGD Protocol v0.1 defines the stable boundary:

```text
existing UI object
      ↓
reasoning intent + explicit context + permissions
      ↓
WGD-compatible resolver
      ↓
structured, truth-aware response
```

Read the normative spec: [`WGD_PROTOCOL.md`](./WGD_PROTOCOL.md)

Machine-readable schemas live in [`/schema`](./schema).

A resolver can be implemented in any language or framework. It does not need the official WGD UI packages.

## Five-minute React integration

```bash
npm install @wgd-ai/react@alpha
```

```tsx
import { Wgd } from "@wgd-ai/react";
import "@wgd-ai/core/style.css";

const config = {
  resolver: async (request) => ({
    version: "0.1",
    requestId: request.requestId,
    intent: request.intent,
    status: "ok",
    title: "Evidence",
    summary: "The host supplied one source-backed observation.",
    data: {
      items: [
        {
          id: "price-history-1",
          claim: "Observed price history supports the claim.",
          source: "price-history",
          strength: "direct",
          direction: "supports"
        }
      ],
      gaps: [],
      contradictions: []
    },
    caveats: []
  })
};

export function PriceClaim() {
  return (
    <Wgd
      intent="evidence"
      label="Show the evidence"
      context={{ claim: "Lowest price in 60 days" }}
      permissions={{ allowedSources: ["price-history"], allowExternalLookup: false }}
      config={config}
    >
      <strong>Lowest price in 60 days</strong>
    </Wgd>
  );
}
```

Nothing is transmitted unless the host configures a resolver or endpoint.

## Request envelope

```json
{
  "version": "0.1",
  "requestId": "req_123",
  "intent": "evidence",
  "subject": {
    "id": "claim-42",
    "type": "claim",
    "label": "Lowest price in 60 days"
  },
  "context": {
    "claim": "Lowest price in 60 days"
  },
  "permissions": {
    "allowedSources": ["price-history"],
    "allowExternalLookup": false
  }
}
```

## Response envelope

```json
{
  "version": "0.1",
  "requestId": "req_123",
  "intent": "evidence",
  "status": "ok",
  "title": "Evidence",
  "summary": "Observed retailer history supports the claim.",
  "data": {
    "items": [],
    "gaps": [],
    "contradictions": []
  },
  "caveats": []
}
```

Valid statuses are:

`ok · partial · insufficient_context · unsupported · unknown · error`

**Unknown is a valid result. Fabrication is not.**

## The six intents

| Intent | Contract |
|---|---|
| **Why** | Explain known or inferred reasons while declaring the basis. |
| **Evidence** | Return source-addressable support, contradictions, and gaps. |
| **Compare** | Preserve options, criteria, missing dimensions, and tradeoffs. |
| **Challenge** | Produce the strongest reasonable countercase to the conclusion. |
| **Confidence** | Declare what kind of uncertainty is being represented; never fake calibration. |
| **Provenance** | Distinguish recorded lineage from inferred narrative and unknown segments. |

## Truth is part of the protocol

A WGD-compatible resolver must not:

- invent hidden model rationale;
- manufacture evidence or citations;
- claim provenance that was not recorded or supplied;
- present model self-confidence as empirical calibration;
- silently pull hidden application context;
- return arbitrary executable HTML as reasoning output.

See [`WGD_PROTOCOL.md`](./WGD_PROTOCOL.md) for normative rules.

## Capability discovery

A resolver SHOULD answer `GET` with a capability manifest:

```json
{
  "wgdVersion": "0.1",
  "resolver": "risk-gateway",
  "intents": {
    "why": {"supported": true},
    "evidence": {"supported": true, "sourceBacked": true},
    "compare": {"supported": true},
    "challenge": {"supported": true},
    "confidence": {"supported": true, "modes": ["empirical_calibration"]},
    "provenance": {"supported": true, "depth": "source-transform-model-output"}
  }
}
```

Hosts should not offer an intent the resolver cannot truthfully support.

## Conformance

Run the repository-local protocol conformance CLI against any resolver:

```bash
node packages/conformance/cli.mjs https://your-app.example/api/wgd
```

It checks capability discovery, envelope preservation, all six intent fixtures, Evidence sourcing, Why basis, Confidence calibration semantics, Provenance lineage, and unsupported-version rejection.

The independent public runner executes the same semantic class of checks over HTTP against the production resolver:

`https://wgd-conformance-proof.vercel.app/api/check`

`@wgd-ai/conformance` remains repo-local until the new npm package is separately authorized for trusted publishing. The existing core, icons, and React packages are already published at alpha.3.

Passing conformance is necessary, but semantic truthfulness still depends on the resolver accurately representing the system it fronts.

## Vanilla HTML

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
  data-wgd-type="claim"
  data-wgd-context='{"facts":{"currentPrice":135.75,"observedRange":[141,168]}}'
  data-wgd-permissions='{"allowedSources":["price-history"],"allowExternalLookup":false}'>
  Lowest price in 60 days
</span>
```

## Packages

```bash
npm install @wgd-ai/react@alpha
npm install @wgd-ai/core@alpha
npm install @wgd-ai/icons@alpha
```

- `@wgd-ai/core` — protocol types and provider-neutral resolver runtime
- `@wgd-ai/react` — React reasoning affordances
- `@wgd-ai/icons` — self-contained primitive icons
- `packages/conformance` — repo-local WGD Protocol v0.1 conformance CLI

## Reference implementation

- `examples/protocol-v0.1/decision.json` — one decision object for all six intents
- `examples/basic.html` — vanilla integration
- `examples/react-install-proof` — external npm consumer proof
- `examples/conformance-proof/api/check.js` — independent live conformance runner
- `api/wgd.js` — deterministic public demo resolver
- `schema/` — JSON Schemas

## What v0.1 deliberately does not do

No arbitrary custom verbs. No agent orchestration. No tool execution. No hidden context discovery. No standardized streaming. No memory layer.

First make six semantics exceptionally difficult to misunderstand.

## License

MIT. See `LICENSE`.
