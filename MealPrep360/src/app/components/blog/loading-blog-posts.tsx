import { Box, CircularProgress } from '@mui/material';

export function LoadingBlogPosts() {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '200px',
			}}
		>
			<CircularProgress />
		</Box>
	);
}
