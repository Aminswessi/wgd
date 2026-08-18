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

export type WgdItem = {
  title: string;
  detail: string;
};

export type WgdResponse = {
  title: string;
  heading?: string;
  items: WgdItem[];
};

export type WgdRequest = {
  version: string;
  intent: WgdIntent;
  id?: string;
  label?: string;
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
      headers: {
        "content-type": "application/json",
        ...(config.headers ?? {}),
      },
      body: JSON.stringify(request),
      signal,
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`WGD endpoint returned ${response.status}`);
    }
    return response.json() as Promise<WgdResponse>;
  }

  return {
    title: request.label ?? request.intent,
    items: [{
      title: "WGD installed",
      detail: "No resolver or endpoint is configured. Nothing was transmitted.",
    }],
  };
}
