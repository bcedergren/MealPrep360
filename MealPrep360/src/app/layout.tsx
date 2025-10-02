import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Box } from '@mui/material';
import { Providers } from './components/shared/providers';
import { FallbackNotification } from './components/shared/FallbackNotification';
import { SnackbarProvider } from './components/ui/snackbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'MealPrep360',
	description:
		'Your AI-powered kitchen companion for smart meal planning, recipe management, and cooking assistance. Save time and reduce food waste with personalized recommendations.',
	icons: {
		icon: [
			{
				url: '/favicon.ico',
				sizes: 'any',
			},
		],
		apple: [
			{
				url: '/apple-touch-icon.png',
				sizes: '180x180',
			},
		],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<body
				className={inter.className}
				suppressHydrationWarning
			>
				<Providers>
					<SnackbarProvider>
						<FallbackNotification />
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								minHeight: '100vh',
								position: 'relative',
							}}
						>
							{children}
						</Box>
					</SnackbarProvider>
				</Providers>
			</body>
		</html>
	);
}
