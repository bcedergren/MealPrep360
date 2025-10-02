export const dynamic = 'force-dynamic';

import * as React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService(): React.ReactElement {
	return (
		<Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Header with logo */}
			<Box sx={{ textAlign: 'center' }}>
				{/* @ts-ignore */}
				<Image
					src='/images/logo.png'
					alt='MealPrep360 Logo'
					width={240}
					height={60}
					priority
					style={{ objectFit: 'contain' }}
				/>
			</Box>
			<Container
				maxWidth='md'
				sx={{ py: 6, flex: 1 }}
			>
				<Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
					<Link
						href='/'
						passHref
					>
						<Button
							variant='text'
							startIcon={<ArrowLeft />}
							sx={{ minWidth: 0, mr: 2 }}
						>
							Back
						</Button>
					</Link>
					<Typography
						variant='h4'
						sx={{
							fontWeight: 'bold',
							flex: 1,
							textAlign: { xs: 'left', sm: 'center' },
						}}
					>
						Terms of Service
					</Typography>
				</Box>
				<Box>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						Welcome to MealPrep360! By using our website and services, you agree
						to the following terms and conditions.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						1. Use of Service
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						You must be at least 13 years old to use MealPrep360. You agree to
						use the service only for lawful purposes.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						2. Account Registration
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						You are responsible for maintaining the confidentiality of your
						account and password. You agree to provide accurate information and
						notify us of any unauthorized use.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						3. Subscriptions & Payments
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						Some features require a paid subscription. By subscribing, you
						authorize us to charge your payment method on a recurring basis. You
						may cancel at any time; access to paid features will continue until
						the end of your billing period.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						4. User Content
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						You retain ownership of any recipes, notes, or content you upload.
						By posting content, you grant us a license to use, display, and
						improve our service.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						5. Prohibited Conduct
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						You agree not to:
						<br />
						- Use the service for unlawful or harmful purposes
						<br />
						- Attempt to access other users' data
						<br />- Reverse engineer or disrupt the service
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						6. Termination
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						We reserve the right to suspend or terminate your account for
						violations of these terms.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						7. Disclaimer & Limitation of Liability
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						MealPrep360 is provided &quot;as is.&quot; We do not guarantee the
						service will be error-free or uninterrupted. Our liability is
						limited to the amount you paid us in the past 12 months.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						8. Changes to Terms
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						We may update these Terms of Service at any time. Continued use of
						the service constitutes acceptance of the new terms.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						9. Contact
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						For questions about these terms, contact us at
						support@mealprep360.com.
					</Typography>
				</Box>
			</Container>
			{/* Footer */}
			<Box
				component='footer'
				sx={{
					backgroundColor: '#1A1A1A',
					color: '#E0E0E0',
					py: 3,
					textAlign: 'center',
					mt: 'auto',
				}}
			>
				© 2024 MealPrep360. All rights reserved.
				<Box
					component='span'
					sx={{
						ml: 2,
						a: { color: '#E0E0E0', textDecoration: 'none', mr: 1.5 },
						'a:hover': { textDecoration: 'underline' },
					}}
				>
					<a href='/privacy'>Privacy Policy</a>
					<span style={{ margin: '0 8px', color: '#888' }}>|</span>
					<a
						href='/terms'
						style={{ marginRight: 0 }}
					>
						Terms of Service
					</a>
				</Box>
			</Box>
		</Box>
	);
}
