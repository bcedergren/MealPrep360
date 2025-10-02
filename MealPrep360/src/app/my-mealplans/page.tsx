'use client';

export const dynamic = 'force-dynamic';

import { Box } from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { PageHeader } from '../components/shared/page-header';
import MealPlan from '../components/shared/meal-plan';

export default function MyMealPlansPage() {
	return (
		<Box sx={{ p: 3 }}>
			<PageHeader
				title='My Meal Plans'
				description='View your meal plans in a monthly calendar format'
				backgroundColor='linear-gradient(45deg, #4CAF50 30%, #81C784 90%)'
				icon={<CalendarIcon />}
			/>
			<Box
				sx={{
					mt: 2,
					p: { xs: 1, sm: 2, md: 3 },
					position: 'relative',
				}}
			>
				<MealPlan />
			</Box>
		</Box>
	);
}
