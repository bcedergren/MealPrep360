'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
	Container,
	Box,
	Paper,
	Typography,
	TextField,
	Button,
	Alert,
} from '@mui/material';

export default function ResetPassword() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to send reset email');
			}

			setSuccess(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to send reset email'
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Container maxWidth='sm'>
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					py: 8,
				}}
			>
				<Paper
					elevation={3}
					sx={{
						p: 4,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<Typography
						variant='h4'
						component='h1'
						gutterBottom
					>
						Reset Password
					</Typography>

					{error && (
						<Alert
							severity='error'
							sx={{ width: '100%', mb: 2 }}
						>
							{error}
						</Alert>
					)}

					{success ? (
						<Box sx={{ textAlign: 'center' }}>
							<Alert
								severity='success'
								sx={{ width: '100%', mb: 2 }}
							>
								Password reset email sent! Please check your inbox.
							</Alert>
							<Button
								component={Link}
								href='/auth/signin'
								variant='contained'
							>
								Back to Sign In
							</Button>
						</Box>
					) : (
						<Box
							component='form'
							onSubmit={handleSubmit}
							sx={{
								width: '100%',
								mt: 3,
							}}
						>
							<Typography
								variant='body1'
								sx={{ mb: 2 }}
							>
								Enter your email address and we&apos;ll send you a link to reset
								your password.
							</Typography>

							<TextField
								required
								fullWidth
								label='Email'
								type='email'
								autoComplete='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								margin='normal'
							/>

							<Button
								type='submit'
								fullWidth
								variant='contained'
								disabled={loading}
								sx={{ mt: 3 }}
							>
								{loading ? 'Sending...' : 'Send Reset Link'}
							</Button>

							<Box
								sx={{
									mt: 2,
									textAlign: 'center',
								}}
							>
								<Typography variant='body2'>
									Remember your password?{' '}
									<Link
										href='/auth/signin'
										style={{ textDecoration: 'none' }}
									>
										Sign in
									</Link>
								</Typography>
							</Box>
						</Box>
					)}
				</Paper>
			</Box>
		</Container>
	);
}
