// Server-side OpenAI reference adapter.
// Copy the production adapter from api/openai-resolver.js into your own resolver,
// or import equivalent logic in your backend. Keep OPENAI_API_KEY server-side.

import { reasonWithOpenAI } from "../../api/openai-resolver.js";

const VERSION = "0.1";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const request = req.body;

  try {
    const result = await reasonWithOpenAI(request);
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
  } catch (error) {
    return res.status(502).json({
      version: VERSION,
      requestId: request?.requestId || "unknown",
      intent: request?.intent || "why",
      status: "error",
      title: "WGD provider error",
      summary: error?.message || "Provider failed",
      data: { error: { code: "MODEL_ERROR", message: error?.message || "Provider failed" } },
      caveats: []
    });
  }
}
