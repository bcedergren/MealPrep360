// Main library exports for external usage
export * from './lib/auth/multiClerkAuth';
export * from './lib/auth/withAuth';
export * from './lib/auth/ensureUser';
export * from './lib/auth/adminAuth';
export * from './lib/utils';
export * from './lib/getOrCreateUser';
export * from './lib/config';
export * from './lib/constants';
export * from './lib/cache';
// Note: openai module excluded from library build due to Next.js dependencies
export * from './lib/conversions';
export * from './lib/ingredients';
export * from './lib/usage-tracker';
export * from './lib/i18n/language';
export * from './lib/constants/tags';

// Re-export models and types (avoiding conflicts)
export * from './models';
export type { MealType } from './types';
