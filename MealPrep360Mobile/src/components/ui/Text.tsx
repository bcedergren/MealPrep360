import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

export interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right' | 'justify';
  customStyle?: TextStyle;
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body1',
  color = Colors.text,
  weight = 'regular',
  align = 'left',
  customStyle,
  children,
  ...props
}) => {
  const getVariantStyles = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: Typography['5xl'],
          lineHeight: Typography['5xl'] * Typography.lineHeights.tight,
          fontWeight: 'bold',
        };
      case 'h2':
        return {
          fontSize: Typography['4xl'],
          lineHeight: Typography['4xl'] * Typography.lineHeights.tight,
          fontWeight: 'bold',
        };
      case 'h3':
        return {
          fontSize: Typography['3xl'],
          lineHeight: Typography['3xl'] * Typography.lineHeights.snug,
          fontWeight: '600',
        };
      case 'h4':
        return {
          fontSize: Typography['2xl'],
          lineHeight: Typography['2xl'] * Typography.lineHeights.snug,
          fontWeight: '600',
        };
      case 'h5':
        return {
          fontSize: Typography.xl,
          lineHeight: Typography.xl * Typography.lineHeights.snug,
          fontWeight: '600',
        };
      case 'h6':
        return {
          fontSize: Typography.lg,
          lineHeight: Typography.lg * Typography.lineHeights.normal,
          fontWeight: '600',
        };
      case 'body1':
        return {
          fontSize: Typography.base,
          lineHeight: Typography.base * Typography.lineHeights.normal,
          fontWeight: 'normal',
        };
      case 'body2':
        return {
          fontSize: Typography.sm,
          lineHeight: Typography.sm * Typography.lineHeights.normal,
          fontWeight: 'normal',
        };
      case 'caption':
        return {
          fontSize: Typography.xs,
          lineHeight: Typography.xs * Typography.lineHeights.normal,
          fontWeight: 'normal',
        };
      case 'overline':
        return {
          fontSize: Typography.xs,
          lineHeight: Typography.xs * Typography.lineHeights.normal,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: Typography.letterSpacing.wide,
        };
      default:
        return {
          fontSize: Typography.base,
          lineHeight: Typography.base * Typography.lineHeights.normal,
          fontWeight: 'normal',
        };
    }
  };

  const getWeightStyles = (): TextStyle => {
    switch (weight) {
      case 'regular':
        return { fontWeight: 'normal' };
      case 'medium':
        return { fontWeight: '500' };
      case 'semibold':
        return { fontWeight: '600' };
      case 'bold':
        return { fontWeight: 'bold' };
      default:
        return { fontWeight: 'normal' };
    }
  };

  const textStyle: TextStyle = {
    ...getVariantStyles(),
    ...getWeightStyles(),
    color,
    textAlign: align,
    ...customStyle,
  };

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

// Preset Text Components
export const Heading1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h1" />
);

export const Heading2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h2" />
);

export const Heading3: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h3" />
);

export const Heading4: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h4" />
);

export const Heading5: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h5" />
);

export const Heading6: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="h6" />
);

export const Body1: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="body1" />
);

export const Body2: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="body2" />
);

export const Caption: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="caption" />
);

export const Overline: React.FC<Omit<TextProps, 'variant'>> = (props) => (
  <Text {...props} variant="overline" />
);

// Specialized Text Components
export const ErrorText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.error} />
);

export const SuccessText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.success} />
);

export const WarningText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.warning} />
);

export const InfoText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.info} />
);

export const MutedText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.textMuted} />
);

export const SecondaryText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.textSecondary} />
);

export const PrimaryText: React.FC<Omit<TextProps, 'color'>> = (props) => (
  <Text {...props} color={Colors.primary} />
);