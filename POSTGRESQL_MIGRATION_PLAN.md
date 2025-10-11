# PostgreSQL Migration Plan
## From MongoDB (DocumentDB) to PostgreSQL

**Date:** October 11, 2025  
**Status:** Planning Phase  
**Priority:** High

---

## 🎯 Migration Goals

### Why PostgreSQL?
1. **Relational Data Structure** - MealPrep360 has highly relational data (users, recipes, ingredients, meal plans, shopping lists)
2. **ACID Compliance** - Critical for financial/subscription data
3. **Complex Queries** - Better support for joins, aggregations, and reporting
4. **Cost Optimization** - RDS PostgreSQL is more cost-effective than DocumentDB for this use case
5. **Better TypeScript Support** - Prisma ORM provides excellent type safety

### Current State
- **MongoDB via DocumentDB** (AWS)
- **Mongoose** for ODM
- **9 microservices** with varying database dependencies
- **No production data** (clean migration)

---

## 📊 Database Schema Analysis

### Current Collections (MongoDB)

#### 1. **Users Collection**
```javascript
{
  _id: ObjectId,
  clerkId: String,
  email: String,
  name: String,
  subscription: {
    plan: String,
    status: String,
    stripeCustomerId: String
  },
  preferences: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Recipes Collection**
```javascript
{
  _id: ObjectId,
  title: String,
  ingredients: [{
    name: String,
    amount: Number,
    unit: String
  }],
  instructions: [String],
  nutrition: Object,
  tags: [String],
  author: ObjectId (ref: User),
  isPublic: Boolean,
  createdAt: Date
}
```

#### 3. **MealPlans Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  startDate: Date,
  endDate: Date,
  meals: [{
    day: String,
    mealType: String,
    recipeId: ObjectId
  }],
  createdAt: Date
}
```

#### 4. **ShoppingLists Collection**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  mealPlanId: ObjectId,
  items: [{
    ingredient: String,
    amount: Number,
    unit: String,
    checked: Boolean
  }],
  createdAt: Date
}
```

#### 5. **Posts Collection** (Social)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  content: String,
  recipeId: ObjectId,
  likes: [ObjectId],
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }],
  createdAt: Date
}
```

---

## 🗄️ Proposed PostgreSQL Schema

### Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT[], -- Array of steps
  prep_time INTEGER, -- in minutes
  cook_time INTEGER,
  servings INTEGER,
  is_public BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ingredients master table
CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100),
  default_unit VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recipe ingredients (many-to-many)
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2),
  unit VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(recipe_id, ingredient_id)
);

-- Nutrition facts
CREATE TABLE recipe_nutrition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  calories INTEGER,
  protein DECIMAL(10, 2),
  carbs DECIMAL(10, 2),
  fat DECIMAL(10, 2),
  fiber DECIMAL(10, 2),
  sugar DECIMAL(10, 2),
  sodium DECIMAL(10, 2),
  UNIQUE(recipe_id)
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50)
);

-- Recipe tags (many-to-many)
CREATE TABLE recipe_tags (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Meal plans
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meal plan items
CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 6=Saturday
  meal_type VARCHAR(50) NOT NULL, -- breakfast, lunch, dinner, snack
  servings INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Shopping lists
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Shopping list items
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2),
  unit VARCHAR(50),
  checked BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Social posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Post likes
