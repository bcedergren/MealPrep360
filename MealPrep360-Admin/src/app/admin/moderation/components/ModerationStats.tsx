'use client';

import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import { useState, useEffect } from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts';
import { clientAdminApiClient } from '@/lib/apiClient';

type ModerationStatsType = {
	byStatus: Record<string, number>;
	byType: Record<string, number>;
	byResolution: Record<string, number>;
};

function ModerationStats() {
	const [stats, setStats] = useState<ModerationStatsType | null>(null);
	const [loading, setLoading] = useState(true);
	const [tabValue, setTabValue] = useState(0);

	useEffect(() => {
		async function fetchStats() {
			try {
				const data = await clientAdminApiClient.getModerationStats();
				setStats(data);
			} catch (e) {
				setStats(null);
			} finally {
				setLoading(false);
			}
		}
		fetchStats();
	}, []);

	const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	if (loading) {
		return <Box p={4}>Loading moderation stats...</Box>;
	}
	if (!stats) {
		return <Box p={4}>Failed to load moderation stats.</Box>;
	}

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
			<Card>
				<CardContent>
					<Typography
						variant='h6'
						gutterBottom
					>
						Moderation Overview
					</Typography>
					<Grid
						container
						spacing={2}
					>
						<Grid
							item
							xs={6}
						>
							<Box>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									Total Flagged
								</Typography>
								<Typography variant='h4'>
									{Object.values(stats!.byStatus)
										.map(Number)
										.reduce((a, b) => a + b, 0)}
								</Typography>
							</Box>
						</Grid>
						<Grid
							item
							xs={6}
						>
							<Box>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									Pending Review
								</Typography>
								<Typography variant='h4'>
									{stats!.byStatus.pending || 0}
								</Typography>
							</Box>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography
						variant='h6'
						gutterBottom
					>
						Content Type Distribution
					</Typography>
					<Box sx={{ height: 300 }}>
						<ResponsiveContainer
							width='100%'
							height='100%'
						>
							<BarChart
								data={Object.entries(stats!.byType).map(([type, count]) => ({
									type,
									count,
								}))}
							>
								<CartesianGrid strokeDasharray='3 3' />
								<XAxis dataKey='type' />
								<YAxis />
								<Tooltip />
								<Bar
									dataKey='count'
									fill='#1976d2'
								/>
							</BarChart>
						</ResponsiveContainer>
					</Box>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<Typography
						variant='h6'
						gutterBottom
					>
						Resolution Actions
					</Typography>
					<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
						<Tabs
							value={tabValue}
							onChange={handleTabChange}
						>
							<Tab label='7 Days' />
							<Tab label='30 Days' />
						</Tabs>
					</Box>
					<Box sx={{ mt: 2 }}>
						{tabValue === 0 ? (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								{Object.entries(stats!.byResolution).map(([action, count]) => (
									<Box
										key={action}
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<Typography
											variant='body1'
											sx={{ textTransform: 'capitalize' }}
										>
											{action}
										</Typography>
										<Typography
											variant='body1'
											fontWeight='medium'
										>
											{count}
										</Typography>
									</Box>
								))}
							</Box>
						) : (
							<Typography color='text.secondary'>Coming soon</Typography>
						)}
					</Box>
				</CardContent>
			</Card>
		</Box>
	);
}

export { ModerationStats };
