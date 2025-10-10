const express = require('express')
const pino = require('pino')
const rateLimit = require('express-rate-limit')
const { createProxyMiddleware } = require('http-proxy-middleware')

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

// simple rate limiting for hot endpoints
const hotLimiter = rateLimit({
  windowMs: 60_000, // 1 minute
  max: parseInt(process.env.HOT_RATE_LIMIT || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
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
  const token = match[1]
  const payload = await verifyJwt(token)
  if (!payload)
    return res.status(401).json({ ok: false, error: 'invalid_token' })
  req.user = payload
  next()
}

// health
app.get('/healthz', (req, res) => res.status(200).send('ok'))

// Proxy configuration (env-overridable)
const PLANNING_TARGET = process.env.PLANNING_URL || 'http://localhost:4010'
const CONTENT_TARGET = process.env.CONTENT_URL || 'http://localhost:4020'

// Proxy planning endpoints (forward /planning/* to planning service)
app.use(
  '/planning',
  jwtMiddleware,
  createProxyMiddleware({
    target: PLANNING_TARGET,
    changeOrigin: true,
    proxyTimeout: parseInt(process.env.PLANNING_PROXY_TIMEOUT || '5000', 10),
    timeout: parseInt(process.env.PLANNING_PROXY_TIMEOUT || '5000', 10),
    onError(err, req, res) {
      logger.error({ err }, 'planning proxy error')
      res.status(502).json({ ok: false, error: 'bad_gateway' })
    },
  })
)

// Proxy content endpoints
app.use(
  '/content',
  jwtMiddleware,
  createProxyMiddleware({
    target: CONTENT_TARGET,
    changeOrigin: true,
    proxyTimeout: parseInt(process.env.CONTENT_PROXY_TIMEOUT || '5000', 10),
    timeout: parseInt(process.env.CONTENT_PROXY_TIMEOUT || '5000', 10),
    onError(err, req, res) {
      logger.error({ err }, 'content proxy error')
      res.status(502).json({ ok: false, error: 'bad_gateway' })
    },
  })
)

// Stubs for not-yet-implemented services (protected + rate-limited)
app.post('/optimizer/cart', jwtMiddleware, hotLimiter, (req, res) => {
  // minimal canned response
  return res
    .status(200)
    .json({ ok: true, cartId: 'stub-cart-1', note: 'optimizer stub' })
})
app.post('/labels/print', jwtMiddleware, hotLimiter, (req, res) => {
  return res
    .status(200)
    .json({ ok: true, printJobId: 'stub-print-1', note: 'label stub' })
})
app.post('/freezer/scan', jwtMiddleware, hotLimiter, (req, res) => {
  return res
    .status(200)
    .json({ ok: true, scanId: 'stub-scan-1', note: 'freezer stub' })
})

// fallback
app.use((req, res) => res.status(404).json({ ok: false, error: 'not_found' }))

// Catch unhandled errors
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'uncaughtException')
  process.exit(1)
})
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason }, 'unhandledRejection')
  process.exit(1)
})

const port = process.env.PORT || 4000
app.listen(port, () => logger.info({ port }, 'api-gateway listening'))
