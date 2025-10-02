'use client';

import { Snackbar, Alert } from '@mui/material';
import { createContext, useContext, useState } from 'react';

type SnackbarContextType = {
	showSnackbar: (
		message: string,
		severity?: 'success' | 'error' | 'warning' | 'info'
	) => void;
};

const SnackbarContext = createContext<SnackbarContextType>({
	showSnackbar: () => {},
});

export function useSnackbar() {
	return useContext(SnackbarContext);
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState('');
	const [severity, setSeverity] = useState<
		'success' | 'error' | 'warning' | 'info'
	>('success');

	const showSnackbar = (
		message: string,
		severity: 'success' | 'error' | 'warning' | 'info' = 'success'
	) => {
		setMessage(message);
		setSeverity(severity);
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<SnackbarContext.Provider value={{ showSnackbar }}>
			{children}
			<Snackbar
				open={open}
				autoHideDuration={5000}
				onClose={handleClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert
					onClose={handleClose}
					severity={severity}
					sx={{ width: '100%' }}
				>
					{message}
				</Alert>
			</Snackbar>
		</SnackbarContext.Provider>
	);
}
