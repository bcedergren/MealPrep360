#!/usr/bin/env node

/**
 * Production Environment Setup Script
 * Configures the MealPrep360 mobile app for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up MealPrep360 Mobile for production...\n');

// Create production environment file
const envContent = `# MealPrep360 Mobile App - Production Environment

# API Configuration
EXPO_PUBLIC_API_URL=https://api.mealprep360.com

# Clerk Authentication
# Get your production key from Clerk Dashboard → Production → API Keys
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key_here

# EAS Configuration
EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id_here

# Analytics (Optional)
EXPO_PUBLIC_ANALYTICS_ID=your_analytics_id_here

# Push Notifications (Optional)
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=your_push_key_here

# Development vs Production
NODE_ENV=production
`;

const envPath = path.join(__dirname, '..', '.env.production');
fs.writeFileSync(envPath, envContent);
console.log('✅ Created .env.production file');

// Update package.json scripts for production
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add production scripts
packageJson.scripts = {
  ...packageJson.scripts,
  'build:production': 'eas build --profile production --platform all',
  'submit:ios': 'eas submit --platform ios --profile production',
  'submit:android': 'eas submit --platform android --profile production',
  'submit:all': 'eas submit --platform all --profile production',
  'preview:ios': 'eas build --profile preview --platform ios',
  'preview:android': 'eas build --profile preview --platform android',
  'preview:all': 'eas build --profile preview --platform all',
  'setup:production': 'node scripts/setup-production.js',
  'validate:config': 'node scripts/validate-config.js'
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with production scripts');

// Create validation script
const validateScript = `#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates that all required production settings are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating production configuration...\\n');

const requiredEnvVars = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_EAS_PROJECT_ID'
];

let allValid = true;

// Check if .env.production exists
const envPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.production file not found');
  console.log('   Run: npm run setup:production');
  allValid = false;
} else {
  console.log('✅ .env.production file exists');
  
  // Load and validate environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = envContent.split('\\n').filter(line => line.includes('='));
  
  requiredEnvVars.forEach(varName => {
    const envVar = envVars.find(line => line.startsWith(varName));
    if (!envVar || envVar.includes('your_') || envVar.includes('_here')) {
      console.log(\`❌ \${varName} not properly configured\`);
      allValid = false;
    } else {
      console.log(\`✅ \${varName} configured\`);
    }
  });
}

// Check app.config.js
const configPath = path.join(__dirname, '..', 'app.config.js');
if (fs.existsSync(configPath)) {
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (configContent.includes('com.mealprep360.mobile')) {
    console.log('✅ Bundle identifier configured');
  } else {
    console.log('❌ Bundle identifier not configured');
    allValid = false;
  }
  
  if (configContent.includes('backgroundColor: \'#4B7F47\'')) {
    console.log('✅ Brand colors configured');
  } else {
    console.log('❌ Brand colors not configured');
    allValid = false;
  }
} else {
  console.log('❌ app.config.js not found');
  allValid = false;
}

// Check EAS configuration
const easPath = path.join(__dirname, '..', 'eas.json');
if (fs.existsSync(easPath)) {
  console.log('✅ EAS configuration exists');
} else {
  console.log('❌ eas.json not found');
  allValid = false;
}

console.log('\\n' + (allValid ? '🎉 All configurations are valid!' : '⚠️  Some configurations need attention'));

if (!allValid) {
  console.log('\\n📋 Next steps:');
  console.log('1. Update .env.production with your actual API keys');
  console.log('2. Configure EAS project ID');
  console.log('3. Set up Apple Developer and Google Play accounts');
  console.log('4. Run: npm run validate:config');
  process.exit(1);
}
`;

const validatePath = path.join(__dirname, 'validate-config.js');
fs.writeFileSync(validatePath, validateScript);
console.log('✅ Created validation script');

// Create deployment guide
const deploymentGuide = `# Production Deployment Guide

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Create at https://developer.apple.com
   - Set up App Store Connect
   - Generate certificates and provisioning profiles

2. **Google Play Developer Account** ($25 one-time)
   - Create at https://play.google.com/console
   - Set up Play Console
   - Generate signing key

3. **Expo Application Services (EAS)**
   - Install: \`npm install -g @expo/eas-cli\`
   - Login: \`eas login\`
   - Configure: \`eas build:configure\`

## Step 1: Configure Environment

1. Update \`.env.production\` with your actual API keys:
   \`\`\`bash
   # Get production Clerk key from dashboard
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_actual_key
   
   # Get EAS project ID from EAS dashboard
   EXPO_PUBLIC_EAS_PROJECT_ID=your_actual_project_id
   \`\`\`

2. Validate configuration:
   \`\`\`bash
   npm run validate:config
   \`\`\`

## Step 2: Build Production Apps

1. **Build for both platforms:**
   \`\`\`bash
   npm run build:production
   \`\`\`

2. **Or build individually:**
   \`\`\`bash
   # iOS only
   eas build --profile production --platform ios
   
   # Android only
   eas build --profile production --platform android
   \`\`\`

## Step 3: Submit to App Stores

1. **Submit to Apple App Store:**
   \`\`\`bash
   npm run submit:ios
   \`\`\`

2. **Submit to Google Play Store:**
   \`\`\`bash
   npm run submit:android
   \`\`\`

3. **Submit to both:**
   \`\`\`bash
   npm run submit:all
   \`\`\`

## Step 4: Monitor and Iterate

- Monitor app store reviews
- Track crash reports
- Respond to user feedback
- Plan regular updates

## Troubleshooting

### Build Issues
- Clear cache: \`eas build --clear-cache\`
- Check logs: \`eas build:list\`
- Update EAS CLI: \`npm install -g @expo/eas-cli@latest\`

### Submission Issues
- Check app store requirements
- Verify certificates and provisioning profiles
- Review app store guidelines

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Apple Developer: https://developer.apple.com/support/
- Google Play: https://support.google.com/googleplay/android-developer/
`;

const deploymentPath = path.join(__dirname, '..', 'DEPLOYMENT_GUIDE.md');
fs.writeFileSync(deploymentPath, deploymentGuide);
console.log('✅ Created deployment guide');

console.log('\n🎉 Production setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Update .env.production with your actual API keys');
console.log('2. Run: npm run validate:config');
console.log('3. Follow DEPLOYMENT_GUIDE.md for app store submission');
console.log('\n🚀 Ready to launch MealPrep360 Mobile!');
