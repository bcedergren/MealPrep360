import { useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Recipe } from '../types/recipe';
import {
    ChallengeDuration,
    ChallengeParticipation,
    ChallengeProgress,
    ChallengeRequirement,
    ChallengeSubmission,
    ChallengeType,
    CookingChallenge,
    SocialUserProfile
} from '../types/social';
import { useSocialProfiles } from './useSocialProfiles';

interface UseCookingChallengesProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // minutes
}

interface UseCookingChallengesReturn {
  // Challenges state
  challenges: CookingChallenge[];
  activeChallenges: CookingChallenge[];
  myParticipations: ChallengeParticipation[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Challenge actions
  refreshChallenges: () => Promise<void>;
  createChallenge: (challengeData: CreateChallengeData) => Promise<CookingChallenge>;
  joinChallenge: (challengeId: string) => Promise<void>;
  leaveChallenge: (challengeId: string) => Promise<void>;
  submitToChallenge: (challengeId: string, submission: SubmissionData) => Promise<ChallengeSubmission>;
  updateSubmission: (submissionId: string, updates: Partial<ChallengeSubmission>) => Promise<void>;

  // Challenge queries
  getChallengeById: (challengeId: string) => CookingChallenge | null;
  getChallengesByType: (type: ChallengeType) => CookingChallenge[];
  getActiveChallenges: () => CookingChallenge[];
  getUpcomingChallenges: () => CookingChallenge[];
  getCompletedChallenges: () => CookingChallenge[];
  searchChallenges: (query: string) => CookingChallenge[];

  // Participation and progress
  isParticipating: (challengeId: string) => boolean;
  getChallengeProgress: (challengeId: string) => ChallengeProgress | null;
  getParticipationHistory: () => ChallengeParticipation[];
  getCompletionRate: () => number;

  // Leaderboards and rankings
  getChallengeLeaderboard: (challengeId: string) => LeaderboardEntry[];
  getGlobalLeaderboard: (period?: LeaderboardPeriod) => LeaderboardEntry[];
  getUserRank: (challengeId?: string) => number | null;
  getTopPerformers: (limit?: number) => SocialUserProfile[];

  // Featured and recommendations
  getFeaturedChallenges: () => CookingChallenge[];
  getRecommendedChallenges: () => CookingChallenge[];
  getTrendingChallenges: () => CookingChallenge[];
  getPersonalizedChallenges: () => CookingChallenge[];

  // Community features
  voteBestSubmission: (submissionId: string) => Promise<void>;
  reportSubmission: (submissionId: string, reason: string) => Promise<void>;
  getChallengeSubmissions: (challengeId: string) => ChallengeSubmission[];
  getFeaturedSubmissions: (challengeId: string) => ChallengeSubmission[];

  // Analytics and insights
  getChallengeAnalytics: () => ChallengeAnalytics;
  getCompletionInsights: () => CompletionInsights;
  getSkillProgression: () => SkillProgression[];
}

interface CreateChallengeData {
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration: ChallengeDuration;
  requirements: Omit<ChallengeRequirement, 'current'>[];
  xpReward: number;
  imageUrl?: string;
  maxParticipants?: number;
  startDate?: string;
  endDate?: string;
}

interface SubmissionData {
  type: 'recipe' | 'photo' | 'video' | 'text';
  content: string;
  mediaUrl?: string;
  recipe?: Recipe;
  description?: string;
}

interface LeaderboardEntry {
  userId: string;
  userProfile: SocialUserProfile;
  rank: number;
  score: number;
  challengesCompleted: number;
  totalXp: number;
  averageRating: number;
  submissionsCount: number;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

interface ChallengeAnalytics {
  totalChallengesJoined: number;
  totalChallengesCompleted: number;
  completionRate: number;
  totalXpEarned: number;
  favoriteChallengeType: ChallengeType;
  averageCompletionTime: number; // in days
  currentStreak: number;
  longestStreak: number;
  rankingDistribution: { rank: string; count: number }[];
}

interface CompletionInsights {
  easiestChallengeType: ChallengeType;
  hardestChallengeType: ChallengeType;
  fastestCompletion: CookingChallenge;
  mostPopularDay: string;
  improvementAreas: string[];
  strengthAreas: string[];
}

interface SkillProgression {
  skill: string;
  currentLevel: number;
  totalXp: number;
  challengesCompleted: number;
  recentImprovement: number; // percentage
}

const STORAGE_KEYS = {
  CHALLENGES: 'cooking_challenges',
  PARTICIPATIONS: 'challenge_participations',
  SUBMISSIONS: 'challenge_submissions',
  VOTES: 'challenge_votes',
  LEADERBOARD: 'challenge_leaderboard',
};

const XP_MULTIPLIERS = {
  Easy: 1.0,
  Medium: 1.5,
  Hard: 2.0,
};

const CHALLENGE_TYPES_XP = {
  'Recipe Mastery': 100,
  'Ingredient Focus': 75,
  'Cuisine Explorer': 120,
  'Speed Cooking': 80,
  'Healthy Eating': 90,
  'Seasonal Cooking': 85,
  'Budget Challenge': 70,
  'Community Vote': 50,
  'Skill Building': 110,
  'Creativity Challenge': 130,
};

export const useCookingChallenges = ({
  autoRefresh = true,
  refreshInterval = 10, // 10 minutes
}: UseCookingChallengesProps = {}): UseCookingChallengesReturn => {
  const { user } = useUser();
  const { myProfile, awardXp } = useSocialProfiles();

  // State
  const [challenges, setChallenges] = useState<CookingChallenge[]>([]);
  const [myParticipations, setMyParticipations] = useState<ChallengeParticipation[]>([]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [votes, setVotes] = useState<Record<string, string[]>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    if (user && myProfile) {
      loadChallengeData();
    }
  }, [user?.id, myProfile?.userId]);

