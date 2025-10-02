import {
	SocialPost,
	UserProfile,
	Comment,
	Reaction,
	SocialFeedFilters,
} from '@/types/social';

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const socialService = {
	// User Profile
	async getUserProfile(userId: string): Promise<UserProfile> {
		const response = await fetch(`${API_BASE_URL}/users/${userId}`);
		if (!response.ok) throw new Error('Failed to fetch user profile');
		return response.json();
	},

	async updateUserProfile(
		userId: string,
		profile: Partial<UserProfile>
	): Promise<UserProfile> {
		const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(profile),
		});
		if (!response.ok) throw new Error('Failed to update user profile');
		return response.json();
	},

	// Social Feed
	async getSocialFeed(filters?: SocialFeedFilters): Promise<SocialPost[]> {
		const queryParams = new URLSearchParams();
		if (filters) {
			Object.entries(filters).forEach(([key, value]) => {
				if (value)
					queryParams.append(
						key,
						Array.isArray(value) ? value.join(',') : String(value)
					);
			});
		}
		const response = await fetch(`${API_BASE_URL}/social/feed?${queryParams}`);
		if (!response.ok) throw new Error('Failed to fetch social feed');
		return response.json();
	},

	// Posts
	async createPost(
		post: Omit<
			SocialPost,
			'id' | 'createdAt' | 'likes' | 'comments' | 'reactions'
		>
	): Promise<SocialPost> {
		const response = await fetch(`${API_BASE_URL}/social/post`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(post),
		});
		if (!response.ok) throw new Error('Failed to create post');
		return response.json();
	},

	// Comments
	async addComment(
		postId: string,
		comment: Omit<Comment, 'id' | 'createdAt' | 'likes'>
	): Promise<Comment> {
		const response = await fetch(`${API_BASE_URL}/social/${postId}/comment`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(comment),
		});
		if (!response.ok) throw new Error('Failed to add comment');
		return response.json();
	},

	// Reactions
	async addReaction(
		postId: string,
		reaction: Omit<Reaction, 'id' | 'createdAt'>
	): Promise<Reaction> {
		const response = await fetch(`${API_BASE_URL}/social/${postId}/reaction`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(reaction),
		});
		if (!response.ok) throw new Error('Failed to add reaction');
		return response.json();
	},

	// Follow/Unfollow
	async followUser(userId: string, targetUserId: string): Promise<void> {
		const response = await fetch(
			`${API_BASE_URL}/users/${targetUserId}/follow`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId }),
			}
		);
		if (!response.ok) throw new Error('Failed to follow user');
	},

	async unfollowUser(userId: string, targetUserId: string): Promise<void> {
		const response = await fetch(
			`${API_BASE_URL}/users/${targetUserId}/follow`,
			{
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId }),
			}
		);
		if (!response.ok) throw new Error('Failed to unfollow user');
	},
};
