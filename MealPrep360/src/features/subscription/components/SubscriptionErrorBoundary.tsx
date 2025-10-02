'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	onRetry?: () => void;
}

export class SubscriptionErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('Subscription component error:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						p: 4,
						textAlign: 'center',
					}}
				>
					<ErrorOutline
						color='error'
						sx={{ fontSize: 48, mb: 2 }}
					/>
					<Typography
						variant='h6'
						gutterBottom
					>
						Something went wrong loading the subscription information
					</Typography>
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{ mb: 2 }}
					>
						{this.state.error?.message || 'An unexpected error occurred'}
					</Typography>
					{this.props.onRetry && (
						<Button
							variant='contained'
							color='primary'
							onClick={() => {
								this.setState({ hasError: false, error: null });
								this.props.onRetry?.();
							}}
						>
							Try Again
						</Button>
					)}
				</Box>
			);
		}

		return this.props.children;
	}
}
