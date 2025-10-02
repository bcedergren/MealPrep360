# MealPrep360 Mobile App

A comprehensive React Native mobile application for meal planning, recipe management, and grocery shopping built with Expo and integrated with the MealPrep360 ecosystem.

## 🚀 Features

### Core Functionality

- **Recipe Discovery**: Browse, search, and filter recipes with infinite scroll
- **Meal Planning**: Weekly calendar view for planning breakfast, lunch, dinner, and snacks
- **Shopping Lists**: Categorized shopping lists with completion tracking
- **User Authentication**: Secure sign-up/sign-in with Clerk
- **Profile Management**: User preferences, dietary restrictions, and settings

### Mobile-Specific Features

- **Push Notifications**: Meal reminders and weekly planning notifications
- **Offline Mode**: Full offline functionality with automatic sync when online
- **Camera Integration**: Take photos of recipes and upload to your collection
- **Photo Library Access**: Select existing photos for recipes
- **Real-time Sync**: Automatic data synchronization across devices

### User Experience

- **Clean UI**: Modern, intuitive interface with MealPrep360 branding
- **Smooth Navigation**: Tab-based navigation with proper state management
- **Loading States**: Elegant loading indicators and error handling
- **Responsive Design**: Works on all mobile screen sizes
- **Accessibility**: VoiceOver/TalkBack support and proper contrast ratios

## 🛠 Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: Clerk
- **State Management**: React Hooks + Context
- **Styling**: React Native StyleSheet with consistent theming
- **Backend Integration**: RESTful API with JWT authentication
- **Local Storage**: AsyncStorage for offline data
- **Push Notifications**: Expo Notifications
- **Camera**: Expo Camera and Image Picker
- **TypeScript**: Full type safety throughout the application

## 📱 Screenshots

_Note: Add actual screenshots of your app here_

## 🏗 Project Structure

```
MealPrep360Mobile/
├── app/                    # App routes (Expo Router)
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── recipes.tsx    # Recipe browsing
│   │   ├── meal-plan.tsx  # Meal planning
│   │   ├── shopping.tsx   # Shopping lists
│   │   └── profile.tsx    # User profile
│   ├── recipe/            # Recipe detail screens
│   ├── login.tsx          # Authentication screens
│   ├── signup.tsx
│   └── _layout.tsx        # Root layout with auth
├── src/
│   ├── services/          # API and business logic
│   │   ├── api.ts         # Core API interfaces
│   │   ├── authApiService.ts # Authenticated API calls
│   │   ├── notificationService.ts # Push notifications
│   │   ├── offlineService.ts # Offline data management
│   │   └── cameraService.ts # Camera and photo handling
│   ├── hooks/             # Custom React hooks
│   │   └── useMealPrepServices.ts # Unified services hook
│   └── constants/         # App constants and types
├── assets/                # Images, fonts, and static assets
├── testing/               # Test documentation and guides
├── eas.json              # Expo Application Services config
├── app.config.js         # Expo configuration
└── package.json          # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (for iOS development)
- Android Studio/Emulator (for Android development)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MealPrep360Mobile
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:

   ```env
   EXPO_PUBLIC_API_URL=https://api.mealprep360.com
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
   EXPO_PUBLIC_EAS_PROJECT_ID=your_eas_project_id
   ```

4. **Start the development server**

   ```bash
   expo start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device

## 📋 Available Scripts

```bash
npm start           # Start Expo development server
npm run android     # Run on Android
npm run ios         # Run on iOS
npm run web         # Run on web browser

# Build commands (requires EAS CLI)
npm run build:android    # Build Android APK/AAB
npm run build:ios        # Build iOS IPA
npm run build:all        # Build for both platforms
```

## 🔧 Configuration

### Environment Variables

- `EXPO_PUBLIC_API_URL`: Backend API base URL
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk authentication key
- `EXPO_PUBLIC_EAS_PROJECT_ID`: Expo Application Services project ID

### App Configuration

Key settings in `app.config.js`:

