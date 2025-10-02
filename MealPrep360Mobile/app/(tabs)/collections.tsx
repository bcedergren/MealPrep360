import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRecipeCollections } from '../../src/hooks/useRecipeCollections';
import { useRecipeRatings } from '../../src/hooks/useRecipeRatings';
import {
    COLLECTION_COLORS,
    CollectionTemplate,
    RecipeCollection
} from '../../src/types/collections';

const CollectionsScreen = () => {
  const {
    collections,
    bookmarks,
    isLoading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addToFavorites,
    removeFromFavorites,
    isRecipeBookmarked,
    getCollectionById,
    getTotalRecipeCount,
    getMostUsedCollections,
    getRecentlyAddedRecipes,
    createCollectionFromTemplate,
    getCollectionTemplates,
  } = useRecipeCollections();

  const { getAverageRating } = useRecipeRatings();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<RecipeCollection | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'size'>('recent');

  // Create collection state
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [newCollectionEmoji, setNewCollectionEmoji] = useState('📂');
  const [newCollectionColor, setNewCollectionColor] = useState(COLLECTION_COLORS[0]);

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    // In a real app, this would refresh data from the server
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Filter and sort collections
  const filteredCollections = collections
    .filter(collection => 
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.recipeCount - a.recipeCount;
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  // Handle create collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    try {
      await createCollection({
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
        emoji: newCollectionEmoji,
        color: newCollectionColor,
      });

      // Reset form
      setNewCollectionName('');
      setNewCollectionDescription('');
      setNewCollectionEmoji('📂');
      setNewCollectionColor(COLLECTION_COLORS[0]);
      setShowCreateModal(false);

      Alert.alert('Success', 'Collection created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  // Handle create from template
  const handleCreateFromTemplate = async (template: CollectionTemplate) => {
    try {
      await createCollectionFromTemplate(template.id);
      setShowTemplateModal(false);
      Alert.alert('Success', `${template.name} collection created!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to create collection from template');
    }
  };

  // Handle delete collection
  const handleDeleteCollection = (collection: RecipeCollection) => {
    if (collection.isDefault) {
      Alert.alert('Error', 'Cannot delete default collections');
      return;
    }

    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${collection.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollection(collection.id);
              Alert.alert('Success', 'Collection deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  };

  // Recently added recipes
  const recentlyAdded = getRecentlyAddedRecipes(6);

  // Stats
  const totalRecipes = getTotalRecipeCount();
  const mostUsedCollections = getMostUsedCollections(3);

  // Collection Card Component
  const CollectionCard = ({ collection }: { collection: RecipeCollection }) => {
    const isGrid = viewMode === 'grid';
    
    return (
      <TouchableOpacity
        style={[
          styles.collectionCard,
          isGrid ? styles.collectionCardGrid : styles.collectionCardList,
          { borderLeftColor: collection.color },
        ]}
        onPress={() => setSelectedCollection(collection)}
        onLongPress={() => {
          Alert.alert(
            collection.name,
            collection.description || 'No description',
            [
              { text: 'Edit', onPress: () => {/* Edit collection */} },
              { text: 'Share', onPress: () => {/* Share collection */} },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteCollection(collection) },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        }}
      >
        <View style={styles.collectionHeader}>
          <View style={[styles.collectionIcon, { backgroundColor: collection.color + '20' }]}>
            <Text style={styles.collectionEmoji}>{collection.emoji}</Text>
          </View>
          <View style={styles.collectionInfo}>
            <Text style={styles.collectionName} numberOfLines={1}>
              {collection.name}
            </Text>
            <Text style={styles.collectionCount}>
              {collection.recipeCount} recipe{collection.recipeCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {collection.isShared && (
            <Ionicons name="share-outline" size={16} color="#8B5CF6" />
          )}
        </View>
        
        {collection.description && (
          <Text style={styles.collectionDescription} numberOfLines={2}>
            {collection.description}
          </Text>
        )}

        <View style={styles.collectionFooter}>
          <Text style={styles.collectionUpdated}>
            Updated {new Date(collection.updatedAt).toLocaleDateString()}
          </Text>
          {collection.recipeCount > 0 && (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => setSelectedCollection(collection)}
            >
              <Text style={styles.viewButtonText}>View</Text>
              <Ionicons name="chevron-forward" size={14} color="#8B5CF6" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Template Card Component
  const TemplateCard = ({ template }: { template: CollectionTemplate }) => (
    <TouchableOpacity
      style={[styles.templateCard, { borderLeftColor: template.color }]}
      onPress={() => handleCreateFromTemplate(template)}
    >
      <View style={styles.templateHeader}>
        <View style={[styles.templateIcon, { backgroundColor: template.color + '20' }]}>
          <Text style={styles.templateEmoji}>{template.emoji}</Text>
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateCardDescription} numberOfLines={2}>
            {template.description}
          </Text>
        </View>
      </View>
      <Ionicons name="add-circle" size={20} color={template.color} />
    </TouchableOpacity>
  );

  // Recently Added Recipe Card
  const RecentRecipeCard = ({ item }: { item: any }) => {
    const rating = getAverageRating(item.recipe.id);
    
    return (
      <TouchableOpacity style={styles.recentRecipeCard}>
        <Image source={{ uri: item.recipe.imageUrl }} style={styles.recentRecipeImage} />
        <View style={styles.recentRecipeOverlay}>
          <Text style={styles.recentRecipeTitle} numberOfLines={2}>
            {item.recipe.title}
          </Text>
          <View style={styles.recentRecipeInfo}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{rating.average.toFixed(1)}</Text>
            </View>
            <Text style={styles.recentRecipeCollection}>
              {item.collection.name}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your collections...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Collections</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color="#8B5CF6" 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={24} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Recipe Collection</Text>
            <Text style={styles.statsNumber}>{totalRecipes}</Text>
            <Text style={styles.statsSubtitle}>recipes saved</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.quickActionButtons}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Ionicons name="library-outline" size={20} color="#8B5CF6" />
              <Text style={styles.quickActionText}>From Template</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#8B5CF6" />
              <Text style={styles.quickActionText}>New Collection</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <FlatList
              data={recentlyAdded}
              renderItem={RecentRecipeCard}
              keyExtractor={(item) => item.recipe.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
            />
          </View>
        )}

        {/* Search and Sort */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search collections..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#6B7280"
            />
          </View>
          <TouchableOpacity style={styles.sortButton}>
            <Ionicons name="funnel-outline" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Collections Grid/List */}
        <View style={styles.collectionsSection}>
          <Text style={styles.sectionTitle}>
            All Collections ({filteredCollections.length})
          </Text>
          
          {filteredCollections.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="folder-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No collections yet</Text>
              <Text style={styles.emptyStateDescription}>
                Create your first collection to organize your favorite recipes
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.createFirstButtonText}>Create Collection</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={viewMode === 'grid' ? styles.collectionsGrid : styles.collectionsList}>
              {filteredCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TouchableOpacity onPress={handleCreateCollection}>
              <Text style={styles.modalSave}>Create</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Collection Icon */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Icon & Color</Text>
              <View style={styles.iconColorContainer}>
                <TouchableOpacity
                  style={[styles.iconPreview, { backgroundColor: newCollectionColor + '20' }]}
                >
                  <Text style={styles.iconPreviewEmoji}>{newCollectionEmoji}</Text>
                </TouchableOpacity>
                <View style={styles.colorPicker}>
                  {COLLECTION_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newCollectionColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setNewCollectionColor(color)}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* Collection Name */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g., Weeknight Dinners"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholderTextColor="#6B7280"
              />
            </View>

            {/* Collection Description */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                placeholder="Describe what recipes you'll collect here..."
                value={newCollectionDescription}
                onChangeText={setNewCollectionDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#6B7280"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Collection Templates</Text>
            <View style={styles.modalSpacer} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.templateDescription}>
              Choose from popular collection templates to get started quickly:
            </Text>
            
            {getCollectionTemplates().map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
    paddingBottom: 0,
  },
  statsCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
  },
  statsTitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 8,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentList: {
    paddingRight: 20,
  },
  recentRecipeCard: {
    width: 120,
    height: 100,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentRecipeImage: {
    width: '100%',
    height: '100%',
  },
  recentRecipeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  recentRecipeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  recentRecipeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '500',
  },
  recentRecipeCollection: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
  },
  sortButton: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  collectionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  collectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  collectionsList: {
    gap: 12,
  },
  collectionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  collectionCardGrid: {
    width: '48%',
  },
  collectionCardList: {
    width: '100%',
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collectionEmoji: {
    fontSize: 20,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  collectionCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  collectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  collectionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionUpdated: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  modalSpacer: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  iconColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPreviewEmoji: {
    fontSize: 24,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  templateEmoji: {
    fontSize: 20,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  templateCardDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default CollectionsScreen;