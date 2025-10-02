'use client';

import { useState } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	Box,
	Typography,
	Rating,
	Alert,
} from '@mui/material';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'react-hot-toast';

interface FeedbackDialogProps {
	open: boolean;
	onClose: () => void;
}

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
	const { userId } = useAuth();
	const [rating, setRating] = useState<number | null>(null);
	const [feedback, setFeedback] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async () => {
		if (!rating) {
			setError('Please provide a rating');
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch('/api/feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					rating,
					feedback,
					userId,
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to submit feedback');
			}

			toast.success('Thank you for your feedback!');
			onClose();
			setRating(null);
			setFeedback('');
		} catch (err) {
			setError('Failed to submit feedback. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth='sm'
			fullWidth
		>
			<DialogTitle>Send Feedback</DialogTitle>
			<DialogContent>
				<Box sx={{ mt: 2 }}>
					<Typography
						component='legend'
						gutterBottom
					>
						How would you rate your experience?
					</Typography>
					<Rating
						value={rating}
						onChange={(_, newValue) => {
							setRating(newValue);
							setError(null);
						}}
						size='large'
					/>
				</Box>
				<TextField
					fullWidth
					multiline
					rows={4}
					label='Your feedback'
					value={feedback}
					onChange={(e) => setFeedback(e.target.value)}
					sx={{ mt: 2 }}
				/>
				{error && (
					<Alert
						severity='error'
						sx={{ mt: 2 }}
					>
						{error}
					</Alert>
				)}
			</DialogContent>
			<DialogActions>
				<Button
					onClick={onClose}
					disabled={isSubmitting}
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					variant='contained'
					disabled={isSubmitting}
				>
					Submit
				</Button>
			</DialogActions>
		</Dialog>
	);
}
