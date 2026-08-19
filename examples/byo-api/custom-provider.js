// Server-side example: WGD with any provider or internal reasoning system.
// The browser points WGD at /api/wgd. This file runs on your server.

const VERSION = "0.1";
const intents = new Set(["why","evidence","compare","challenge","confidence","provenance"]);

async function providerReason(request) {
  // Replace this with Anthropic, Gemini, Bedrock, Azure, an internal model,
  // deterministic business logic, or your own gateway.
  // Never expose provider credentials to the browser.
  return {
    status: "unknown",
    summary: "No provider adapter has been implemented yet.",
    data: { missing: ["provider implementation"] },
    caveats: []
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      wgdVersion: VERSION,
      resolver: "your-resolver",
      byoProvider: true,
      intents: Object.fromEntries([...intents].map(intent => [intent, { supported: true }]))
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const request = req.body;
  if (!request || request.version !== VERSION || !intents.has(request.intent) || !request.context || typeof request.context !== "object") {
    return res.status(400).json({
      version: VERSION,
      requestId: request?.requestId || "unknown",
      intent: intents.has(request?.intent) ? request.intent : "why",
      status: "error",
      title: "WGD protocol error",
      summary: "Invalid WGD Protocol v0.1 request",
      data: { error: { code: "INVALID_REQUEST", message: "Invalid WGD Protocol v0.1 request" } },
      caveats: []
    });
  }

  const result = await providerReason(request);
  return res.status(200).json({
    version: VERSION,
    requestId: request.requestId,
    intent: request.intent,
    status: result.status,
    title: request.subject?.label || request.intent,
    summary: result.summary,
    data: result.data,
    caveats: result.caveats || []
  });
}
