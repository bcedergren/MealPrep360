'use client';

import {
	Box,
	Typography,
	Paper,
	CircularProgress,
	Container,
	Alert,
	List,
	ListItem,
	ListItemText,
	Rating,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useEffect, useState } from 'react';
import {
	People as PeopleIcon,
	Restaurant as RestaurantIcon,
	AutoAwesome as AutoAwesomeIcon,
	Image as ImageIcon,
} from '@mui/icons-material';
import { clientAdminApiClient } from '@/lib/apiClient';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip as RechartsTooltip,
	ResponsiveContainer,
} from 'recharts';
import { blue, orange, purple, green } from '@mui/material/colors';

interface AdminStats {
	totalUsers: number;
	totalRecipes: number;
	recipesWithImages: number;
	recipesWithoutImages: number;
	recipesWithPlaceholders: number;
	recipesWithCustomImages: number;
	lastGenerated: string | null;
	averagePrepTime: number;
	averageCookTime: number;
	topTags: Array<{ tag: string; count: number }>;
	topSavedRecipes: Array<{ title: string; saves: number }>;
	activeUsers: number;
	reportedImages: number;
	feedback: {
		id: string;
		rating: number;
		feedback: string;
		createdAt: string;
		clerkId: string;
		name: string;
		email: string;
	}[];
}

