import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/theme';

export interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'skeleton' | 'overlay';
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  customStyle?: ViewStyle;
  customTextStyle?: TextStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'medium',
  color = Colors.primary,
  text,
  overlay = false,
  fullScreen = false,
  customStyle,
  customTextStyle,
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return { size: 'small' as const, iconSize: 16 };
      case 'medium':
        return { size: 'small' as const, iconSize: 24 };
      case 'large':
        return { size: 'large' as const, iconSize: 32 };
      default:
        return { size: 'small' as const, iconSize: 24 };
    }
  };

  const sizeConfig = getSize();

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...(fullScreen && styles.fullScreen),
    ...(overlay && styles.overlay),
    ...customStyle,
  };

  const textStyle: TextStyle = {
    ...styles.text,
    ...customTextStyle,
  };

  const renderSpinner = () => (
    <View style={containerStyle}>
      <ActivityIndicator size={sizeConfig.size} color={color} />
      {text && <Text style={textStyle}>{text}</Text>}
    </View>
  );

  const renderDots = () => (
    <View style={containerStyle}>
      <View style={styles.dotsContainer}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={[styles.dot, styles.dotDelay1, { backgroundColor: color }]} />
        <View style={[styles.dot, styles.dotDelay2, { backgroundColor: color }]} />
      </View>
      {text && <Text style={textStyle}>{text}</Text>}
    </View>
  );

  const renderSkeleton = () => (
    <View style={[containerStyle, styles.skeletonContainer]}>
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
      <View style={styles.skeletonItem} />
    </View>
  );

  const renderOverlay = () => (
    <View style={[containerStyle, styles.overlayContainer]}>
      <View style={styles.overlayContent}>
        <ActivityIndicator size={sizeConfig.size} color={Colors.white} />
        {text && <Text style={[textStyle, styles.overlayText]}>{text}</Text>}
      </View>
    </View>
  );

  switch (variant) {
    case 'dots':
      return renderDots();
    case 'skeleton':
      return renderSkeleton();
    case 'overlay':
      return renderOverlay();
    default:
      return renderSpinner();
  }
};

// Preset Loading Components
export const LoadingSpinner: React.FC<Omit<LoadingProps, 'variant'>> = (props) => (
  <Loading {...props} variant="spinner" />
);

export const LoadingDots: React.FC<Omit<LoadingProps, 'variant'>> = (props) => (
  <Loading {...props} variant="dots" />
);

export const LoadingSkeleton: React.FC<Omit<LoadingProps, 'variant'>> = (props) => (
  <Loading {...props} variant="skeleton" />
);

export const LoadingOverlay: React.FC<Omit<LoadingProps, 'variant'>> = (props) => (
  <Loading {...props} variant="overlay" />
);

// Screen Loading Component
export const ScreenLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <View style={styles.screenLoading}>
    <View style={styles.screenLoadingContent}>
      <View style={styles.logoContainer}>
        <Ionicons name="restaurant" size={48} color={Colors.primary} />
      </View>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.screenLoadingText}>{text}</Text>
    </View>
  </View>
);

// Empty State Component
export const EmptyState: React.FC<{
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ icon = 'document-outline', title, description, actionText, onAction }) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyStateIconContainer}>
      <Ionicons name={icon} size={48} color={Colors.gray400} />
    </View>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {description && <Text style={styles.emptyStateDescription}>{description}</Text>}
    {actionText && onAction && (
      <TouchableOpacity style={styles.emptyStateAction} onPress={onAction}>
        <Text style={styles.emptyStateActionText}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlayLight,
  },
  text: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  // Dots Animation
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  dotDelay1: {
    // Animation delay would be handled by animation libraries
  },
  dotDelay2: {
    // Animation delay would be handled by animation libraries
  },
  // Skeleton Loading
  skeletonContainer: {
    width: '100%',
  },
  skeletonItem: {
    height: 16,
    backgroundColor: Colors.gray200,
    borderRadius: 4,
    marginBottom: Spacing.sm,
  },
  // Overlay Loading
  overlayContainer: {
    backgroundColor: Colors.overlayDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: Colors.gray800,
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 120,
  },
  overlayText: {
    color: Colors.white,
    fontSize: Typography.sm,
    marginTop: Spacing.sm,
  },
  // Screen Loading
  screenLoading: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenLoadingContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  screenLoadingText: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.xl,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyStateDescription: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  emptyStateAction: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  emptyStateActionText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '600',
  },
});