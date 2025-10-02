import { IUserDocument } from '../types/user';
import {
	UserCreateDTO,
	UserUpdateDTO,
	DietaryPreferences,
	CookingPreferences,
	NotificationPreferences,
} from '../types';

export interface IUserService {
	createUser(data: UserCreateDTO): Promise<IUserDocument>;
	getUser(clerkId: string): Promise<IUserDocument>;
	updateUser(clerkId: string, data: UserUpdateDTO): Promise<IUserDocument>;
	deleteUser(clerkId: string): Promise<boolean>;
	findByEmail(email: string): Promise<IUserDocument | null>;

	// Preferences management
	updateDietaryPreferences(
		clerkId: string,
		preferences: Partial<DietaryPreferences>
	): Promise<IUserDocument>;
	updateCookingPreferences(
		clerkId: string,
		preferences: Partial<CookingPreferences>
	): Promise<IUserDocument>;
	updateNotificationPreferences(
		clerkId: string,
		preferences: Partial<NotificationPreferences>
	): Promise<IUserDocument>;

	// User state management
	markOnboarded(clerkId: string): Promise<IUserDocument>;
	updateLastLogin(clerkId: string): Promise<IUserDocument>;
	updateLastMealPlanGenerated(clerkId: string): Promise<IUserDocument>;
	updateLastShoppingListGenerated(clerkId: string): Promise<IUserDocument>;

	// Bulk operations
	bulkUpdateNotificationPreferences(
		userIds: string[],
		preferences: Partial<NotificationPreferences>
	): Promise<number>;
	bulkDeleteInactiveUsers(daysInactive: number): Promise<number>;

	// Analytics
	getUserStats(clerkId: string): Promise<{
		totalMealPlans: number;
		totalShoppingLists: number;
		favoriteRecipes: string[];
		commonIngredients: string[];
		dietaryCompliance: number;
		lastActivity: Date;
	}>;
}
