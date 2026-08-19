# @wgd-ai/conformance

Machine-checkable conformance tests for **WGD Protocol v0.1** resolvers.

```bash
npx @wgd-ai/conformance https://example.com/api/wgd
```

The CLI checks:

- capability discovery;
- request/response envelope preservation;
- all six v0.1 intents;
- source-addressable Evidence;
- declared basis for Why;
- structured Compare decision space;
- explicit Challenge countercase;
- Confidence kind and empirical calibration basis;
- recorded-vs-unknown Provenance lineage;
- explicit rejection of unsupported protocol versions.

Passing this CLI is necessary but not sufficient for WGD conformance. Semantic truthfulness still depends on the resolver accurately representing the system it fronts. See `WGD_PROTOCOL.md` for normative requirements.
