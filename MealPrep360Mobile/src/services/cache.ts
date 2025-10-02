import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_CONFIG } from '../constants/api';
import type { CacheInfo, OfflineChange } from '../types/recipe';

export const getCacheInfo = async (
	recipeId: string
): Promise<CacheInfo | null> => {
	try {
		const cachedData = await AsyncStorage.getItem(
			`${CACHE_CONFIG.KEY_PREFIX}${recipeId}`
		);
		if (cachedData) {
			const { data, timestamp } = JSON.parse(cachedData);
			const size = new Blob([JSON.stringify(data)]).size;
			return {
				size,
				lastUpdated: timestamp,
				expiresAt: timestamp + CACHE_CONFIG.EXPIRY,
			};
		}
		return null;
	} catch (error) {
		console.error('Error getting cache info:', error);
		return null;
	}
};

export const saveToCache = async (
	recipeId: string,
	data: unknown
): Promise<void> => {
	try {
		const cacheData = {
			data,
			timestamp: Date.now(),
		};
		await AsyncStorage.setItem(
			`${CACHE_CONFIG.KEY_PREFIX}${recipeId}`,
			JSON.stringify(cacheData)
		);
	} catch (error) {
		console.error('Error saving to cache:', error);
		throw error;
	}
};

export const getFromCache = async <T>(recipeId: string): Promise<T | null> => {
	try {
		const cachedData = await AsyncStorage.getItem(
			`${CACHE_CONFIG.KEY_PREFIX}${recipeId}`
		);
		if (cachedData) {
			const { data, timestamp } = JSON.parse(cachedData);
			if (Date.now() - timestamp > CACHE_CONFIG.EXPIRY) {
				await AsyncStorage.removeItem(`${CACHE_CONFIG.KEY_PREFIX}${recipeId}`);
				return null;
			}
			return data as T;
		}
		return null;
	} catch (error) {
		console.error('Error getting from cache:', error);
		return null;
	}
};

export const clearCache = async (): Promise<void> => {
	try {
		const keys = await AsyncStorage.getAllKeys();
		const cacheKeys = keys.filter((key) =>
			key.startsWith(CACHE_CONFIG.KEY_PREFIX)
		);
		await AsyncStorage.multiRemove(cacheKeys);
	} catch (error) {
		console.error('Error clearing cache:', error);
		throw error;
	}
};

export const addToOfflineQueue = async (
	change: OfflineChange
): Promise<void> => {
	try {
		const queue = await AsyncStorage.getItem(CACHE_CONFIG.OFFLINE_QUEUE_KEY);
		const changes: OfflineChange[] = queue ? JSON.parse(queue) : [];
		changes.push(change);
		await AsyncStorage.setItem(
			CACHE_CONFIG.OFFLINE_QUEUE_KEY,
			JSON.stringify(changes)
		);
	} catch (error) {
		console.error('Error adding to offline queue:', error);
		throw error;
	}
};
