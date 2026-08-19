#!/usr/bin/env node

const endpoint = process.argv[2];
if (!endpoint) {
  console.error("Usage: wgd-conformance <resolver-url>");
  process.exit(2);
}

const VERSION = "0.1";
const intents = ["why","evidence","compare","challenge","confidence","provenance"];
const statuses = new Set(["ok","partial","insufficient_context","unsupported","unknown","error"]);
let passed = 0;
let failed = 0;

function ok(label) { passed++; console.log(`✓ ${label}`); }
function fail(label, detail) { failed++; console.log(`✗ ${label}${detail ? ` — ${detail}` : ""}`); }
function isObject(v) { return v && typeof v === "object" && !Array.isArray(v); }

function validateEnvelope(result, request) {
  if (!isObject(result)) return "response is not an object";
  if (result.version !== VERSION) return `version must be ${VERSION}`;
  if (result.requestId !== request.requestId) return "requestId was not preserved";
  if (result.intent !== request.intent) return "intent was not preserved";
  if (!statuses.has(result.status)) return "invalid status";
  if (typeof result.title !== "string" || !result.title) return "title is required";
  if (!isObject(result.data)) return "data must be an object";
  if (result.caveats != null && !Array.isArray(result.caveats)) return "caveats must be an array";
  return null;
}

async function json(url, init) {
  const response = await fetch(url, init);
  let body;
  try { body = await response.json(); } catch { body = null; }
  return {response, body};
}

console.log(`WGD Protocol v${VERSION} conformance`);
console.log(`Resolver: ${endpoint}\n`);

try {
  const {response, body} = await json(endpoint);
  if (!response.ok || !isObject(body) || body.wgdVersion !== VERSION || !isObject(body.intents)) {
    fail("Capability manifest", `GET must return wgdVersion ${VERSION} and intents`);
  } else {
    ok("Capability manifest");
    for (const intent of intents) {
      if (!isObject(body.intents[intent]) || typeof body.intents[intent].supported !== "boolean") fail(`Capability: ${intent}`, "missing supported boolean");
      else ok(`Capability: ${intent}`);
    }
  }
} catch (error) {
  fail("Capability manifest", error.message);
}

for (const intent of intents) {
  const request = {
    version: VERSION,
    requestId: `conformance-${intent}-${Date.now()}`,
    intent,
    subject: {id:"conformance-object",type:"claim",label:"Conformance object"},
    context: {},
    permissions: {allowedSources:[],allowExternalLookup:false}
  };

  try {
    const {response, body} = await json(endpoint, {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request)});
    if (!response.ok) {
      fail(`${intent}: protocol envelope`, `HTTP ${response.status}`);
      continue;
    }
    const error = validateEnvelope(body, request);
    if (error) { fail(`${intent}: protocol envelope`, error); continue; }
    ok(`${intent}: protocol envelope`);

    if (intent === "confidence" && ["ok","partial"].includes(body.status)) {
      const kinds = new Set(["empirical_calibration","prediction_interval","model_reported","evidence_strength","model_disagreement","qualitative_uncertainty","unknown"]);
      if (!kinds.has(body.data.kind)) fail("confidence: kind declared", "missing or invalid confidence kind");
      else ok("confidence: kind declared");
      if (body.data.kind === "empirical_calibration" && !body.data.basis) fail("confidence: calibration basis", "empirical calibration requires basis");
      else if (body.data.kind === "empirical_calibration") ok("confidence: calibration basis");
    }

    if (intent === "evidence" && ["ok","partial"].includes(body.status)) {
      if (!Array.isArray(body.data.items) || !Array.isArray(body.data.gaps)) fail("evidence: structured evidence", "items and gaps arrays required");
      else ok("evidence: structured evidence");
    }

    if (intent === "provenance" && ["ok","partial"].includes(body.status)) {
      if (typeof body.data.recorded !== "boolean" || !Array.isArray(body.data.nodes) || !Array.isArray(body.data.edges)) fail("provenance: lineage declaration", "recorded, nodes, and edges required");
      else ok("provenance: lineage declaration");
    }
  } catch (error) {
    fail(`${intent}: protocol envelope`, error.message);
  }
}

try {
  const request = {version:"9.9",requestId:"bad-version",intent:"why",context:{}};
  const {response, body} = await json(endpoint, {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(request)});
  if (response.ok || body?.data?.error?.code !== "UNSUPPORTED_VERSION") fail("Unsupported version rejection", "resolver must explicitly reject unsupported protocol versions");
  else ok("Unsupported version rejection");
} catch (error) {
  fail("Unsupported version rejection", error.message);
}

console.log(`\n${passed} passed · ${failed} failed`);
if (failed) process.exit(1);
