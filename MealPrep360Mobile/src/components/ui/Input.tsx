import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Layout, Spacing, Typography } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  size = 'medium',
  variant = 'default',
  disabled = false,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  showPasswordToggle = false,
  secureTextEntry,
  value,
  onChangeText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          height: 40,
          fontSize: Typography.sm,
          paddingHorizontal: 12,
        };
      case 'medium':
        return {
          height: Layout.inputHeight,
          fontSize: Typography.base,
          paddingHorizontal: 16,
        };
      case 'large':
        return {
          height: 64,
          fontSize: Typography.lg,
          paddingHorizontal: 20,
        };
      default:
        return {
          height: Layout.inputHeight,
          fontSize: Typography.base,
          paddingHorizontal: 16,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: Colors.gray50,
          borderColor: 'transparent',
          borderWidth: 0,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: error ? Colors.error : isFocused ? Colors.primary : Colors.border,
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: Colors.gray50,
          borderColor: error ? Colors.error : isFocused ? Colors.primary : Colors.border,
          borderWidth: 1,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const containerStyles: ViewStyle = {
    ...styles.container,
    ...containerStyle,
  };

  const inputContainerStyles: ViewStyle = {
    ...styles.inputContainer,
    ...variantStyles,
    height: sizeStyles.height,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    opacity: disabled ? 0.6 : 1,
  };

  const textInputStyles: TextStyle = {
    ...styles.textInput,
    fontSize: sizeStyles.fontSize,
    color: disabled ? Colors.textMuted : Colors.text,
    paddingLeft: leftIcon ? 32 : 0,
    paddingRight: (rightIcon || showPasswordToggle) ? 32 : 0,
    ...inputStyle,
  };

  const labelStyles: TextStyle = {
    ...styles.label,
    color: error ? Colors.error : Colors.text,
    ...labelStyle,
  };

  const errorStyles: TextStyle = {
    ...styles.error,
    ...errorStyle,
  };

  const helperStyles: TextStyle = {
    ...styles.helper,
  };

  const handlePasswordToggle = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const renderRightIcon = () => {
    if (showPasswordToggle) {
      return (
        <TouchableOpacity
          style={styles.rightIcon}
          onPress={handlePasswordToggle}
          disabled={disabled}
        >
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.gray500}
          />
        </TouchableOpacity>
      );
    }

    if (rightIcon) {
      return (
        <TouchableOpacity
          style={styles.rightIcon}
          onPress={onRightIconPress}
          disabled={disabled || !onRightIconPress}
        >
          <Ionicons
            name={rightIcon}
            size={20}
            color={Colors.gray500}
          />
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={labelStyles}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={inputContainerStyles}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={Colors.gray500}
            />
          </View>
        )}
        
        <TextInput
          style={textInputStyles}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          {...props}
        />
        
        {renderRightIcon()}
      </View>
      
      {error && (
        <Text style={errorStyles}>{error}</Text>
      )}
      
      {helperText && !error && (
        <Text style={helperStyles}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  required: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  textInput: {
    flex: 1,
    height: '100%',
    color: Colors.text,
  },
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  error: {
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  helper: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});