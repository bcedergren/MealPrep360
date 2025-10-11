# PostgreSQL Migration - Current Status

**Date:** October 11, 2025  
**Time:** 11:52 AM CST  
**Phase:** Infrastructure Provisioning

---

## ✅ Completed Today

### 1. **Infrastructure as Code Created**
- ✅ CloudFormation template for RDS PostgreSQL (`aws/cloudformation/rds-postgresql.yaml`)
- ✅ Automated provisioning script (`scripts/create-postgresql-db.ps1`)
- ✅ Prisma setup automation script (`scripts/setup-prisma-schema.ps1`)

### 2. **Database Design Complete**
- ✅ Comprehensive Prisma schema created (`prisma/schema.prisma`)
- ✅ 18 tables designed covering all features:
  - Users & Authentication
  - Subscriptions & Preferences
  - Recipes & Ingredients
  - Meal Plans
  - Shopping Lists
  - Social Features (Posts, Likes, Comments)
  - Blog
- ✅ Proper relationships and indexes defined
- ✅ UUID-based primary keys
- ✅ Cascading deletes configured

### 3. **Prisma Installed**
- ✅ `prisma` (dev dependency)
- ✅ `@prisma/client` (runtime)
- ✅ Installed in `MealPrep360-API` service

### 4. **Database Provisioning In Progress** ⏳
- ⏳ RDS PostgreSQL instance creating (10-15 minutes)
- ⏳ Instance type: `db.t4g.micro` (cost-optimized)
- ⏳ Storage: 20GB GP3 (encrypted)
- ⏳ Postgres 15.4
- ⏳ Automated backups configured
- ⏳ CloudWatch logs enabled

---

## 📊 Database Schema Overview

### Core Tables
```
Users
├── Subscriptions (1:1)
├── UserPreferences (1:1)
├── Recipes (1:N)
├── MealPlans (1:N)
├── ShoppingLists (1:N)
├── Posts (1:N)
└── BlogPosts (1:N)

Recipes
├── RecipeIngredients (N:M via Ingredients)
├── RecipeNutrition (1:1)
├── RecipeTags (N:M via Tags)
├── MealPlanItems (1:N)
└── Posts (1:N)

MealPlans
├── MealPlanItems (1:N)
└── ShoppingLists (1:N)

ShoppingLists
├── ShoppingListItems (N:M via Ingredients)
└── MealPlan (N:1)

Posts
├── PostLikes (N:M via Users)
├── PostComments (1:N)
└── Recipe (N:1)
```

### Key Features
- **UUID Primary Keys** - Better for distributed systems
- **Timestamps** - `createdAt`, `updatedAt` on all tables
- **Soft Relations** - Optional foreign keys where appropriate
- **Indexes** - On frequently queried fields
- **Cascading Deletes** - Automatic cleanup of related records

---

## 💰 Cost Comparison

| Service | Current (MongoDB) | Future (PostgreSQL) | Savings |
|---------|-------------------|---------------------|---------|
| Database | DocumentDB: ~$200/mo | RDS t4g.micro: ~$15/mo | **~$185/mo** |
| Backup | Included | Included | $0 |
| Monitoring | CloudWatch | CloudWatch | $0 |
| **Total** | **$200/mo** | **$15/mo** | **92.5% savings!** |

---

## 🚀 Next Steps (Waiting for DB)

Once the PostgreSQL database finishes provisioning (~5 more minutes), you'll automatically:

### Step 1: Initialize Prisma
```bash
.\scripts\setup-prisma-schema.ps1
```
This script will:
- Copy Prisma schema to API service
- Retrieve DATABASE_URL from AWS Secrets Manager
- Generate Prisma Client (type-safe database access)
- Create initial migration
- Optionally open Prisma Studio

### Step 2: Migrate Services (One at a Time)
Start with the simplest service and work up:

