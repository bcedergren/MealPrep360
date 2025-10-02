import { Document } from 'mongoose';
import {
	DietaryPreferences,
	CookingPreferences,
	NotificationPreferences,
} from './index';

export interface IUserDocument extends Document {
	clerkId: string;
	email: string;
	name?: string;
	dietaryPreferences: DietaryPreferences;
	cookingPreferences: CookingPreferences;
	notificationPreferences: NotificationPreferences;
	timezone: string;
	isOnboarded: boolean;
	lastLoginAt: Date;
	lastMealPlanGeneratedAt?: Date;
	lastShoppingListGeneratedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}
