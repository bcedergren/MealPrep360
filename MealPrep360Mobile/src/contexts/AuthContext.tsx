import {
	useAuth as useClerkAuth,
	useSignIn,
	useSignUp,
	useUser,
} from '@clerk/clerk-expo';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthUser {
	id: string;
	email: string;
	name: string;
	imageUrl?: string;
}

interface AuthContextType {
	user: AuthUser | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, name: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshUser: () => Promise<void>;
	setActive: (session: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const { isLoaded, isSignedIn, signOut: clerkSignOut } = useClerkAuth();
	const { user: clerkUser } = useUser();
	const { signIn: clerkSignIn } = useSignIn();
	const { signUp: clerkSignUp } = useSignUp();

	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (isLoaded) {
			if (isSignedIn && clerkUser) {
				// Convert Clerk user to our user format
				setUser({
					id: clerkUser.id,
					email: clerkUser.primaryEmailAddress?.emailAddress || '',
					name: clerkUser.fullName || clerkUser.firstName || 'User',
					imageUrl: clerkUser.imageUrl,
				});
			} else {
				setUser(null);
			}
			setIsLoading(false);
		}
	}, [isLoaded, isSignedIn, clerkUser]);

	const signIn = async (email: string, password: string): Promise<void> => {
		try {
			setIsLoading(true);
			const result = await clerkSignIn?.create({
				identifier: email,
				password,
			});

			if (result?.status === 'complete') {
				// User will be updated through useEffect
				router.replace('/(tabs)/');
			} else {
				throw new Error('Sign in incomplete');
			}
		} catch (error) {
			console.error('Sign in error:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const signUp = async (
		email: string,
		password: string,
		name: string
	): Promise<void> => {
		try {
			setIsLoading(true);
			const result = await clerkSignUp?.create({
				emailAddress: email,
				password,
				firstName: name.split(' ')[0],
				lastName: name.split(' ').slice(1).join(' ') || undefined,
			});

			if (result?.status === 'complete') {
				// User will be updated through useEffect
				router.replace('/(tabs)/');
			} else if (result?.status === 'missing_requirements') {
				// Handle email verification if required
				throw new Error('Email verification required');
			} else {
				throw new Error('Sign up incomplete');
			}
		} catch (error) {
			console.error('Sign up error:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const signOut = async (): Promise<void> => {
		try {
			setIsLoading(true);
			await clerkSignOut?.();
			setUser(null);
			router.replace('/login');
		} catch (error) {
			console.error('Sign out error:', error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const refreshUser = async (): Promise<void> => {
		try {
			if (clerkUser) {
				setUser({
					id: clerkUser.id,
					email: clerkUser.primaryEmailAddress?.emailAddress || '',
					name: clerkUser.fullName || clerkUser.firstName || 'User',
					imageUrl: clerkUser.imageUrl,
				});
			}
		} catch (error) {
			console.error('Refresh user error:', error);
		}
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isAuthenticated: !!user,
		signIn,
		signUp,
		signOut,
		refreshUser,
		setActive: async (session: any) => {
			// This is a placeholder implementation
			console.log('setActive called with session:', session);
		},
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
