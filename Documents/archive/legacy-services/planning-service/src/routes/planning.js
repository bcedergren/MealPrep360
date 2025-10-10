const express = require('express')
const router = express.Router()

// POST /planning/plan
router.post('/plan', async (req, res) => {
  const user = req.user || { sub: 'unknown' }
  const { meals = [], date } = req.body || {}
  if (!Array.isArray(meals) || meals.length === 0) {
    return res.status(400).json({ ok: false, error: 'invalid_meals' })
  }

  const planId = `plan-${Date.now()}`
  const summary = `Stub plan for ${meals.length} meals`

  return res.status(200).json({
    ok: true,
    planId,
    createdBy: user.sub,
    date: date || null,
    summary,
    meals: meals.map((m, i) => ({ id: `m-${i + 1}`, ...m })),
  })
})

// POST /planning/smart-list
router.post('/smart-list', async (req, res) => {
  const { items = [], preferences = {} } = req.body || {}

  const listId = `list-${Date.now()}`
  const cannedItems = [
    { sku: 'APPLE', qty: 4 },
    { sku: 'CHICKEN_BREAST', qty: 2 },
    { sku: 'RICE_2LB', qty: 1 },
  ]

  const merged =
    Array.isArray(items) && items.length
      ? items.concat(cannedItems)
      : cannedItems

  return res.status(200).json({
    ok: true,
    listId,
    items: merged,
    note: 'This is a stubbed smart list. Implement optimizer integration for production.',
  })
})

module.exports = router
