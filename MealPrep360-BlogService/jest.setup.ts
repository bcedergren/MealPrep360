// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.OPENAI_API_KEY = 'test-api-key';

// Mock global objects
global.mongoose = undefined;
