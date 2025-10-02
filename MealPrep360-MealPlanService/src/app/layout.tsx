import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({
	variable: '--font-sans',
	subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
	variable: '--font-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'MealPrep360 Meal Plan Service',
	description:
		'Generate and manage your meal plans based on your saved recipes',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={`${inter.variable} ${jetbrainsMono.variable}`}>
				<ClerkProvider>{children}</ClerkProvider>
			</body>
		</html>
	);
}
