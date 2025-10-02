import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StatusBar,
    StatusBarStyle,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../../constants/theme';
import { Container } from './Container';
import { Text } from './Text';

export interface ScreenProps {
  children: React.ReactNode;
  
  // Header configuration
  headerTitle?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerBackButton?: boolean;
  onHeaderBackPress?: () => void;
  
  // Layout configuration
  scrollable?: boolean;
  padding?: 'none' | 'small' | 'medium' | 'large';
  backgroundColor?: string;
  safeArea?: boolean;
  
  // Status bar configuration
  statusBarStyle?: StatusBarStyle;
  statusBarBackgroundColor?: string;
  
  // Style overrides
  customStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  headerTitle,
  headerLeft,
  headerRight,
  headerBackButton = false,
  onHeaderBackPress,
  scrollable = false,
  padding = 'medium',
  backgroundColor = Colors.background,
  safeArea = true,
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor = Colors.background,
  customStyle,
  headerStyle,
  contentStyle,
}) => {
  const renderHeader = () => {
    if (!headerTitle && !headerLeft && !headerRight && !headerBackButton) {
      return null;
    }

    return (
      <View style={[styles.header, headerStyle]}>
        <View style={styles.headerLeft}>
          {headerBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onHeaderBackPress}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
          {headerLeft}
        </View>
        
        <View style={styles.headerCenter}>
          {headerTitle && (
            <Text variant="h6" weight="semibold" numberOfLines={1}>
              {headerTitle}
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {headerRight}
        </View>
      </View>
    );
  };

  const screenStyle: ViewStyle = {
    flex: 1,
    backgroundColor,
    ...customStyle,
  };

  const contentProps = {
    scrollable,
    padding,
    backgroundColor,
    safeArea: false, // We handle safe area at screen level
    customStyle: contentStyle,
  };

  const content = (
    <View style={screenStyle}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
      />
      {renderHeader()}
      <Container {...contentProps}>
        {children}
      </Container>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.headerHeight,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
});