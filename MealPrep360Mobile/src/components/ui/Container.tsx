import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { Colors, Layout, Spacing } from '../../constants/theme';

export interface ContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  safeArea?: boolean;
  scrollable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  paddingHorizontal?: 'none' | 'small' | 'medium' | 'large';
  paddingVertical?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  flex?: boolean;
  customStyle?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  safeArea = true,
  scrollable = false,
  padding = 'medium',
  paddingHorizontal,
  paddingVertical,
  backgroundColor = Colors.background,
  flex = true,
  customStyle,
  contentContainerStyle,
  ...props
}) => {
  const getPaddingStyles = () => {
    let styles: ViewStyle = {};

    if (padding !== 'none') {
      switch (padding) {
        case 'small':
          styles.padding = Spacing.sm;
          break;
        case 'medium':
          styles.padding = Layout.screenPadding;
          break;
        case 'large':
          styles.padding = Spacing.xl;
          break;
      }
    }

    if (paddingHorizontal !== undefined) {
      switch (paddingHorizontal) {
        case 'none':
          styles.paddingHorizontal = 0;
          break;
        case 'small':
          styles.paddingHorizontal = Spacing.sm;
          break;
        case 'medium':
          styles.paddingHorizontal = Layout.screenPadding;
          break;
        case 'large':
          styles.paddingHorizontal = Spacing.xl;
          break;
      }
    }

    if (paddingVertical !== undefined) {
      switch (paddingVertical) {
        case 'none':
          styles.paddingVertical = 0;
          break;
        case 'small':
          styles.paddingVertical = Spacing.sm;
          break;
        case 'medium':
          styles.paddingVertical = Layout.screenPadding;
          break;
        case 'large':
          styles.paddingVertical = Spacing.xl;
          break;
      }
    }

    return styles;
  };

  const containerStyle: ViewStyle = {
    backgroundColor,
    ...(flex && { flex: 1 }),
    ...getPaddingStyles(),
    ...customStyle,
  };

  const content = scrollable ? (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={contentContainerStyle}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle}>
      {children}
    </View>
  );

  return safeArea ? (
    <SafeAreaView style={styles.safeArea}>
      {content}
    </SafeAreaView>
  ) : (
    content
  );
};

// Preset Container Components
export const ScreenContainer: React.FC<Omit<ContainerProps, 'safeArea' | 'flex'>> = (props) => (
  <Container {...props} safeArea={true} flex={true} />
);

export const ScrollableContainer: React.FC<Omit<ContainerProps, 'scrollable'>> = (props) => (
  <Container {...props} scrollable={true} />
);

export const CardContainer: React.FC<Omit<ContainerProps, 'padding' | 'backgroundColor'>> = (props) => (
  <Container {...props} padding="medium" backgroundColor={Colors.white} />
);

export const SectionContainer: React.FC<ContainerProps> = ({
  children,
  customStyle,
  ...props
}) => (
  <Container
    {...props}
    customStyle={{ ...styles.section, ...customStyle }}
    safeArea={false}
    flex={false}
  >
    {children}
  </Container>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  section: {
    marginBottom: Spacing.lg,
  },
});