import { serviceDiscovery } from './discovery';
import { resilientClient } from './resilience';

export interface TraceContext {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	baggage?: Record<string, string>;
}

export interface Span {
	traceId: string;
	spanId: string;
	parentSpanId?: string;
	operationName: string;
	serviceName: string;
	startTime: number;
	endTime?: number;
	duration?: number;
	tags: Record<string, any>;
	logs: Array<{
		timestamp: number;
		level: 'info' | 'warn' | 'error';
		message: string;
		fields?: Record<string, any>;
	}>;
	status: 'ok' | 'error' | 'timeout';
}

export interface ServiceMetrics {
	serviceName: string;
	requestCount: number;
	errorCount: number;
	avgResponseTime: number;
	p95ResponseTime: number;
	p99ResponseTime: number;
	healthStatus: 'healthy' | 'unhealthy' | 'unknown';
	lastUpdated: Date;
}

export class DistributedTracer {
	private static instance: DistributedTracer;
	private spans: Map<string, Span> = new Map();
	private traces: Map<string, Span[]> = new Map();
	private readonly MAX_SPANS_PER_TRACE = 100;
	private readonly MAX_TRACES = 1000;

	private constructor() {}

	static getInstance(): DistributedTracer {
		if (!DistributedTracer.instance) {
			DistributedTracer.instance = new DistributedTracer();
		}
		return DistributedTracer.instance;
	}

	createTrace(): TraceContext {
		const traceId = this.generateId();
		const spanId = this.generateId();

		return {
			traceId,
			spanId,
			baggage: {},
		};
	}

	startSpan(
		operationName: string,
		serviceName: string,
		parentContext?: TraceContext
	): { span: Span; context: TraceContext } {
		const traceId = parentContext?.traceId || this.generateId();
		const spanId = this.generateId();

		const span: Span = {
			traceId,
			spanId,
			parentSpanId: parentContext?.spanId,
			operationName,
			serviceName,
			startTime: Date.now(),
			tags: {},
			logs: [],
			status: 'ok',
		};

		this.spans.set(spanId, span);
		this.addSpanToTrace(traceId, span);

		const context: TraceContext = {
			traceId,
			spanId,
			parentSpanId: parentContext?.spanId,
			baggage: parentContext?.baggage || {},
		};

		return { span, context };
	}

	finishSpan(spanId: string, tags?: Record<string, any>): void {
		const span = this.spans.get(spanId);
		if (!span) return;

		span.endTime = Date.now();
		span.duration = span.endTime - span.startTime;

		if (tags) {
			span.tags = { ...span.tags, ...tags };
		}

		this.cleanupOldSpans();
	}

	addSpanTag(spanId: string, key: string, value: any): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.tags[key] = value;
		}
	}

	addSpanLog(
		spanId: string,
		level: 'info' | 'warn' | 'error',
		message: string,
		fields?: Record<string, any>
	): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.logs.push({
				timestamp: Date.now(),
				level,
				message,
				fields,
			});
		}
	}

	setSpanStatus(spanId: string, status: 'ok' | 'error' | 'timeout'): void {
		const span = this.spans.get(spanId);
		if (span) {
			span.status = status;
		}
	}

	getTrace(traceId: string): Span[] {
		return this.traces.get(traceId) || [];
	}

	getAllTraces(): Map<string, Span[]> {
		return new Map(this.traces);
	}

	private addSpanToTrace(traceId: string, span: Span): void {
		if (!this.traces.has(traceId)) {
			this.traces.set(traceId, []);
		}

		const traceSpans = this.traces.get(traceId)!;
		traceSpans.push(span);

		// Limit spans per trace
		if (traceSpans.length > this.MAX_SPANS_PER_TRACE) {
			traceSpans.shift();
		}
	}

	private cleanupOldSpans(): void {
		if (this.spans.size > this.MAX_TRACES * 10) {
			const oldestSpans = Array.from(this.spans.entries())
				.sort(([, a], [, b]) => a.startTime - b.startTime)
				.slice(0, this.spans.size - this.MAX_TRACES * 5);

			oldestSpans.forEach(([spanId]) => {
				this.spans.delete(spanId);
			});
		}
	}

	private generateId(): string {
		return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
	}
}

