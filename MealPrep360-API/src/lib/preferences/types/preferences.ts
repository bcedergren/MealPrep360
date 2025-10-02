import { Document } from 'mongoose';
import {
	PreferenceDefinition,
	UserPreference,
	PreferenceGroup,
	PreferenceSync,
	PreferenceImport,
	PreferenceSnapshot,
	PreferenceMetrics,
	PreferenceScope,
	PreferenceType,
	PreferenceValue,
} from './index';

export interface IPreferenceDefinitionDocument
	extends Document,
		PreferenceDefinition {
	history: Array<{
		version: string;
		changes: string[];
		date: Date;
		author: string;
	}>;
	usage: {
		count: number;
		lastUsed?: Date;
		customValues?: PreferenceValue[];
	};
	validationRules: {
		rules: Array<{
			type: string;
			value: any;
			message: string;
		}>;
		customLogic?: string;
	};
}

export interface IUserPreferenceDocument extends Document, UserPreference {
	history: Array<{
		value: PreferenceValue;
		timestamp: Date;
		userId: string;
		reason?: string;
	}>;
	validation: {
		lastChecked?: Date;
		isValid: boolean;
		errors?: string[];
	};
	sync: {
		version: number;
		lastSync?: Date;
		devices: string[];
	};
}

export interface IPreferenceGroupDocument extends Document, PreferenceGroup {
	validation: {
		rules: Array<{
			type: string;
			value: any;
			message: string;
		}>;
		dependencies?: string[];
	};
	access: {
		roles: string[];
		restrictions?: Array<{
			type: string;
			value: any;
		}>;
	};
	customization: {
		allowReorder?: boolean;
		allowHide?: boolean;
		templates?: Record<string, any>;
	};
}

export interface IPreferenceSyncDocument extends Document, PreferenceSync {
	conflicts: Array<{
		definitionId: string;
		serverValue: PreferenceValue;
		clientValue: PreferenceValue;
		resolution?: PreferenceValue;
	}>;
	retries: Array<{
		timestamp: Date;
		error: string;
		preferences: string[];
	}>;
	performance: {
		duration: number;
		itemCount: number;
		bytesTransferred: number;
	};
}

export interface IPreferenceImportDocument extends Document, PreferenceImport {
	validation: {
		rules: Array<{
			type: string;
			value: any;
			message: string;
		}>;
		customLogic?: string;
	};
	mapping: Record<
		string,
		{
			targetKey: string;
			transform?: string;
		}
	>;
	progress: {
		current: number;
		total: number;
		startTime: Date;
		endTime?: Date;
	};
}

export interface IPreferenceSnapshotDocument
	extends Document,
		PreferenceSnapshot {
	diff?: Array<{
		definitionId: string;
		oldValue: PreferenceValue;
		newValue: PreferenceValue;
	}>;
	validation: {
		isValid: boolean;
		errors?: Array<{
			definitionId: string;
			error: string;
		}>;
	};
	restore: {
		possible: boolean;
		dependencies?: string[];
		warnings?: string[];
	};
}

export interface IPreferenceMetricsDocument
	extends Document,
		PreferenceMetrics {
	trends: {
		daily: Array<{
			date: Date;
			changes: number;
			syncs: number;
		}>;
		weekly: Array<{
			week: string;
			changes: number;
			syncs: number;
		}>;
	};
	insights: Array<{
		type: string;
		severity: 'info' | 'warning' | 'critical';
		message: string;
		data?: any;
	}>;
	performance: {
		syncDuration: {
			average: number;
			p95: number;
			max: number;
		};
		validationTime: {
			average: number;
			p95: number;
			max: number;
		};
	};
}
