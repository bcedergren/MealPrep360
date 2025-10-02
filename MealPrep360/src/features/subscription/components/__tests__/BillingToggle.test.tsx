import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { BillingToggle } from '../BillingToggle';

describe('BillingToggle', () => {
	const mockOnChange = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders correctly with monthly billing', () => {
		render(
			<BillingToggle
				billingInterval='monthly'
				onChange={mockOnChange}
			/>
		);

		const toggle = screen.getByRole('checkbox');
		expect(toggle).not.toBeChecked();
	});

	it('renders correctly with yearly billing', () => {
		render(
			<BillingToggle
				billingInterval='yearly'
				onChange={mockOnChange}
			/>
		);

		const toggle = screen.getByRole('checkbox');
		expect(toggle).toBeChecked();
	});

	it('shows annual discount chip', () => {
		render(
			<BillingToggle
				billingInterval='monthly'
				onChange={mockOnChange}
			/>
		);

		expect(screen.getByText(/Save \d+%/)).toBeInTheDocument();
	});

	it('calls onChange when toggled', () => {
		render(
			<BillingToggle
				billingInterval='monthly'
				onChange={mockOnChange}
			/>
		);

		const toggle = screen.getByRole('checkbox');
		fireEvent.click(toggle);

		expect(mockOnChange).toHaveBeenCalledTimes(1);
	});
});
