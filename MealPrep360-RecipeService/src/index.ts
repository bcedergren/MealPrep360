import express, { Request, Response, NextFunction } from 'express'
import { connectToDatabase, disconnectFromDatabase } from './utils/db.js'
import { registerServices, getService } from './container/serviceRegistry.js'
import { ILogger } from './services/interfaces/ILogger'
import { IHealthService } from './services/interfaces/IHealthService'
import { IRecipeService } from './services/interfaces/IRecipeService'
import { IJobService } from './services/interfaces/IJobService'
import { IQueueService } from './services/interfaces/IQueueService'
import { config } from './config'

const app = express()
const port = process.env.PORT || 3000

// Initialize dependency injection container
registerServices()

// Get service instances
const logger = getService<ILogger>('ILogger')
const healthService = getService<IHealthService>('IHealthService')
const recipeService = getService<IRecipeService>('IRecipeService')
const jobService = getService<IJobService>('IJobService')
const queueService = getService<IQueueService>('IQueueService')

// Add middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Lightweight unauthenticated health endpoint for container health checks
// Placed before auth/DB middlewares so it always works
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API key authentication middleware
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or missing API key',
    })
  }
  next()
})

// Database connection middleware
app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectToDatabase()
    next()
  } catch (error) {
    logger.error(
      'Database connection error:',
      error instanceof Error ? error : new Error(String(error))
    )
    res.status(500).json({
      status: 'error',
      message: 'Database connection error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header(
    'Access-Control-Allow-Headers',
    'X-Requested-With, Content-Type, Accept, x-api-key'
  )
  next()
})

// Health check endpoint (authenticated, richer details)
app.get('/api/health', async (req, res) => {
  try {
    const health = await healthService.checkHealth()
    res.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      details: health.details,
    })
  } catch (error) {
    logger.error(
      'Health check failed:',
      error instanceof Error ? error : new Error(String(error))
    )
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
  }
})

// Recipe generation endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { season } = req.body
    if (!season) {
      return res.status(400).json({
        status: 'error',
        message: 'Season is required',
      })
    }

    const job = await jobService.createJob('recipe-generation', { season })
    await queueService.enqueue('jobs', { jobId: job.id, season })

    res.json({
      status: 'accepted',
      message: 'Recipe generation started',
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        total: job.total,
        season,
        createdAt: job.createdAt,
      },
    })
  } catch (error) {
    logger.error(
      'Error in recipe generation:',
      error instanceof Error ? error : new Error(String(error))
    )
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Job status endpoint
app.get('/api/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params
    const job = await jobService.getJob(jobId)

    if (!job) {
      return res.status(404).json({
        status: 'error',
        message: 'Job not found',
      })
    }

    res.json({
      status: 'success',
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        total: job.total,
        data: job.data,
        error: job.error,
        attempts: job.attempts,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      },
    })
  } catch (error) {
    logger.error(
      'Failed to get job status:',
      error instanceof Error ? error : new Error(String(error))
    )
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Initialize the application
async function initialize() {
  try {
    logger.info('Initializing Recipe Service...', {
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    })

    // Connect to database
    await connectToDatabase()
    logger.info('Connected to database successfully')

    // Start health monitoring
    healthService.startMonitoring()

    // Start the server
    app.listen(port, () => {
      logger.info(`Recipe Service listening on port ${port}`, {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
      })
    })
  } catch (error) {
    logger.error(
      'Failed to initialize Recipe Service:',
      error instanceof Error ? error : new Error(String(error))
    )
    process.exit(1)
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down...')
  healthService.stopMonitoring()
  await disconnectFromDatabase()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down...')
  healthService.stopMonitoring()
  await disconnectFromDatabase()
  process.exit(0)
})

// Start the application
initialize()

// Export the Express app for Vercel
export default app
