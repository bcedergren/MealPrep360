declare module '@upstash/queue' {
	export class Queue {
		constructor(config: {
			redis: any;
			queueName: string;
			concurrencyLimit?: number;
		});
		receiveMessage<T>(
			timeout?: number
		): Promise<{ streamId: string; body: T } | null>;
		sendMessage<T>(message: T): Promise<void>;
	}
}

declare module '@upstash/redis' {
	export class Redis {
		constructor(config: { url: string; token: string });
	}
}
