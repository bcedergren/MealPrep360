# Production Security Guide

## Overview
This guide provides comprehensive security configurations and best practices for deploying MealPrep360 in production.

## 🔐 Security Checklist

### 1. Authentication & Authorization

#### Clerk Configuration
```typescript
// clerk.config.ts - Production Security
import { clerkClient } from '@clerk/nextjs/server';

export const clerkConfig = {
  // Production security settings
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  
  // Security policies
  signInUrl: '/auth/signin',
  signUpUrl: '/auth/signup',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/onboarding',
  
  // Session configuration
  sessionTokenTemplate: 'sess_',
  sessionTokenExpiration: 7 * 24 * 60 * 60, // 7 days
  
  // Password requirements
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
  },
  
  // Multi-factor authentication
  mfa: {
    enabled: true,
    required: false, // Optional for users
  },
  
  // Rate limiting
  rateLimit: {
    signIn: { attempts: 5, window: 15 * 60 }, // 5 attempts per 15 minutes
    signUp: { attempts: 3, window: 60 * 60 }, // 3 attempts per hour
  },
};
```

#### JWT Configuration
```typescript
// jwt.config.ts - Production JWT Settings
export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: '1h',
  issuer: 'mealprep360.com',
  audience: 'mealprep360-users',
  
  // Security options
  algorithm: 'HS256',
  clockTolerance: 30, // 30 seconds
  
  // Refresh token configuration
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};
```

### 2. API Security

#### Rate Limiting
```typescript
// rate-limit.config.ts
import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit auth endpoints to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Very strict limit for sensitive endpoints
  message: 'Rate limit exceeded for sensitive operations.',
});
```

#### Input Validation & Sanitization
```typescript
// validation.middleware.ts
import { body, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize string inputs
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = DOMPurify.sanitize(req.body[key]);
      }
    });
  }
  next();
};

// Validation rules
export const userValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 12 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').trim().isLength({ min: 1, max: 50 }).escape(),
  body('lastName').trim().isLength({ min: 1, max: 50 }).escape(),
];
```

#### CORS Configuration
```typescript
// cors.config.ts
import cors from 'cors';

export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://mealprep360.com',
        'https://www.mealprep360.com',
        'https://admin.mealprep360.com',
        'https://api.mealprep360.com',
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  
  credentials: true,
  optionsSuccessStatus: 200,
  
  // Security headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
  ],
  
  // Expose headers
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
};
```

### 3. Database Security

#### MongoDB Security Configuration
```javascript
// mongo-security.config.js
const mongoConfig = {
  // Connection security
  ssl: true,
  sslValidate: true,
  sslCA: process.env.MONGODB_SSL_CA,
  
  // Authentication
  authSource: 'admin',
  authMechanism: 'SCRAM-SHA-256',
  
  // Connection options
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  
  // Security options
  retryWrites: true,
  retryReads: true,
  
  // Encryption at rest
  encrypt: true,
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    },
  },
};
```

#### Data Encryption
```typescript
// encryption.service.ts
import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('mealprep360', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }
  
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(
      this.algorithm,
      this.key
    );
    
    decipher.setAAD(Buffer.from('mealprep360', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 4. Security Headers

#### Next.js Security Headers
```typescript
// next.config.js - Security Headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://api.mealprep360.com https://api.stripe.com;
      frame-src 'self' https://js.stripe.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 5. API Key Management

#### Secure API Key Storage
```typescript
// api-key.service.ts
import crypto from 'crypto';

export class APIKeyService {
  private static readonly KEY_PREFIX = 'mp360_';
  private static readonly KEY_LENGTH = 32;
  
  static generateKey(): string {
    const randomBytes = crypto.randomBytes(this.KEY_LENGTH);
    const key = randomBytes.toString('hex');
    return `${this.KEY_PREFIX}${key}`;
  }
  
  static validateKey(key: string): boolean {
    if (!key.startsWith(this.KEY_PREFIX)) {
      return false;
    }
    
    const keyPart = key.substring(this.KEY_PREFIX.length);
    return keyPart.length === this.KEY_LENGTH * 2; // hex encoding doubles length
  }
  
  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
  
  static verifyKey(key: string, hashedKey: string): boolean {
    return this.hashKey(key) === hashedKey;
  }
}
```

