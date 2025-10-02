'use client';

import React from 'react';
import {
	Box,
	Typography,
	Paper,
	TextField,
	Switch,
	FormControlLabel,
	Divider,
	Button,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
	IconButton,
	Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

export default function AdminSettingsPage() {
	// Placeholder state for toggles and admin users
	const [siteName, setSiteName] = React.useState('MealPrep360');
	const [supportEmail, setSupportEmail] = React.useState(
		'support@mealprep360.com'
	);
	const [enableRecipeGen, setEnableRecipeGen] = React.useState(true);
	const [enableFeedback, setEnableFeedback] = React.useState(true);
	const [adminUsers, setAdminUsers] = React.useState([
		{ id: 1, name: 'Admin User', email: 'admin@mealprep360.com' },
	]);
	const [newAdminEmail, setNewAdminEmail] = React.useState('');

	const handleAddAdmin = () => {
		if (newAdminEmail.trim()) {
			setAdminUsers([
				...adminUsers,
				{ id: Date.now(), name: 'New Admin', email: newAdminEmail },
			]);
			setNewAdminEmail('');
		}
	};

	const handleRemoveAdmin = (id: number) => {
		setAdminUsers(adminUsers.filter((user) => user.id !== id));
	};

	return (
		<Box sx={{ p: { xs: 2, md: 4 } }}>
			<Paper
				elevation={3}
				sx={{ p: 4, mb: 4 }}
			>
				<Typography
					variant='h4'
					sx={{ fontWeight: 'bold', mb: 2 }}
				>
					Admin Settings
				</Typography>
				<Divider sx={{ my: 3 }} />

				{/* General Settings */}
				<Typography
					variant='h6'
					sx={{ fontWeight: 'bold', mb: 2 }}
				>
					General
				</Typography>
				<Stack
					direction={{ xs: 'column', sm: 'row' }}
					spacing={2}
					sx={{ mb: 3 }}
				>
					<TextField
						label='Site Name'
						value={siteName}
						onChange={(e) => setSiteName(e.target.value)}
						fullWidth
					/>
					<TextField
						label='Support Email'
						value={supportEmail}
						onChange={(e) => setSupportEmail(e.target.value)}
						fullWidth
					/>
				</Stack>

				<Divider sx={{ my: 3 }} />

				{/* Feature Toggles */}
				<Typography
					variant='h6'
					sx={{ fontWeight: 'bold', mb: 2 }}
				>
					Feature Toggles
				</Typography>
				<FormControlLabel
					control={
						<Switch
							checked={enableRecipeGen}
							onChange={() => setEnableRecipeGen((v) => !v)}
						/>
					}
					label='Enable Recipe Generation'
				/>
				<FormControlLabel
					control={
						<Switch
							checked={enableFeedback}
							onChange={() => setEnableFeedback((v) => !v)}
						/>
					}
					label='Enable Feedback Collection'
				/>

				<Divider sx={{ my: 3 }} />

				{/* Admin User Management */}
				<Typography
					variant='h6'
					sx={{ fontWeight: 'bold', mb: 2 }}
				>
					Admin Users
				</Typography>
				<Stack
					direction='row'
					spacing={2}
					sx={{ mb: 3 }}
				>
					<TextField
						label='New Admin Email'
						value={newAdminEmail}
						onChange={(e) => setNewAdminEmail(e.target.value)}
						fullWidth
					/>
					<Button
						variant='contained'
						startIcon={<AddIcon />}
						onClick={handleAddAdmin}
						sx={{ minWidth: '150px' }}
					>
						Add Admin
					</Button>
				</Stack>

				<List>
					{adminUsers.map((user) => (
						<ListItem key={user.id}>
							<ListItemText
								primary={user.name}
								secondary={user.email}
							/>
							<ListItemSecondaryAction>
								<IconButton
									edge='end'
									aria-label='delete'
									onClick={() => handleRemoveAdmin(user.id)}
								>
									<DeleteIcon />
								</IconButton>
							</ListItemSecondaryAction>
						</ListItem>
					))}
				</List>

				<Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						variant='contained'
						color='primary'
					>
						Save Changes
					</Button>
				</Box>
			</Paper>
		</Box>
	);
}
