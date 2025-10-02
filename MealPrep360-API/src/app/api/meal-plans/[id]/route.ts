import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, MealPlan, Recipe } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

/**
 * @swagger
 * /api/meal-plans/{id}:
 *   get:
 *     tags:
 *       - Meal Plans
 *     summary: Get a specific meal plan by ID
 *     description: Retrieves a specific meal plan for the authenticated user
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The meal plan ID
 *     responses:
 *       200:
 *         description: Successfully retrieved meal plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 id:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date
 *                 endDate:
 *                   type: string
 *                   format: date
 *                 userId:
 *                   type: string
 *                 days:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       recipeId:
 *                         type: string
 *                       recipe:
 *                         type: object
 *                       servings:
 *                         type: number
 *                       status:
 *                         type: string
 *                       mealType:
 *                         type: string
 *                       dayIndex:
 *                         type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal plan not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const mealPlanId = params.id;

		// Try to find the meal plan in local database first
		let mealPlan = await MealPlan.findOne({
			_id: mealPlanId,
			userId: user._id,
		})
			.populate({
				path: 'recipeItems.recipeId',
				model: Recipe,
				select: 'title servings prepTime imageUrl images.main',
			})
			.lean();

		// If not found locally and we have service config, try external service
		if (!mealPlan && MEALPLAN_SERVICE_URL && MEALPLAN_SERVICE_API_KEY) {
			try {
				const serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/${mealPlanId}`;

				const serviceResponse = await fetch(serviceUrl, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
					},
				});

				if (serviceResponse.ok) {
					const serviceData = await serviceResponse.text();
					try {
						mealPlan = serviceData ? JSON.parse(serviceData) : null;
					} catch (parseError) {
						console.error(
							'[MEAL_PLAN_GET] Failed to parse service response:',
							parseError
						);
					}
				}
			} catch (serviceError) {
				console.error('[MEAL_PLAN_GET] External service error:', serviceError);
			}
		}

		if (!mealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			);
		}

		// Transform meal plan to maintain compatibility with frontend
		let transformedMealPlan;
		const mealPlanObj = mealPlan as any;
		if (mealPlanObj.recipeItems) {
			// Local database format - convert recipeItems to days format
			transformedMealPlan = {
				_id: mealPlanObj._id.toString(),
				id: mealPlanObj._id.toString(),
				startDate: mealPlanObj.startDate,
				endDate: mealPlanObj.endDate,
				userId: mealPlanObj.userId,
				days:
					mealPlanObj.recipeItems?.map((item: any) => ({
						date: item.date,
						recipeId: item.recipeId?._id?.toString() || item.recipeId,
						recipe: item.recipeId
							? {
									id: item.recipeId._id,
									title: item.recipeId.title,
									servings: item.recipeId.servings,
									prepTime: item.recipeId.prepTime,
									imageUrl:
										item.recipeId.imageUrl || item.recipeId.images?.main || '',
								}
							: null,
						servings: item.servings || 4,
						status: item.status || 'planned',
						mealType: item.mealType || 'dinner',
						dayIndex: item.dayIndex,
					})) || [],
				createdAt: mealPlanObj.createdAt,
				updatedAt: mealPlanObj.updatedAt,
			};
		} else {
			// External service format - already has days format
			transformedMealPlan = {
				_id: mealPlanObj.id,
				id: mealPlanObj.id,
				startDate: mealPlanObj.startDate,
				endDate: mealPlanObj.endDate,
				userId: mealPlanObj.userId,
				days:
					mealPlanObj.days?.map((day: any, index: number) => ({
						date: new Date(
							new Date(mealPlanObj.startDate).getTime() +
								index * 24 * 60 * 60 * 1000
						),
						recipeId: day.recipeId,
						recipe: null, // Will need to fetch recipe details separately
						servings: 4,
						status: day.status || 'planned',
						mealType: 'dinner',
						dayIndex: index,
					})) || [],
				createdAt: mealPlanObj.createdAt,
				updatedAt: mealPlanObj.updatedAt,
			};
		}

		return NextResponse.json(transformedMealPlan);
	} catch (error) {
		console.error('[MEAL_PLAN_GET] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to fetch meal plan' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/meal-plans/{id}:
 *   put:
 *     tags:
 *       - Meal Plans
 *     summary: Update a specific meal plan
 *     description: Updates a specific meal plan for the authenticated user
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The meal plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               days:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Successfully updated meal plan
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal plan not found
 *       500:
 *         description: Internal server error
 */