  // Auto-refresh challenges
  useEffect(() => {
    if (autoRefresh && user && myProfile) {
      const refreshTimer = setInterval(() => {
        refreshChallenges();
      }, refreshInterval * 60 * 1000);

      return () => clearInterval(refreshTimer);
    }
  }, [autoRefresh, refreshInterval, user, myProfile]);

  // Load initial challenge data
  const loadChallengeData = useCallback(async () => {
    if (!user || !myProfile) return;

    try {
      setIsLoading(true);
      setError(null);

      const [challengesData, participationsData, submissionsData, votesData, leaderboardData] = await Promise.all([
        AsyncStorage.getItem(`${STORAGE_KEYS.CHALLENGES}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.PARTICIPATIONS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.SUBMISSIONS}_${user.id}`),
        AsyncStorage.getItem(`${STORAGE_KEYS.VOTES}_${user.id}`),
        AsyncStorage.getItem(STORAGE_KEYS.LEADERBOARD),
      ]);

      if (challengesData) {
        setChallenges(JSON.parse(challengesData));
      } else {
        // Generate sample challenges for demo
        const sampleChallenges = generateSampleChallenges();
        setChallenges(sampleChallenges);
        await saveChallenges(sampleChallenges);
      }

      if (participationsData) {
        setMyParticipations(JSON.parse(participationsData));
      }

      if (submissionsData) {
        setSubmissions(JSON.parse(submissionsData));
      }

      if (votesData) {
        setVotes(JSON.parse(votesData));
      }

      if (leaderboardData) {
        setLeaderboard(JSON.parse(leaderboardData));
      } else {
        // Generate sample leaderboard
        const sampleLeaderboard = generateSampleLeaderboard();
        setLeaderboard(sampleLeaderboard);
        await AsyncStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(sampleLeaderboard));
      }
    } catch (err) {
      console.error('Error loading challenge data:', err);
      setError('Failed to load challenges');
    } finally {
      setIsLoading(false);
    }
  }, [user, myProfile]);

