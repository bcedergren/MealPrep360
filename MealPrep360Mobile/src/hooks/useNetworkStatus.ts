import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

type NetworkQuality = 'good' | 'fair' | 'poor';

interface NetworkStatus {
	isConnected: boolean;
	quality: NetworkQuality;
}

export const useNetworkStatus = (): NetworkStatus => {
	const [isConnected, setIsConnected] = useState(true);
	const [quality, setQuality] = useState<NetworkQuality>('good');

	useEffect(() => {
		const unsubscribe = NetInfo.addEventListener((state) => {
			const connected = Boolean(state.isConnected && state.isInternetReachable);
			setIsConnected(connected);

			if (state.type === 'wifi') {
				setQuality('good');
			} else if (state.type === 'cellular') {
				setQuality(
					state.details?.cellularGeneration === '5g' ? 'good' : 'fair'
				);
			} else {
				setQuality('poor');
			}
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return { isConnected, quality };
};
