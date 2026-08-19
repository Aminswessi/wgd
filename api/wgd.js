import { openAiConfigured, reasonWithOpenAI } from "./openai-resolver.js";

const VERSION = "0.1";
const INTENTS = new Set(["why", "evidence", "compare", "challenge", "confidence", "provenance"]);

function capabilities() {
  return {
    wgdVersion: VERSION,
    resolver: "wgd-public-reference",
    demoOnly: true,
    productionRecommendation: "bring-your-own-resolver",
    engine: openAiConfigured() ? "openai" : "deterministic-demo",
    model: openAiConfigured() ? (process.env.WGD_OPENAI_MODEL || "gpt-5.6-luna") : null,
    intents: {
      why: { supported: true, llmReasoning: openAiConfigured() },
      evidence: { supported: true, sourceBacked: true, llmReasoning: openAiConfigured() },
      compare: { supported: true, llmReasoning: openAiConfigured() },
      challenge: { supported: true, llmReasoning: openAiConfigured() },
      confidence: { supported: true, modes: ["empirical_calibration", "qualitative_uncertainty"], llmReasoning: openAiConfigured() },
      provenance: { supported: true, depth: "source-transform-output", llmReasoning: false }
    }
  };
}

function setHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}
function validObject(value) { return value && typeof value === "object" && !Array.isArray(value); }
function validRequest(body) { return validObject(body) && body.version === VERSION && typeof body.requestId === "string" && body.requestId.length > 0 && INTENTS.has(body.intent) && validObject(body.context) && (!body.permissions || validObject(body.permissions)); }
function base(body, status, title, summary, data, caveats = []) { return { version: VERSION, requestId: body.requestId, intent: body.intent, status, title: title || body.subject?.label || body.intent, summary, data, caveats }; }

