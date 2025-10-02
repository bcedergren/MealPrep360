import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

interface ShoppingList {
	id: string;
	title: string;
	description: string;
	items: any[];
	createdAt: string;
	updatedAt: string;
}

interface ShoppingListCardProps {
	shoppingList: ShoppingList;
	onDelete: (id: string) => void;
}

export function ShoppingListCard({
	shoppingList,
	onDelete,
}: ShoppingListCardProps) {
	return (
		<Card>
			<CardContent>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
					}}
				>
					<Box>
						<Typography
							variant='h6'
							component='div'
							sx={{ mb: 1 }}
						>
							{shoppingList.title}
						</Typography>
						<Typography
							variant='body2'
							color='text.secondary'
							sx={{ mb: 2 }}
						>
							{shoppingList.description}
						</Typography>
						<Typography
							variant='body2'
							color='text.secondary'
						>
							Created: {format(new Date(shoppingList.createdAt), 'MMM d, yyyy')}
						</Typography>
						<Typography
							variant='body2'
							color='text.secondary'
							sx={{ mt: 1 }}
						>
							{shoppingList.items.length} items
						</Typography>
					</Box>
					<IconButton
						onClick={() => onDelete(shoppingList.id)}
						color='error'
						size='small'
					>
						<DeleteIcon />
					</IconButton>
				</Box>
			</CardContent>
		</Card>
	);
}
