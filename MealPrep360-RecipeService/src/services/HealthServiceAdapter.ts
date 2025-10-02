import { IHealthService, HealthStatus } from './interfaces/IHealthService'
import { HealthService } from './health'

// Adapter to align the richer HealthService API with the IHealthService contract
export class HealthServiceAdapter implements IHealthService {
  private impl: HealthService

  constructor(impl?: HealthService) {
    this.impl = impl ?? HealthService.getInstance()
  }

  // Compose a HealthStatus summary from detailed db health
  async checkHealth(): Promise<HealthStatus> {
    const db = await this.impl.checkDatabaseHealth()
    const status = db.status
    return {
      status,
      details: {
        database: {
          status,
          message:
            status === 'healthy' ? 'Database OK' : 'Database issues detected',
        },
        // Queue and AI health checks are not implemented in impl; default to healthy
        queue: { status: 'healthy', message: 'Queue assumed healthy' },
        ai: { status: 'healthy', message: 'AI service assumed healthy' },
      },
    }
  }

  // For compatibility, map to boolean based on detailed status
  async checkDatabaseHealth(): Promise<boolean> {
    const db = await this.impl.checkDatabaseHealth()
    return db.status === 'healthy'
  }

  // Not implemented in impl; return optimistic true for now
  async checkQueueHealth(): Promise<boolean> {
    return true
  }

  // Not implemented in impl; return optimistic true for now
  async checkAIServiceHealth(): Promise<boolean> {
    return true
  }

  startMonitoring(): void {
    this.impl.startMonitoring()
  }

  stopMonitoring(): void {
    this.impl.stopMonitoring()
  }

  resetCircuitBreaker(): void {
    this.impl.resetCircuitBreaker()
  }
}
