const pino = require('pino')
const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

// Simple in-memory worker that processes jobs from index.js route store.
// NOTE: In production move jobs to durable queue (Redis/RabbitMQ) and share store.

// This file expects to run in same process space only for local dev; if you run separately,
// it will not see the in-memory jobs defined by the HTTP server. Use only as a local demo.
logger.info('content-worker starting (demo-only)')

// Demo: simulate periodic work log
setInterval(() => {
  logger.info('worker heartbeat - no-op (demo-only)')
}, 30_000)

process.on('SIGINT', () => {
  logger.info('worker stopping')
  process.exit(0)
})
