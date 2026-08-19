# WGD — Bring Your Own API

WGD is provider-neutral. Production applications should use a host-owned resolver and the host's own model/provider credentials.

```text
application UI
   ↓
WGD intent + explicit context
   ↓
YOUR /api/wgd resolver
   ↓
YOUR provider / model / internal system
   ↓
WGD Protocol v0.1 response
```

The public `https://wgd-dev-alpha.vercel.app/api/wgd` endpoint is a reference/demo resolver only. Do not route production traffic through it.

## Browser configuration

```html
<script>
  window.WGD_CONFIG = {
    endpoint: "/api/wgd"
  };
</script>
<script src="https://wgd-dev-alpha.vercel.app/wgd.js" defer></script>
```

No provider key belongs in browser code.

## Host-owned resolver

Your resolver owns four things:

1. validate a WGD Protocol v0.1 request;
2. enforce context, permission, size, timeout, and source policies;
3. call your chosen reasoning system;
4. return a valid WGD Protocol response.

The resolver may use OpenAI, Anthropic, Gemini, Azure OpenAI, Bedrock, an internal model, deterministic business logic, or a combination.

## Provider contract

A provider adapter only needs to turn an approved WGD request into intent-specific structured data. WGD itself does not know or care which model produced that data.

```js
async function providerReason(request) {
  // Call your provider here using server-side credentials.
  // Return only the structured result allowed by the intent contract.
  return {
    status: "ok",
    summary: "...",
    data: {},
    caveats: []
  };
}
```

Then wrap it in the stable envelope:

```js
return {
  version: "0.1",
  requestId: request.requestId,
  intent: request.intent,
  status: result.status,
  title: request.subject?.label || request.intent,
  summary: result.summary,
  data: result.data,
  caveats: result.caveats || []
};
```

## Truth rules still apply

BYO provider does not weaken the protocol:

- Evidence must not invent sources.
- Provenance must represent recorded lineage, not model-written narrative.
- Empirical confidence must come with a real calibration basis.
- Why must not claim inaccessible hidden rationale.
- Context is explicit; the resolver must not silently scrape unrelated application state.
- Unknown, unsupported, and insufficient-context are valid outcomes.

## Reference adapters

See:

- `examples/byo-api/openai.js`
- `examples/byo-api/custom-provider.js`

These examples are intentionally server-side. Put credentials in your hosting provider's secret/environment-variable system.
