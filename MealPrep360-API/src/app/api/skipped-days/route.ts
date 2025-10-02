import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { User, SkippedDay } from '@/lib/mongodb/schemas';
import connectDB from '@/lib/mongodb/connection';
import { MEALPLAN_SERVICE_URL, MEALPLAN_SERVICE_API_KEY } from '@/lib/config';

export async function POST(request: Request) {
	try {
		await connectDB();
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { date, mealPlanId, dayIndex } = await request.json();
		if (!date) {
			return NextResponse.json({ error: 'Date is required' }, { status: 400 });
		}

		// Forward the skip to the meal plan service
		let serviceUrl;
		let requestBody;
		let method;

		if (mealPlanId && dayIndex !== undefined) {
			// Use the skip endpoint for specific meal plan
			serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/${mealPlanId}/days/${dayIndex}/skip`;
			method = 'POST';
			requestBody = {
				userId: user._id.toString(),
			};
		} else {
			// Use the skip-date endpoint for date-based skipping
			serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/skip-date`;
			method = 'POST';
			requestBody = {
				userId: user._id.toString(),
				date: date,
			};
		}

		const serviceRes = await fetch(serviceUrl, {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
			},
			body: JSON.stringify(requestBody),
		});

		const responseText = await serviceRes.text();

		if (!serviceRes.ok) {
			let errorMessage = 'Failed to forward skip to meal plan service';
			try {
				const errorData = JSON.parse(responseText);
				errorMessage = errorData.message || errorData.error || errorMessage;
			} catch (e) {
				// Error parsing response
			}
			return NextResponse.json(
				{ error: errorMessage },
				{ status: serviceRes.status }
			);
		}

		let responseData;
		try {
			responseData = responseText
				? JSON.parse(responseText)
				: { message: 'Day skipped successfully' };
		} catch (e) {
			responseData = { message: 'Day skipped successfully' };
		}

		return NextResponse.json(responseData);
	} catch (error) {
		console.error('[SkippedDay POST] Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: Request) {
	try {
		await connectDB();
		const { userId: clerkId } = await auth();
		if (!clerkId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const user = await User.findOne({ clerkId });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const { date, mealPlanId, dayIndex } = await request.json();
		if (!date) {
			return NextResponse.json({ error: 'Date is required' }, { status: 400 });
		}

		// Forward the unskip to the meal plan service
		let serviceUrl;
		let requestBody;
		let method;

		if (mealPlanId && dayIndex !== undefined) {
			// Use the unskip endpoint for specific meal plan
			serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans/${mealPlanId}/days/${dayIndex}/unskip`;
			method = 'POST';
			requestBody = {
				userId: user._id.toString(),
			};
		} else {
			// For date-based unskipping, we need to return an error since the service doesn't support this
			return NextResponse.json(
				{
					error: 'Cannot unskip by date only',
					message: 'Please provide mealPlanId and dayIndex for unskipping',
				},
				{ status: 400 }
			);
		}

		const serviceRes = await fetch(serviceUrl, {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
			},
			body: JSON.stringify(requestBody),
		});

		const responseText = await serviceRes.text();

		if (!serviceRes.ok) {
			let errorMessage = 'Failed to forward unskip to meal plan service';
			try {
				const errorData = JSON.parse(responseText);
				errorMessage = errorData.message || errorData.error || errorMessage;
			} catch (e) {
				// Error parsing response
			}
			return NextResponse.json(
				{ error: errorMessage },
				{ status: serviceRes.status }
			);
		}

		let responseData;
		try {
			responseData = responseText
				? JSON.parse(responseText)
				: { message: 'Day unskipped successfully' };
		} catch (e) {
			responseData = { message: 'Day unskipped successfully' };
		}

		return NextResponse.json(responseData);
	} catch (error) {
		console.error('[SkippedDay DELETE] Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

/**
 * @swagger
 * /api/skipped-days:
 *   get:
 *     tags:
 *       - Meal Planning
 *     summary: Get skipped meal plan days for a date range
 *     description: Returns skipped meal plan days for a specified date range, combining data from external meal plan service and local database
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the range (ISO date format, e.g., "2024-01-01")
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the range (ISO date format, e.g., "2024-01-31")
 *         example: "2024-01-31"
 *     responses:
 *       200:
 *         description: Skipped days retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date-time
 *                     description: Date of the skipped day
 *                     example: "2024-01-15T00:00:00.000Z"
 *                   status:
 *                     type: string
 *                     enum: ["skipped"]
 *                     description: Status of the day
 *                     example: "skipped"
 *             examples:
 *               skipped_days:
 *                 summary: Example skipped days response
 *                 value:
 *                   - date: "2024-01-15T00:00:00.000Z"
 *                     status: "skipped"
 *                   - date: "2024-01-22T00:00:00.000Z"
 *                     status: "skipped"
 *       400:
 *         description: Bad request - missing required parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missing_dates:
 *                 summary: Missing date parameters
 *                 value:
 *                   error: "startDate and endDate are required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: Request) {
	try {
		await connectDB();
		const { userId: clerkId } = await auth();
		if (!clerkId)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const user = await User.findOne({ clerkId });
		if (!user)
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get('startDate');
		const endDate = searchParams.get('endDate');

		if (!startDate || !endDate) {
			return NextResponse.json(
				{ error: 'startDate and endDate are required' },
				{ status: 400 }
			);
		}

		// Forward the request to the meal plan service
		const serviceUrl = `${MEALPLAN_SERVICE_URL}/api/meal-plans?startDate=${startDate}&endDate=${endDate}&userId=${user._id.toString()}`;

		const serviceRes = await fetch(serviceUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${MEALPLAN_SERVICE_API_KEY}`,
			},
		});

		// Get the response text first to check if it's valid JSON
		const responseText = await serviceRes.text();

		if (!serviceRes.ok) {
			let errorMessage = 'Failed to fetch meal plans from service';
			try {
				const errorData = JSON.parse(responseText);
				errorMessage = errorData.message || errorData.error || errorMessage;
			} catch (e) {
				// Error parsing response
			}
			return NextResponse.json(
				{ error: errorMessage },
				{ status: serviceRes.status }
			);
		}

		let responseData;
		let skippedDaysFromMealPlans = [];

		try {
			responseData = JSON.parse(responseText);
			// Extract all days from meal plans and filter for skipped ones
			skippedDaysFromMealPlans = responseData.flatMap((plan: any) =>
				plan.days
					.filter((day: any) => day.status === 'skipped')
					.map((day: any) => ({
						date: day.date,
						status: day.status,
					}))
			);
		} catch (e) {
			// If the response is not valid JSON, continue with empty array
			skippedDaysFromMealPlans = [];
		}

		// Also get locally stored skipped days
		let localSkippedDays: { date: string; status: string }[] = [];
		try {
			const localSkips = await SkippedDay.find({
				userId: user._id,
				date: {
					$gte: new Date(startDate),
					$lte: new Date(endDate),
				},
				status: 'skipped',
			});

			localSkippedDays = localSkips.map((skip: any) => ({
				date: skip.date.toISOString(),
				status: skip.status || 'skipped', // Default to 'skipped' if status is undefined
			}));
		} catch (dbError) {
			console.error('Error fetching local skipped days:', dbError);
		}

		// Combine and deduplicate skipped days
		const allSkippedDays = [...skippedDaysFromMealPlans, ...localSkippedDays];
		const uniqueSkippedDays = allSkippedDays.filter(
			(day, index, self) => index === self.findIndex((d) => d.date === day.date)
		);

		return NextResponse.json(uniqueSkippedDays);
	} catch (error) {
		console.error('[SkippedDay GET] Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export async function PATCH(request: Request) {
	try {
		await connectDB();
		const { userId: clerkId } = await auth();
		if (!clerkId)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const user = await User.findOne({ clerkId });
		if (!user)
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		const { date, status } = await request.json();
		if (!date)
			return NextResponse.json({ error: 'Date is required' }, { status: 400 });
		if (!status)
			return NextResponse.json(
				{ error: 'Status is required' },
				{ status: 400 }
			);

		// The external service doesn't have a day-based status update endpoint
		// This operation is not supported with the current service API
		return NextResponse.json(
			{
				error: 'Day-based status updates not supported',
				message:
					'Use meal plan specific endpoints with mealPlanId and dayIndex',
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('[SkippedDay PATCH] Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request) {
	try {
		await connectDB();
		const { userId: clerkId } = await auth();
		if (!clerkId)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		const user = await User.findOne({ clerkId });
		if (!user)
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		const { date, status } = await request.json();
		if (!date)
			return NextResponse.json({ error: 'Date is required' }, { status: 400 });
		if (!status)
			return NextResponse.json(
				{ error: 'Status is required' },
				{ status: 400 }
			);

		// The external service doesn't have a day-based status update endpoint
		// This operation is not supported with the current service API
		return NextResponse.json(
			{
				error: 'Day-based status updates not supported',
				message:
					'Use meal plan specific endpoints with mealPlanId and dayIndex',
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('[SkippedDay PUT] Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
