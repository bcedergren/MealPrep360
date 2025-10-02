import { RecipeCollection, RecipeRating } from './collections';
import { Recipe } from './recipe';

// Social User Profile Types
export interface SocialUserProfile {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  profileImageUrl?: string;
  coverImageUrl?: string;
  location?: string;
  website?: string;
  
  // Cooking profile
  cookingLevel: CookingLevel;
  specialties: CuisineSpecialty[];
  dietaryPreferences: string[];
  favoriteCuisines: string[];
  cookingGoals: CookingGoal[];
  
  // Social stats
  followersCount: number;
  followingCount: number;
  recipesSharedCount: number;
  collectionsSharedCount: number;
  totalLikesReceived: number;
  
  // Achievements
  badges: UserBadge[];
  level: number;
  xp: number;
  streakDays: number;
  
  // Privacy settings
  isPrivate: boolean;
  showEmail: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  
  // Timestamps
  joinedAt: string;
  lastActiveAt: string;
  
  // Social verification
  isVerified: boolean;
  verificationBadges: VerificationBadge[];
}

export type CookingLevel = 'Beginner' | 'Novice' | 'Intermediate' | 'Advanced' | 'Expert' | 'Chef';

export interface CuisineSpecialty {
  cuisine: string;
  level: 'Learning' | 'Comfortable' | 'Expert';
  recipesCooked: number;
}

export type CookingGoal = 
  | 'Eat Healthier'
  | 'Learn New Cuisines'
  | 'Cook More at Home'
  | 'Meal Prep Better'
  | 'Reduce Food Waste'
  | 'Budget Cooking'
  | 'Family Cooking'
  | 'Quick Meals'
  | 'Gourmet Cooking'
  | 'Baking & Desserts';

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  unlockedAt: string;
  category: BadgeCategory;
}

export type BadgeCategory = 
  | 'Cooking Milestones'
  | 'Social Engagement'
  | 'Recipe Mastery'
  | 'Community Contribution'
  | 'Seasonal Events'
  | 'Special Achievements';

export interface VerificationBadge {
  type: 'Chef' | 'Nutritionist' | 'Food Blogger' | 'Restaurant' | 'Brand';
  verifiedBy: string;
  verifiedAt: string;
  credentials?: string;
}

// Social Connections
export interface SocialConnection {
  id: string;
  followerId: string;
  followingId: string;
  followerProfile?: SocialUserProfile;
  followingProfile?: SocialUserProfile;
  status: ConnectionStatus;
  createdAt: string;
  mutualFollowAt?: string;
}

export type ConnectionStatus = 'pending' | 'following' | 'mutual' | 'blocked';

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUserProfile?: SocialUserProfile;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

// Social Feed & Activity
export interface SocialFeedItem {
  id: string;
  userId: string;
  userProfile?: SocialUserProfile;
  type: FeedItemType;
  content: FeedContent;
  visibility: FeedVisibility;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isLikedByUser?: boolean;
  isBookmarkedByUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FeedItemType = 
  | 'recipe_shared'
  | 'recipe_cooked'
  | 'recipe_rated'
  | 'collection_created'
  | 'collection_shared'
  | 'achievement_unlocked'
  | 'challenge_completed'
  | 'cooking_milestone'
  | 'user_joined'
  | 'live_cooking'
  | 'recipe_photo'
  | 'cooking_tip';

export interface FeedContent {
  // Base content
  text?: string;
  images?: string[];
  
  // Related entities
  recipe?: Recipe;
  collection?: RecipeCollection;
  rating?: RecipeRating;
  badge?: UserBadge;
  challenge?: CookingChallenge;
  
  // Cooking session data
  cookingSession?: CookingSession;
  
  // Location and tags
  location?: string;
  tags?: string[];
  mentions?: string[]; // User IDs mentioned
}

export type FeedVisibility = 'public' | 'followers' | 'friends' | 'private';

export interface SocialComment {
  id: string;
  feedItemId: string;
  userId: string;
  userProfile?: SocialUserProfile;
  content: string;
  images?: string[];
  parentCommentId?: string; // For nested comments
  likesCount: number;
  isLikedByUser?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialLike {
  id: string;
  userId: string;
  targetType: 'feed_item' | 'comment' | 'recipe' | 'collection';
  targetId: string;
  createdAt: string;
}

// Cooking Challenges
export interface CookingChallenge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  
  // Challenge details
  type: ChallengeType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: ChallengeDuration;
  requirements: ChallengeRequirement[];
  
