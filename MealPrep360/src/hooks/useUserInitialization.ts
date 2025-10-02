import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';

export function useUserInitialization() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const { user } = useUser();
	const [isInitialized, setIsInitialized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);

	useEffect(() => {
		async function initializeUser() {
			if (
				!isLoaded ||
				!isSignedIn ||
				!userId ||
				!user ||
				isInitialized ||
				isInitializing
			) {
				return;
			}

			// Check if user has been initialized in this session
			const sessionKey = `user_initialized_${userId}`;
			if (sessionStorage.getItem(sessionKey)) {
				setIsInitialized(true);
				return;
			}

			setIsInitializing(true);

			try {
				const response = await fetch('/api/user/sync', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (response.ok) {
					const result = await response.json();

					// Mark user as initialized for this session
					sessionStorage.setItem(sessionKey, 'true');
					setIsInitialized(true);
				} else {
					// If sync fails, still mark as "initialized" to prevent repeated attempts
					// The API routes will handle user creation on-demand

					sessionStorage.setItem(sessionKey, 'true');
					setIsInitialized(true);
				}
			} catch (error) {
				// Don't mark as initialized so it can retry later
			} finally {
				setIsInitializing(false);
			}
		}

		initializeUser();
	}, [isLoaded, isSignedIn, userId, user, isInitialized, isInitializing]);

	return {
		isInitialized,
		isInitializing,
	};
}
