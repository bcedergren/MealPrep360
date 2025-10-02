import { auth } from '@clerk/nextjs/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mealprep360.com';

export class AdminApiClient {
	private async request(endpoint: string, options: RequestInit = {}) {
		const response = await fetch(`${API_BASE_URL}/api/admin${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `API request failed: ${response.statusText}`
			);
		}

		return response.json();
	}

	private async requestWithAuth(endpoint: string, options: RequestInit = {}) {
		const { getToken } = auth();
		const token = await getToken();

		return this.request(endpoint, {
			...options,
			headers: {
				...options.headers,
				Authorization: `Bearer ${token}`,
			},
		});
	}

	// Recipe Management
	async getRecipes(params?: Record<string, string>) {
		const queryString = params ? `?${new URLSearchParams(params)}` : '';
		return this.requestWithAuth(`/recipes${queryString}`);
	}

	async generateRecipes(data: { season?: string; [key: string]: any }) {
		return this.requestWithAuth('/recipes/generate', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateRecipes(data: any) {
		return this.requestWithAuth('/recipes/update', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async makeAllRecipesPublic() {
		return this.requestWithAuth('/recipes/make-all-public', {
			method: 'POST',
		});
	}

	async ensureRecipeImages(data: any) {
		return this.requestWithAuth('/recipes/ensure-images', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async generateRecipeImage(data: any) {
		return this.requestWithAuth('/recipes/generate-image', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async uploadRecipeImage(formData: FormData) {
		return this.requestWithAuth('/recipes/upload-image', {
			method: 'POST',
			body: formData,
			// Don't set Content-Type header for FormData, let browser set it
			headers: {},
		});
	}

	async getReportedImages() {
		return this.requestWithAuth('/recipes/reported-images');
	}

	async updateReportedImages(data: any) {
		return this.requestWithAuth('/recipes/reported-images', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async deleteAllRecipes() {
		return this.requestWithAuth('/recipes/delete-all', {
			method: 'DELETE',
		});
	}

	async deleteRecipe(recipeId: string) {
		return this.requestWithAuth(`/recipes/${recipeId}`, {
			method: 'DELETE',
		});
	}

	async getRecipeImageStatus(recipeId: string) {
		return this.requestWithAuth(`/recipes/image-status/${recipeId}`);
	}

	// Recipe Generation Jobs
	async getRecipeGenerationJobs() {
		return this.requestWithAuth('/recipes/generate/jobs');
	}

	async getRecipeGenerationJob(jobId: string) {
		return this.requestWithAuth(`/recipes/generate/jobs/${jobId}`);
	}

	async getRecipeGenerationStatus(jobId: string) {
		return this.requestWithAuth(`/recipes/generate/status/${jobId}`);
	}

	async getRecipeGenerationMetrics() {
		return this.requestWithAuth('/recipes/generate/metrics');
	}

	async getRecipeGenerationPerformance() {
		return this.requestWithAuth('/recipes/generate/performance');
	}

	async getRecipeGenerationHealth() {
		return this.requestWithAuth('/recipes/generate/health');
	}

	async deleteRecipeGenerationJob(jobId: string, data: any) {
		return this.requestWithAuth(`/recipes/generate/jobs/${jobId}`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async retryRecipeGenerationJob(jobId: string, data: any) {
		return this.requestWithAuth(`/recipes/generate/jobs/${jobId}/retry`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async failRecipeGenerationJob(jobId: string, data?: any) {
		return this.requestWithAuth(`/recipes/generate/jobs/${jobId}/fail`, {
			method: 'POST',
			body: JSON.stringify(data || {}),
		});
	}

	// User Management
	async getUsers() {
		return this.requestWithAuth('/users');
	}

	async getUser(userId: string) {
		return this.requestWithAuth(`/users/${userId}`);
	}

	async setAdmin(data: { userId: string; isAdmin: boolean }) {
		return this.requestWithAuth('/set-admin', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// System Administration
	async getStats() {
		return this.requestWithAuth('/stats');
	}

	async checkStatus() {
		return this.requestWithAuth('/check-status');
	}

	async getServicesHealth() {
		return this.requestWithAuth('/services/health');
	}

	async setupSystem(data: any) {
		return this.requestWithAuth('/setup', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Blog Management
	async getBlogPosts(params?: Record<string, string>) {
		const queryString = params ? `?${new URLSearchParams(params)}` : '';
		return this.requestWithAuth(`/blog/posts${queryString}`);
	}

	async getBlogPost(postId: string) {
		return this.requestWithAuth(`/blog/posts/${postId}`);
	}

	async createBlogPost(data: any) {
		return this.requestWithAuth('/blog/posts', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateBlogPost(postId: string, data: any) {
		return this.requestWithAuth(`/blog/posts/${postId}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteBlogPost(postId: string) {
		return this.requestWithAuth(`/blog/posts/${postId}`, {
			method: 'DELETE',
		});
	}

	async generateBlogPost(data: any) {
		return this.requestWithAuth('/blog/generate', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async generateBlogImage(data: any) {
		return this.requestWithAuth('/blog/generate-image', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Content Moderation
	async getFlaggedContent(params?: Record<string, string>) {
		const queryString = params ? `?${new URLSearchParams(params)}` : '';
		return this.requestWithAuth(`/moderation/flagged${queryString}`);
	}

	async getModerationStats() {
		return this.requestWithAuth('/moderation/stats');
	}

	async updateFlaggedContent(data: any) {
		return this.requestWithAuth('/moderation/flagged', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Notifications
	async getNotifications() {
		return this.requestWithAuth('/notifications');
	}

	async sendNotification(data: any) {
		return this.requestWithAuth('/notifications/send', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Feedback
	async getFeedback() {
		return this.requestWithAuth('/feedback');
	}

	async submitFeedback(data: any) {
		return this.requestWithAuth('/feedback', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Social Features
	async getSocialFeed() {
		return this.requestWithAuth('/social/feed');
	}

	async createSocialPost(data: any) {
		return this.requestWithAuth('/social/post', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async addComment(postId: string, data: any) {
		return this.requestWithAuth(`/social/${postId}/comment`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async addReaction(postId: string, data: any) {
		return this.requestWithAuth(`/social/${postId}/reaction`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}
}

// Create singleton instance
export const adminApiClient = new AdminApiClient();

// Client-side API client for use in components
export class ClientAdminApiClient {
	private async request(endpoint: string, options: RequestInit = {}) {
		const response = await fetch(`${API_BASE_URL}/api/admin${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `API request failed: ${response.statusText}`
			);
		}

		return response.json();
	}

	// Recipe Management
	async getRecipes(params?: Record<string, string>) {
		const queryString = params ? `?${new URLSearchParams(params)}` : '';
		return this.request(`/recipes${queryString}`);
	}

	async generateRecipes(data: { season?: string; [key: string]: any }) {
		return this.request('/recipes/generate', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateRecipes(data: any) {
		return this.request('/recipes/update', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async makeAllRecipesPublic() {
		return this.request('/recipes/make-all-public', {
			method: 'POST',
		});
	}

	async ensureRecipeImages(data: any) {
		return this.request('/recipes/ensure-images', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async generateRecipeImage(data: any) {
		return this.request('/recipes/generate-image', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async uploadRecipeImage(formData: FormData) {
		// For client-side FormData uploads, we need to handle headers differently
		const response = await fetch(
			`${API_BASE_URL}/api/admin/recipes/upload-image`,
			{
				method: 'POST',
				body: formData,
				// Don't set Content-Type for FormData
			}
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error || `API request failed: ${response.statusText}`
			);
		}

		return response.json();
	}

	async getReportedImages() {
		return this.request('/recipes/reported-images');
	}

	async updateReportedImages(data: any) {
		return this.request('/recipes/reported-images', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async deleteAllRecipes() {
		return this.request('/recipes/delete-all', {
			method: 'DELETE',
		});
	}

	async deleteRecipe(recipeId: string) {
		return this.request(`/recipes/${recipeId}`, {
			method: 'DELETE',
		});
	}

	async getRecipeImageStatus(recipeId: string) {
		return this.request(`/recipes/image-status/${recipeId}`);
	}

	// Recipe Generation Jobs
	async getRecipeGenerationJobs() {
		return this.request('/recipes/generate/jobs');
	}

	async getRecipeGenerationJob(jobId: string) {
		return this.request(`/recipes/generate/jobs/${jobId}`);
	}

	async getRecipeGenerationStatus(jobId: string) {
		return this.request(`/recipes/generate/status/${jobId}`);
	}

	async getRecipeGenerationMetrics() {
		return this.request('/recipes/generate/metrics');
	}

	async getRecipeGenerationPerformance() {
		return this.request('/recipes/generate/performance');
	}

	async getRecipeGenerationHealth() {
		return this.request('/recipes/generate/health');
	}

	async deleteRecipeGenerationJob(jobId: string, data: any) {
		return this.request(`/recipes/generate/jobs/${jobId}`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async retryRecipeGenerationJob(jobId: string, data: any) {
		return this.request(`/recipes/generate/jobs/${jobId}/retry`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async failRecipeGenerationJob(jobId: string, data?: any) {
		return this.request(`/recipes/generate/jobs/${jobId}/fail`, {
			method: 'POST',
			body: JSON.stringify(data || {}),
		});
	}

	// User Management
	async getUsers() {
		return this.request('/users');
	}

	async getUser(userId: string) {
		return this.request(`/users/${userId}`);
	}

	async setAdmin(data: { userId: string; isAdmin: boolean }) {
		return this.request('/set-admin', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// System Administration
	async getStats() {
		return this.request('/stats');
	}

	async checkStatus() {
		return this.request('/check-status');
	}

	async getServicesHealth() {
		return this.request('/services/health');
	}

	async setupSystem(data: any) {
		return this.request('/setup', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Blog Management
	async getBlogPosts(params?: Record<string, string>) {
		const queryString = params ? `?${new URLSearchParams(params)}` : '';
		return this.request(`/blog/posts${queryString}`);
	}

	async getBlogPost(postId: string) {
		return this.request(`/blog/posts/${postId}`);
	}

	async createBlogPost(data: any) {
		return this.request('/blog/posts', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async updateBlogPost(postId: string, data: any) {
		return this.request(`/blog/posts/${postId}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	}

	async deleteBlogPost(postId: string) {
		return this.request(`/blog/posts/${postId}`, {
			method: 'DELETE',
		});
	}

	async generateBlogPost(data: any) {
		return this.request('/blog/generate', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async generateBlogImage(data: any) {
		return this.request('/blog/generate-image', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Content Moderation
	async getFlaggedContent(params?: Record<string, string>) {
		const queryString = params ? `?${new URLSearchParams(params)}` : '';
		return this.request(`/moderation/flagged${queryString}`);
	}

	async getModerationStats() {
		return this.request('/moderation/stats');
	}

	async updateFlaggedContent(data: any) {
		return this.request('/moderation/flagged', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Notifications
	async getNotifications() {
		return this.request('/notifications');
	}

	async sendNotification(data: any) {
		return this.request('/notifications/send', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Feedback
	async getFeedback() {
		return this.request('/feedback');
	}

	async submitFeedback(data: any) {
		return this.request('/feedback', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// Social Features
	async getSocialFeed() {
		return this.request('/social/feed');
	}

	async createSocialPost(data: any) {
		return this.request('/social/post', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async addComment(postId: string, data: any) {
		return this.request(`/social/${postId}/comment`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async addReaction(postId: string, data: any) {
		return this.request(`/social/${postId}/reaction`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}
}

// Create singleton instance for client-side usage
export const clientAdminApiClient = new ClientAdminApiClient();
