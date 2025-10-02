import { useSignUp } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
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
	Verification: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VerificationScreen() {
	const navigation = useNavigation<NavigationProp>();
	const { signUp, setActive } = useSignUp();
	const [code, setCode] = useState('');
	const [loading, setLoading] = useState(false);

	const handleVerification = async () => {
		if (!code || !signUp || !setActive) return;

		try {
			setLoading(true);
			const result = await signUp.attemptEmailAddressVerification({
				code,
			});

			if (result.status === 'complete') {
				await setActive({ session: result.createdSessionId });
				navigation.navigate('Home');
			}
		} catch (err) {
			console.error('Error verifying code:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Verify Your Email</Text>
				<Text style={styles.subtitle}>
					Enter the verification code sent to your email
				</Text>
				<View style={styles.formContainer}>
					<TextInput
						style={styles.input}
						placeholder='Verification Code'
						value={code}
						onChangeText={setCode}
						autoCapitalize='none'
						keyboardType='number-pad'
					/>
					<TouchableOpacity
						style={styles.button}
						onPress={handleVerification}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Verifying...' : 'Verify Email'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.backButtonText}>Back to Sign Up</Text>
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
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#4B7F47',
		marginBottom: 12,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 16,
		color: '#666',
		textAlign: 'center',
		marginBottom: 24,
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
	backButton: {
		padding: 16,
		alignItems: 'center',
	},
	backButtonText: {
		color: '#4B7F47',
		fontSize: 16,
	},
});
