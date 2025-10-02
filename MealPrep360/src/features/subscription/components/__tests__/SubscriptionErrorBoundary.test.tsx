import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SubscriptionErrorBoundary } from '../SubscriptionErrorBoundary';

describe('SubscriptionErrorBoundary', () => {
	const originalConsoleError = console.error;
	beforeAll(() => {
		// Suppress console.error for expected error cases
		console.error = jest.fn();
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	beforeEach(() => {
		(console.error as jest.Mock).mockClear();
	});

	it('renders children when there is no error', () => {
		render(
			<SubscriptionErrorBoundary>
				<div>Test Content</div>
			</SubscriptionErrorBoundary>
		);

		expect(screen.getByText('Test Content')).toBeInTheDocument();
	});

	it('renders error UI when an error occurs', () => {
		const ThrowError = () => {
			throw new Error('Test error');
		};

		render(
			<SubscriptionErrorBoundary>
				<ThrowError />
			</SubscriptionErrorBoundary>
		);

		expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
		expect(screen.getByText('Test error')).toBeInTheDocument();
	});

	it('shows retry button when onRetry prop is provided', () => {
		const onRetry = jest.fn();
		const ThrowError = () => {
			throw new Error('Test error');
		};

		render(
			<SubscriptionErrorBoundary onRetry={onRetry}>
				<ThrowError />
			</SubscriptionErrorBoundary>
		);

		const retryButton = screen.getByText('Try Again');
		expect(retryButton).toBeInTheDocument();

		fireEvent.click(retryButton);
		expect(onRetry).toHaveBeenCalled();
	});

	it('does not show retry button when onRetry prop is not provided', () => {
		const ThrowError = () => {
			throw new Error('Test error');
		};

		render(
			<SubscriptionErrorBoundary>
				<ThrowError />
			</SubscriptionErrorBoundary>
		);

		expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
	});

	it('shows default error message when error has no message', () => {
		const ThrowError = () => {
			throw new Error();
		};

		render(
			<SubscriptionErrorBoundary>
				<ThrowError />
			</SubscriptionErrorBoundary>
		);

		expect(
			screen.getByText('An unexpected error occurred')
		).toBeInTheDocument();
	});

	it('logs error details to console', () => {
		const error = new Error('Test error');
		const ThrowError = () => {
			throw error;
		};

		render(
			<SubscriptionErrorBoundary>
				<ThrowError />
			</SubscriptionErrorBoundary>
		);

		expect(console.error).toHaveBeenCalledWith(
			'Subscription component error:',
			error,
			expect.any(Object)
		);
	});
});
