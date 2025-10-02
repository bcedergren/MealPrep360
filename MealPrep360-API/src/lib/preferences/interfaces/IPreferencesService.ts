import {
	PreferenceDefinition,
	UserPreference,
	PreferenceGroup,
	PreferenceSync,
	PreferenceImport,
	PreferenceSnapshot,
	PreferenceScope,
	PreferenceType,
	PreferenceValue,
} from '../types';
import {
	IPreferenceDefinitionDocument,
	IUserPreferenceDocument,
	IPreferenceGroupDocument,
	IPreferenceSyncDocument,
	IPreferenceImportDocument,
	IPreferenceSnapshotDocument,
	IPreferenceMetricsDocument,
} from '../types/preferences';

export interface IPreferencesService {
	// Preference Definitions
	createDefinition(
		definition: Omit<PreferenceDefinition, 'id'>
	): Promise<IPreferenceDefinitionDocument>;
	updateDefinition(
		definitionId: string,
		updates: Partial<PreferenceDefinition>
	): Promise<IPreferenceDefinitionDocument>;
	getDefinition(definitionId: string): Promise<IPreferenceDefinitionDocument>;
	listDefinitions(filters?: {
		scope?: PreferenceScope;
		type?: PreferenceType;
		search?: string;
	}): Promise<IPreferenceDefinitionDocument[]>;
	deleteDefinition(definitionId: string): Promise<void>;

	// User Preferences
	setPreference(
		preference: Omit<UserPreference, 'id'>
	): Promise<IUserPreferenceDocument>;
	updatePreference(
		preferenceId: string,
		updates: Partial<UserPreference>
	): Promise<IUserPreferenceDocument>;
	getPreference(preferenceId: string): Promise<IUserPreferenceDocument>;
	getUserPreferences(
		userId: string,
		filters?: {
			scope?: PreferenceScope;
			definitionIds?: string[];
		}
	): Promise<IUserPreferenceDocument[]>;
	resetPreference(preferenceId: string): Promise<IUserPreferenceDocument>;
	resetAllUserPreferences(
		userId: string,
		scope?: PreferenceScope
	): Promise<void>;

	// Preference Groups
	createGroup(
		group: Omit<PreferenceGroup, 'id'>
	): Promise<IPreferenceGroupDocument>;
	updateGroup(
		groupId: string,
		updates: Partial<PreferenceGroup>
	): Promise<IPreferenceGroupDocument>;
	getGroup(groupId: string): Promise<IPreferenceGroupDocument>;
	listGroups(filters?: {
		scope?: PreferenceScope;
		search?: string;
	}): Promise<IPreferenceGroupDocument[]>;
	deleteGroup(groupId: string): Promise<void>;

	// Preference Sync
	syncPreferences(
		sync: Omit<PreferenceSync, 'id'>
	): Promise<IPreferenceSyncDocument>;
	getSyncStatus(syncId: string): Promise<IPreferenceSyncDocument>;
	listSyncHistory(filters?: {
		userId?: string;
		device?: string;
		status?: string;
	}): Promise<IPreferenceSyncDocument[]>;
	resolveSyncConflicts(
		syncId: string,
		resolutions: Array<{
			definitionId: string;
			value: PreferenceValue;
		}>
	): Promise<IPreferenceSyncDocument>;

	// Preference Import/Export
	importPreferences(
		importData: Omit<PreferenceImport, 'id'>
	): Promise<IPreferenceImportDocument>;
	getImportStatus(importId: string): Promise<IPreferenceImportDocument>;
	exportPreferences(
		userId: string,
		options?: {
			scope?: PreferenceScope;
			format?: 'json' | 'csv';
			includeMetadata?: boolean;
		}
	): Promise<{
		data: any;
		format: string;
		timestamp: Date;
	}>;

	// Preference Snapshots
	createSnapshot(
		snapshot: Omit<PreferenceSnapshot, 'id'>
	): Promise<IPreferenceSnapshotDocument>;
	getSnapshot(snapshotId: string): Promise<IPreferenceSnapshotDocument>;
	listSnapshots(filters?: {
		userId?: string;
		fromDate?: Date;
		toDate?: Date;
	}): Promise<IPreferenceSnapshotDocument[]>;
	restoreSnapshot(
		snapshotId: string,
		options?: {
			scope?: PreferenceScope;
			dryRun?: boolean;
		}
	): Promise<{
		success: boolean;
		changes: number;
		errors?: string[];
	}>;

	// Validation
	validatePreference(
		preferenceId: string,
		options?: {
			rules?: string[];
			strict?: boolean;
		}
	): Promise<{
		valid: boolean;
		errors?: string[];
	}>;

	validateBulk(
		preferences: Array<{
			definitionId: string;
			value: PreferenceValue;
		}>,
		options?: {
			rules?: string[];
			strict?: boolean;
		}
	): Promise<
		Array<{
			definitionId: string;
			valid: boolean;
			errors?: string[];
		}>
	>;

	// Metrics & Analytics
	getPreferenceMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			scope?: PreferenceScope;
			userId?: string;
		}
	): Promise<IPreferenceMetricsDocument>;

	getUsageMetrics(
		definitionId: string,
		startDate: Date,
		endDate: Date
	): Promise<{
		total: number;
		unique: number;
		distribution: Record<string, number>;
		trends: Array<{
			date: string;
			count: number;
		}>;
	}>;

	// Error Handling
	handlePreferenceError(
		error: Error,
		context: {
			operation: string;
			userId?: string;
			definitionId?: string;
			data?: any;
		}
	): Promise<{
		handled: boolean;
		action?: 'retry' | 'fail' | 'ignore';
		fallback?: {
			type: string;
			value: any;
		};
	}>;
}
