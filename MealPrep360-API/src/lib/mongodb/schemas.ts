import mongoose, { Schema, model, models, connect, Document } from 'mongoose'
import connectDB from './connection'

// Define all schemas first
const userSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: String,
  role: { type: String, default: 'USER' },
  image: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  settings: {
    theme: {
      mode: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'light',
      },
      contrast: { type: Boolean, default: false },
      animations: { type: Boolean, default: true },
    },
    display: {
      recipeLayout: {
        type: String,
        enum: ['grid', 'list'],
        default: 'grid',
      },
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium',
      },
      imageQuality: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
      },
    },
    language: {
      preferred: { type: String, enum: ['en', 'es'], default: 'en' },
      measurementSystem: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric',
      },
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      mealPlanReminders: { type: Boolean, default: true },
      shoppingListReminders: { type: Boolean, default: true },
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '08:00' },
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'private',
      },
      shareRecipes: { type: Boolean, default: false },
      showCookingHistory: { type: Boolean, default: false },
    },
    security: {
      twoFactorAuth: { type: Boolean, default: false },
    },
    mealPlanning: {
      weeklyPlanningEnabled: { type: Boolean, default: true },
      shoppingListEnabled: { type: Boolean, default: true },
      nutritionTrackingEnabled: { type: Boolean, default: true },
      defaultDuration: { type: String, default: '14' },
      defaultServings: { type: Number, default: 4 },
    },
    integrations: {
      calendar: {
        type: String,
        enum: ['none', 'google', 'outlook', 'apple'],
        default: 'none',
      },
      shoppingList: {
        type: String,
        enum: ['none', 'anylist', 'walmart', 'amazon'],
        default: 'none',
      },
    },
    preferences: {
      dietaryPreferences: { type: [String], default: [] },
      allergies: { type: [String], default: [] },
      cookingSkill: { type: String, default: 'Intermediate' },
      cookingTime: { type: String, default: 'Moderate (30-60 min)' },
      cuisines: { type: [String], default: [] },
      kidFriendly: { type: Boolean, default: false },
      quickMeals: { type: Boolean, default: false },
      healthy: { type: Boolean, default: false },
    },
    onboarding: {
      tutorialCompleted: { type: Boolean, default: false },
    },
  },
  pushSubscription: { type: Schema.Types.Mixed },
  calendarIntegration: { type: Schema.Types.Mixed },
  shoppingListIntegration: { type: Schema.Types.Mixed },
  twoFactorAuth: { type: Schema.Types.Mixed },
  subscription: { type: Schema.Types.Mixed },
})

const recipeSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  ingredients: [Schema.Types.Mixed],
  instructions: [String],
  prepTime: Number,
  cookTime: Number,
  servings: Number,
  imageUrl: String,
  imageBase64: String,
  clerkId: { type: String, required: true },
  spoonacularId: String,
  defrostInstructions: String,
  freezerPrep: String,
  containerSuggestions: String,
  cookingInstructions: String,
  servingInstructions: String,
  storageTime: String,
  prepInstructions: String,
  hasImage: { type: Boolean, default: false },
  season: String,
  isPublic: { type: Boolean, default: false },
  isPlaceholder: { type: Boolean, default: false },
  analysis: Schema.Types.Mixed,
  originalLanguage: { type: String, default: 'en' },
  category: String,
  cuisine: String,
  summary: String,
  difficulty: String,
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    default: 'dinner',
  },
  tags: [String],
  allergenInfo: [String],
  dietaryInfo: [String],
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Add indexes for recipe queries
recipeSchema.index({ clerkId: 1, isPublic: 1, createdAt: -1 })
recipeSchema.index({ isPublic: 1, createdAt: -1 })
recipeSchema.index({ _id: 1, title: 1, imageUrl: 1, prepTime: 1, servings: 1 }) // Covering index for meal plan populates

const userRecipeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  savedRecipes: [
    {
      recipeId: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true,
      },
      savedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const recipeGenerationStatusSchema = new Schema({
  status: { type: String, required: true },
  progress: { type: Number, default: 0 },
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  error: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const rawRecipeDataSchema = new Schema({
  season: { type: String, required: true },
  data: [Schema.Types.Mixed],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const mealPlanSchema = new Schema({
  id: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: [
    {
      date: {
        type: Date,
        required: true,
        validate: {
          validator: function (value: Date) {
            return value instanceof Date && !isNaN(value.getTime())
          },
          message: 'Invalid date value',
        },
      },
      recipeId: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe',
        required: false,
      },
      recipe: {
        type: Schema.Types.Mixed,
        default: null,
      },
      mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
        default: 'dinner',
      },
      status: {
        type: String,
        enum: ['planned', 'cooked', 'frozen', 'consumed', 'skipped'],
        default: 'planned',
      },
      serviceStatus: {
        type: String,
        enum: ['planned', 'completed', 'skipped'],
        default: 'planned',
      },
      dayIndex: { type: Number, required: true },
    },
  ],
  recipes: [{ type: Schema.Types.ObjectId, ref: 'Recipe' }],
  recipeItems: [
    {
      date: {
        type: Date,
        required: true,
        validate: {
          validator: function (value: Date) {
            return value instanceof Date && !isNaN(value.getTime())
          },
          message: 'Invalid date value',
        },
      },
      recipeId: {
        type: Schema.Types.ObjectId,
        ref: 'Recipe',
        required: false, // Allow null for skipped days
      },
      recipe: {
        type: Schema.Types.Mixed,
        default: null,
      },
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      servings: { type: Number, default: 1 },
      status: {
        type: String,
        enum: ['planned', 'cooked', 'frozen', 'consumed', 'skipped'],
        default: 'planned',
      },
      mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
        default: 'dinner',
      },
      dayIndex: { type: Number, required: true },
    },
  ],
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Add pre-save middleware to ensure dates are valid
mealPlanSchema.pre('save', function (next) {
  // Validate startDate and endDate
  if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
    next(new Error('Invalid startDate'))
    return
  }
  if (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime())) {
    next(new Error('Invalid endDate'))
    return
  }

  // Validate dates in days array
  if (this.days) {
    for (const day of this.days) {
      if (!(day.date instanceof Date) || isNaN(day.date.getTime())) {
        next(new Error(`Invalid date in day at index ${day.dayIndex}`))
        return
      }
    }
  }

  // Validate dates in recipeItems array
  if (this.recipeItems) {
    for (const item of this.recipeItems) {
      if (!(item.date instanceof Date) || isNaN(item.date.getTime())) {
        next(new Error('Invalid date in recipeItem'))
        return
      }
    }
  }

  next()
})

// Add indexes for better query performance
mealPlanSchema.index({ userId: 1, startDate: -1, endDate: -1 })
mealPlanSchema.index({ userId: 1, startDate: 1 })
mealPlanSchema.index({ userId: 1, endDate: 1 })

const shoppingListSchema = new Schema({
  name: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'ACTIVE' },
  startDate: Date,
  endDate: Date,
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, required: true },
      category: { type: String, required: true },
      status: { type: String, default: 'PENDING' },
      additionalQuantities: Schema.Types.Mixed,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const blogPostSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'DRAFT' },
  tags: [String],
  categories: [String],
  comments: [
    {
      content: String,
      authorId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  likes: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const newsletterSubscriberSchema = new Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now },
})

const notificationSchema = new Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  userId: { type: String, required: true },
  status: { type: String, default: 'sent' },
  data: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const feedbackSchema = new Schema({
  rating: { type: Number, required: true, min: 1, max: 5 },
  feedback: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const twoFactorAuthSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  secret: { type: String, required: true },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const jobQueueSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['recipe_generation', 'image_generation'],
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'failed'],
    default: 'pending',
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  },
  result: {
    type: Schema.Types.Mixed,
  },
  error: {
    type: String,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

const userSettingsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  settings: Schema.Types.Mixed,
})

