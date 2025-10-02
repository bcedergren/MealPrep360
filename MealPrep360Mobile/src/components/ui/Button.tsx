import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Layout, Shadows, Typography } from '../../constants/theme';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  customStyle?: ViewStyle;
  customTextStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  customStyle,
  customTextStyle,
  onPress,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary,
          borderColor: Colors.primary,
          textColor: Colors.white,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.secondary,
          borderColor: Colors.secondary,
          textColor: Colors.white,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: Colors.primary,
          textColor: Colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: Colors.primary,
        };
      case 'danger':
        return {
          backgroundColor: Colors.error,
          borderColor: Colors.error,
          textColor: Colors.white,
        };
      default:
        return {
          backgroundColor: Colors.primary,
          borderColor: Colors.primary,
          textColor: Colors.white,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: Typography.sm,
        };
      case 'medium':
        return {
          height: Layout.buttonHeight,
          paddingHorizontal: 24,
          fontSize: Typography.base,
        };
      case 'large':
        return {
          height: 64,
          paddingHorizontal: 32,
          fontSize: Typography.lg,
        };
      default:
        return {
          height: Layout.buttonHeight,
          paddingHorizontal: 24,
          fontSize: Typography.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonStyle: ViewStyle = {
    ...styles.button,
    backgroundColor: variantStyles.backgroundColor,
    borderColor: variantStyles.borderColor,
    height: sizeStyles.height,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled || loading ? 0.6 : 1,
    ...customStyle,
  };

  const textStyle: TextStyle = {
    ...styles.text,
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    ...customTextStyle,
  };

  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  const handlePress = (event: any) => {
    if (!disabled && !loading && onPress) {
      onPress(event);
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={variantStyles.textColor}
              style={styles.iconLeft}
            />
          )}
          <Text style={textStyle}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={iconSize}
              color={variantStyles.textColor}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.medium,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});