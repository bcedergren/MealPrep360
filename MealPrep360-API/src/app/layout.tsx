// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
	title: 'MealPrep360 API',
	description: 'API Service for MealPrep360',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>{children}</body>
		</html>
	);
}
