import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface UserRoleData {
	role: string;
	isLoading: boolean;
	error: string | null;
}

export function useUserRole(): UserRoleData {
	const { user, isLoaded } = useUser();
	const [role, setRole] = useState<string>('USER');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchUserRole = async () => {
			if (!isLoaded || !user) {
				setIsLoading(false);
				return;
			}

			try {
				setIsLoading(true);
				setError(null);

				// Fetch user role from your API
				const response = await fetch('/api/user/role', {
					credentials: 'include',
				});

				if (!response.ok) {
					throw new Error(`Failed to fetch user role: ${response.status}`);
				}

				const data = await response.json();
				setRole(data.role || 'USER');
			} catch (err) {
				console.error('Error fetching user role:', err);
				setError(
					err instanceof Error ? err.message : 'Failed to fetch user role'
				);
				setRole('USER'); // Default to USER role on error
			} finally {
				setIsLoading(false);
			}
		};

		fetchUserRole();
	}, [isLoaded, user]);

	return {
		role,
		isLoading,
		error,
	};
}
