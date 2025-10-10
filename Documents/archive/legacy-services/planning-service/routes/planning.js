const express = require('express')
const router = express.Router()

// POST /planning/plan

router.post('/plan', (req, res) => {
  const { meals } = req.body
  if (!meals || !Array.isArray(meals) || meals.length === 0) {
    return res.status(400).json({ ok: false, error: 'invalid_meals' })
  }
  // Stub response
  res.json({ ok: true, planId: 'stub-plan-1', plan: meals })
})

router.post('/smart-list', (req, res) => {
  // Stub response
  res.json({ ok: true, listId: 'stub-list-1', items: [] })
})

module.exports = router
