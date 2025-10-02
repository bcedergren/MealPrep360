import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import {
	ActivityIndicator,
	Animated,
	Dimensions,
	Image,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
	console.log('Rendering SplashScreen');
	const navigation = useNavigation<NavigationProp>();
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.8)).current;
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		console.log('SplashScreen mounted');

		// Start fade in and scale animation
		Animated.parallel([
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			}),
			Animated.spring(scaleAnim, {
				toValue: 1,
				tension: 10,
				friction: 2,
				useNativeDriver: true,
			}),
		]).start();

		// Navigate to Home after delay
		timerRef.current = setTimeout(() => {
			try {
				console.log('Attempting to navigate to Home');
				navigation.reset({
					index: 0,
					routes: [{ name: 'Home' }],
				});
			} catch (error) {
				console.error('Navigation error:', error);
			}
		}, 2000);

		return () => {
			console.log('SplashScreen unmounting');
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return (
		<View style={styles.container}>
			<Animated.View
				style={[
					styles.logoContainer,
					{
						opacity: fadeAnim,
						transform: [{ scale: scaleAnim }],
					},
				]}
			>
				<Image
					source={require('../assets/images/splash-icon.png')}
					style={styles.logo}
					resizeMode='contain'
				/>
			</Animated.View>
			<Animated.View
				style={[
					styles.loaderContainer,
					{
						opacity: fadeAnim,
					},
				]}
			>
				<ActivityIndicator
					size='large'
					color='#4B7F47'
					style={styles.loader}
				/>
			</Animated.View>
			<Text style={styles.debugText}>Splash Screen</Text>
		</View>
	);
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#2F2F2F',
		justifyContent: 'center',
		alignItems: 'center',
	},
	logoContainer: {
		width: width * 0.7,
		height: width * 0.7,
		justifyContent: 'center',
		alignItems: 'center',
	},
	logo: {
		width: '100%',
		height: '100%',
	},
	loaderContainer: {
		position: 'absolute',
		bottom: height * 0.15,
	},
	loader: {
		transform: [{ scale: 1.2 }],
	},
	debugText: {
		position: 'absolute',
		top: 50,
		color: '#fff',
		fontSize: 20,
	},
});
