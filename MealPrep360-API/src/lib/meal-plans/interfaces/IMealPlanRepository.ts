import { IDataStore } from '../../core/data/IDataStore';
import { IMealPlanDocument } from '../types/meal-plan';
import {
	MealPlanCreateDTO,
	MealPlanUpdateDTO,
	MealPlanFilterDTO,
} from '../types';

export interface IMealPlanRepository
	extends IDataStore<IMealPlanDocument, MealPlanCreateDTO, MealPlanUpdateDTO> {
	findActiveByUserId(userId: string): Promise<IMealPlanDocument | null>;
	findByDateRange(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]>;
	skipDay(
		planId: string,
		date: Date,
		notes?: string
	): Promise<IMealPlanDocument | null>;
	unskipDay(planId: string, date: Date): Promise<IMealPlanDocument | null>;
	updateDayMeals(
		planId: string,
		date: Date,
		meals: IMealPlanDocument['days'][0]['meals']
	): Promise<IMealPlanDocument | null>;
	findOverlappingPlans(
		userId: string,
		startDate: Date,
		endDate: Date
	): Promise<IMealPlanDocument[]>;
}
