export interface AIRequestParams {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface IAIService {
  generateCompletion(params: AIRequestParams): Promise<AIResponse>;
  generateEmbedding(text: string): Promise<number[]>;
  isValidResponse(response: any): boolean;
  extractJSONFromResponse(response: string): any;
}