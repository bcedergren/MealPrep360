'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { format, addDays } from 'date-fns';

interface CalendarNavigationProps {
	currentDate: Date;
	onPreviousWeek: () => void;
	onNextWeek: () => void;
	isGenerating: boolean;
	onGeneratePlan: () => void;
	calendarStartDate: Date;
	displayDays: number;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
	currentDate,
	onPreviousWeek,
	onNextWeek,
	isGenerating,
	onGeneratePlan,
	calendarStartDate,
	displayDays,
}) => {
	const formatDate = (date: Date) => format(date, 'MMM d, yyyy');
	const endDate = addDays(calendarStartDate, displayDays - 1);

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				mb: 4,
				px: { xs: 1, sm: 2 },
				flexWrap: { xs: 'nowrap', sm: 'wrap' },
				gap: 2,
				position: 'sticky',
				top: 0,
				zIndex: 10,
				background: '#fff',
				boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
				borderRadius: { xs: '0 0 18px 18px', sm: 3 },
				minHeight: 64,
				minWidth: 0,
				overflowX: { xs: 'auto', sm: 'visible' },
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					minWidth: 0,
					flexWrap: 'nowrap',
					overflowX: { xs: 'auto', sm: 'visible' },
					width: '100%',
					gap: 2,
					justifyContent: 'center',
				}}
			>
				<Button
					onClick={onPreviousWeek}
					variant='outlined'
					sx={{
						minWidth: 'auto',
						p: { xs: 0.5, sm: 1.5 },
						fontWeight: 500,
						borderRadius: 2,
						fontSize: { xs: 12, sm: 16 },
						whiteSpace: 'nowrap',
						'&:hover': {
							backgroundColor: 'action.hover',
							transform: 'translateX(-2px)',
						},
						transition: 'all 0.2s ease',
					}}
				>
					<ChevronLeft sx={{ fontSize: '2rem' }} />
				</Button>
				<Typography
					variant='h6'
					sx={{
						fontWeight: 600,
						color: 'text.primary',
						fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
						letterSpacing: '0.5px',
						textAlign: 'center',
						position: 'relative',
						whiteSpace: 'nowrap',
						flexShrink: 1,
						'&::after': {
							content: '""',
							position: 'absolute',
							bottom: -4,
							left: '50%',
							transform: 'translateX(-50%)',
							width: '30%',
							height: '2px',
							background:
								'linear-gradient(90deg, transparent, primary.main, transparent)',
							opacity: 0.5,
						},
					}}
				>
					{formatDate(calendarStartDate)} - {formatDate(endDate)}
				</Typography>
				<Button
					onClick={onNextWeek}
					variant='outlined'
					sx={{
						minWidth: 'auto',
						p: { xs: 0.5, sm: 1.5 },
						fontWeight: 500,
						borderRadius: 2,
						fontSize: { xs: 12, sm: 16 },
						whiteSpace: 'nowrap',
						'&:hover': {
							backgroundColor: 'action.hover',
							transform: 'translateX(2px)',
						},
						transition: 'all 0.2s ease',
					}}
				>
					<ChevronRight sx={{ fontSize: '2rem' }} />
				</Button>
			</Box>
		</Box>
	);
};
