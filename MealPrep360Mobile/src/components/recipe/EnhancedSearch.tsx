import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Keyboard,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    SearchHistory,
    SearchSuggestion,
} from '../../types/recipe';
import {
    BorderRadius,
    Card,
    Colors,
    Spacing,
    Text,
    Typography
} from '../ui';

interface EnhancedSearchProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: (query: string) => void;
  placeholder?: string;
  suggestions: SearchSuggestion[];
  searchHistory: SearchHistory[];
  loading?: boolean;
  onSuggestionPress: (suggestion: SearchSuggestion) => void;
  onHistoryPress: (history: SearchHistory) => void;
  onClearHistory: () => void;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search recipes, ingredients, cuisines...',
  suggestions,
  searchHistory,
  loading = false,
  onSuggestionPress,
  onHistoryPress,
  onClearHistory,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const suggestionHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shouldShow = isFocused && (value.length > 0 || searchHistory.length > 0);
    setShowSuggestions(shouldShow);
    
    Animated.timing(suggestionHeight, {
      toValue: shouldShow ? 300 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, searchHistory.length, suggestionHeight]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow suggestion tap to register
    setTimeout(() => {
      setIsFocused(false);
    }, 150);
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      Keyboard.dismiss();
      setIsFocused(false);
    }
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    onSuggestionPress(suggestion);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const handleHistoryPress = (history: SearchHistory) => {
    onHistoryPress(history);
    setIsFocused(false);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const getFilteredSuggestions = () => {
    if (!value.trim()) return [];
    return suggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 6);
  };

  const getFilteredHistory = () => {
    if (value.trim()) return [];
    return searchHistory.slice(0, 5);
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recipe':
        return 'restaurant-outline';
      case 'ingredient':
        return 'leaf-outline';
      case 'cuisine':
        return 'globe-outline';
      case 'category':
        return 'grid-outline';
      default:
        return 'search-outline';
    }
  };

  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons
        name={getSuggestionIcon(item.type) as keyof typeof Ionicons.glyphMap}
        size={20}
        color={Colors.textSecondary}
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionContent}>
        <Text variant="body1" weight="medium">
          {item.text}
        </Text>
        {item.count && (
          <Text variant="caption" color={Colors.textMuted}>
            {item.count} recipes
          </Text>
        )}
      </View>
      <Text variant="caption" color={Colors.textMuted} customStyle={styles.suggestionType}>
        {item.type}
      </Text>
    </TouchableOpacity>
  );

  const renderHistoryItem = ({ item }: { item: SearchHistory }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistoryPress(item)}
    >
      <Ionicons
        name="time-outline"
        size={20}
        color={Colors.textSecondary}
        style={styles.historyIcon}
      />
      <View style={styles.historyContent}>
        <Text variant="body1">
          {item.query}
        </Text>
        <Text variant="caption" color={Colors.textMuted}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.historyDeleteButton}
        onPress={() => {
          // TODO: Remove individual history item
        }}
      >
        <Ionicons name="close" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSuggestionsHeader = () => {
    const filteredSuggestions = getFilteredSuggestions();
    const filteredHistory = getFilteredHistory();

    if (value.trim() && filteredSuggestions.length > 0) {
      return (
        <View style={styles.suggestionHeader}>
          <Text variant="body2" weight="semibold" color={Colors.textSecondary}>
            Suggestions
          </Text>
        </View>
      );
    }

    if (!value.trim() && filteredHistory.length > 0) {
      return (
        <View style={styles.suggestionHeader}>
          <Text variant="body2" weight="semibold" color={Colors.textSecondary}>
            Recent Searches
          </Text>
          <TouchableOpacity onPress={onClearHistory}>
            <Text variant="body2" color={Colors.primary}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    const filteredSuggestions = getFilteredSuggestions();
    const filteredHistory = getFilteredHistory();

    return (
      <Animated.View style={[styles.suggestionsContainer, { maxHeight: suggestionHeight }]}>
        <Card variant="elevated" padding="none" borderRadius="medium">
          {renderSuggestionsHeader()}
          {value.trim() ? (
            <FlatList
              data={filteredSuggestions}
              renderItem={renderSuggestionItem}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <FlatList
              data={filteredHistory}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id}
              style={styles.suggestionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <Ionicons
          name="search"
          size={20}
          color={Colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        
        {loading && (
          <View style={styles.loadingIndicator}>
            <Ionicons name="refresh" size={20} color={Colors.primary} />
          </View>
        )}
        
        {value.length > 0 && !loading && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearSearch}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={() => {
            // TODO: Implement voice search
          }}
        >
          <Ionicons name="mic-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      
      {renderSuggestions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchContainerFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
    paddingVertical: Spacing.xs,
  },
  loadingIndicator: {
    marginLeft: Spacing.sm,
  },
  clearButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  voiceButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1000,
    overflow: 'hidden',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionIcon: {
    marginRight: Spacing.md,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionType: {
    textTransform: 'capitalize',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  historyIcon: {
    marginRight: Spacing.md,
  },
  historyContent: {
    flex: 1,
  },
  historyDeleteButton: {
    padding: Spacing.xs,
  },
});