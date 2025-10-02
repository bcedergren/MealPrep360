'use client';

import React from 'react';
import {
	Box,
	Typography,
	IconButton,
	Chip,
	CircularProgress,
	Skeleton,
} from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { format, isToday } from 'date-fns';
import { Block as BlockIcon } from '@mui/icons-material';
import { Day, MealPlanItem } from './types/meal-planner';

interface WeekFlexProps {
	weekDays: Date[];
	focusedIdx: number;
	scrollRef: React.RefObject<HTMLDivElement>;
	onMenuOpen: (event: React.MouseEvent<HTMLElement>, date: Date) => void;
	onStatusMenuOpen: (
		event: React.MouseEvent<HTMLElement>,
		plan: MealPlanItem
	) => void;
	mealPlansByDate: Record<string, MealPlanItem[]>;
	skippedDays: string[];
	onRecipeClick: (recipeId: string) => void;
	statusUpdateInProgress?: boolean;
	updatingPlanId?: string | null;
	recipesLoading?: boolean;
}

export const WeekFlex: React.FC<WeekFlexProps> = ({
	weekDays,
	focusedIdx,
	scrollRef,
	onMenuOpen,
	onStatusMenuOpen,
	mealPlansByDate,
	skippedDays,
	onRecipeClick,
	statusUpdateInProgress = false,
	updatingPlanId = null,
	recipesLoading = false,
}) => {
	return (
		<Box
			ref={scrollRef}
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
				const dayMealPlans = mealPlansByDate[dateStr] || [];

				const isCurrentDay = isToday(day);
				const isSkipped =
					skippedDays.includes(dateStr) ||
					dayMealPlans.some((plan: MealPlanItem) => plan.status === 'skipped');

				const regularPlans = dayMealPlans.filter(
					(plan: MealPlanItem) => plan.status !== 'skipped'
				);

				// Card style
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

				if (isSkipped) {
					return (
						<Box
							key={dateStr}
							sx={{
								...cardSx,
								cursor: 'pointer',

								'&:hover': {
									transform: 'translateY(-2px)',
									boxShadow: { xs: 3, sm: 2 },
									transition: 'all 0.2s ease',
								},
							}}
							onClick={(e: React.MouseEvent<HTMLElement>) => {
								// Don't trigger if clicking on the menu button
								if ((e.target as HTMLElement).closest('.MuiIconButton-root')) {
									return;
								}
								onMenuOpen(e, day);
							}}
						>
							<Box
								sx={{
									width: '100%',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									mb: 1,
								}}
							>
								<Typography
									variant='subtitle2'
									sx={{
										fontWeight: 700,
										color: 'text.disabled',
										letterSpacing: 1.5,
										fontSize: { xs: '1rem', sm: '1rem' },
										textTransform: 'uppercase',
										opacity: 0.8,
									}}
								>
									{format(day, 'EEE')}
								</Typography>
								<IconButton
									onClick={(e) => {
										e.stopPropagation();
										onMenuOpen(e, day);
									}}
									size='large'
									sx={{ ml: 1, p: 1 }}
								>
									<MoreVert fontSize='medium' />
								</IconButton>
							</Box>
							<Typography
								variant='h4'
								sx={{
									fontWeight: 700,
									fontSize: { xs: 28, sm: 30 },
									color: 'text.disabled',
									lineHeight: 1,
									textAlign: 'center',
									mb: 1,
								}}
							>
								{format(day, 'd')}
							</Typography>
							<BlockIcon
								sx={{
									color: 'error.main',
									fontSize: 48,
									opacity: 0.3,
									mb: 0,
									filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
								}}
							/>
							<Box
								sx={{
									width: '100%',
									mt: 13.75,
									display: 'flex',
									justifyContent: 'center',
								}}
							>
								<Chip
									label='SKIPPED'
									color='error'
									size='small'
									sx={{
										fontWeight: 700,
										fontSize: { xs: '0.9rem', sm: '0.9rem' },
										px: 2,
										py: 2,
										borderRadius: 2,
										letterSpacing: 1,
									}}
								/>
							</Box>
						</Box>
					);
				}

				return (
					<Box
						key={dateStr}
						sx={{
							...cardSx,
							cursor: 'pointer',

							'&:hover': {
								transform: 'translateY(-2px)',
								boxShadow: { xs: 3, sm: 2 },
								transition: 'all 0.2s ease',
							},
						}}
						onClick={(e: React.MouseEvent<HTMLElement>) => {
							// Don't trigger if clicking on the menu button or recipe title
							if (
								(e.target as HTMLElement).closest('.MuiIconButton-root') ||
								(e.target as HTMLElement).closest('.MuiChip-root')
							) {
								return;
							}
							onMenuOpen(e, day);
						}}
					>
						<Box
							sx={{
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								mb: 1,
							}}
						>
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
							<IconButton
								onClick={(e) => {
									e.stopPropagation();
									onMenuOpen(e, day);
								}}
								size='large'
								sx={{ ml: 1, p: 1 }}
							>
								<MoreVert fontSize='medium' />
							</IconButton>
						</Box>
						<Typography
							variant='h4'
							sx={{
								fontWeight: 700,
								fontSize: { xs: 28, sm: 30 },
								color: isCurrentDay ? 'primary.main' : 'text.secondary',
								lineHeight: 1,
								textAlign: 'center',
								opacity: isCurrentDay ? 1 : 0.8,
								mb: 1,
							}}
						>
							{format(day, 'd')}
						</Typography>
						{regularPlans.map((plan) => (
							<Typography
								key={`${plan._id}-${plan.mealType}-${dateStr}`}
								variant='subtitle1'
								sx={{
									width: '100%',
									textAlign: 'center',
									fontWeight: 700,
									fontSize: { xs: '1rem', sm: '1rem' },
									opacity: 1,
									mt: 1,
									mb: 1,
									whiteSpace: 'normal',
									wordBreak: 'break-word',
									cursor: 'pointer',
									color: 'text.primary',
									'&:hover': {
										color: 'primary.dark',
										textDecoration: 'underline',
									},
								}}
								onClick={() => {
									if (plan.recipeId) {
										onRecipeClick(plan.recipeId);
									}
								}}
							>
								{plan.recipe?.title ||
									(plan.recipeId ? (
										<Box
											sx={{
												display: 'flex',
												alignItems: 'center',
												gap: 1,
												justifyContent: 'center',
											}}
										>
											<CircularProgress
												size={14}
												color='inherit'
											/>
											<span>Loading recipe...</span>
										</Box>
									) : (
										'No Recipe'
									))}
							</Typography>
						))}
						{/* Show skeleton content for empty dates when recipes are loading */}
						{regularPlans.length === 0 && recipesLoading && (
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
						)}
						<Box
							sx={{
								width: '100%',
								mt: 'auto',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								gap: 1,
							}}
						>
							{regularPlans.map((plan) => {
								const planKey = `${plan.id}-${dateStr}`;
								const isUpdatingThisPlan =
									statusUpdateInProgress && updatingPlanId === planKey;
								return (
									<Chip
										key={`${plan._id}-${plan.mealType}-${dateStr}`}
										label={
											<Box
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												{isUpdatingThisPlan && (
													<CircularProgress
														size={14}
														color='inherit'
													/>
												)}
												{plan.status.toUpperCase()}
											</Box>
										}
										size='medium'
										sx={{
											fontWeight: 700,
											cursor: 'pointer',
											fontSize: { xs: '0.9rem', sm: '0.9rem' },
											px: 2,
											py: 1,
											mb: 1,
											borderRadius: 2,
											opacity: isUpdatingThisPlan ? 0.7 : 1,
											'& .MuiChip-label': {
												display: 'flex',
												alignItems: 'center',
											},
										}}
										color={
											plan.status === 'cooked'
												? 'success'
												: plan.status === 'frozen'
													? 'info'
													: plan.status === 'consumed'
														? 'warning'
														: plan.status === 'skipped'
															? 'error'
															: 'default'
										}
										disabled={isUpdatingThisPlan}
										onClick={(e) => {
											if (!isUpdatingThisPlan) {
												e.stopPropagation();
												onStatusMenuOpen(e, plan);
											}
										}}
									/>
								);
							})}
							{/* Show skeleton status button when recipes are loading and no plans */}
							{regularPlans.length === 0 && recipesLoading && (
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
							)}
						</Box>
					</Box>
				);
			})}
		</Box>
	);
};
