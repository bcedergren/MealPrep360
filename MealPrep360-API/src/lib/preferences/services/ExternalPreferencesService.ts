import { BaseExternalService } from '../../core/services/BaseExternalService';
import { IPreferencesService } from '../interfaces/IPreferencesService';
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

export class ExternalPreferencesService
	extends BaseExternalService
	implements IPreferencesService
{
	constructor() {
		super('preferences');
	}

	// Preference Definitions
	async createDefinition(
		definition: Omit<PreferenceDefinition, 'id'>
	): Promise<IPreferenceDefinitionDocument> {
		return await this.resilientClient.post<IPreferenceDefinitionDocument>(
			'/definitions',
			definition
		);
	}

	async updateDefinition(
		definitionId: string,
		updates: Partial<PreferenceDefinition>
	): Promise<IPreferenceDefinitionDocument> {
		return await this.resilientClient.put<IPreferenceDefinitionDocument>(
			`/definitions/${definitionId}`,
			updates
		);
	}

	async getDefinition(
		definitionId: string
	): Promise<IPreferenceDefinitionDocument> {
		return await this.resilientClient.get<IPreferenceDefinitionDocument>(
			`/definitions/${definitionId}`
		);
	}

	async listDefinitions(filters?: {
		scope?: PreferenceScope;
		type?: PreferenceType;
		search?: string;
	}): Promise<IPreferenceDefinitionDocument[]> {
		return await this.resilientClient.get<IPreferenceDefinitionDocument[]>(
			'/definitions',
			{
				params: filters,
			}
		);
	}

	async deleteDefinition(definitionId: string): Promise<void> {
		await this.resilientClient.delete(`/definitions/${definitionId}`);
	}

	// User Preferences
	async setPreference(
		preference: Omit<UserPreference, 'id'>
	): Promise<IUserPreferenceDocument> {
		return await this.resilientClient.post<IUserPreferenceDocument>(
			'/preferences',
			preference
		);
	}

	async updatePreference(
		preferenceId: string,
		updates: Partial<UserPreference>
	): Promise<IUserPreferenceDocument> {
		return await this.resilientClient.put<IUserPreferenceDocument>(
			`/preferences/${preferenceId}`,
			updates
		);
	}

	async getPreference(preferenceId: string): Promise<IUserPreferenceDocument> {
		return await this.resilientClient.get<IUserPreferenceDocument>(
			`/preferences/${preferenceId}`
		);
	}

	async getUserPreferences(
		userId: string,
		filters?: {
			scope?: PreferenceScope;
			definitionIds?: string[];
		}
	): Promise<IUserPreferenceDocument[]> {
		return await this.resilientClient.get<IUserPreferenceDocument[]>(
			`/users/${userId}/preferences`,
			{
				params: filters,
			}
		);
	}

	async resetPreference(
		preferenceId: string
	): Promise<IUserPreferenceDocument> {
		return await this.resilientClient.post<IUserPreferenceDocument>(
			`/preferences/${preferenceId}/reset`
		);
	}

	async resetAllUserPreferences(
		userId: string,
		scope?: PreferenceScope
	): Promise<void> {
		await this.resilientClient.post(`/users/${userId}/preferences/reset`, {
			scope,
		});
	}

	// Preference Groups
	async createGroup(
		group: Omit<PreferenceGroup, 'id'>
	): Promise<IPreferenceGroupDocument> {
		return await this.resilientClient.post<IPreferenceGroupDocument>(
			'/groups',
			group
		);
	}

	async updateGroup(
		groupId: string,
		updates: Partial<PreferenceGroup>
	): Promise<IPreferenceGroupDocument> {
		return await this.resilientClient.put<IPreferenceGroupDocument>(
			`/groups/${groupId}`,
			updates
		);
	}

	async getGroup(groupId: string): Promise<IPreferenceGroupDocument> {
		return await this.resilientClient.get<IPreferenceGroupDocument>(
			`/groups/${groupId}`
		);
	}

	async listGroups(filters?: {
		scope?: PreferenceScope;
		search?: string;
	}): Promise<IPreferenceGroupDocument[]> {
		return await this.resilientClient.get<IPreferenceGroupDocument[]>(
			'/groups',
			{
				params: filters,
			}
		);
	}

	async deleteGroup(groupId: string): Promise<void> {
		await this.resilientClient.delete(`/groups/${groupId}`);
	}

	// Preference Sync
	async syncPreferences(
		sync: Omit<PreferenceSync, 'id'>
	): Promise<IPreferenceSyncDocument> {
		return await this.resilientClient.post<IPreferenceSyncDocument>(
			'/sync',
			sync
		);
	}

	async getSyncStatus(syncId: string): Promise<IPreferenceSyncDocument> {
		return await this.resilientClient.get<IPreferenceSyncDocument>(
			`/sync/${syncId}`
		);
	}

	async listSyncHistory(filters?: {
		userId?: string;
		device?: string;
		status?: string;
	}): Promise<IPreferenceSyncDocument[]> {
		return await this.resilientClient.get<IPreferenceSyncDocument[]>('/sync', {
			params: filters,
		});
	}

	async resolveSyncConflicts(
		syncId: string,
		resolutions: Array<{
			definitionId: string;
			value: PreferenceValue;
		}>
	): Promise<IPreferenceSyncDocument> {
		return await this.resilientClient.post<IPreferenceSyncDocument>(
			`/sync/${syncId}/resolve`,
			{ resolutions }
		);
	}

	// Preference Import/Export
	async importPreferences(
		importData: Omit<PreferenceImport, 'id'>
	): Promise<IPreferenceImportDocument> {
		return await this.resilientClient.post<IPreferenceImportDocument>(
			'/import',
			importData
		);
	}

	async getImportStatus(importId: string): Promise<IPreferenceImportDocument> {
		return await this.resilientClient.get<IPreferenceImportDocument>(
			`/import/${importId}`
		);
	}

	async exportPreferences(
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
	}> {
		return await this.resilientClient.get<{
			data: any;
			format: string;
			timestamp: Date;
		}>(`/users/${userId}/preferences/export`, {
			params: options,
		});
	}

	// Preference Snapshots
	async createSnapshot(
		snapshot: Omit<PreferenceSnapshot, 'id'>
	): Promise<IPreferenceSnapshotDocument> {
		return await this.resilientClient.post<IPreferenceSnapshotDocument>(
			'/snapshots',
			snapshot
		);
	}

	async getSnapshot(snapshotId: string): Promise<IPreferenceSnapshotDocument> {
		return await this.resilientClient.get<IPreferenceSnapshotDocument>(
			`/snapshots/${snapshotId}`
		);
	}

	async listSnapshots(filters?: {
		userId?: string;
		fromDate?: Date;
		toDate?: Date;
	}): Promise<IPreferenceSnapshotDocument[]> {
		return await this.resilientClient.get<IPreferenceSnapshotDocument[]>(
			'/snapshots',
			{
				params: {
					...filters,
					fromDate: filters?.fromDate?.toISOString(),
					toDate: filters?.toDate?.toISOString(),
				},
			}
		);
	}

	async restoreSnapshot(
		snapshotId: string,
		options?: {
			scope?: PreferenceScope;
			dryRun?: boolean;
		}
	): Promise<{
		success: boolean;
		changes: number;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			success: boolean;
			changes: number;
			errors?: string[];
		}>(`/snapshots/${snapshotId}/restore`, options);
	}

	// Validation
	async validatePreference(
		preferenceId: string,
		options?: {
			rules?: string[];
			strict?: boolean;
		}
	): Promise<{
		valid: boolean;
		errors?: string[];
	}> {
		return await this.resilientClient.post<{
			valid: boolean;
			errors?: string[];
		}>(`/preferences/${preferenceId}/validate`, options);
	}

	async validateBulk(
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
	> {
		return await this.resilientClient.post<
			Array<{
				definitionId: string;
				valid: boolean;
				errors?: string[];
			}>
		>('/preferences/validate-bulk', {
			preferences,
			options,
		});
	}

	// Metrics & Analytics
	async getPreferenceMetrics(
		startDate: Date,
		endDate: Date,
		filters?: {
			scope?: PreferenceScope;
			userId?: string;
		}
	): Promise<IPreferenceMetricsDocument> {
		return await this.resilientClient.get<IPreferenceMetricsDocument>(
			'/metrics',
			{
				params: {
					startDate: startDate.toISOString(),
					endDate: endDate.toISOString(),
					...filters,
				},
			}
		);
	}

	async getUsageMetrics(
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
	}> {
		return await this.resilientClient.get<{
			total: number;
			unique: number;
			distribution: Record<string, number>;
			trends: Array<{
				date: string;
				count: number;
			}>;
		}>(`/definitions/${definitionId}/metrics`, {
			params: {
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
			},
		});
	}

	// Error Handling
	async handlePreferenceError(
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
	}> {
		return await this.resilientClient.post<{
			handled: boolean;
			action?: 'retry' | 'fail' | 'ignore';
			fallback?: {
				type: string;
				value: any;
			};
		}>('/errors', {
			error: {
				message: error.message,
				stack: error.stack,
			},
			context,
		});
	}
}
