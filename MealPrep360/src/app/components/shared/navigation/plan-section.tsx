'use client';
import { Box, Typography, Button } from '@mui/material';
import React from 'react';
import { useSubscription } from '@/contexts/subscription-context';
import { SubscriptionChangeModal } from '@/app/components/shared/SubscriptionChangeModal';

interface PlanSectionProps {
	mobile?: boolean;
}

export const PlanSection: React.FC<PlanSectionProps> = ({ mobile = false }) => {
	const { currentPlan } = useSubscription();
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const onUpgradeClick = () => {
		setIsModalOpen(true);
	};

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				gap: mobile ? 1 : 2,
				position: 'relative',
				justifyContent: mobile ? 'center' : 'flex-start',
				px: mobile ? 0 : 2,
				py: 0,
				'&::before': !mobile
					? {
							content: '""',
							position: 'absolute',
							left: -16,
							top: '50%',
							transform: 'translateY(-50%)',
							width: '2px',
							height: '28px',
							backgroundColor: 'divider',
							opacity: 0.6,
						}
					: undefined,
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center',
					gap: 1.5,
					mb: mobile ? 0.5 : 0,
				}}
			>
				<Typography
					variant='body2'
					sx={{
						color: 'text.secondary',
						fontSize: '0.75rem',
						fontWeight: 500,
						letterSpacing: '0.5px',
						whiteSpace: 'nowrap',
					}}
				>
					Current Plan:
				</Typography>
				<Typography
					variant='body2'
					sx={{
						color: 'primary.main',
						fontSize: '0.75rem',
						fontWeight: 600,
						letterSpacing: '0.5px',
						textTransform: 'uppercase',
						position: 'relative',
						'&::after': {
							content: '""',
							position: 'absolute',
							bottom: -2,
							left: 0,
							width: '100%',
							height: '1px',
							backgroundColor: 'primary.main',
							opacity: 0.3,
						},
					}}
				>
					{currentPlan}
				</Typography>
			</Box>
			<Button
				onClick={onUpgradeClick}
				size='small'
				variant='contained'
				color='primary'
				sx={{
					textTransform: 'none',
					fontSize: '0.75rem',
					fontWeight: 600,
					px: 2.5,
					py: 0.75,
					borderRadius: 3,
					boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
					'&:hover': {
						boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
						backgroundColor: 'primary.dark',
					},
					transition: 'all 0.2s ease-in-out',
					background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
					width: mobile ? '100%' : 'auto',
				}}
			>
				Upgrade
			</Button>
			<SubscriptionChangeModal
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				currentPlan={currentPlan}
			/>
		</Box>
	);
};
