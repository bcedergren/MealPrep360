import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Platform,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

type RootStackParamList = {
	Home: undefined;
	SignUp: undefined;
	Login: undefined;
	Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
	const navigation = useNavigation<NavigationProp>();
	const { signIn, setActive, isLoaded } = useSignIn();
	const { isSignedIn } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [initAttempts, setInitAttempts] = useState(0);

	console.log('LoginScreen mounted', {
		platform: Platform.OS,
		hasSignIn: !!signIn,
		isLoaded,
		initAttempts,
	});

	// Check if user is already signed in
	useEffect(() => {
		if (isSignedIn) {
			console.log('User already signed in, redirecting to Dashboard');
			navigation.navigate('Dashboard');
		}
	}, [isSignedIn, navigation]);

	// Retry initialization if not loaded
	useEffect(() => {
		if (!isLoaded && initAttempts < 3) {
			const timer = setTimeout(() => {
				console.log('Retrying initialization...', {
					attempt: initAttempts + 1,
					platform: Platform.OS,
					isLoaded,
				});
				setInitAttempts((prev) => prev + 1);
			}, 2000);
			return () => clearTimeout(timer);
		}
	}, [isLoaded, initAttempts]);

	const handleSignIn = async () => {
		if (!email || !password) {
			setError('Please enter both email and password');
			return;
		}

		if (!isLoaded || !signIn) {
			console.error('Auth not initialized:', {
				isLoaded,
				hasSignIn: !!signIn,
				initAttempts,
				platform: Platform.OS,
			});
			setError(
				'Authentication service is initializing. Please try again in a moment.'
			);
			return;
		}

		try {
			setLoading(true);
			setError('');

			console.log('Attempting sign in with:', { email, platform: Platform.OS });
			const result = await signIn.create({
				identifier: email,
				password,
			});

			console.log('Sign in result:', {
				status: result.status,
				platform: Platform.OS,
			});

			if (result.status === 'complete') {
				console.log('Sign in complete, setting active session...');
				await setActive({ session: result.createdSessionId });
				console.log('Navigating to Dashboard...');
				navigation.navigate('Dashboard');
			} else {
				console.error('Sign in incomplete:', {
					status: result.status,
					platform: Platform.OS,
				});
				setError('Sign in failed. Please try again.');
			}
		} catch (err: any) {
			console.error('Error signing in:', {
				error: err,
				message: err?.message,
				stack: err?.stack,
				platform: Platform.OS,
			});

			// Check for specific error types
			if (err?.message?.includes('password')) {
				setError('Invalid password. Please try again.');
			} else if (err?.message?.includes('email')) {
				setError('Invalid email address. Please try again.');
			} else if (err?.message?.includes('network')) {
				setError('Network error. Please check your connection and try again.');
			} else {
				setError(`Authentication error: ${err?.message || 'Unknown error'}`);
			}
		} finally {
			setLoading(false);
		}
	};

	if (!isLoaded) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.content}>
					<ActivityIndicator
						size='large'
						color='#4B7F47'
					/>
					<Text style={styles.loadingText}>
						Loading authentication...{'\n'}
						{initAttempts > 0 ? `(Attempt ${initAttempts}/3)` : ''}
						{'\n'}
						{Platform.OS === 'ios' ? '(iOS)' : '(Android)'}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<View style={styles.formContainer}>
					{error ? <Text style={styles.errorText}>{error}</Text> : null}
					<TextInput
						style={styles.input}
						placeholder='Email'
						value={email}
						onChangeText={setEmail}
						autoCapitalize='none'
						keyboardType='email-address'
					/>
					<TextInput
						style={styles.input}
						placeholder='Password'
						value={password}
						onChangeText={setPassword}
						secureTextEntry
					/>
					<TouchableOpacity
						style={styles.button}
						onPress={handleSignIn}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Signing In...' : 'Sign In'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.signUpButton}
						onPress={() => navigation.navigate('SignUp')}
					>
						<Text style={styles.signUpText}>
							Don't have an account? Sign Up
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	formContainer: {
		width: '100%',
		maxWidth: 400,
		alignSelf: 'center',
		gap: 16,
	},
	input: {
		borderWidth: 1,
		borderColor: '#E5E7EB',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	button: {
		backgroundColor: '#4B7F47',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	signUpButton: {
		padding: 16,
		alignItems: 'center',
	},
	signUpText: {
		color: '#4B7F47',
		fontSize: 16,
	},
	errorText: {
		color: '#ff0000',
		fontSize: 14,
		textAlign: 'center',
		marginBottom: 10,
	},
	loadingText: {
		fontSize: 16,
		textAlign: 'center',
		color: '#666',
		marginTop: 10,
	},
});
