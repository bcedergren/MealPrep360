export type PreferenceScope =
	| 'user'
	| 'recipe'
	| 'meal_plan'
	| 'shopping'
	| 'notification'
	| 'appearance'
	| 'privacy'
	| 'accessibility';

export type PreferenceType =
	| 'boolean'
	| 'number'
	| 'string'
	| 'array'
	| 'object'
	| 'enum';

export type PreferenceValue = boolean | number | string | any[] | object;

export interface PreferenceDefinition {
	scope: PreferenceScope;
	key: string;
	type: PreferenceType;
	label: string;
	description?: string;
	defaultValue: PreferenceValue;
	validation?: {
		required?: boolean;
		min?: number;
		max?: number;
		pattern?: string;
		enum?: string[];
		custom?: string;
	};
	ui?: {
		component: string;
		order?: number;
		group?: string;
		hidden?: boolean;
		readOnly?: boolean;
		dependsOn?: {
			preference: string;
			value: PreferenceValue;
		};
	};
	metadata?: {
		tags?: string[];
		version?: string;
		[key: string]: any;
	};
}

export interface UserPreference {
	userId: string;
	definitionId: string;
	value: PreferenceValue;
	scope: PreferenceScope;
	metadata?: {
		lastModified?: Date;
		modifiedBy?: string;
		source?: string;
		[key: string]: any;
	};
}

export interface PreferenceGroup {
	name: string;
	description?: string;
	scope: PreferenceScope;
	preferences: string[];
	ui?: {
		icon?: string;
		color?: string;
		order?: number;
		collapsed?: boolean;
	};
	metadata?: {
		tags?: string[];
		version?: string;
		[key: string]: any;
	};
}

export interface PreferenceSync {
	userId: string;
	device: string;
	preferences: Array<{
		definitionId: string;
		value: PreferenceValue;
		timestamp: Date;
	}>;
	status: 'pending' | 'completed' | 'failed';
	metadata?: {
		deviceInfo?: {
			type: string;
			os: string;
			version: string;
		};
		syncInfo?: {
			direction: 'push' | 'pull';
			conflictResolution?: 'server' | 'client' | 'manual';
		};
		[key: string]: any;
	};
}

export interface PreferenceImport {
	userId: string;
	source: string;
	preferences: Array<{
		key: string;
		value: PreferenceValue;
		scope: PreferenceScope;
		metadata?: Record<string, any>;
	}>;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	result?: {
		imported: number;
		skipped: number;
		errors: Array<{
			key: string;
			error: string;
		}>;
	};
}

export interface PreferenceSnapshot {
	userId: string;
	timestamp: Date;
	preferences: Array<{
		definitionId: string;
		value: PreferenceValue;
		metadata?: Record<string, any>;
	}>;
	reason?: string;
	metadata?: {
		source?: string;
		version?: string;
		[key: string]: any;
	};
}

export interface PreferenceMetrics {
	period: {
		start: Date;
		end: Date;
	};
	usage: {
		total: number;
		byScope: Record<PreferenceScope, number>;
		byType: Record<PreferenceType, number>;
		popular: Array<{
			definitionId: string;
			count: number;
		}>;
	};
	changes: {
		total: number;
		byScope: Record<PreferenceScope, number>;
		byUser: Array<{
			userId: string;
			count: number;
		}>;
		frequency: Array<{
			period: string;
			count: number;
		}>;
	};
	sync: {
		total: number;
		success: number;
		failed: number;
		byDevice: Record<
			string,
			{
				total: number;
				success: number;
				failed: number;
			}
		>;
	};
	defaults: {
		adherence: number;
		deviations: Array<{
			definitionId: string;
			count: number;
			commonValues: PreferenceValue[];
		}>;
	};
}