function deterministic(body) {
  const context = body.context || {};
  const facts = validObject(context.facts) ? context.facts : {};
  switch (body.intent) {
    case "evidence": {
      const items = [], gaps = [];
      if (Array.isArray(facts.observedRange)) items.push({ id: "observed-range", claim: `Observed retailer range: $${facts.observedRange[0]}–$${facts.observedRange[1]}.`, source: "price-history", strength: "direct", direction: "supports" });
      if (facts.currentPrice != null) items.push({ id: "current-price", claim: `Current price: $${facts.currentPrice}.`, source: "price-history", strength: "direct", direction: "supports" });
      if (facts.marketplacesIncluded === false) gaps.push("Third-party marketplaces were not included.");
      return base(body, items.length ? (gaps.length ? "partial" : "ok") : "insufficient_context", null, items.length ? "Evidence is limited to host-supplied price history." : "No source-backed evidence was supplied.", { items, gaps, contradictions: [] });
    }
    case "compare": {
      const options = Array.isArray(context.options) ? context.options : [];
      const dimensions = Array.isArray(context.criteria) ? context.criteria : [];
      if (options.length < 2) return base(body, "insufficient_context", null, "At least two options are required.", { options, dimensions, tradeoffs: [], missing: ["second option"] });
      return base(body, "ok", null, "Comparison uses only host-supplied options and criteria.", { options, dimensions, tradeoffs: [], missing: [] });
    }
    case "why": {
      const reasons = [];
      if (facts.dimensionsFit === true) reasons.push({ label: "fit", detail: "The supplied dimensions fit.", basis: "supplied" });
      if (facts.price != null && facts.budget != null) reasons.push({ label: "budget", detail: `$${facts.price} is within the supplied $${facts.budget} budget.`, basis: "supplied" });
      if (Array.isArray(context.signals) && context.signals.length) reasons.push({ label: "signals", detail: `${context.signals.length} host-supplied preference signal(s) contributed.`, basis: "supplied" });
      return base(body, reasons.length ? "ok" : "insufficient_context", null, reasons.length ? "These are host-supplied reasons, not reconstructed hidden rationale." : "No explicit rationale was supplied.", { reasons, basis: reasons.length ? "supplied" : "unknown", unknowns: reasons.length ? [] : ["underlying rationale"] });
    }
    case "challenge": {
      const args = [];
      if (facts.supportSentiment === "healthy") args.push("Support sentiment remains healthy.");
      if (facts.cancellationRequest === false) args.push("There is no cancellation request.");
      if (!args.length) return base(body, "insufficient_context", null, "No counterevidence was supplied.", { countercase: null, arguments: [], strengtheners: [], weaknesses: ["insufficient context"] });
      return base(body, "ok", null, "The strongest reasonable countercase uses only supplied counterevidence.", { countercase: "Delay escalation until another negative signal appears.", arguments: args, strengtheners: ["Additional positive usage or renewal signals"], weaknesses: ["A new cancellation or material usage decline would weaken this countercase"] });
    }
    case "confidence": {
      if (validObject(context.calibration) && typeof context.calibration.confidence === "number") {
        const basis = context.calibration.basis || null;
        return base(body, basis ? "ok" : "partial", null, basis ? "Host supplied an empirically calibrated confidence value and its basis." : "A numeric confidence was supplied without calibration evidence.", { kind: basis ? "empirical_calibration" : "model_reported", value: context.calibration.confidence, basis, interval: context.calibration.interval || null, limitations: basis ? [] : ["Calibration basis not supplied"] }, basis ? [] : ["Numeric confidence must not be interpreted as empirically calibrated."]);
      }
      const knowns = Array.isArray(context.knowns) ? context.knowns : [];
      const unknowns = Array.isArray(context.unknowns) ? context.unknowns : [];
      return base(body, knowns.length || unknowns.length ? "partial" : "unknown", null, "No calibrated probability is available.", { kind: "qualitative_uncertainty", value: null, basis: null, knowns, unknowns, limitations: ["No calibration data supplied"] });
    }
    case "provenance": {
      const nodes = [], edges = [];
      if (context.origin) nodes.push({ id: "origin", kind: "source", label: String(context.origin) });
      if (Array.isArray(context.inputs)) context.inputs.forEach((input, index) => nodes.push({ id: `input-${index}`, kind: "source", label: String(input) }));
      if (nodes.length) { nodes.forEach(node => edges.push({ from: node.id, to: "output", relation: "contributed_to" })); nodes.push({ id: "output", kind: "output", label: body.subject?.label || "output" }); }
      const unknownSegments = Array.isArray(context.unknowns) ? context.unknowns.map(String) : [];
      return base(body, nodes.length ? (unknownSegments.length ? "partial" : "ok") : "unknown", null, nodes.length ? "Provenance reflects recorded host-supplied lineage only." : "No recorded lineage was supplied.", { nodes, edges, recorded: nodes.length > 0, unknownSegments });
    }
  }
}

function errorResponse(body, code, message) { return { version: VERSION, requestId: body?.requestId || "unknown", intent: INTENTS.has(body?.intent) ? body.intent : "why", status: "error", title: "WGD protocol error", summary: message, data: { error: { code, message } }, caveats: [] }; }
function shouldUseModel(body) {
  if (!openAiConfigured()) return false;
  if (body.intent === "provenance") return false;
  if (body.intent === "confidence" && validObject(body.context?.calibration) && typeof body.context.calibration.confidence === "number") return false;
  return true;
}

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(200).json(capabilities());
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (req.body?.version !== VERSION) return res.status(400).json(errorResponse(req.body, "UNSUPPORTED_VERSION", `Expected WGD Protocol ${VERSION}`));
  if (!validRequest(req.body)) return res.status(400).json(errorResponse(req.body, "INVALID_REQUEST", "Invalid WGD Protocol v0.1 request"));
  if (Buffer.byteLength(JSON.stringify(req.body.context), "utf8") > 24000) return res.status(413).json(errorResponse(req.body, "CONTEXT_TOO_LARGE", "Context exceeds the 24 KB gateway limit"));

  if (shouldUseModel(req.body)) {
    try {
      const result = await reasonWithOpenAI(req.body);
      return res.status(200).json(base(req.body, result.status, null, result.summary, result.data, result.caveats));
    } catch (error) {
      const code = error?.name === "AbortError" ? "MODEL_TIMEOUT" : "MODEL_ERROR";
      return res.status(code === "MODEL_TIMEOUT" ? 504 : 502).json(errorResponse(req.body, code, error?.message || "Model resolver failed"));
    }
  }

  return res.status(200).json(deterministic(req.body));
}
