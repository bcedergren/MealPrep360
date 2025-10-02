import { Metadata } from 'next';
import { ServiceHealthMonitor } from './_components/ServiceHealthMonitor';
import { Box, Container, Typography, Paper } from '@mui/material';
import { HealthAndSafety } from '@mui/icons-material';

export const metadata: Metadata = {
	title: 'Service Health - Admin Dashboard',
	description: 'Monitor the health status of all services',
};

export default function ServiceHealthPage() {
	return (
		<Container maxWidth='xl'>
			<Box sx={{ mb: 4 }}>
				<Paper
					elevation={0}
					sx={{
						p: 3,
						mb: 4,
						backgroundColor: 'primary.main',
						color: 'primary.contrastText',
						borderRadius: 2,
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
						<HealthAndSafety sx={{ fontSize: 40 }} />
						<Box>
							<Typography
								variant='h4'
								component='h1'
								gutterBottom
							>
								Service Health Monitor
							</Typography>
							<Typography
								variant='subtitle1'
								sx={{ opacity: 0.9 }}
							>
								Real-time status of all MealPrep360 microservices
							</Typography>
						</Box>
					</Box>
				</Paper>
				<ServiceHealthMonitor />
			</Box>
		</Container>
	);
}
