'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useMemo } from 'react';

export default function ClientThemeProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const theme = useMemo(
		() =>
			createTheme({
				palette: {
					mode: 'light',
					primary: {
						main: '#1976d2',
					},
					secondary: {
						main: '#dc004e',
					},
					background: {
						default: '#f5f5f5',
						paper: '#ffffff',
					},
				},
				typography: {
					fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
				},
				components: {
					MuiButton: {
						styleOverrides: {
							root: {
								textTransform: 'none',
							},
						},
					},
					MuiPaper: {
						styleOverrides: {
							root: {
								backgroundImage: 'none',
							},
						},
					},
				},
			}),
		[]
	);

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
}
