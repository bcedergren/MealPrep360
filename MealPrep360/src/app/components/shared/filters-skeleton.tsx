'use client';

import { Box, Grid, Paper, Skeleton, Divider } from '@mui/material';

export function FiltersSkeleton() {
	return (
		<Paper
			elevation={0}
			sx={{
				p: 3,
				mb: 4,
				borderRadius: 2,
				backgroundColor: 'background.paper',
				border: '1px solid',
				borderColor: 'divider',
			}}
		>
			<Grid
				container
				spacing={3}
			>
				{/* Search Field Skeleton */}
				<Grid
					item
					xs={12}
					md={6}
				>
					<Skeleton
						variant='rectangular'
						height={56}
						sx={{ borderRadius: 2 }}
						animation='wave'
					/>
				</Grid>

				{/* Sort and Prep Time Filters Skeleton */}
				<Grid
					item
					xs={12}
					md={6}
				>
					<Grid
						container
						spacing={2}
					>
						<Grid
							item
							xs={12}
							sm={6}
						>
							<Skeleton
								variant='rectangular'
								height={56}
								sx={{ borderRadius: 2 }}
								animation='wave'
							/>
						</Grid>
						<Grid
							item
							xs={12}
							sm={6}
						>
							<Skeleton
								variant='rectangular'
								height={56}
								sx={{ borderRadius: 2 }}
								animation='wave'
							/>
						</Grid>
					</Grid>
				</Grid>

				{/* Tags Filter Skeleton */}
				<Grid
					item
					xs={12}
				>
					<Divider sx={{ my: 1 }} />

					{/* Desktop Layout Skeleton */}
					<Box
						sx={{
							display: { xs: 'none', sm: 'flex' },
							justifyContent: 'flex-start',
							alignItems: 'center',
							gap: 2,
						}}
					>
						{/* Page Size Selector Skeleton */}
						<Skeleton
							variant='rectangular'
							width={120}
							height={40}
							sx={{ borderRadius: 2 }}
							animation='wave'
						/>

						{/* Tags Skeleton */}
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
							{Array.from({ length: 8 }).map((_, index) => (
								<Skeleton
									key={index}
									variant='rounded'
									width={60 + Math.random() * 40}
									height={32}
									sx={{ borderRadius: 1.5 }}
									animation='wave'
								/>
							))}
						</Box>
					</Box>

					{/* Mobile Layout Skeleton */}
					<Box sx={{ display: { xs: 'block', sm: 'none' } }}>
						{/* Tags Skeleton */}
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
							{Array.from({ length: 6 }).map((_, index) => (
								<Skeleton
									key={index}
									variant='rounded'
									width={60 + Math.random() * 40}
									height={32}
									sx={{ borderRadius: 1.5 }}
									animation='wave'
								/>
							))}
						</Box>

						{/* Show Dropdown Skeleton */}
						<Box sx={{ display: 'flex', justifyContent: 'center' }}>
							<Skeleton
								variant='rectangular'
								width={140}
								height={40}
								sx={{ borderRadius: 2 }}
								animation='wave'
							/>
						</Box>
					</Box>
				</Grid>
			</Grid>
		</Paper>
	);
}
