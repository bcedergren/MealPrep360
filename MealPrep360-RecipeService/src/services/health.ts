import mongoose from 'mongoose'
import { logger } from './logger.js'
import { config } from '../config.js'

// Circuit breaker implementation
class CircuitBreaker {
  private failures: number = 0
  private lastFailure: number | null = null
  private readonly threshold: number = 5
  private readonly resetTimeout: number = 60000

  isOpen(): boolean {
    if (this.lastFailure === null) return false
    const timeSinceLastFailure = Date.now() - this.lastFailure
    return (
      this.failures >= this.threshold &&
      timeSinceLastFailure < this.resetTimeout
    )
  }

  recordFailure(): void {
    this.failures++
    this.lastFailure = Date.now()
  }

  reset(): void {
    this.failures = 0
    this.lastFailure = null
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open')
    }
    try {
      const result = await operation()
      this.reset()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}

// Health service
export class HealthService {
  private static instance: HealthService
  private circuitBreaker: CircuitBreaker
  private healthCheckInterval: NodeJS.Timeout | null = null
  private poolMaintenanceInterval: NodeJS.Timeout | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private metrics = {
    connectionAttempts: 0,
    successfulConnections: 0,
    failedConnections: 0,
    lastConnectionTime: null as number | null,
    totalConnectionTime: 0,
    queryStats: {
      total: 0,
      slow: 0,
      errors: 0,
      averageTime: 0,
      totalTime: 0,
      byOperation: new Map<
        string,
        { count: number; totalTime: number; errors: number }
      >(),
      recentQueries: [] as Array<{
        operation: string
        duration: number
        timestamp: number
        error?: string
      }>,
      performance: {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        lastUpdate: 0,
      },
    },
    health: {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      lastCheck: Date.now(),
      issues: [] as Array<{
        type: string
        message: string
        timestamp: number
        severity: 'low' | 'medium' | 'high'
      }>,
      indicators: {
        connectionSuccessRate: 100,
        querySuccessRate: 100,
        averageResponseTime: 0,
        errorRate: 0,
        lastUpdate: Date.now(),
      },
    },
  }

  private constructor() {
    this.circuitBreaker = new CircuitBreaker()
  }

  public static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService()
    }
    return HealthService.instance
  }

  public async checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: any
  }> {
    try {
      const db = mongoose.connection
      const isConnected = db.readyState === 1

      // Get pool stats
      const poolStats = await this.getPoolStats()

      // Update health status based on various factors
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
      const issues: Array<{
        type: string
        message: string
        timestamp: number
        severity: 'low' | 'medium' | 'high'
      }> = []

      // Check connection state
      if (!isConnected) {
        status = 'unhealthy'
        issues.push({
          type: 'connection',
          message: 'Database is not connected',
          timestamp: Date.now(),
          severity: 'high',
        })
      }

      // Check pool availability
      if (poolStats.available < config.mongodb.options.minPoolSize) {
        status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
        issues.push({
          type: 'pool',
          message: `Low connection pool availability: ${poolStats.available}/${config.mongodb.options.minPoolSize}`,
          timestamp: Date.now(),
          severity: 'medium',
        })
      }

      // Check error rate
      const errorRate =
        (this.metrics.queryStats.errors /
          (this.metrics.queryStats.total || 1)) *
        100
      if (errorRate > 10) {
        status = status === 'unhealthy' ? 'unhealthy' : 'degraded'
        issues.push({
          type: 'errors',
          message: `High error rate: ${errorRate.toFixed(2)}%`,
          timestamp: Date.now(),
          severity: 'high',
        })
      }

      // Update health metrics
      this.metrics.health = {
        status,
        lastCheck: Date.now(),
        issues,
        indicators: {
          connectionSuccessRate:
            (this.metrics.successfulConnections /
              (this.metrics.connectionAttempts || 1)) *
            100,
          querySuccessRate:
            ((this.metrics.queryStats.total - this.metrics.queryStats.errors) /
              (this.metrics.queryStats.total || 1)) *
            100,
          averageResponseTime: this.metrics.queryStats.averageTime,
          errorRate,
          lastUpdate: Date.now(),
        },
      }

      return {
        status,
        metrics: {
          ...this.metrics,
          pool: poolStats,
        },
      }
    } catch (error) {
      logger.error(`Health check failed: ${error}`)
      return {
        status: 'unhealthy',
        metrics: {
          ...this.metrics,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  public async getPoolStats(): Promise<{
    size: number
    available: number
    pending: number
    timestamp: number
  }> {
    try {
      if (!mongoose.connection.db) {
        return {
          size: 0,
          available: 0,
          pending: 0,
          timestamp: Date.now(),
        }
      }

      const stats = await mongoose.connection.db.admin().serverStatus()
      return {
        size: stats.connections?.current || 0,
        available: stats.connections?.available || 0,
        pending: stats.connections?.pending || 0,
        timestamp: Date.now(),
      }
    } catch (error) {
      logger.error(`Failed to get pool stats: ${error}`)
      return {
        size: 0,
        available: 0,
        pending: 0,
        timestamp: Date.now(),
      }
    }
  }

  public startMonitoring(interval: number = 30000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const health = await this.checkDatabaseHealth()
        if (health.status !== 'healthy') {
          logger.warn(`Database health check: ${health.status}`, {
            issues: health.metrics.health.issues,
            indicators: health.metrics.health.indicators,
          })
        }
      } catch (error) {
        logger.error(`Health monitoring failed: ${error}`)
      }
    }, interval)

    logger.info(`Health monitoring started (interval: ${interval}ms)`)
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      logger.info('Health monitoring stopped')
    }
  }

  // Expose circuit breaker reset for external control
  public resetCircuitBreaker(): void {
    this.circuitBreaker.reset()
    logger.info('Circuit breaker has been reset')
  }

  public async attemptRecovery(): Promise<boolean> {
    logger.info('Attempting service recovery')
    try {
      // 1. Disconnect and clear pool
      await mongoose.disconnect()
      logger.info('Disconnected from database')

      // 2. Wait for connections to close
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 3. Reconnect with fresh pool
      await mongoose.connect(process.env.MONGODB_URI!, {
        ...config.mongodb.options,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
      })

      // 4. Verify connection
      const db = mongoose.connection
      if (db.readyState === 1) {
        logger.info('Database reconnected successfully')
        return true
      }

      logger.error('Database reconnection failed')
      return false
    } catch (error) {
      logger.error(`Recovery failed: ${error}`)
      return false
    }
  }

  async adjustPoolSize(): Promise<void> {
    try {
      const currentStats = await this.getPoolStats()
      if (currentStats.available < config.mongodb.options.minPoolSize) {
        logger.info('Adjusting pool size')
        await mongoose.disconnect()
        await mongoose.connect(process.env.MONGODB_URI!, {
          ...config.mongodb.options,
          minPoolSize: Math.max(
            config.mongodb.options.minPoolSize,
            currentStats.size + 5
          ),
        })
      }
    } catch (error) {
      logger.error(`Failed to adjust pool size: ${error}`)
    }
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await operation()
        } catch (error) {
          if (i === maxRetries - 1) throw error
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, i) * 1000)
          )
        }
      }
      throw new Error('Max retries exceeded')
    })
  }
}
