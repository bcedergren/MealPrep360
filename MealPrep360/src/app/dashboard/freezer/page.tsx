'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSubscription } from '@/contexts/subscription-context';
import { useRouter } from 'next/navigation';
import {
	Box,
	Typography,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Chip,
	Card,
	CardContent,
	CardActions,
} from '@mui/material';
import { Upgrade, Kitchen } from '@mui/icons-material';

interface FrozenItem {
	recipeId: string;
	recipe: {
		title: string;
		imageUrl?: string;
		servings: number;
		prepTime?: number;
	};
	totalServings: number;
	frozenDate: string;
	instances: number;
	daysFrozen: number;
}

interface FreezerInventory {
	items: FrozenItem[];
	total: number;
	totalServings: number;
}

export default function FreezerPage() {
	const { userId, isLoaded, isSignedIn } = useAuth();
	const { currentPlan, upgradePlan } = useSubscription();
	const router = useRouter();
	const [freezerInventory, setFreezerInventory] = useState<FreezerInventory>({
		items: [],
		total: 0,
		totalServings: 0,
	});
	const [loading, setLoading] = useState(true);
	const [selectedItem, setSelectedItem] = useState<FrozenItem | null>(null);
	const [printDialogOpen, setPrintDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [mounted, setMounted] = useState(false);

	// Check if user has access to freezer features
	const hasFreezerAccess = currentPlan && currentPlan !== 'FREE';

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (mounted && userId) {
			fetchFreezerInventory();
		}
	}, [mounted, userId, isLoaded, isSignedIn]);

	const fetchFreezerInventory = async () => {
		try {
			const response = await fetch('/api/freezer/inventory');
			const data = await response.json();

			if (response.ok) {
				// Handle both array (fallback) and object (normal) responses
				if (Array.isArray(data)) {
					// API returned array (fallback mode)
					setFreezerInventory({
						items: data,
						total: data.length,
						totalServings: data.reduce(
							(sum, item) => sum + (item.totalServings || 0),
							0
						),
					});
				} else {
					// API returned expected object structure
					setFreezerInventory(data);
				}
			} else {
				console.error(
					'Failed to fetch freezer inventory:',
					response.status,
					data.error
				);
				// Set empty inventory on error
				setFreezerInventory({
					items: [],
					total: 0,
					totalServings: 0,
				});
			}
		} catch (error) {
			console.error('Error fetching freezer inventory:', error);
			// Set empty inventory on error
			setFreezerInventory({
				items: [],
				total: 0,
				totalServings: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleConsumeItem = async (recipeId: string) => {
		try {
			const response = await fetch(`/api/freezer/inventory`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					recipeId,
					action: 'consume',
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to consume item');
			}

			await fetchFreezerInventory();
		} catch (error) {
			console.error('Error consuming item:', error);
		}
	};

	const handleDeleteClick = (item: FrozenItem) => {
		setSelectedItem(item);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedItem) return;

		try {
			const response = await fetch(`/api/freezer/inventory`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					recipeId: selectedItem.recipeId,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to delete item');
			}

			await fetchFreezerInventory();
		} catch (error) {
			console.error('Error deleting item:', error);
		} finally {
			setDeleteDialogOpen(false);
			setSelectedItem(null);
		}
	};

	const handlePrintClick = (item: FrozenItem) => {
		setSelectedItem(item);
		setPrintDialogOpen(true);
	};

	const handlePrint = () => {
		if (!selectedItem) return;

		const printWindow = window.open('', '_blank');
		if (!printWindow) return;

		const labelContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					@page { margin: 0; }
					body { 
						margin: 0.5in;
						font-family: Arial, sans-serif;
						display: flex;
						flex-direction: column;
						gap: 0.25in;
					}
					.title { 
						font-size: 24px; 
						font-weight: bold;
						text-align: center;
						margin-bottom: 0.25in;
					}
					.info-section {
						border-top: 1px solid #ccc;
						padding-top: 0.25in;
						margin-top: 0.25in;
					}
					.info-row {
						display: flex;
						justify-content: space-between;
						margin-bottom: 0.1in;
					}
					.label { font-weight: bold; }
					.date { font-size: 16px; }
					.servings { font-size: 16px; }
					.barcode { 
						margin-top: 0.25in;
						text-align: center;
					}
					.freeze-date {
						font-size: 14px;
						color: #666;
					}
				</style>
			</head>
			<body>
				<div class="title">${selectedItem.recipe?.title || 'Untitled Recipe'}</div>
				
				<div class="info-section">
					<div class="info-row">
						<span class="label">Frozen:</span>
						<span class="date">${new Date(
							selectedItem.frozenDate
						).toLocaleDateString()}</span>
					</div>
					<div class="info-row">
						<span class="label">Total Servings:</span>
						<span class="servings">${selectedItem.totalServings}</span>
					</div>
					<div class="info-row">
						<span class="label">Instances:</span>
						<span class="servings">${selectedItem.instances}</span>
					</div>
					<div class="info-row">
						<span class="label">Days Frozen:</span>
						<span class="freeze-date">${Math.round(selectedItem.daysFrozen)}</span>
					</div>
					<div class="info-row">
						<span class="label">Consume By:</span>
						<span class="freeze-date">${new Date(
							new Date(selectedItem.frozenDate).getTime() +
								90 * 24 * 60 * 60 * 1000
						).toLocaleDateString()}</span>
					</div>
				</div>

				<div class="barcode">
					<svg id="barcode"></svg>
				</div>
				<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
				<script>
					window.onload = function() {
						JsBarcode("#barcode", "${selectedItem.recipeId}", {
							format: "CODE128",
							lineColor: "#000",
							width: 2,
							height: 50,
							displayValue: false
						});
						window.print();
					}
				</script>
			</body>
			</html>
		`;

		printWindow.document.write(labelContent);
		printWindow.document.close();
	};

	const handlePrintClose = () => {
		setPrintDialogOpen(false);
	};

	// Upgrade message component for free users
	const UpgradeMessage = () => (
		<Card
			sx={{
				maxWidth: 600,
				mx: 'auto',
				mt: 4,
				textAlign: 'center',
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				color: 'white',
			}}
		>
			<CardContent sx={{ p: 4 }}>
				<Kitchen sx={{ fontSize: 64, mb: 2, opacity: 0.9 }} />
				<Typography
					variant='h4'
					sx={{ mb: 2, fontWeight: 600 }}
				>
					Freezer Management
				</Typography>
				<Typography
					variant='h6'
					sx={{ mb: 3, opacity: 0.9 }}
				>
					Track your frozen meals and never waste food again
				</Typography>
				<Typography
					variant='body1'
					sx={{ mb: 3, opacity: 0.8 }}
				>
					Upgrade to a paid plan to access freezer management features. Mark
					meals as "frozen" in your meal planner and track them here with
					expiration dates, serving counts, and printable labels.
				</Typography>
				<Box
					sx={{
						display: 'flex',
						gap: 2,
						justifyContent: 'center',
						flexWrap: 'wrap',
					}}
				>
					<Button
						variant='contained'
						size='large'
						startIcon={<Upgrade />}
						onClick={() => router.push('/pricing')}
						sx={{
							bgcolor: 'white',
							color: 'primary.main',
							'&:hover': {
								bgcolor: 'grey.100',
							},
						}}
					>
						View Plans
					</Button>
					<Button
						variant='outlined'
						size='large'
						onClick={() => router.push('/dashboard/meal-planner')}
						sx={{
							borderColor: 'white',
							color: 'white',
							'&:hover': {
								borderColor: 'grey.300',
								bgcolor: 'rgba(255,255,255,0.1)',
							},
						}}
					>
						Back to Meal Planner
					</Button>
				</Box>
			</CardContent>
		</Card>
	);

	if (!mounted || loading) {
		return (
			<Box
				sx={{
					p: 3,
					textAlign: 'center',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 2,
				}}
			>
				<Typography>Loading...</Typography>
			</Box>
		);
	}

	// Show upgrade message for free users
	if (!hasFreezerAccess) {
		return (
			<Box sx={{ p: 3 }}>
				<UpgradeMessage />
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			{freezerInventory.items.length === 0 ? (
				<Box sx={{ textAlign: 'center', mt: 4 }}>
					<Typography
						variant='h6'
						color='text.secondary'
					>
						No items in your freezer
					</Typography>
					<Typography
						variant='body2'
						color='text.secondary'
						sx={{ mt: 1 }}
					>
						Mark meals as "frozen" in your meal planner to see them here
					</Typography>
				</Box>
			) : (
				<Box sx={{ mt: 2 }}>
					<Box
						sx={{
							mb: 3,
							display: 'flex',
							gap: 2,
							flexWrap: 'wrap',
							justifyContent: { xs: 'center', sm: 'flex-start' },
						}}
					>
						<Chip
							label={`${freezerInventory.total} Recipe${
								freezerInventory.total !== 1 ? 's' : ''
							}`}
							color='primary'
							variant='outlined'
						/>
						<Chip
							label={`${freezerInventory.totalServings} Total Servings`}
							color='secondary'
							variant='outlined'
						/>
					</Box>
					{freezerInventory.items.map((item) => (
						<Box
							key={item.recipeId}
							sx={{
								p: 2,
								mb: 2,
								border: '1px solid',
								borderColor: 'divider',
								borderRadius: 1,
								display: 'flex',
								flexDirection: { xs: 'column', sm: 'row' },
								justifyContent: 'space-between',
								alignItems: { xs: 'stretch', sm: 'center' },
							}}
						>
							<Box>
								<Typography variant='h6'>
									{item.recipe?.title || 'Untitled Recipe'}
								</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									Frozen: {new Date(item.frozenDate).toLocaleDateString()}
								</Typography>
								<Typography
									variant='body2'
									color='text.secondary'
								>
									{item.totalServings} servings • {item.instances} instance
									{item.instances !== 1 ? 's' : ''} •{' '}
									{Math.round(item.daysFrozen)} days frozen
								</Typography>
							</Box>
							<Box
								sx={{
									display: 'flex',
									gap: 1,
									flexDirection: { xs: 'column', sm: 'row' },
									minWidth: { xs: '100%', sm: 'auto' },
									mt: { xs: 2, sm: 0 },
								}}
							>
								<Button
									variant='outlined'
									onClick={() => handlePrintClick(item)}
									fullWidth={true}
								>
									Print Label
								</Button>
								<Button
									variant='outlined'
									color='primary'
									onClick={() => handleConsumeItem(item.recipeId)}
									fullWidth={true}
								>
									Consume
								</Button>
								<Button
									variant='outlined'
									color='error'
									onClick={() => handleDeleteClick(item)}
									fullWidth={true}
								>
									Delete
								</Button>
							</Box>
						</Box>
					))}
				</Box>
			)}

			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
			>
				<DialogTitle>Delete Frozen Item</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to remove this item from your freezer?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleDeleteConfirm}
						color='error'
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={printDialogOpen}
				onClose={handlePrintClose}
			>
				<DialogTitle>Print Label</DialogTitle>
				<DialogContent>
					<Typography>
						A new window will open with the label. Please allow pop-ups if
						prompted.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={handlePrintClose}>Cancel</Button>
					<Button
						onClick={handlePrint}
						color='primary'
					>
						Print
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
