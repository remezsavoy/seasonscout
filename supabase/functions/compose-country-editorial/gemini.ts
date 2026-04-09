type GeminiGenerateContentResponse = {
  candidates?: GeminiCandidate[];
  promptFeedback?: {
    blockReason?: string;
    blockReasonMessage?: string;
  };
  usageMetadata?: Record<string, unknown>;
};

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
};

type GeminiPart = {
  text?: string;
};

type JsonSchema = Record<string, unknown>;

export type GeminiJsonResult<T> = {
  parsed: T;
  rawText: string;
  usageMetadata: Record<string, unknown> | null;
};

const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

function unwrapJsonText(value: string) {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith('```')) {
    return trimmedValue
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  return trimmedValue;
}

function removeTrailingCommas(value: string) {
  return value.replace(/,\s*([}\]])/g, '$1');
}

function extractJsonSubstring(value: string) {
  const objectStart = value.indexOf('{');
  const objectEnd = value.lastIndexOf('}');

  if (objectStart >= 0 && objectEnd > objectStart) {
    return value.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = value.indexOf('[');
  const arrayEnd = value.lastIndexOf(']');

  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return value.slice(arrayStart, arrayEnd + 1);
  }

  return value;
}

function decodeLooseJsonStringValue(value: string) {
  return value
    .replace(/\r?\n/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseLooseObjectStringMap<T>(value: string) {
  const normalizedValue = extractJsonSubstring(unwrapJsonText(value)).trim();

  if (!normalizedValue.startsWith('{')) {
    return null;
  }

  const entryPattern = /"([^"\\]+)"\s*:\s*"((?:\\.|[^"\\])*)"\s*(?=,\s*"[^"]+"\s*:|\s*}$|\s*$)/g;
  const parsedEntries = [...normalizedValue.matchAll(entryPattern)];

  if (parsedEntries.length === 0) {
    return null;
  }

  const result: Record<string, string> = {};

  for (const [, key, rawValue] of parsedEntries) {
    result[key] = decodeLooseJsonStringValue(rawValue);
  }

  return result as T;
}

function parseJsonFromModelText<T>(value: string) {
  const normalizedValue = unwrapJsonText(value);
  const candidates = [
    value,
    normalizedValue,
    extractJsonSubstring(normalizedValue),
    removeTrailingCommas(extractJsonSubstring(normalizedValue)),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Try the next normalization step.
    }
  }

  const looseObjectStringMap = parseLooseObjectStringMap<T>(normalizedValue);

  if (looseObjectStringMap !== null) {
    return looseObjectStringMap;
  }

  const preview = normalizedValue.slice(0, 200).replace(/\s+/g, ' ');
  throw new Error(`Gemini returned invalid JSON. Preview: ${preview}`);
}

function extractGeminiText(payload: GeminiGenerateContentResponse) {
  const candidate = payload.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts
    .map((part) => typeof part.text === 'string' ? part.text : '')
    .join('')
    .trim();

  if (text) {
    return text;
  }

  if (payload.promptFeedback?.blockReason) {
    const details = payload.promptFeedback.blockReasonMessage
      ? ` ${payload.promptFeedback.blockReasonMessage}`
      : '';
    throw new Error(`Gemini blocked the request: ${payload.promptFeedback.blockReason}.${details}`);
  }

  if (candidate?.finishReason) {
    throw new Error(`Gemini returned no text output. Finish reason: ${candidate.finishReason}.`);
  }

  throw new Error('Gemini returned an empty completion.');
}

export function getGeminiModel() {
  return Deno.env.get('SEASONSCOUT_GEMINI_COUNTRY_EDITORIAL_MODEL')
    || Deno.env.get('GEMINI_MODEL')
    || DEFAULT_GEMINI_MODEL;
}

export async function generateStructuredJson<T>(options: {
  apiKey: string;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  responseSchema: JsonSchema;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<GeminiJsonResult<T>> {
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/${options.model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': options.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: options.systemInstruction,
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: options.userPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: options.responseSchema,
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: options.maxOutputTokens ?? 2000,
        },
      }),
    },
  );

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error(`Gemini request failed with ${response.status}: ${failureBody.slice(0, 500)}`);
  }

  const payload = await response.json() as GeminiGenerateContentResponse;
  const rawText = extractGeminiText(payload);

  return {
    parsed: parseJsonFromModelText<T>(rawText),
    rawText,
    usageMetadata: payload.usageMetadata ?? null,
  };
}
