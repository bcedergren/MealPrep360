import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubscriptionChangeModal } from '../SubscriptionChangeModal';
import { useSubscription } from '../../hooks/useSubscription';
import { useSnackbar } from '@/app/components/ui/snackbar';

// Mock the hooks
jest.mock('../../hooks/useSubscription', () => ({
	useSubscription: jest.fn(),
}));

jest.mock('@/app/components/ui/snackbar', () => ({
	useSnackbar: jest.fn(),
}));

// Mock child components
jest.mock('../BillingToggle', () => ({
	BillingToggle: ({ onChange }: any) => (
		<button onClick={() => onChange({ target: { checked: true } })}>
			Toggle Billing
		</button>
	),
}));

jest.mock('../PlanCard', () => ({
	PlanCard: ({ plan, onPlanChange }: any) => (
		<button onClick={() => onPlanChange(plan)}>Select {plan}</button>
	),
}));

describe('SubscriptionChangeModal', () => {
	const mockUpgradePlan = jest.fn();
	const mockShowSnackbar = jest.fn();
	const mockOnClose = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useSubscription as jest.Mock).mockReturnValue({
			upgradePlan: mockUpgradePlan,
		});
		(useSnackbar as jest.Mock).mockReturnValue({
			showSnackbar: mockShowSnackbar,
		});
	});

	const defaultProps = {
		open: true,
		onClose: mockOnClose,
		currentPlan: 'STARTER' as const,
	};

	it('renders all plan options', () => {
		render(<SubscriptionChangeModal {...defaultProps} />);

		expect(screen.getByText('Select FREE')).toBeInTheDocument();
		expect(screen.getByText('Select STARTER')).toBeInTheDocument();
		expect(screen.getByText('Select PLUS')).toBeInTheDocument();
		expect(screen.getByText('Select FAMILY')).toBeInTheDocument();
	});

	it('handles billing interval change', () => {
		render(<SubscriptionChangeModal {...defaultProps} />);

		fireEvent.click(screen.getByText('Toggle Billing'));

		// Try to upgrade plan and verify yearly billing is used
		fireEvent.click(screen.getByText('Select PLUS'));
		expect(mockUpgradePlan).toHaveBeenCalledWith('PLUS', 'yearly');
	});

	it('handles successful plan change', async () => {
		mockUpgradePlan.mockResolvedValueOnce({});

		render(<SubscriptionChangeModal {...defaultProps} />);

		fireEvent.click(screen.getByText('Select PLUS'));

		await waitFor(() => {
			expect(mockShowSnackbar).toHaveBeenCalledWith(
				'Successfully changed subscription plan',
				'success'
			);
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	it('handles plan change error', async () => {
		const error = new Error('Upgrade failed');
		mockUpgradePlan.mockRejectedValueOnce(error);

		render(<SubscriptionChangeModal {...defaultProps} />);

		fireEvent.click(screen.getByText('Select PLUS'));

		await waitFor(() => {
			expect(mockShowSnackbar).toHaveBeenCalledWith('Upgrade failed', 'error');
		});
	});

	it('closes modal when close button clicked', () => {
		render(<SubscriptionChangeModal {...defaultProps} />);

		fireEvent.click(screen.getByText('Close'));
		expect(mockOnClose).toHaveBeenCalled();
	});
});
