import { IDateService } from '../../domain/interfaces/IDateService';

export class DateService implements IDateService {
	normalizeToStartOfDay(date: Date): Date {
		const normalized = new Date(date);
		normalized.setUTCHours(0, 0, 0, 0);
		return normalized;
	}

	normalizeToEndOfDay(date: Date): Date {
		const normalized = new Date(date);
		normalized.setUTCHours(23, 59, 59, 999);
		return normalized;
	}

	addDays(date: Date, days: number): Date {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}

	isSameDay(date1: Date, date2: Date): boolean {
		return (
			date1.getUTCFullYear() === date2.getUTCFullYear() &&
			date1.getUTCMonth() === date2.getUTCMonth() &&
			date1.getUTCDate() === date2.getUTCDate()
		);
	}

	toISOString(date: Date): string {
		return date.toISOString();
	}
}
