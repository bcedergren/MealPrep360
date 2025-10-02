import { RequestValidator } from '../../core/validation/RequestValidator';
import { UserCreateDTO, UserUpdateDTO } from '../types';

export class UserCreateValidator extends RequestValidator<UserCreateDTO> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !!data.clerkId,
			message: 'Clerk ID is required',
		});

		this.addRule({
			validate: (data) => !!data.email && this.isValidEmail(data.email),
			message: 'Valid email is required',
		});

		this.addRule({
			validate: (data) => !data.timezone || this.isValidTimezone(data.timezone),
			message: 'Invalid timezone format',
		});

		this.addRule({
			validate: (data) =>
				!data.cookingPreferences?.maxPrepTime ||
				data.cookingPreferences.maxPrepTime > 0,
			message: 'Max prep time must be greater than 0',
		});

		this.addRule({
			validate: (data) =>
				!data.cookingPreferences?.servingSize ||
				data.cookingPreferences.servingSize > 0,
			message: 'Serving size must be greater than 0',
		});
	}

	private isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	private isValidTimezone(timezone: string): boolean {
		try {
			Intl.DateTimeFormat(undefined, { timeZone: timezone });
			return true;
		} catch (error) {
			return false;
		}
	}
}

export class UserUpdateValidator extends RequestValidator<UserUpdateDTO> {
	constructor() {
		super();
		this.setupRules();
	}

	private setupRules(): void {
		this.addRule({
			validate: (data) => !data.timezone || this.isValidTimezone(data.timezone),
			message: 'Invalid timezone format',
		});

		this.addRule({
			validate: (data) =>
				!data.cookingPreferences?.maxPrepTime ||
				data.cookingPreferences.maxPrepTime > 0,
			message: 'Max prep time must be greater than 0',
		});

		this.addRule({
			validate: (data) =>
				!data.cookingPreferences?.servingSize ||
				data.cookingPreferences.servingSize > 0,
			message: 'Serving size must be greater than 0',
		});
	}

	private isValidTimezone(timezone: string): boolean {
		try {
			Intl.DateTimeFormat(undefined, { timeZone: timezone });
			return true;
		} catch (error) {
			return false;
		}
	}
}
