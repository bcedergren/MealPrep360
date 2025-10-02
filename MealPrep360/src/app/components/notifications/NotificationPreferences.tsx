import { useState } from 'react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { useSettings } from '@/contexts/settings-context';
import { toast } from 'sonner';

export const NotificationPreferences = () => {
	const {
		settings,
		updateSettings,
		isLoading: isSettingsLoading,
	} = useSettings();
	const [isLoading, setIsLoading] = useState(false);

	const handlePreferenceChange = async (
		key: string,
		value: boolean | { enabled: boolean; start: string; end: string }
	) => {
		if (!settings) return;
		try {
			setIsLoading(true);
			const updatedNotifications = {
				email: settings.notifications.email ?? false,
				push: settings.notifications.push ?? false,
				mealPlanReminders: settings.notifications.mealPlanReminders ?? false,
				shoppingListReminders:
					settings.notifications.shoppingListReminders ?? false,
				quietHours: settings.notifications.quietHours ?? {
					enabled: false,
					start: '22:00',
					end: '08:00',
				},
			};
			if (key === 'quietHours' && typeof value === 'object') {
				updatedNotifications.quietHours = value;
			} else {
				(updatedNotifications as any)[key] = value;
			}
			await updateSettings({ notifications: updatedNotifications });
			toast.success('Notification preferences updated');
		} catch (error) {
			toast.error('Failed to update notification preferences');
			console.error('Error updating notification preferences:', error);
		} finally {
			setIsLoading(false);
		}
	};

	if (!settings) return null;

	return (
		<div className='space-y-6'>
			<div className='space-y-4'>
				<h3 className='text-lg font-medium'>Notification Types</h3>
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<Label htmlFor='email'>Email Notifications</Label>
						<Switch
							id='email'
							checked={settings.notifications.email}
							onCheckedChange={(checked) =>
								handlePreferenceChange('email', checked)
							}
							disabled={isLoading || isSettingsLoading}
						/>
					</div>
					<div className='flex items-center justify-between'>
						<Label htmlFor='push'>Push Notifications</Label>
						<Switch
							id='push'
							checked={settings.notifications.push}
							onCheckedChange={(checked) =>
								handlePreferenceChange('push', checked)
							}
							disabled={isLoading || isSettingsLoading}
						/>
					</div>
					<div className='flex items-center justify-between'>
						<Label htmlFor='mealPlanReminders'>Meal Plan Reminders</Label>
						<Switch
							id='mealPlanReminders'
							checked={settings.notifications.mealPlanReminders}
							onCheckedChange={(checked) =>
								handlePreferenceChange('mealPlanReminders', checked)
							}
							disabled={isLoading || isSettingsLoading}
						/>
					</div>
					<div className='flex items-center justify-between'>
						<Label htmlFor='shoppingListReminders'>
							Shopping List Reminders
						</Label>
						<Switch
							id='shoppingListReminders'
							checked={settings.notifications.shoppingListReminders}
							onCheckedChange={(checked) =>
								handlePreferenceChange('shoppingListReminders', checked)
							}
							disabled={isLoading || isSettingsLoading}
						/>
					</div>
				</div>
			</div>

			<div className='space-y-4'>
				<h3 className='text-lg font-medium'>Quiet Hours</h3>
				<div className='space-y-4'>
					<div className='flex items-center justify-between'>
						<Label htmlFor='quietHours'>Enable Quiet Hours</Label>
						<Switch
							id='quietHours'
							checked={settings.notifications.quietHours.enabled}
							onCheckedChange={(checked) =>
								handlePreferenceChange('quietHours', checked)
							}
							disabled={isLoading || isSettingsLoading}
						/>
					</div>
					{settings.notifications.quietHours.enabled && (
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Label htmlFor='quietHoursStart'>Start Time</Label>
								<input
									type='time'
									id='quietHoursStart'
									value={settings.notifications.quietHours.start}
									onChange={(e) =>
										handlePreferenceChange('quietHours', {
											...settings.notifications.quietHours,
											start: e.target.value,
										})
									}
									disabled={isLoading || isSettingsLoading}
									className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='quietHoursEnd'>End Time</Label>
								<input
									type='time'
									id='quietHoursEnd'
									value={settings.notifications.quietHours.end}
									onChange={(e) =>
										handlePreferenceChange('quietHours', {
											...settings.notifications.quietHours,
											end: e.target.value,
										})
									}
									disabled={isLoading || isSettingsLoading}
									className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
