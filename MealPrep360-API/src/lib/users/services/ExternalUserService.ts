import { BaseExternalService } from '../../core/services/BaseExternalService';
import { AxiosResponse } from 'axios';
import { IUserService } from '../interfaces/IUserService';
import { IUserDocument } from '../types/user';
import {
	UserCreateDTO,
	UserUpdateDTO,
	DietaryPreferences,
	CookingPreferences,
	NotificationPreferences,
} from '../types';
import { NotFoundError } from '../../core/errors/ServiceError';

export class ExternalUserService
	extends BaseExternalService
	implements IUserService
{
	constructor() {
		super('user');
	}

	async createUser(data: UserCreateDTO): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.post('/users', data);
		return response.data;
	}

	async getUser(clerkId: string): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.get(`/users/${clerkId}`);
		if (!response.data) {
			throw new NotFoundError(`User ${clerkId} not found`);
		}
		return response.data;
	}

	async updateUser(
		clerkId: string,
		data: UserUpdateDTO
	): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.put(`/users/${clerkId}`, data);
		return response.data;
	}

	async deleteUser(clerkId: string): Promise<boolean> {
		await this.resilientClient.delete(`/users/${clerkId}`);
		return true;
	}

	async findByEmail(email: string): Promise<IUserDocument | null> {
		const response: AxiosResponse<IUserDocument | null> =
			await this.resilientClient.get(
				`/users/email/${encodeURIComponent(email)}`
			);
		return response.data;
	}

	async updateDietaryPreferences(
		clerkId: string,
		preferences: Partial<DietaryPreferences>
	): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.put(
				`/users/${clerkId}/preferences/dietary`,
				preferences
			);
		return response.data;
	}

	async updateCookingPreferences(
		clerkId: string,
		preferences: Partial<CookingPreferences>
	): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.put(
				`/users/${clerkId}/preferences/cooking`,
				preferences
			);
		return response.data;
	}

	async updateNotificationPreferences(
		clerkId: string,
		preferences: Partial<NotificationPreferences>
	): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.put(
				`/users/${clerkId}/preferences/notifications`,
				preferences
			);
		return response.data;
	}

	async markOnboarded(clerkId: string): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.post(`/users/${clerkId}/onboarded`);
		return response.data;
	}

	async updateLastLogin(clerkId: string): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.post(`/users/${clerkId}/login`);
		return response.data;
	}

	async updateLastMealPlanGenerated(clerkId: string): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.post(`/users/${clerkId}/meal-plan-generated`);
		return response.data;
	}

	async updateLastShoppingListGenerated(
		clerkId: string
	): Promise<IUserDocument> {
		const response: AxiosResponse<IUserDocument> =
			await this.resilientClient.post(
				`/users/${clerkId}/shopping-list-generated`
			);
		return response.data;
	}

	async bulkUpdateNotificationPreferences(
		userIds: string[],
		preferences: Partial<NotificationPreferences>
	): Promise<number> {
		const response: AxiosResponse<{ modifiedCount: number }> =
			await this.resilientClient.put('/users/bulk/preferences/notifications', {
				userIds,
				preferences,
			});
		return response.data.modifiedCount;
	}

	async bulkDeleteInactiveUsers(daysInactive: number): Promise<number> {
		const response: AxiosResponse<{ deletedCount: number }> =
			await this.resilientClient.delete(`/users/bulk/inactive/${daysInactive}`);
		return response.data.deletedCount;
	}

	async getUserStats(clerkId: string): Promise<{
		totalMealPlans: number;
		totalShoppingLists: number;
		favoriteRecipes: string[];
		commonIngredients: string[];
		dietaryCompliance: number;
		lastActivity: Date;
	}> {
		const response: AxiosResponse<{
			totalMealPlans: number;
			totalShoppingLists: number;
			favoriteRecipes: string[];
			commonIngredients: string[];
			dietaryCompliance: number;
			lastActivity: Date;
		}> = await this.resilientClient.get(`/users/${clerkId}/stats`);
		return response.data;
	}
}
