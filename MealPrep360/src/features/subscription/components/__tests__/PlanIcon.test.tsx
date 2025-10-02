import React from 'react';
import { render } from '@testing-library/react';
import { PlanIcon } from '../PlanIcon';
import { Person, TrendingUp, Star, CheckCircle } from '@mui/icons-material';

jest.mock('@mui/icons-material', () => ({
	Person: () => 'Person-Icon',
	TrendingUp: () => 'TrendingUp-Icon',
	Star: () => 'Star-Icon',
	CheckCircle: () => 'CheckCircle-Icon',
}));

describe('PlanIcon', () => {
	it('renders FREE plan icon correctly', () => {
		const { container } = render(<PlanIcon plan='FREE' />);
		expect(container).toHaveTextContent('Person-Icon');
	});

	it('renders STARTER plan icon correctly', () => {
		const { container } = render(<PlanIcon plan='STARTER' />);
		expect(container).toHaveTextContent('TrendingUp-Icon');
	});

	it('renders PLUS plan icon correctly', () => {
		const { container } = render(<PlanIcon plan='PLUS' />);
		expect(container).toHaveTextContent('Star-Icon');
	});

	it('renders FAMILY plan icon correctly', () => {
		const { container } = render(<PlanIcon plan='FAMILY' />);
		expect(container).toHaveTextContent('CheckCircle-Icon');
	});

	it('renders default icon for unknown plan', () => {
		// @ts-expect-error Testing invalid plan
		const { container } = render(<PlanIcon plan='UNKNOWN' />);
		expect(container).toHaveTextContent('Person-Icon');
	});
});
