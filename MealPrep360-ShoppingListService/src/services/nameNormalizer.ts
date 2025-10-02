export interface INameNormalizer {
	cleanIngredientName(name: string): string;
}

export class NameNormalizer implements INameNormalizer {
	private readonly nameVariations: Record<string, string> = {
		// Garlic variations
		'garlic cloves': 'garlic',
		'garlic clove': 'garlic',
		'cloves garlic': 'garlic',
		'clove garlic': 'garlic',
		garlic: 'garlic',

		// Onion variations
		onions: 'onion',
		'onions diced': 'onion',
		'onions and': 'onion',
		'red onions': 'onion',
		'white onions': 'onion',
		'yellow onions': 'onion',
		'sweet onions': 'onion',
		'red onion': 'onion',
		'white onion': 'onion',
		'yellow onion': 'onion',
		'sweet onion': 'onion',
		'medium onion': 'onion',
		'large onion': 'onion',
		'medium onions': 'onion',
		'large red onion': 'onion',

		// Add more variations as needed...
	};

	private readonly containerPatterns = [
		/\b(can|jar|package|pkg|container|box|bag|bottle|carton|tube)\s+of\s+/gi,
		/\b(canned|jarred|packaged|bottled|boxed|bagged)\s+/gi,
		/\b\d+\s*(?:oz|ounce|lb|pound|g|gram|kg|ml|liter)\s+(?:can|jar|package|pkg|container|box|bag|bottle|carton)\s+(?:of\s+)?/gi,
		/^\d+\s*(?:oz|ounce|lb|pound|g|gram|kg|ml|liter)\s+/gi,
		/\s*\(\d+\s*(?:oz|ounce|lb|pound|g|gram|kg|ml|liter)\)\s*/gi,
		/^can\s+/gi,
		/\bcan\s+/gi,
		/\bcans\s+/gi,
		/\s+of\s+/gi,
		/^of\s+/gi,
		/\bsheets?\s+/gi,
		/\bbunch\s+/gi,
	];

	private readonly complexPrepPatterns = [
		/,\s*cut\s+into\s+[\d\-\/\s]*(?:inch|cm|mm)?\s*(?:pieces|cubes|chunks|strips)?\s*$/gi,
		/,\s*chopped\s+into\s+[\d\-\/\s]*(?:inch|cm|mm)?\s*(?:pieces|cubes|chunks)?\s*$/gi,
		/,\s*diced\s+into\s+[\d\-\/\s]*(?:inch|cm|mm)?\s*(?:pieces|cubes)?\s*$/gi,
		/,\s*sliced\s+(?:into\s+)?[\d\-\/\s]*(?:inch|cm|mm)?\s*(?:thick|pieces|rounds)?\s*$/gi,
		/,\s*(?:peeled\s+and\s+)?(?:seeded\s+and\s+)?(?:chopped|diced|sliced|minced|grated|shredded)\s*$/gi,
		/,\s*(?:peeled\s+and\s+)?(?:cubed|chunked)\s*$/gi,
		/,\s*(?:washed\s+and\s+)?(?:dried|trimmed|cleaned)\s*$/gi,
		/,\s*(?:stems?\s+)?(?:removed|discarded)\s*$/gi,
		/,\s*(?:peeled|chopped|diced|minced|sliced|shredded|grated|crushed|trimmed|cleaned|washed|dried|seeded|cored|stemmed|cubed|chunked)\s*$/gi,
	];

	private readonly adjectivePatterns = [
		/\b(large|medium|small|extra\s+large|jumbo|mini|baby|young)\s+/gi,
		/\b(fresh|ripe|raw|cooked|roasted|grilled|baked|fried)\s+/gi,
		/\b(peeled|chopped|diced|minced|sliced|shredded|grated|crushed|whole|halved|quartered)\s+/gi,
		/\b(organic|free\s*range|grass\s*fed|wild\s*caught|farm\s*raised)\s+/gi,
		/\b(unsalted|salted|sweetened|unsweetened|low\s*fat|fat\s*free|reduced\s*fat)\s+/gi,
		/\b(extra\s+virgin|virgin|refined|unrefined|cold\s*pressed)\s+/gi,
		/\b(boneless|skinless|lean|extra\s+lean)\s*,?\s*/gi,
		/\b(trimmed|cleaned|washed|dried|seeded|cored|stemmed)\s+/gi,
		/\b(no-boil|boil)\s+/gi,
		/\bto\s+taste\s+/gi,
		/\bgrated\s+/gi,
		/\bripe\s+/gi,
	];

	private readonly colorPatterns = [
		/\b(red|green|yellow|orange|purple|white|black)\s+/gi,
	];

	cleanIngredientName(name: string): string {
		let cleaned = name.trim();

		// Remove common prefixes like "N/A", "N/A ", etc.
		cleaned = cleaned.replace(/^N\/A\s*/i, '');

		// Remove "to taste" ingredients - return empty to skip
		if (cleaned.toLowerCase().includes('to taste')) {
			return '';
		}

		// Apply all cleaning patterns
		for (const pattern of this.containerPatterns) {
			cleaned = cleaned.replace(pattern, '');
		}

		for (const pattern of this.complexPrepPatterns) {
			cleaned = cleaned.replace(pattern, '');
		}

		for (const pattern of this.adjectivePatterns) {
			cleaned = cleaned.replace(pattern, '');
		}

		for (const pattern of this.colorPatterns) {
			cleaned = cleaned.replace(pattern, '');
		}

		// Clean up punctuation and extra whitespace
		cleaned = cleaned
			.replace(/[,\(\)]/g, '')
			.replace(/\s+/g, ' ')
			.trim()
			.toLowerCase();

		// Apply name variations
		for (const [variation, standard] of Object.entries(this.nameVariations)) {
			if (cleaned === variation.toLowerCase()) {
				return standard;
			}
		}

		return cleaned;
	}
}