export class MetricsCollector {
	private static instance: MetricsCollector;
	private metrics: Map<string, ServiceMetrics> = new Map();
	private responseTimes: Map<string, number[]> = new Map();
	private readonly MAX_RESPONSE_TIME_SAMPLES = 1000;

	private constructor() {}

	static getInstance(): MetricsCollector {
		if (!MetricsCollector.instance) {
			MetricsCollector.instance = new MetricsCollector();
		}
		return MetricsCollector.instance;
	}

	recordRequest(
		serviceName: string,
		responseTime: number,
		isError: boolean = false
	): void {
		let metrics = this.metrics.get(serviceName);
		if (!metrics) {
			metrics = {
				serviceName,
				requestCount: 0,
				errorCount: 0,
				avgResponseTime: 0,
				p95ResponseTime: 0,
				p99ResponseTime: 0,
				healthStatus: 'unknown',
				lastUpdated: new Date(),
			};
			this.metrics.set(serviceName, metrics);
		}

		metrics.requestCount++;
		if (isError) {
			metrics.errorCount++;
		}

		// Store response time for percentile calculations
		if (!this.responseTimes.has(serviceName)) {
			this.responseTimes.set(serviceName, []);
		}

		const times = this.responseTimes.get(serviceName)!;
		times.push(responseTime);

		// Keep only recent samples
		if (times.length > this.MAX_RESPONSE_TIME_SAMPLES) {
			times.shift();
		}

		// Calculate metrics
		this.calculateMetrics(serviceName);
	}

	recordHealthStatus(
		serviceName: string,
		status: 'healthy' | 'unhealthy' | 'unknown'
	): void {
		let metrics = this.metrics.get(serviceName);
		if (!metrics) {
			metrics = {
				serviceName,
				requestCount: 0,
				errorCount: 0,
				avgResponseTime: 0,
				p95ResponseTime: 0,
				p99ResponseTime: 0,
				healthStatus: status,
				lastUpdated: new Date(),
			};
			this.metrics.set(serviceName, metrics);
		}

		metrics.healthStatus = status;
		metrics.lastUpdated = new Date();
	}

	getMetrics(serviceName: string): ServiceMetrics | null {
		return this.metrics.get(serviceName) || null;
	}

	getAllMetrics(): Map<string, ServiceMetrics> {
		return new Map(this.metrics);
	}

	private calculateMetrics(serviceName: string): void {
		const metrics = this.metrics.get(serviceName);
		const times = this.responseTimes.get(serviceName);

		if (!metrics || !times || times.length === 0) return;

		// Calculate average
		metrics.avgResponseTime =
			times.reduce((sum, time) => sum + time, 0) / times.length;

		// Calculate percentiles
		const sortedTimes = [...times].sort((a, b) => a - b);
		const p95Index = Math.floor(sortedTimes.length * 0.95);
		const p99Index = Math.floor(sortedTimes.length * 0.99);

		metrics.p95ResponseTime = sortedTimes[p95Index] || 0;
		metrics.p99ResponseTime = sortedTimes[p99Index] || 0;
		metrics.lastUpdated = new Date();
	}
}

export class HealthChecker {
	private static instance: HealthChecker;
	private isRunning: boolean = false;
	private checkInterval: NodeJS.Timeout | null = null;
	private readonly CHECK_INTERVAL = 30000; // 30 seconds

	private constructor() {}

	static getInstance(): HealthChecker {
		if (!HealthChecker.instance) {
			HealthChecker.instance = new HealthChecker();
		}
		return HealthChecker.instance;
	}

	start(): void {
		if (this.isRunning) return;

		this.isRunning = true;
		this.performHealthChecks();

		this.checkInterval = setInterval(() => {
			this.performHealthChecks();
		}, this.CHECK_INTERVAL);

		console.log('🔍 Health checker started');
	}

	stop(): void {
		if (!this.isRunning) return;

		this.isRunning = false;
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}