CREATE TABLE post_likes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Post comments
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Blog posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_public ON recipes(is_public);
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_shopping_lists_user_id ON shopping_lists(user_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

---

## 🔄 Migration Strategy

### Phase 1: Setup (Week 1)
1. **Provision RDS PostgreSQL**
   ```bash
   # Create RDS instance via CloudFormation
   aws cloudformation create-stack \
     --stack-name mealprep360-postgresql \
     --template-body file://aws/cloudformation/rds-postgresql.yaml
   ```

2. **Install Prisma**
   ```bash
   npm install -D prisma
   npm install @prisma/client
   ```

3. **Create Prisma Schema**
   ```bash
   npx prisma init
   # Edit prisma/schema.prisma with PostgreSQL models
   ```

### Phase 2: Service-by-Service Migration (Weeks 2-3)

#### Step 1: User Service
- Convert Mongoose models to Prisma
- Update authentication logic
- Test user registration/login
- Deploy and verify

#### Step 2: Recipe Service
- Migrate recipe models
- Handle ingredients relationships
- Update image upload logic
- Test CRUD operations

#### Step 3: MealPlan Service
- Migrate meal plan models
- Update meal generation logic
- Test plan creation and updates

#### Step 4: Shopping Service
- Migrate shopping list models
- Update list aggregation logic
- Test item management

#### Step 5: Social Service
- Migrate posts, likes, comments
- Update feed generation
- Test social interactions

#### Step 6: Blog Service
- Migrate blog posts
- Update CMS logic
- Test publishing workflow

### Phase 3: Testing & Optimization (Week 4)
1. Load testing
2. Query optimization
3. Index tuning
4. Connection pooling configuration
5. Backup strategy implementation

### Phase 4: Cutover (Week 5)
1. Final data migration (if any)
2. DNS/routing updates
3. Monitor for issues
4. Decommission DocumentDB

---

## 🛠️ Technology Stack

### ORM: Prisma
**Why Prisma?**
- ✅ Type-safe database access
- ✅ Auto-generated TypeScript types
- ✅ Excellent migration system
- ✅ Built-in connection pooling
- ✅ Great developer experience

**Installation:**
```bash
cd MealPrep360-API
npm install prisma @prisma/client
npx prisma init
```

**Example Model:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  clerkId   String   @unique @map("clerk_id")
  email     String   @unique
  name      String?
  recipes   Recipe[]
  mealPlans MealPlan[]
  posts     Post[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Recipe {
  id          String              @id @default(uuid())
  userId      String              @map("user_id")
  title       String
  description String?
  instructions String[]
  prepTime    Int?                @map("prep_time")
  cookTime    Int?                @map("cook_time")
  servings    Int?
  isPublic    Boolean             @default(false) @map("is_public")
  imageUrl    String?             @map("image_url")
  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  ingredients RecipeIngredient[]
  nutrition   RecipeNutrition?
  tags        RecipeTag[]
  createdAt   DateTime            @default(now()) @map("created_at")
  updatedAt   DateTime            @updatedAt @map("updated_at")

  @@map("recipes")
}
```

---

## 📝 Code Migration Examples

### Before (Mongoose)
```typescript
// models/Recipe.ts
import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  ingredients: [{
    name: String,
    amount: Number,
    unit: String
  }],
  instructions: [String],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Recipe = mongoose.model('Recipe', recipeSchema);

// Usage
const recipe = await Recipe.findById(id).populate('userId');
```

### After (Prisma)
```typescript
// No model file needed - generated from schema

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Usage (fully type-safe)
const recipe = await prisma.recipe.findUnique({
  where: { id },
  include: {
    user: true,
    ingredients: {
      include: {
        ingredient: true
      }
    },
    nutrition: true,
    tags: {
      include: {
        tag: true
      }
    }
  }
});
```

---

## 💰 Cost Comparison

### Current (DocumentDB)
- **Instance:** db.t3.medium
- **Cost:** ~$200/month
- **Storage:** $0.10/GB/month

### Proposed (RDS PostgreSQL)
- **Instance:** db.t4g.micro (eligible for free tier)
- **Cost:** ~$15-20/month (after free tier)
- **Storage:** $0.115/GB/month (same)

**Savings: ~$180/month (~90% reduction)**

---

## 🚀 Quick Start Commands

### 1. Create PostgreSQL Database
```bash
# Run CloudFormation template
./scripts/create-postgresql-db.ps1
```

### 2. Initialize Prisma
```bash
cd MealPrep360-API
npm install -D prisma
npm install @prisma/client
npx prisma init
```

### 3. Create Schema
```bash
# Edit prisma/schema.prisma
# Then generate migration
npx prisma migrate dev --name init
```

### 4. Generate Client
```bash
npx prisma generate
```

### 5. Test Connection
```bash
npx prisma studio
```

---

## ✅ Migration Checklist

### Pre-Migration
- [ ] Provision RDS PostgreSQL instance
- [ ] Install Prisma in all services
- [ ] Design complete schema
- [ ] Create migration scripts
- [ ] Set up staging environment

### Service Migration
- [ ] User Service → PostgreSQL
- [ ] Recipe Service → PostgreSQL
- [ ] MealPlan Service → PostgreSQL
- [ ] Shopping Service → PostgreSQL
- [ ] Social Service → PostgreSQL
- [ ] Blog Service → PostgreSQL

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Load testing complete
- [ ] Performance benchmarks met

### Deployment
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] Smoke tests pass
- [ ] Deploy to production
- [ ] Monitor metrics

### Cleanup
- [ ] Decommission DocumentDB
- [ ] Remove Mongoose dependencies
- [ ] Update documentation

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/current/index.html)
- [AWS RDS PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate-to-prisma)

---

**Next Step:** Review and approve this migration plan, then begin Phase 1!

