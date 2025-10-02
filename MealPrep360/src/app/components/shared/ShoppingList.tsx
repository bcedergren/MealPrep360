'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Typography,
	List,
	ListItem,
	ListItemText,
	Checkbox,
	IconButton,
	Paper,
	Stack,
	Button,
	CircularProgress,
	Divider,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Snackbar,
	Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import WarningIcon from '@mui/icons-material/Warning';
import Image from 'next/image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
	ShoppingListItem,
	normalizeShoppingListItems,
	formatQuantityDisplayAuto,
	groupItemsByCategory,
} from '@/lib/utils/shopping-list-utils';

interface ShoppingList {
	_id?: string;
	id?: string;
	name: string;
	status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
	items: ShoppingListItem[];
}

interface ShoppingListProps {
	shoppingList: ShoppingList | null;
	onUpdate: (deleted?: boolean) => void;
}

export function ShoppingList({ shoppingList, onUpdate }: ShoppingListProps) {
	const [items, setItems] = useState<ShoppingListItem[]>(
		shoppingList?.items ? normalizeShoppingListItems(shoppingList.items) : []
	);
	const [isUpdating, setIsUpdating] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
	const [deleteItemDialog, setDeleteItemDialog] = useState<{
		open: boolean;
		itemId: string;
		itemName: string;
	}>({ open: false, itemId: '', itemName: '' });
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: 'success' | 'error' | 'info' | 'warning';
	}>({
		open: false,
		message: '',
		severity: 'success',
	});
	const listRef = useRef<HTMLDivElement>(null);
	const printRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const normalizedItems = shoppingList?.items
			? normalizeShoppingListItems(shoppingList.items)
			: [];
		setItems(normalizedItems);
	}, [shoppingList]);

	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const handleToggleItem = async (itemId: string) => {
		if (!shoppingList || !shoppingList._id) return;

		setIsUpdating(true);
		try {
			const shoppingListId = shoppingList._id;
			const currentItem = items.find((item) => item._id === itemId);
			if (!currentItem) return;

			let itemIndex = -1;

			if (currentItem._id) {
				// Find by _id if available
				itemIndex = shoppingList?.items?.findIndex(
					(originalItem) => originalItem._id === currentItem._id
				);
			} else {
				// Find the item in the original shopping list items
				itemIndex = shoppingList?.items?.findIndex(
					(originalItem) =>
						originalItem.name === currentItem.name &&
						originalItem.category === currentItem.category &&
						originalItem.quantity === currentItem.quantity &&
						originalItem.unit === currentItem.unit
				);
			}

			if (itemIndex === -1) {
				setSnackbar({
					open: true,
					message: 'Item not found in shopping list',
					severity: 'error',
				});
				return;
			}

			const newStatus =
				currentItem.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

			const response = await fetch(
				`/api/shopping-lists/${shoppingListId}/items/${itemIndex}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						status: newStatus,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`Failed to update item status: ${errorData}`);
			}

			// Update local state
			setItems((prevItems) =>
				prevItems.map((item) =>
					item._id === itemId ? { ...item, status: newStatus } : item
				)
			);

			// Show success message
			setSnackbar({
				open: true,
				message: 'Item status updated successfully',
				severity: 'success',
			});

			// Refresh the shopping list to sync with server
			onUpdate();
		} catch (error) {
			setSnackbar({
				open: true,
				message:
					error instanceof Error
						? error.message
						: 'Failed to update item status',
				severity: 'error',
			});
		} finally {
			setIsUpdating(false);
		}
	};

	const handleDeleteItemClick = (itemId: string, itemName: string) => {
		setDeleteItemDialog({
			open: true,
			itemId,
			itemName,
		});
	};

	const handleConfirmDeleteItem = async () => {
		const { itemId } = deleteItemDialog;
		if (!shoppingList || !shoppingList._id || !itemId) return;

		setIsUpdating(true);
		try {
			const shoppingListId = shoppingList._id;
			const currentItem = items.find((item) => item._id === itemId);
			if (!currentItem) return;

			let itemIndex = -1;

			if (currentItem._id) {
				// Find by _id if available
				itemIndex = shoppingList?.items?.findIndex(
					(originalItem) => originalItem._id === currentItem._id
				);
			} else {
				// Find the item in the original shopping list items
				itemIndex = shoppingList?.items?.findIndex(
					(originalItem) =>
						originalItem.name === currentItem.name &&
						originalItem.category === currentItem.category &&
						originalItem.quantity === currentItem.quantity &&
						originalItem.unit === currentItem.unit
				);
			}

			if (itemIndex === -1) {
				setSnackbar({
					open: true,
					message: 'Item not found in shopping list',
					severity: 'error',
				});
				return;
			}

			const response = await fetch(
				`/api/shopping-lists/${shoppingListId}/items/${itemIndex}`,
				{
					method: 'DELETE',
				}
			);

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(`Failed to delete item: ${errorData}`);
			}

			// Update local state
			setItems((prevItems) => prevItems.filter((item) => item._id !== itemId));

			// Show success message
			setSnackbar({
				open: true,
				message: 'Item deleted successfully',
				severity: 'success',
			});

			// Close dialog
			setDeleteItemDialog({ open: false, itemId: '', itemName: '' });

			// Refresh the shopping list to sync with server
			onUpdate();
		} catch (error) {
			setSnackbar({
				open: true,
				message:
					error instanceof Error ? error.message : 'Failed to delete item',
				severity: 'error',
			});
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCancelDeleteItem = () => {
		setDeleteItemDialog({ open: false, itemId: '', itemName: '' });
	};

	const handleClearAll = () => {
		setOpenConfirmDialog(true);
	};

	const handleConfirmClear = async () => {
		if (!shoppingList || !shoppingList._id) return;

		setIsLoading(true);
		try {
			const shoppingListId = shoppingList._id;

			const response = await fetch(`/api/shopping-lists/${shoppingListId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (!response.ok) {
				const errorData = await response.text();
				throw new Error(errorData);
			}

			const responseData = await response.text();

			setSnackbar({
				open: true,
				message: 'Shopping list deleted successfully',
				severity: 'success',
			});

			setOpenConfirmDialog(false);
			onUpdate(true);
		} catch (error) {
			setSnackbar({
				open: true,
				message:
					error instanceof Error
						? error.message
						: 'Failed to delete shopping list',
				severity: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handlePrint = () => {
		window.print();
	};

	const handleExportPDF = async () => {
		if (!printRef.current) return;

		setIsLoading(true);
		try {
			// First ensure the print ref content is visible
			const printElement = printRef.current;
			const originalDisplay = printElement.style.display;
			printElement.style.display = 'block';

			// Create canvas with explicit dimensions
			const canvas = await html2canvas(printElement, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: '#ffffff',
				width: printElement.offsetWidth,
				height: printElement.offsetHeight,
				allowTaint: true,
				foreignObjectRendering: false,
			});

			// Restore original display style
			printElement.style.display = originalDisplay;

			// Create PDF first
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4',
				compress: true,
			});

			// Get PDF dimensions
			const pageWidth = pdf.internal.pageSize.getWidth();
			const pageHeight = pdf.internal.pageSize.getHeight();

			// Calculate image dimensions to fit page while maintaining aspect ratio
			const canvasAspectRatio = canvas.width / canvas.height;
			const pageAspectRatio = pageWidth / pageHeight;

			let renderWidth = pageWidth;
			let renderHeight = pageWidth / canvasAspectRatio;

			if (renderHeight > pageHeight) {
				renderHeight = pageHeight;
				renderWidth = pageHeight * canvasAspectRatio;
			}

			// Center image on page
			const xOffset = (pageWidth - renderWidth) / 2;
			const yOffset = (pageHeight - renderHeight) / 2;

			try {
				// Convert canvas to image data
				const imgData = canvas.toDataURL('image/jpeg', 1.0);

				// Add image to PDF
				pdf.addImage({
					imageData: imgData,
					format: 'JPEG',
					x: xOffset,
					y: yOffset,
					width: renderWidth,
					height: renderHeight,
				});

				// Save the PDF
				pdf.save(`${shoppingList?.name || 'shopping-list'}.pdf`);
			} catch (imgError) {
				throw new Error('Failed to convert shopping list to PDF format');
			}
		} catch (error) {
			setSnackbar({
				open: true,
				message:
					error instanceof Error
						? error.message
						: 'Failed to export as PDF. Please try again.',
				severity: 'error',
			});
		} finally {
			setIsLoading(false);
		}
	};

	if (!shoppingList) {
		return (
			<Paper
				sx={{
					p: 3,
					textAlign: 'center',
					background: 'linear-gradient(45deg, #f5f5f5 30%, #e0e0e0 90%)',
				}}
			>
				<Typography
					variant='body1'
					color='text.secondary'
				>
					No shopping list generated yet. Generate one from your meal plan!
				</Typography>
			</Paper>
		);
	}

	const itemsByCategory = groupItemsByCategory(items);

	return (
		<Paper
			sx={{
				p: 3,
				background: 'linear-gradient(45deg, #ffffff 30%, #f5f5f5 90%)',
				position: 'relative',
			}}
		>
			<Stack
				direction='row'
				justifyContent='space-between'
				alignItems='center'
				sx={{ mb: 3 }}
				className='no-print'
				flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
				gap={{ xs: 2, sm: 0 }}
			>
				<Typography
					variant='h5'
					sx={{
						fontWeight: 'bold',
						fontSize: { xs: '1.25rem', sm: '1.5rem' },
						width: { xs: '100%', sm: 'auto' },
						textAlign: { xs: 'center', sm: 'left' },
					}}
				>
					{shoppingList.name}
				</Typography>
				<Stack
					direction='row'
					spacing={1}
					sx={{
						width: { xs: '100%', sm: 'auto' },
						justifyContent: { xs: 'center', sm: 'flex-end' },
						flexWrap: { xs: 'wrap', sm: 'nowrap' },
						gap: { xs: 1, sm: 0 },
					}}
				>
					<Button
						variant='outlined'
						color='primary'
						onClick={handleClearAll}
						disabled={isUpdating}
						sx={{
							width: { xs: '100%', sm: 'auto' },
							fontSize: { xs: '0.875rem', sm: '1rem' },
						}}
					>
						Delete List
					</Button>
					<Button
						variant='outlined'
						color='secondary'
						startIcon={<PrintIcon />}
						onClick={handlePrint}
						sx={{
							width: { xs: '100%', sm: 'auto' },
							fontSize: { xs: '0.875rem', sm: '1rem' },
						}}
					>
						Print
					</Button>
					<Button
						variant='contained'
						color='success'
						startIcon={<PictureAsPdfIcon />}
						onClick={handleExportPDF}
						disabled={isLoading}
						sx={{
							width: { xs: '100%', sm: 'auto' },
							fontSize: { xs: '0.875rem', sm: '1rem' },
						}}
					>
						Export as PDF
					</Button>
				</Stack>
			</Stack>

			{(isUpdating || isLoading) && (
				<Box
					sx={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						background: 'rgba(255,255,255,0.7)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10,
					}}
				>
					<CircularProgress
						size={60}
						color='primary'
					/>
					<Typography
						sx={{ ml: 2 }}
						variant='h6'
					>
						Loading...
					</Typography>
				</Box>
			)}

			<Box
				ref={listRef}
				sx={{ filter: isUpdating || isLoading ? 'blur(2px)' : 'none' }}
				className='no-print'
			>
				<List>
					{Object.entries(itemsByCategory).map(
						([category, categoryItems], categoryIndex) => (
							<React.Fragment key={`category-${category}-${categoryIndex}`}>
								<Box sx={{ mb: 2 }}>
									<Typography
										variant='subtitle1'
										sx={{
											fontWeight: 'bold',
											color: 'primary.main',
											mb: 1,
										}}
									>
										{category}
									</Typography>
									<List component='div'>
										{categoryItems.map((item, itemIndex) => (
											<ListItem
												component='div'
												key={
													item._id ||
													`item-${category}-${itemIndex}-${item.name}`
												}
												disableGutters
												secondaryAction={
													<IconButton
														edge='end'
														onClick={() =>
															handleDeleteItemClick(item._id, item.name)
														}
														disabled={isUpdating || !item._id}
													>
														<DeleteIcon />
													</IconButton>
												}
											>
												<Checkbox
													icon={<RadioButtonUncheckedIcon />}
													checkedIcon={<CheckCircleIcon />}
													checked={item.status === 'COMPLETED'}
													onChange={() => handleToggleItem(item._id)}
													disabled={isUpdating || !item._id}
												/>
												<ListItemText
													primary={
														<Box>
															<Typography
																variant='body1'
																sx={{
																	textDecoration:
																		item.status === 'COMPLETED'
																			? 'line-through'
																			: 'none',
																	color:
																		item.status === 'COMPLETED'
																			? 'text.secondary'
																			: 'text.primary',
																}}
															>
																{item.name}
																{(item.quantity || item.unit) && (
																	<>
																		{' '}
																		<small style={{ color: 'gray' }}>
																			({formatQuantityDisplayAuto(item)}
																			{item.additionalQuantities &&
																				Array.isArray(
																					item.additionalQuantities
																				) &&
																				item.additionalQuantities.length >
																					0 && (
																					<>
																						{' + '}
																						{item.additionalQuantities.map(
																							(q, i) => (
																								<span
																									key={`quantity-${
																										item._id ||
																										`${category}-${itemIndex}-${i}`
																									}-${i}`}
																								>
																									{q.quantity} {q.unit}
																									{i <
																									item.additionalQuantities!
																										.length -
																										1
																										? ' + '
																										: ''}
																								</span>
																							)
																						)}
																					</>
																				)}
																			)
																		</small>
																	</>
																)}
															</Typography>
														</Box>
													}
												/>
											</ListItem>
										))}
									</List>
								</Box>
								<Divider sx={{ my: 1 }} />
							</React.Fragment>
						)
					)}
				</List>
			</Box>

			<Box
				ref={printRef}
				className='print-only'
				sx={{ display: 'none', p: 2 }}
			>
				<Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
					{/* @ts-ignore */}
					<Image
						src='/images/logo.png'
						alt='MealPrep360 Logo'
						width={160}
						height={160}
						style={{ objectFit: 'contain' }}
					/>
				</Box>
				<Typography
					variant='h5'
					align='center'
					sx={{ mb: 2, fontWeight: 'bold' }}
				>
					{shoppingList.name}
				</Typography>
				<List>
					{Object.entries(itemsByCategory).map(
						([category, categoryItems], categoryIndex) => (
							<React.Fragment
								key={`print-category-${category}-${categoryIndex}`}
							>
								<Typography
									variant='h6'
									className='print-category-header'
									sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}
								>
									{category}
								</Typography>
								<List
									component='div'
									sx={{ margin: 0, paddingLeft: 3 }}
								>
									{categoryItems.map((item) => (
										<ListItem
											component='div'
											key={`print-item-${
												item._id ||
												`${category}-${item.name}-${Math.random()
													.toString(36)
													.substr(2, 9)}`
											}`}
											sx={{
												fontSize: 18,
												marginBottom: 2.5,
												display: 'flex',
												alignItems: 'center',
												padding: 0,
											}}
										>
											<Box
												component='span'
												role='checkbox'
												sx={{
													display: 'inline-block',
													width: 18,
													height: 18,
													border: '2px solid #888',
													borderRadius: 3,
													marginRight: 1,
													boxSizing: 'border-box',
													background: '#fff',
													verticalAlign: 'middle',
													position: 'relative',
													top: 2,
												}}
											/>
											<ListItemText
												primary={
													<>
														{item.name}
														{(item.quantity || item.unit) && (
															<Typography
																component='span'
																sx={{ color: '#666', fontSize: 15, ml: 1 }}
															>
																({formatQuantityDisplayAuto(item)})
															</Typography>
														)}
													</>
												}
											/>
										</ListItem>
									))}
								</List>
							</React.Fragment>
						)
					)}
				</List>
				<Box
					sx={{
						mt: 4,
						pt: 2,
						borderTop: '1px solid #eee',
						textAlign: 'center',
					}}
				>
					<Typography
						variant='caption'
						sx={{
							color: '#666',
							fontSize: 12,
							fontStyle: 'italic',
						}}
					>
						© 2025 MealPrep360. All rights reserved.
					</Typography>
				</Box>
			</Box>

			<style>{`
				@media print {
					.no-print { display: none !important; }
					.print-only { display: block !important; }
					body { background: #fff !important; }
					.MuiPaper-root { box-shadow: none !important; background: #fff !important; }
					header, footer, nav, .main-nav, .footer { display: none !important; }
					[role="banner"], [role="contentinfo"], [role="navigation"] { display: none !important; }
					body > div > div > header { display: none !important; }
					body > div > div > footer { display: none !important; }
					.MuiButtonGroup-root, .MuiButtonGroup-grouped { display: none !important; }
					.MuiBox-root[role="tablist"], [role="tablist"] { display: none !important; }
					.MuiButton-root, button { display: none !important; }
					.MuiTab-root, [role="tab"] { display: none !important; }
					.navigation-buttons, .nav-buttons, .tab-navigation { display: none !important; }
				}
				.print-only { display: none; }
				.print-only li {
					margin-bottom: 20px !important;
					display: flex;
					align-items: center;
				}
				.print-only li span[role='checkbox'] {
					display: inline-block;
					width: 18px;
					height: 18px;
					border: 2px solid #888;
					border-radius: 3px;
					margin-right: 8px;
					box-sizing: border-box;
					background: #fff;
					vertical-align: middle;
					position: relative;
					top: 2px;
				}
				.print-only .print-category-header {
					break-before: page;
					page-break-before: always;
					margin-top: 60px;
				}
				.print-only .print-category-header:first-child {
					break-before: auto;
					page-break-before: auto;
					margin-top: 0;
				}
			`}</style>

			{/* Confirmation Dialog */}
			<Dialog
				open={openConfirmDialog}
				onClose={() => setOpenConfirmDialog(false)}
				aria-labelledby='alert-dialog-title'
				aria-describedby='alert-dialog-description'
			>
				<DialogTitle
					id='alert-dialog-title'
					sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
				>
					<WarningIcon color='warning' />
					Delete Shopping List
				</DialogTitle>
				<DialogContent>
					<DialogContentText id='alert-dialog-description'>
						Are you sure you want to delete this shopping list? This will remove
						all items and allow you to generate a new shopping list from your
						meal plan. This action cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setOpenConfirmDialog(false)}
						color='primary'
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmClear}
						color='error'
						variant='contained'
						autoFocus
					>
						Delete List
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Item Confirmation Dialog */}
			<Dialog
				open={deleteItemDialog.open}
				onClose={handleCancelDeleteItem}
				aria-labelledby='delete-item-dialog-title'
				aria-describedby='delete-item-dialog-description'
			>
				<DialogTitle
					id='delete-item-dialog-title'
					sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
				>
					<WarningIcon color='warning' />
					Delete Item
				</DialogTitle>
				<DialogContent>
					<DialogContentText id='delete-item-dialog-description'>
						Are you sure you want to delete "{deleteItemDialog.itemName}" from
						your shopping list? This action cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCancelDeleteItem}
						color='primary'
					>
						Cancel
					</Button>
					<Button
						onClick={handleConfirmDeleteItem}
						color='error'
						variant='contained'
						autoFocus
					>
						Delete Item
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Paper>
	);
}
