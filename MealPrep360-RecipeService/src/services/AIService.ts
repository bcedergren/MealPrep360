import { IAIService, AIRequestParams, AIResponse } from './interfaces/IAIService';
import { ILogger } from './interfaces/ILogger';
import { config } from '../config';
import { ServiceContainer } from '../container/ServiceContainer';

export class AIService implements IAIService {
  private logger: ILogger;
  private apiKey: string;

  constructor(logger: ILogger) {
    this.logger = logger;
    if (!config.openai.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }
    this.apiKey = config.openai.apiKey;
  }

  public static getInstance(): AIService {
    const container = ServiceContainer.getInstance();
    const logger = container.get<ILogger>('ILogger');
    return new AIService(logger);
  }

  public async generateCompletion(params: AIRequestParams): Promise<AIResponse> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: params.model || 'openai/gpt-4o',
          messages: [
            {
              role: 'system',
              content: params.systemPrompt || '',
            },
            {
              role: 'user',
              content: params.prompt,
            },
          ],
          temperature: params.temperature || 0.7,
          max_tokens: params.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage,
      };
    } catch (error) {
      this.logger.error('Error generating completion:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  public isValidResponse(response: any): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    if (!response.choices || !Array.isArray(response.choices)) {
      return false;
    }

    if (response.choices.length === 0) {
      return false;
    }

    const firstChoice = response.choices[0];
    if (!firstChoice.message || !firstChoice.message.content) {
      return false;
    }

    return true;
  }

  public extractJSONFromResponse(response: string): any {
    try {
      // Find the first occurrence of '{' and the last occurrence of '}'
      const start = response.indexOf('{');
      const end = response.lastIndexOf('}');
      
      if (start === -1 || end === -1) {
        throw new Error('No JSON object found in response');
      }

      // Extract the JSON string
      const jsonStr = response.substring(start, end + 1);
      
      // Parse the JSON
      return JSON.parse(jsonStr);
    } catch (error) {
      this.logger.error('Error extracting JSON from response:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
}