import { getAiProviderPreset, type AiProvider, type AiTransport } from "./providers";

export type AiSettings = {
  provider?: AiProvider;
  apiKey: string;
  model: string;
  endpoint: string;
};

export type AiPayload = Record<string, unknown>;

type ResponseContent = {
  type?: string;
  text?: string;
};

type ResponseOutput = {
  content?: ResponseContent[];
};

type ResponsesPayload = {
  output_text?: string;
  output?: ResponseOutput[];
  choices?: Array<{ message?: { content?: string } }>;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  content?: Array<{ type?: string; text?: string }>;
};

export function parseAiPayload(payload: ResponsesPayload): AiPayload {
  const text = extractAiText(payload);
  const repairedText = repairJsonText(text);

  try {
    return JSON.parse(repairedText) as AiPayload;
  } catch {
    return { raw: text };
  }
}

export async function requestAiJson(prompt: string, settings: AiSettings): Promise<AiPayload> {
  const preset = getAiProviderPreset(settings.provider);
  const endpoint = resolveEndpoint(settings.endpoint || preset.defaultEndpoint, settings.model);
  const request = buildAiRequest(prompt, settings, preset.transport);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(request.body),
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ResponsesPayload;
  return parseAiPayload(payload);
}

type AiRequest = {
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

function buildAiRequest(prompt: string, settings: AiSettings, transport: AiTransport): AiRequest {
  if (transport === "chat-completions") {
    return {
      headers: bearerHeaders(settings.apiKey),
      body: {
        model: settings.model,
        messages: [{ role: "user", content: prompt }],
      },
    };
  }

  if (transport === "gemini") {
    return {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": settings.apiKey,
      },
      body: {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      },
    };
  }

  if (transport === "anthropic") {
    return {
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": settings.apiKey,
      },
      body: {
        model: settings.model,
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }],
      },
    };
  }

  return {
    headers: bearerHeaders(settings.apiKey),
    body: {
      model: settings.model,
      input: prompt,
    },
  };
}

function bearerHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function resolveEndpoint(endpoint: string, model: string): string {
  return endpoint.replaceAll("{model}", encodeURIComponent(model));
}

function extractAiText(payload: ResponsesPayload): string {
  if (payload.output_text) return payload.output_text.trim();

  const fromOutput = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();

  if (fromOutput) return fromOutput;

  const fromChat = payload.choices?.[0]?.message?.content?.trim();
  if (fromChat) return fromChat;

  const fromGemini = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("\n")
    .trim();
  if (fromGemini) return fromGemini;

  const fromAnthropic = payload.content
    ?.filter((item) => item.type === "text" || item.text)
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();
  if (fromAnthropic) return fromAnthropic;

  return "";
}

function repairJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return trimmed;
}
