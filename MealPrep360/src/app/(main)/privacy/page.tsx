export const dynamic = 'force-dynamic';

import * as React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy(): React.ReactElement {
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
						Privacy Policy
					</Typography>
				</Box>
				<Box>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						MealPrep360 (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is
						committed to protecting your privacy. This Privacy Policy explains
						how we collect, use, disclose, and safeguard your information when
						you use our website and services.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						Information We Collect
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						<strong>Personal Information:</strong> When you sign up, we may
						collect your name, email address, and payment information.
						<br />
						<strong>Usage Data:</strong> We collect information about how you
						use our service, such as features accessed, recipes saved, and
						device/browser information.
						<br />
						<strong>Cookies:</strong> We use cookies and similar technologies to
						enhance your experience and analyze usage.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						How We Use Your Information
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						- To provide, operate, and maintain our services
						<br />
						- To improve, personalize, and expand our services
						<br />
						- To communicate with you, including sending updates and support
						<br />
						- To process transactions and manage subscriptions
						<br />- To comply with legal obligations
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						How We Share Your Information
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						<strong>Service Providers:</strong> We may share your information
						with trusted third parties who help us operate our service (e.g.,
						payment processors, analytics).
						<br />
						<strong>Legal Requirements:</strong> We may disclose your
						information if required by law or to protect our rights.
						<br />
						<strong>No Sale of Data:</strong> We do not sell your personal
						information to third parties.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						Data Security
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						We use industry-standard security measures to protect your data.
						However, no method of transmission over the Internet is 100% secure.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						Your Rights
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						You may access, update, or delete your personal information at any
						time by logging into your account or contacting us.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						Children's Privacy
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						Our service is not intended for children under 13. We do not
						knowingly collect data from children.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						Changes to This Policy
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						We may update this Privacy Policy from time to time. We will notify
						you of any changes by posting the new policy on this page.
					</Typography>
					<Typography
						variant='h4'
						sx={{ fontWeight: 'bold', mt: 4, mb: 2, fontSize: '1.5rem' }}
					>
						Contact Us
					</Typography>
					<Typography
						variant='body1'
						sx={{ mb: 2, textAlign: 'left' }}
					>
						If you have any questions about this Privacy Policy, please contact
						us at support@mealprep360.com.
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
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					alignItems: 'center',
					justifyContent: 'center',
					gap: 1,
				}}
			>
				<Box
					component='span'
					sx={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						mb: { xs: 1, sm: 0 },
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
				<Typography
					variant='body2'
					sx={{ color: '#A0A0A0', fontSize: '0.9rem' }}
				>
					© 2024 MealPrep360. All rights reserved.
				</Typography>
			</Box>
		</Box>
	);
}
