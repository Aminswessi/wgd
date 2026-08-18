# @wgd-ai/react

React components for WGD reasoning affordances.

## Install

```bash
npm install @wgd-ai/react@alpha
```

## Smallest working example

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
      { label: "support", detail: "Evidence supplied by the host application." }
    ]
  })
};

<Wgd
  intent="evidence"
  label="Show the evidence"
  context={{ claim: "Lowest price in 60 days" }}
  config={config}
>
  <strong>Lowest price in 60 days</strong>
</Wgd>
```

For production, replace the local resolver with a server endpoint:

```tsx
const config = { endpoint: "/api/wgd" };
```

WGD never requires a provider API key in the browser. Your host decides what explicit context is supplied and what server-side reasoning system resolves the request.

Live external install proof: https://wgd-react-install-proof.vercel.app
