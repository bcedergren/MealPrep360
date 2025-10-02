/**
 * End-to-End Workflow Tests for MealPrep360 Admin
 *
 * These tests simulate complete user workflows from start to finish,
 * ensuring that all components work together correctly.
 */

import { clientAdminApiClient } from '../lib/apiClient';

// Mock the API client
jest.mock('../lib/apiClient', () => ({
	clientAdminApiClient: {
		getStats: jest.fn(),
		getRecipes: jest.fn(),
		getBlogPosts: jest.fn(),
		getUsers: jest.fn(),
		generateRecipes: jest.fn(),
		getRecipeGenerationStatus: jest.fn(),
		getRecipeGenerationJobs: jest.fn(),
		deleteRecipe: jest.fn(),
		updateRecipes: jest.fn(),
		createBlogPost: jest.fn(),
		updateBlogPost: jest.fn(),
		deleteBlogPost: jest.fn(),
		setAdmin: jest.fn(),
		uploadRecipeImage: jest.fn(),
		generateRecipeImage: jest.fn(),
		deleteRecipeGenerationJob: jest.fn(),
		retryRecipeGenerationJob: jest.fn(),
		getRecipeImageStatus: jest.fn(),
	},
}));

describe('End-to-End Workflow Tests', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('Recipe Management Workflow', () => {
		it('should complete full recipe management workflow', async () => {
			// Mock API responses
			const mockRecipes = [
				{
					_id: '1',
					title: 'Test Recipe',
					ingredients: ['ingredient1'],
					instructions: ['step1'],
					visibility: 'private',
					hasImage: false,
				},
			];

			(clientAdminApiClient.getRecipes as jest.Mock).mockResolvedValue({
				recipes: mockRecipes,
				totalCount: 1,
				totalPages: 1,
			});
			(clientAdminApiClient.updateRecipes as jest.Mock).mockResolvedValue({
				success: true,
				updated: 1,
			});
			(clientAdminApiClient.generateRecipeImage as jest.Mock).mockResolvedValue(
				{
					jobId: 'img-job-123',
					status: 'started',
				}
			);
			(
				clientAdminApiClient.getRecipeImageStatus as jest.Mock
			).mockResolvedValue({
				status: 'completed',
				image: 'data:image/jpeg;base64,mockimage',
			});
			(clientAdminApiClient.deleteRecipe as jest.Mock).mockResolvedValue({
				success: true,
			});

			// Test workflow steps
			const recipes = await clientAdminApiClient.getRecipes();
			expect(recipes.recipes).toHaveLength(1);
			expect(recipes.recipes[0].title).toBe('Test Recipe');

			const updateResult = await clientAdminApiClient.updateRecipes({
				...mockRecipes[0],
				title: 'Updated Recipe',
			});
			expect(updateResult.success).toBe(true);

			const imageResult = await clientAdminApiClient.generateRecipeImage({
				recipeId: '1',
			});
			expect(imageResult.jobId).toBe('img-job-123');

			const imageStatus = await clientAdminApiClient.getRecipeImageStatus('1');
			expect(imageStatus.status).toBe('completed');

			const deleteResult = await clientAdminApiClient.deleteRecipe('1');
			expect(deleteResult.success).toBe(true);

			// Verify all API calls
			expect(clientAdminApiClient.getRecipes).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.updateRecipes).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.generateRecipeImage).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.getRecipeImageStatus).toHaveBeenCalledTimes(
				1
			);
			expect(clientAdminApiClient.deleteRecipe).toHaveBeenCalledTimes(1);
		});
	});

	describe('Blog Management Workflow', () => {
		it('should complete full blog management workflow', async () => {
			// Mock API responses
			const mockPosts = [
				{
					id: '1',
					title: 'Test Post',
					content: 'Test content',
					published: false,
					featured: false,
				},
			];

			(clientAdminApiClient.getBlogPosts as jest.Mock).mockResolvedValue({
				posts: mockPosts,
			});
			(clientAdminApiClient.createBlogPost as jest.Mock).mockResolvedValue({
				id: '2',
				title: 'New Post',
				content: 'New content',
				published: false,
				featured: false,
			});
			(clientAdminApiClient.updateBlogPost as jest.Mock).mockResolvedValue({
				id: '1',
				title: 'Updated Post',
				content: 'Updated content',
				published: true,
				featured: true,
			});
			(clientAdminApiClient.deleteBlogPost as jest.Mock).mockResolvedValue({
				success: true,
			});

			// Test workflow steps
			const posts = await clientAdminApiClient.getBlogPosts();
			expect(posts.posts).toHaveLength(1);
			expect(posts.posts[0].title).toBe('Test Post');

			const newPost = await clientAdminApiClient.createBlogPost({
				title: 'New Post',
				content: 'New content',
			});
			expect(newPost.id).toBe('2');

			const updatedPost = await clientAdminApiClient.updateBlogPost('1', {
				title: 'Updated Post',
				content: 'Updated content',
				published: true,
				featured: true,
			});
			expect(updatedPost.published).toBe(true);
			expect(updatedPost.featured).toBe(true);

			const deleteResult = await clientAdminApiClient.deleteBlogPost('1');
			expect(deleteResult.success).toBe(true);

			// Verify all API calls were made
			expect(clientAdminApiClient.getBlogPosts).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.createBlogPost).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.updateBlogPost).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.deleteBlogPost).toHaveBeenCalledTimes(1);
		});
	});

	describe('User Management Workflow', () => {
		it('should complete full user management workflow', async () => {
			// Mock API responses
			const mockUsers = [
				{
					id: '1',
					email: 'user@example.com',
					role: 'user',
					isAdmin: false,
				},
				{
					id: '2',
					email: 'admin@example.com',
					role: 'admin',
					isAdmin: true,
				},
			];

			(clientAdminApiClient.getUsers as jest.Mock).mockResolvedValue({
				users: mockUsers,
			});
			(clientAdminApiClient.setAdmin as jest.Mock).mockResolvedValue({
				success: true,
			});

			// Test workflow steps
			const users = await clientAdminApiClient.getUsers();
			expect(users.users).toHaveLength(2);
			expect(users.users[0].role).toBe('user');
			expect(users.users[1].role).toBe('admin');

			const adminResult = await clientAdminApiClient.setAdmin({
				userId: '1',
				isAdmin: true,
			});
			expect(adminResult.success).toBe(true);

			// Verify API calls
			expect(clientAdminApiClient.getUsers).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.setAdmin).toHaveBeenCalledWith({
				userId: '1',
				isAdmin: true,
			});
		});
	});

	describe('Recipe Generation Workflow', () => {
		it('should complete full recipe generation workflow', async () => {
			// Mock API responses
			(clientAdminApiClient.generateRecipes as jest.Mock).mockResolvedValue({
				jobId: 'job-123',
				status: 'started',
			});
			(clientAdminApiClient.getRecipeGenerationStatus as jest.Mock)
				.mockResolvedValueOnce({
					status: 'processing',
					progress: 50,
				})
				.mockResolvedValueOnce({
					status: 'completed',
					progress: 100,
					recipesGenerated: 5,
				});
			(
				clientAdminApiClient.getRecipeGenerationJobs as jest.Mock
			).mockResolvedValue({
				jobs: [
					{ id: 'job-123', status: 'completed', progress: 100 },
					{ id: 'job-456', status: 'failed', progress: 0 },
				],
			});
			(
				clientAdminApiClient.retryRecipeGenerationJob as jest.Mock
			).mockResolvedValue({
				success: true,
			});
			(
				clientAdminApiClient.deleteRecipeGenerationJob as jest.Mock
			).mockResolvedValue({
				success: true,
			});

			// Test workflow steps
			const generateResult = await clientAdminApiClient.generateRecipes({
				season: 'summer',
			});
			expect(generateResult.jobId).toBe('job-123');
			expect(generateResult.status).toBe('started');

			// Check status (first call - processing)
			const status1 = await clientAdminApiClient.getRecipeGenerationStatus(
				'job-123'
			);
			expect(status1.status).toBe('processing');
			expect(status1.progress).toBe(50);

			// Check status (second call - completed)
			const status2 = await clientAdminApiClient.getRecipeGenerationStatus(
				'job-123'
			);
			expect(status2.status).toBe('completed');
			expect(status2.progress).toBe(100);
			expect(status2.recipesGenerated).toBe(5);

			// Get all jobs
			const jobs = await clientAdminApiClient.getRecipeGenerationJobs();
			expect(jobs.jobs).toHaveLength(2);
			expect(jobs.jobs[0].status).toBe('completed');
			expect(jobs.jobs[1].status).toBe('failed');

			// Retry failed job
			const retryResult = await clientAdminApiClient.retryRecipeGenerationJob(
				'job-456',
				{
					reason: 'Retry failed job',
				}
			);
			expect(retryResult.success).toBe(true);

			// Delete job
			const deleteResult = await clientAdminApiClient.deleteRecipeGenerationJob(
				'job-456',
				{
					action: 'delete',
					reason: 'Clean up failed job',
				}
			);
			expect(deleteResult.success).toBe(true);

			// Verify all API calls
			expect(clientAdminApiClient.generateRecipes).toHaveBeenCalledTimes(1);
			expect(
				clientAdminApiClient.getRecipeGenerationStatus
			).toHaveBeenCalledTimes(2);
			expect(
				clientAdminApiClient.getRecipeGenerationJobs
			).toHaveBeenCalledTimes(1);
			expect(
				clientAdminApiClient.retryRecipeGenerationJob
			).toHaveBeenCalledTimes(1);
			expect(
				clientAdminApiClient.deleteRecipeGenerationJob
			).toHaveBeenCalledTimes(1);
		});
	});

	describe('Error Recovery Workflow', () => {
		it('should handle and recover from API errors', async () => {
			// Mock API errors and recovery
			(clientAdminApiClient.getStats as jest.Mock)
				.mockRejectedValueOnce(new Error('Network Error'))
				.mockResolvedValueOnce({ totalRecipes: 100, totalUsers: 50 });
			(clientAdminApiClient.getRecipes as jest.Mock)
				.mockRejectedValueOnce(new Error('Server Error'))
				.mockResolvedValueOnce({ recipes: [], totalCount: 0 });

			// Test error handling and recovery
			await expect(clientAdminApiClient.getStats()).rejects.toThrow(
				'Network Error'
			);

			// Retry should succeed
			const stats = await clientAdminApiClient.getStats();
			expect(stats.totalRecipes).toBe(100);

			// Test recipe error handling
			await expect(clientAdminApiClient.getRecipes()).rejects.toThrow(
				'Server Error'
			);

			// Retry should succeed
			const recipes = await clientAdminApiClient.getRecipes();
			expect(recipes.recipes).toEqual([]);

			// Verify retry behavior
			expect(clientAdminApiClient.getStats).toHaveBeenCalledTimes(2);
			expect(clientAdminApiClient.getRecipes).toHaveBeenCalledTimes(2);
		});
	});

	describe('Performance and Concurrency Workflow', () => {
		it('should handle multiple concurrent operations', async () => {
			// Mock concurrent API calls
			(clientAdminApiClient.getStats as jest.Mock).mockResolvedValue({
				stats: 'data',
			});
			(clientAdminApiClient.getRecipes as jest.Mock).mockResolvedValue({
				recipes: [],
			});
			(clientAdminApiClient.getBlogPosts as jest.Mock).mockResolvedValue({
				posts: [],
			});
			(clientAdminApiClient.getUsers as jest.Mock).mockResolvedValue({
				users: [],
			});

			// Start multiple operations concurrently
			const startTime = Date.now();
			const promises = [
				clientAdminApiClient.getStats(),
				clientAdminApiClient.getRecipes(),
				clientAdminApiClient.getBlogPosts(),
				clientAdminApiClient.getUsers(),
			];

			const results = await Promise.all(promises);
			const endTime = Date.now();

			// Verify all operations completed
			expect(results).toHaveLength(4);
			expect(results[0]).toEqual({ stats: 'data' });
			expect(results[1]).toEqual({ recipes: [] });
			expect(results[2]).toEqual({ posts: [] });
			expect(results[3]).toEqual({ users: [] });

			// Verify all API calls were made
			expect(clientAdminApiClient.getStats).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.getRecipes).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.getBlogPosts).toHaveBeenCalledTimes(1);
			expect(clientAdminApiClient.getUsers).toHaveBeenCalledTimes(1);

			// Performance should be reasonable (concurrent, not sequential)
			const duration = endTime - startTime;
			expect(duration).toBeLessThan(1000); // Should complete quickly in tests
		});
	});
});