export async function PUT(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const mealPlanId = params.id;
		const body = await req.json();

		// Try to update the meal plan in local database first
		let updatedMealPlan = await MealPlan.findOneAndUpdate(
			{
				_id: mealPlanId,
				userId: user._id,
			},
			body,
			{ new: true }
		)
			.populate({
				path: 'recipeItems.recipeId',
				model: Recipe,
				select: 'title servings prepTime imageUrl images.main',
			})
			.lean();

		// If not found locally and we have service config, try external service
		if (!updatedMealPlan && MEALPLAN_SERVICE_URL && MEALPLAN_SERVICE_API_KEY) {
			try {
				const serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/${mealPlanId}`;

				const serviceResponse = await fetch(serviceUrl, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
					},
					body: JSON.stringify(body),
				});

				if (serviceResponse.ok) {
					const serviceData = await serviceResponse.text();
					try {
						updatedMealPlan = serviceData ? JSON.parse(serviceData) : null;
					} catch (parseError) {
						console.error(
							'[MEAL_PLAN_PUT] Failed to parse service response:',
							parseError
						);
					}
				}
			} catch (serviceError) {
				console.error('[MEAL_PLAN_PUT] External service error:', serviceError);
			}
		}

		if (!updatedMealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			);
		}

		// Transform meal plan to maintain compatibility with frontend
		let transformedMealPlan;
		const updatedMealPlanObj = updatedMealPlan as any;
		if (updatedMealPlanObj.recipeItems) {
			// Local database format - convert recipeItems to days format
			transformedMealPlan = {
				_id: updatedMealPlanObj._id.toString(),
				id: updatedMealPlanObj._id.toString(),
				startDate: updatedMealPlanObj.startDate,
				endDate: updatedMealPlanObj.endDate,
				userId: updatedMealPlanObj.userId,
				days:
					updatedMealPlanObj.recipeItems?.map((item: any) => ({
						date: item.date,
						recipeId: item.recipeId?._id?.toString() || item.recipeId,
						recipe: item.recipeId
							? {
									id: item.recipeId._id,
									title: item.recipeId.title,
									servings: item.recipeId.servings,
									prepTime: item.recipeId.prepTime,
									imageUrl:
										item.recipeId.imageUrl || item.recipeId.images?.main || '',
								}
							: null,
						servings: item.servings || 4,
						status: item.status || 'planned',
						mealType: item.mealType || 'dinner',
						dayIndex: item.dayIndex,
					})) || [],
				createdAt: updatedMealPlanObj.createdAt,
				updatedAt: updatedMealPlanObj.updatedAt,
			};
		} else {
			// External service format - already has days format
			transformedMealPlan = {
				_id: updatedMealPlanObj.id,
				id: updatedMealPlanObj.id,
				startDate: updatedMealPlanObj.startDate,
				endDate: updatedMealPlanObj.endDate,
				userId: updatedMealPlanObj.userId,
				days:
					updatedMealPlanObj.days?.map((day: any, index: number) => ({
						date: new Date(
							new Date(updatedMealPlanObj.startDate).getTime() +
								index * 24 * 60 * 60 * 1000
						),
						recipeId: day.recipeId,
						recipe: null, // Will need to fetch recipe details separately
						servings: 4,
						status: day.status || 'planned',
						mealType: 'dinner',
						dayIndex: index,
					})) || [],
				createdAt: updatedMealPlanObj.createdAt,
				updatedAt: updatedMealPlanObj.updatedAt,
			};
		}

		return NextResponse.json(transformedMealPlan);
	} catch (error) {
		console.error('[MEAL_PLAN_PUT] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to update meal plan' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/meal-plans/{id}:
 *   delete:
 *     tags:
 *       - Meal Plans
 *     summary: Delete a specific meal plan
 *     description: Deletes a specific meal plan for the authenticated user
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The meal plan ID
 *     responses:
 *       204:
 *         description: Successfully deleted meal plan
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Meal plan not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(
	req: Request,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId: userId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const mealPlanId = params.id;

		// Try to delete the meal plan from local database first
		let deletedMealPlan = await MealPlan.findOneAndDelete({
			_id: mealPlanId,
			userId: user._id,
		});

		// If not found locally and we have service config, try external service
		if (!deletedMealPlan && MEALPLAN_SERVICE_URL && MEALPLAN_SERVICE_API_KEY) {
			try {
				const serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/${mealPlanId}`;

				const serviceResponse = await fetch(serviceUrl, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
					},
				});

				if (serviceResponse.ok || serviceResponse.status === 204) {
					deletedMealPlan = { _id: mealPlanId }; // Mark as deleted
				}
			} catch (serviceError) {
				console.error(
					'[MEAL_PLAN_DELETE] External service error:',
					serviceError
				);
			}
		}

		if (!deletedMealPlan) {
			return NextResponse.json(
				{ error: 'Meal plan not found' },
				{ status: 404 }
			);
		}

		return new NextResponse(null, { status: 204 });
	} catch (error) {
		console.error('[MEAL_PLAN_DELETE] Error:', error);
		return NextResponse.json(
			{ error: 'Failed to delete meal plan' },
			{ status: 500 }
		);
	}
}
