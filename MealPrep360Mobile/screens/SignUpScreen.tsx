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

export default function SignUpScreen() {
	const navigation = useNavigation<NavigationProp>();
	const { signUp, setActive } = useSignUp();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSignUp = async () => {
		if (!email || !password || !signUp) return;

		try {
			setLoading(true);
			await signUp.create({
				emailAddress: email,
				password,
			});
			await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
			navigation.navigate('Verification');
		} catch (err) {
			console.error('Error signing up:', err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Create Account</Text>
				<View style={styles.formContainer}>
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
						onPress={handleSignUp}
						disabled={loading}
					>
						<Text style={styles.buttonText}>
							{loading ? 'Creating Account...' : 'Sign Up'}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.backButton}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.backButtonText}>Back to Home</Text>
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
		marginBottom: 24,
		textAlign: 'center',
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
