import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../../src/utils/database';
import { IngredientReference } from '../../src/models/IngredientReference';
import { z } from 'zod';
import { CategorySchema } from '../../src/types';

// Schema for bulk ingredient operations
const BulkIngredientSchema = z.object({
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

const BulkOperationSchema = z.object({
    operation: z.enum(['create', 'update', 'delete']),
    ingredients: z.array(BulkIngredientSchema),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        await connectToDatabase();

        const validatedData = BulkOperationSchema.parse(req.body);
        const { operation, ingredients } = validatedData;

        const results = {
            successful: [] as string[],
            failed: [] as { name: string; error: string }[],
        };

        switch (operation) {
            case 'create':
                for (const ingredient of ingredients) {
                    try {
                        const existing = await IngredientReference.findOne({
                            name: ingredient.name.toLowerCase(),
                        });

                        if (existing) {
                            results.failed.push({
                                name: ingredient.name,
                                error: 'Ingredient already exists',
                            });
                            continue;
                        }

                        const newIngredient = new IngredientReference({
                            ...ingredient,
                            name: ingredient.name.toLowerCase(),
                            alternateNames: ingredient.alternateNames.map(name => name.toLowerCase()),
                        });
                        await newIngredient.save();
                        results.successful.push(ingredient.name);
                    } catch (error) {
                        results.failed.push({
                            name: ingredient.name,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                }
                break;

            case 'update':
                for (const ingredient of ingredients) {
                    try {
                        const updated = await IngredientReference.findOneAndUpdate(
                            { name: ingredient.name.toLowerCase() },
                            {
                                ...ingredient,
                                name: ingredient.name.toLowerCase(),
                                alternateNames: ingredient.alternateNames.map(name => name.toLowerCase()),
                                updatedAt: new Date(),
                            },
                            { new: true }
                        );

                        if (updated) {
                            results.successful.push(ingredient.name);
                        } else {
                            results.failed.push({
                                name: ingredient.name,
                                error: 'Ingredient not found',
                            });
                        }
                    } catch (error) {
                        results.failed.push({
                            name: ingredient.name,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                }
                break;

            case 'delete':
                for (const ingredient of ingredients) {
                    try {
                        const deleted = await IngredientReference.findOneAndDelete({
                            name: ingredient.name.toLowerCase(),
                        });

                        if (deleted) {
                            results.successful.push(ingredient.name);
                        } else {
                            results.failed.push({
                                name: ingredient.name,
                                error: 'Ingredient not found',
                            });
                        }
                    } catch (error) {
                        results.failed.push({
                            name: ingredient.name,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                    }
                }
                break;
        }

        return res.status(200).json({
            operation,
            results: {
                successful: results.successful.length,
                failed: results.failed.length,
                details: results,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Invalid request data',
                details: error.errors,
            });
        }

        console.error('Error in bulk ingredient operation:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}