'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
	Box,
	CircularProgress,
	Typography,
	Grid,
	Button,
	Checkbox,
	FormControlLabel,
	Paper,
	Container,
	Stack,
	TextField,
	Chip,
	Switch,
	Tooltip,
	Slider,
} from '@mui/material';
import { useSnackbar } from '@/app/components/ui/snackbar';
import { useSettings } from '@/hooks/useSettings';
import {
	Tune as TuneIcon,
	Timer as TimerIcon,
	Favorite,
	Restaurant as RestaurantIcon,
	NoFood as NoFoodIcon,
	ChildCare as ChildCareIcon,
	LocalDining as LocalDiningIcon,
	Fastfood as FastFoodIcon,
	FitnessCenter as FitnessCenterIcon,
} from '@mui/icons-material';
import { MainNav } from '../components/shared/navigation/main-nav';
import { Footer } from '../components/shared/navigation/footer';
import { PageHeader } from '../components/shared/page-header';

const COOKING_SKILLS = ['Beginner', 'Intermediate', 'Advanced'];
const COOKING_TIMES = [
	'Quick (15-30 min) ',
	'Moderate (30-60 min)',
	'Long (60+ min)',
];
const CUISINES = [
	'American',
	'Italian',
	'Mexican',
	'Chinese',
	'Indi',
	'Japanese',
	'Thai',
	'Mediterranean',
	'French',
	'Greek',
];

const DIETARY_PREFERENCES = [
	'Vegetarian',
	'Vegan',
	'Pescatarian',
	'Gluten-Free',
	'Dairy-Free',
	'Low-Carb',
	'Keto',
	'Paleo',
	'Whole30',
	'Mediterranean',
];

const ALLERGIES = [
	'Dairy',
	'Eggs',
	'Peanuts',
	'Tree Nuts',
	'Soy',
	'Wheat',
	'Fish',
	'Shellfish',
	'Sesame',
	'Gluten',
];

