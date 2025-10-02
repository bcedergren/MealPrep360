#!/usr/bin/env node

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface ServiceApiKeys {
  [serviceName: string]: string;
}

class ApiKeyGenerator {
  private envPath: string;
  private exampleEnvPath: string;

  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.exampleEnvPath = path.join(process.cwd(), '.env.example');
  }

  generateSecureApiKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  generateJwtSecret(length: number = 64): string {
    return crypto.randomBytes(length).toString('base64');
  }

  generateAllApiKeys(): ServiceApiKeys {
    const services = [
      'recipe-service',
      'mealplan-service',
      'shopping-service',
      'social-service',
      'blog-service',
      'websocket-service'
    ];

    const apiKeys: ServiceApiKeys = {};
    
    services.forEach(service => {
      const envVarName = `${service.toUpperCase().replace('-', '_')}_API_KEY`;
      apiKeys[envVarName] = this.generateSecureApiKey();
    });

    return apiKeys;
  }

  readExistingEnv(): { [key: string]: string } {
    const envVars: { [key: string]: string } = {};
    
    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            envVars[key] = valueParts.join('=');
          }
        }
      });
    }
    
    return envVars;
  }

  updateEnvFile(): void {
    const existingEnv = this.readExistingEnv();
    const newApiKeys = this.generateAllApiKeys();
    
    // Generate JWT secret if not exists
    if (!existingEnv.JWT_SECRET) {
      existingEnv.JWT_SECRET = this.generateJwtSecret();
    }
    
    // Add new API keys only if they don't exist
    Object.entries(newApiKeys).forEach(([key, value]) => {
      if (!existingEnv[key]) {
        existingEnv[key] = value;
      }
    });
    
    // Write updated .env file
    const envContent = Object.entries(existingEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ .env file updated with new API keys');
  }

  validateEnvironmentVariables(): { valid: boolean; missing: string[] } {
    const existingEnv = this.readExistingEnv();
    const requiredKeys = [
      'MONGODB_URI',
      'CLERK_SECRET_KEY',
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'JWT_SECRET',
      'RECIPE_SERVICE_API_KEY',
      'MEALPLAN_SERVICE_API_KEY',
      'SHOPPING_SERVICE_API_KEY',
      'SOCIAL_SERVICE_API_KEY',
      'BLOG_SERVICE_API_KEY',
      'WEBSOCKET_SERVICE_API_KEY'
    ];

    const missing = requiredKeys.filter(key => !existingEnv[key]);
    
    return {
      valid: missing.length === 0,
      missing
    };
  }

  displayApiKeys(): void {
    const existingEnv = this.readExistingEnv();
    const serviceKeys = Object.entries(existingEnv)
      .filter(([key]) => key.includes('_SERVICE_API_KEY') || key === 'JWT_SECRET')
      .sort();

    console.log('\n🔑 Generated API Keys:');
    console.log('====================');
    
    serviceKeys.forEach(([key, value]) => {
      const serviceName = key.replace('_API_KEY', '').replace('_SERVICE', '');
      console.log(`${serviceName.padEnd(15)}: ${value}`);
    });
    
    console.log('\n⚠️  Keep these keys secure and do not commit them to version control!');
  }

  setupEnvironment(): void {
    console.log('🚀 Setting up MealPrep360 API Environment...\n');
    
    // Check if .env.example exists
    if (!fs.existsSync(this.exampleEnvPath)) {
      console.error('❌ .env.example file not found!');
      process.exit(1);
    }
    
    // Copy .env.example to .env if .env doesn't exist
    if (!fs.existsSync(this.envPath)) {
      fs.copyFileSync(this.exampleEnvPath, this.envPath);
      console.log('📋 Created .env file from .env.example');
    }
    
    // Generate and update API keys
    this.updateEnvFile();
    
    // Validate environment
    const validation = this.validateEnvironmentVariables();
    if (!validation.valid) {
      console.warn('⚠️  Missing required environment variables:');
      validation.missing.forEach(key => {
        console.warn(`   - ${key}`);
      });
      console.warn('\nPlease update your .env file with the missing values.');
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Display generated keys
    this.displayApiKeys();
    
    console.log('\n🎉 Environment setup complete!');
    console.log('Next steps:');
    console.log('1. Update .env file with your actual service URLs');
    console.log('2. Update .env file with your Clerk and MongoDB credentials');
    console.log('3. Run npm run dev to start the API server');
  }
}

// CLI execution
if (require.main === module) {
  const generator = new ApiKeyGenerator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      generator.setupEnvironment();
      break;
    case 'validate':
      const validation = generator.validateEnvironmentVariables();
      if (validation.valid) {
        console.log('✅ All environment variables are valid');
      } else {
        console.log('❌ Missing environment variables:', validation.missing);
        process.exit(1);
      }
      break;
    case 'show':
      generator.displayApiKeys();
      break;
    default:
      console.log('Usage: npx ts-node src/scripts/generate-api-keys.ts [setup|validate|show]');
      console.log('  setup    - Set up environment with generated API keys');
      console.log('  validate - Validate required environment variables');
      console.log('  show     - Display current API keys');
      break;
  }
}

export default ApiKeyGenerator;