// Theme Constants for MealPrep360
export const Colors = {
  // Primary Brand Colors
  primary: '#4B7F47',
  primaryLight: '#6B9F67',
  primaryDark: '#2B5F27',
  
  // Secondary Colors
  secondary: '#E8A053',
  secondaryLight: '#F2B473',
  secondaryDark: '#D88033',
  
  // Accent Colors
  accent: '#6366F1',
  accentLight: '#8B8CF1',
  accentDark: '#4338CA',
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  
  // Semantic Colors
  text: '#2F2F2F',
  textSecondary: '#666666',
  textMuted: '#999999',
  textLight: '#CCCCCC',
  
  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  
  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',
  
  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Meal Prep Specific Colors
  breakfast: '#F59E0B',
  lunch: '#10B981',
  dinner: '#6366F1',
  snack: '#EF4444',
  
  // Food Category Colors
  protein: '#DC2626',
  carbs: '#D97706',
  vegetables: '#16A34A',
  fruits: '#EA580C',
  dairy: '#2563EB',
  pantry: '#7C3AED',
};

export const Typography = {
  // Font Families
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
  
  // Font Sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  
  // Line Heights
  lineHeights: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
    wider: 0.05,
    widest: 0.1,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  '6xl': 96,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
};

export const Layout = {
  // Container Widths
  container: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  
  // Common Dimensions
  headerHeight: 60,
  tabBarHeight: 80,
  cardHeight: 200,
  buttonHeight: 56,
  inputHeight: 56,
  
  // Screen Padding
  screenPadding: 24,
  cardPadding: 16,
  sectionPadding: 32,
};

export const Animation = {
  // Timing
  fast: 150,
  normal: 300,
  slow: 500,
  
  // Easing
  easeInOut: 'ease-in-out',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  linear: 'linear',
};

// Helper Functions
export const getColorWithOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export const getSpacing = (...values: (keyof typeof Spacing)[]): number[] => {
  return values.map(value => Spacing[value]);
};

export const getFontSize = (size: keyof typeof Typography): number => {
  return Typography[size] as number;
};

// Theme Object
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  layout: Layout,
  animation: Animation,
};