const imageReportSchema = new Schema({
  recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: String,
  status: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const recipeReportSchema = new Schema({
  recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: String,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const subscriptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  stripeCustomerId: { type: String, unique: true, sparse: true },
  stripePriceId: String,
  stripeSubscriptionId: { type: String, unique: true, sparse: true },
  status: { type: String, default: 'INACTIVE' },
  plan: { type: String, default: 'FREE' },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const systemSettingsSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
})

const blogCommentSchema = new Schema({
  content: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'BlogComment' },
  replies: [{ type: Schema.Types.ObjectId, ref: 'BlogComment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const skippedDaySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // Store as UTC midnight
  status: {
    type: String,
    enum: ['skipped'],
    default: 'skipped',
  },
  createdAt: { type: Date, default: Date.now },
})

// Add index for skipped days queries
skippedDaySchema.index({ userId: 1, date: 1 })
skippedDaySchema.index({ userId: 1, date: -1 })

const adminUserSchema = new Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'moderator'],
    default: 'moderator',
  },
  permissions: {
    canManageUsers: {
      type: Boolean,
      default: false,
    },
    canModerateContent: {
      type: Boolean,
      default: true,
    },
    canViewAnalytics: {
      type: Boolean,
      default: false,
    },
    canManageSystem: {
      type: Boolean,
      default: false,
    },
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

adminUserSchema.methods.hasPermission = function (perm: string) {
  return this.permissions && this.permissions[perm] === true
}

adminUserSchema.methods.updateLastLogin = async function () {
  this.lastLogin = new Date()
  await this.save()
}

const jobSchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  status: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  result: { type: Schema.Types.Mixed },
  error: { type: String },
  attempts: { type: Number, required: true, default: 0 },
  maxAttempts: { type: Number, required: true, default: 3 },
  startedAt: { type: Date },
  completedAt: { type: Date },
  progress: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// Export models
export const User = mongoose.models.User || model('User', userSchema)
export const Recipe = model('Recipe', recipeSchema, 'recipes')
export const UserRecipe =
  mongoose.models.UserRecipe || model('UserRecipe', userRecipeSchema)
export const RecipeGenerationStatus =
  mongoose.models.RecipeGenerationStatus ||
  model('RecipeGenerationStatus', recipeGenerationStatusSchema)
export const RawRecipeData =
  mongoose.models.RawRecipeData || model('RawRecipeData', rawRecipeDataSchema)
export const MealPlan =
  mongoose.models.MealPlan || model('MealPlan', mealPlanSchema)
export const ShoppingList =
  mongoose.models.ShoppingList || model('ShoppingList', shoppingListSchema)
export const BlogPost =
  mongoose.models.BlogPost || model('BlogPost', blogPostSchema)
export const NewsletterSubscriber =
  mongoose.models.NewsletterSubscriber ||
  model('NewsletterSubscriber', newsletterSubscriberSchema)
export const Notification =
  mongoose.models.Notification || model('Notification', notificationSchema)
export const Feedback =
  mongoose.models.Feedback || model('Feedback', feedbackSchema)
export const TwoFactorAuth =
  mongoose.models.TwoFactorAuth || model('TwoFactorAuth', twoFactorAuthSchema)
export const JobQueue =
  mongoose.models.JobQueue || model('JobQueue', jobQueueSchema)
export const UserSettings =
  mongoose.models.UserSettings || model('UserSettings', userSettingsSchema)
export const ImageReport =
  mongoose.models.ImageReport || model('ImageReport', imageReportSchema)
export const RecipeReport =
  mongoose.models.RecipeReport || model('RecipeReport', recipeReportSchema)
export const Subscription =
  mongoose.models.Subscription || model('Subscription', subscriptionSchema)
export const SystemSettings =
  mongoose.models.SystemSettings ||
  model('SystemSettings', systemSettingsSchema)
export const BlogComment =
  mongoose.models.BlogComment || model('BlogComment', blogCommentSchema)
export const SkippedDay =
  mongoose.models.SkippedDay || model('SkippedDay', skippedDaySchema)
export const AdminUser =
  mongoose.models.AdminUser || model('AdminUser', adminUserSchema)
export const Job = mongoose.models.Job || model('Job', jobSchema)

// Initialize models function
export const initializeModels = async () => {
  try {
    await connectDB()
    return {
      User,
      Recipe,
      UserRecipe,
      RecipeGenerationStatus,
      RawRecipeData,
      MealPlan,
      ShoppingList,
    }
  } catch (error) {
    console.error('[MONGODB] Error initializing models:', error)
    throw error
  }
}
