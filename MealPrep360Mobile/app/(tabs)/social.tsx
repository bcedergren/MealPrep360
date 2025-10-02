import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
	Alert,
	Dimensions,
	FlatList,
	Image,
	Modal,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/theme';
import { useCookingChallenges } from '../../src/hooks/useCookingChallenges';
import { useSocialFeed } from '../../src/hooks/useSocialFeed';
import { useSocialProfiles } from '../../src/hooks/useSocialProfiles';
import {
	CookingChallenge,
	SocialFeedItem,
	SocialUserProfile,
} from '../../src/types/social';

const { width } = Dimensions.get('window');

type TabType = 'feed' | 'challenges' | 'leaderboard' | 'profile';

export default function SocialScreen() {
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<TabType>('feed');
	const [showCreatePost, setShowCreatePost] = useState(false);
	const [newPostText, setNewPostText] = useState('');

	// Hooks
	const {
		myProfile,
		getFollowers,
		getFollowing,
		getProfileStats,
		getTopChefs,
		getSuggestedConnections,
		followUser,
		isLoading: profileLoading,
	} = useSocialProfiles();

	const {
		feedItems,
		refreshFeed,
		likePost,
		addComment,
		createPost,
		shareRecipe,
		getTopPosts,
		isRefreshing,
		isLoading: feedLoading,
	} = useSocialFeed();

	const {
		challenges,
		activeChallenges,
		getFeaturedChallenges,
		getRecommendedChallenges,
		getTopPerformers,
		getChallengeAnalytics,
		joinChallenge,
		isLoading: challengesLoading,
	} = useCookingChallenges();

	const scrollViewRef = useRef<ScrollView>(null);

	// Handle refresh
	const handleRefresh = async () => {
		await refreshFeed();
	};

	// Handle like post
	const handleLikePost = async (postId: string) => {
		try {
			await likePost(postId);
		} catch (error) {
			Alert.alert('Error', 'Failed to like post');
		}
	};

	// Handle join challenge
	const handleJoinChallenge = async (challengeId: string) => {
		try {
			await joinChallenge(challengeId);
			Alert.alert('Success', 'Successfully joined the challenge!');
		} catch (error) {
			Alert.alert('Error', 'Failed to join challenge');
		}
	};

	// Handle follow user
	const handleFollowUser = async (userId: string) => {
		try {
			await followUser(userId);
			Alert.alert('Success', 'Now following user!');
		} catch (error) {
			Alert.alert('Error', 'Failed to follow user');
		}
	};

	// Create new post
	const handleCreatePost = async () => {
		if (!newPostText.trim()) return;

		try {
			await createPost({
				type: 'cooking_tip',
				content: {
					text: newPostText,
					tags: extractHashtags(newPostText),
				},
				visibility: 'public',
			});
			setNewPostText('');
			setShowCreatePost(false);
			Alert.alert('Success', 'Post created successfully!');
		} catch (error) {
			Alert.alert('Error', 'Failed to create post');
		}
	};

	// Extract hashtags from text
	const extractHashtags = (text: string): string[] => {
		const hashtags = text.match(/#[\w]+/g);
		return hashtags ? hashtags.map((tag) => tag.slice(1).toLowerCase()) : [];
	};

	// Format time ago
	const formatTimeAgo = (dateString: string): string => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

		if (diffInMinutes < 1) return 'Just now';
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
		return `${Math.floor(diffInMinutes / 1440)}d ago`;
	};

	// Render feed item
	const renderFeedItem = ({ item }: { item: SocialFeedItem }) => (
		<View style={styles.feedItem}>
			{/* User header */}
			<View style={styles.feedHeader}>
				<Image
					source={{
						uri:
							item.userProfile?.profileImageUrl ||
							'https://via.placeholder.com/40',
					}}
					style={styles.avatar}
				/>
				<View style={styles.feedUserInfo}>
					<View style={styles.feedUserName}>
						<Text style={styles.userName}>{item.userProfile?.displayName}</Text>
						{item.userProfile?.isVerified && (
							<Ionicons
								name='checkmark-circle'
								size={16}
								color={Colors.primary}
							/>
						)}
					</View>
					<Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
				</View>
				<TouchableOpacity style={styles.moreButton}>
					<Ionicons
						name='ellipsis-horizontal'
						size={20}
						color={Colors.textSecondary}
					/>
				</TouchableOpacity>
			</View>

			{/* Content */}
			<Text style={styles.feedText}>{item.content.text}</Text>

			{item.content.images && item.content.images.length > 0 && (
				<Image
					source={{ uri: item.content.images[0] }}
					style={styles.feedImage}
				/>
			)}

			{/* Recipe card */}
			{item.content.recipe && (
				<View style={styles.recipeCard}>
					<Image
						source={{ uri: item.content.recipe.imageUrl }}
						style={styles.recipeImage}
					/>
					<View style={styles.recipeInfo}>
						<Text style={styles.recipeTitle}>{item.content.recipe.title}</Text>
						<Text
							style={styles.recipeDescription}
							numberOfLines={2}
						>
							{item.content.recipe.description}
						</Text>
						<View style={styles.recipeStats}>
							<Text style={styles.recipeStat}>
								⏱️ {item.content.recipe.prepTime + item.content.recipe.cookTime}
								min
							</Text>
							<Text style={styles.recipeStat}>
								👥 {item.content.recipe.servings} servings
							</Text>
						</View>
					</View>
				</View>
			)}

			{/* Badge display */}
			{item.content.badge && (
				<View style={styles.badgeCard}>
					<Text style={styles.badgeEmoji}>🏆</Text>
					<View>
						<Text style={styles.badgeName}>{item.content.badge.name}</Text>
						<Text style={styles.badgeDescription}>
							{item.content.badge.description}
						</Text>
					</View>
				</View>
			)}

			{/* Engagement actions */}
			<View style={styles.feedActions}>
				<TouchableOpacity
					style={[
						styles.actionButton,
						item.isLikedByUser && styles.likedButton,
					]}
					onPress={() => handleLikePost(item.id)}
				>
					<Ionicons
						name={item.isLikedByUser ? 'heart' : 'heart-outline'}
						size={20}
						color={item.isLikedByUser ? Colors.error : Colors.textSecondary}
					/>
					<Text
						style={[styles.actionText, item.isLikedByUser && styles.likedText]}
					>
						{item.likesCount}
					</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.actionButton}>
					<Ionicons
						name='chatbubble-outline'
						size={20}
						color={Colors.textSecondary}
					/>
					<Text style={styles.actionText}>{item.commentsCount}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.actionButton}>
					<Ionicons
						name='share-outline'
						size={20}
						color={Colors.textSecondary}
					/>
					<Text style={styles.actionText}>{item.sharesCount}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.actionButton}>
					<Ionicons
						name='bookmark-outline'
						size={20}
						color={Colors.textSecondary}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);

	// Render challenge item
	const renderChallengeItem = ({ item }: { item: CookingChallenge }) => (
		<View style={styles.challengeCard}>
			<Image
				source={{ uri: item.imageUrl || 'https://via.placeholder.com/300x150' }}
				style={styles.challengeImage}
			/>
			<View style={styles.challengeContent}>
				<View style={styles.challengeHeader}>
					<Text style={styles.challengeTitle}>{item.title}</Text>
					<View
						style={[
							styles.difficultyBadge,
							styles[`difficulty${item.difficulty}` as keyof typeof styles],
						]}
					>
						<Text style={styles.difficultyText}>{item.difficulty}</Text>
					</View>
				</View>

				<Text
					style={styles.challengeDescription}
					numberOfLines={2}
				>
					{item.description}
				</Text>

				<View style={styles.challengeStats}>
					<Text style={styles.challengeStat}>
						👥 {item.participantsCount} participants
					</Text>
					<Text style={styles.challengeStat}>🏆 {item.xpReward} XP</Text>
					<Text style={styles.challengeStat}>
						⏰ {item.duration.value} {item.duration.unit}
					</Text>
				</View>

				{item.userProgress && (
					<View style={styles.progressBar}>
						<View
							style={[
								styles.progressFill,
								{
									width: `${
										(item.userProgress.requirements.reduce(
											(acc, req) => acc + (req.current || 0),
											0
										) /
											item.userProgress.requirements.reduce(
												(acc, req) => acc + req.target,
												0
											)) *
										100
									}%`,
								},
							]}
						/>
					</View>
				)}

				<TouchableOpacity
					style={[
						styles.challengeButton,
						item.isParticipating && styles.participatingButton,
					]}
					onPress={() => handleJoinChallenge(item.id)}
					disabled={item.isParticipating}
				>
					<Text
						style={[
							styles.challengeButtonText,
							item.isParticipating && styles.participatingText,
						]}
					>
						{item.isParticipating ? 'Participating' : 'Join Challenge'}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);

	// Render user item
	const renderUserItem = ({ item }: { item: SocialUserProfile }) => (
		<TouchableOpacity style={styles.userCard}>
			<Image
				source={{
					uri: item.profileImageUrl || 'https://via.placeholder.com/60',
				}}
				style={styles.userAvatar}
			/>
			<View style={styles.userInfo}>
				<View style={styles.userNameRow}>
					<Text style={styles.userDisplayName}>{item.displayName}</Text>
					{item.isVerified && (
						<Ionicons
							name='checkmark-circle'
							size={14}
							color={Colors.primary}
						/>
					)}
				</View>
				<Text style={styles.userLevel}>
					Level {item.level} • {item.cookingLevel}
				</Text>
				<Text style={styles.userStats}>{item.followersCount} followers</Text>
			</View>
			<TouchableOpacity
				style={styles.followButton}
				onPress={() => handleFollowUser(item.userId)}
			>
				<Text style={styles.followButtonText}>Follow</Text>
			</TouchableOpacity>
		</TouchableOpacity>
	);

	// Render tab content
	const renderTabContent = () => {
		switch (activeTab) {
			case 'feed':
				return (
					<FlatList
						data={feedItems}
						renderItem={renderFeedItem}
						keyExtractor={(item) => item.id}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshing}
								onRefresh={handleRefresh}
								colors={[Colors.primary]}
							/>
						}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.feedContainer}
					/>
				);

			case 'challenges':
				return (
					<ScrollView
						refreshControl={
							<RefreshControl
								refreshing={challengesLoading}
								onRefresh={() => {}}
								colors={[Colors.primary]}
							/>
						}
						showsVerticalScrollIndicator={false}
					>
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Featured Challenges</Text>
							<TouchableOpacity>
								<Text style={styles.seeAllText}>See All</Text>
							</TouchableOpacity>
						</View>
						<FlatList
							data={getFeaturedChallenges()}
							renderItem={renderChallengeItem}
							keyExtractor={(item) => item.id}
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.horizontalList}
						/>

						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Recommended for You</Text>
						</View>
						<FlatList
							data={getRecommendedChallenges()}
							renderItem={renderChallengeItem}
							keyExtractor={(item) => item.id}
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.horizontalList}
						/>
					</ScrollView>
				);

			case 'leaderboard':
				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						<View style={styles.leaderboardHeader}>
							<Text style={styles.leaderboardTitle}>Top Chefs</Text>
							<Text style={styles.leaderboardSubtitle}>Weekly rankings</Text>
						</View>

						<FlatList
							data={getTopPerformers(10)}
							renderItem={({ item, index }) => (
								<View style={styles.leaderboardItem}>
									<View style={styles.rankBadge}>
										<Text style={styles.rankText}>#{index + 1}</Text>
									</View>
									<Image
										source={{
											uri:
												item.profileImageUrl ||
												'https://via.placeholder.com/50',
										}}
										style={styles.leaderboardAvatar}
									/>
									<View style={styles.leaderboardInfo}>
										<View style={styles.leaderboardNameRow}>
											<Text style={styles.leaderboardName}>
												{item.displayName}
											</Text>
											{item.isVerified && (
												<Ionicons
													name='checkmark-circle'
													size={16}
													color={Colors.primary}
												/>
											)}
										</View>
										<Text style={styles.leaderboardLevel}>
											Level {item.level}
										</Text>
									</View>
									<View style={styles.leaderboardScore}>
										<Text style={styles.scoreText}>8,540</Text>
										<Text style={styles.scoreLabel}>XP</Text>
									</View>
								</View>
							)}
							keyExtractor={(item, index) => `${item.userId}_${index}`}
							scrollEnabled={false}
						/>
					</ScrollView>
				);

			case 'profile':
				if (!myProfile) {
					return (
						<View style={styles.loadingContainer}>
							<Text style={styles.loadingText}>Loading profile...</Text>
						</View>
					);
				}

				const stats = getProfileStats();
				const followers = getFollowers();
				const following = getFollowing();
				const suggested = getSuggestedConnections(5);

				return (
					<ScrollView showsVerticalScrollIndicator={false}>
						{/* Profile header */}
						<View style={styles.profileHeader}>
							<Image
								source={{
									uri:
										myProfile.profileImageUrl ||
										'https://via.placeholder.com/100',
								}}
								style={styles.profileAvatar}
							/>
							<Text style={styles.profileName}>{myProfile.displayName}</Text>
							<Text style={styles.profileUsername}>@{myProfile.username}</Text>
							<Text style={styles.profileBio}>
								{myProfile.bio || 'Passionate home cook 👨‍🍳'}
							</Text>

							{/* Stats */}
							<View style={styles.profileStats}>
								<View style={styles.statItem}>
									<Text style={styles.statNumber}>{stats.totalRecipes}</Text>
									<Text style={styles.statLabel}>Recipes</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statNumber}>{stats.totalFollowers}</Text>
									<Text style={styles.statLabel}>Followers</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statNumber}>{stats.totalFollowing}</Text>
									<Text style={styles.statLabel}>Following</Text>
								</View>
								<View style={styles.statItem}>
									<Text style={styles.statNumber}>{stats.level}</Text>
									<Text style={styles.statLabel}>Level</Text>
								</View>
							</View>

							{/* Level progress */}
							<View style={styles.levelProgress}>
								<Text style={styles.levelTitle}>{stats.levelTitle}</Text>
								<View style={styles.xpBar}>
									<View
										style={[
											styles.xpFill,
											{ width: `${(stats.xp % 1000) / 10}%` }, // Assuming 1000 XP per level
										]}
									/>
								</View>
								<Text style={styles.xpText}>
									{stats.xpToNextLevel} XP to next level
								</Text>
							</View>
						</View>

						{/* Suggested connections */}
						<View style={styles.sectionHeader}>
							<Text style={styles.sectionTitle}>Suggested Connections</Text>
						</View>
						<FlatList
							data={suggested}
							renderItem={renderUserItem}
							keyExtractor={(item) => item.userId}
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.horizontalList}
						/>
					</ScrollView>
				);

			default:
				return null;
		}
	};

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<StatusBar style='dark' />

			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Social</Text>
				<View style={styles.headerActions}>
					<TouchableOpacity style={styles.headerButton}>
						<Ionicons
							name='search'
							size={24}
							color={Colors.text}
						/>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => setShowCreatePost(true)}
					>
						<Ionicons
							name='add'
							size={24}
							color={Colors.text}
						/>
					</TouchableOpacity>
				</View>
			</View>

			{/* Tab Navigation */}
			<View style={styles.tabContainer}>
				{[
					{ key: 'feed', label: 'Feed', icon: 'home' },
					{ key: 'challenges', label: 'Challenges', icon: 'trophy' },
					{ key: 'leaderboard', label: 'Leaderboard', icon: 'podium' },
					{ key: 'profile', label: 'Profile', icon: 'person' },
				].map((tab) => (
					<TouchableOpacity
						key={tab.key}
						style={[styles.tabItem, activeTab === tab.key && styles.activeTab]}
						onPress={() => setActiveTab(tab.key as TabType)}
					>
						<Ionicons
							name={tab.icon as any}
							size={20}
							color={
								activeTab === tab.key ? Colors.primary : Colors.textSecondary
							}
						/>
						<Text
							style={[
								styles.tabLabel,
								activeTab === tab.key && styles.activeTabLabel,
							]}
						>
							{tab.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Content */}
			<View style={styles.content}>{renderTabContent()}</View>

			{/* Create Post Modal */}
			<Modal
				visible={showCreatePost}
				animationType='slide'
				presentationStyle='pageSheet'
			>
				<View style={styles.modalContainer}>
					<View style={styles.modalHeader}>
						<TouchableOpacity onPress={() => setShowCreatePost(false)}>
							<Text style={styles.modalCancel}>Cancel</Text>
						</TouchableOpacity>
						<Text style={styles.modalTitle}>Create Post</Text>
						<TouchableOpacity onPress={handleCreatePost}>
							<Text style={styles.modalPost}>Post</Text>
						</TouchableOpacity>
					</View>

					<TextInput
						style={styles.postInput}
						placeholder="What's cooking? Share your thoughts..."
						value={newPostText}
						onChangeText={setNewPostText}
						multiline
						textAlignVertical='top'
					/>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
	},
	headerActions: {
		flexDirection: 'row',
	},
	headerButton: {
		padding: 8,
		marginLeft: 8,
	},
	tabContainer: {
		flexDirection: 'row',
		backgroundColor: Colors.background,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	tabItem: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		paddingVertical: 12,
	},
	activeTab: {
		borderBottomWidth: 2,
		borderBottomColor: Colors.primary,
	},
	tabLabel: {
		fontSize: 12,
		marginTop: 4,
		color: Colors.textSecondary,
	},
	activeTabLabel: {
		color: Colors.primary,
		fontWeight: '600',
	},
	content: {
		flex: 1,
	},

	// Feed Styles
	feedContainer: {
		paddingVertical: 10,
	},
	feedItem: {
		backgroundColor: Colors.backgroundSecondary,
		marginHorizontal: 15,
		marginVertical: 8,
		borderRadius: 12,
		padding: 15,
	},
	feedHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	avatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	feedUserInfo: {
		flex: 1,
		marginLeft: 12,
	},
	feedUserName: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	userName: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginRight: 4,
	},
	timeAgo: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 2,
	},
	moreButton: {
		padding: 4,
	},
	feedText: {
		fontSize: 16,
		lineHeight: 22,
		color: Colors.text,
		marginBottom: 12,
	},
	feedImage: {
		width: '100%',
		height: 200,
		borderRadius: 8,
		marginBottom: 12,
	},
	recipeCard: {
		flexDirection: 'row',
		backgroundColor: Colors.background,
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
	},
	recipeImage: {
		width: 60,
		height: 60,
		borderRadius: 8,
	},
	recipeInfo: {
		flex: 1,
		marginLeft: 12,
	},
	recipeTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.text,
		marginBottom: 4,
	},
	recipeDescription: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginBottom: 4,
	},
	recipeStats: {
		flexDirection: 'row',
	},
	recipeStat: {
		fontSize: 11,
		color: Colors.textSecondary,
		marginRight: 8,
	},
	badgeCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: Colors.primary + '20',
		borderRadius: 8,
		padding: 12,
		marginBottom: 12,
	},
	badgeEmoji: {
		fontSize: 24,
		marginRight: 12,
	},
	badgeName: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.primary,
	},
	badgeDescription: {
		fontSize: 12,
		color: Colors.textSecondary,
	},
	feedActions: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: Colors.border,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 20,
	},
	likedButton: {
		// No additional styles needed as color is handled in the component
	},
	actionText: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginLeft: 4,
	},
	likedText: {
		color: Colors.error,
	},

	// Challenge Styles
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.text,
	},
	seeAllText: {
		fontSize: 14,
		color: Colors.primary,
		fontWeight: '600',
	},
	horizontalList: {
		paddingHorizontal: 20,
	},
	challengeCard: {
		width: width * 0.8,
		backgroundColor: Colors.backgroundSecondary,
		borderRadius: 12,
		marginRight: 15,
		overflow: 'hidden',
	},
	challengeImage: {
		width: '100%',
		height: 120,
	},
	challengeContent: {
		padding: 15,
	},
	challengeHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 8,
	},
	challengeTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.text,
		flex: 1,
		marginRight: 8,
	},
	difficultyBadge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
	},
	difficultyEasy: {
		backgroundColor: Colors.success + '20',
	},
	difficultyMedium: {
		backgroundColor: Colors.warning + '20',
	},
	difficultyHard: {
		backgroundColor: Colors.error + '20',
	},
	difficultyText: {
		fontSize: 10,
		fontWeight: '600',
		color: Colors.text,
	},
	challengeDescription: {
		fontSize: 14,
		color: Colors.textSecondary,
		lineHeight: 20,
		marginBottom: 12,
	},
	challengeStats: {
		flexDirection: 'row',
		marginBottom: 12,
	},
	challengeStat: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginRight: 12,
	},
	progressBar: {
		height: 4,
		backgroundColor: Colors.border,
		borderRadius: 2,
		marginBottom: 12,
	},
	progressFill: {
		height: '100%',
		backgroundColor: Colors.primary,
		borderRadius: 2,
	},
	challengeButton: {
		backgroundColor: Colors.primary,
		paddingVertical: 10,
		borderRadius: 8,
		alignItems: 'center',
	},
	participatingButton: {
		backgroundColor: Colors.success,
	},
	challengeButtonText: {
		fontSize: 14,
		fontWeight: '600',
		color: Colors.white,
	},
	participatingText: {
		color: Colors.white,
	},

	// Leaderboard Styles
	leaderboardHeader: {
		alignItems: 'center',
		paddingVertical: 20,
	},
	leaderboardTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
	},
	leaderboardSubtitle: {
		fontSize: 14,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	leaderboardItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 12,
		backgroundColor: Colors.backgroundSecondary,
		marginHorizontal: 15,
		marginVertical: 4,
		borderRadius: 8,
	},
	rankBadge: {
		width: 30,
		height: 30,
		borderRadius: 15,
		backgroundColor: Colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	rankText: {
		fontSize: 12,
		fontWeight: 'bold',
		color: Colors.white,
	},
	leaderboardAvatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		marginRight: 12,
	},
	leaderboardInfo: {
		flex: 1,
	},
	leaderboardNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	leaderboardName: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginRight: 4,
	},
	leaderboardLevel: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 2,
	},
	leaderboardScore: {
		alignItems: 'flex-end',
	},
	scoreText: {
		fontSize: 16,
		fontWeight: 'bold',
		color: Colors.primary,
	},
	scoreLabel: {
		fontSize: 10,
		color: Colors.textSecondary,
	},

	// Profile Styles
	profileHeader: {
		alignItems: 'center',
		paddingVertical: 30,
		paddingHorizontal: 20,
	},
	profileAvatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		marginBottom: 15,
	},
	profileName: {
		fontSize: 24,
		fontWeight: 'bold',
		color: Colors.text,
		marginBottom: 5,
	},
	profileUsername: {
		fontSize: 16,
		color: Colors.textSecondary,
		marginBottom: 10,
	},
	profileBio: {
		fontSize: 14,
		color: Colors.text,
		textAlign: 'center',
		marginBottom: 20,
	},
	profileStats: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		marginBottom: 20,
	},
	statItem: {
		alignItems: 'center',
	},
	statNumber: {
		fontSize: 20,
		fontWeight: 'bold',
		color: Colors.text,
	},
	statLabel: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	levelProgress: {
		width: '100%',
		alignItems: 'center',
	},
	levelTitle: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.primary,
		marginBottom: 8,
	},
	xpBar: {
		width: '80%',
		height: 8,
		backgroundColor: Colors.border,
		borderRadius: 4,
		marginBottom: 8,
	},
	xpFill: {
		height: '100%',
		backgroundColor: Colors.primary,
		borderRadius: 4,
	},
	xpText: {
		fontSize: 12,
		color: Colors.textSecondary,
	},

	// User Card Styles
	userCard: {
		width: 200,
		backgroundColor: Colors.backgroundSecondary,
		borderRadius: 12,
		padding: 15,
		marginRight: 15,
		alignItems: 'center',
	},
	userAvatar: {
		width: 60,
		height: 60,
		borderRadius: 30,
		marginBottom: 10,
	},
	userInfo: {
		alignItems: 'center',
		marginBottom: 15,
	},
	userNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	userDisplayName: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.text,
		marginRight: 4,
	},
	userLevel: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 4,
	},
	userStats: {
		fontSize: 12,
		color: Colors.textSecondary,
		marginTop: 2,
	},
	followButton: {
		backgroundColor: Colors.primary,
		paddingHorizontal: 20,
		paddingVertical: 8,
		borderRadius: 20,
	},
	followButtonText: {
		fontSize: 12,
		fontWeight: '600',
		color: Colors.white,
	},

	// Modal Styles
	modalContainer: {
		flex: 1,
		backgroundColor: Colors.background,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 15,
		borderBottomWidth: 1,
		borderBottomColor: Colors.border,
	},
	modalCancel: {
		fontSize: 16,
		color: Colors.textSecondary,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: Colors.text,
	},
	modalPost: {
		fontSize: 16,
		fontWeight: '600',
		color: Colors.primary,
	},
	postInput: {
		flex: 1,
		padding: 20,
		fontSize: 16,
		color: Colors.text,
	},

	// Loading Styles
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		color: Colors.textSecondary,
	},
});
