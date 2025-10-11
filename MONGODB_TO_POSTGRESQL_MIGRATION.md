# MongoDB to PostgreSQL Migration Plan

## Overview

Converting MealPrep360 from MongoDB to PostgreSQL for better relational data integrity, ACID compliance, and SQL capabilities.

## Why PostgreSQL?

✅ **Strong ACID compliance** - Better data consistency  
✅ **Relational integrity** - Foreign keys, constraints  
✅ **Mature ecosystem** - Better tooling and ORMs  
✅ **Complex queries** - Advanced SQL capabilities  
✅ **Better for structured data** - Recipe relationships, user data  
✅ **Cost effective** - AWS RDS pricing vs DocumentDB  

## Current MongoDB Schema Analysis

### Collections to Convert:

1. **users** - User accounts and profiles
2. **recipes** - Recipe data with ingredients
3. **mealplans** - User meal plans
4. **shoppinglists** - Shopping lists
5. **ingredients** - Ingredient catalog
6. **posts** - Social media posts
7. **blogs** - Blog content

## PostgreSQL Schema Design

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    difficulty VARCHAR(50),
    cuisine_type VARCHAR(100),
    meal_type VARCHAR(100),
    tags JSONB,
    nutrition JSONB,
    instructions JSONB,
    image_url TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_tags ON recipes USING GIN (tags);

-- Ingredients
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Ingredients (many-to-many)
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    notes TEXT,
    UNIQUE(recipe_id, ingredient_id)
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- Meal Plans
CREATE TABLE meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);

-- Meal Plan Items
CREATE TABLE meal_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id),
    meal_date DATE NOT NULL,
    meal_type VARCHAR(50),
    servings INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meal_plan_items_plan ON meal_plan_items(meal_plan_id);
CREATE INDEX idx_meal_plan_items_date ON meal_plan_items(meal_date);

-- Shopping Lists
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_lists_user ON shopping_lists(user_id);

-- Shopping List Items
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    is_purchased BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);

-- Blog Posts
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_user ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

-- Social Posts
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    content TEXT,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_social_posts_user ON social_posts(user_id);
CREATE INDEX idx_social_posts_created ON social_posts(created_at DESC);

-- Post Comments
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);

-- Post Likes
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
```

## Migration Strategy

### Phase 1: Dual-Write Period
1. Keep MongoDB running
2. Write to both MongoDB and PostgreSQL
3. Read from MongoDB (primary)
4. Validate PostgreSQL writes

### Phase 2: Data Migration
1. Export MongoDB data
2. Transform to relational format
3. Import into PostgreSQL
4. Validate data integrity

### Phase 3: Read Migration
1. Switch reads to PostgreSQL
2. MongoDB becomes backup only
3. Monitor performance

### Phase 4: Complete Migration
1. Stop MongoDB writes
2. Decommission MongoDB
3. PostgreSQL is primary

## Technology Stack Changes

### ORMs/Database Libraries

**Current (MongoDB):**
- Mongoose

**New (PostgreSQL):**
- **Prisma** (Recommended) - Modern ORM with great TypeScript support
- **TypeORM** - Alternative with decorators
- **Drizzle** - Lightweight, fast

### Recommended: Prisma

```prisma
// schema.prisma
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
  username  String?
  fullName  String?  @map("full_name")
  recipes   Recipe[]
  mealPlans MealPlan[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}

model Recipe {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id])
  title       String
  description String?
  prepTime    Int?      @map("prep_time")
  cookTime    Int?      @map("cook_time")
  servings    Int?
  difficulty  String?
  cuisineType String?   @map("cuisine_type")
  mealType    String?   @map("meal_type")
  tags        Json?
  nutrition   Json?
  instructions Json?
  imageUrl    String?   @map("image_url")
  isPublic    Boolean   @default(false) @map("is_public")
  ingredients RecipeIngredient[]
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@index([userId])
  @@map("recipes")
}

// ... more models
```

## AWS Infrastructure Changes

### Current:
- DocumentDB (MongoDB-compatible)
- $200-300/month

### New:
- AWS RDS PostgreSQL
- $50-150/month (much cheaper!)
- Better features (automated backups, read replicas)

### RDS Configuration:

```yaml
# CloudFormation
PostgresDB:
  Type: AWS::RDS::DBInstance
  Properties:
    DBInstanceIdentifier: mealprep360-postgres
    DBInstanceClass: db.t3.micro  # Free tier eligible
    Engine: postgres
    EngineVersion: '15.3'
    MasterUsername: !Ref DBUsername
    MasterUserPassword: !Ref DBPassword
    AllocatedStorage: 20
    StorageType: gp3
    BackupRetentionPeriod: 7
    MultiAZ: false  # true for production
    PubliclyAccessible: false
    VPCSecurityGroups:
      - !Ref DBSecurityGroup
    DBSubnetGroupName: !Ref DBSubnetGroup
```

## Migration Tools

### 1. Data Export from MongoDB

```javascript
// export-mongodb-data.js
const mongoose = require('mongoose');
const fs = require('fs');

async function exportCollection(collectionName) {
  const data = await mongoose.connection.db
    .collection(collectionName)
    .find({})
    .toArray();
    
  fs.writeFileSync(
    `./migration-data/${collectionName}.json`,
    JSON.stringify(data, null, 2)
  );
}

// Export all collections
await exportCollection('users');
await exportCollection('recipes');
// ... etc
```

### 2. Transform and Import to PostgreSQL

```javascript
// import-to-postgres.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function importUsers(mongoUsers) {
  for (const user of mongoUsers) {
    await prisma.user.create({
      data: {
        id: user._id.toString(),
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  }
}
```

## Code Changes Required

### 1. Update Environment Variables

```env
# Old
MONGODB_URI=mongodb://...

# New
DATABASE_URL=postgresql://user:pass@host:5432/mealprep360
```

### 2. Replace Mongoose with Prisma

**Before (Mongoose):**
```javascript
const User = require('./models/User');

const user = await User.findOne({ email });
const users = await User.find({ isActive: true });
```

**After (Prisma):**
```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const user = await prisma.user.findUnique({ where: { email } });
const users = await prisma.user.findMany({ where: { isActive: true } });
```

### 3. Update Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=mealprep360
      - POSTGRES_PASSWORD=yourpassword
      - POSTGRES_DB=mealprep360_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| Schema Design | 1-2 days | Design all tables |
| Prisma Setup | 1 day | Install, configure |
| Update Services | 3-5 days | Replace Mongoose |
| Data Migration Script | 2-3 days | Export/transform/import |
| Testing | 2-3 days | Verify all functionality |
| Deployment | 1 day | Deploy to AWS |
| **Total** | **10-15 days** | **Full migration** |

## Risks & Mitigation

### Risks:
1. **Data loss** during migration
2. **Performance changes** (better or worse)
3. **Code bugs** from ORM changes
4. **Downtime** during cutover

### Mitigation:
1. **Full backups** before migration
2. **Dual-write period** to validate
3. **Comprehensive testing** of all endpoints
4. **Gradual rollout** service by service

## Next Steps

1. **Review & approve** this migration plan
2. **Set up local PostgreSQL** for development
3. **Create Prisma schema** from current MongoDB models
4. **Migrate one service** as proof of concept (Recipe Service)
5. **Test thoroughly** before proceeding
6. **Migrate remaining services** one by one
7. **Deploy to production** with rollback plan

## Recommendation

**Start with a pilot migration** of the Recipe Service:
- Smallest surface area
- Clear data model
- Good test case for approach
- Can validate performance

Would you like to proceed with the PostgreSQL migration?

