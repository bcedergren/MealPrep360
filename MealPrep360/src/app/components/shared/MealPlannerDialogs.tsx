'use client';

import React from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	DialogContentText,
	Button,
	Box,
	Typography,
} from '@mui/material';
import {
	Warning as AlertCircle,
	Warning as AlertTriangle,
} from '@mui/icons-material';

// Delete confirmation dialog
interface DeleteConfirmDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
	open,
	onClose,
	onConfirm,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
	>
		<DialogTitle>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<AlertCircle sx={{ color: 'warning.main' }} />
				Confirm Delete
			</Box>
		</DialogTitle>
		<DialogContent>
			<Typography>
				Are you sure you want to delete this meal plan? This action cannot be
				undone.
			</Typography>
		</DialogContent>
		<DialogActions>
			<Button
				variant='outlined'
				onClick={onClose}
			>
				Cancel
			</Button>
			<Button
				variant='contained'
				color='error'
				onClick={onConfirm}
			>
				Delete
			</Button>
		</DialogActions>
	</Dialog>
);

// No recipes dialog
interface NoRecipesDialogProps {
	open: boolean;
	onClose: () => void;
	onBrowseRecipes: () => void;
}

export const NoRecipesDialog: React.FC<NoRecipesDialogProps> = ({
	open,
	onClose,
	onBrowseRecipes,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth='sm'
		fullWidth
	>
		<DialogTitle>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<AlertCircle sx={{ color: 'warning.main' }} />
				No Saved Recipes
			</Box>
		</DialogTitle>
		<DialogContent>
			<Typography>
				You need to save some recipes before generating a meal plan. Would you
				like to browse recipes now?
			</Typography>
		</DialogContent>
		<DialogActions>
			<Button
				variant='outlined'
				onClick={onClose}
			>
				Cancel
			</Button>
			<Button onClick={onBrowseRecipes}>Browse Recipes</Button>
		</DialogActions>
	</Dialog>
);

// Error dialog
interface ErrorDialogProps {
	open: boolean;
	onClose: () => void;
	message: string;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
	open,
	onClose,
	message,
}) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth='sm'
		fullWidth
	>
		<DialogTitle>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<AlertCircle sx={{ color: 'error.main' }} />
				Error Generating Meal Plan
			</Box>
		</DialogTitle>
		<DialogContent>
			<Typography>{message}</Typography>
		</DialogContent>
		<DialogActions>
			<Button
				variant='contained'
				onClick={onClose}
			>
				Close
			</Button>
		</DialogActions>
	</Dialog>
);

// Overwrite confirmation dialog
interface OverwriteConfirmationDialogProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
}

export const OverwriteConfirmationDialog: React.FC<
	OverwriteConfirmationDialogProps
> = ({ open, onClose, onConfirm }) => (
	<Dialog
		open={open}
		onClose={onClose}
		maxWidth='sm'
		fullWidth
	>
		<DialogTitle>
			<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
				<AlertTriangle sx={{ color: 'warning.main' }} />
				Overwrite Existing Meal Plan?
			</Box>
		</DialogTitle>
		<DialogContent>
			<DialogContentText>
				You already have a meal plan for some of these dates. Do you want to
				overwrite the existing plan?
			</DialogContentText>
		</DialogContent>
		<DialogActions>
			<Button
				variant='outlined'
				onClick={onClose}
			>
				Cancel
			</Button>
			<Button
				variant='contained'
				color='primary'
				onClick={onConfirm}
			>
				Overwrite
			</Button>
		</DialogActions>
	</Dialog>
);
