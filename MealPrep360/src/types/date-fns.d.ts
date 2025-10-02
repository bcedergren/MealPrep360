declare module 'date-fns' {
	export function formatDistanceToNow(
		date: Date | number,
		options?: { addSuffix?: boolean }
	): string;
	export function format(date: Date | number, format: string): string;
	export function addDays(date: Date | number, amount: number): Date;
	export function subDays(date: Date | number, amount: number): Date;
	export function startOfDay(date: Date | number): Date;
	export function endOfDay(date: Date | number): Date;
	export function addMonths(date: Date | number, amount: number): Date;
	export function subMonths(date: Date | number, amount: number): Date;
	export function startOfMonth(date: Date | number): Date;
	export function endOfMonth(date: Date | number): Date;
	export function eachDayOfInterval(interval: {
		start: Date | number;
		end: Date | number;
	}): Date[];
	export function isToday(date: Date | number): boolean;
	export function startOfWeek(date: Date | number): Date;
	export function endOfWeek(date: Date | number): Date;
	export function isSameMonth(
		dateLeft: Date | number,
		dateRight: Date | number
	): boolean;
}
