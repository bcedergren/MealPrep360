'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { StyledEngineProvider } from '@mui/material/styles';
import { ErrorBoundary } from 'react-error-boundary';
import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';
import { usePathname } from 'next/navigation';
import { useLanguage, LanguageProvider } from '@/contexts/language-context';
import { SubscriptionProvider } from '@/contexts/subscription-context';

type DisplaySettings = {
	recipeLayout: 'grid' | 'list';
	fontSize: 'small' | 'medium' | 'large';
	imageQuality: 'low' | 'medium' | 'high';
};

export const DisplayContext = createContext<{
	displaySettings: DisplaySettings;
}>({
	displaySettings: {
		recipeLayout: 'grid',
		fontSize: 'medium',
		imageQuality: 'medium',
	},
});

export function useDisplay() {
	return useContext(DisplayContext);
}

const fontSizeMap = {
	small: 14,
	medium: 16,
	large: 18,
};

function ThemeWrapper({ children }: { children: React.ReactNode }) {
	const { settings } = useSettings();
	const [mounted, setMounted] = useState(false);
	const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

	// Handle mounting and initial theme
	useEffect(() => {
		setMounted(true);
		// Set initial system theme
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
	}, []);

	// Handle system theme changes
	useEffect(() => {
		if (!mounted) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			setSystemTheme(e.matches ? 'dark' : 'light');
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [mounted]);

	// Create theme with proper color mode
	const theme = useMemo(() => {
		// Determine the effective theme mode
		let mode: 'light' | 'dark';
		if (!mounted) {
			mode = 'light'; // Default to light mode before hydration
		} else if (settings?.theme?.mode === 'system') {
			mode = systemTheme;
		} else {
			mode = settings?.theme?.mode || 'light';
		}

		const newTheme = createTheme({
			palette: {
				mode,
				primary: {
					main: '#2196F3',
					light: '#42A5F5',
					dark: '#1565C0',
				},
				secondary: {
					main: '#FF4081',
					light: '#FF4081',
					dark: '#C51162',
				},
				background: {
					default: mode === 'dark' ? '#121212' : '#f5f5f5',
					paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
				},
				text: {
					primary: mode === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
					secondary:
						mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
				},
			},
			components: {
				MuiCssBaseline: {
					styleOverrides: {
						'html, body': {
							margin: 0,
							padding: 0,
							minHeight: '100vh',
							backgroundColor: mode === 'dark' ? '#121212' : '#f5f5f5',
							color: mode === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.87)',
							transition:
								'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
						},
					},
				},
				MuiPaper: {
					styleOverrides: {
						root: {
							backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
						},
					},
				},
				MuiAppBar: {
					styleOverrides: {
						root: {
							backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
						},
					},
				},
			},
			typography: {
				fontSize: fontSizeMap[settings?.display?.fontSize || 'medium'],
			},
		});

		// Apply theme to document immediately
		if (mounted) {
			document.body.style.backgroundColor = newTheme.palette.background.default;
			document.body.style.color = newTheme.palette.text.primary;
		}

		return newTheme;
	}, [
		mounted,
		settings?.theme?.mode,
		settings?.display?.fontSize,
		systemTheme,
	]);

	return (
		<StyledEngineProvider injectFirst>
			<DisplayContext.Provider
				value={{
					displaySettings: settings?.display || {
						recipeLayout: 'grid',
						fontSize: 'medium',
						imageQuality: 'medium',
					},
				}}
			>
				<ThemeProvider theme={theme}>
					<CssBaseline />
					{children}
				</ThemeProvider>
			</DisplayContext.Provider>
		</StyledEngineProvider>
	);
}

function ErrorFallback({ error }: { error: Error }) {
	return (
		<div
			style={{
				padding: '20px',
				textAlign: 'center',
				color: 'red',
			}}
		>
			<h2>Error</h2>
			<pre>{error.message}</pre>
		</div>
	);
}

export function Providers({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);
	const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
	const pathname = usePathname();

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!clerkKey) {
		throw new Error('Missing Clerk Publishable Key');
	}

	if (!mounted) {
		return (
			<div suppressHydrationWarning>
				<div
					style={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						minHeight: '100vh',
						backgroundColor: '#f5f5f5',
					}}
				>
					Loading...
				</div>
			</div>
		);
	}

	const isAuthOrLandingPage = pathname === '/' || pathname?.startsWith('/auth');

	return (
		<>
			{/* @ts-ignore */}
			<ClerkProvider
				publishableKey={clerkKey}
				signInFallbackRedirectUrl='/dashboard'
				signUpFallbackRedirectUrl='/dashboard'
				signInUrl='/auth/signin'
				signUpUrl='/auth/signup'
			>
				<SettingsProvider>
					<LanguageProvider>
						<SubscriptionProvider>
							{isAuthOrLandingPage ? (
								<ThemeProvider
									theme={createTheme({ palette: { mode: 'light' } })}
								>
									<CssBaseline />
									{children}
								</ThemeProvider>
							) : (
								<ThemeWrapper>{children}</ThemeWrapper>
							)}
						</SubscriptionProvider>
					</LanguageProvider>
				</SettingsProvider>
			</ClerkProvider>
		</>
	);
}
