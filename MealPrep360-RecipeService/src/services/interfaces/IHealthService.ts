export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: {
    database?: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
    };
    queue?: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
    };
    ai?: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
    };
  };
}

export interface IHealthService {
  checkHealth(): Promise<HealthStatus>;
  checkDatabaseHealth(): Promise<boolean>;
  checkQueueHealth(): Promise<boolean>;
  checkAIServiceHealth(): Promise<boolean>;
  startMonitoring(): void;
  stopMonitoring(): void;
  resetCircuitBreaker(): void;
}