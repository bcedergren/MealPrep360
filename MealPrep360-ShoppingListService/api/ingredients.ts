import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../src/utils/database';
import { IngredientReference } from '../src/models/IngredientReference';
import { z } from 'zod';
import { CategorySchema } from '../src/types';

// Schema for ingredient search query
const SearchQuerySchema = z.object({
	query: z.string().min(1),
	category: CategorySchema.optional(),
	limit: z.number().min(1).max(100).optional().default(20),
});

// Schema for creating/updating ingredients
const IngredientInputSchema = z.object({
	name: z.string().min(1),
	displayName: z.string().min(1),
	category: CategorySchema,
	alternateNames: z.array(z.string()),
	defaultUnit: z.enum([
		'g',
		'kg',
		'oz',
		'lb',
		'ml',
		'l',
		'cup',
		'tbsp',
		'tsp',
		'piece',
		'whole',
		'pinch',
	]),
	defaultAmount: z.number().positive(),
	isCommonPantryItem: z.boolean(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
	// Add CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, DELETE, OPTIONS'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	try {
		await connectToDatabase();

		switch (req.method) {
			case 'GET':
				return await handleGet(req, res);
			case 'POST':
				return await handlePost(req, res);
			case 'PUT':
				return await handlePut(req, res);
			case 'DELETE':
				return await handleDelete(req, res);
			default:
				return res.status(405).json({ error: 'Method not allowed' });
		}
	} catch (error) {
		console.error('Error in ingredients API:', error);
		return res.status(500).json({ error: 'Internal server error' });
	}
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
	const { id, query, category, limit } = req.query;

	// Get single ingredient by ID
	if (id) {
		const ingredient = await IngredientReference.findById(id);
		if (!ingredient) {
			return res.status(404).json({ error: 'Ingredient not found' });
		}
		return res.status(200).json(ingredient);
	}

	// Search ingredients
	if (query) {
		try {
			const validatedQuery = SearchQuerySchema.parse({
				query,
				category,
				limit: limit ? parseInt(limit as string) : undefined,
			});

			const searchQuery: any = {
				$or: [
					{ name: { $regex: validatedQuery.query, $options: 'i' } },
					{ alternateNames: { $regex: validatedQuery.query, $options: 'i' } },
					{ displayName: { $regex: validatedQuery.query, $options: 'i' } },
				],
			};

			if (validatedQuery.category) {
				searchQuery.category = validatedQuery.category;
			}

			const ingredients = await IngredientReference.find(searchQuery)
				.limit(validatedQuery.limit)
				.sort({ name: 1 });

			return res.status(200).json(ingredients);
		} catch (error) {
			if (error instanceof z.ZodError) {
				return res
					.status(400)
					.json({ error: 'Invalid search parameters', details: error.errors });
			}
			throw error;
		}
	}

	// List all ingredients (with optional category filter)
	const filter = category ? { category } : {};
	const ingredients = await IngredientReference.find(filter).sort({ name: 1 });
	return res.status(200).json(ingredients);
}

async function handlePost(req: VercelRequest, res: VercelResponse) {
	try {
		const validatedData = IngredientInputSchema.parse(req.body);

		// Check for existing ingredient with same name
		const existing = await IngredientReference.findOne({
			name: validatedData.name.toLowerCase(),
		});

		if (existing) {
			return res.status(409).json({
				error: 'Ingredient already exists',
				existingId: existing._id,
			});
		}

		const ingredient = new IngredientReference({
			...validatedData,
			name: validatedData.name.toLowerCase(),
			alternateNames: validatedData.alternateNames.map((name) =>
				name.toLowerCase()
			),
		});

		await ingredient.save();
		return res.status(201).json(ingredient);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ error: 'Invalid ingredient data', details: error.errors });
		}
		throw error;
	}
}

async function handlePut(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;
	if (!id) {
		return res.status(400).json({ error: 'Ingredient ID is required' });
	}

	try {
		const validatedData = IngredientInputSchema.parse(req.body);

		// Check if new name conflicts with another ingredient
		const existing = await IngredientReference.findOne({
			_id: { $ne: id },
			name: validatedData.name.toLowerCase(),
		});

		if (existing) {
			return res.status(409).json({
				error: 'Another ingredient with this name already exists',
				existingId: existing._id,
			});
		}

		const ingredient = await IngredientReference.findByIdAndUpdate(
			id,
			{
				...validatedData,
				name: validatedData.name.toLowerCase(),
				alternateNames: validatedData.alternateNames.map((name) =>
					name.toLowerCase()
				),
				updatedAt: new Date(),
			},
			{ new: true }
		);

		if (!ingredient) {
			return res.status(404).json({ error: 'Ingredient not found' });
		}

		return res.status(200).json(ingredient);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res
				.status(400)
				.json({ error: 'Invalid ingredient data', details: error.errors });
		}
		throw error;
	}
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
	const { id } = req.query;
	if (!id) {
		return res.status(400).json({ error: 'Ingredient ID is required' });
	}

	const ingredient = await IngredientReference.findByIdAndDelete(id);
	if (!ingredient) {
		return res.status(404).json({ error: 'Ingredient not found' });
	}

	return res.status(200).json({ message: 'Ingredient deleted successfully' });
}
