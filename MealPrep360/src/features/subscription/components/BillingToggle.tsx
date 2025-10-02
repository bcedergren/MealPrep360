'use client';

import React from 'react';
import { Box, Typography, Switch, FormControlLabel, Chip } from '@mui/material';
import { getAnnualDiscount } from '@/types/subscription';

interface BillingToggleProps {
	billingInterval: 'monthly' | 'yearly';
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BillingToggle: React.FC<BillingToggleProps> = ({
	billingInterval,
	onChange,
}) => {
	return (
		<Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: 2 }}>
			<FormControlLabel
				control={
					<Switch
						checked={billingInterval === 'yearly'}
						onChange={onChange}
						color='primary'
					/>
				}
				label={
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
						<Typography>Bill Yearly</Typography>
						<Chip
							label={`Save ${getAnnualDiscount('PLUS')}%`}
							color='success'
							size='small'
							sx={{ height: 20 }}
						/>
					</Box>
				}
			/>
		</Box>
	);
};
