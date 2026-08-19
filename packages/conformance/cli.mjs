#!/usr/bin/env node

const endpoint = process.argv[2];
if (!endpoint) {
  console.error("Usage: wgd-conformance <resolver-url>");
  process.exit(2);
}

const VERSION = "0.1";
const intents = ["why","evidence","compare","challenge","confidence","provenance"];
const statuses = new Set(["ok","partial","insufficient_context","unsupported","unknown","error"]);
const confidenceKinds = new Set(["empirical_calibration","prediction_interval","model_reported","evidence_strength","model_disagreement","qualitative_uncertainty","unknown"]);
let passed = 0;
let failed = 0;

const fixtures = {
  why: {facts:{dimensionsFit:true,price:428,budget:500},signals:["linen","oak"]},
  evidence: {facts:{observedRange:[141,168],currentPrice:135.75,marketplacesIncluded:false}},
  compare: {options:[{name:"A",price:286},{name:"B",price:244}],criteria:["price","distance"]},
  challenge: {facts:{supportSentiment:"healthy",cancellationRequest:false}},
  confidence: {calibration:{confidence:0.74,basis:"180 historical predictions"}},
  provenance: {origin:"host-recorded-source",inputs:["catalog-record","room-dimensions"],unknowns:["lighting transform"]}
};

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
    context: fixtures[intent],
    permissions: {allowedSources:["price-history","host-recorded-source"],allowExternalLookup:false}
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

    if (intent === "why") {
      if (!Array.isArray(body.data.reasons) || !["observed","supplied","inferred","unknown"].includes(body.data.basis)) fail("why: basis declared", "reasons array and basis are required");
      else ok("why: basis declared");
    }

    if (intent === "evidence") {
      if (!Array.isArray(body.data.items) || !Array.isArray(body.data.gaps) || !Array.isArray(body.data.contradictions)) fail("evidence: structured evidence", "items, gaps, and contradictions arrays required");
      else if (body.data.items.some(item => !item.source)) fail("evidence: source-addressable", "fixture evidence must include source identifiers");
      else { ok("evidence: structured evidence"); ok("evidence: source-addressable"); }
    }

    if (intent === "compare") {
      if (!Array.isArray(body.data.options) || body.data.options.length < 2 || !Array.isArray(body.data.dimensions)) fail("compare: decision space", "options and dimensions are required");
      else ok("compare: decision space");
    }

    if (intent === "challenge") {
      if (typeof body.data.countercase !== "string" || !Array.isArray(body.data.arguments)) fail("challenge: countercase", "countercase and arguments are required");
      else ok("challenge: countercase");
    }

    if (intent === "confidence") {
      if (!confidenceKinds.has(body.data.kind)) fail("confidence: kind declared", "missing or invalid confidence kind");
      else ok("confidence: kind declared");
      if (body.data.kind !== "empirical_calibration") fail("confidence: calibration fixture", "fixture should remain empirical_calibration when basis is supplied");
      else if (!body.data.basis) fail("confidence: calibration basis", "empirical calibration requires basis");
      else { ok("confidence: calibration fixture"); ok("confidence: calibration basis"); }
    }

    if (intent === "provenance") {
      if (typeof body.data.recorded !== "boolean" || !Array.isArray(body.data.nodes) || !Array.isArray(body.data.edges) || !Array.isArray(body.data.unknownSegments)) fail("provenance: lineage declaration", "recorded, nodes, edges, and unknownSegments required");
      else if (body.data.recorded !== true) fail("provenance: recorded lineage", "host-recorded fixture must remain marked recorded");
      else { ok("provenance: lineage declaration"); ok("provenance: recorded lineage"); }
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
