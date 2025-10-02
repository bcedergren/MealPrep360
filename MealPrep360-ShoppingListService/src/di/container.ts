import { IngredientParser } from '../services/ingredientParser';
import { UnitConverter, IUnitConverter } from '../services/unitConverter';
import { NameNormalizer, INameNormalizer } from '../services/nameNormalizer';
import { CategoryManager, ICategoryManager } from '../services/categoryManager';
import {
	QuantityCalculator,
	IQuantityCalculator,
} from '../services/quantityCalculator';
import {
	ShoppingListGenerator,
	IShoppingListGenerator,
} from '../services/shoppingListGenerator';

export class Container {
	private static instance: Container;
	private services: Map<string, any>;

	private constructor() {
		this.services = new Map();
		this.registerServices();
	}

	static getInstance(): Container {
		if (!Container.instance) {
			Container.instance = new Container();
		}
		return Container.instance;
	}

	private registerServices() {
		// Register core services
		this.register('ingredientParser', new IngredientParser());
		this.register('unitConverter', new UnitConverter());
		this.register('nameNormalizer', new NameNormalizer());
		this.register('categoryManager', new CategoryManager());
		this.register('quantityCalculator', new QuantityCalculator());

		// Register shopping list generator
		this.register(
			'shoppingListGenerator',
			new ShoppingListGenerator(
				this.getIngredientParser(),
				this.getUnitConverter(),
				this.getNameNormalizer(),
				this.getCategoryManager(),
				this.getQuantityCalculator()
			)
		);
	}

	register<T>(name: string, instance: T): void {
		this.services.set(name, instance);
	}

	resolve<T>(name: string): T {
		const service = this.services.get(name);
		if (!service) {
			throw new Error(`Service ${name} not found in container`);
		}
		return service as T;
	}

	// Convenience methods for common services
	getIngredientParser(): IngredientParser {
		return this.resolve<IngredientParser>('ingredientParser');
	}

	getUnitConverter(): IUnitConverter {
		return this.resolve<IUnitConverter>('unitConverter');
	}

	getNameNormalizer(): INameNormalizer {
		return this.resolve<INameNormalizer>('nameNormalizer');
	}

	getCategoryManager(): ICategoryManager {
		return this.resolve<ICategoryManager>('categoryManager');
	}

	getQuantityCalculator(): IQuantityCalculator {
		return this.resolve<IQuantityCalculator>('quantityCalculator');
	}

	getShoppingListGenerator(): IShoppingListGenerator {
		return this.resolve<IShoppingListGenerator>('shoppingListGenerator');
	}
}
