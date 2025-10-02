'use client';

import { Box, Container, Typography, Link } from '@mui/material';

export function AdminFooter() {
	return (
		<Box
			component='footer'
			sx={{
				py: 3,
				px: 2,
				mt: 'auto',
				backgroundColor: (theme) =>
					theme.palette.mode === 'light'
						? theme.palette.grey[200]
						: theme.palette.grey[800],
			}}
		>
			<Container maxWidth='lg'>
				<Typography
					variant='body2'
					color='text.secondary'
					align='center'
				>
					{'© '}
					{new Date().getFullYear()}{' '}
					<Link
						color='inherit'
						href='https://mealprep360.com'
					>
						MealPrep360
					</Link>
					{' - Admin Dashboard v1.0.0'}
				</Typography>
			</Container>
		</Box>
	);
}
