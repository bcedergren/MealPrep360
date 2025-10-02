'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/settings-context';
import type { UserSettings } from '@/contexts/settings-context';
import { useLanguage } from '@/contexts/language-context';
import {
	Box,
	Container,
	Typography,
	Paper,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	FormGroup,
	FormControlLabel,
	SelectChangeEvent,
	Grid,
	Switch,
	Stack,
	CircularProgress,
	Button,
} from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';
import { NotificationPreferences } from '../components/notifications/NotificationPreferences';
import { useSnackbar } from '@/app/components/ui/snackbar';
import { MainNav } from '../components/shared/navigation/main-nav';
import { Footer } from '../components/shared/navigation/footer';
import { PageHeader } from '../components/shared/page-header';

export default function SettingsPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();
	const { showSnackbar } = useSnackbar();
	const {
		settings,
		updateSettings,
		isLoading: isSettingsLoading,
	} = useSettings();
	const { translations } = useLanguage();
	const [isLoading, setIsLoading] = useState(false);

	// Default settings to use when settings is null or undefined
	const defaultSettings: UserSettings = {
		theme: {
			mode: 'light' as const,
			contrast: false,
			animations: true,
		},
		display: {
			recipeLayout: 'grid' as const,
			fontSize: 'medium' as const,
			imageQuality: 'medium' as const,
		},
		language: {
			preferred: 'en' as const,
			measurementSystem: 'metric' as const,
		},
		notifications: {
			email: true,
			push: false,
			mealPlanReminders: true,
			shoppingListReminders: true,
			quietHours: {
				enabled: false,
				start: '22:00',
				end: '08:00',
			},
		},
		privacy: {
			profileVisibility: 'private' as const,
			shareRecipes: false,
			showCookingHistory: false,
		},
		security: {
			twoFactorAuth: false,
		},
		mealPlanning: {
			weeklyPlanningEnabled: true,
			shoppingListEnabled: true,
			nutritionTrackingEnabled: true,
			defaultDuration: '30 minutes' as string,
			defaultServings: 4 as number,
		},
		integrations: {
			calendar: 'none' as const,
			shoppingList: 'none' as const,
		},
		preferences: {
			dietaryPreferences: [],
			allergies: [],
			cookingSkill: 'Intermediate',
			cookingTime: 'Moderate (30-60 min)',
			cuisines: [],
			kidFriendly: false,
			quickMeals: false,
			healthy: false,
		},
		onboarding: {
			tutorialCompleted: false,
		},
	};

	// Redirect if not authenticated
	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.push('/sign-in');
		}
	}, [isLoaded, isSignedIn, router]);

	// Ensure all required settings are present and properly typed
	const safeSettings = settings
		? {
				...defaultSettings,
				...settings,
				theme: { ...defaultSettings.theme, ...settings.theme },
				display: { ...defaultSettings.display, ...settings.display },
				language: { ...defaultSettings.language, ...settings.language },
				notifications: {
					...defaultSettings.notifications,
					...settings.notifications,
				},
				privacy: { ...defaultSettings.privacy, ...settings.privacy },
				security: { ...defaultSettings.security, ...settings.security },
				mealPlanning: {
					...defaultSettings.mealPlanning,
					...settings.mealPlanning,
				},
				integrations: {
					...defaultSettings.integrations,
					...settings.integrations,
				},
				preferences: {
					...defaultSettings.preferences,
					...settings.preferences,
				},
				onboarding: {
					...defaultSettings.onboarding,
					...settings.onboarding,
				},
			}
		: defaultSettings;

	if (!isLoaded || isSettingsLoading) {
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

	if (!isSignedIn) {
		return null; // Router will handle redirect
	}

	const handleThemeChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newMode = event.target.checked ? 'dark' : 'light';
			const result = await updateSettings({
				theme: {
					...safeSettings.theme,
					mode: newMode,
				},
			});
			if (result.success) {
				showSnackbar(`Theme changed to ${newMode} mode.`, 'success');
			} else {
				showSnackbar('Failed to update theme. Please try again.', 'error');
			}
		} catch (error) {
			console.error('Error updating theme:', error);
			showSnackbar('Failed to update theme. Please try again.', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleLayoutChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newLayout = event.target.checked ? 'list' : 'grid';
			const result = await updateSettings({
				display: {
					recipeLayout: newLayout,
					fontSize: safeSettings.display.fontSize,
					imageQuality: safeSettings.display.imageQuality,
				},
			});
			if (result.success) {
				showSnackbar(`Recipe layout changed to ${newLayout} view.`, 'success');
			} else {
				showSnackbar('Failed to update layout. Please try again.', 'error');
			}
		} catch (error) {
			console.error('Error updating layout:', error);
			showSnackbar('Failed to update layout. Please try again.', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleLanguageChange = async (
		event: SelectChangeEvent<
			'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko' | 'ru'
		>
	) => {
		setIsLoading(true);
		try {
			const newLanguage = event.target.value;
			const result = await updateSettings({
				language: {
					preferred: newLanguage as
						| 'en'
						| 'es'
						| 'fr'
						| 'de'
						| 'it'
						| 'pt'
						| 'zh'
						| 'ja'
						| 'ko'
						| 'ru',
					measurementSystem: safeSettings.language.measurementSystem,
				},
			});
			if (result.success) {
				showSnackbar(
					`Language changed to ${newLanguage.toUpperCase()}.`,
					'success'
				);
			} else {
				showSnackbar('Failed to update language. Please try again.', 'error');
			}
		} catch (error) {
			console.error('Error updating language:', error);
			showSnackbar('Failed to update language. Please try again.', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleContrastChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newContrast = event.target.checked;
			const result = await updateSettings({
				theme: {
					mode: safeSettings.theme.mode,
					contrast: newContrast,
					animations: safeSettings.theme.animations,
				},
			});
			if (result.success) {
				showSnackbar(
					`High contrast mode ${newContrast ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update contrast settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating contrast:', error);
			showSnackbar(
				'Failed to update contrast settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleAnimationsChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newAnimations = event.target.checked;
			const result = await updateSettings({
				theme: {
					mode: safeSettings.theme.mode,
					contrast: safeSettings.theme.contrast,
					animations: newAnimations,
				},
			});
			if (result.success) {
				showSnackbar(
					`Animations ${newAnimations ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update animation settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating animations:', error);
			showSnackbar(
				'Failed to update animation settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEmailNotificationsChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newEmailNotifications = event.target.checked;
			const result = await updateSettings({
				notifications: {
					email: newEmailNotifications,
					push: safeSettings.notifications.push,
					mealPlanReminders: safeSettings.notifications.mealPlanReminders,
					shoppingListReminders:
						safeSettings.notifications.shoppingListReminders,
					quietHours: safeSettings.notifications.quietHours,
				},
			});
			if (result.success) {
				showSnackbar(
					`Email notifications ${newEmailNotifications ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update email notification settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating email notifications:', error);
			showSnackbar(
				'Failed to update email notification settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handlePushNotificationsChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newPushNotifications = event.target.checked;
			const result = await updateSettings({
				notifications: {
					email: safeSettings.notifications.email,
					push: newPushNotifications,
					mealPlanReminders: safeSettings.notifications.mealPlanReminders,
					shoppingListReminders:
						safeSettings.notifications.shoppingListReminders,
					quietHours: safeSettings.notifications.quietHours,
				},
			});
			if (result.success) {
				showSnackbar(
					`Push notifications ${newPushNotifications ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update push notification settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating push notifications:', error);
			showSnackbar(
				'Failed to update push notification settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleMealPlanRemindersChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newMealPlanReminders = event.target.checked;
			const result = await updateSettings({
				notifications: {
					email: safeSettings.notifications.email,
					push: safeSettings.notifications.push,
					mealPlanReminders: newMealPlanReminders,
					shoppingListReminders:
						safeSettings.notifications.shoppingListReminders,
					quietHours: safeSettings.notifications.quietHours,
				},
			});
			if (result.success) {
				showSnackbar(
					`Meal plan reminders ${newMealPlanReminders ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update meal plan reminder settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating meal plan reminders:', error);
			showSnackbar(
				'Failed to update meal plan reminder settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleShoppingListRemindersChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newShoppingListReminders = event.target.checked;
			const result = await updateSettings({
				notifications: {
					email: safeSettings.notifications.email,
					push: safeSettings.notifications.push,
					mealPlanReminders: safeSettings.notifications.mealPlanReminders,
					shoppingListReminders: newShoppingListReminders,
					quietHours: safeSettings.notifications.quietHours,
				},
			});
			if (result.success) {
				showSnackbar(
					`Shopping list reminders ${newShoppingListReminders ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update shopping list reminder settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating shopping list reminders:', error);
			showSnackbar(
				'Failed to update shopping list reminder settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleProfileVisibilityChange = async (
		event: SelectChangeEvent<'public' | 'private'>
	) => {
		setIsLoading(true);
		try {
			const newVisibility = event.target.value as 'public' | 'private';
			const result = await updateSettings({
				privacy: {
					profileVisibility: newVisibility,
					shareRecipes: safeSettings.privacy.shareRecipes,
					showCookingHistory: safeSettings.privacy.showCookingHistory,
				},
			});
			if (result.success) {
				showSnackbar(
					`Profile visibility changed to ${newVisibility}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update profile visibility. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating profile visibility:', error);
			showSnackbar(
				'Failed to update profile visibility. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleShareRecipesChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newShareRecipes = event.target.checked;
			const result = await updateSettings({
				privacy: {
					profileVisibility: safeSettings.privacy.profileVisibility,
					shareRecipes: newShareRecipes,
					showCookingHistory: safeSettings.privacy.showCookingHistory,
				},
			});
			if (result.success) {
				showSnackbar(
					`Recipe sharing ${newShareRecipes ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update recipe sharing settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating recipe sharing:', error);
			showSnackbar(
				'Failed to update recipe sharing settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleShowCookingHistoryChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newShowHistory = event.target.checked;
			const result = await updateSettings({
				privacy: {
					profileVisibility: safeSettings.privacy.profileVisibility,
					shareRecipes: safeSettings.privacy.shareRecipes,
					showCookingHistory: newShowHistory,
				},
			});
			if (result.success) {
				showSnackbar(
					`Cooking history visibility ${newShowHistory ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update cooking history settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating cooking history visibility:', error);
			showSnackbar(
				'Failed to update cooking history settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTwoFactorAuthChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newTwoFactorAuth = event.target.checked;
			const result = await updateSettings({
				security: {
					twoFactorAuth: newTwoFactorAuth,
				},
			});
			if (result.success) {
				showSnackbar(
					`Two-factor authentication ${newTwoFactorAuth ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update two-factor authentication settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating two-factor authentication:', error);
			showSnackbar(
				'Failed to update two-factor authentication settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleWeeklyPlanningChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newWeeklyPlanning = event.target.checked;
			const result = await updateSettings({
				mealPlanning: {
					weeklyPlanningEnabled: newWeeklyPlanning,
					shoppingListEnabled: safeSettings.mealPlanning.shoppingListEnabled,
					nutritionTrackingEnabled:
						safeSettings.mealPlanning.nutritionTrackingEnabled,
					defaultDuration: safeSettings.mealPlanning.defaultDuration,
					defaultServings: safeSettings.mealPlanning.defaultServings,
				},
			});
			if (result.success) {
				showSnackbar(
					`Weekly meal planning ${newWeeklyPlanning ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update weekly planning settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating weekly planning:', error);
			showSnackbar(
				'Failed to update weekly planning settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleShoppingListEnabledChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newShoppingListEnabled = event.target.checked;
			const result = await updateSettings({
				mealPlanning: {
					weeklyPlanningEnabled:
						safeSettings.mealPlanning.weeklyPlanningEnabled,
					shoppingListEnabled: newShoppingListEnabled,
					nutritionTrackingEnabled:
						safeSettings.mealPlanning.nutritionTrackingEnabled,
					defaultDuration: safeSettings.mealPlanning.defaultDuration,
					defaultServings: safeSettings.mealPlanning.defaultServings,
				},
			});
			if (result.success) {
				showSnackbar(
					`Shopping list feature ${newShoppingListEnabled ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update shopping list settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating shopping list settings:', error);
			showSnackbar(
				'Failed to update shopping list settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleNutritionTrackingChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		setIsLoading(true);
		try {
			const newNutritionTracking = event.target.checked;
			const result = await updateSettings({
				mealPlanning: {
					weeklyPlanningEnabled:
						safeSettings.mealPlanning.weeklyPlanningEnabled,
					shoppingListEnabled: safeSettings.mealPlanning.shoppingListEnabled,
					nutritionTrackingEnabled: newNutritionTracking,
					defaultDuration: safeSettings.mealPlanning.defaultDuration,
					defaultServings: safeSettings.mealPlanning.defaultServings,
				},
			});
			if (result.success) {
				showSnackbar(
					`Nutrition tracking ${newNutritionTracking ? 'enabled' : 'disabled'}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update nutrition tracking settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating nutrition tracking:', error);
			showSnackbar(
				'Failed to update nutrition tracking settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCalendarIntegrationChange = async (
		event: SelectChangeEvent<'none' | 'google' | 'outlook' | 'apple'>
	) => {
		setIsLoading(true);
		try {
			const newCalendarIntegration = event.target.value as
				| 'none'
				| 'google'
				| 'outlook'
				| 'apple';
			const result = await updateSettings({
				integrations: {
					calendar: newCalendarIntegration,
					shoppingList: safeSettings.integrations.shoppingList,
				},
			});
			if (result.success) {
				showSnackbar(
					`Calendar integration changed to ${newCalendarIntegration === 'none' ? 'disabled' : newCalendarIntegration}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update calendar integration settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating calendar integration:', error);
			showSnackbar(
				'Failed to update calendar integration settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleShoppingListIntegrationChange = async (
		event: SelectChangeEvent<'none' | 'anylist' | 'walmart' | 'amazon'>
	) => {
		setIsLoading(true);
		try {
			const newShoppingListIntegration = event.target.value as
				| 'none'
				| 'anylist'
				| 'walmart'
				| 'amazon';
			const result = await updateSettings({
				integrations: {
					calendar: safeSettings.integrations.calendar,
					shoppingList: newShoppingListIntegration,
				},
			});
			if (result.success) {
				showSnackbar(
					`Shopping list integration changed to ${newShoppingListIntegration === 'none' ? 'disabled' : newShoppingListIntegration}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update shopping list integration settings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating shopping list integration:', error);
			showSnackbar(
				'Failed to update shopping list integration settings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDefaultServingsChange = async (
		event: SelectChangeEvent<number>
	) => {
		setIsLoading(true);
		try {
			const newDefaultServings = event.target.value as number;
			const result = await updateSettings({
				mealPlanning: {
					...safeSettings.mealPlanning,
					defaultServings: newDefaultServings,
				},
			});
			if (result.success) {
				showSnackbar(
					`Default servings changed to ${newDefaultServings}.`,
					'success'
				);
			} else {
				showSnackbar(
					'Failed to update default servings. Please try again.',
					'error'
				);
			}
		} catch (error) {
			console.error('Error updating default servings:', error);
			showSnackbar(
				'Failed to update default servings. Please try again.',
				'error'
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<MainNav />
			<Container
				maxWidth='xl'
				sx={{ py: 4 }}
			>
				<PageHeader
					title='Settings'
					description='Customize your experience'
					backgroundColor='linear-gradient(45deg, #1976D2 30%, #42A5F5 90%)'
					icon={<SettingsIcon />}
				/>

				<Grid
					container
					spacing={3}
				>
					{/* Display & Accessibility */}
					<Grid
						item
						xs={12}
						md={6}
					>
						<Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
							<Typography
								variant='h5'
								gutterBottom
								sx={{ color: 'text.secondary', fontWeight: 500 }}
							>
								Display & Accessibility
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{ mb: 3 }}
							>
								Customize how the app looks and feels
							</Typography>
							<Stack spacing={3}>
								<FormGroup>
									<FormControlLabel
										control={
											<Switch
												checked={safeSettings.theme.mode === 'dark'}
												onChange={handleThemeChange}
												disabled={isLoading}
												color='primary'
											/>
										}
										label={translations.common.darkMode}
										sx={{ color: 'text.primary' }}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={safeSettings.theme.contrast}
												onChange={handleContrastChange}
												disabled={isLoading}
												color='secondary'
											/>
										}
										label='High Contrast Mode'
										sx={{ color: 'text.primary' }}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={safeSettings.theme.animations}
												onChange={handleAnimationsChange}
												disabled={isLoading}
												color='success'
											/>
										}
										label='Enable Animations'
										sx={{ color: 'text.primary' }}
									/>
								</FormGroup>
								<FormControl fullWidth>
									<InputLabel id='language-select-label'>
										{translations.common.language}
									</InputLabel>
									<Select
										labelId='language-select-label'
										value={safeSettings.language.preferred}
										onChange={handleLanguageChange}
										disabled={isLoading}
										label={translations.common.language}
									>
										<MenuItem value='en'>English</MenuItem>
										<MenuItem value='es'>Español</MenuItem>
										<MenuItem value='fr'>Français</MenuItem>
										<MenuItem value='de'>Deutsch</MenuItem>
										<MenuItem value='it'>Italiano</MenuItem>
										<MenuItem value='pt'>Português</MenuItem>
										<MenuItem value='zh'>中文</MenuItem>
										<MenuItem value='ja'>日本語</MenuItem>
										<MenuItem value='ko'>한국어</MenuItem>
										<MenuItem value='ru'>Русский</MenuItem>
									</Select>
								</FormControl>
								<FormControl fullWidth>
									<InputLabel id='measurement-system-label'>
										Measurement System
									</InputLabel>
									<Select
										labelId='measurement-system-label'
										value={safeSettings.language.measurementSystem}
										onChange={(e) => {
											setIsLoading(true);
											updateSettings({
												language: {
													...safeSettings.language,
													measurementSystem: e.target.value as
														| 'metric'
														| 'imperial',
												},
											}).finally(() => setIsLoading(false));
										}}
										disabled={isLoading}
										label='Measurement System'
									>
										<MenuItem value='metric'>Metric (g, ml, °C)</MenuItem>
										<MenuItem value='imperial'>
											Imperial (oz, fl oz, °F)
										</MenuItem>
									</Select>
								</FormControl>
							</Stack>
						</Paper>
					</Grid>

					{/* Notifications & Privacy */}
					<Grid
						item
						xs={12}
						md={6}
					>
						<Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
							<Typography
								variant='h5'
								gutterBottom
								sx={{ color: 'text.secondary', fontWeight: 500 }}
							>
								Notifications & Privacy
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{ mb: 3 }}
							>
								Manage your notifications and privacy settings
							</Typography>
							<Stack spacing={3}>
								<NotificationPreferences />
								<FormControl fullWidth>
									<InputLabel id='profile-visibility-label'>
										Profile Visibility
									</InputLabel>
									<Select
										labelId='profile-visibility-label'
										value={safeSettings.privacy.profileVisibility}
										onChange={handleProfileVisibilityChange}
										disabled={isLoading}
										label='Profile Visibility'
									>
										<MenuItem value='public'>Public</MenuItem>
										<MenuItem value='private'>Private</MenuItem>
									</Select>
								</FormControl>
							</Stack>
						</Paper>
					</Grid>

					{/* Security & Integrations */}
					<Grid
						item
						xs={12}
						md={6}
					>
						<Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
							<Typography
								variant='h5'
								gutterBottom
								sx={{ color: 'text.secondary', fontWeight: 500 }}
							>
								Security & Integrations
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{ mb: 3 }}
							>
								Manage your security settings and app integrations
							</Typography>
							<Stack spacing={3}>
								<FormGroup>
									<FormControlLabel
										control={
											<Switch
												checked={safeSettings.security.twoFactorAuth}
												onChange={handleTwoFactorAuthChange}
												disabled={isLoading}
												color='primary'
											/>
										}
										label='Two-Factor Authentication'
										sx={{ color: 'text.primary' }}
									/>
								</FormGroup>
								<FormControl fullWidth>
									<InputLabel id='calendar-integration-label'>
										Calendar Integration
									</InputLabel>
									<Select
										labelId='calendar-integration-label'
										value={safeSettings.integrations.calendar}
										onChange={handleCalendarIntegrationChange}
										disabled={isLoading}
										label='Calendar Integration'
									>
										<MenuItem value='none'>None</MenuItem>
										<MenuItem value='google'>Google Calendar</MenuItem>
										<MenuItem value='outlook'>Outlook</MenuItem>
										<MenuItem value='apple'>Apple Calendar</MenuItem>
									</Select>
								</FormControl>
								<FormControl fullWidth>
									<InputLabel id='shopping-list-integration-label'>
										Shopping List Integration
									</InputLabel>
									<Select
										labelId='shopping-list-integration-label'
										value={safeSettings.integrations.shoppingList}
										onChange={handleShoppingListIntegrationChange}
										disabled={isLoading}
										label='Shopping List Integration'
									>
										<MenuItem value='none'>None</MenuItem>
										<MenuItem value='anylist'>AnyList</MenuItem>
										<MenuItem value='walmart'>Walmart</MenuItem>
										<MenuItem value='amazon'>Amazon</MenuItem>
									</Select>
								</FormControl>
							</Stack>
						</Paper>
					</Grid>

					{/* Meal Planning */}
					<Grid
						item
						xs={12}
						md={6}
					>
						<Paper sx={{ p: 3, height: '100%', bgcolor: 'background.paper' }}>
							<Typography
								variant='h5'
								gutterBottom
								sx={{ color: 'text.secondary', fontWeight: 500 }}
							>
								Meal Planning
							</Typography>
							<Typography
								variant='body2'
								color='text.secondary'
								sx={{ mb: 3 }}
							>
								Configure your meal planning preferences
							</Typography>
							<Stack spacing={3}>
								<FormGroup>
									<FormControlLabel
										control={
											<Switch
												checked={
													safeSettings.mealPlanning.weeklyPlanningEnabled
												}
												onChange={(e) => {
													setIsLoading(true);
													updateSettings({
														mealPlanning: {
															...safeSettings.mealPlanning,
															weeklyPlanningEnabled: e.target.checked,
														},
													}).finally(() => setIsLoading(false));
												}}
												disabled={isLoading}
												color='primary'
											/>
										}
										label='Weekly Meal Planning'
										sx={{ color: 'text.primary' }}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={safeSettings.mealPlanning.shoppingListEnabled}
												onChange={(e) => {
													setIsLoading(true);
													updateSettings({
														mealPlanning: {
															...safeSettings.mealPlanning,
															shoppingListEnabled: e.target.checked,
														},
													}).finally(() => setIsLoading(false));
												}}
												disabled={isLoading}
												color='secondary'
											/>
										}
										label='Shopping List Generation'
										sx={{ color: 'text.primary' }}
									/>
									<FormControlLabel
										control={
											<Switch
												checked={
													safeSettings.mealPlanning.nutritionTrackingEnabled
												}
												onChange={(e) => {
													setIsLoading(true);
													updateSettings({
														mealPlanning: {
															...safeSettings.mealPlanning,
															nutritionTrackingEnabled: e.target.checked,
														},
													}).finally(() => setIsLoading(false));
												}}
												disabled={isLoading}
												color='success'
											/>
										}
										label='Nutrition Tracking'
										sx={{ color: 'text.primary' }}
									/>
								</FormGroup>
								<FormControl fullWidth>
									<InputLabel id='default-servings-label'>
										Default Serving Size
									</InputLabel>
									<Select
										labelId='default-servings-label'
										value={safeSettings.mealPlanning.defaultServings}
										onChange={handleDefaultServingsChange}
										disabled={isLoading}
										label='Default Serving Size'
									>
										<MenuItem value={1}>1 serving</MenuItem>
										<MenuItem value={2}>2 servings</MenuItem>
										<MenuItem value={3}>3 servings</MenuItem>
										<MenuItem value={4}>4 servings</MenuItem>
										<MenuItem value={6}>6 servings</MenuItem>
										<MenuItem value={8}>8 servings</MenuItem>
										<MenuItem value={10}>10 servings</MenuItem>
										<MenuItem value={12}>12 servings</MenuItem>
									</Select>
								</FormControl>
								<FormControl fullWidth>
									<InputLabel id='default-duration-label'>
										Default Meal Duration
									</InputLabel>
									<Select
										labelId='default-duration-label'
										value={safeSettings.mealPlanning.defaultDuration}
										onChange={(e) => {
											setIsLoading(true);
											updateSettings({
												mealPlanning: {
													...safeSettings.mealPlanning,
													defaultDuration: e.target.value,
													defaultServings:
														safeSettings.mealPlanning.defaultServings,
												},
											}).finally(() => setIsLoading(false));
										}}
										disabled={isLoading}
										label='Default Meal Duration'
									>
										<MenuItem value='15 minutes'>15 minutes</MenuItem>
										<MenuItem value='30 minutes'>30 minutes</MenuItem>
										<MenuItem value='45 minutes'>45 minutes</MenuItem>
										<MenuItem value='60 minutes'>60 minutes</MenuItem>
										<MenuItem value='90 minutes'>90 minutes</MenuItem>
									</Select>
								</FormControl>
							</Stack>
						</Paper>
					</Grid>

					{/* Onboarding & Tutorial Settings */}
					<Grid
						item
						xs={12}
					>
						<Paper
							sx={{
								p: 3,
								background: 'linear-gradient(135deg, #E8F5E8 0%, #F1F8E9 100%)',
								border: '1px solid rgba(76, 175, 80, 0.2)',
							}}
						>
							<Typography
								variant='h6'
								component='h2'
								gutterBottom
							>
								Tutorial & Onboarding
							</Typography>
							<Stack spacing={2}>
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									}}
								>
									<Box>
										<Typography
											variant='body1'
											color='text.primary'
										>
											Tutorial Status
										</Typography>
										<Typography
											variant='body2'
											color='text.secondary'
										>
											{safeSettings.onboarding.tutorialCompleted
												? 'You have completed the tutorial'
												: 'Tutorial not completed yet'}
										</Typography>
									</Box>
									<Button
										variant='outlined'
										color='primary'
										onClick={async () => {
											setIsLoading(true);
											try {
												await updateSettings({
													onboarding: {
														tutorialCompleted: false,
													},
												});
												// Redirect to dashboard to show tutorial
												router.push('/dashboard');
											} finally {
												setIsLoading(false);
											}
										}}
										disabled={isLoading}
									>
										{isLoading && (
											<CircularProgress
												size={16}
												sx={{ mr: 1 }}
											/>
										)}
										Retake Tutorial
									</Button>
								</Box>
							</Stack>
						</Paper>
					</Grid>
				</Grid>
			</Container>
			<Footer />
		</>
	);
}
