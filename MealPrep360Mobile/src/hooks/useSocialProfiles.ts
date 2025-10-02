import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import {
    ConnectionRequest,
    ConnectionStatus,
    CookingGoal,
    CookingLevel,
    DEFAULT_USER_BADGES,
    SocialConnection,
    SocialUserProfile,
    UserBadge,
    calculateUserLevel,
    formatUserLevel,
    getXpToNextLevel
} from '../types/social';

interface UseSocialProfilesProps {
  autoSync?: boolean;
}

interface UseSocialProfilesReturn {
  // Current user profile
  myProfile: SocialUserProfile | null;
  isMyProfileLoading: boolean;
  
  // Profile management
  updateMyProfile: (updates: Partial<SocialUserProfile>) => Promise<void>;
  createSocialProfile: (profileData: Partial<SocialUserProfile>) => Promise<SocialUserProfile>;
  
  // Other user profiles
  profiles: Record<string, SocialUserProfile>;
  getUserProfile: (userId: string) => Promise<SocialUserProfile | null>;
  searchProfiles: (query: string, filters?: ProfileSearchFilters) => Promise<SocialUserProfile[]>;
  
  // Connections management
  connections: SocialConnection[];
  connectionRequests: ConnectionRequest[];
  
  // Connection actions
  followUser: (userId: string, message?: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  acceptConnectionRequest: (requestId: string) => Promise<void>;
  declineConnectionRequest: (requestId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  
  // Connection queries
  getFollowers: (userId?: string) => SocialUserProfile[];
  getFollowing: (userId?: string) => SocialUserProfile[];
  getMutualConnections: (userId: string) => SocialUserProfile[];
  getConnectionStatus: (userId: string) => ConnectionStatus | null;
  isFollowing: (userId: string) => boolean;
  isFollowedBy: (userId: string) => boolean;
  
  // Profile achievements
  awardXp: (amount: number, reason?: string) => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<void>;
  updateCookingStreak: () => Promise<void>;
  
  // Profile statistics
  getProfileStats: (userId?: string) => ProfileStats;
  getTopChefs: (limit?: number) => SocialUserProfile[];
  getNewMembers: (limit?: number) => SocialUserProfile[];
  getSuggestedConnections: (limit?: number) => SocialUserProfile[];
  
  // Privacy and settings
  updatePrivacySettings: (settings: PrivacySettings) => Promise<void>;
  reportUser: (userId: string, reason: string, description?: string) => Promise<void>;
  
  // State
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface ProfileSearchFilters {
  cookingLevel?: CookingLevel[];
  location?: string;
  specialties?: string[];
  goals?: CookingGoal[];
  isVerified?: boolean;
  hasRecipes?: boolean;
  sortBy?: 'relevance' | 'level' | 'followers' | 'recent' | 'alphabetical';
}

interface ProfileStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  levelTitle: string;
  totalRecipes: number;
  totalFollowers: number;
  totalFollowing: number;
  totalLikes: number;
  joinedDaysAgo: number;
  streakDays: number;
  badgesCount: number;
  recentBadges: UserBadge[];
}

interface PrivacySettings {
  isPrivate: boolean;
  showEmail: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  allowConnectionRequests: boolean;
  showOnlineStatus: boolean;
  showCookingActivity: boolean;
}

const STORAGE_KEYS = {
  MY_PROFILE: 'my_social_profile',
  PROFILES_CACHE: 'social_profiles_cache',
  CONNECTIONS: 'social_connections',
  CONNECTION_REQUESTS: 'connection_requests',
  BLOCKED_USERS: 'blocked_users',
};

const XP_REWARDS = {
  PROFILE_COMPLETE: 100,
  FIRST_RECIPE: 50,
  RECIPE_SHARED: 25,
  RECIPE_LIKED: 5,
  COMMENT_RECEIVED: 10,
  FOLLOW_RECEIVED: 15,
  CHALLENGE_COMPLETED: 100,
  DAILY_LOGIN: 10,
  COOKING_STREAK_BONUS: 20,
};

export const useSocialProfiles = ({
  autoSync = true,
}: UseSocialProfilesProps = {}): UseSocialProfilesReturn => {
  const { user } = useUser();
  
  // State
  const [myProfile, setMyProfile] = useState<SocialUserProfile | null>(null);
  const [isMyProfileLoading, setIsMyProfileLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, SocialUserProfile>>({});
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user?.id]);

  // Auto-sync with server
  useEffect(() => {
    if (autoSync && user && myProfile) {
      const syncInterval = setInterval(() => {
        syncWithServer();
      }, 2 * 60 * 1000); // Every 2 minutes

      return () => clearInterval(syncInterval);
    }
  }, [autoSync, user, myProfile]);

  // Load all user social data
  const loadUserData = useCallback(async () => {
    if (!user) return;

    try {
      setIsMyProfileLoading(true);
      setError(null);

      const [profileData, connectionsData, requestsData, profilesCache] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.MY_PROFILE}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.CONNECTIONS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.CONNECTION_REQUESTS}_${user.id}`),
        AsyncStorage.getItem(STORAGE_KEYS.PROFILES_CACHE),
      ]);

      // Load my profile
      if (profileData) {
        const profile: SocialUserProfile = JSON.parse(profileData);
        setMyProfile(profile);
      } else {
        // Create initial profile
        const initialProfile = await createInitialProfile();
        setMyProfile(initialProfile);
      }

      // Load connections
      if (connectionsData) {
        setConnections(JSON.parse(connectionsData));
      }

      // Load connection requests
      if (requestsData) {
        setConnectionRequests(JSON.parse(requestsData));
      }

      // Load profiles cache
      if (profilesCache) {
        setProfiles(JSON.parse(profilesCache));
      }
    } catch (err) {
      console.error('Error loading social data:', err);
      setError('Failed to load social data');
    } finally {
      setIsMyProfileLoading(false);
    }
  }, [user]);

  // Create initial social profile
  const createInitialProfile = useCallback(async (): Promise<SocialUserProfile> => {
    if (!user) throw new Error('User not authenticated');

    const initialProfile: SocialUserProfile = {
      userId: user.id,
      username: user.username || generateUsername(user.firstName || undefined, user.lastName || undefined),
      displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Chef',
      bio: '',
      profileImageUrl: user.imageUrl,
      
      // Cooking profile
      cookingLevel: 'Beginner',
      specialties: [],
      dietaryPreferences: [],
      favoriteCuisines: [],
      cookingGoals: [],
      
      // Social stats
      followersCount: 0,
      followingCount: 0,
      recipesSharedCount: 0,
      collectionsSharedCount: 0,
      totalLikesReceived: 0,
      
      // Achievements
      badges: [DEFAULT_USER_BADGES[0]], // Welcome badge
      level: 1,
      xp: XP_REWARDS.PROFILE_COMPLETE,
      streakDays: 1,
      
      // Privacy settings
      isPrivate: false,
      showEmail: false,
      showLocation: true,
      allowMessages: true,
      
      // Timestamps
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      
      // Social verification
      isVerified: false,
      verificationBadges: [],
    };

    await saveMyProfile(initialProfile);
    return initialProfile;
  }, [user]);

  // Generate username from name
  const generateUsername = (firstName?: string, lastName?: string): string => {
    const base = (firstName || 'chef').toLowerCase() + (lastName?.[0]?.toLowerCase() || '');
    const random = Math.floor(Math.random() * 1000);
    return `${base}${random}`;
  };

  // Save my profile
  const saveMyProfile = useCallback(async (profile: SocialUserProfile) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.MY_PROFILE}_${user.id}`,
        JSON.stringify(profile)
      );
    } catch (err) {
      console.error('Error saving profile:', err);
      throw new Error('Failed to save profile');
    }
  }, [user]);

  // Update my profile
  const updateMyProfile = useCallback(async (updates: Partial<SocialUserProfile>) => {
    if (!myProfile) throw new Error('Profile not loaded');

    try {
      setIsSaving(true);
      setError(null);

      const updatedProfile: SocialUserProfile = {
        ...myProfile,
        ...updates,
        lastActiveAt: new Date().toISOString(),
      };

      // Recalculate level if XP changed
      if (updates.xp !== undefined) {
        updatedProfile.level = calculateUserLevel(updatedProfile.xp);
      }

      setMyProfile(updatedProfile);
      await saveMyProfile(updatedProfile);

      // Update profiles cache
      const updatedProfiles = { ...profiles, [updatedProfile.userId]: updatedProfile };
      setProfiles(updatedProfiles);
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILES_CACHE, JSON.stringify(updatedProfiles));
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [myProfile, profiles]);

  // Create social profile (for new users)
  const createSocialProfile = useCallback(async (profileData: Partial<SocialUserProfile>): Promise<SocialUserProfile> => {
    if (!user) throw new Error('User not authenticated');

    const profile = await createInitialProfile();
    if (Object.keys(profileData).length > 0) {
      await updateMyProfile(profileData);
      return { ...profile, ...profileData };
    }
    return profile;
  }, [user, createInitialProfile, updateMyProfile]);

  // Get user profile (with caching)
  const getUserProfile = useCallback(async (userId: string): Promise<SocialUserProfile | null> => {
    // Check cache first
    if (profiles[userId]) {
      return profiles[userId];
    }

    try {
      setIsLoading(true);
      
      // In production, this would fetch from API
      // For now, return mock data or null
      console.log(`Fetching profile for user ${userId}`);
      
      // Return null if not found
      return null;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profiles]);

  // Search profiles
  const searchProfiles = useCallback(async (
    query: string, 
    filters?: ProfileSearchFilters
  ): Promise<SocialUserProfile[]> => {
    try {
      setIsLoading(true);
      
      // In production, this would search via API
      // For now, search local cache
      const allProfiles = Object.values(profiles);
      const lowercaseQuery = query.toLowerCase();
      
      let results = allProfiles.filter(profile =>
        profile.username.toLowerCase().includes(lowercaseQuery) ||
        profile.displayName.toLowerCase().includes(lowercaseQuery) ||
        profile.bio?.toLowerCase().includes(lowercaseQuery)
      );

      // Apply filters
      if (filters) {
        if (filters.cookingLevel && filters.cookingLevel.length > 0) {
          results = results.filter(p => filters.cookingLevel!.includes(p.cookingLevel));
        }
        if (filters.location) {
          results = results.filter(p => p.location?.toLowerCase().includes(filters.location!.toLowerCase()));
        }
        if (filters.isVerified !== undefined) {
          results = results.filter(p => p.isVerified === filters.isVerified);
        }
      }

      return results.slice(0, 20); // Limit results
    } catch (err) {
      console.error('Error searching profiles:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [profiles]);

  // Follow user
  const followUser = useCallback(async (userId: string, message?: string) => {
    if (!myProfile) throw new Error('Profile not loaded');

    try {
      setIsSaving(true);
      setError(null);

      const targetProfile = await getUserProfile(userId);
      if (!targetProfile) throw new Error('User not found');

      if (targetProfile.isPrivate) {
        // Create connection request
        const request: ConnectionRequest = {
          id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromUserId: myProfile.userId,
          toUserId: userId,
          fromUserProfile: myProfile,
          message,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        const updatedRequests = [...connectionRequests, request];
        setConnectionRequests(updatedRequests);
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.CONNECTION_REQUESTS}_${user?.id}`,
          JSON.stringify(updatedRequests)
        );
      } else {
        // Direct follow
        const connection: SocialConnection = {
          id: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          followerId: myProfile.userId,
          followingId: userId,
          followerProfile: myProfile,
          followingProfile: targetProfile,
          status: 'following',
          createdAt: new Date().toISOString(),
        };

        const updatedConnections = [...connections, connection];
        setConnections(updatedConnections);
        await AsyncStorage.setItem(
          `${STORAGE_KEYS.CONNECTIONS}_${user?.id}`,
          JSON.stringify(updatedConnections)
        );

        // Update my following count
        await updateMyProfile({
          followingCount: myProfile.followingCount + 1,
        });
      }
    } catch (err) {
      console.error('Error following user:', err);
      setError('Failed to follow user');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [myProfile, connectionRequests, connections, getUserProfile, updateMyProfile, user]);

  // Unfollow user
  const unfollowUser = useCallback(async (userId: string) => {
    if (!myProfile) throw new Error('Profile not loaded');

    try {
      setIsSaving(true);
      setError(null);

      const updatedConnections = connections.filter(
        c => !(c.followerId === myProfile.userId && c.followingId === userId)
      );
      setConnections(updatedConnections);
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CONNECTIONS}_${user?.id}`,
        JSON.stringify(updatedConnections)
      );

      // Update my following count
      await updateMyProfile({
        followingCount: Math.max(0, myProfile.followingCount - 1),
      });
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Failed to unfollow user');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [myProfile, connections, updateMyProfile, user]);

  // Accept connection request
  const acceptConnectionRequest = useCallback(async (requestId: string) => {
    if (!myProfile) throw new Error('Profile not loaded');

    try {
      setIsSaving(true);
      setError(null);

      const request = connectionRequests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Create connection
      const connection: SocialConnection = {
        id: `connection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        followerId: request.fromUserId,
        followingId: request.toUserId,
        followerProfile: request.fromUserProfile,
        followingProfile: myProfile,
        status: 'following',
        createdAt: new Date().toISOString(),
      };

      const updatedConnections = [...connections, connection];
      setConnections(updatedConnections);

      // Remove request
      const updatedRequests = connectionRequests.map(r =>
        r.id === requestId
          ? { ...r, status: 'accepted' as const, respondedAt: new Date().toISOString() }
          : r
      );
      setConnectionRequests(updatedRequests);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(
          `${STORAGE_KEYS.CONNECTIONS}_${user?.id}`,
          JSON.stringify(updatedConnections)
        ),
        AsyncStorage.setItem(
          `${STORAGE_KEYS.CONNECTION_REQUESTS}_${user?.id}`,
          JSON.stringify(updatedRequests)
        ),
      ]);

      // Update follower count
      await updateMyProfile({
        followersCount: myProfile.followersCount + 1,
      });
    } catch (err) {
      console.error('Error accepting connection request:', err);
      setError('Failed to accept request');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [myProfile, connectionRequests, connections, updateMyProfile, user]);

  // Decline connection request
  const declineConnectionRequest = useCallback(async (requestId: string) => {
    try {
      setIsSaving(true);
      setError(null);

      const updatedRequests = connectionRequests.map(r =>
        r.id === requestId
          ? { ...r, status: 'declined' as const, respondedAt: new Date().toISOString() }
          : r
      );
      setConnectionRequests(updatedRequests);

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CONNECTION_REQUESTS}_${user?.id}`,
        JSON.stringify(updatedRequests)
      );
    } catch (err) {
      console.error('Error declining connection request:', err);
      setError('Failed to decline request');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [connectionRequests, user]);

  // Block user
  const blockUser = useCallback(async (userId: string) => {
    // Implementation would go here
    console.log('Blocking user:', userId);
  }, []);

  // Unblock user
  const unblockUser = useCallback(async (userId: string) => {
    // Implementation would go here
    console.log('Unblocking user:', userId);
  }, []);

  // Get followers
  const getFollowers = useCallback((userId?: string): SocialUserProfile[] => {
    const targetUserId = userId || myProfile?.userId;
    if (!targetUserId) return [];

    return connections
      .filter(c => c.followingId === targetUserId && c.status === 'following')
      .map(c => c.followerProfile!)
      .filter(Boolean);
  }, [connections, myProfile]);

  // Get following
  const getFollowing = useCallback((userId?: string): SocialUserProfile[] => {
    const targetUserId = userId || myProfile?.userId;
    if (!targetUserId) return [];

    return connections
      .filter(c => c.followerId === targetUserId && c.status === 'following')
      .map(c => c.followingProfile!)
      .filter(Boolean);
  }, [connections, myProfile]);

  // Get mutual connections
  const getMutualConnections = useCallback((userId: string): SocialUserProfile[] => {
    if (!myProfile) return [];

    const myFollowing = getFollowing();
    const theirFollowing = getFollowing(userId);

    return myFollowing.filter(profile =>
      theirFollowing.some(p => p.userId === profile.userId)
    );
  }, [myProfile, getFollowing]);

  // Get connection status
  const getConnectionStatus = useCallback((userId: string): ConnectionStatus | null => {
    if (!myProfile) return null;

    const connection = connections.find(c =>
      (c.followerId === myProfile.userId && c.followingId === userId) ||
      (c.followerId === userId && c.followingId === myProfile.userId)
    );

    return connection?.status || null;
  }, [connections, myProfile]);

  // Check if following user
  const isFollowing = useCallback((userId: string): boolean => {
    if (!myProfile) return false;
    return connections.some(c =>
      c.followerId === myProfile.userId && c.followingId === userId && c.status === 'following'
    );
  }, [connections, myProfile]);

  // Check if followed by user
  const isFollowedBy = useCallback((userId: string): boolean => {
    if (!myProfile) return false;
    return connections.some(c =>
      c.followerId === userId && c.followingId === myProfile.userId && c.status === 'following'
    );
  }, [connections, myProfile]);

  // Award XP
  const awardXp = useCallback(async (amount: number, reason?: string) => {
    if (!myProfile) return;

    const newXp = myProfile.xp + amount;
    const newLevel = calculateUserLevel(newXp);
    const leveledUp = newLevel > myProfile.level;

    await updateMyProfile({ 
      xp: newXp, 
      level: newLevel 
    });

    // Log XP gain
    console.log(`XP gained: +${amount} ${reason ? `for ${reason}` : ''}`);
    
    if (leveledUp) {
      console.log(`Level up! Now level ${newLevel}`);
    }
  }, [myProfile, updateMyProfile]);

  // Unlock badge
  const unlockBadge = useCallback(async (badgeId: string) => {
    if (!myProfile) return;

    const badge = DEFAULT_USER_BADGES.find(b => b.id === badgeId);
    if (!badge) return;

    const hasBadge = myProfile.badges.some(b => b.id === badgeId);
    if (hasBadge) return;

    const unlockedBadge: UserBadge = {
      ...badge,
      unlockedAt: new Date().toISOString(),
    };

    await updateMyProfile({
      badges: [...myProfile.badges, unlockedBadge],
    });

    console.log(`Badge unlocked: ${badge.name}`);
  }, [myProfile, updateMyProfile]);

  // Update cooking streak
  const updateCookingStreak = useCallback(async () => {
    if (!myProfile) return;

    const today = new Date().toDateString();
    const lastActive = new Date(myProfile.lastActiveAt).toDateString();
    
    if (today !== lastActive) {
      const newStreak = myProfile.streakDays + 1;
      await updateMyProfile({ 
        streakDays: newStreak,
        lastActiveAt: new Date().toISOString(),
      });

      // Award streak bonus XP
      if (newStreak % 7 === 0) { // Weekly streak bonus
        await awardXp(XP_REWARDS.COOKING_STREAK_BONUS, 'weekly cooking streak');
      }
    }
  }, [myProfile, updateMyProfile, awardXp]);

  // Get profile statistics
  const getProfileStats = useCallback((userId?: string): ProfileStats => {
    const profile = userId ? profiles[userId] : myProfile;
    if (!profile) {
      return {
        level: 0,
        xp: 0,
        xpToNextLevel: 0,
        levelTitle: 'Unknown',
        totalRecipes: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        totalLikes: 0,
        joinedDaysAgo: 0,
        streakDays: 0,
        badgesCount: 0,
        recentBadges: [],
      };
    }

    const joinedDate = new Date(profile.joinedAt);
    const now = new Date();
    const joinedDaysAgo = Math.floor((now.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

    const recentBadges = profile.badges
      .filter(b => b.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 3);

    return {
      level: profile.level,
      xp: profile.xp,
      xpToNextLevel: getXpToNextLevel(profile.xp),
      levelTitle: formatUserLevel(profile.level),
      totalRecipes: profile.recipesSharedCount,
      totalFollowers: profile.followersCount,
      totalFollowing: profile.followingCount,
      totalLikes: profile.totalLikesReceived,
      joinedDaysAgo,
      streakDays: profile.streakDays,
      badgesCount: profile.badges.length,
      recentBadges,
    };
  }, [profiles, myProfile]);

  // Get top chefs
  const getTopChefs = useCallback((limit: number = 10): SocialUserProfile[] => {
    return Object.values(profiles)
      .sort((a, b) => b.level - a.level || b.totalLikesReceived - a.totalLikesReceived)
      .slice(0, limit);
  }, [profiles]);

  // Get new members
  const getNewMembers = useCallback((limit: number = 10): SocialUserProfile[] => {
    return Object.values(profiles)
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      .slice(0, limit);
  }, [profiles]);

  // Get suggested connections
  const getSuggestedConnections = useCallback((limit: number = 10): SocialUserProfile[] => {
    if (!myProfile) return [];

    const following = getFollowing();
    const followingIds = following.map(p => p.userId);

    // Suggest users not already followed
    return Object.values(profiles)
      .filter(p => 
        p.userId !== myProfile.userId && 
        !followingIds.includes(p.userId) &&
        !p.isPrivate
      )
      .sort(() => Math.random() - 0.5) // Random order
      .slice(0, limit);
  }, [profiles, myProfile, getFollowing]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (settings: PrivacySettings) => {
    if (!myProfile) return;

    await updateMyProfile(settings);
  }, [myProfile, updateMyProfile]);

  // Report user
  const reportUser = useCallback(async (userId: string, reason: string, description?: string) => {
    // Implementation would go here
    console.log('Reporting user:', userId, reason, description);
  }, []);

  // Sync with server
  const syncWithServer = useCallback(async () => {
    if (!myProfile) return;
    
    // Update last active time
    await updateMyProfile({ lastActiveAt: new Date().toISOString() });
    
    console.log('Syncing social data with server...');
  }, [myProfile, updateMyProfile]);

  return {
    // Current user profile
    myProfile,
    isMyProfileLoading,
    
    // Profile management
    updateMyProfile,
    createSocialProfile,
    
    // Other user profiles
    profiles,
    getUserProfile,
    searchProfiles,
    
    // Connections management
    connections,
    connectionRequests,
    
    // Connection actions
    followUser,
    unfollowUser,
    acceptConnectionRequest,
    declineConnectionRequest,
    blockUser,
    unblockUser,
    
    // Connection queries
    getFollowers,
    getFollowing,
    getMutualConnections,
    getConnectionStatus,
    isFollowing,
    isFollowedBy,
    
    // Profile achievements
    awardXp,
    unlockBadge,
    updateCookingStreak,
    
    // Profile statistics
    getProfileStats,
    getTopChefs,
    getNewMembers,
    getSuggestedConnections,
    
    // Privacy and settings
    updatePrivacySettings,
    reportUser,
    
    // State
    isLoading,
    isSaving,
    error,
  };
};