**Priority Order:**
1. **User Service** (authentication foundation)
2. **Recipe Service** (core functionality)
3. **MealPlan Service** (depends on recipes)
4. **Shopping Service** (depends on meal plans)
5. **Social Service** (depends on users & recipes)
6. **Blog Service** (independent)

---

## 📝 Migration Pattern for Each Service

For each service, follow this pattern:

### 1. Update Dependencies
```bash
cd [Service]
npm install @prisma/client
```

### 2. Create Prisma Client Instance
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3. Replace Mongoose Models
**Before (Mongoose):**
```typescript
import { Recipe } from './models/Recipe'

const recipe = await Recipe.findById(id).populate('userId')
```

**After (Prisma):**
```typescript
import { prisma } from './lib/prisma'

const recipe = await prisma.recipe.findUnique({
  where: { id },
  include: {
    user: true,
    ingredients: {
      include: { ingredient: true }
    }
  }
})
```

### 4. Update Tests
Update unit tests to use Prisma mocking or test database

### 5. Deploy & Verify
Deploy service, test endpoints, monitor logs

---

## 🔍 Monitoring Database Provisioning

Check status anytime:
```bash
aws cloudformation describe-stacks \
  --stack-name mealprep360-postgresql \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

Or via console:
https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks

---

## 📚 Key Resources

### Prisma Documentation
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Queries](https://www.prisma.io/docs/concepts/components/prisma-client/crud)

### Migration Guides
- [From Mongoose to Prisma](https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-mongoose)
- [Schema Design Best Practices](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)

### Your Documentation
- `POSTGRESQL_MIGRATION_PLAN.md` - Complete migration strategy
- `DEPLOYMENT_SESSION_COMPLETE.md` - Infrastructure summary
- `REQUIRED_API_KEYS.md` - Environment variables needed

---

## ✨ Benefits You'll Get

### 1. Type Safety
```typescript
// Prisma knows your schema!
const user = await prisma.user.findUnique({ where: { id: userId } })
// user is fully typed: User | null
// TypeScript autocomplete works everywhere
```

### 2. Better Performance
- Optimized queries with proper indexes
- Connection pooling built-in
- Query optimization suggestions

### 3. Better Developer Experience
- Prisma Studio - Visual database browser
- Migration history tracking
- Automatic schema sync

### 4. Simpler Code
- No more schema validation code
- No more type definitions
- Automatic joins with `include`

---

## 🎯 Current TODO List

- [x] Design PostgreSQL schema
- [x] Create CloudFormation template
- [x] Install Prisma
- [ ] **Wait for database (5 mins remaining)**
- [ ] Run setup script
- [ ] Migrate User Service
- [ ] Migrate Recipe Service
- [ ] Migrate MealPlan Service
- [ ] Migrate Shopping Service
- [ ] Migrate Social Service
- [ ] Migrate Blog Service
- [ ] End-to-end testing
- [ ] Decommission DocumentDB

---

## ⏰ Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Infrastructure Setup | 15 mins | ⏳ In Progress |
| Prisma Setup | 5 mins | ⏳ Next |
| User Service Migration | 2 hours | Pending |
| Recipe Service Migration | 3 hours | Pending |
| Other Services Migration | 4 hours | Pending |
| Testing & Debugging | 2 hours | Pending |
| **Total** | **~1-2 days** | |

---

## 🆘 If You Need Help

**Stuck on migration?**
- Check `POSTGRESQL_MIGRATION_PLAN.md`
- Use Prisma Studio to inspect data: `npx prisma studio`
- Check migration status: `npx prisma migrate status`

**Database issues?**
- Check CloudFormation events in AWS Console
- View RDS logs in CloudWatch
- Test connection: `npx prisma db pull`

**Code issues?**
- Prisma generates types automatically
- Use `npx prisma format` to fix schema
- Use `npx prisma validate` to check schema

---

**You're on track for a successful migration!** 🎉

Once the database finishes provisioning, run:
```bash
.\scripts\setup-prisma-schema.ps1
```

And the migration journey begins! 🚀

