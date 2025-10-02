'use client';

import { Box } from '@mui/material';
import { MainNav } from '../components/shared/navigation/main-nav';
import { ClientLayout } from '../components/shared/client-layout';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { PlanSection } from '../components/shared/navigation/plan-section';

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	// Height of nav bar and plan section
	const NAV_HEIGHT = 64;
	const PLAN_HEIGHT = 48; // Fixed height for plan section
	return (
		<>
			<Box
				sx={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					zIndex: 1100,
					bgcolor: 'background.paper',
				}}
			>
				<MainNav />
				<Box
					sx={{
						width: '100%',
						bgcolor: 'background.paper',
						borderBottom: 1,
						borderColor: 'divider',
						py: 1,
						px: 2,
						display: 'flex',
						justifyContent: 'center',
						height: PLAN_HEIGHT,
					}}
				>
					<PlanSection mobile={isMobile} />
				</Box>
			</Box>
			<Box
				component='main'
				sx={{
					flexGrow: 1,
					mt: `${NAV_HEIGHT + PLAN_HEIGHT}px`,
				}}
			>
				<ClientLayout>{children}</ClientLayout>
			</Box>
		</>
	);
}
