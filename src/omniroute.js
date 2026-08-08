import { CARL_SYSTEM_PROMPT } from './carlPrompt.js';

const ERROR_HINTS = [
  'model does not exist',
  'model not found',
  'invalid model',
  'api key',
  'unauthorized',
  'rate limit',
  'rate_limit',
  'insufficient balance',
  'upstream',
  'provider error',
  'bad request',
];

export function looksLikeError(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return ERROR_HINTS.some((h) => t.includes(h));
}

class OmniRouteClient {
  constructor(baseUrl, apiKey, defaultModel = 'auto/best-chat') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/v1/chat/completions`;
    
    const systemContent = options.context
      ? `${CARL_SYSTEM_PROMPT}\n\n--- THINGS YOU'VE NOTICED AROUND THE SERVER ---\n${options.context}`
      : CARL_SYSTEM_PROMPT;

    const payload = {
      model: options.model || this.defaultModel,
      messages: [
        { role: 'system', content: systemContent },
        ...messages
      ],
      temperature: options.temperature ?? 0.9,
      max_tokens: options.maxTokens ?? 300,
      stream: false,
      ...options
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OmniRoute API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (looksLikeError(content)) {
      throw new Error(`OmniRoute returned an error message: ${content.slice(0, 300)}`);
    }
    return content || '...';
  }

  async listModels() {
    const response = await fetch(`${this.baseUrl}/v1/models`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    return response.json();
  }
}

export { OmniRouteClient };