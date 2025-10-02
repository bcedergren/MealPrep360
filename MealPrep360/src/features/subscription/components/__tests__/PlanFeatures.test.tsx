import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlanFeatures } from '../PlanFeatures';
import { PLAN_FEATURES } from '@/types/subscription';

// Mock the subscription types
jest.mock('@/types/subscription', () => ({
	PLAN_FEATURES: {
		FREE: {
			Recipes: 10,
			'Shopping Lists': true,
			'Recipe Images': 'Browse Only',
		},
		STARTER: {
			Recipes: 50,
			'Shopping Lists': true,
			'Recipe Images': true,
			'Recommended Recipes': 'Unlimited',
		},
		PLUS: {
			Recipes: 'Unlimited',
			'Shopping Lists': true,
			'Recipe Images': true,
			'Recommended Recipes': 'Unlimited',
			'AI Blog Generation': true,
		},
		FAMILY: {
			Recipes: 'Unlimited',
			'Shopping Lists': true,
			'Recipe Images': true,
			'Recommended Recipes': 'Unlimited',
			'AI Blog Generation': true,
			'Family Sharing': true,
		},
	},
}));

describe('PlanFeatures', () => {
	const availablePlans = ['FREE', 'STARTER', 'PLUS', 'FAMILY'] as const;

	it('renders FREE plan features correctly', () => {
		render(
			<PlanFeatures
				plan='FREE'
				availablePlans={availablePlans}
			/>
		);

		expect(screen.getByText('10 Recipes')).toBeInTheDocument();
		expect(screen.getByText('Shopping Lists')).toBeInTheDocument();
	});

	it('shows shared features for non-FREE plans', () => {
		render(
			<PlanFeatures
				plan='PLUS'
				availablePlans={availablePlans}
			/>
		);

		expect(
			screen.getByText(/Includes all STARTER features/)
		).toBeInTheDocument();
	});

	it('shows different features for upgraded plans', () => {
		render(
			<PlanFeatures
				plan='FAMILY'
				availablePlans={availablePlans}
			/>
		);

		expect(screen.getByText('Family Sharing')).toBeInTheDocument();
	});

	it('filters out invalid features', () => {
		render(
			<PlanFeatures
				plan='STARTER'
				availablePlans={availablePlans}
			/>
		);

		// Recipe Images should be filtered out
		expect(screen.queryByText('Recipe Images')).not.toBeInTheDocument();
	});
});
