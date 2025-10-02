'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSnackbar } from '../../components/ui/snackbar';
import {
	Box,
	Container,
	Typography,
	Grid,
	Button,
	CircularProgress,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Paper,
	Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LoadingShopping } from '../../components/shopping/loading-shopping';
import { ShoppingCart } from '@mui/icons-material';
import { PageHeader } from '../../components/shared/page-header';
import {
	ShoppingListItem,
	normalizeShoppingListItems,
	formatQuantityDisplay,
	groupItemsByCategory,
} from '@/lib/utils/shopping-list-utils';

interface ShoppingItem {
	id: string;
	name: string;
	quantity: number;
	unit: string;
	completed: boolean;
	category?: string;
	additionalQuantities?: { quantity: number; unit: string }[];
}

export default function ShoppingPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const [items, setItems] = useState<ShoppingItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [newItem, setNewItem] = useState({
		name: '',
		quantity: 1,
		unit: 'pieces',
	});

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted || !isLoaded) return;

		if (!isSignedIn) {
			router.push('/sign-in');
			return;
		}

		fetchShoppingList();
	}, [mounted, isLoaded, isSignedIn, router]);

	const fetchShoppingList = async () => {
		try {
			// Add cache-busting parameter to ensure fresh data
			const response = await fetch(`/api/shopping-lists?t=${Date.now()}`, {
				credentials: 'include',
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error('Failed to fetch shopping list');
			}

			// Handle both response formats: direct array or object with shoppingLists property
			let shoppingLists: any[];

			if (Array.isArray(data)) {
				// Direct array format (legacy)
				shoppingLists = data;
			} else if (data && Array.isArray(data.shoppingLists)) {
				// New format with shoppingLists property
				shoppingLists = data.shoppingLists;

				// Log any message from the API (e.g., authentication issues)
				if (data.message) {
					console.info('Shopping lists API message:', data.message);
				}
			} else {
				console.error('Invalid response format:', data);
				setItems([]);
				return;
			}

			// Get the most recent active shopping list
			const activeList = shoppingLists.find(
				(list: any) => list.status === 'ACTIVE'
			);

			if (activeList) {
				// Normalize and transform the items from API format to UI format
				const normalizedItems = normalizeShoppingListItems(
					activeList.items || []
				);
				const transformedItems = normalizedItems.map(
					(item: ShoppingListItem) => ({
						id: item._id,
						name: item.name,
						quantity: item.quantity,
						unit: item.unit,
						completed: item.status === 'COMPLETED',
						category: item.category,
						additionalQuantities: item.additionalQuantities,
					})
				);

				setItems(transformedItems);
			} else {
				setItems([]);
			}
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to load shopping list'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGenerateShoppingList = async () => {
		try {
			setIsGenerating(true);

			// Fetch the current meal plan (Sunday to Saturday)
			const today = new Date();
			const startOfWeek = new Date(today);
			startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
			startOfWeek.setHours(0, 0, 0, 0); // Start of day
			const endOfWeek = new Date(startOfWeek);
			endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
			endOfWeek.setHours(23, 59, 59, 999); // End of day

			const mealPlanRes = await fetch(
				`/api/meal-plans?startDate=${startOfWeek.toISOString()}&endDate=${endOfWeek.toISOString()}`
			);
			const mealPlans = await mealPlanRes.json();

			if (!mealPlanRes.ok || !mealPlans.length) {
				throw new Error('No active meal plan found');
			}

			const currentMealPlan = mealPlans[0];

			const daysWithRecipes =
				currentMealPlan.days?.filter((day: any) => day.recipeId || day.recipe)
					?.length || 0;

			// Check if meal plan has recipes before generating shopping list
			if (daysWithRecipes === 0) {
				showSnackbar(
					'No recipes found in your meal plan. Please add recipes to your meal plan before generating a shopping list.',
					'error'
				);
				return;
			}

			// Now generate the shopping list
			const response = await fetch(`/api/shopping-lists/generate`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mealPlanId: currentMealPlan.id || currentMealPlan._id,
					hasDays: !!currentMealPlan.days,
					daysLength: currentMealPlan.days?.length || 0,
					hasRecipes: daysWithRecipes > 0,
					recipeCount: daysWithRecipes,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				// Use details field if available for better user experience
				const errorMessage =
					data.details || data.error || 'Failed to generate shopping list';

				// Handle specific error types
				if (data.type === 'MEAL_PLAN_NOT_FOUND_EXTERNAL') {
					throw new Error(
						'Your meal plan was not found on the external service. Please regenerate your meal plan and try again.'
					);
				}

				if (data.type === 'NO_RECIPES_FOUND') {
					throw new Error(
						'No recipes found in your meal plan. Please add recipes to your meal plan before generating a shopping list.'
					);
				}

				if (data.type === 'SERVICE_UNAVAILABLE') {
					throw new Error(
						'Shopping list service is temporarily unavailable. Please try again in a few minutes.'
					);
				}

				throw new Error(errorMessage);
			}

			// Use the processed shopping list data directly from the response
			if (data && data.items) {
				// Normalize and transform the items from API format to UI format
				const normalizedItems = normalizeShoppingListItems(data.items || []);
				const transformedItems = normalizedItems.map(
					(item: ShoppingListItem) => ({
						id: item._id,
						name: item.name,
						quantity: item.quantity,
						unit: item.unit,
						completed: item.status === 'COMPLETED',
						category: item.category,
						additionalQuantities: item.additionalQuantities,
					})
				);

				setItems(transformedItems);
			} else {
				// If the response doesn't have items directly, fetch the updated shopping list
				await fetchShoppingList();
			}

			showSnackbar(
				'Your shopping list has been created from your meal plans.',
				'success'
			);
		} catch (err) {
			console.error('Error generating shopping list:', err);
			showSnackbar(
				err instanceof Error ? err.message : 'Failed to generate shopping list',
				'error'
			);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleAddItem = async () => {
		showSnackbar(
			'Manual item addition is not supported. Please generate a shopping list from your meal plan.',
			'error'
		);
	};

	const handleDeleteItem = async (itemId: string) => {
		try {
			// First, get the current shopping list to find the list ID
			const response = await fetch(`/api/shopping-lists?t=${Date.now()}`, {
				credentials: 'include',
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error('Failed to fetch shopping list');
			}

			// Handle both response formats: direct array or object with shoppingLists property
			let shoppingLists: any[];

			if (Array.isArray(data)) {
				shoppingLists = data;
			} else if (data && Array.isArray(data.shoppingLists)) {
				shoppingLists = data.shoppingLists;
			} else {
				throw new Error('Invalid response format');
			}

			// Get the most recent active shopping list
			const activeList = shoppingLists.find(
				(list: any) => list.status === 'ACTIVE'
			);
			if (!activeList) {
				throw new Error('No active shopping list found');
			}

			// Delete the item from the shopping list
			const shoppingListId = activeList._id || activeList.id;
			const deleteResponse = await fetch(
				`/api/shopping-lists/${shoppingListId}/items/${itemId}`,
				{
					method: 'DELETE',
				}
			);

			if (!deleteResponse.ok) {
				throw new Error('Failed to delete item');
			}

			await fetchShoppingList();
		} catch (err) {
			showSnackbar(
				err instanceof Error ? err.message : 'Failed to delete item',
				'error'
			);
		}
	};

	const handleToggleItem = async (itemId: string, completed: boolean) => {
		try {
			// First, get the current shopping list to find the list ID
			const response = await fetch(`/api/shopping-lists?t=${Date.now()}`, {
				credentials: 'include',
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error('Failed to fetch shopping list');
			}

			// Handle both response formats: direct array or object with shoppingLists property
			let shoppingLists: any[];

			if (Array.isArray(data)) {
				shoppingLists = data;
			} else if (data && Array.isArray(data.shoppingLists)) {
				shoppingLists = data.shoppingLists;
			} else {
				throw new Error('Invalid response format');
			}

			// Get the most recent active shopping list
			const activeList = shoppingLists.find(
				(list: any) => list.status === 'ACTIVE'
			);
			if (!activeList) {
				throw new Error('No active shopping list found');
			}

			// Update the item in the shopping list
			const shoppingListId = activeList._id || activeList.id;
			const updateResponse = await fetch(
				`/api/shopping-lists/${shoppingListId}/items/${itemId}`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						status: completed ? 'COMPLETED' : 'PENDING',
					}),
				}
			);

			if (!updateResponse.ok) {
				throw new Error('Failed to update item');
			}

			await fetchShoppingList();
		} catch (err) {
			showSnackbar(
				err instanceof Error ? err.message : 'Failed to update item',
				'error'
			);
		}
	};

	return (
		<Box sx={{ p: 3 }}>
			<PageHeader
				title='Shopping List'
				description='Manage your shopping items and generate lists from meal plans'
				backgroundColor='linear-gradient(45deg, #9C27B0 30%, #BA68C8 90%)'
				icon={<ShoppingCart />}
				rightAction={
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button
							variant='outlined'
							onClick={fetchShoppingList}
							disabled={isLoading}
							startIcon={<RefreshIcon />}
							sx={{ color: 'white', borderColor: 'white' }}
						>
							Refresh
						</Button>
						<Button
							variant='contained'
							onClick={handleGenerateShoppingList}
							disabled={isGenerating}
							startIcon={<ShoppingCart />}
							sx={{
								background: 'linear-gradient(45deg, #4CAF50 30%, #81C784 90%)',
								boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
								color: 'white',
								'&:hover': {
									background:
										'linear-gradient(45deg, #388E3C 30%, #66BB6A 90%)',
								},
							}}
						>
							{isGenerating ? 'Generating...' : 'Generate from Meal Plan'}
						</Button>
					</Box>
				}
			/>

			{/* Add Item Form - Disabled */}
			<Paper
				elevation={2}
				sx={{ p: 3, mb: 3, borderRadius: 2, opacity: 0.6 }}
			>
				<Typography
					variant='h6'
					gutterBottom
					color='text.secondary'
				>
					Add New Item (Not Available)
				</Typography>
				<Typography
					variant='body2'
					color='text.secondary'
					sx={{ mb: 2 }}
				>
					Manual item addition is not supported. Shopping lists are
					automatically generated from your meal plans.
				</Typography>
				<Grid
					container
					spacing={2}
					alignItems='center'
				>
					<Grid
						item
						xs={12}
						sm={4}
					>
						<TextField
							fullWidth
							label='Item Name'
							value={newItem.name}
							onChange={(e) =>
								setNewItem((prev) => ({ ...prev, name: e.target.value }))
							}
							variant='outlined'
							size='small'
							disabled
						/>
					</Grid>
					<Grid
						item
						xs={6}
						sm={2}
					>
						<TextField
							fullWidth
							label='Quantity'
							type='number'
							value={newItem.quantity}
							onChange={(e) =>
								setNewItem((prev) => ({
									...prev,
									quantity: parseInt(e.target.value) || 1,
								}))
							}
							variant='outlined'
							size='small'
							inputProps={{ min: 1 }}
							disabled
						/>
					</Grid>
					<Grid
						item
						xs={6}
						sm={2}
					>
						<FormControl
							fullWidth
							size='small'
						>
							<InputLabel>Unit</InputLabel>
							<Select
								value={newItem.unit}
								label='Unit'
								onChange={(e) =>
									setNewItem((prev) => ({ ...prev, unit: e.target.value }))
								}
								disabled
							>
								<MenuItem value='pieces'>pieces</MenuItem>
								<MenuItem value='lbs'>lbs</MenuItem>
								<MenuItem value='oz'>oz</MenuItem>
								<MenuItem value='cups'>cups</MenuItem>
								<MenuItem value='tbsp'>tbsp</MenuItem>
								<MenuItem value='tsp'>tsp</MenuItem>
								<MenuItem value='grams'>grams</MenuItem>
								<MenuItem value='kg'>kg</MenuItem>
								<MenuItem value='ml'>ml</MenuItem>
								<MenuItem value='liters'>liters</MenuItem>
							</Select>
						</FormControl>
					</Grid>
					<Grid
						item
						xs={12}
						sm={4}
					>
						<Button
							variant='contained'
							onClick={handleAddItem}
							startIcon={<AddIcon />}
							fullWidth
							sx={{ height: '40px' }}
							disabled
						>
							Add Item
						</Button>
					</Grid>
				</Grid>
			</Paper>
			<Suspense fallback={<LoadingShopping />}>
				{!mounted || isLoading ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '50vh',
						}}
					>
						<CircularProgress />
					</Box>
				) : error ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '50vh',
						}}
					>
						<Typography color='error'>{error}</Typography>
					</Box>
				) : items.length === 0 ? (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							height: '50vh',
							flexDirection: 'column',
							gap: 2,
						}}
					>
						<Typography
							variant='h6'
							color='text.secondary'
						>
							No shopping list generated yet
						</Typography>
						<Typography
							variant='body2'
							color='text.secondary'
							align='center'
							sx={{ maxWidth: 400 }}
						>
							To create a shopping list, you need to have recipes in your meal
							plan. Add recipes to your meal plan first, then generate a
							shopping list from it.
						</Typography>
						<Button
							variant='contained'
							color='primary'
							onClick={handleGenerateShoppingList}
						>
							Generate from Meal Plan
						</Button>
					</Box>
				) : (
					<Box>
						{/* Group items by category */}
						{Object.entries(
							items.reduce((acc: { [key: string]: ShoppingItem[] }, item) => {
								const category = item.category || 'Other';
								if (!acc[category]) {
									acc[category] = [];
								}
								acc[category].push(item);
								return acc;
							}, {})
						).map(([category, categoryItems]) => (
							<Box
								key={category}
								sx={{ mb: 4 }}
							>
								<Typography
									variant='h6'
									sx={{
										fontWeight: 'bold',
										color: 'primary.main',
										mb: 2,
										pb: 1,
										borderBottom: '2px solid',
										borderColor: 'primary.light',
									}}
								>
									{category}
								</Typography>
								<Grid
									container
									spacing={2}
								>
									{categoryItems.map((item) => (
										<Grid
											item
											xs={12}
											sm={6}
											md={4}
											key={item.id}
										>
											<Paper
												elevation={2}
												sx={{
													p: 2,
													borderRadius: 2,
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													'&:hover': {
														boxShadow: 4,
													},
												}}
											>
												<Box
													sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
												>
													<CheckIcon
														sx={{
															color: item.completed
																? 'success.main'
																: 'action.disabled',
															cursor: 'pointer',
															'&:hover': {
																color: item.completed
																	? 'success.dark'
																	: 'success.light',
															},
														}}
														onClick={() =>
															handleToggleItem(item.id, !item.completed)
														}
													/>
													<Typography
														sx={{
															textDecoration: item.completed
																? 'line-through'
																: 'none',
															color: item.completed
																? 'text.secondary'
																: 'text.primary',
															fontWeight: item.completed ? 400 : 500,
														}}
													>
														{formatQuantityDisplay({
															_id: item.id,
															name: item.name,
															quantity: item.quantity,
															unit: item.unit,
															category: item.category || 'Other',
															status: item.completed ? 'COMPLETED' : 'PENDING',
															additionalQuantities: item.additionalQuantities,
														})}{' '}
														{item.name}
														{item.additionalQuantities &&
															item.additionalQuantities.length > 0 && (
																<>
																	{' + '}
																	{item.additionalQuantities.map((q, i) => (
																		<span key={i}>
																			{q.quantity} {q.unit}
																			{i < item.additionalQuantities!.length - 1
																				? ' + '
																				: ''}
																		</span>
																	))}
																</>
															)}
													</Typography>
												</Box>
												<DeleteIcon
													sx={{
														color: 'error.main',
														cursor: 'pointer',
														'&:hover': {
															color: 'error.dark',
														},
													}}
													onClick={() => handleDeleteItem(item.id)}
												/>
											</Paper>
										</Grid>
									))}
								</Grid>
							</Box>
						))}
					</Box>
				)}
			</Suspense>
		</Box>
	);
}
