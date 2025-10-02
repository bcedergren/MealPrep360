import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
	level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
	format: format.combine(
		format.timestamp(),
		format.printf((info) => {
			const metaString =
				Object.keys(info).length > 3 ? ` ${JSON.stringify(info)}` : '';
			return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}${metaString}`;
		})
	),
	transports: [
		new transports.Console({
			format: format.combine(format.colorize()),
		}),
	],
});
