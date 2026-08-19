# WGD Protocol v0.1 — Live Proof

This file records the public proof surfaces for WGD Protocol v0.1.

## Published packages

The current alpha packages are published from GitHub Actions with npm provenance:

- `@wgd-ai/core@0.12.0-alpha.3`
- `@wgd-ai/icons@0.12.0-alpha.3`
- `@wgd-ai/react@0.12.0-alpha.3`

## Live resolver

Production resolver:

`https://wgd-dev-alpha.vercel.app/api/wgd`

`GET` returns the WGD Protocol v0.1 capability manifest. `POST` accepts v0.1 reasoning requests for Why, Evidence, Compare, Challenge, Confidence, and Provenance.

## Independent conformance proof

Public check:

`https://wgd-conformance-proof.vercel.app/api/check`

The check runs over HTTP against the production resolver, not against an in-process mock. It validates capability discovery, request/response envelope preservation, all six intent fixtures, Evidence source-addressability, Why basis declaration, Confidence calibration semantics, Provenance lineage, and unsupported-version rejection.

Verified 2026-08-19: **24 passed · 0 failed · conformant: true**.

## External npm consumer

React install proof:

`https://wgd-react-install-proof.vercel.app`

This is a separate Vite application consuming `@wgd-ai/core@0.12.0-alpha.3` and `@wgd-ai/react@0.12.0-alpha.3` from npm and using WGD Protocol v0.1 response semantics.

## Conformance CLI

The repository-local CLI is available at:

```bash
node packages/conformance/cli.mjs https://your-resolver.example/api/wgd
```

`@wgd-ai/conformance` is not yet published to npm. The first trusted-publishing attempt correctly exposed that a new npm package must be authorized before GitHub OIDC publishing can create it. Until that package is authorized, the repo-local CLI and the public independent conformance proof are canonical.
