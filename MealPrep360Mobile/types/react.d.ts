import 'react';

declare module 'react' {
	export * from '@types/react';

	interface React {
		useEffect: typeof import('react').useEffect;
	}
}