  // Generate sample challenges for demo
  const generateSampleChallenges = useCallback((): CookingChallenge[] => {
    const now = new Date();
    const sampleChallenges: CookingChallenge[] = [
      {
        id: 'challenge_1',
        title: '30-Day Italian Cuisine Challenge',
        description: 'Explore the authentic flavors of Italy by cooking 30 different Italian recipes in 30 days. From pasta to pizza, gelato to risotto!',
        imageUrl: 'https://via.placeholder.com/400/FF6B6B/FFFFFF?text=Italian+Challenge',
        type: 'Cuisine Explorer',
        difficulty: 'Medium',
        duration: { value: 30, unit: 'days' },
        requirements: [
          {
            type: 'cook_recipe',
            description: 'Cook 30 Italian recipes',
            target: 30,
            current: 0,
          },
          {
            type: 'try_cuisine',
            description: 'Try 5 different Italian regions',
            target: 5,
            current: 0,
          },
          {
            type: 'share_photo',
            description: 'Share photos of 10 dishes',
            target: 10,
            current: 0,
          },
        ],
        participantsCount: 1247,
        completedCount: 89,
        xpReward: 500,
        badges: [],
        startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin_1',
        status: 'active',
        isParticipating: false,
      },
      {
        id: 'challenge_2',
        title: 'Quick & Healthy Weeknight Dinners',
        description: 'Master the art of cooking healthy, delicious meals in 30 minutes or less. Perfect for busy weeknights!',
        imageUrl: 'https://via.placeholder.com/400/4ECDC4/FFFFFF?text=Healthy+Quick',
        type: 'Speed Cooking',
        difficulty: 'Easy',
        duration: { value: 2, unit: 'weeks' },
        requirements: [
          {
            type: 'cook_recipe',
            description: 'Cook 14 quick healthy recipes',
            target: 14,
            current: 0,
          },
          {
            type: 'achieve_rating',
            description: 'Achieve average 4+ star rating',
            target: 4,
            current: 0,
          },
        ],
        participantsCount: 892,
        completedCount: 234,
        xpReward: 300,
        badges: [],
        startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin_1',
        status: 'active',
        isParticipating: true,
        userProgress: {
          challengeId: 'challenge_2',
          userId: myProfile?.userId || '',
          requirements: [
            {
              type: 'cook_recipe',
              description: 'Cook 14 quick healthy recipes',
              target: 14,
              current: 7,
            },
            {
              type: 'achieve_rating',
              description: 'Achieve average 4+ star rating',
              target: 4,
              current: 4.2,
            },
          ],
        },
      },
      {
        id: 'challenge_3',
        title: 'Plant-Based December',
        description: 'Embrace plant-based cooking this December! Create delicious, nutritious meals without any animal products.',
        imageUrl: 'https://via.placeholder.com/400/95E1D3/FFFFFF?text=Plant+Based',
        type: 'Healthy Eating',
        difficulty: 'Medium',
        duration: { value: 1, unit: 'months' },
        requirements: [
          {
            type: 'cook_recipe',
            description: 'Cook 25 plant-based recipes',
            target: 25,
            current: 0,
          },
          {
            type: 'use_ingredient',
            description: 'Use 15 different vegetables',
            target: 15,
            current: 0,
          },
          {
            type: 'get_likes',
            description: 'Get 100 likes on your posts',
            target: 100,
            current: 0,
          },
        ],
        participantsCount: 567,
        completedCount: 23,
        maxParticipants: 1000,
        xpReward: 400,
        badges: [],
        startDate: new Date(2024, 11, 1).toISOString(), // December 1, 2024
        endDate: new Date(2024, 11, 31).toISOString(), // December 31, 2024
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'admin_1',
        status: 'upcoming',
        isParticipating: false,
      },
      {
        id: 'challenge_4',
        title: 'Budget-Friendly Family Meals',
        description: 'Create delicious, filling meals for a family of 4 under $15. Prove that great food doesn\'t have to be expensive!',
        imageUrl: 'https://via.placeholder.com/400/F38BA8/FFFFFF?text=Budget+Meals',
        type: 'Budget Challenge',
        difficulty: 'Medium',
        duration: { value: 3, unit: 'weeks' },
        requirements: [
          {
            type: 'cook_recipe',
            description: 'Cook 21 budget meals',
            target: 21,
            current: 0,
          },
          {
            type: 'share_photo',
            description: 'Share photos with cost breakdown',
            target: 21,
            current: 0,
          },
        ],
        participantsCount: 445,
        completedCount: 67,
        xpReward: 350,
        badges: [],
        startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'user_featured_chef',
        creatorProfile: {
          userId: 'user_featured_chef',
          username: 'budget_chef_sarah',
          displayName: 'Sarah Budget Chef',
          profileImageUrl: 'https://via.placeholder.com/150/F38BA8/FFFFFF?text=SC',
          cookingLevel: 'Expert',
          level: 25,
          isVerified: true,
        } as SocialUserProfile,
        status: 'upcoming',
        isParticipating: false,
      },
    ];

    return sampleChallenges;
  }, [myProfile]);

