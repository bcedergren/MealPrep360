import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { RecipeCollection } from '../types/collections';
import { Recipe } from '../types/recipe';
import {
    FeedContent,
    FeedItemType,
    FeedVisibility,
    SocialComment,
    SocialFeedItem,
    SocialLike,
    SocialUserProfile,
} from '../types/social';
import { useSocialProfiles } from './useSocialProfiles';

interface UseSocialFeedProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // minutes
}

interface UseSocialFeedReturn {
  // Feed state
  feedItems: SocialFeedItem[];
  myPosts: SocialFeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error: string | null;

  // Feed actions
  refreshFeed: () => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  createPost: (content: CreatePostData) => Promise<SocialFeedItem>;
  updatePost: (postId: string, updates: Partial<SocialFeedItem>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  // Engagement actions
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  sharePost: (postId: string, message?: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  unbookmarkPost: (postId: string) => Promise<void>;

  // Comments
  comments: Record<string, SocialComment[]>;
  addComment: (postId: string, content: string, images?: string[]) => Promise<SocialComment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  likeComment: (commentId: string) => Promise<void>;
  unlikeComment: (commentId: string) => Promise<void>;
  getComments: (postId: string) => SocialComment[];

  // Feed filtering and discovery
  getPostsByUser: (userId: string) => SocialFeedItem[];
  getPostsByType: (type: FeedItemType) => SocialFeedItem[];
  searchPosts: (query: string) => SocialFeedItem[];
  getFollowingFeed: () => SocialFeedItem[];
  getExploreFeed: () => SocialFeedItem[];

  // Post creation helpers
  shareRecipe: (recipe: Recipe, message?: string, visibility?: FeedVisibility) => Promise<SocialFeedItem>;
  shareCollection: (collection: RecipeCollection, message?: string) => Promise<SocialFeedItem>;
  shareCookingPhoto: (recipeId: string, image: string, message?: string) => Promise<SocialFeedItem>;
  shareAchievement: (badgeId: string, message?: string) => Promise<SocialFeedItem>;

  // Analytics
  getFeedAnalytics: () => FeedAnalytics;
  getTopPosts: (timeframe?: '24h' | '7d' | '30d') => SocialFeedItem[];
  getTrendingHashtags: () => { tag: string; count: number }[];
}

interface CreatePostData {
  type: FeedItemType;
  content: Partial<FeedContent>;
  visibility: FeedVisibility;
  location?: string;
  tags?: string[];
  mentions?: string[];
}

interface FeedAnalytics {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number;
  topPerformingPost?: SocialFeedItem;
  avgLikesPerPost: number;
  avgCommentsPerPost: number;
  mostActiveDay: string;
  followerEngagement: number;
}

const STORAGE_KEYS = {
  FEED_ITEMS: 'social_feed_items',
  MY_POSTS: 'my_social_posts',
  COMMENTS: 'social_comments',
  LIKES: 'social_likes',
  BOOKMARKS: 'social_bookmarks',
  FEED_CACHE: 'feed_cache',
};

const FEED_PAGE_SIZE = 20;
const MAX_CACHE_AGE = 10 * 60 * 1000; // 10 minutes

export const useSocialFeed = ({
  autoRefresh = true,
  refreshInterval = 5, // 5 minutes
}: UseSocialFeedProps = {}): UseSocialFeedReturn => {
  const { user } = useUser();
  const { myProfile, getFollowing } = useSocialProfiles();

  // State
  const [feedItems, setFeedItems] = useState<SocialFeedItem[]>([]);
  const [myPosts, setMyPosts] = useState<SocialFeedItem[]>([]);
  const [comments, setComments] = useState<Record<string, SocialComment[]>>({});
  const [likes, setLikes] = useState<SocialLike[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Load data on mount
  useEffect(() => {
    if (user && myProfile) {
      loadFeedData();
    }
  }, [user?.id, myProfile?.userId]);

  // Auto-refresh feed
  useEffect(() => {
    if (autoRefresh && user && myProfile) {
      const refreshTimer = setInterval(() => {
        refreshFeed();
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(refreshTimer);
    }
  }, [autoRefresh, refreshInterval, user, myProfile]);

  // Load initial feed data
  const loadFeedData = useCallback(async () => {
    if (!user || !myProfile) return;

    try {
      setIsLoading(true);
      setError(null);

      const [feedData, postsData, commentsData, likesData, bookmarksData] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.FEED_ITEMS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.MY_POSTS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.COMMENTS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.LIKES}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.BOOKMARKS}_${user.id}`),
      ]);

      if (feedData) {
        const parsedFeed: SocialFeedItem[] = JSON.parse(feedData);
        setFeedItems(parsedFeed);
      } else {
        // Generate sample feed for demo
        const sampleFeed = generateSampleFeed();
        setFeedItems(sampleFeed);
        await saveFeedItems(sampleFeed);
      }

      if (postsData) {
        setMyPosts(JSON.parse(postsData));
      }

      if (commentsData) {
        setComments(JSON.parse(commentsData));
      }

      if (likesData) {
        setLikes(JSON.parse(likesData));
      }

      if (bookmarksData) {
        setBookmarks(JSON.parse(bookmarksData));
      }
    } catch (err) {
      console.error('Error loading feed data:', err);
      setError('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [user, myProfile]);

  // Generate sample feed for demo
  const generateSampleFeed = useCallback((): SocialFeedItem[] => {
    if (!myProfile) return [];

    const sampleItems: SocialFeedItem[] = [
      {
        id: 'feed_1',
        userId: 'sample_user_1',
        userProfile: {
          userId: 'sample_user_1',
          username: 'chefmaria',
          displayName: 'Maria Rodriguez',
          profileImageUrl: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=MR',
          cookingLevel: 'Advanced',
          level: 12,
          isVerified: true,
        } as SocialUserProfile,
        type: 'recipe_shared',
        content: {
          text: 'Just shared my grandmother\'s secret paella recipe! 🥘 This has been in our family for generations.',
          images: ['https://via.placeholder.com/400/FFD93D/FFFFFF?text=Paella'],
          recipe: {
            id: 'recipe_paella',
            title: 'Authentic Spanish Paella',
            description: 'Traditional paella valenciana with saffron and seafood',
            imageUrl: 'https://via.placeholder.com/400/FFD93D/FFFFFF?text=Paella',
            prepTime: 30,
            cookTime: 45,
            servings: 6,
            difficulty: 'Medium',
            tags: ['Spanish', 'Seafood', 'Traditional'],
          } as Recipe,
          tags: ['paella', 'spanish', 'traditional', 'family'],
        },
        visibility: 'public',
        likesCount: 24,
        commentsCount: 8,
        sharesCount: 3,
        isLikedByUser: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'feed_2',
        userId: 'sample_user_2',
        userProfile: {
          userId: 'sample_user_2',
          username: 'healthychef_alex',
          displayName: 'Alex Chen',
          profileImageUrl: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=AC',
          cookingLevel: 'Expert',
          level: 18,
          isVerified: false,
        } as SocialUserProfile,
        type: 'recipe_cooked',
        content: {
          text: 'Made this amazing quinoa Buddha bowl for lunch! 🥗 Perfect balance of protein and veggies.',
          images: ['https://via.placeholder.com/400/4ECDC4/FFFFFF?text=Buddha+Bowl'],
          location: 'San Francisco, CA',
          tags: ['healthy', 'quinoa', 'vegan', 'lunch'],
        },
        visibility: 'public',
        likesCount: 15,
        commentsCount: 4,
        sharesCount: 1,
        isLikedByUser: true,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'feed_3',
        userId: 'sample_user_3',
        userProfile: {
          userId: 'sample_user_3',
          username: 'bakerben',
          displayName: 'Ben Williams',
          profileImageUrl: 'https://via.placeholder.com/150/FF8B94/FFFFFF?text=BW',
          cookingLevel: 'Intermediate',
          level: 8,
          isVerified: false,
        } as SocialUserProfile,
        type: 'achievement_unlocked',
        content: {
          text: 'Just unlocked the "Master Baker" badge! 🏆 50 bread recipes completed!',
          badge: {
            id: 'master_baker',
            name: 'Master Baker',
            description: 'Completed 50 bread recipes',
            iconUrl: '/badges/master-baker.png',
            rarity: 'Epic',
            unlockedAt: new Date().toISOString(),
            category: 'Recipe Mastery',
          },
        },
        visibility: 'public',
        likesCount: 31,
        commentsCount: 12,
        sharesCount: 0,
        isLikedByUser: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return sampleItems;
  }, [myProfile]);

  // Save feed items to storage
  const saveFeedItems = useCallback(async (items: SocialFeedItem[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.FEED_ITEMS}_${user.id}`,
        JSON.stringify(items)
      );
    } catch (err) {
      console.error('Error saving feed items:', err);
    }
  }, [user]);

  // Save my posts to storage
  const saveMyPosts = useCallback(async (posts: SocialFeedItem[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.MY_POSTS}_${user.id}`,
        JSON.stringify(posts)
      );
    } catch (err) {
      console.error('Error saving my posts:', err);
    }
  }, [user]);

  // Refresh feed
  const refreshFeed = useCallback(async () => {
    if (!user || !myProfile) return;

    try {
      setIsRefreshing(true);
      setError(null);

      // In production, this would fetch from API
      // For now, simulate refresh by adding timestamp
      const updatedFeed = feedItems.map(item => ({
        ...item,
        updatedAt: new Date().toISOString(),
      }));

      setFeedItems(updatedFeed);
      await saveFeedItems(updatedFeed);
      setPage(0);
      setHasMore(true);
    } catch (err) {
      console.error('Error refreshing feed:', err);
      setError('Failed to refresh feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [user, myProfile, feedItems, saveFeedItems]);

  // Load more feed items (pagination)
  const loadMoreFeed = useCallback(async () => {
    if (!hasMore || isLoading) return;

    try {
      setIsLoading(true);
      
      // In production, this would fetch next page from API
      // For now, simulate pagination
      const nextPage = page + 1;
      if (nextPage >= 3) { // Simulate max 3 pages
        setHasMore(false);
        return;
      }

      // Generate more sample items
      const moreSampleItems = generateSampleFeed().map((item, index) => ({
        ...item,
        id: `${item.id}_page_${nextPage}_${index}`,
        createdAt: new Date(Date.now() - (nextPage * 24 + index) * 60 * 60 * 1000).toISOString(),
      }));

      const updatedFeed = [...feedItems, ...moreSampleItems];
      setFeedItems(updatedFeed);
      await saveFeedItems(updatedFeed);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page, feedItems, generateSampleFeed, saveFeedItems]);

  // Create new post
  const createPost = useCallback(async (postData: CreatePostData): Promise<SocialFeedItem> => {
    if (!user || !myProfile) throw new Error('User not authenticated');

    try {
      const newPost: SocialFeedItem = {
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: myProfile.userId,
        userProfile: myProfile,
        type: postData.type,
        content: postData.content,
        visibility: postData.visibility,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLikedByUser: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to feeds
      const updatedFeed = [newPost, ...feedItems];
      const updatedMyPosts = [newPost, ...myPosts];

      setFeedItems(updatedFeed);
      setMyPosts(updatedMyPosts);

      // Save to storage
      await Promise.all([
        saveFeedItems(updatedFeed),
        saveMyPosts(updatedMyPosts),
      ]);

      return newPost;
    } catch (err) {
      console.error('Error creating post:', err);
      throw new Error('Failed to create post');
    }
  }, [user, myProfile, feedItems, myPosts, saveFeedItems, saveMyPosts]);

  // Update existing post
  const updatePost = useCallback(async (postId: string, updates: Partial<SocialFeedItem>) => {
    try {
      const updatedFeed = feedItems.map(item =>
        item.id === postId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );

      const updatedMyPosts = myPosts.map(item =>
        item.id === postId
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );

      setFeedItems(updatedFeed);
      setMyPosts(updatedMyPosts);

      await Promise.all([
        saveFeedItems(updatedFeed),
        saveMyPosts(updatedMyPosts),
      ]);
    } catch (err) {
      console.error('Error updating post:', err);
      throw new Error('Failed to update post');
    }
  }, [feedItems, myPosts, saveFeedItems, saveMyPosts]);

  // Delete post
  const deletePost = useCallback(async (postId: string) => {
    try {
      const updatedFeed = feedItems.filter(item => item.id !== postId);
      const updatedMyPosts = myPosts.filter(item => item.id !== postId);

      setFeedItems(updatedFeed);
      setMyPosts(updatedMyPosts);

      await Promise.all([
        saveFeedItems(updatedFeed),
        saveMyPosts(updatedMyPosts),
      ]);
    } catch (err) {
      console.error('Error deleting post:', err);
      throw new Error('Failed to delete post');
    }
  }, [feedItems, myPosts, saveFeedItems, saveMyPosts]);

  // Like post
  const likePost = useCallback(async (postId: string) => {
    if (!user || !myProfile) return;

    try {
      // Create like record
      const like: SocialLike = {
        id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: myProfile.userId,
        targetType: 'feed_item',
        targetId: postId,
        createdAt: new Date().toISOString(),
      };

      const updatedLikes = [...likes, like];
      setLikes(updatedLikes);

      // Update post like count
      await updatePost(postId, {
        likesCount: (feedItems.find(item => item.id === postId)?.likesCount || 0) + 1,
        isLikedByUser: true,
      });

      // Save likes
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.LIKES}_${user.id}`,
        JSON.stringify(updatedLikes)
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  }, [user, myProfile, likes, feedItems, updatePost]);

  // Unlike post
  const unlikePost = useCallback(async (postId: string) => {
    if (!user || !myProfile) return;

    try {
      const updatedLikes = likes.filter(
        like => !(like.targetType === 'feed_item' && like.targetId === postId && like.userId === myProfile.userId)
      );
      setLikes(updatedLikes);

      // Update post like count
      await updatePost(postId, {
        likesCount: Math.max(0, (feedItems.find(item => item.id === postId)?.likesCount || 1) - 1),
        isLikedByUser: false,
      });

      // Save likes
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.LIKES}_${user.id}`,
        JSON.stringify(updatedLikes)
      );
    } catch (err) {
      console.error('Error unliking post:', err);
    }
  }, [user, myProfile, likes, feedItems, updatePost]);

  // Share post
  const sharePost = useCallback(async (postId: string, message?: string) => {
    if (!user || !myProfile) return;

    const originalPost = feedItems.find(item => item.id === postId);
    if (!originalPost) return;

    await createPost({
      type: 'recipe_shared',
      content: {
        text: message,
        recipe: originalPost.content.recipe,
      },
      visibility: 'public',
    });

    // Update original post share count
    await updatePost(postId, {
      sharesCount: originalPost.sharesCount + 1,
    });
  }, [user, myProfile, feedItems, createPost, updatePost]);

  // Bookmark post
  const bookmarkPost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const updatedBookmarks = [...bookmarks, postId];
      setBookmarks(updatedBookmarks);

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.BOOKMARKS}_${user.id}`,
        JSON.stringify(updatedBookmarks)
      );
    } catch (err) {
      console.error('Error bookmarking post:', err);
    }
  }, [user, bookmarks]);

