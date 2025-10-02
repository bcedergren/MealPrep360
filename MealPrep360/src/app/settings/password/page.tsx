'use client';

import { useState } from 'react';
import { useSnackbar } from '../../components/ui/snackbar';
import {
	Container,
	Typography,
	TextField,
	Button,
	Box,
	Alert,
} from '@mui/material';

interface PasswordForm {
	currentPassword: string;
	newPassword: string;
	confirmNewPassword: string;
}

export default function PasswordPage() {
	const { showSnackbar } = useSnackbar();
	const [formData, setFormData] = useState<PasswordForm>({
		currentPassword: '',
		newPassword: '',
		confirmNewPassword: '',
	});
	const [error, setError] = useState<string>('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		if (formData.newPassword !== formData.confirmNewPassword) {
			setError('New passwords do not match');
			setIsLoading(false);
			return;
		}

		if (formData.newPassword.length < 8) {
			setError('New password must be at least 8 characters long');
			setIsLoading(false);
			return;
		}

		try {
			const response = await fetch('/api/user/password', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					currentPassword: formData.currentPassword,
					newPassword: formData.newPassword,
				}),
			});

			if (response.ok) {
				showSnackbar('Password updated successfully', 'success');
				setFormData({
					currentPassword: '',
					newPassword: '',
					confirmNewPassword: '',
				});
			} else {
				const err = await response.json();
				setError(err.message || 'Failed to update password');
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to update password'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	return (
		<Container maxWidth='sm'>
			<Typography
				variant='h4'
				gutterBottom
			>
				Change Password
			</Typography>

			{error && (
				<Alert
					severity='error'
					sx={{ mb: 2 }}
				>
					{error}
				</Alert>
			)}

			<Box
				component='form'
				onSubmit={handleSubmit}
			>
				<TextField
					fullWidth
					label='Current Password'
					type='password'
					name='currentPassword'
					value={formData.currentPassword}
					onChange={handleChange}
					required
					margin='normal'
				/>

				<TextField
					fullWidth
					label='New Password'
					type='password'
					name='newPassword'
					value={formData.newPassword}
					onChange={handleChange}
					required
					margin='normal'
				/>

				<TextField
					fullWidth
					label='Confirm New Password'
					type='password'
					name='confirmNewPassword'
					value={formData.confirmNewPassword}
					onChange={handleChange}
					required
					margin='normal'
				/>

				<Button
					type='submit'
					variant='contained'
					color='primary'
					fullWidth
					disabled={isLoading}
					sx={{ mt: 2 }}
				>
					{isLoading ? 'Updating...' : 'Update Password'}
				</Button>
			</Box>
		</Container>
	);
}