		console.log('🛑 Health checker stopped');
	}

	private async performHealthChecks(): Promise<void> {
		const services = serviceDiscovery.listServices();
		const tracer = DistributedTracer.getInstance();
		const metrics = MetricsCollector.getInstance();

		for (const service of services) {
			const traceContext = tracer.createTrace();
			const { span, context } = tracer.startSpan(
				'health-check',
				'health-checker',
				traceContext
			);

			try {
				tracer.addSpanTag(span.spanId, 'service.name', service.name);
				tracer.addSpanTag(span.spanId, 'service.url', service.endpoint.url);

				const startTime = Date.now();

				await serviceDiscovery.checkServiceHealth(service.name);

				const responseTime = Date.now() - startTime;
				const updatedService = serviceDiscovery.getService(service.name);

				if (updatedService?.health) {
					const healthStatus =
						updatedService.health.status === 'error'
							? 'unhealthy'
							: updatedService.health.status;
					metrics.recordHealthStatus(service.name, healthStatus);
					tracer.addSpanTag(
						span.spanId,
						'health.status',
						updatedService.health.status
					);
					tracer.addSpanTag(span.spanId, 'response.time', responseTime);

					tracer.setSpanStatus(
						span.spanId,
						updatedService.health.status === 'healthy' ? 'ok' : 'error'
					);
				}
			} catch (error) {
				tracer.addSpanLog(span.spanId, 'error', 'Health check failed', {
					error: error instanceof Error ? error.message : String(error),
				});
				tracer.setSpanStatus(span.spanId, 'error');
				metrics.recordHealthStatus(service.name, 'unhealthy');
			} finally {
				tracer.finishSpan(span.spanId);
			}
		}
	}
}

export class MonitoringManager {
	private tracer: DistributedTracer;
	private metrics: MetricsCollector;
	private healthChecker: HealthChecker;

	constructor() {
		this.tracer = DistributedTracer.getInstance();
		this.metrics = MetricsCollector.getInstance();
		this.healthChecker = HealthChecker.getInstance();
	}

	initialize(): void {
		this.healthChecker.start();
		console.log('📊 Monitoring system initialized');
	}

	shutdown(): void {
		this.healthChecker.stop();
		console.log('📊 Monitoring system shutdown');
	}

	async traceServiceCall<T>(
		serviceName: string,
		operationName: string,
		operation: (context: TraceContext) => Promise<T>,
		parentContext?: TraceContext
	): Promise<T> {
		const { span, context } = this.tracer.startSpan(
			operationName,
			serviceName,
			parentContext
		);

		const startTime = Date.now();
		let isError = false;

		try {
			this.tracer.addSpanTag(span.spanId, 'service.name', serviceName);
			this.tracer.addSpanTag(span.spanId, 'operation.name', operationName);

			const result = await operation(context);

			this.tracer.addSpanLog(
				span.spanId,
				'info',
				'Operation completed successfully'
			);
			this.tracer.setSpanStatus(span.spanId, 'ok');

			return result;
		} catch (error) {
			isError = true;
			this.tracer.addSpanLog(span.spanId, 'error', 'Operation failed', {
				error: error instanceof Error ? error.message : String(error),
			});
			this.tracer.setSpanStatus(span.spanId, 'error');
			throw error;
		} finally {
			const responseTime = Date.now() - startTime;
			this.tracer.addSpanTag(span.spanId, 'response.time', responseTime);
			this.tracer.finishSpan(span.spanId);
			this.metrics.recordRequest(serviceName, responseTime, isError);
		}
	}

	getSystemHealth(): {
		overall: 'healthy' | 'degraded' | 'unhealthy';
		services: Record<string, any>;
		metrics: Record<string, ServiceMetrics>;
	} {
		const services = serviceDiscovery.listServices();
		const metrics = this.metrics.getAllMetrics();

		let healthyCount = 0;
		let totalCount = 0;

		const serviceHealth: Record<string, any> = {};

		services.forEach((service) => {
			totalCount++;
			if (service.health?.status === 'healthy') {
				healthyCount++;
			}

			serviceHealth[service.name] = {
				status: service.health?.status || 'unknown',
				responseTime: service.health?.responseTime || 0,
				lastHealthCheck:
					service.health?.lastHealthCheck || new Date().toISOString(),
			};
		});

		let overall: 'healthy' | 'degraded' | 'unhealthy';
		if (healthyCount === totalCount) {
			overall = 'healthy';
		} else if (healthyCount === 0) {
			overall = 'unhealthy';
		} else {
			overall = 'degraded';
		}

		return {
			overall,
			services: serviceHealth,
			metrics: Object.fromEntries(metrics),
		};
	}
}

export const monitoring = new MonitoringManager();
