'use client';

import { Box, Card, CardContent, Grid, Skeleton } from '@mui/material';

interface RecipeSkeletonProps {
	count?: number;
}

export function RecipeSkeleton({ count = 9 }: RecipeSkeletonProps) {
	return (
		<Grid
			container
			spacing={3}
		>
			{Array.from({ length: count }).map((_, index) => (
				<Grid
					item
					xs={12}
					sm={6}
					md={4}
					key={index}
				>
					<Card
						sx={{
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							borderRadius: 2,
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
							transition: 'transform 0.2s ease-in-out',
						}}
					>
						{/* Recipe Image Skeleton */}
						<Skeleton
							variant='rectangular'
							height={200}
							sx={{
								borderTopLeftRadius: 8,
								borderTopRightRadius: 8,
							}}
							animation='wave'
						/>

						<CardContent sx={{ flexGrow: 1, p: 2 }}>
							{/* Recipe Title Skeleton */}
							<Skeleton
								variant='text'
								height={28}
								width='85%'
								sx={{ mb: 1 }}
								animation='wave'
							/>

							{/* Recipe Description Skeleton */}
							<Skeleton
								variant='text'
								height={20}
								width='100%'
								sx={{ mb: 0.5 }}
								animation='wave'
							/>
							<Skeleton
								variant='text'
								height={20}
								width='70%'
								sx={{ mb: 2 }}
								animation='wave'
							/>

							{/* Tags Skeleton */}
							<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
								<Skeleton
									variant='rounded'
									width={60}
									height={24}
									animation='wave'
								/>
								<Skeleton
									variant='rounded'
									width={80}
									height={24}
									animation='wave'
								/>
								<Skeleton
									variant='rounded'
									width={70}
									height={24}
									animation='wave'
								/>
							</Box>

							{/* Recipe Info (Prep time, servings) Skeleton */}
							<Box
								sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
							>
								<Skeleton
									variant='text'
									width={80}
									height={20}
									animation='wave'
								/>
								<Skeleton
									variant='text'
									width={90}
									height={20}
									animation='wave'
								/>
							</Box>

							{/* Action Buttons Skeleton */}
							<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
								<Skeleton
									variant='rectangular'
									width={36}
									height={36}
									sx={{ borderRadius: 1 }}
									animation='wave'
								/>
								<Skeleton
									variant='rectangular'
									width={36}
									height={36}
									sx={{ borderRadius: 1 }}
									animation='wave'
								/>
								<Skeleton
									variant='rectangular'
									width={36}
									height={36}
									sx={{ borderRadius: 1 }}
									animation='wave'
								/>
							</Box>
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	);
}
