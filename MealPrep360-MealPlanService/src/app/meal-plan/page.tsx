'use client';

import { useState, useEffect } from 'react';
import { MealPlan, MealPlanPreferences } from '../types/mealPlan';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function MealPlanPage() {
	const { user } = useUser();
	const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
	const [savedMealPlans, setSavedMealPlans] = useState<MealPlan[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [preferences, setPreferences] = useState<MealPlanPreferences>({
		startDate: new Date(),
		duration: 7,
	});

	useEffect(() => {
		loadSavedMealPlans();
	}, []);

	const loadSavedMealPlans = async () => {
		try {
			// Get date range for the last 30 days
			const endDate = new Date();
			const startDate = new Date();
			startDate.setDate(startDate.getDate() - 30);

			const response = await fetch(
				`/api/meal-plans?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
			);
			if (!response.ok) {
				throw new Error('Failed to load saved meal plans');
			}
			const data = await response.json();
			setSavedMealPlans(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to load saved meal plans'
			);
		}
	};

	const handleGenerateMealPlan = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch('/api/meal-plans', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: user?.id,
					startDate: preferences.startDate.toISOString(),
					duration: preferences.duration,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				if (errorData.code === 'NO_RECIPES') {
					throw new Error(errorData.message);
				}
				throw new Error('Failed to generate meal plan');
			}

			const data = await response.json();
			setMealPlan(data);
			// Refresh the saved meal plans list
			await loadSavedMealPlans();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to generate meal plan'
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='container mx-auto p-4'>
			<h1 className='text-2xl font-bold mb-6'>Meal Plan Generator</h1>

			<div className='mb-8 p-4 border rounded'>
				<h2 className='text-xl font-semibold mb-4'>Preferences</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<div>
						<label className='block mb-2'>Start Date</label>
						<input
							type='date'
							value={preferences.startDate.toISOString().split('T')[0]}
							onChange={(e) =>
								setPreferences({
									...preferences,
									startDate: new Date(e.target.value),
								})
							}
							className='border p-2 rounded w-full'
						/>
					</div>
					<div>
						<label className='block mb-2'>Duration (days)</label>
						<input
							type='number'
							value={preferences.duration}
							onChange={(e) =>
								setPreferences({
									...preferences,
									duration: parseInt(e.target.value),
								})
							}
							min='1'
							max='30'
							className='border p-2 rounded w-full'
						/>
					</div>
				</div>

				<button
					onClick={handleGenerateMealPlan}
					disabled={isLoading}
					className={`mt-4 px-4 py-2 rounded ${
						isLoading
							? 'bg-gray-400 cursor-not-allowed'
							: 'bg-blue-500 hover:bg-blue-600'
					} text-white`}
				>
					{isLoading ? 'Generating...' : 'Generate Meal Plan'}
				</button>

				{error && (
					<div className='mt-4 p-4 bg-red-100 text-red-700 rounded'>
						<p>{error}</p>
						{error.includes('No saved recipes found') && (
							<div className='mt-2'>
								<Link
									href='/recipes'
									className='text-blue-600 hover:text-blue-800 underline'
								>
									Add some recipes to your collection
								</Link>
							</div>
						)}
					</div>
				)}
			</div>

			{savedMealPlans.length > 0 && (
				<div className='mb-8'>
					<h2 className='text-xl font-semibold mb-4'>Saved Meal Plans</h2>
					<pre className='bg-gray-100 p-4 rounded overflow-auto'>
						{JSON.stringify(savedMealPlans, null, 2)}
					</pre>
				</div>
			)}

			{mealPlan && (
				<div>
					<h2 className='text-xl font-semibold mb-4'>Your Meal Plan</h2>
					<pre className='bg-gray-100 p-4 rounded overflow-auto'>
						{JSON.stringify(mealPlan, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