export function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<AdminStats | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchStats = async () => {
			try {
				const data = await clientAdminApiClient.getStats();
				setStats(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An error occurred');
			} finally {
				setLoading(false);
			}
		};

		fetchStats();
	}, []);

	if (loading) {
		return (
			<Box
				display='flex'
				justifyContent='center'
				alignItems='center'
				minHeight='100vh'
			>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Container>
				<Alert severity='error'>{error}</Alert>
			</Container>
		);
	}

	if (!stats) {
		return null;
	}

	return (
		<Container
			maxWidth='lg'
			sx={{ mt: 2, mb: 4 }}
		>
			<Typography
				variant='h4'
				component='h1'
				gutterBottom
				sx={{ fontWeight: 800, letterSpacing: 1, mb: 4 }}
			>
				Admin Dashboard
			</Typography>

			{/* Hero Stat Cards */}
			<Grid
				container
				spacing={3}
				sx={{ mb: 4 }}
			>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 6,
							background: `linear-gradient(135deg, ${blue[500]} 60%, ${blue[300]} 100%)`,
							color: 'white',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transition: 'transform 0.2s',
							'&:hover': { transform: 'scale(1.04)', boxShadow: 12 },
						}}
					>
						<PeopleIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
						<Typography
							variant='h3'
							sx={{ fontWeight: 900 }}
						>
							{stats.totalUsers}
						</Typography>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 500, opacity: 0.9 }}
						>
							Users
						</Typography>
					</Paper>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 6,
							background: `linear-gradient(135deg, ${green[500]} 60%, ${green[300]} 100%)`,
							color: 'white',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transition: 'transform 0.2s',
							'&:hover': { transform: 'scale(1.04)', boxShadow: 12 },
						}}
					>
						<RestaurantIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
						<Typography
							variant='h3'
							sx={{ fontWeight: 900 }}
						>
							{stats.totalRecipes}
						</Typography>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 500, opacity: 0.9 }}
						>
							Recipes
						</Typography>
					</Paper>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 6,
							background: `linear-gradient(135deg, ${orange[600]} 60%, ${orange[400]} 100%)`,
							color: 'white',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transition: 'transform 0.2s',
							'&:hover': { transform: 'scale(1.04)', boxShadow: 12 },
						}}
					>
						<ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
						<Typography
							variant='h3'
							sx={{ fontWeight: 900 }}
						>
							{stats.reportedImages}
						</Typography>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 500, opacity: 0.9 }}
						>
							Pending Reports
						</Typography>
					</Paper>
				</Grid>
				<Grid
					item
					xs={12}
					sm={6}
					md={3}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 6,
							background: `linear-gradient(135deg, ${purple[500]} 60%, ${purple[300]} 100%)`,
							color: 'white',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							transition: 'transform 0.2s',
							'&:hover': { transform: 'scale(1.04)', boxShadow: 12 },
						}}
					>
						<AutoAwesomeIcon sx={{ fontSize: 48, mb: 1, opacity: 0.9 }} />
						<Typography
							variant='h3'
							sx={{ fontWeight: 900 }}
						>
							{stats.totalRecipes > 0
								? Math.round((stats.reportedImages / stats.totalRecipes) * 100)
								: 0}
							%
						</Typography>
						<Typography
							variant='subtitle1'
							sx={{ fontWeight: 500, opacity: 0.9 }}
						>
							Report Rate
						</Typography>
					</Paper>
				</Grid>
			</Grid>

			{/* Section: Image Status & Tags */}
			<Grid
				container
				spacing={3}
				sx={{ mb: 4 }}
			>
				<Grid
					item
					xs={12}
					md={6}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 3,
							bgcolor: 'background.paper',
						}}
					>
						<Typography
							variant='h6'
							gutterBottom
							sx={{ fontWeight: 700 }}
						>
							Image Status
						</Typography>
						<Grid
							container
							spacing={2}
							key='image-status-grid'
						>
							<Grid
								item
								xs={6}
							>
								<Typography variant='subtitle1'>With Images</Typography>
								<Typography
									variant='h4'
									sx={{ fontWeight: 700 }}
								>
									{stats.recipesWithImages}
								</Typography>
							</Grid>
							<Grid
								item
								xs={6}
							>
								<Typography variant='subtitle1'>Without Images</Typography>
								<Typography
									variant='h4'
									sx={{ fontWeight: 700 }}
								>
									{stats.recipesWithoutImages}
								</Typography>
							</Grid>
							<Grid
								item
								xs={6}
							>
								<Typography variant='subtitle1'>Placeholders</Typography>
								<Typography
									variant='h4'
									sx={{ fontWeight: 700 }}
								>
									{stats.recipesWithPlaceholders}
								</Typography>
							</Grid>
							<Grid
								item
								xs={6}
							>
								<Typography variant='subtitle1'>Custom Images</Typography>
								<Typography
									variant='h4'
									sx={{ fontWeight: 700 }}
								>
									{stats.recipesWithCustomImages}
								</Typography>
							</Grid>
						</Grid>
					</Paper>
				</Grid>
				<Grid
					item
					xs={12}
					md={6}
				>
					<Paper
						sx={{
							p: 3,
							borderRadius: 3,
							boxShadow: 3,
							bgcolor: 'background.paper',
						}}
					>
						<Typography
							variant='h6'
							gutterBottom
							sx={{ fontWeight: 700 }}
						>
							Top Tags
						</Typography>
						<Box sx={{ height: 300 }}>
							<ResponsiveContainer
								width='100%'
								height='100%'
							>
								<BarChart data={stats.topTags}>
									<CartesianGrid strokeDasharray='3 3' />
									<XAxis dataKey='tag' />
									<YAxis />
									<RechartsTooltip />
									<Bar
										dataKey='count'
										fill={purple[400]}
									/>
								</BarChart>
							</ResponsiveContainer>
						</Box>
					</Paper>
				</Grid>
			</Grid>

			{/* Section: Most Saved Recipes */}
			<Paper
				sx={{
					p: 3,
					borderRadius: 3,
					boxShadow: 3,
					mb: 4,
					bgcolor: 'background.paper',
				}}
			>
				<Typography
					variant='h6'
					gutterBottom
					sx={{ fontWeight: 700 }}
				>
					Most Saved Recipes
				</Typography>
				<Box sx={{ mt: 2 }}>
					{stats.topSavedRecipes?.map((recipe, index) => (
						<Box
							key={index}
							sx={{ mb: 1 }}
						>
							<Typography
								variant='body1'
								sx={{ fontWeight: 600 }}
							>
								{recipe.title}: {recipe.saves} saves
							</Typography>
						</Box>
					))}
				</Box>
			</Paper>

			{/* Section: Recent Feedback */}
			<Paper
				sx={{
					p: 3,
					borderRadius: 3,
					boxShadow: 3,
					bgcolor: 'background.paper',
				}}
			>
				<Typography
					variant='h6'
					gutterBottom
					sx={{ fontWeight: 700 }}
				>
					Recent Feedback
				</Typography>
				<List>
					{stats.feedback?.map((item) => (
						<ListItem
							key={item.id}
							divider
						>
							<ListItemText
								primary={
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
										<Typography
											variant='subtitle1'
											sx={{ fontWeight: 700 }}
										>
											{item.name || 'Anonymous User'}
										</Typography>
										<Rating
											value={item.rating}
											readOnly
											size='small'
										/>
										<Typography
											variant='caption'
											color='text.secondary'
										>
											{new Date(item.createdAt).toLocaleDateString()}
										</Typography>
									</Box>
								}
								secondary={item.feedback}
							/>
						</ListItem>
					))}
				</List>
			</Paper>
		</Container>
	);
}
