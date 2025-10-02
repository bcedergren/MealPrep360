import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import ThemeProvider from './_components/shared/theme/theme-provider';
import RootLayoutWrapper from './_components/shared/layout/root-layout-wrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'MealPrep360 Admin',
	description: 'Admin dashboard for MealPrep360',
	icons: {
		icon: [{ url: '/favicon.ico', sizes: 'any' }],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider>
			<html
				lang='en'
				suppressHydrationWarning
			>
				<head>
					<link
						rel='icon'
						href='/favicon.ico'
						sizes='any'
					/>
				</head>
				<body
					className={inter.className}
					suppressHydrationWarning
				>
					<ThemeProvider>
						<RootLayoutWrapper>{children}</RootLayoutWrapper>
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
