export interface ClientGeminiConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  retries?: number;
  timeoutMs?: number;
  apiKey?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 string
  };
}

export const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.6-flash',
];

export function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Extract JSON slice between first { or [ and last } or ]
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let start = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    start = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  const lastBrace = cleaned.lastIndexOf('}');
  const lastBracket = cleaned.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);

  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return cleaned.trim();
}

const getEffectiveApiKey = (customKey?: string): string => {
  let key = (customKey || '').trim();

  if (!key && typeof import.meta !== 'undefined' && import.meta.env) {
    key = (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_API_KEY || '').trim();
  }

  if (!key && typeof process !== 'undefined' && process.env) {
    key = (process.env.VITE_GEMINI_API_KEY || process.env.VITE_GOOGLE_AI_API_KEY || '').trim();
  }

  if (!key) {
    throw new Error('[Client Gemini] API key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
  }

  if (!key.startsWith('AIza')) {
    throw new Error(
      `[Client Gemini] Valid Google AI Studio API key (AIza...) required. The current key starts with "${key.slice(0, 5)}...". Please generate a free Google AI Studio API key at https://aistudio.google.com/apikey and set it as VITE_GEMINI_API_KEY in your .env file.`
    );
  }

  return key;
};

/**
 * Calls Gemini directly from the client with structured JSON output enforcement and multi-model cascade.
 */
export async function callClientGeminiStructured<T>(
  prompt: string,
  systemInstruction?: string,
  config?: ClientGeminiConfig
): Promise<T> {
  const apiKey = getEffectiveApiKey(config?.apiKey);

  const candidateModels = config?.model
    ? [config.model, ...CANDIDATE_GEMINI_MODELS.filter((m) => m !== config.model)]
    : CANDIDATE_GEMINI_MODELS;

  const temperature = config?.temperature ?? 0.2;
  const maxRetries = config?.retries ?? 0;
  let lastError: Error | null = null;

  const parts: any[] = [];
  if (config?.inlineData?.data) {
    parts.push({
      inlineData: {
        mimeType: config.inlineData.mimeType,
        data: config.inlineData.data,
      },
    });
  }
  parts.push({ text: prompt });

  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(config?.timeoutMs || 15000),
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            systemInstruction: systemInstruction
              ? { role: 'system', parts: [{ text: systemInstruction }] }
              : undefined,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature,
              maxOutputTokens: config?.maxOutputTokens || 4096,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 401 || response.status === 403) {
            throw new Error(`[Client Gemini] API Key unauthorized (${response.status}): ${errText}`);
          }

          const isOverloadedOrNotFound = response.status === 503 || response.status === 404 || response.status === 429;
          if (isOverloadedOrNotFound) {
            console.warn(`[Client Gemini] Model ${model} returned ${response.status}. Cascading to next candidate model...`);
            lastError = new Error(`Gemini API error (${response.status}): ${errText}`);
            break; // Break inner retry loop to try next model in cascade
          }

          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          throw new Error(`No candidate text generated by Gemini model ${model}.`);
        }

        const cleaned = cleanJsonText(textOutput);
        return JSON.parse(cleaned) as T;
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('unauthorized') || err.message?.includes('Valid Google AI')) {
          throw err;
        }
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 600 * Math.pow(1.5, attempt)));
        }
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models in cascade failed to respond.');
}

/**
 * Calls Gemini directly from the client with plain text response and multi-model cascade.
 */
export async function callClientGemini(
  prompt: string,
  systemInstruction?: string,
  config?: ClientGeminiConfig
): Promise<string> {
  const apiKey = getEffectiveApiKey(config?.apiKey);

  const candidateModels = config?.model
    ? [config.model, ...CANDIDATE_GEMINI_MODELS.filter((m) => m !== config.model)]
    : CANDIDATE_GEMINI_MODELS;

  const temperature = config?.temperature ?? 0.3;
  const maxRetries = config?.retries ?? 0;
  let lastError: Error | null = null;

  const parts: any[] = [];
  if (config?.inlineData?.data) {
    parts.push({
      inlineData: {
        mimeType: config.inlineData.mimeType,
        data: config.inlineData.data,
      },
    });
  }
  parts.push({ text: prompt });

  for (const model of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(config?.timeoutMs || 15000),
          body: JSON.stringify({
            contents: [{ role: 'user', parts }],
            systemInstruction: systemInstruction
              ? { role: 'system', parts: [{ text: systemInstruction }] }
              : undefined,
            generationConfig: {
              temperature,
              maxOutputTokens: config?.maxOutputTokens || 2048,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          if (response.status === 401 || response.status === 403) {
            throw new Error(`[Client Gemini] API Key unauthorized (${response.status}): ${errText}`);
          }

          const isOverloadedOrNotFound = response.status === 503 || response.status === 404 || response.status === 429;
          if (isOverloadedOrNotFound) {
            console.warn(`[Client Gemini] Model ${model} returned ${response.status}. Cascading to next candidate model...`);
            lastError = new Error(`Gemini API error (${response.status}): ${errText}`);
            break;
          }

          throw new Error(`Gemini API error (${response.status}): ${errText}`);
        }

        const data = await response.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) {
          throw new Error(`No candidate text generated by Gemini model ${model}.`);
        }

        return textOutput.trim();
      } catch (err: any) {
        lastError = err;
        if (err.message?.includes('unauthorized') || err.message?.includes('Valid Google AI')) {
          throw err;
        }
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 600 * Math.pow(1.5, attempt)));
        }
      }
    }
  }

  throw lastError || new Error('All candidate Gemini models in cascade failed to respond.');
}

export const callClientGeminiText = callClientGemini;
