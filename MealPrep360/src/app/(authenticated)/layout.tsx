import { MainNav } from '../components/shared/navigation/main-nav';

export default function AuthenticatedLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<MainNav />
			{children}
		</>
	);
}
