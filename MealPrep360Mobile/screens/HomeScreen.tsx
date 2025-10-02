import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
	ImageBackground,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { RootStackParamList } from '../types/navigation';

type HomeScreenProps = {
	navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: HomeScreenProps) {
	console.log('HomeScreen mounting...');

	return (
		<ImageBackground
			source={require('../assets/images/hero-bg.png')}
			style={styles.background}
		>
			<View style={styles.container}>
				<View style={styles.logoContainer}>
					<ImageBackground
						source={require('../assets/images/logo_dark.png')}
						style={styles.logo}
						resizeMode='contain'
					/>
				</View>

				<Text style={styles.title}>Welcome to MealPrep360!</Text>
				<Text style={styles.subtitle}>
					Your personal meal planning assistant
				</Text>

				<View style={styles.buttonContainer}>
					<TouchableOpacity
						style={styles.button}
						onPress={() => navigation.navigate('SignUp')}
					>
						<Text style={styles.buttonText}>Get Started</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.button, styles.secondaryButton]}
						onPress={() => navigation.navigate('Login')}
					>
						<Text style={[styles.buttonText, styles.secondaryButtonText]}>
							Login
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		width: '100%',
		height: '100%',
	},
	container: {
		flex: 1,
		padding: 20,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	logoContainer: {
		width: 200,
		height: 200,
		marginBottom: 40,
	},
	logo: {
		width: '100%',
		height: '100%',
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#fff',
		textAlign: 'center',
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 18,
		color: '#fff',
		textAlign: 'center',
		marginBottom: 40,
	},
	buttonContainer: {
		width: '100%',
		maxWidth: 300,
	},
	button: {
		backgroundColor: '#4CAF50',
		padding: 15,
		borderRadius: 10,
		marginBottom: 15,
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
	},
	secondaryButton: {
		backgroundColor: 'transparent',
		borderWidth: 2,
		borderColor: '#fff',
	},
	secondaryButtonText: {
		color: '#fff',
	},
});
