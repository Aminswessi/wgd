# WGD Protocol v0.1

> An open interaction protocol for reasoning over application state.

WGD defines a small, provider-neutral contract between an existing application object and a reasoning resolver. The protocol is independent of React, JavaScript, any model vendor, and any rendering library.

The v0.1 vocabulary is deliberately limited to six intents:

- `why`
- `evidence`
- `compare`
- `challenge`
- `confidence`
- `provenance`

No additional intents are normative in v0.1.

## 1. Design goals

A conforming WGD implementation MUST:

1. attach reasoning to an existing application subject;
2. send only explicit, authorized context;
3. distinguish sourced facts from generated explanation;
4. represent unknown, unsupported, partial, and insufficient-context states explicitly;
5. never fabricate hidden rationale, evidence, provenance, or calibrated confidence;
6. remain provider-neutral;
7. return structured data that can be safely rendered without arbitrary HTML;
8. be implementable without the official WGD UI packages.

The protocol is intentionally small. v0.1 is not an agent framework, orchestration system, prompt library, or application shell.

## 2. Request envelope

Every request MUST contain:

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
  "context": {},
  "permissions": {
    "allowedSources": ["price-history"],
    "allowExternalLookup": false
  }
}
```

### `subject`

The subject is the application object the user is acting on. It SHOULD be stable enough to identify the object within the host application.

Common non-normative subject types include `claim`, `recommendation`, `decision`, `prediction`, and `artifact`.

### `context`

`context` MUST contain only data intentionally supplied by the host application. A resolver MUST NOT scrape unrelated DOM state, browser storage, or hidden application state unless the host explicitly includes it.

### `permissions`

The host MAY constrain data access. A resolver MUST respect those constraints. If required information is unavailable because of permissions, the correct response is `insufficient_context` or `partial`, not fabrication.

## 3. Response envelope

Every response MUST contain:

```json
{
  "version": "0.1",
  "requestId": "req_123",
  "intent": "evidence",
  "status": "ok",
  "title": "Evidence for lowest-price claim",
  "summary": "The current price is below the observed retailer history.",
  "data": {},
  "caveats": []
}
```

`status` MUST be one of:

- `ok`
- `partial`
- `insufficient_context`
- `unsupported`
- `unknown`
- `error`

`summary` is explanatory prose. It MUST NOT be used as the sole carrier of evidence, provenance, or calibrated confidence when structured data is available.

## 4. Capability manifest

A resolver SHOULD expose a capability manifest before interaction:

```json
{
  "wgdVersion": "0.1",
  "resolver": "risk-gateway",
  "intents": {
    "why": {"supported": true},
    "evidence": {"supported": true, "sourceBacked": true},
    "compare": {"supported": true},
    "challenge": {"supported": true},
    "confidence": {
      "supported": true,
      "modes": ["uncertainty", "empirical_calibration"]
    },
    "provenance": {
      "supported": true,
      "depth": "source-transform-model-output"
    }
  }
}
```

Hosts SHOULD hide or disable unsupported intents rather than rendering controls that can only return invented answers.

## 5. Intent semantics

### 5.1 Why

Purpose: explain why the subject appeared, changed, ranked, or was recommended.

A `why` response MUST distinguish known host-supplied causes from inferred explanation.

If the underlying system does not expose its actual rationale, the resolver MUST NOT present a generated rationale as historical fact.

Recommended `data` fields:

- `reasons[]`
- `basis`: `observed | supplied | inferred`
- `unknowns[]`

### 5.2 Evidence

Purpose: expose facts, sources, and gaps supporting or contradicting a claim or decision.

Evidence MUST be source-addressable when a source exists.

Generated prose MUST NOT be labeled as evidence.

Recommended `data` fields:

- `items[]`: `{id, claim, source, strength, direction}`
- `gaps[]`
- `contradictions[]`

### 5.3 Compare

Purpose: expose meaningful differences and tradeoffs among alternatives.

A compare resolver SHOULD preserve the host's decision criteria and SHOULD identify missing dimensions instead of silently inventing them.

Recommended `data` fields:

- `options[]`
- `dimensions[]`
- `tradeoffs[]`
- `missing[]`

### 5.4 Challenge

Purpose: produce the strongest reasonable countercase to the subject's recommendation, conclusion, or proposed action.

Challenge MUST be adversarial to the conclusion, not to the user.

A challenge response SHOULD identify what evidence would strengthen or weaken the countercase.

Recommended `data` fields:

- `countercase`
- `arguments[]`
- `strengtheners[]`
- `weaknesses[]`

### 5.5 Confidence

Purpose: characterize uncertainty without fake precision.

A resolver MUST label the kind of confidence it is reporting.

Allowed v0.1 confidence kinds:

- `empirical_calibration`
- `prediction_interval`
- `model_reported`
- `evidence_strength`
- `model_disagreement`
- `qualitative_uncertainty`
- `unknown`

A numeric value MUST NOT be presented as empirically calibrated unless calibration evidence exists.

Recommended `data` fields:

```json
{
  "kind": "empirical_calibration",
  "value": 0.74,
  "basis": "180 historical predictions",
  "interval": null,
  "limitations": []
}
```

### 5.6 Provenance

Purpose: expose actual lineage of an output.

A provenance response SHOULD represent machine-readable lineage when available:

`source -> transformation -> model/tool -> intermediate -> output`

A resolver MUST distinguish recorded lineage from inferred narrative.

Recommended `data` fields:

- `nodes[]`
- `edges[]`
- `recorded`: boolean
- `unknownSegments[]`

## 6. Truth semantics

Truthfulness is a protocol property.

A conforming resolver MUST NOT:

- invent a hidden model rationale;
- manufacture citations or evidence;
- claim provenance that was not recorded or supplied;
- convert model self-confidence into calibrated probability;
- silently fill missing application context;
- render generated statements as host facts.

`unknown` is a valid successful outcome.

## 7. Errors and partial results

Use `partial` when some requested semantics are available and others are not.

Use `insufficient_context` when the resolver could answer if additional authorized context were supplied.

Use `unsupported` when the resolver does not implement the requested intent or mode.

Use `unknown` when the requested answer cannot be established from available information.

Use `error` for operational failures.

## 8. Security and data boundaries

Resolvers MUST treat host-supplied context as untrusted input.

At minimum, implementations SHOULD address:

- prompt injection embedded in context;
- sensitive-data leakage;
- forged source metadata;
- malicious resolver output;
- oversized context;
- arbitrary HTML/script output;
- unauthorized external lookup;
- stale or mismatched subject identifiers.

Official renderers MUST escape untrusted strings and MUST NOT render arbitrary resolver-supplied HTML by default.

## 9. Latency and cancellation

Clients SHOULD support cancellation using the host platform's native cancellation mechanism.

A resolver SHOULD return a normalized timeout/error state rather than hanging indefinitely.

Streaming is non-normative in v0.1. A future version MAY define a streaming envelope without changing the semantic contracts above.

## 10. Versioning

The protocol version is independent of package versions.

v0.1 clients MUST send `version: "0.1"`.

Resolvers MUST reject unsupported protocol versions explicitly rather than silently interpreting them as another version.

## 11. Accessibility

WGD is not tied to a visual control, but conforming UI implementations SHOULD:

- use native interactive elements;
- provide an accessible name for each intent;
- expose expanded/collapsed state;
- support keyboard activation and Escape dismissal where popovers are used;
- return focus to the invoking control;
- avoid color-only state communication;
- preserve host zoom, text scaling, and reduced-motion preferences.

## 12. Conformance

A resolver may call itself **WGD Protocol v0.1 compatible** only if it:

1. validates the request envelope;
2. returns only defined v0.1 statuses;
3. implements declared capability behavior truthfully;
4. preserves request IDs and intent identity;
5. supports explicit unknown/unsupported/insufficient-context outcomes;
6. follows the truth rules for every implemented intent;
7. returns structured output rather than arbitrary executable markup;
8. rejects unsupported protocol versions;
9. respects host permissions and context boundaries.

A future `@wgd-ai/conformance` package should automate these checks.

## 13. Reference decision object

The reference fixture in `examples/protocol-v0.1/decision.json` represents one account-risk decision. All six intents operate on the same subject so implementations can demonstrate semantic consistency rather than six unrelated demos.

## 14. Non-goals for v0.1

The following are intentionally deferred:

- arbitrary developer-defined verbs;
- autonomous agent orchestration;
- tool execution;
- workflow replacement;
- hidden context discovery;
- standardized streaming;
- persistence or memory;
- model selection policy.

The test for v0.1 is simple:

> Can an engineer implement a WGD-compatible resolver from this document and the schemas without asking what the six intents mean?
