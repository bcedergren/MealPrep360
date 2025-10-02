export interface IDateService {
	normalizeToStartOfDay(date: Date): Date;
	normalizeToEndOfDay(date: Date): Date;
	addDays(date: Date, days: number): Date;
	isSameDay(date1: Date, date2: Date): boolean;
	toISOString(date: Date): string;
}
