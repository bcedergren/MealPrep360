const express = require('express')
const pino = require('pino')
const planningRoutes = require('./routes/planning')

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
const app = express()
app.use(express.json())

// request logging + latency
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const latency = Date.now() - start
    logger.info(
      { method: req.method, path: req.path, status: res.statusCode, latency },
      'request'
    )
  })
  next()
})

// Clerk JWT middleware
const { jwtMiddleware } = require('./auth')

// Health check
app.get('/healthz', (req, res) => res.status(200).send('ok'))

// Protect planning endpoints
app.use('/planning', jwtMiddleware, planningRoutes)

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaughtException')
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'unhandledRejection')
  process.exit(1)
})

const port = process.env.PORT || 4010
app.listen(port, () => logger.info({ port }, 'planning-service listening'))
