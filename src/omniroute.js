import { CARL_SYSTEM_PROMPT } from './carlPrompt.js';

class OmniRouteClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async chat(messages, options = {}) {
    const url = `${this.baseUrl}/v1/chat/completions`;
    
    const systemContent = options.context
      ? `${CARL_SYSTEM_PROMPT}\n\n--- THINGS YOU'VE NOTICED AROUND THE SERVER ---\n${options.context}`
      : CARL_SYSTEM_PROMPT;

    const payload = {
      model: options.model || 'auto',
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
    return data.choices[0]?.message?.content || '...';
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