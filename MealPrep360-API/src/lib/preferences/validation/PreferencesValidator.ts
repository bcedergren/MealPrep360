import { RequestValidator } from '../../core/validation/RequestValidator';
import {
	PreferenceDefinition,
	UserPreference,
	PreferenceGroup,
	PreferenceSync,
	PreferenceImport,
	PreferenceSnapshot,
	PreferenceScope,
	PreferenceType,
} from '../types';

export class PreferenceDefinitionValidator extends RequestValidator<
	Omit<PreferenceDefinition, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				[
					'user',
					'recipe',
					'meal_plan',
					'shopping',
					'notification',
					'appearance',
					'privacy',
					'accessibility',
				].includes(data.scope),
			message: 'Invalid preference scope',
		});

		this.addRule({
			validate: (data) => typeof data.key === 'string' && data.key.length >= 3,
			message: 'Key must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				['boolean', 'number', 'string', 'array', 'object', 'enum'].includes(
					data.type
				),
			message: 'Invalid preference type',
		});

		this.addRule({
			validate: (data) =>
				typeof data.label === 'string' && data.label.length >= 3,
			message: 'Label must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				data.defaultValue !== undefined && data.defaultValue !== null,
			message: 'Default value is required',
		});

		this.addRule({
			validate: (data) => {
				if (!data.validation) return true;
				return (
					(!data.validation.min || typeof data.validation.min === 'number') &&
					(!data.validation.max || typeof data.validation.max === 'number') &&
					(!data.validation.pattern ||
						typeof data.validation.pattern === 'string') &&
					(!data.validation.enum || Array.isArray(data.validation.enum))
				);
			},
			message: 'Invalid validation configuration',
		});
	}
}

export class UserPreferenceValidator extends RequestValidator<
	Omit<UserPreference, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) => !!data.definitionId,
			message: 'Preference definition ID is required',
		});

		this.addRule({
			validate: (data) => data.value !== undefined && data.value !== null,
			message: 'Preference value is required',
		});

		this.addRule({
			validate: (data) =>
				[
					'user',
					'recipe',
					'meal_plan',
					'shopping',
					'notification',
					'appearance',
					'privacy',
					'accessibility',
				].includes(data.scope),
			message: 'Invalid preference scope',
		});
	}
}

export class PreferenceGroupValidator extends RequestValidator<
	Omit<PreferenceGroup, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) =>
				typeof data.name === 'string' && data.name.length >= 3,
			message: 'Name must be at least 3 characters long',
		});

		this.addRule({
			validate: (data) =>
				[
					'user',
					'recipe',
					'meal_plan',
					'shopping',
					'notification',
					'appearance',
					'privacy',
					'accessibility',
				].includes(data.scope),
			message: 'Invalid preference scope',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.preferences) && data.preferences.length > 0,
			message: 'At least one preference is required',
		});

		this.addRule({
			validate: (data) => {
				if (!data.ui) return true;
				return (
					(!data.ui.order || typeof data.ui.order === 'number') &&
					(!data.ui.collapsed || typeof data.ui.collapsed === 'boolean')
				);
			},
			message: 'Invalid UI configuration',
		});
	}
}

export class PreferenceSyncValidator extends RequestValidator<
	Omit<PreferenceSync, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) => !!data.device,
			message: 'Device identifier is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.preferences) &&
				data.preferences.every(
					(p) =>
						p.definitionId &&
						p.value !== undefined &&
						p.value !== null &&
						p.timestamp instanceof Date
				),
			message: 'Invalid preferences configuration',
		});

		this.addRule({
			validate: (data) =>
				['pending', 'completed', 'failed'].includes(data.status),
			message: 'Invalid sync status',
		});
	}
}

export class PreferenceImportValidator extends RequestValidator<
	Omit<PreferenceImport, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) => !!data.source,
			message: 'Source identifier is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.preferences) &&
				data.preferences.every(
					(p) =>
						p.key &&
						p.value !== undefined &&
						p.value !== null &&
						[
							'user',
							'recipe',
							'meal_plan',
							'shopping',
							'notification',
							'appearance',
							'privacy',
							'accessibility',
						].includes(p.scope)
				),
			message: 'Invalid preferences configuration',
		});

		this.addRule({
			validate: (data) =>
				['pending', 'processing', 'completed', 'failed'].includes(data.status),
			message: 'Invalid import status',
		});
	}
}

export class PreferenceSnapshotValidator extends RequestValidator<
	Omit<PreferenceSnapshot, 'id'>
> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.userId,
			message: 'User ID is required',
		});

		this.addRule({
			validate: (data) => data.timestamp instanceof Date,
			message: 'Valid timestamp is required',
		});

		this.addRule({
			validate: (data) =>
				Array.isArray(data.preferences) &&
				data.preferences.every(
					(p) => p.definitionId && p.value !== undefined && p.value !== null
				),
			message: 'Invalid preferences configuration',
		});
	}
}
