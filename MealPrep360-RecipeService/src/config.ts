export const config = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mealprep360',
    options: {
      bufferCommands: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      waitQueueTimeoutMS: 10000,
    },
  },
  redis: {
    url: process.env.REDIS_URL,
    options: {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    },
  },
  openai: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o',
    maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS || '2000', 10),
    temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE || '0.7'),
    baseURL: 'https://openrouter.ai/api/v1',
  },
  queue: {
    name: process.env.QUEUE_NAME || 'mealprep360',
  },
  placeholderImageUrl: process.env.PLACEHOLDER_IMAGE_URL || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  apiKey: process.env.API_KEY,
  logLevel: process.env.LOG_LEVEL || 'info',
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
};