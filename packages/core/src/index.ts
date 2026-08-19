export const WGD_PROTOCOL_VERSION = "0.1" as const;
export const WGD_VERSION = "0.12.0-alpha.3";

export const WGD_INTENTS = [
  "why",
  "evidence",
  "compare",
  "challenge",
  "confidence",
  "provenance",
] as const;

export const WGD_STATUSES = [
  "ok",
  "partial",
  "insufficient_context",
  "unsupported",
  "unknown",
  "error",
] as const;

export type WgdIntent = (typeof WGD_INTENTS)[number];
export type WgdStatus = (typeof WGD_STATUSES)[number];
export type WgdContext = Record<string, unknown>;

export type WgdSubject = {
  id?: string;
  type?: string;
  label?: string;
};

export type WgdPermissions = {
  allowedSources?: string[];
  allowExternalLookup?: boolean;
};

export type WgdRequest = {
  version: typeof WGD_PROTOCOL_VERSION;
  requestId: string;
  intent: WgdIntent;
  subject?: WgdSubject;
  context: WgdContext;
  permissions?: WgdPermissions;
};

export type WgdResponse = {
  version: typeof WGD_PROTOCOL_VERSION;
  requestId: string;
  intent: WgdIntent;
  status: WgdStatus;
  title: string;
  summary?: string;
  data: Record<string, unknown>;
  caveats?: string[];
};

export type WgdCapability = {
  supported: boolean;
  sourceBacked?: boolean;
  modes?: string[];
  depth?: string;
};

export type WgdCapabilityManifest = {
  wgdVersion: typeof WGD_PROTOCOL_VERSION;
  resolver: string;
  intents: Record<WgdIntent, WgdCapability>;
};

export type WgdResolver = (
  request: WgdRequest,
  signal?: AbortSignal,
) => Promise<WgdResponse>;

export type WgdConfig = {
  resolver?: WgdResolver;
  endpoint?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
};

function assertProtocolResponse(value: unknown, request: WgdRequest): WgdResponse {
  if (!value || typeof value !== "object") throw new Error("WGD resolver returned a non-object response");
  const result = value as Partial<WgdResponse>;
  if (result.version !== WGD_PROTOCOL_VERSION) throw new Error(`Unsupported WGD response version: ${String(result.version)}`);
  if (result.requestId !== request.requestId) throw new Error("WGD response requestId mismatch");
  if (result.intent !== request.intent) throw new Error("WGD response intent mismatch");
  if (!WGD_STATUSES.includes(result.status as WgdStatus)) throw new Error("WGD response status is invalid");
  if (typeof result.title !== "string" || !result.title) throw new Error("WGD response title is required");
  if (!result.data || typeof result.data !== "object" || Array.isArray(result.data)) throw new Error("WGD response data must be an object");
  return result as WgdResponse;
}

export async function resolveWgd(
  request: WgdRequest,
  config: WgdConfig,
  signal?: AbortSignal,
): Promise<WgdResponse> {
  if (request.version !== WGD_PROTOCOL_VERSION) {
    throw new Error(`Unsupported WGD request version: ${request.version}`);
  }

  if (config.resolver) {
    return assertProtocolResponse(await config.resolver(request, signal), request);
  }

  if (config.endpoint) {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {"content-type":"application/json", ...(config.headers ?? {})},
      body: JSON.stringify(request),
      signal,
      credentials: config.credentials ?? "same-origin",
    });
    if (!response.ok) throw new Error(`WGD endpoint returned ${response.status}`);
    return assertProtocolResponse(await response.json(), request);
  }

  return {
    version: WGD_PROTOCOL_VERSION,
    requestId: request.requestId,
    intent: request.intent,
    status: "insufficient_context",
    title: request.subject?.label ?? request.intent,
    summary: "No resolver or endpoint is configured. Nothing was transmitted.",
    data: {missing: ["resolver"]},
    caveats: ["WGD installed without a reasoning resolver."],
  };
}
