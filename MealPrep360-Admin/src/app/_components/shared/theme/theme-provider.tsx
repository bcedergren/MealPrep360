'use client';

import ClientThemeProvider from './client-theme-provider';

export default function ThemeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return <ClientThemeProvider>{children}</ClientThemeProvider>;
}
