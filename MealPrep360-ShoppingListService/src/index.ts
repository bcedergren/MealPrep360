import express from 'express'
import cors from 'cors'
import { z } from 'zod'
import { connectToDatabase } from './utils/database'
import { Recipe } from './models/Recipe'
import { ShoppingList } from './models/ShoppingList'
import { generateShoppingList } from './services/shoppingListService'
import { ShoppingListRequestSchema } from './types'
import { MealPlanModel } from './models/MealPlan'

const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Key validation middleware
const API_KEY =
  process.env.API_KEY ||
  (process.env.NODE_ENV === 'development' ? 'dev-key' : undefined)
if (!API_KEY && process.env.NODE_ENV !== 'development') {
  console.warn('Warning: API_KEY environment variable is not set')
}

const validateApiKey = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  // Skip API key validation in development mode
  if (process.env.NODE_ENV === 'development') {
    return next()
  }

  const apiKey = req.headers['x-api-key']
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' })
  }
  next()
}

// Dashboard endpoint
app.get('/', async (req, res) => {
  try {
    const connection = await connectToDatabase()
    const dbStatus =
      connection.connection.readyState === 1 ? 'connected' : 'disconnected'
    const uptime = process.uptime()
    const memory = process.memoryUsage()

    // Get counts from database
    const recipeCount = await Recipe.countDocuments()
    const shoppingListCount = await ShoppingList.countDocuments()

    // Format uptime
    const formatUptime = (seconds: number) => {
      const days = Math.floor(seconds / 86400)
      const hours = Math.floor((seconds % 86400) / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const remainingSeconds = Math.floor(seconds % 60)
      return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`
    }

    // Format memory usage
    const formatMemory = (bytes: number) => {
      const mb = bytes / 1024 / 1024
      return `${mb.toFixed(2)} MB`
    }

    const html = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>MealPrep360 Shopping List Service Dashboard</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						max-width: 800px;
						margin: 0 auto;
						padding: 20px;
						background-color: #f5f5f5;
					}
					.dashboard {
						background-color: white;
						border-radius: 8px;
						padding: 20px;
						box-shadow: 0 2px 4px rgba(0,0,0,0.1);
					}
					.status {
						display: inline-block;
						padding: 4px 8px;
						border-radius: 4px;
						font-weight: bold;
						margin-left: 8px;
					}
					.connected {
						background-color: #4caf50;
						color: white;
					}
					.disconnected {
						background-color: #f44336;
						color: white;
					}
					.section {
						margin: 20px 0;
						padding: 15px;
						background-color: #f8f9fa;
						border-radius: 4px;
					}
					.metric {
						display: flex;
						justify-content: space-between;
						margin: 10px 0;
					}
					.metric-label {
						font-weight: bold;
					}
					h1 {
						color: #333;
						margin-bottom: 30px;
					}
					h2 {
						color: #666;
						margin-top: 0;
					}
				</style>
			</head>
			<body>
				<div class="dashboard">
					<h1>MealPrep360 Shopping List Service</h1>
					
					<div class="section">
						<h2>Service Status</h2>
						<div class="metric">
							<span class="metric-label">Database:</span>
							<span class="status ${
                dbStatus === 'connected' ? 'connected' : 'disconnected'
              }">${dbStatus}</span>
						</div>
						<div class="metric">
							<span class="metric-label">Uptime:</span>
							<span>${formatUptime(uptime)}</span>
						</div>
					</div>

					<div class="section">
						<h2>Resource Usage</h2>
						<div class="metric">
							<span class="metric-label">Memory Usage (RSS):</span>
							<span>${formatMemory(memory.rss)}</span>
						</div>
						<div class="metric">
							<span class="metric-label">Heap Total:</span>
							<span>${formatMemory(memory.heapTotal)}</span>
						</div>
						<div class="metric">
							<span class="metric-label">Heap Used:</span>
							<span>${formatMemory(memory.heapUsed)}</span>
						</div>
					</div>

					<div class="section">
						<h2>Database Statistics</h2>
						<div class="metric">
							<span class="metric-label">Total Recipes:</span>
							<span>${recipeCount}</span>
						</div>
						<div class="metric">
							<span class="metric-label">Total Shopping Lists:</span>
							<span>${shoppingListCount}</span>
						</div>
					</div>

					<div class="section">
						<h2>Environment</h2>
						<div class="metric">
							<span class="metric-label">Node Environment:</span>
							<span>${process.env.NODE_ENV || 'development'}</span>
						</div>
						<div class="metric">
							<span class="metric-label">Node Version:</span>
							<span>${process.version}</span>
						</div>
					</div>
				</div>
			</body>
			</html>
		`

    res.send(html)
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).send(`
			<!DOCTYPE html>
			<html>
			<head>
				<title>Error - MealPrep360 Shopping List Service</title>
				<style>
					body {
						font-family: Arial, sans-serif;
						max-width: 800px;
						margin: 0 auto;
						padding: 20px;
						background-color: #f5f5f5;
					}
					.error {
						background-color: white;
						border-radius: 8px;
						padding: 20px;
						box-shadow: 0 2px 4px rgba(0,0,0,0.1);
						color: #f44336;
					}
				</style>
			</head>
			<body>
				<div class="error">
					<h1>Error</h1>
					<p>Failed to load dashboard: ${
            error instanceof Error ? error.message : 'Unknown error'
          }</p>
				</div>
			</body>
			</html>
		`)
  }
})

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const connection = await connectToDatabase()
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status:
            connection.connection.readyState === 1
              ? 'connected'
              : 'disconnected',
          message:
            connection.connection.readyState === 1
              ? 'MongoDB is connected'
              : 'MongoDB is not connected',
          readyState: connection.connection.readyState,
        },
        server: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeEnv: process.env.NODE_ENV,
        },
      },
    }

    if (connection.connection.readyState !== 1) {
      return res.status(503).json(health)
    }

    res.json(health)
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'unhealthy',
      error: 'Internal server error during health check',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Protected API routes
