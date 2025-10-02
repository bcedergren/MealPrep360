'use client';

import React from 'react';
import { Person, TrendingUp, Star, CheckCircle } from '@mui/icons-material';
import type { SubscriptionPlan } from '@/types/subscription';

interface PlanIconProps {
	plan: SubscriptionPlan;
}

export const PlanIcon: React.FC<PlanIconProps> = ({ plan }) => {
	switch (plan) {
		case 'FREE':
			return <Person />;
		case 'STARTER':
			return <TrendingUp />;
		case 'PLUS':
			return <Star />;
		case 'FAMILY':
			return <CheckCircle />;
		default:
			return <Person />;
	}
};
