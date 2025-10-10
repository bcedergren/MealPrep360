const express = require('express')
const pino = require('pino')
const contentRoutes = require('./routes/content')

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
const app = express()
app.use(express.json())

// request logging with latency
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

// Basic JWT verification stub (replace with Clerk verification)
async function verifyJwt(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  return { sub: 'stub-user', issuer: process.env.JWT_ISSUER || 'stub-issuer' }
}

async function jwtMiddleware(req, res, next) {
  const auth = req.get('Authorization') || ''
  const match = auth.match(/^Bearer (.+)$/i)
  if (!match) {
    return res.status(401).json({ ok: false, error: 'missing_authorization' })
  }
  try {
    const token = match[1]
    const payload = await verifyJwt(token)
    if (!payload)
      return res.status(401).json({ ok: false, error: 'invalid_token' })
    req.user = payload
    next()
  } catch (err) {
    logger.warn({ err }, 'jwt verification error')
    return res.status(401).json({ ok: false, error: 'invalid_token' })
  }
}

// health
app.get('/healthz', (req, res) => res.status(200).send('ok'))

// routes (protected)
app.use('/content', jwtMiddleware, contentRoutes)

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaughtException')
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'unhandledRejection')
  process.exit(1)
})

const port = process.env.PORT || 4020
app.listen(port, () => logger.info({ port }, 'content-service listening'))