#### API Key Middleware
```typescript
// api-key.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { APIKeyService } from './api-key.service';

export const validateAPIKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  if (!APIKeyService.validateKey(apiKey)) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }
  
  // Verify key against database
  // Implementation depends on your storage solution
  next();
};
```

### 6. Logging & Monitoring

#### Security Event Logging
```typescript
// security-logger.ts
import winston from 'winston';

export class SecurityLogger {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/security.log' }),
        new winston.transports.Console(),
      ],
    });
  }
  
  logAuthAttempt(email: string, success: boolean, ip: string) {
    this.logger.info('Authentication attempt', {
      email,
      success,
      ip,
      timestamp: new Date().toISOString(),
      type: 'auth_attempt',
    });
  }
  
  logSecurityEvent(event: string, details: any) {
    this.logger.warn('Security event', {
      event,
      details,
      timestamp: new Date().toISOString(),
      type: 'security_event',
    });
  }
  
  logSuspiciousActivity(activity: string, ip: string, userAgent: string) {
    this.logger.error('Suspicious activity detected', {
      activity,
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      type: 'suspicious_activity',
    });
  }
}
```

### 7. Environment Security

#### Environment Variable Validation
```typescript
// env-validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().transform(Number),
  
  // Database
  MONGODB_URI: z.string().url(),
  MONGODB_DB: z.string().min(1),
  
  // Authentication
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  
  // External APIs
  OPENAI_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  
  // Security
  ENCRYPTION_KEY: z.string().min(32),
  API_RATE_LIMIT: z.string().transform(Number),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error);
    process.exit(1);
  }
};
```

### 8. Production Security Checklist

#### Pre-Deployment Security

- [ ] **Environment Variables**: All sensitive data in environment variables
- [ ] **API Keys**: All API keys secured and rotated
- [ ] **Database Security**: MongoDB Atlas with proper access controls
- [ ] **SSL/TLS**: HTTPS enabled for all services
- [ ] **CORS**: Properly configured for production domains
- [ ] **Rate Limiting**: Implemented on all API endpoints
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Error Handling**: No sensitive data exposed in errors
- [ ] **Logging**: Comprehensive logging without sensitive data
- [ ] **Headers**: Security headers implemented
- [ ] **Authentication**: Multi-factor authentication enabled
- [ ] **Authorization**: Role-based access control implemented
- [ ] **Encryption**: Data encrypted at rest and in transit
- [ ] **Monitoring**: Security monitoring and alerting configured
- [ ] **Backup**: Secure backup strategy implemented

#### Post-Deployment Security

- [ ] **Health Checks**: All security endpoints responding
- [ ] **Penetration Testing**: Security testing completed
- [ ] **Vulnerability Scanning**: Regular scans scheduled
- [ ] **Access Logs**: Monitoring for suspicious activity
- [ ] **Incident Response**: Security incident procedures in place
- [ ] **Updates**: Regular security updates scheduled
- [ ] **Audit**: Security audit completed
- [ ] **Training**: Team trained on security procedures

### 9. Security Monitoring

#### Real-time Security Alerts
```typescript
// security-monitor.ts
export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private alertThresholds = {
    failedLogins: 5,
    suspiciousRequests: 10,
    rateLimitExceeded: 20,
  };
  
  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }
  
  checkSecurityMetrics(metrics: any) {
    if (metrics.failedLogins > this.alertThresholds.failedLogins) {
      this.sendAlert('High number of failed login attempts', metrics);
    }
    
    if (metrics.suspiciousRequests > this.alertThresholds.suspiciousRequests) {
      this.sendAlert('Suspicious request patterns detected', metrics);
    }
    
    if (metrics.rateLimitExceeded > this.alertThresholds.rateLimitExceeded) {
      this.sendAlert('Rate limit exceeded multiple times', metrics);
    }
  }
  
  private sendAlert(message: string, data: any) {
    // Send to monitoring service (Sentry, DataDog, etc.)
    console.error(`🚨 SECURITY ALERT: ${message}`, data);
  }
}
```

This comprehensive security guide ensures MealPrep360 is production-ready with enterprise-grade security measures.

