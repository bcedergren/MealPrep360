'use client';

import React from 'react';
import { Menu, MenuItem, CircularProgress, Box } from '@mui/material';
import { MealPlanItem } from './types/meal-planner';
import { format } from 'date-fns';

// StatusMenu component for skip functionality
interface StatusMenuProps {
	anchorEl: HTMLElement | null;
	open: boolean;
	onClose: () => void;
	selectedDate: Date | null;
	onSkipDate: (date: Date) => void;
	skippedDays: string[];
	mealPlansByDate: Record<string, MealPlanItem[]>;
}

export const StatusMenu: React.FC<StatusMenuProps> = ({
	anchorEl,
	open,
	onClose,
	selectedDate,
	onSkipDate,
	skippedDays,
	mealPlansByDate,
}) => {
	const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
	const plansForDate = dateStr ? mealPlansByDate[dateStr] || [] : [];
	const isCurrentlySkipped =
		selectedDate &&
		(skippedDays.includes(dateStr) ||
			plansForDate?.some((plan) => plan.status === 'skipped'));

	return (
		<Menu
			anchorEl={anchorEl}
			open={open}
			onClose={onClose}
			sx={{
				'& .MuiPaper-root': {
					borderRadius: 2,
					boxShadow: 3,
					'& .MuiMenuItem-root': {
						transition: 'all 0.2s ease',
						'&:hover': {
							backgroundColor: 'action.hover',
							transform: 'translateX(2px)',
						},
					},
				},
			}}
		>
			<MenuItem
				onClick={() => {
					if (selectedDate) {
						onSkipDate(selectedDate);
					}
					onClose();
				}}
				sx={{ fontWeight: 500 }}
			>
				{isCurrentlySkipped ? 'Unskip Day' : 'Skip Day'}
			</MenuItem>
		</Menu>
	);
};

// StatusChangeMenu component for status updates and delete
interface StatusChangeMenuProps {
	anchorEl: HTMLElement | null;
	open: boolean;
	onClose: () => void;
	selectedPlan: MealPlanItem | null;
	onStatusUpdate: (plan: MealPlanItem, status: string) => Promise<void>;
	onDelete: (plan: MealPlanItem) => void;
	statusUpdateInProgress?: boolean;
	updatingPlanId?: string | null;
	currentPlan?: string;
}

export const StatusChangeMenu: React.FC<StatusChangeMenuProps> = ({
	anchorEl,
	open,
	onClose,
	selectedPlan,
	onStatusUpdate,
	onDelete,
	statusUpdateInProgress = false,
	updatingPlanId = null,
	currentPlan = 'FREE',
}) => {
	const planKey = selectedPlan
		? `${selectedPlan.id}-${format(selectedPlan.date, 'yyyy-MM-dd')}`
		: null;
	const isUpdatingThisPlan =
		statusUpdateInProgress && updatingPlanId === planKey;

	// Filter statuses based on subscription plan
	const hasFreezerAccess = currentPlan && currentPlan !== 'FREE';
	const availableStatuses = hasFreezerAccess
		? ['planned', 'cooked', 'consumed', 'frozen']
		: ['planned', 'cooked', 'consumed'];

	return (
		<Menu
			anchorEl={anchorEl}
			open={open}
			onClose={onClose}
			sx={{
				'& .MuiPaper-root': {
					borderRadius: 2,
					boxShadow: 3,
				},
			}}
		>
			{availableStatuses.map((status) => (
				<MenuItem
					key={status}
					onClick={() => selectedPlan && onStatusUpdate(selectedPlan, status)}
					selected={selectedPlan?.status === status}
					disabled={isUpdatingThisPlan}
					sx={{
						position: 'relative',
						opacity: isUpdatingThisPlan ? 0.7 : 1,
					}}
				>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						{isUpdatingThisPlan && <CircularProgress size={16} />}
						{status.charAt(0).toUpperCase() + status.slice(1)}
					</Box>
				</MenuItem>
			))}
			{!hasFreezerAccess && (
				<MenuItem
					disabled
					sx={{
						color: 'text.secondary',
						fontStyle: 'italic',
						fontSize: '0.875rem',
						borderTop: '1px solid',
						borderColor: 'divider',
						mt: 1,
					}}
				>
					Freezer features require a paid plan
				</MenuItem>
			)}
			<MenuItem
				onClick={() => selectedPlan && onDelete(selectedPlan)}
				disabled={isUpdatingThisPlan}
				sx={{
					color: 'error.main',
					fontWeight: 600,
					borderTop: '1px solid',
					borderColor: 'divider',
					mt: 1,
					opacity: isUpdatingThisPlan ? 0.7 : 1,
				}}
			>
				Delete
			</MenuItem>
		</Menu>
	);
};