  // Participation
  participantsCount: number;
  completedCount: number;
  maxParticipants?: number;
  
  // Rewards
  xpReward: number;
  badges: UserBadge[];
  prizes?: ChallengePrize[];
  
  // Timing
  startDate: string;
  endDate: string;
  createdAt: string;
  
  // Creator info
  createdBy: string;
  creatorProfile?: SocialUserProfile;
  
  // Challenge state
  status: ChallengeStatus;
  isParticipating?: boolean;
  userProgress?: ChallengeProgress;
}

export type ChallengeType = 
  | 'Recipe Mastery'
  | 'Ingredient Focus'
  | 'Cuisine Explorer'
  | 'Speed Cooking'
  | 'Healthy Eating'
  | 'Seasonal Cooking'
  | 'Budget Challenge'
  | 'Community Vote'
  | 'Skill Building'
  | 'Creativity Challenge';

export interface ChallengeDuration {
  value: number;
  unit: 'hours' | 'days' | 'weeks' | 'months';
}

export interface ChallengeRequirement {
  type: 'cook_recipe' | 'try_cuisine' | 'use_ingredient' | 'achieve_rating' | 'share_photo' | 'get_likes';
  description: string;
  target: number;
  current?: number;
}

export interface ChallengePrize {
  type: 'badge' | 'xp' | 'item' | 'discount' | 'feature';
  name: string;
  description: string;
  value: string;
  imageUrl?: string;
}

export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  requirements: ChallengeRequirement[];
  completedAt?: string;
  rank?: number;
  score?: number;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  userProfile?: SocialUserProfile;
  joinedAt: string;
  completedAt?: string;
  submissions: ChallengeSubmission[];
  score: number;
  rank?: number;
}

export interface ChallengeSubmission {
  id: string;
  participationId: string;
  type: 'recipe' | 'photo' | 'video' | 'text';
  content: string;
  mediaUrl?: string;
  recipe?: Recipe;
  rating?: number;
  votesReceived: number;
  createdAt: string;
}

// Social Groups & Communities
export interface SocialGroup {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  coverImageUrl?: string;
  
  // Group details
  type: GroupType;
  privacy: GroupPrivacy;
  memberCount: number;
  maxMembers?: number;
  
  // Group focus
  topics: string[];
  cuisines: string[];
  cookingLevel: CookingLevel[];
  location?: string;
  
  // Admin info
  createdBy: string;
  admins: string[];
  moderators: string[];
  
  // Group activity
  postsCount: number;
  recipesShared: number;
  challengesCreated: number;
  
  // Rules and settings
  rules: string[];
  allowedContentTypes: ContentType[];
  requiresApproval: boolean;
  
  // Timestamps
  createdAt: string;
  lastActivityAt: string;
  
  // User's relationship with group
  userRole?: GroupRole;
  userJoinedAt?: string;
}

export type GroupType = 'cooking_style' | 'dietary' | 'local' | 'skill_level' | 'age_group' | 'interest' | 'challenge';
export type GroupPrivacy = 'public' | 'private' | 'secret';
export type GroupRole = 'member' | 'moderator' | 'admin' | 'owner';
export type ContentType = 'recipes' | 'photos' | 'discussions' | 'challenges' | 'events' | 'polls';

export interface GroupMembership {
  id: string;
  groupId: string;
  userId: string;
  userProfile?: SocialUserProfile;
  role: GroupRole;
  joinedAt: string;
  invitedBy?: string;
  status: 'pending' | 'active' | 'banned' | 'left';
}

export interface GroupPost {
  id: string;
  groupId: string;
  userId: string;
  userProfile?: SocialUserProfile;
  type: 'discussion' | 'recipe' | 'photo' | 'poll' | 'event' | 'challenge';
  title: string;
  content: string;
  images?: string[];
  recipe?: Recipe;
  poll?: GroupPoll;
  event?: GroupEvent;
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  isLikedByUser?: boolean;
  isPinned: boolean;
  
  // Moderation
  isApproved: boolean;
  moderatedBy?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface GroupPoll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  endsAt?: string;
  userVote?: string[];
}