  // Generate sample leaderboard
  const generateSampleLeaderboard = useCallback((): LeaderboardEntry[] => {
    const sampleUsers = [
      { username: 'master_chef_alex', displayName: 'Chef Alex Rodriguez', level: 28 },
      { username: 'pasta_queen_maria', displayName: 'Maria Pasta Queen', level: 24 },
      { username: 'spice_master_raj', displayName: 'Raj Spice Master', level: 22 },
      { username: 'baker_extraordinaire', displayName: 'Emma the Baker', level: 20 },
      { username: 'healthy_chef_sam', displayName: 'Sam Healthy Chef', level: 19 },
    ];

    return sampleUsers.map((user, index) => ({
      userId: `leaderboard_user_${index + 1}`,
      userProfile: {
        userId: `leaderboard_user_${index + 1}`,
        username: user.username,
        displayName: user.displayName,
        profileImageUrl: `https://via.placeholder.com/150/FF6B6B/FFFFFF?text=${user.displayName.split(' ').map(n => n[0]).join('')}`,
        cookingLevel: 'Expert' as const,
        level: user.level,
        isVerified: index < 3,
      } as SocialUserProfile,
      rank: index + 1,
      score: 10000 - (index * 1500),
      challengesCompleted: 45 - (index * 5),
      totalXp: 50000 - (index * 7500),
      averageRating: 4.8 - (index * 0.1),
      submissionsCount: 120 - (index * 15),
    }));
  }, []);

  // Save challenges to storage
  const saveChallenges = useCallback(async (challengesList: CookingChallenge[]) => {
    if (!user) return;

    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CHALLENGES}_${user.id}`,
        JSON.stringify(challengesList)
      );
    } catch (err) {
      console.error('Error saving challenges:', err);
    }
  }, [user]);

  // Refresh challenges
  const refreshChallenges = useCallback(async () => {
    if (!user || !myProfile) return;

    try {
      setError(null);

      // In production, this would fetch from API
      // For now, update timestamps and participation counts
      const updatedChallenges = challenges.map(challenge => ({
        ...challenge,
        participantsCount: challenge.participantsCount + Math.floor(Math.random() * 5),
        completedCount: challenge.completedCount + Math.floor(Math.random() * 2),
      }));

      setChallenges(updatedChallenges);
      await saveChallenges(updatedChallenges);
    } catch (err) {
      console.error('Error refreshing challenges:', err);
      setError('Failed to refresh challenges');
    }
  }, [user, myProfile, challenges, saveChallenges]);

  // Create new challenge
  const createChallenge = useCallback(async (challengeData: CreateChallengeData): Promise<CookingChallenge> => {
    if (!user || !myProfile) throw new Error('User not authenticated');

    try {
      setIsSubmitting(true);
      setError(null);

      const newChallenge: CookingChallenge = {
        id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: challengeData.title,
        description: challengeData.description,
        imageUrl: challengeData.imageUrl,
        type: challengeData.type,
        difficulty: challengeData.difficulty,
        duration: challengeData.duration,
        requirements: challengeData.requirements.map(req => ({ ...req, current: 0 })),
        participantsCount: 0,
        completedCount: 0,
        maxParticipants: challengeData.maxParticipants,
        xpReward: challengeData.xpReward,
        badges: [],
        startDate: challengeData.startDate || new Date().toISOString(),
        endDate: challengeData.endDate || new Date(Date.now() + challengeData.duration.value * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: myProfile.userId,
        creatorProfile: myProfile,
        status: challengeData.startDate && new Date(challengeData.startDate) > new Date() ? 'upcoming' : 'active',
        isParticipating: false,
      };

      const updatedChallenges = [newChallenge, ...challenges];
      setChallenges(updatedChallenges);
      await saveChallenges(updatedChallenges);

      return newChallenge;
    } catch (err) {
      console.error('Error creating challenge:', err);
      throw new Error('Failed to create challenge');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, myProfile, challenges, saveChallenges]);

  // Join challenge
  const joinChallenge = useCallback(async (challengeId: string) => {
    if (!user || !myProfile) throw new Error('User not authenticated');

    try {
      setIsSubmitting(true);
      setError(null);

      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      if (challenge.maxParticipants && challenge.participantsCount >= challenge.maxParticipants) {
        throw new Error('Challenge is full');
      }

      // Create participation record
      const participation: ChallengeParticipation = {
        id: `participation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        challengeId,
        userId: myProfile.userId,
        userProfile: myProfile,
        joinedAt: new Date().toISOString(),
        submissions: [],
        score: 0,
      };

