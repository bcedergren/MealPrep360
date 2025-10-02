'use client';

import { Box } from '@mui/material';

export function MainContent({ children }: { children: React.ReactNode }) {
	return (
		<Box
			component='main'
			sx={{
				flexGrow: 1,
				p: 3,
				mt: 2,
				backgroundColor: (theme) =>
					theme.palette.mode === 'light'
						? theme.palette.grey[100]
						: theme.palette.grey[900],
				color: (theme) =>
					theme.palette.mode === 'light'
						? 'rgba(0, 0, 0, 0.87)'
						: 'rgba(255, 255, 255, 0.7)',
			}}
		>
			{children}
		</Box>
	);
}