export interface PollOption {
  id: string;
  text: string;
  votesCount: number;
}

export interface GroupEvent {
  id: string;
  title: string;
  description: string;
  type: 'cooking_class' | 'potluck' | 'challenge' | 'meetup' | 'virtual_cook';
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  maxAttendees?: number;
  attendeesCount: number;
  isAttending?: boolean;
}

// Live Cooking Sessions
export interface CookingSession {
  id: string;
  hostId: string;
  hostProfile?: SocialUserProfile;
  
  // Session details
  title: string;
  description?: string;
  recipe?: Recipe;
  isLive: boolean;
  isPrivate: boolean;
  
  // Participants
  viewersCount: number;
  maxViewers?: number;
  participants: SessionParticipant[];
  
  // Session data
  startTime: string;
  endTime?: string;
  duration?: number;
  
  // Interactive features
  allowChat: boolean;
  allowQuestions: boolean;
  chatMessages: SessionMessage[];
  
  // Recording
  isRecorded: boolean;
  recordingUrl?: string;
  
  // Metadata
  tags: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedDuration: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface SessionParticipant {
  userId: string;
  userProfile?: SocialUserProfile;
  role: 'host' | 'co-host' | 'viewer';
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  userId: string;
  userProfile?: SocialUserProfile;
  type: 'chat' | 'question' | 'reaction' | 'system';
  content: string;
  timestamp: string;
  
  // Reactions and responses
  reactions: MessageReaction[];
  isAnswered?: boolean;
  answeredBy?: string;
}

export interface MessageReaction {
  type: '👍' | '❤️' | '😍' | '👏' | '🔥' | '😂';
  count: number;
  userReacted?: boolean;
}

// Notifications
export interface SocialNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  imageUrl?: string;
  
  // Related data
  actorId?: string; // Who triggered the notification
  actorProfile?: SocialUserProfile;
  targetType?: 'recipe' | 'collection' | 'post' | 'challenge' | 'group';
  targetId?: string;
  
  // Notification state
  isRead: boolean;
  isActionable: boolean;
  actionUrl?: string;
  
  createdAt: string;
  expiresAt?: string;
}

export type NotificationType = 
  | 'follow_request'
  | 'new_follower'
  | 'recipe_liked'
  | 'recipe_commented'
  | 'recipe_shared'
  | 'collection_liked'
  | 'challenge_invite'
  | 'challenge_completed'
  | 'group_invite'
  | 'group_post'
  | 'cooking_session_invite'
  | 'achievement_unlocked'
  | 'milestone_reached'
  | 'featured_content';

// Search and Discovery
export interface SocialSearchResult {
  users: SocialUserProfile[];
  groups: SocialGroup[];
  challenges: CookingChallenge[];
  posts: SocialFeedItem[];
  total: number;
  hasMore: boolean;
}

export interface SocialSearchFilters {
  query: string;
  type?: 'users' | 'groups' | 'challenges' | 'posts' | 'all';
  location?: string;
  cookingLevel?: CookingLevel[];
  interests?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// Analytics and Insights
export interface SocialAnalytics {
  userId: string;
  period: AnalyticsPeriod;
  
  // Engagement metrics
  profileViews: number;
  recipeLikes: number;
  recipeShares: number;
  commentsReceived: number;
  
  // Growth metrics
  newFollowers: number;
  followersLost: number;
  postsCreated: number;
  recipesShared: number;
  
  // Community engagement
  groupsJoined: number;
  challengesCompleted: number;
  cookingSessionsHosted: number;
  cookingSessionsAttended: number;
  
  // Top performing content
  topRecipes: Recipe[];
  topPosts: SocialFeedItem[];
  
  // Audience insights
  followersDemographics: Demographics;
  engagementByTime: TimeEngagement[];
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export interface Demographics {
  ageGroups: { range: string; percentage: number }[];
  locations: { location: string; percentage: number }[];
  cookingLevels: { level: CookingLevel; percentage: number }[];
}

export interface TimeEngagement {
  hour: number;
  engagement: number;
  date: string;
}

// Moderation and Safety
export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterProfile?: SocialUserProfile;
  targetType: 'user' | 'post' | 'comment' | 'group' | 'challenge';
  targetId: string;
  reason: ReportReason;
  description: string;
  evidence?: string[];
  status: ReportStatus;
  
