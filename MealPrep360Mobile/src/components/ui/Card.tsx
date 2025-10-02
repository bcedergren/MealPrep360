import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../../constants/theme';

export interface CardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  padding?: 'none' | 'small' | 'medium' | 'large';
  margin?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  customStyle?: ViewStyle;
  pressable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  margin = 'none',
  shadow = 'medium',
  borderRadius = 'medium',
  backgroundColor,
  borderColor,
  borderWidth,
  customStyle,
  pressable = false,
  onPress,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: backgroundColor || Colors.white,
          borderColor: borderColor || Colors.border,
          borderWidth: borderWidth || 1,
          shadow: shadow === 'medium' ? 'none' : shadow,
        };
      case 'elevated':
        return {
          backgroundColor: backgroundColor || Colors.white,
          borderColor: 'transparent',
          borderWidth: 0,
          shadow: shadow === 'medium' ? 'large' : shadow,
        };
      case 'flat':
        return {
          backgroundColor: backgroundColor || Colors.backgroundSecondary,
          borderColor: 'transparent',
          borderWidth: 0,
          shadow: 'none',
        };
      default:
        return {
          backgroundColor: backgroundColor || Colors.white,
          borderColor: borderColor || Colors.border,
          borderWidth: borderWidth || 1,
          shadow: shadow,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: Spacing.sm };
      case 'medium':
        return { padding: Spacing.md };
      case 'large':
        return { padding: Spacing.lg };
      default:
        return { padding: Spacing.md };
    }
  };

  const getMarginStyles = () => {
    switch (margin) {
      case 'none':
        return { margin: 0 };
      case 'small':
        return { margin: Spacing.sm };
      case 'medium':
        return { margin: Spacing.md };
      case 'large':
        return { margin: Spacing.lg };
      default:
        return { margin: 0 };
    }
  };

  const getShadowStyles = () => {
    switch (shadow) {
      case 'none':
        return {};
      case 'small':
        return Shadows.small;
      case 'medium':
        return Shadows.medium;
      case 'large':
        return Shadows.large;
      case 'xl':
        return Shadows.xl;
      default:
        return Shadows.medium;
    }
  };

  const getBorderRadiusValue = () => {
    switch (borderRadius) {
      case 'none':
        return BorderRadius.none;
      case 'small':
        return BorderRadius.sm;
      case 'medium':
        return BorderRadius.md;
      case 'large':
        return BorderRadius.lg;
      case 'xl':
        return BorderRadius.xl;
      default:
        return BorderRadius.md;
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();
  const marginStyles = getMarginStyles();
  const shadowStyles = getShadowStyles();
  const borderRadiusValue = getBorderRadiusValue();

  const cardStyle: ViewStyle = {
    ...styles.card,
    ...paddingStyles,
    ...marginStyles,
    ...shadowStyles,
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    borderWidth: variantStyles.borderWidth,
    borderRadius: borderRadiusValue,
    ...customStyle,
  };

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.95}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});