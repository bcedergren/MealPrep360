import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useShopping } from '../../hooks/useShopping';
import {
	ShoppingCategory,
	ShoppingList,
	formatPrice,
} from '../../types/shoppingList';
import { Button, Card } from '../ui';

const theme = {
	colors: {
		gray: {
			25: Colors.gray50,
			50: Colors.gray50,
			200: Colors.gray200,
			400: Colors.gray400,
			500: Colors.gray500,
			600: Colors.gray600,
			700: Colors.gray700,
			800: Colors.gray800,
		},
		primary: {
			500: Colors.primary,
			600: Colors.primaryDark,
		},
		white: Colors.white,
	},
	spacing: {
		xs: 4,
		sm: 8,
		md: 16,
		lg: 24,
		xl: 32,
	},
	typography: {
		h2: {
			fontSize: 24,
			fontWeight: 'bold' as const,
		},
		h3: {
			fontSize: 20,
			fontWeight: 'bold' as const,
		},
		h4: {
			fontSize: 18,
			fontWeight: '600' as const,
		},
		body: {
			fontSize: 16,
		},
		caption: {
			fontSize: 12,
		},
	},
};

interface ShoppingListViewProps {
	shoppingList: ShoppingList;
	isActive?: boolean;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
	shoppingList,
	isActive = false,
}) => {
	const [showAddModal, setShowAddModal] = useState(false);
	const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
		new Set()
	);

	const {
		toggleItemCompletion,
		removeItem,
		updateItemQuantity,
		updateItemPrice,
		toggleCategoryCollapse,
		addItem,
		getCompletionPercentage,
		getTotalEstimatedPrice,
		clearCompletedItems,
		markAllCompleted,
		updateListStatus,
	} = useShopping();

	const completionPercentage = getCompletionPercentage(shoppingList.id);
	const totalEstimated = getTotalEstimatedPrice(shoppingList.id);
	const totalActual = shoppingList.categories.reduce(
		(sum, category) =>
			sum +
			category.items.reduce(
				(itemSum, item) => itemSum + (item.actualPrice || 0),
				0
			),
		0
	);

	const handleToggleCategory = (categoryId: string) => {
		const newExpanded = new Set(expandedCategories);
		if (newExpanded.has(categoryId)) {
			newExpanded.delete(categoryId);
		} else {
			newExpanded.add(categoryId);
		}
		setExpandedCategories(newExpanded);
		toggleCategoryCollapse(shoppingList.id, categoryId);
	};

	const handleRemoveItem = (itemId: string, itemName: string) => {
		Alert.alert(
			'Remove Item',
			`Are you sure you want to remove "${itemName}" from your shopping list?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: () => removeItem(shoppingList.id, itemId),
				},
			]
		);
	};

	const handleClearCompleted = () => {
		Alert.alert(
			'Clear Completed Items',
			'This will remove all completed items from your shopping list. This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Clear',
					style: 'destructive',
					onPress: () => clearCompletedItems(shoppingList.id),
				},
			]
		);
	};

	const handleMarkAllCompleted = () => {
		markAllCompleted(shoppingList.id);
	};

	const handleStartShopping = () => {
		updateListStatus(shoppingList.id, 'shopping');
	};

	const handleCompleteShopping = () => {
		updateListStatus(shoppingList.id, 'completed');
	};

	const renderCategoryHeader = (category: ShoppingCategory) => {
		const isExpanded = expandedCategories.has(category.id);
		const completedCount = category.items.filter(
			(item) => item.isCompleted
		).length;
		const totalCount = category.items.length;

		return (
			<TouchableOpacity
				style={[styles.categoryHeader, { borderLeftColor: category.color }]}
				onPress={() => handleToggleCategory(category.id)}
				activeOpacity={0.7}
			>
				<View style={styles.categoryHeaderLeft}>
					<Ionicons
						name={category.icon as any}
						size={20}
						color={category.color}
						style={styles.categoryIcon}
					/>
					<Text style={styles.categoryName}>{category.name}</Text>
					<View
						style={[styles.categoryBadge, { backgroundColor: category.color }]}
					>
						<Text style={styles.categoryBadgeText}>
							{completedCount}/{totalCount}
						</Text>
					</View>
					{category.estimatedTime && (
						<Text style={styles.estimatedTime}>
							~{category.estimatedTime}min
						</Text>
					)}
				</View>

				<Ionicons
					name={isExpanded ? 'chevron-up' : 'chevron-down'}
					size={20}
					color={theme.colors.gray[600]}
				/>
			</TouchableOpacity>
		);
	};

	const renderCategory = ({ item: category }: { item: ShoppingCategory }) => {
		const isExpanded = expandedCategories.has(category.id);

		return (
			<Card style={styles.categoryCard}>
				{renderCategoryHeader(category)}

				{isExpanded && (
					<View style={styles.categoryItems}>
						{category.items.map((item) => (
							<View key={item.id} style={styles.itemRow}>
								<Text>{item.name}</Text>
							</View>
						))}
					</View>
				)}
			</Card>
		);
	};

	if (shoppingList.categories.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Ionicons
					name='bag-outline'
					size={64}
					color={theme.colors.gray[400]}
				/>
				<Text style={styles.emptyTitle}>Empty Shopping List</Text>
				<Text style={styles.emptySubtitle}>
					Add items to your shopping list to get started
				</Text>
				<Button
					title='Add Item'
					onPress={() => setShowAddModal(true)}
					style={styles.addButton}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			{/* Progress Header */}
			<Card style={styles.progressCard}>
				<View style={styles.progressHeader}>
					<View style={styles.progressInfo}>
						<Text style={styles.progressTitle}>Shopping Progress</Text>
						<Text style={styles.progressPercentage}>
							{Math.round(completionPercentage)}% Complete
						</Text>
					</View>

					<View style={styles.progressStats}>
						<Text style={styles.progressStat}>
							{shoppingList.completedItems}/{shoppingList.totalItems} items
						</Text>
						{totalEstimated > 0 && (
							<Text style={styles.progressStat}>
								Est. {formatPrice(totalEstimated)}
								{totalActual > 0 && ` • Actual ${formatPrice(totalActual)}`}
							</Text>
						)}
					</View>
				</View>

				<View style={styles.progressBarContainer}>
					<View style={styles.progressBar}>
						<View
							style={[
								styles.progressBarFill,
								{ width: `${completionPercentage}%` },
							]}
						/>
					</View>
				</View>

				{/* Action Buttons */}
				<View style={styles.actionButtons}>
					{shoppingList.status === 'draft' && (
						<Button
							title='Start Shopping'
							onPress={handleStartShopping}
							variant='primary'
							size='small'
							style={styles.actionButton}
						/>
					)}

					{shoppingList.status === 'shopping' && completionPercentage < 100 && (
						<Button
							title='Mark All Done'
							onPress={handleMarkAllCompleted}
							variant='secondary'
							size='small'
							style={styles.actionButton}
						/>
					)}

					{shoppingList.status === 'shopping' &&
						completionPercentage === 100 && (
							<Button
								title='Complete Shopping'
								onPress={handleCompleteShopping}
								variant='primary'
								size='small'
								style={styles.actionButton}
							/>
						)}

					{shoppingList.completedItems > 0 && (
						<Button
							title='Clear Completed'
							onPress={handleClearCompleted}
							variant='outline'
							size='small'
							style={styles.actionButton}
						/>
					)}

					<Button
						title='Add Item'
						onPress={() => setShowAddModal(true)}
						variant='outline'
						size='small'
						style={styles.actionButton}
						icon='add'
					/>
				</View>
			</Card>

			{/* Categories List */}
			<FlatList
				data={shoppingList.categories.sort((a, b) => a.order - b.order)}
				keyExtractor={(item) => item.id}
				renderItem={renderCategory}
				contentContainerStyle={styles.categoriesList}
				showsVerticalScrollIndicator={false}
				onLayout={() => {
					// Auto-expand first category
					if (
						expandedCategories.size === 0 &&
						shoppingList.categories.length > 0
					) {
						setExpandedCategories(new Set([shoppingList.categories[0].id]));
					}
				}}
			/>

			{/* Add Item Modal - Placeholder */}
			{showAddModal && (
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text>Add Item Modal - Not Implemented</Text>
						<TouchableOpacity onPress={() => setShowAddModal(false)}>
							<Text>Close</Text>
						</TouchableOpacity>
					</View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: theme.colors.gray[50],
	},

	// Empty state
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: theme.spacing.xl,
	},
	emptyTitle: {
		...theme.typography.h3,
		color: theme.colors.gray[700],
		marginTop: theme.spacing.md,
		marginBottom: theme.spacing.sm,
	},
	emptySubtitle: {
		...theme.typography.body,
		color: theme.colors.gray[500],
		textAlign: 'center',
		marginBottom: theme.spacing.xl,
	},
	addButton: {
		minWidth: 120,
	},

	// Progress card
	progressCard: {
		margin: theme.spacing.md,
		marginBottom: theme.spacing.sm,
	},
	progressHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.md,
	},
	progressInfo: {
		flex: 1,
	},
	progressTitle: {
		...theme.typography.h4,
		color: theme.colors.gray[800],
		marginBottom: theme.spacing.xs,
	},
	progressPercentage: {
		...theme.typography.h2,
		color: theme.colors.primary[600],
		fontWeight: 'bold',
	},
	progressStats: {
		alignItems: 'flex-end',
	},
	progressStat: {
		...theme.typography.caption,
		color: theme.colors.gray[600],
		marginBottom: theme.spacing.xs,
	},

	// Progress bar
	progressBarContainer: {
		marginBottom: theme.spacing.md,
	},
	progressBar: {
		height: 8,
		backgroundColor: theme.colors.gray[200],
		borderRadius: 4,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: theme.colors.primary[500],
		borderRadius: 4,
	},

	// Action buttons
	actionButtons: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: theme.spacing.sm,
	},
	actionButton: {
		flex: 0,
		minWidth: 100,
	},

	// Categories
	categoriesList: {
		padding: theme.spacing.md,
		paddingTop: 0,
	},
	categoryCard: {
		marginBottom: theme.spacing.sm,
		overflow: 'hidden',
	},

	// Category header
	categoryHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: theme.spacing.md,
		borderLeftWidth: 4,
		backgroundColor: theme.colors.white,
	},
	categoryHeaderLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	categoryIcon: {
		marginRight: theme.spacing.sm,
	},
	categoryName: {
		...theme.typography.h4,
		color: theme.colors.gray[800],
		marginRight: theme.spacing.sm,
	},
	categoryBadge: {
		paddingHorizontal: theme.spacing.sm,
		paddingVertical: theme.spacing.xs,
		borderRadius: 12,
		marginRight: theme.spacing.sm,
	},
	categoryBadgeText: {
		...theme.typography.caption,
		color: theme.colors.white,
		fontWeight: '600',
		fontSize: 11,
	},
	estimatedTime: {
		...theme.typography.caption,
		color: theme.colors.gray[500],
		fontStyle: 'italic',
	},

	// Category items
	categoryItems: {
		backgroundColor: theme.colors.gray[25],
	},
	itemRow: {
		padding: theme.spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.gray[200],
	},
	modalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalContent: {
		backgroundColor: theme.colors.white,
		padding: theme.spacing.xl,
		borderRadius: 8,
		margin: theme.spacing.md,
	},
});