app.use('/api', validateApiKey)

// Generate shopping list endpoint
app.post('/api/shopping-list', async (req, res) => {
  try {
    console.log('Request body:', req.body)

    // Get user ID from auth header
    const userId = req.headers['x-user-id']
    console.log('User ID from header:', userId)

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        details: 'x-user-id header is missing',
      })
    }

    // Add userId to request body for validation
    const requestWithUserId = { ...req.body, userId }

    // Validate request body
    const validatedData = ShoppingListRequestSchema.parse(requestWithUserId)
    const { mealPlanId, recipeIds, recipes, pantryExclusions } = validatedData

    // Try to connect to database (optional for testing)
    let dbConnected = false
    try {
      await connectToDatabase()
      dbConnected = true
      console.log('✅ Database connected successfully')
    } catch (dbError) {
      console.warn(
        '⚠️ Database connection failed, running in test mode:',
        dbError
      )
      dbConnected = false
    }

    let finalRecipeIds: string[]
    let mealPlanItems: { recipeId: string; servings: number }[] = []
    let recipeDocuments: any[] = []

    if (recipes && recipes.length > 0) {
      // Use recipes sent directly in request
      console.log('📋 Using recipes from request body')
      recipeDocuments = recipes
      finalRecipeIds = recipes.map((recipe) => recipe._id)
      mealPlanItems = recipes.map((recipe) => ({
        recipeId: recipe._id,
        servings: 1,
      }))
    } else if (mealPlanId && dbConnected) {
      // Fetch meal plan - handle both items and days formats
      const mealPlan = await MealPlanModel.findOne({ _id: mealPlanId, userId })
      if (!mealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' })
      }

      // Handle different meal plan structures
      if (mealPlan.items && mealPlan.items.length > 0) {
        // Traditional items format
        finalRecipeIds = mealPlan.items.map((item) => item.recipeId)
        mealPlanItems = mealPlan.items
      } else if (mealPlan.days && mealPlan.days.length > 0) {
        // Frontend days format - convert to items format
        const daysWithRecipes = mealPlan.days.filter((day) => day.recipeId)
        if (daysWithRecipes.length === 0) {
          return res
            .status(400)
            .json({ error: 'No recipes found in meal plan' })
        }

        finalRecipeIds = daysWithRecipes
          .map((day) => day.recipeId)
          .filter(
            (recipeId): recipeId is string =>
              recipeId !== null && recipeId !== undefined
          )

        mealPlanItems = daysWithRecipes
          .filter((day) => day.recipeId)
          .map((day) => ({
            recipeId: day.recipeId!,
            servings: day.servings || 1,
          }))
      } else {
        return res.status(400).json({ error: 'No recipes found in meal plan' })
      }

      // Fetch recipes from database
      const recipes = await Recipe.find({ _id: { $in: finalRecipeIds } })
      if (recipes.length === 0) {
        return res
          .status(404)
          .json({ error: 'No recipes found with the provided IDs' })
      }

      // Convert MongoDB documents to expected type
      recipeDocuments = recipes.map((recipe) => {
        const recipeObj = recipe.toObject()
        return {
          _id: recipeObj._id.toString(),
          title: recipeObj.title,
          ingredients: recipeObj.ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category,
          })),
        }
      })
    } else if (recipeIds && recipeIds.length > 0 && dbConnected) {
      finalRecipeIds = recipeIds
      mealPlanItems = recipeIds.map((recipeId) => ({ recipeId, servings: 1 }))

      // Fetch recipes from database
      const recipes = await Recipe.find({ _id: { $in: finalRecipeIds } })
      if (recipes.length === 0) {
        return res
          .status(404)
          .json({ error: 'No recipes found with the provided IDs' })
      }

      // Convert MongoDB documents to expected type
      recipeDocuments = recipes.map((recipe) => {
        const recipeObj = recipe.toObject()
        return {
          _id: recipeObj._id.toString(),
          title: recipeObj.title,
          ingredients: recipeObj.ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            category: ing.category,
          })),
        }
      })
    } else {
      return res.status(400).json({
        error: 'Either recipes, mealPlanId, or recipeIds must be provided',
        details: 'Database connection required for mealPlanId and recipeIds',
      })
    }

    // Generate shopping list using meal plan items
    const shoppingListItems = await generateShoppingList(
      recipeDocuments,
      mealPlanItems,
      pantryExclusions
    )

    // Create shopping list object
    const shoppingList = {
      userId,
      recipeIds: finalRecipeIds,
      items: shoppingListItems.map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        normalizedAmount: item.normalizedAmount,
        normalizedUnit: item.normalizedUnit,
      })),
      createdAt: new Date(),
    }

    // Save shopping list to database if connected
    if (dbConnected) {
      try {
        const shoppingListDoc = new ShoppingList(shoppingList)
        await shoppingListDoc.save()
        console.log('💾 Shopping list saved to database')
      } catch (saveError) {
        console.warn('⚠️ Failed to save shopping list to database:', saveError)
      }
    } else {
      console.log(
        '📝 Shopping list generated without database save (test mode)'
      )
    }

    // Return just the items array for simple consumption
    res.status(201).json(shoppingListItems)
  } catch (error) {
    console.error('Error creating shopping list:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Get meal plans endpoint
app.get('/api/meal-plans', async (req, res) => {
  try {
    console.log('Meal plans API request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
    })

    // Get user ID from auth header
    const userId = req.headers['x-user-id']
    console.log('User ID:', userId)

    if (!userId) {
      console.error('User ID not provided')
      return res.status(401).json({ error: 'User ID is required' })
    }

    if (typeof userId !== 'string' || userId.trim() === '') {
      console.error('Invalid user ID:', userId)
      return res.status(401).json({ error: 'Invalid user ID provided' })
    }

    // Get date range from query parameters
    const { startDate, endDate } = req.query
    console.log('Date range query:', { startDate, endDate })

    if (!startDate || !endDate) {
      console.error('Missing date range parameters')
      return res.status(400).json({
        error: 'startDate and endDate query parameters are required',
      })
    }

    // Validate date format
    const startDateObj = new Date(startDate as string)
    const endDateObj = new Date(endDate as string)

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      console.error('Invalid date format:', { startDate, endDate })
      return res.status(400).json({
        error:
          'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
      })
    }

    // Connect to database
    await connectToDatabase()

    // Build query filter
    const filter: any = { userId }

    // Add date range filter - if date fields don't exist in the database,
    // MongoDB will ignore those conditions and just filter by userId
    if (startDate && endDate) {
      filter.$or = [
        {
          startDate: { $gte: startDateObj, $lte: endDateObj },
        },
        {
          endDate: { $gte: startDateObj, $lte: endDateObj },
        },
        {
          startDate: { $lte: startDateObj },
          endDate: { $gte: endDateObj },
        },
      ]
    }

    console.log('Query filter:', JSON.stringify(filter, null, 2))

    // Fetch meal plans
    let mealPlans
    try {
      mealPlans = await MealPlanModel.find(filter).sort({ createdAt: -1 })
    } catch (error) {
      console.error('Failed to fetch meal plans:', error)
      return res.status(500).json({
        error: 'Failed to fetch meal plans from database',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    console.log('Fetched meal plans count:', mealPlans.length)

    // Transform meal plans for response
    const transformedMealPlans = mealPlans.map((mealPlan) => ({
      id: mealPlan._id.toString(),
      userId: mealPlan.userId,
      startDate: mealPlan.startDate || null,
      endDate: mealPlan.endDate || null,
      items: mealPlan.items.map((item) => ({
        recipeId: item.recipeId,
        servings: item.servings,
        dayOfWeek: item.dayOfWeek || null,
        mealType: item.mealType || null,
      })),
      createdAt: mealPlan.createdAt,
      updatedAt: mealPlan.updatedAt,
    }))

    console.log('Meal plans retrieved successfully:', {
      userId,
      mealPlanCount: transformedMealPlans.length,
      dateRange: { startDate, endDate },
    })

    res.status(200).json({
      message: 'Meal plans retrieved successfully',
      mealPlans: transformedMealPlans,
      count: transformedMealPlans.length,
    })
  } catch (error) {
    console.error('Error fetching meal plans:', error)

    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('ValidationError')) {
        return res.status(400).json({
          error: 'Validation error',
          details: error.message,
          suggestion: 'Please check the query parameters',
        })
      }
      if (error.message.includes('CastError')) {
        return res.status(400).json({
          error: 'Invalid data format',
          details: error.message,
          suggestion: 'Please check that all parameters are valid',
        })
      }
      if (
        error.message.includes('MongoError') ||
        error.message.includes('MongoServerError')
      ) {
        return res.status(500).json({
          error: 'Database error',
          details: error.message,
          suggestion: 'Please try again later',
        })
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Generate shopping list endpoint (new path)
app.post('/api/shopping-lists/generate', async (req, res) => {
  try {
    console.log('Shopping list generation request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
    })

    // Get user ID from auth header
    const userId = req.headers['x-user-id']
    console.log('User ID from header:', userId)

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        details: 'x-user-id header is missing',
      })
    }

    // Add userId to request body for validation
    const requestWithUserId = { ...req.body, userId }

    // Validate request body
    const validatedData = ShoppingListRequestSchema.parse(requestWithUserId)
    const { mealPlanId, recipeIds, pantryExclusions } = validatedData

    // Connect to database
    await connectToDatabase()

    let finalRecipeIds: string[]
    let mealPlanItems: { recipeId: string; servings: number }[] = []

    if (mealPlanId) {
      // Fetch meal plan
      const mealPlan = await MealPlanModel.findOne({ _id: mealPlanId, userId })
      if (!mealPlan) {
        return res.status(404).json({ error: 'Meal plan not found' })
      }
      finalRecipeIds = mealPlan.items.map((item) => item.recipeId)
      mealPlanItems = mealPlan.items
    } else if (recipeIds) {
      finalRecipeIds = recipeIds
      mealPlanItems = recipeIds.map((recipeId) => ({ recipeId, servings: 1 }))
    } else {
      return res
        .status(400)
        .json({ error: 'Either mealPlanId or recipeIds must be provided' })
    }

    // Fetch recipes
    const recipes = await Recipe.find({ _id: { $in: finalRecipeIds } })
    if (recipes.length === 0) {
      return res
        .status(404)
        .json({ error: 'No recipes found with the provided IDs' })
    }

    // Convert MongoDB documents to expected type
    const recipeDocuments = recipes.map((recipe) => {
      const recipeObj = recipe.toObject()
      return {
        _id: recipeObj._id.toString(),
        title: recipeObj.title,
        ingredients: recipeObj.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
        })),
      }
    })

    // Generate shopping list using meal plan items
    const shoppingListItems = await generateShoppingList(
      recipeDocuments,
      mealPlanItems,
      pantryExclusions
    )

    // Create shopping list document
    const shoppingList = new ShoppingList({
      userId,
      recipeIds: finalRecipeIds,
      items: shoppingListItems.map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        normalizedAmount: item.normalizedAmount,
        normalizedUnit: item.normalizedUnit,
      })),
      createdAt: new Date(),
    })

    // Save shopping list
    await shoppingList.save()

    res.status(201).json({
      message: 'Shopping list created successfully',
      shoppingList,
    })
  } catch (error) {
    console.error('Error creating shopping list:', error)
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

// Start server (always start, including production)
app.listen(port, () => {
  console.log(
    `Shopping List Service listening on port ${port} [env=${process.env.NODE_ENV}]`
  )
})

export default app