export default function PreferencesPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { user } = useUser();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const {
		settings,
		updateSettings,
		isLoading: settingsLoading,
	} = useSettings();
	const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
	const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
	const [defaultServings, setDefaultServings] = useState(4);
	const [cookingSkill, setCookingSkill] = useState('Intermediate');
	const [cookingTime, setCookingTime] = useState('Moderate (30-60 min)');
	const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
	const [kidFriendly, setKidFriendly] = useState(false);
	const [quickMeals, setQuickMeals] = useState(false);
	const [healthyMeals, setHealthyMeals] = useState(false);
	const [customCuisine, setCustomCuisine] = useState('');

	useEffect(() => {
		if (!isLoaded || !isSignedIn) {
			router.push('/auth/signin');
			return;
		}

		if (settings) {
			setSelectedDietary(settings.preferences.dietaryPreferences || []);
			setSelectedAllergies(settings.preferences.allergies || []);
			setDefaultServings(settings.mealPlanning.defaultServings || 4);
			setCookingSkill(settings.preferences.cookingSkill || 'Intermediate');
			setCookingTime(
				settings.preferences.cookingTime || 'Moderate (30-60 min)'
			);
			setSelectedCuisines(settings.preferences.cuisines || []);
			setKidFriendly(settings.preferences.kidFriendly || false);
			setQuickMeals(settings.preferences.quickMeals || false);
			setHealthyMeals(settings.preferences.healthy || false);
		}
	}, [isLoaded, isSignedIn, router, settings]);

	const handleDietaryChange = async (preference: string, checked: boolean) => {
		const newDietary = checked
			? [...selectedDietary, preference]
			: selectedDietary.filter((p) => p !== preference);
		setSelectedDietary(newDietary);
		const result = await updateSettings(
			'preferences',
			'dietaryPreferences',
			newDietary
		);
		if (result.success) {
			showSnackbar('Your dietary preferences have been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleAllergyChange = async (allergy: string, checked: boolean) => {
		const newAllergies = checked
			? [...selectedAllergies, allergy]
			: selectedAllergies.filter((a) => a !== allergy);
		setSelectedAllergies(newAllergies);
		const result = await updateSettings(
			'preferences',
			'allergies',
			newAllergies
		);
		if (result.success) {
			showSnackbar('Your allergy information has been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleCookingSkillChange = async (skill: string) => {
		setCookingSkill(skill);
		const result = await updateSettings('preferences', 'cookingSkill', skill);
		if (result.success) {
			showSnackbar('Your cooking skill level has been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleCookingTimeChange = async (time: string) => {
		setCookingTime(time);
		const result = await updateSettings('preferences', 'cookingTime', time);
		if (result.success) {
			showSnackbar('Your preferred cooking time has been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleCuisineChange = async (cuisine: string, checked: boolean) => {
		const newCuisines = checked
			? [...selectedCuisines, cuisine]
			: selectedCuisines.filter((c) => c !== cuisine);
		setSelectedCuisines(newCuisines);
		const result = await updateSettings('preferences', 'cuisines', newCuisines);
		if (result.success) {
			showSnackbar('Your cuisine preferences have been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleKidFriendlyChange = async (checked: boolean) => {
		setKidFriendly(checked);
		const result = await updateSettings('preferences', 'kidFriendly', checked);
		if (result.success) {
			showSnackbar('Your kid-friendly preference has been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleQuickMealsChange = async (checked: boolean) => {
		setQuickMeals(checked);
		const result = await updateSettings('preferences', 'quickMeals', checked);
		if (result.success) {
			showSnackbar('Your quick meals preference has been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleHealthyMealsChange = async (checked: boolean) => {
		setHealthyMeals(checked);
		const result = await updateSettings('preferences', 'healthy', checked);
		if (result.success) {
			showSnackbar('Your healthy meals preference has been saved.', 'success');
		} else {
			showSnackbar('Failed to update preferences. Please try again.', 'error');
		}
	};

	const handleAddCustomCuisine = async (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === 'Enter' && customCuisine.trim()) {
			const newCuisine = customCuisine.trim();
			const newCuisines = [...selectedCuisines, newCuisine];
			setSelectedCuisines(newCuisines);
			setCustomCuisine('');
			const result = await updateSettings(
				'preferences',
				'cuisines',
				newCuisines
			);
			if (result.success) {
				showSnackbar('Your cuisine preferences have been saved.', 'success');
			} else {
				showSnackbar(
					'Failed to update preferences. Please try again.',
					'error'
				);
			}
		}
	};

	const handleAddCustomAllergy = async (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === 'Enter' && customCuisine.trim()) {
			const newAllergy = customCuisine.trim();
			const newAllergies = [...selectedAllergies, newAllergy];
			setSelectedAllergies(newAllergies);
			setCustomCuisine('');
			const result = await updateSettings(
				'preferences',
				'allergies',
				newAllergies
			);
			if (result.success) {
				showSnackbar('Your allergy information has been saved.', 'success');
			} else {
				showSnackbar(
					'Failed to update preferences. Please try again.',
					'error'
				);
			}
		}
	};

	const handleAddCustomDietary = async (
		event: React.KeyboardEvent<HTMLInputElement>
	) => {
		if (event.key === 'Enter' && customCuisine.trim()) {
			const newDietary = customCuisine.trim();
			const newDietaryPrefs = [...selectedDietary, newDietary];
			setSelectedDietary(newDietaryPrefs);
			setCustomCuisine('');
			const result = await updateSettings(
				'preferences',
				'dietaryPreferences',
				newDietaryPrefs
			);
			if (result.success) {
				showSnackbar('Your dietary preferences have been saved.', 'success');
			} else {
				showSnackbar(
					'Failed to update preferences. Please try again.',
					'error'
				);
			}
		}
	};

	if (!isLoaded || settingsLoading) {
		return (
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					minHeight: '100vh',
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				minHeight: '100vh',
			}}
		>
			<MainNav />
			<Container
				maxWidth='lg'
				sx={{ flex: 1, py: 4 }}
			>
				<PageHeader
					title='Preferences'
					description='Customize your meal planning experience'
					icon={<TuneIcon />}
				/>
				<Grid
					container
					spacing={4}
				>
					{/* Cooking Preferences Section */}
					<Grid
						item
						xs={12}
						md={6}
					>
						<Paper
							sx={{ p: 3 }}
							elevation={2}
						>
							<Stack spacing={3}>
								<Typography
									variant='h6'
									gutterBottom
								>
									<TimerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Cooking Preferences
								</Typography>
								<Typography
									variant='subtitle1'
									gutterBottom
								>
									Cooking Skill Level
								</Typography>
								<Box sx={{ px: 2 }}>
									<Slider
										value={COOKING_SKILLS.indexOf(cookingSkill)}
										onChange={(_, value) =>
											setCookingSkill(COOKING_SKILLS[value as number])
										}
										onChangeCommitted={(_, value) =>
											handleCookingSkillChange(COOKING_SKILLS[value as number])
										}
										step={1}
										marks
										min={0}
										max={2}
										valueLabelDisplay='auto'
										valueLabelFormat={(value) => COOKING_SKILLS[value]}
									/>
								</Box>
								<Typography
									variant='subtitle1'
									gutterBottom
									sx={{ mt: 3 }}
								>
									Preferred Cooking Time
								</Typography>
								<Box sx={{ px: 2 }}>
									<Slider
										value={COOKING_TIMES.indexOf(cookingTime)}
										onChange={(_, value) =>
											setCookingTime(COOKING_TIMES[value as number])
										}
										onChangeCommitted={(_, value) =>
											handleCookingTimeChange(COOKING_TIMES[value as number])
										}
										step={1}
										marks
										min={0}
										max={2}
										valueLabelDisplay='auto'
										valueLabelFormat={(value) => COOKING_TIMES[value]}
									/>
								</Box>
							</Stack>
						</Paper>
					</Grid>

					{/* Additional Preferences Section */}
					<Grid
						item
						xs={12}
						md={6}
					>
						<Paper
							sx={{ p: 3 }}
							elevation={2}
						>
							<Box>
								<Typography
									variant='h6'
									gutterBottom
								>
									<LocalDiningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Additional Preferences
								</Typography>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'column',
										gap: 2,
										mt: 2,
									}}
								>
									<FormControlLabel
										control={
											<Switch
												checked={kidFriendly}
												onChange={(e) =>
													handleKidFriendlyChange(e.target.checked)
												}
											/>
										}
										label={
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<ChildCareIcon sx={{ mr: 1 }} />
												Kid-Friendly Recipes
											</Box>
										}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={healthyMeals}
												onChange={(e) =>
													handleHealthyMealsChange(e.target.checked)
												}
											/>
										}
										label={
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<FitnessCenterIcon sx={{ mr: 1 }} />
												Healthy Meals
											</Box>
										}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={quickMeals}
												onChange={(e) =>
													handleQuickMealsChange(e.target.checked)
												}
											/>
										}
										label={
											<Box sx={{ display: 'flex', alignItems: 'center' }}>
												<FastFoodIcon sx={{ mr: 1 }} />
												Quick & Easy Meals
											</Box>
										}
									/>
								</Box>
							</Box>
						</Paper>
					</Grid>

					{/* Dietary Preferences Section */}
					<Grid
						item
						xs={12}
						md={4}
					>
						<Paper
							sx={{ p: 3, height: '100%' }}
							elevation={2}
						>
							<Stack spacing={3}>
								<Typography
									variant='h6'
									gutterBottom
								>
									<Favorite sx={{ mr: 1, verticalAlign: 'middle' }} />
									Dietary Preferences
								</Typography>
								{DIETARY_PREFERENCES.map((preference) => (
									<FormControlLabel
										key={preference}
										control={
											<Checkbox
												checked={selectedDietary.includes(preference)}
												onChange={(e) =>
													handleDietaryChange(preference, e.target.checked)
												}
											/>
										}
										label={preference}
									/>
								))}
								<TextField
									label='Add Custom Dietary Preference'
									value={customCuisine}
									onChange={(e) => setCustomCuisine(e.target.value)}
									onKeyDown={handleAddCustomDietary}
									fullWidth
									helperText='Press Enter to add'
								/>
							</Stack>
						</Paper>
					</Grid>

					{/* Allergies & Restrictions Section */}
					<Grid
						item
						xs={12}
						md={4}
					>
						<Paper
							sx={{ p: 3, height: '100%' }}
							elevation={2}
						>
							<Stack spacing={3}>
								<Typography
									variant='h6'
									gutterBottom
								>
									<NoFoodIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Allergies & Restrictions
								</Typography>
								{ALLERGIES.map((allergy) => (
									<FormControlLabel
										key={allergy}
										control={
											<Checkbox
												checked={selectedAllergies.includes(allergy)}
												onChange={(e) =>
													handleAllergyChange(allergy, e.target.checked)
												}
											/>
										}
										label={allergy}
									/>
								))}
								<TextField
									label='Add Custom Allergy'
									value={customCuisine}
									onChange={(e) => setCustomCuisine(e.target.value)}
									onKeyDown={handleAddCustomAllergy}
									fullWidth
									helperText='Press Enter to add'
								/>
							</Stack>
						</Paper>
					</Grid>

					{/* Preferred Cuisines Section */}
					<Grid
						item
						xs={12}
						md={4}
					>
						<Paper
							sx={{ p: 3, height: '100%' }}
							elevation={2}
						>
							<Stack spacing={3}>
								<Typography
									variant='h6'
									gutterBottom
								>
									<RestaurantIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
									Preferred Cuisines
								</Typography>
								{CUISINES.map((cuisine) => (
									<FormControlLabel
										key={cuisine}
										control={
											<Checkbox
												checked={selectedCuisines.includes(cuisine)}
												onChange={(e) =>
													handleCuisineChange(cuisine, e.target.checked)
												}
											/>
										}
										label={cuisine}
									/>
								))}
								<TextField
									label='Add Custom Cuisine'
									value={customCuisine}
									onChange={(e) => setCustomCuisine(e.target.value)}
									onKeyDown={handleAddCustomCuisine}
									fullWidth
									helperText='Press Enter to add'
								/>
							</Stack>
						</Paper>
					</Grid>
				</Grid>
			</Container>
			<Footer />
		</Box>
	);
}