  // Moderation action
  actionTaken?: ModerationAction;
  moderatorId?: string;
  moderatorNotes?: string;
  resolvedAt?: string;
  
  createdAt: string;
}

export type ReportReason = 
  | 'spam'
  | 'harassment'
  | 'inappropriate_content'
  | 'fake_profile'
  | 'copyright_violation'
  | 'dangerous_content'
  | 'hate_speech'
  | 'other';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export interface ModerationAction {
  type: 'warning' | 'content_removal' | 'temporary_ban' | 'permanent_ban' | 'account_restriction';
  duration?: string; // For temporary actions
  reason: string;
  appealable: boolean;
}

// Default Data and Constants
export const DEFAULT_COOKING_LEVELS: CookingLevel[] = [
  'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert', 'Chef'
];

export const DEFAULT_COOKING_GOALS: CookingGoal[] = [
  'Eat Healthier',
  'Learn New Cuisines', 
  'Cook More at Home',
  'Meal Prep Better',
  'Reduce Food Waste',
  'Budget Cooking',
  'Family Cooking',
  'Quick Meals',
  'Gourmet Cooking',
  'Baking & Desserts',
];

export const BADGE_CATEGORIES: BadgeCategory[] = [
  'Cooking Milestones',
  'Social Engagement',
  'Recipe Mastery',
  'Community Contribution',
  'Seasonal Events',
  'Special Achievements',
];

export const DEFAULT_USER_BADGES: UserBadge[] = [
  {
    id: 'welcome',
    name: 'Welcome Chef',
    description: 'Joined the MealPrep360 community',
    iconUrl: '/badges/welcome.png',
    rarity: 'Common',
    unlockedAt: new Date().toISOString(),
    category: 'Social Engagement',
  },
  {
    id: 'first_recipe',
    name: 'First Recipe',
    description: 'Shared your first recipe',
    iconUrl: '/badges/first-recipe.png',
    rarity: 'Common',
    unlockedAt: '',
    category: 'Cooking Milestones',
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Made 10 friends in the community',
    iconUrl: '/badges/social.png',
    rarity: 'Uncommon',
    unlockedAt: '',
    category: 'Social Engagement',
  },
  {
    id: 'master_chef',
    name: 'Master Chef',
    description: 'Cooked 100 different recipes',
    iconUrl: '/badges/master-chef.png',
    rarity: 'Epic',
    unlockedAt: '',
    category: 'Recipe Mastery',
  },
];

// Helper Functions
export const calculateUserLevel = (xp: number): number => {
  // Level calculation: Level = sqrt(XP / 100)
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const getXpForLevel = (level: number): number => {
  // XP needed for level: XP = (level - 1)^2 * 100
  return Math.pow(level - 1, 2) * 100;
};

export const getXpToNextLevel = (currentXp: number): number => {
  const currentLevel = calculateUserLevel(currentXp);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
};

export const formatUserLevel = (level: number): string => {
  if (level < 5) return 'Newcomer';
  if (level < 10) return 'Home Cook';
  if (level < 20) return 'Kitchen Enthusiast';
  if (level < 35) return 'Culinary Explorer';
  if (level < 50) return 'Seasoned Chef';
  if (level < 75) return 'Master Cook';
  return 'Culinary Legend';
};

export const getUserBadgesByCategory = (badges: UserBadge[]): Record<BadgeCategory, UserBadge[]> => {
  return badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<BadgeCategory, UserBadge[]>);
};

export const isUserOnline = (lastActiveAt: string): boolean => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActiveAt) > fiveMinutesAgo;
};

export const formatChallengeProgress = (progress: ChallengeProgress): string => {
  const completed = progress.requirements.filter(req => (req.current || 0) >= req.target).length;
  const total = progress.requirements.length;
  return `${completed}/${total} completed`;
};

export default {
  DEFAULT_COOKING_LEVELS,
  DEFAULT_COOKING_GOALS,
  BADGE_CATEGORIES,
  DEFAULT_USER_BADGES,
  calculateUserLevel,
  getXpForLevel,
  getXpToNextLevel,
  formatUserLevel,
  getUserBadgesByCategory,
  isUserOnline,
  formatChallengeProgress,
};