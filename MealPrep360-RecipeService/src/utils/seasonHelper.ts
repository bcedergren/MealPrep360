export interface LocationInfo {
	country?: string;
	region?: string;
	hemisphere?: 'northern' | 'southern';
	latitude?: number;
	longitude?: number;
}

/**
 * Get the current season based on location
 * @param location - Location information
 * @param date - Optional date to calculate season for (defaults to current date)
 * @returns The current season
 */
export function getSeasonForLocation(
	location?: LocationInfo,
	date: Date = new Date()
): string {
	const month = date.getMonth();
	const day = date.getDate();

	// Determine hemisphere
	let hemisphere: 'northern' | 'southern' = 'northern';

	if (location) {
		if (location.hemisphere) {
			hemisphere = location.hemisphere;
		} else if (location.latitude !== undefined) {
			hemisphere = location.latitude >= 0 ? 'northern' : 'southern';
		} else if (location.country) {
			// Map countries to hemispheres (simplified list)
			const southernHemisphereCountries = [
				'australia',
				'new zealand',
				'argentina',
				'chile',
				'brazil',
				'south africa',
				'zimbabwe',
				'mozambique',
				'madagascar',
				'uruguay',
				'paraguay',
				'bolivia',
				'peru',
				'ecuador',
				'colombia',
				'venezuela',
				'indonesia',
				'papua new guinea',
				'fiji',
				'samoa',
				'tonga',
			];

			if (
				southernHemisphereCountries.includes(location.country.toLowerCase())
			) {
				hemisphere = 'southern';
			}
		}
	}

	// Calculate season based on hemisphere
	if (hemisphere === 'northern') {
		return getNorthernHemisphereSeason(month, day);
	} else {
		return getSouthernHemisphereSeason(month, day);
	}
}

/**
 * Get season for Northern Hemisphere
 */
function getNorthernHemisphereSeason(month: number, day: number): string {
	// Spring: March 20 - June 20
	// Summer: June 21 - September 22
	// Fall: September 23 - December 20
	// Winter: December 21 - March 19

	if (
		(month === 2 && day >= 20) ||
		month === 3 ||
		month === 4 ||
		(month === 5 && day <= 20)
	) {
		return 'spring';
	}

	if (
		(month === 5 && day >= 21) ||
		month === 6 ||
		month === 7 ||
		(month === 8 && day <= 22)
	) {
		return 'summer';
	}

	if (
		(month === 8 && day >= 23) ||
		month === 9 ||
		month === 10 ||
		(month === 11 && day <= 20)
	) {
		return 'fall';
	}

	// Winter: December 21 - March 19
	return 'winter';
}

/**
 * Get season for Southern Hemisphere (opposite of Northern)
 */
function getSouthernHemisphereSeason(month: number, day: number): string {
	// Summer: December 21 - March 19
	// Fall: March 20 - June 20
	// Winter: June 21 - September 22
	// Spring: September 23 - December 20

	if (
		(month === 11 && day >= 21) ||
		month === 0 ||
		month === 1 ||
		(month === 2 && day <= 19)
	) {
		return 'summer';
	}

	if (
		(month === 2 && day >= 20) ||
		month === 3 ||
		month === 4 ||
		(month === 5 && day <= 20)
	) {
		return 'fall';
	}

	if (
		(month === 5 && day >= 21) ||
		month === 6 ||
		month === 7 ||
		(month === 8 && day <= 22)
	) {
		return 'winter';
	}

	// Spring: September 23 - December 20
	return 'spring';
}

/**
 * Get regional cuisine preferences based on location
 */
export function getRegionalCuisinePreferences(
	location?: LocationInfo
): string[] {
	if (!location || (!location.country && !location.region)) {
		return [];
	}

	const country = location.country?.toLowerCase() || '';
	const region = location.region?.toLowerCase() || '';

	// Map regions/countries to cuisine preferences
	const cuisineMap: { [key: string]: string[] } = {
		// North America
		'united states': ['american', 'tex-mex', 'southern', 'bbq'],
		usa: ['american', 'tex-mex', 'southern', 'bbq'],
		canada: ['canadian', 'comfort food', 'hearty'],
		mexico: ['mexican', 'tex-mex', 'latin'],

		// Europe
		'united kingdom': ['british', 'comfort food', 'pub food'],
		uk: ['british', 'comfort food', 'pub food'],
		france: ['french', 'european', 'rustic'],
		italy: ['italian', 'mediterranean', 'pasta'],
		spain: ['spanish', 'mediterranean', 'tapas'],
		germany: ['german', 'european', 'hearty'],

		// Asia
		china: ['chinese', 'asian', 'stir-fry'],
		japan: ['japanese', 'asian', 'umami'],
		india: ['indian', 'curry', 'spiced'],
		thailand: ['thai', 'asian', 'curry'],
		korea: ['korean', 'asian', 'fermented'],

		// Oceania
		australia: ['australian', 'bbq', 'comfort food'],
		'new zealand': ['comfort food', 'hearty', 'lamb'],

		// South America
		brazil: ['brazilian', 'latin', 'stew'],
		argentina: ['argentinian', 'latin', 'beef'],

		// Middle East
		israel: ['middle eastern', 'mediterranean', 'spiced'],
		lebanon: ['middle eastern', 'mediterranean', 'mezze'],

		// Africa
		'south africa': ['south african', 'braai', 'stew'],
		morocco: ['moroccan', 'north african', 'tagine'],
	};

	// Check for country match
	if (cuisineMap[country]) {
		return cuisineMap[country];
	}

	// Check for region match
	if (cuisineMap[region]) {
		return cuisineMap[region];
	}

	// Default regional preferences
	if (region.includes('asia')) {
		return ['asian', 'rice-based', 'stir-fry'];
	} else if (region.includes('europe')) {
		return ['european', 'comfort food', 'hearty'];
	} else if (region.includes('america')) {
		return ['comfort food', 'hearty', 'casserole'];
	}

	return [];
}
