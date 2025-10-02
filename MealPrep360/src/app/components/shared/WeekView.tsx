'use client';

import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { MoreVert } from '@mui/icons-material';
import { format, isToday } from 'date-fns';
import { EventBusy } from '@mui/icons-material';
import { Day, MealPlanItem } from './types/meal-planner';

interface WeekViewProps {
	days: Day[];
	focusedIdx: number;
	onMenuOpen: (
		event: React.MouseEvent<HTMLElement>,
		plan: MealPlanItem
	) => void;
	onStatusMenuOpen: (
		event: React.MouseEvent<HTMLElement>,
		plan: MealPlanItem
	) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
	days,
	focusedIdx,
	onMenuOpen,
	onStatusMenuOpen,
}) => {
	return (
		<Box
			sx={{
				display: 'grid',
				gridTemplateColumns: 'repeat(7, 1fr)',
				gap: 2,
				p: 2,
				bgcolor: 'background.paper',
				borderRadius: 2,
				boxShadow: 1,
			}}
		>
			{days.map((day, index) => {
				return (
					<Box
						key={format(day.date, 'yyyy-MM-dd')}
						sx={{
							p: { xs: 1, sm: 2 },
							bgcolor: isToday(day.date) ? 'primary.light' : 'background.paper',
							borderRadius: 2,
							boxShadow: 1,
							opacity: focusedIdx === index ? 1 : 0.8,
							transform: focusedIdx === index ? 'scale(1.02)' : 'scale(1)',
							transition: 'all 0.2s ease',
						}}
					>
						<Typography
							variant='subtitle2'
							sx={{ mb: 1 }}
						>
							{format(day.date, 'EEEE')}
						</Typography>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								mb: 2,
							}}
						>
							<Typography variant='h6'>{format(day.date, 'MMM d')}</Typography>
							<IconButton
								size='small'
								onClick={(e) =>
									onMenuOpen(e, {
										_id: '',
										id: '',
										startDate: new Date(),
										endDate: new Date(),
										date: day.date,
										recipeId: day.recipeId || '',
										recipe: day.recipe,
										mealType: day.mealType || 'dinner',
										status: day.status || 'planned',
										dayIndex: index,
									})
								}
							>
								<MoreVert />
							</IconButton>
						</Box>
						{day.status === 'skipped' ? (
							<>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 1,
										py: 1,
									}}
								>
									<EventBusy
										sx={{
											fontSize: { xs: '1.5rem', sm: '2rem' },
											color: 'text.secondary',
										}}
									/>
									<Chip
										label='SKIPPED'
										size='small'
										sx={{
											fontSize: { xs: '0.625rem', sm: '0.75rem' },
											height: { xs: 20, sm: 24 },
											'& .MuiChip-label': {
												px: { xs: 1, sm: 1.5 },
											},
										}}
										color='default'
									/>
								</Box>
							</>
						) : day.recipe ? (
							<>
								<Typography
									variant='body1'
									sx={{ fontWeight: 600, mb: 2 }}
								>
									{day.recipe.title}
								</Typography>
								<Chip
									label={(day.status || 'planned').toUpperCase()}
									size='small'
									onClick={(e) =>
										onStatusMenuOpen(e, {
											_id: '',
											id: '',
											startDate: new Date(),
											endDate: new Date(),
											date: day.date,
											recipeId: day.recipeId || '',
											recipe: day.recipe,
											mealType: day.mealType || 'dinner',
											status: day.status || 'planned',
											dayIndex: index,
										})
									}
									sx={{
										cursor: 'pointer',
										'&:hover': {
											backgroundColor:
												day.status === 'planned'
													? 'primary.dark'
													: day.status === 'cooked'
													? 'success.dark'
													: day.status === 'frozen'
													? 'info.dark'
													: 'action.selected',
										},
									}}
									color={
										day.status === 'planned'
											? 'primary'
											: day.status === 'cooked'
											? 'success'
											: day.status === 'frozen'
											? 'info'
											: 'default'
									}
								/>
							</>
						) : (
							<Typography
								variant='body2'
								color='text.secondary'
							>
								No meal planned
							</Typography>
						)}
					</Box>
				);
			})}
		</Box>
	);
};
