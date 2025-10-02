import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanCard } from '../PlanCard';
import { PLAN_PRICES } from '@/types/subscription';

// Mock the subscription types and components
jest.mock('@/types/subscription', () => ({
	PLAN_HIERARCHY: {
		FREE: 0,
		STARTER: 1,
		PLUS: 2,
		FAMILY: 3,
	},
	PLAN_PRICES: {
		STARTER: {
			monthly: 9.99,
			yearly: 99.99,
		},
		PLUS: {
			monthly: 19.99,
			yearly: 199.99,
		},
		FAMILY: {
			monthly: 29.99,
			yearly: 299.99,
		},
	},
}));

jest.mock('../PlanIcon', () => ({
	PlanIcon: () => <div data-testid='plan-icon' />,
}));

jest.mock('../PlanFeatures', () => ({
	PlanFeatures: () => <div data-testid='plan-features' />,
}));

describe('PlanCard', () => {
	const defaultProps = {
		plan: 'PLUS' as const,
		currentPlan: 'STARTER' as const,
		billingInterval: 'monthly' as const,
		availablePlans: ['FREE', 'STARTER', 'PLUS', 'FAMILY'] as const,
		processingPlan: null,
		onPlanChange: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders plan details correctly', () => {
		render(<PlanCard {...defaultProps} />);

		expect(screen.getByText('PLUS')).toBeInTheDocument();
		expect(
			screen.getByText(`$${PLAN_PRICES.PLUS.monthly}`)
		).toBeInTheDocument();
		expect(screen.getByTestId('plan-icon')).toBeInTheDocument();
		expect(screen.getByTestId('plan-features')).toBeInTheDocument();
	});

	it('shows current plan chip when applicable', () => {
		render(
			<PlanCard
				{...defaultProps}
				plan='STARTER'
				currentPlan='STARTER'
			/>
		);
		expect(screen.getByText('Current Plan')).toBeInTheDocument();
	});

	it('shows correct button text for upgrade', () => {
		render(<PlanCard {...defaultProps} />);
		expect(screen.getByText('Upgrade')).toBeInTheDocument();
	});

	it('shows correct button text for downgrade', () => {
		render(
			<PlanCard
				{...defaultProps}
				plan='FREE'
			/>
		);
		expect(screen.getByText('Downgrade')).toBeInTheDocument();
	});

	it('disables button when processing', () => {
		render(
			<PlanCard
				{...defaultProps}
				processingPlan='PLUS'
			/>
		);
		const button = screen.getByRole('button');
		expect(button).toBeDisabled();
	});

	it('calls onPlanChange when clicked', () => {
		render(<PlanCard {...defaultProps} />);
		const button = screen.getByRole('button');
		fireEvent.click(button);
		expect(defaultProps.onPlanChange).toHaveBeenCalledWith('PLUS');
	});

	it('shows yearly price when billing interval is yearly', () => {
		render(
			<PlanCard
				{...defaultProps}
				billingInterval='yearly'
			/>
		);
		expect(screen.getByText(`$${PLAN_PRICES.PLUS.yearly}`)).toBeInTheDocument();
		expect(screen.getByText(/\/year/)).toBeInTheDocument();
	});

	it('shows monthly equivalent for yearly billing', () => {
		render(
			<PlanCard
				{...defaultProps}
				billingInterval='yearly'
			/>
		);
		const monthlyPrice = (PLAN_PRICES.PLUS.yearly / 12).toFixed(2);
		expect(screen.getByText(new RegExp(monthlyPrice))).toBeInTheDocument();
	});
});
