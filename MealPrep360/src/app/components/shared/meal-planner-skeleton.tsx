'use client';

import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { format, isToday } from 'date-fns';

interface MealPlannerSkeletonProps {
	weekDays: Date[];
}

export function MealPlannerSkeleton({ weekDays }: MealPlannerSkeletonProps) {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'row',
				gap: { xs: 2, sm: 2 },
				justifyContent: 'flex-start',
				mb: { xs: 2, sm: 4 },
				width: '100%',
				px: 0,
				overflowX: 'auto',
				WebkitOverflowScrolling: 'touch',
				scrollSnapType: { xs: 'x mandatory', sm: 'none' },
				background: { xs: '#f8fafc', sm: 'transparent' },
				py: { xs: 2, sm: 0 },
				borderRadius: { xs: 3, sm: 0 },
				boxShadow: { xs: 1, sm: 0 },
				position: 'relative',
				minHeight: 220,
			}}
		>
			{weekDays.map((day, idx) => {
				const dateStr = format(day, 'yyyy-MM-dd');
				const isCurrentDay = isToday(day);

				// Card style matching WeekFlex
				const cardSx = {
					flex: '0 0 auto',
					width: { xs: '42vw', sm: '42vw' },
					minWidth: { xs: 180, sm: 180 },
					maxWidth: { xs: 180, sm: 180 },
					height: { xs: 260, sm: 320 },
					bgcolor: '#fff',
					border: 'none',
					borderRadius: { xs: 3, sm: 0 },
					boxShadow: { xs: 2, sm: 0 },
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'flex-start',
					alignItems: 'center',
					p: { xs: 2, sm: 2 },
					position: 'relative',
					scrollSnapAlign: { xs: 'start', sm: 'none' },
					mx: { xs: 0, sm: 0 },
					overflow: 'hidden',
				};

				return (
					<Box
						key={dateStr}
						sx={cardSx}
					>
						{/* Day header with menu button */}
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								mb: 1,
							}}
						>
							{/* Day name (FRI) */}
							<Typography
								variant='subtitle2'
								sx={{
									fontWeight: 700,
									color: isCurrentDay ? 'primary.main' : 'text.secondary',
									letterSpacing: 1.5,
									fontSize: { xs: '1rem', sm: '1rem' },
									textTransform: 'uppercase',
									opacity: isCurrentDay ? 1 : 0.8,
								}}
							>
								{format(day, 'EEE')}
							</Typography>
							{/* Menu button skeleton (three dots) */}
							<Skeleton
								variant='circular'
								width={24}
								height={24}
								animation='wave'
							/>
						</Box>

						{/* Day number */}
						<Typography
							variant='h4'
							sx={{
								fontWeight: 700,
								fontSize: { xs: 28, sm: 30 },
								color: isCurrentDay ? 'primary.main' : 'text.secondary',
								lineHeight: 1,
								textAlign: 'center',
								opacity: isCurrentDay ? 1 : 0.8,
								mb: 2,
							}}
						>
							{format(day, 'd')}
						</Typography>

						{/* Recipe content skeleton */}
						<Box
							sx={{
								width: '100%',
								flex: 1,
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 1,
							}}
						>
							{/* Recipe title skeleton */}
							<Skeleton
								variant='text'
								width='85%'
								height={20}
								sx={{
									textAlign: 'center',
									fontWeight: 500,
									color: 'text.primary',
								}}
								animation='wave'
							/>
							<Skeleton
								variant='text'
								width='60%'
								height={20}
								sx={{
									textAlign: 'center',
									fontWeight: 500,
									color: 'text.primary',
								}}
								animation='wave'
							/>
						</Box>

						{/* Status button skeleton */}
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								justifyContent: 'center',
								mt: 'auto',
								mb: 1,
							}}
						>
							<Skeleton
								variant='rounded'
								width={80}
								height={32}
								sx={{
									borderRadius: 2,
									bgcolor: 'grey.200',
								}}
								animation='wave'
							/>
						</Box>
					</Box>
				);
			})}
		</Box>
	);
}