  // Unbookmark post
  const unbookmarkPost = useCallback(async (postId: string) => {
    if (!user) return;

    try {
      const updatedBookmarks = bookmarks.filter(id => id !== postId);
      setBookmarks(updatedBookmarks);

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.BOOKMARKS}_${user.id}`,
        JSON.stringify(updatedBookmarks)
      );
    } catch (err) {
      console.error('Error unbookmarking post:', err);
    }
  }, [user, bookmarks]);

  // Add comment
  const addComment = useCallback(async (
    postId: string, 
    content: string, 
    images?: string[]
  ): Promise<SocialComment> => {
    if (!user || !myProfile) throw new Error('User not authenticated');

    try {
      const newComment: SocialComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        feedItemId: postId,
        userId: myProfile.userId,
        userProfile: myProfile,
        content,
        images,
        likesCount: 0,
        isLikedByUser: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const postComments = comments[postId] || [];
      const updatedComments = { ...comments, [postId]: [...postComments, newComment] };
      setComments(updatedComments);

      // Update post comment count
      await updatePost(postId, {
        commentsCount: (feedItems.find(item => item.id === postId)?.commentsCount || 0) + 1,
      });

      // Save comments
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.COMMENTS}_${user.id}`,
        JSON.stringify(updatedComments)
      );

      return newComment;
    } catch (err) {
      console.error('Error adding comment:', err);
      throw new Error('Failed to add comment');
    }
  }, [user, myProfile, comments, feedItems, updatePost]);

  // Update comment
  const updateComment = useCallback(async (commentId: string, content: string) => {
    try {
      const updatedComments = { ...comments };
      
      Object.keys(updatedComments).forEach(postId => {
        updatedComments[postId] = updatedComments[postId].map(comment =>
          comment.id === commentId
            ? { ...comment, content, updatedAt: new Date().toISOString() }
            : comment
        );
      });

      setComments(updatedComments);

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.COMMENTS}_${user?.id}`,
        JSON.stringify(updatedComments)
      );
    } catch (err) {
      console.error('Error updating comment:', err);
      throw new Error('Failed to update comment');
    }
  }, [comments, user]);

  // Delete comment
  const deleteComment = useCallback(async (commentId: string) => {
    try {
      const updatedComments = { ...comments };
      let postId = '';
      
      Object.keys(updatedComments).forEach(pid => {
        const originalLength = updatedComments[pid].length;
        updatedComments[pid] = updatedComments[pid].filter(comment => comment.id !== commentId);
        if (updatedComments[pid].length < originalLength) {
          postId = pid;
        }
      });

      setComments(updatedComments);

      if (postId) {
        // Update post comment count
        await updatePost(postId, {
          commentsCount: Math.max(0, (feedItems.find(item => item.id === postId)?.commentsCount || 1) - 1),
        });
      }

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.COMMENTS}_${user?.id}`,
        JSON.stringify(updatedComments)
      );
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw new Error('Failed to delete comment');
    }
  }, [comments, user, feedItems, updatePost]);

  // Like comment
  const likeComment = useCallback(async (commentId: string) => {
    if (!user || !myProfile) return;

    try {
      const like: SocialLike = {
        id: `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: myProfile.userId,
        targetType: 'comment',
        targetId: commentId,
        createdAt: new Date().toISOString(),
      };

      const updatedLikes = [...likes, like];
      setLikes(updatedLikes);

      // Update comment like count
      const updatedComments = { ...comments };
      Object.keys(updatedComments).forEach(postId => {
        updatedComments[postId] = updatedComments[postId].map(comment =>
          comment.id === commentId
            ? { ...comment, likesCount: comment.likesCount + 1, isLikedByUser: true }
            : comment
        );
      });
      setComments(updatedComments);

      await Promise.all([
        AsyncStorage.setItem(`${STORAGE_KEYS.LIKES}_${user.id}`, JSON.stringify(updatedLikes)),
        AsyncStorage.setItem(`${STORAGE_KEYS.COMMENTS}_${user.id}`, JSON.stringify(updatedComments)),
      ]);
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  }, [user, myProfile, likes, comments]);

  // Unlike comment
  const unlikeComment = useCallback(async (commentId: string) => {
    if (!user || !myProfile) return;

    try {
      const updatedLikes = likes.filter(
        like => !(like.targetType === 'comment' && like.targetId === commentId && like.userId === myProfile.userId)
      );
      setLikes(updatedLikes);

      // Update comment like count
      const updatedComments = { ...comments };
      Object.keys(updatedComments).forEach(postId => {
        updatedComments[postId] = updatedComments[postId].map(comment =>
          comment.id === commentId
            ? { ...comment, likesCount: Math.max(0, comment.likesCount - 1), isLikedByUser: false }
            : comment
        );
      });
      setComments(updatedComments);

      await Promise.all([
        AsyncStorage.setItem(`${STORAGE_KEYS.LIKES}_${user.id}`, JSON.stringify(updatedLikes)),
        AsyncStorage.setItem(`${STORAGE_KEYS.COMMENTS}_${user.id}`, JSON.stringify(updatedComments)),
      ]);
    } catch (err) {
      console.error('Error unliking comment:', err);
    }
  }, [user, myProfile, likes, comments]);

  // Get comments for a post
  const getComments = useCallback((postId: string): SocialComment[] => {
    return comments[postId] || [];
  }, [comments]);

  // Get posts by user
  const getPostsByUser = useCallback((userId: string): SocialFeedItem[] => {
    return feedItems.filter(item => item.userId === userId);
  }, [feedItems]);

  // Get posts by type
  const getPostsByType = useCallback((type: FeedItemType): SocialFeedItem[] => {
    return feedItems.filter(item => item.type === type);
  }, [feedItems]);

  // Search posts
  const searchPosts = useCallback((query: string): SocialFeedItem[] => {
    const lowercaseQuery = query.toLowerCase();
    return feedItems.filter(item =>
      item.content.text?.toLowerCase().includes(lowercaseQuery) ||
      item.content.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      item.userProfile?.displayName.toLowerCase().includes(lowercaseQuery)
    );
  }, [feedItems]);

  // Get following feed (posts from people you follow)
  const getFollowingFeed = useCallback((): SocialFeedItem[] => {
    if (!myProfile) return [];
    
    const following = getFollowing();
    const followingIds = following.map(p => p.userId);
    
    return feedItems.filter(item => followingIds.includes(item.userId));
  }, [feedItems, myProfile, getFollowing]);

  // Get explore feed (public posts from everyone)
  const getExploreFeed = useCallback((): SocialFeedItem[] => {
    return feedItems.filter(item => item.visibility === 'public');
  }, [feedItems]);

  // Share recipe
  const shareRecipe = useCallback(async (
    recipe: Recipe, 
    message?: string, 
    visibility: FeedVisibility = 'public'
  ): Promise<SocialFeedItem> => {
    return await createPost({
      type: 'recipe_shared',
      content: {
        text: message,
        recipe,
        tags: recipe.tags?.map(tag => tag.toLowerCase()),
      },
      visibility,
    });
  }, [createPost]);

  // Share collection
  const shareCollection = useCallback(async (
    collection: RecipeCollection, 
    message?: string
  ): Promise<SocialFeedItem> => {
    return await createPost({
      type: 'collection_shared',
      content: {
        text: message,
        collection,
        tags: collection.tags?.map(tag => tag.toLowerCase()),
      },
      visibility: collection.isPrivate ? 'followers' : 'public',
    });
  }, [createPost]);

  // Share cooking photo
  const shareCookingPhoto = useCallback(async (
    recipeId: string, 
    image: string, 
    message?: string
  ): Promise<SocialFeedItem> => {
    return await createPost({
      type: 'recipe_photo',
      content: {
        text: message,
        images: [image],
        tags: ['cooking', 'homemade'],
      },
      visibility: 'public',
    });
  }, [createPost]);

  // Share achievement
  const shareAchievement = useCallback(async (
    badgeId: string, 
    message?: string
  ): Promise<SocialFeedItem> => {
    // In production, would fetch badge details
    const badge = {
      id: badgeId,
      name: 'Achievement Badge',
      description: 'A cooking achievement',
      iconUrl: '/badges/default.png',
      rarity: 'Common' as const,
      unlockedAt: new Date().toISOString(),
      category: 'Cooking Milestones' as const,
    };

    return await createPost({
      type: 'achievement_unlocked',
      content: {
        text: message,
        badge,
        tags: ['achievement', 'milestone'],
      },
      visibility: 'public',
    });
  }, [createPost]);

  // Get feed analytics
  const getFeedAnalytics = useCallback((): FeedAnalytics => {
    const totalPosts = myPosts.length;
    const totalLikes = myPosts.reduce((sum, post) => sum + post.likesCount, 0);
    const totalComments = myPosts.reduce((sum, post) => sum + post.commentsCount, 0);
    const totalShares = myPosts.reduce((sum, post) => sum + post.sharesCount, 0);
    
    const engagementRate = totalPosts > 0 
      ? ((totalLikes + totalComments + totalShares) / totalPosts) 
      : 0;

    const topPerformingPost = myPosts.sort((a, b) => 
      (b.likesCount + b.commentsCount + b.sharesCount) - (a.likesCount + a.commentsCount + a.sharesCount)
    )[0];

    return {
      totalPosts,
      totalLikes,
      totalComments,
      totalShares,
      engagementRate: Math.round(engagementRate * 100) / 100,
      topPerformingPost,
      avgLikesPerPost: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0,
      avgCommentsPerPost: totalPosts > 0 ? Math.round(totalComments / totalPosts) : 0,
      mostActiveDay: 'Monday', // Would calculate from actual data
      followerEngagement: 75, // Would calculate from follower interactions
    };
  }, [myPosts]);

  // Get top posts
  const getTopPosts = useCallback((timeframe: '24h' | '7d' | '30d' = '7d'): SocialFeedItem[] => {
    const now = new Date();
    let cutoffTime: Date;

    switch (timeframe) {
      case '24h':
        cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    return feedItems
      .filter(item => new Date(item.createdAt) > cutoffTime)
      .sort((a, b) => (b.likesCount + b.commentsCount + b.sharesCount) - (a.likesCount + a.commentsCount + a.sharesCount))
      .slice(0, 10);
  }, [feedItems]);

  // Get trending hashtags
  const getTrendingHashtags = useCallback((): { tag: string; count: number }[] => {
    const tagCounts = new Map<string, number>();

    feedItems.forEach(item => {
      item.content.tags?.forEach(tag => {
        const normalizedTag = tag.toLowerCase();
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [feedItems]);

  return {
    // Feed state
    feedItems,
    myPosts,
    isLoading,
    isRefreshing,
    hasMore,
    error,

    // Feed actions
    refreshFeed,
    loadMoreFeed,
    createPost,
    updatePost,
    deletePost,

    // Engagement actions
    likePost,
    unlikePost,
    sharePost,
    bookmarkPost,
    unbookmarkPost,

    // Comments
    comments,
    addComment,
    updateComment,
    deleteComment,
    likeComment,
    unlikeComment,
    getComments,

    // Feed filtering and discovery
    getPostsByUser,
    getPostsByType,
    searchPosts,
    getFollowingFeed,
    getExploreFeed,

    // Post creation helpers
    shareRecipe,
    shareCollection,
    shareCookingPhoto,
    shareAchievement,

    // Analytics
    getFeedAnalytics,
    getTopPosts,
    getTrendingHashtags,
  };
};