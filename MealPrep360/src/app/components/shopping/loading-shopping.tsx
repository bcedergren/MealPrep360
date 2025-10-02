import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingShopping() {
	return (
		<Box
			display='flex'
			flexDirection='column'
			alignItems='center'
			justifyContent='center'
			minHeight='200px'
		>
			<CircularProgress />
			<Typography
				variant='body1'
				sx={{ mt: 2 }}
			>
				Loading shopping list...
			</Typography>
		</Box>
	);
}