      const updatedParticipations = [...myParticipations, participation];
      setMyParticipations(updatedParticipations);

      // Update challenge participation count
      const updatedChallenges = challenges.map(c =>
        c.id === challengeId
          ? { 
              ...c, 
              participantsCount: c.participantsCount + 1,
              isParticipating: true,
              userProgress: {
                challengeId,
                userId: myProfile.userId,
                requirements: c.requirements.map(req => ({ ...req, current: 0 })),
              },
            }
          : c
      );
      setChallenges(updatedChallenges);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(
          `${STORAGE_KEYS.PARTICIPATIONS}_${user.id}`,
          JSON.stringify(updatedParticipations)
        ),
        saveChallenges(updatedChallenges),
      ]);
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError(err instanceof Error ? err.message : 'Failed to join challenge');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, myProfile, challenges, myParticipations, saveChallenges]);

  // Leave challenge
  const leaveChallenge = useCallback(async (challengeId: string) => {
    if (!user || !myProfile) throw new Error('User not authenticated');

    try {
      setIsSubmitting(true);
      setError(null);

      const updatedParticipations = myParticipations.filter(p => p.challengeId !== challengeId);
      setMyParticipations(updatedParticipations);

      // Update challenge participation count
      const updatedChallenges = challenges.map(c =>
        c.id === challengeId
          ? { 
              ...c, 
              participantsCount: Math.max(0, c.participantsCount - 1),
              isParticipating: false,
              userProgress: undefined,
            }
          : c
      );
      setChallenges(updatedChallenges);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(
          `${STORAGE_KEYS.PARTICIPATIONS}_${user.id}`,
          JSON.stringify(updatedParticipations)
        ),
        saveChallenges(updatedChallenges),
      ]);
    } catch (err) {
      console.error('Error leaving challenge:', err);
      setError('Failed to leave challenge');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, myProfile, challenges, myParticipations, saveChallenges]);

  // Submit to challenge
  const submitToChallenge = useCallback(async (
    challengeId: string, 
    submissionData: SubmissionData
  ): Promise<ChallengeSubmission> => {
    if (!user || !myProfile) throw new Error('User not authenticated');

    try {
      setIsSubmitting(true);
      setError(null);

      const participation = myParticipations.find(p => p.challengeId === challengeId);
      if (!participation) throw new Error('Not participating in this challenge');

      const newSubmission: ChallengeSubmission = {
        id: `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        participationId: participation.id,
        type: submissionData.type,
        content: submissionData.content,
        mediaUrl: submissionData.mediaUrl,
        recipe: submissionData.recipe,
        rating: 0,
        votesReceived: 0,
        createdAt: new Date().toISOString(),
      };

      const updatedSubmissions = [...submissions, newSubmission];
      setSubmissions(updatedSubmissions);

      // Update participation with new submission
      const updatedParticipations = myParticipations.map(p =>
        p.id === participation.id
          ? { ...p, submissions: [...p.submissions, newSubmission] }
          : p
      );
      setMyParticipations(updatedParticipations);

      // Update challenge progress
      await updateChallengeProgress(challengeId, submissionData.type);

      // Save to storage
      await Promise.all([
        AsyncStorage.setItem(
          `${STORAGE_KEYS.SUBMISSIONS}_${user.id}`,
          JSON.stringify(updatedSubmissions)
        ),
        AsyncStorage.setItem(
          `${STORAGE_KEYS.PARTICIPATIONS}_${user.id}`,
          JSON.stringify(updatedParticipations)
        ),
      ]);

      return newSubmission;
    } catch (err) {
      console.error('Error submitting to challenge:', err);
      throw new Error('Failed to submit to challenge');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, myProfile, myParticipations, submissions]);

  // Update challenge progress
  const updateChallengeProgress = useCallback(async (challengeId: string, actionType: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge?.userProgress) return;

    const updatedRequirements = challenge.userProgress.requirements.map(req => {
      if (
        (req.type === 'cook_recipe' && actionType === 'recipe') ||
        (req.type === 'share_photo' && actionType === 'photo')
      ) {
        return { ...req, current: (req.current || 0) + 1 };
      }
      return req;
    });

    const updatedChallenges = challenges.map(c =>
      c.id === challengeId
        ? {
            ...c,
            userProgress: {
              ...c.userProgress!,
              requirements: updatedRequirements,
            },
          }
        : c
    );

    setChallenges(updatedChallenges);
    await saveChallenges(updatedChallenges);

    // Check if challenge is completed
    const isCompleted = updatedRequirements.every(req => (req.current || 0) >= req.target);
    if (isCompleted) {
      await completeChallenge(challengeId);
    }
  }, [challenges, saveChallenges]);

  // Complete challenge
  const completeChallenge = useCallback(async (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Award XP
    const xpAmount = Math.floor(challenge.xpReward * XP_MULTIPLIERS[challenge.difficulty]);
    await awardXp(xpAmount, `completing ${challenge.title} challenge`);

    // Update participation with completion
    const updatedParticipations = myParticipations.map(p =>
      p.challengeId === challengeId
        ? { ...p, completedAt: new Date().toISOString() }
        : p
    );
    setMyParticipations(updatedParticipations);

    // Update challenge completed count
    const updatedChallenges = challenges.map(c =>
      c.id === challengeId
        ? { ...c, completedCount: c.completedCount + 1 }
        : c
    );
    setChallenges(updatedChallenges);

    await Promise.all([
      AsyncStorage.setItem(
        `${STORAGE_KEYS.PARTICIPATIONS}_${user?.id}`,
        JSON.stringify(updatedParticipations)
      ),
      saveChallenges(updatedChallenges),
    ]);

    console.log(`Challenge completed: ${challenge.title} (+${xpAmount} XP)`);
  }, [challenges, myParticipations, awardXp, saveChallenges, user]);

  // Update submission
  const updateSubmission = useCallback(async (submissionId: string, updates: Partial<ChallengeSubmission>) => {
    try {
      const updatedSubmissions = submissions.map(s =>
        s.id === submissionId
          ? { ...s, ...updates }
          : s
      );
      setSubmissions(updatedSubmissions);

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.SUBMISSIONS}_${user?.id}`,
        JSON.stringify(updatedSubmissions)
      );
    } catch (err) {
      console.error('Error updating submission:', err);
      throw new Error('Failed to update submission');
    }
  }, [submissions, user]);

  // Get challenge by ID
  const getChallengeById = useCallback((challengeId: string): CookingChallenge | null => {
    return challenges.find(c => c.id === challengeId) || null;
  }, [challenges]);

  // Get challenges by type
  const getChallengesByType = useCallback((type: ChallengeType): CookingChallenge[] => {
    return challenges.filter(c => c.type === type);
  }, [challenges]);

  // Get active challenges
  const getActiveChallenges = useCallback((): CookingChallenge[] => {
    return challenges.filter(c => c.status === 'active');
  }, [challenges]);

  const activeChallenges = getActiveChallenges();

  // Get upcoming challenges
  const getUpcomingChallenges = useCallback((): CookingChallenge[] => {
    return challenges.filter(c => c.status === 'upcoming');
  }, [challenges]);

  // Get completed challenges
  const getCompletedChallenges = useCallback((): CookingChallenge[] => {
    return challenges.filter(c => c.status === 'completed');
  }, [challenges]);

  // Search challenges
  const searchChallenges = useCallback((query: string): CookingChallenge[] => {
    const lowercaseQuery = query.toLowerCase();
    return challenges.filter(c =>
      c.title.toLowerCase().includes(lowercaseQuery) ||
      c.description.toLowerCase().includes(lowercaseQuery) ||
      c.type.toLowerCase().includes(lowercaseQuery)
    );
  }, [challenges]);

  // Check if participating in challenge
  const isParticipating = useCallback((challengeId: string): boolean => {
    return myParticipations.some(p => p.challengeId === challengeId);
  }, [myParticipations]);

  // Get challenge progress
  const getChallengeProgress = useCallback((challengeId: string): ChallengeProgress | null => {
    const challenge = challenges.find(c => c.id === challengeId);
    return challenge?.userProgress || null;
  }, [challenges]);

  // Get participation history
  const getParticipationHistory = useCallback((): ChallengeParticipation[] => {
    return myParticipations.sort((a, b) => 
      new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    );
  }, [myParticipations]);

  // Get completion rate
  const getCompletionRate = useCallback((): number => {
    if (myParticipations.length === 0) return 0;
    const completed = myParticipations.filter(p => p.completedAt).length;
    return Math.round((completed / myParticipations.length) * 100);
  }, [myParticipations]);

  // Get challenge leaderboard
  const getChallengeLeaderboard = useCallback((challengeId: string): LeaderboardEntry[] => {
    // In production, would fetch from API
    return leaderboard.slice(0, 10);
  }, [leaderboard]);

  // Get global leaderboard
  const getGlobalLeaderboard = useCallback((period: LeaderboardPeriod = 'all-time'): LeaderboardEntry[] => {
    // In production, would filter by period
    return leaderboard;
  }, [leaderboard]);

  // Get user rank
  const getUserRank = useCallback((challengeId?: string): number | null => {
    if (!myProfile) return null;
    
    const entry = leaderboard.find(e => e.userId === myProfile.userId);
    return entry?.rank || null;
  }, [leaderboard, myProfile]);

  // Get top performers
  const getTopPerformers = useCallback((limit: number = 5): SocialUserProfile[] => {
    return leaderboard
      .slice(0, limit)
      .map(entry => entry.userProfile);
  }, [leaderboard]);

  // Get featured challenges
  const getFeaturedChallenges = useCallback((): CookingChallenge[] => {
    return challenges
      .filter(c => c.status === 'active')
      .sort((a, b) => b.participantsCount - a.participantsCount)
      .slice(0, 3);
  }, [challenges]);

  // Get recommended challenges
  const getRecommendedChallenges = useCallback((): CookingChallenge[] => {
    if (!myProfile) return [];

    // Simple recommendation based on cooking level and interests
    return challenges
      .filter(c => c.status === 'active' && !c.isParticipating)
      .filter(c => {
        if (myProfile.cookingLevel === 'Beginner') return c.difficulty === 'Easy';
        if (myProfile.cookingLevel === 'Novice') return ['Easy', 'Medium'].includes(c.difficulty);
        return true; // All difficulties for intermediate and above
      })
      .slice(0, 5);
  }, [challenges, myProfile]);

  // Get trending challenges
  const getTrendingChallenges = useCallback((): CookingChallenge[] => {
    return challenges
      .filter(c => c.status === 'active')
      .sort((a, b) => {
        const aGrowth = a.participantsCount / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (24 * 60 * 60 * 1000)));
        const bGrowth = b.participantsCount / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (24 * 60 * 60 * 1000)));
        return bGrowth - aGrowth;
      })
      .slice(0, 5);
  }, [challenges]);

  // Get personalized challenges
  const getPersonalizedChallenges = useCallback((): CookingChallenge[] => {
    // Same as recommended for now, but could be more sophisticated
    return getRecommendedChallenges();
  }, [getRecommendedChallenges]);

  // Vote for best submission
  const voteBestSubmission = useCallback(async (submissionId: string) => {
    if (!user || !myProfile) return;

    try {
      const userVotes = votes[myProfile.userId] || [];
      if (userVotes.includes(submissionId)) return; // Already voted

      const updatedVotes = {
        ...votes,
        [myProfile.userId]: [...userVotes, submissionId],
      };
      setVotes(updatedVotes);

      // Update submission vote count
      await updateSubmission(submissionId, {
        votesReceived: (submissions.find(s => s.id === submissionId)?.votesReceived || 0) + 1,
      });

      await AsyncStorage.setItem(
        `${STORAGE_KEYS.VOTES}_${user.id}`,
        JSON.stringify(updatedVotes)
      );
    } catch (err) {
      console.error('Error voting for submission:', err);
    }
  }, [user, myProfile, votes, submissions, updateSubmission]);

  // Report submission
  const reportSubmission = useCallback(async (submissionId: string, reason: string) => {
    // Implementation would go here
    console.log('Reporting submission:', submissionId, reason);
  }, []);

  // Get challenge submissions
  const getChallengeSubmissions = useCallback((challengeId: string): ChallengeSubmission[] => {
    const challengeParticipations = myParticipations.filter(p => p.challengeId === challengeId);
    return challengeParticipations.flatMap(p => p.submissions);
  }, [myParticipations]);

  // Get featured submissions
  const getFeaturedSubmissions = useCallback((challengeId: string): ChallengeSubmission[] => {
    return getChallengeSubmissions(challengeId)
      .sort((a, b) => b.votesReceived - a.votesReceived)
      .slice(0, 5);
  }, [getChallengeSubmissions]);

  // Get challenge analytics
  const getChallengeAnalytics = useCallback((): ChallengeAnalytics => {
    const totalJoined = myParticipations.length;
    const totalCompleted = myParticipations.filter(p => p.completedAt).length;
    const completionRate = totalJoined > 0 ? (totalCompleted / totalJoined) * 100 : 0;

    // Calculate favorite challenge type
    const typeCounts = myParticipations.reduce((acc, p) => {
      const challenge = challenges.find(c => c.id === p.challengeId);
      if (challenge) {
        acc[challenge.type] = (acc[challenge.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const favoriteChallengeType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as ChallengeType || 'Recipe Mastery';

    return {
      totalChallengesJoined: totalJoined,
      totalChallengesCompleted: totalCompleted,
      completionRate: Math.round(completionRate),
      totalXpEarned: totalCompleted * 300, // Estimate
      favoriteChallengeType,
      averageCompletionTime: 7, // Would calculate from actual data
      currentStreak: 3, // Would calculate from completion dates
      longestStreak: 7, // Would calculate from completion dates
      rankingDistribution: [
        { rank: 'Top 10%', count: totalCompleted > 10 ? 1 : 0 },
        { rank: 'Top 25%', count: totalCompleted > 5 ? 1 : 0 },
        { rank: 'Top 50%', count: totalCompleted > 2 ? 1 : 0 },
      ],
    };
  }, [myParticipations, challenges]);

  // Get completion insights
  const getCompletionInsights = useCallback((): CompletionInsights => {
    return {
      easiestChallengeType: 'Speed Cooking',
      hardestChallengeType: 'Cuisine Explorer',
      fastestCompletion: challenges[0], // Would calculate from actual data
      mostPopularDay: 'Sunday',
      improvementAreas: ['Time Management', 'Recipe Planning'],
      strengthAreas: ['Creativity', 'Technique'],
    };
  }, [challenges]);

  // Get skill progression
  const getSkillProgression = useCallback((): SkillProgression[] => {
    return [
      {
        skill: 'Italian Cuisine',
        currentLevel: 5,
        totalXp: 1250,
        challengesCompleted: 3,
        recentImprovement: 15,
      },
      {
        skill: 'Quick Cooking',
        currentLevel: 7,
        totalXp: 2100,
        challengesCompleted: 5,
        recentImprovement: 8,
      },
      {
        skill: 'Healthy Eating',
        currentLevel: 4,
        totalXp: 800,
        challengesCompleted: 2,
        recentImprovement: 22,
      },
    ];
  }, []);

  return {
    // Challenges state
    challenges,
    activeChallenges,
    myParticipations,
    isLoading,
    isSubmitting,
    error,

    // Challenge actions
    refreshChallenges,
    createChallenge,
    joinChallenge,
    leaveChallenge,
    submitToChallenge,
    updateSubmission,

    // Challenge queries
    getChallengeById,
    getChallengesByType,
    getActiveChallenges,
    getUpcomingChallenges,
    getCompletedChallenges,
    searchChallenges,

    // Participation and progress
    isParticipating,
    getChallengeProgress,
    getParticipationHistory,
    getCompletionRate,

    // Leaderboards and rankings
    getChallengeLeaderboard,
    getGlobalLeaderboard,
    getUserRank,
    getTopPerformers,

    // Featured and recommendations
    getFeaturedChallenges,
    getRecommendedChallenges,
    getTrendingChallenges,
    getPersonalizedChallenges,

    // Community features
    voteBestSubmission,
    reportSubmission,
    getChallengeSubmissions,
    getFeaturedSubmissions,

    // Analytics and insights
    getChallengeAnalytics,
    getCompletionInsights,
    getSkillProgression,
  };
};