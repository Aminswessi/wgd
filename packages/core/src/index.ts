export const WGD_INTENTS = [
  "why",
  "evidence",
  "compare",
  "challenge",
  "confidence",
  "provenance",
] as const;

export type WgdIntent = (typeof WGD_INTENTS)[number];
export type WgdContext = Record<string, unknown>;

export type WgdReason = {
  label: string;
  detail: string;
};

export type WgdResponse = {
  version: "1";
  requestId: string;
  intent: WgdIntent;
  status: "ok" | "insufficient_context" | "unsupported" | "unknown";
  title: string;
  reasons: WgdReason[];
  caveats?: string[];
};

export type WgdRequest = {
  version: "1";
  requestId: string;
  intent: WgdIntent;
  subject?: { id?: string; type?: string; label?: string };
  context: WgdContext;
};

export type WgdResolver = (
  request: WgdRequest,
  signal?: AbortSignal,
) => Promise<WgdResponse>;

export type WgdConfig = {
  resolver?: WgdResolver;
  endpoint?: string;
  headers?: Record<string, string>;
};

export const WGD_VERSION = "0.12.0-alpha.1";

export async function resolveWgd(
  request: WgdRequest,
  config: WgdConfig,
  signal?: AbortSignal,
): Promise<WgdResponse> {
  if (config.resolver) return config.resolver(request, signal);
  if (config.endpoint) {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {"content-type":"application/json", ...(config.headers ?? {})},
      body: JSON.stringify(request),
      signal,
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`WGD endpoint returned ${response.status}`);
    return response.json() as Promise<WgdResponse>;
  }
  return {
    version:"1",
    requestId:request.requestId,
    intent:request.intent,
    status:"insufficient_context",
    title:request.subject?.label ?? request.intent,
    reasons:[{label:"WGD installed",detail:"No resolver or endpoint is configured. Nothing was transmitted."}],
  };
}