- App name and version
- Bundle identifiers for iOS/Android
- Permissions and privacy descriptions
- Push notification settings
- Plugin configurations

## 🔐 Authentication

The app uses [Clerk](https://clerk.dev) for authentication:

- Email/password authentication
- Session management
- Protected routes
- Automatic token refresh
- User profile management

### Setting up Clerk

1. Create a Clerk account at [clerk.dev](https://clerk.dev)
2. Create a new application
3. Copy the publishable key to your `.env` file
4. Configure allowed redirect URLs in Clerk dashboard

## 🌐 API Integration

The app connects to the MealPrep360 backend API with the following endpoints:

- `/api/recipes` - Recipe CRUD operations
- `/api/meal-plans` - Meal planning functionality
- `/api/shopping-lists` - Shopping list management
- `/api/user/profile` - User profile data

### Authentication

All API calls include JWT tokens from Clerk for authentication.

## 📱 Offline Functionality

The app includes comprehensive offline support:

- **Data Caching**: Recipes, meal plans, and shopping lists cached locally
- **Offline Operations**: Make changes without internet connection
- **Automatic Sync**: Data synchronizes when connection restored
- **Conflict Resolution**: Handles data conflicts intelligently

## 🔔 Push Notifications

Integrated push notification system:

- **Meal Reminders**: Scheduled notifications for meal times
- **Weekly Planning**: Reminders to plan upcoming meals
- **Custom Scheduling**: User-configurable notification times
- **Cross-Platform**: Works on both iOS and Android

## 📸 Camera Integration

Photo capture and management:

- **Recipe Photos**: Take pictures of your dishes
- **Photo Library**: Select existing photos
- **Image Compression**: Automatic optimization for storage
- **Cloud Upload**: Sync photos across devices

## 🧪 Testing

### Running Tests

```bash
npm test           # Run unit tests
npm run test:e2e   # Run end-to-end tests (if configured)
```

### User Flow Testing

Comprehensive testing guide available in `testing/USER_FLOWS.md` covering:

- Authentication flows
- Recipe discovery and management
- Meal planning workflows
- Shopping list functionality
- Offline mode testing
- Push notification testing

## 🚀 Deployment

### Development Deployment

```bash
eas build --profile development --platform all
```

### Production Deployment

```bash
eas build --profile production-store --platform all
eas submit --platform all
```

For detailed deployment instructions, see `DEPLOYMENT.md`.

## 📚 Documentation

- **User Flow Testing**: `testing/USER_FLOWS.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **API Documentation**: See main MealPrep360 repository

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation as needed
- Test on both iOS and Android

## 🐛 Troubleshooting

### Common Issues

**Metro bundler cache issues**

```bash
expo start --clear
```

**Dependencies not resolving**

```bash
rm -rf node_modules
npm install
```

**Build failures**

```bash
eas build --clear-cache
```

### Getting Help

- Check the [Expo Documentation](https://docs.expo.dev/)
- Review `DEPLOYMENT.md` for build issues
- Check GitHub Issues for known problems

## 📄 License

This project is part of the MealPrep360 ecosystem. See the main repository for license information.

## 🔗 Related Projects

- **MealPrep360 Web App**: Main web application
- **MealPrep360 API**: Backend services
- **MealPrep360 Admin**: Administrative dashboard

## 📞 Support

For support and questions:

- Email: support@mealprep360.com
- Documentation: See related .md files in this repository
- Issues: Use GitHub Issues for bug reports and feature requests

---

**Built with ❤️ using React Native and Expo**

## 🚧 Development Progress

- Completed navigation restructure, authentication flow, and core recipe features (see `OVERALL_PROGRESS_SUMMARY.md`).
- Offline-first architecture with optimistic updates, background sync, and conflict resolution.
- Advanced state management, performance optimization, and error boundaries.
- Social and community features: collaborative collections, reviews, sharing, and engagement analytics.
- 100% TypeScript coverage, comprehensive testing, and user flow validation.
- Ready for next phases: expanded social infrastructure, analytics, and monetization (see `PHASE_7_2_SUMMARY.md`).
