const INTENTS = new Set(["why", "evidence", "compare", "challenge", "confidence", "provenance"]);

function setHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function validRequest(body) {
  return body &&
    body.version === "1" &&
    typeof body.requestId === "string" &&
    INTENTS.has(body.intent) &&
    body.context &&
    typeof body.context === "object" &&
    !Array.isArray(body.context);
}

function reason(body) {
  const context = body.context || {};
  const facts = context.facts || {};
  const reasons = [];

  switch (body.intent) {
    case "evidence":
      if (Array.isArray(facts.observedRange)) {
        reasons.push({ label: "support", detail: `Observed range: $${facts.observedRange[0]}–$${facts.observedRange[1]}.` });
      }
      if (facts.currentPrice != null) {
        reasons.push({ label: "current", detail: `Current price: $${facts.currentPrice}.` });
      }
      if (facts.marketplacesIncluded === false) {
        reasons.push({ label: "gap", detail: "Third-party marketplaces were not included." });
      }
      break;

    case "compare": {
      const options = Array.isArray(context.options) ? context.options : [];
      if (options.length >= 2) {
        reasons.push({ label: "options", detail: `Comparing ${options.map((option) => option.name || "option").join(" vs ")}.` });
      }
      if (Array.isArray(context.criteria)) {
        reasons.push({ label: "criteria", detail: `Criteria: ${context.criteria.join(", ")}.` });
      }
      break;
    }

    case "why":
      if (facts.dimensionsFit === true) reasons.push({ label: "fit", detail: "The supplied dimensions fit." });
      if (facts.price != null && facts.budget != null) reasons.push({ label: "budget", detail: `$${facts.price} is within the supplied $${facts.budget} budget.` });
      if (Array.isArray(context.signals) && context.signals.length) reasons.push({ label: "signal", detail: `${context.signals.length} host-supplied preference signal(s) contributed.` });
      break;

    case "challenge":
      if (facts.supportSentiment === "healthy") reasons.push({ label: "countercase", detail: "Support sentiment remains healthy." });
      if (facts.cancellationRequest === false) reasons.push({ label: "countercase", detail: "There is no cancellation request." });
      if (reasons.length) reasons.push({ label: "alternative", detail: "Delay escalation until another negative signal appears." });
      break;

    case "confidence":
      if (context.calibration && context.calibration.confidence != null) {
        reasons.push({ label: "calibrated", detail: `Host-supplied calibrated confidence: ${Math.round(context.calibration.confidence * 100)}%.` });
      }
      if (Array.isArray(context.knowns) && context.knowns.length) reasons.push({ label: "knowns", detail: `${context.knowns.join(", ")}.` });
      if (Array.isArray(context.unknowns) && context.unknowns.length) reasons.push({ label: "unknowns", detail: `${context.unknowns.join(", ")}.` });
      break;

    case "provenance":
      if (context.origin) reasons.push({ label: "origin", detail: String(context.origin) });
      if (Array.isArray(context.inputs) && context.inputs.length) reasons.push({ label: "inputs", detail: `${context.inputs.join(", ")}.` });
      if (Array.isArray(context.unknowns) && context.unknowns.length) reasons.push({ label: "unknown", detail: `${context.unknowns.join(", ")}.` });
      break;
  }

  return {
    version: "1",
    requestId: body.requestId,
    intent: body.intent,
    status: reasons.length ? "ok" : "insufficient_context",
    title: body.subject?.label || body.intent,
    reasons,
    meta: {
      generatedAt: new Date().toISOString(),
      provider: "wgd-public-demo"
    }
  };
}

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(200).json({ ok: true, service: "wgd-demo-gateway", version: "1" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!validRequest(req.body)) {
    return res.status(400).json({
      version: "1",
      requestId: req.body?.requestId || "unknown",
      status: "error",
      error: { code: "INVALID_REQUEST", message: "Invalid WGD request" }
    });
  }

  if (Buffer.byteLength(JSON.stringify(req.body.context), "utf8") > 24000) {
    return res.status(413).json({
      version: "1",
      requestId: req.body.requestId,
      status: "error",
      error: { code: "INVALID_REQUEST", message: "Context too large" }
    });
  }

  return res.status(200).json(reason(req.body));
}
