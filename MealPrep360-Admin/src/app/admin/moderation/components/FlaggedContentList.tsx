'use client';

import { useState, useEffect } from 'react';
import {
	Card,
	CardContent,
	Typography,
	Box,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Stack,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { clientAdminApiClient } from '@/lib/apiClient';

interface FlaggedContent {
	_id: string;
	contentType: 'post' | 'comment' | 'user';
	contentId: string;
	reason: string;
	status: 'pending' | 'reviewed' | 'resolved';
	reportedBy: { displayName: string }[];
	resolution?: {
		action: 'removed' | 'warned' | 'ignored';
		notes: string;
		resolvedBy: { displayName: string };
		resolvedAt: string;
	};
	createdAt: string;
}

async function getFlaggedContent(status?: string, contentType?: string) {
	const params: Record<string, string> = {};
	if (status) params.status = status;
	if (contentType) params.contentType = contentType;

	return await clientAdminApiClient.getFlaggedContent(params);
}

export function FlaggedContentList() {
	const [selectedStatus, setSelectedStatus] = useState<string>('');
	const [selectedType, setSelectedType] = useState<string>('');
	const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(
		null
	);
	const [resolutionNotes, setResolutionNotes] = useState('');
	const [isResolving, setIsResolving] = useState(false);
	const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
	const [pagination, setPagination] = useState<{
		total: number;
		page: number;
		limit: number;
		pages: number;
	} | null>(null);

	useEffect(() => {
		getFlaggedContent(selectedStatus, selectedType)
			.then((data) => {
				setFlaggedContent(data.flaggedContent);
				setPagination(data.pagination);
			})
			.catch((error) => {
				console.error('Failed to fetch flagged content:', error);
			});
	}, [selectedStatus, selectedType]);

	const handleResolve = async (action: 'removed' | 'warned' | 'ignored') => {
		if (!selectedContent) return;

		setIsResolving(true);
		try {
			await clientAdminApiClient.updateFlaggedContent({
				id: selectedContent._id,
				action,
				notes: resolutionNotes,
			});

			// Refresh the list
			window.location.reload();
		} catch (error) {
			console.error('Failed to resolve content:', error);
		} finally {
			setIsResolving(false);
			setSelectedContent(null);
			setResolutionNotes('');
		}
	};

	const columns: GridColDef[] = [
		{
			field: 'contentType',
			headerName: 'Type',
			width: 100,
			renderCell: (params) => (
				<Chip
					label={params.value}
					size='small'
					variant='outlined'
				/>
			),
		},
		{
			field: 'reason',
			headerName: 'Reason',
			flex: 1,
		},
		{
			field: 'reportedBy',
			headerName: 'Reported By',
			width: 200,
			valueGetter: (params: { value: { displayName: string }[] }) =>
				params.value.map((r) => r.displayName).join(', '),
		},
		{
			field: 'status',
			headerName: 'Status',
			width: 120,
			renderCell: (params) => (
				<Chip
					label={params.value}
					size='small'
					color={
						params.value === 'pending'
							? 'primary'
							: params.value === 'reviewed'
							? 'secondary'
							: 'default'
					}
				/>
			),
		},
		{
			field: 'createdAt',
			headerName: 'Reported At',
			width: 180,
			valueGetter: (params: { value: string }) =>
				new Date(params.value).toLocaleString(),
		},
	];

	return (
		<Card>
			<CardContent>
				<Typography
					variant='h6'
					gutterBottom
				>
					Flagged Content
				</Typography>

				<Stack
					direction='row'
					spacing={2}
					sx={{ mb: 2 }}
				>
					<FormControl
						size='small'
						sx={{ minWidth: 180 }}
					>
						<InputLabel>Status</InputLabel>
						<Select
							value={selectedStatus}
							label='Status'
							onChange={(e) => setSelectedStatus(e.target.value)}
						>
							<MenuItem value=''>All Status</MenuItem>
							<MenuItem value='pending'>Pending</MenuItem>
							<MenuItem value='reviewed'>Reviewed</MenuItem>
							<MenuItem value='resolved'>Resolved</MenuItem>
						</Select>
					</FormControl>

					<FormControl
						size='small'
						sx={{ minWidth: 180 }}
					>
						<InputLabel>Content Type</InputLabel>
						<Select
							value={selectedType}
							label='Content Type'
							onChange={(e) => setSelectedType(e.target.value)}
						>
							<MenuItem value=''>All Types</MenuItem>
							<MenuItem value='post'>Posts</MenuItem>
							<MenuItem value='comment'>Comments</MenuItem>
							<MenuItem value='user'>Users</MenuItem>
						</Select>
					</FormControl>
				</Stack>

				<Box sx={{ height: 400 }}>
					<DataGrid
						rows={flaggedContent}
						columns={columns}
						getRowId={(row) => row._id}
						onRowClick={(params) => setSelectedContent(params.row)}
						pageSize={10}
					/>
				</Box>

				<Dialog
					open={!!selectedContent}
					onClose={() => setSelectedContent(null)}
					maxWidth='sm'
					fullWidth
				>
					<DialogTitle>Resolve Flagged Content</DialogTitle>
					<DialogContent>
						{selectedContent && (
							<Box sx={{ mt: 2 }}>
								<Typography
									variant='subtitle1'
									gutterBottom
								>
									Report Details
								</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
									paragraph
								>
									{selectedContent.reason}
								</Typography>

								<TextField
									fullWidth
									multiline
									rows={4}
									label='Resolution Notes'
									value={resolutionNotes}
									onChange={(e) => setResolutionNotes(e.target.value)}
									sx={{ mt: 2 }}
								/>
							</Box>
						)}
					</DialogContent>
					<DialogActions>
						<Button
							onClick={() => handleResolve('ignored')}
							disabled={isResolving}
						>
							Ignore
						</Button>
						<Button
							onClick={() => handleResolve('warned')}
							disabled={isResolving}
							color='warning'
						>
							Warn User
						</Button>
						<Button
							onClick={() => handleResolve('removed')}
							disabled={isResolving}
							color='error'
						>
							Remove Content
						</Button>
					</DialogActions>
				</Dialog>
			</CardContent>
		</Card>
	);
}
