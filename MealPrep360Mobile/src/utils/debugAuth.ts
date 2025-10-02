import { API_BASE_URL } from '../constants/api';

export const debugClerkAuth = async (
	getToken: () => Promise<string | null>
) => {
	try {
		const token = await getToken();
		console.log('🔐 Debug Clerk Auth:', {
			hasToken: !!token,
			tokenLength: token?.length,
			tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
			apiBaseUrl: API_BASE_URL,
		});
		return token;
	} catch (error) {
		console.error('❌ Error in debugClerkAuth:', error);
		return null;
	}
};

export const testSavedRecipesAPI = async (
	getToken: () => Promise<string | null>
) => {
	try {
		const token = await getToken();
		console.log('🧪 Testing Saved Recipes API:', {
			hasToken: !!token,
			tokenLength: token?.length,
			apiBaseUrl: API_BASE_URL,
			endpoint: `${API_BASE_URL}/api/user/recipes/saved`,
		});

		if (!token) {
			console.log('❌ No token available for testing');
			return { success: false, error: 'No token available' };
		}

		// Test the saved recipes endpoint
		const response = await fetch(`${API_BASE_URL}/api/user/recipes/saved`, {
			headers: {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
				Accept: 'application/json',
			},
		});

		console.log('🔍 API Test Response:', {
			status: response.status,
			statusText: response.statusText,
			url: response.url,
			headers: Object.fromEntries(response.headers.entries()),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.log('❌ API Test Failed:', {
				status: response.status,
				statusText: response.statusText,
				errorText,
			});
			return {
				success: false,
				error: `${response.status}: ${errorText || response.statusText}`,
			};
		}

		const data = await response.json();
		console.log('✅ API Test Success:', data);
		return { success: true, data };
	} catch (error) {
		console.error('❌ Error testing API:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
};
