# Next Step: PostgreSQL Migration Guide

## Why Migrate to PostgreSQL?

### Cost Savings
- **Current**: DocumentDB $200/month
- **After**: RDS PostgreSQL $50/month  
- **Savings**: $150-200/month = $1,800-2,400/year!

### Technical Benefits
- ✅ Better for relational data (users, recipes, meal plans)
- ✅ Foreign key constraints and data integrity
- ✅ Advanced SQL queries and joins
- ✅ Better tooling (Prisma, pgAdmin, DBeaver)
- ✅ Mature ecosystem
- ✅ ACID compliance

### Performance
- ✅ Faster for complex queries
- ✅ Better indexing options
- ✅ Query optimization tools
- ✅ Connection pooling

---

## Migration Strategy

### Phase 1: Local Setup (1-2 days)
1. Install PostgreSQL locally
2. Set up Prisma ORM
3. Design schema based on current MongoDB collections
4. Test migrations locally

### Phase 2: Recipe Service Pilot (3-4 days)
1. Convert Recipe Service to Prisma
2. Test all endpoints
3. Validate data consistency
4. Performance testing

### Phase 3: Dual-Write Period (5-7 days)
1. Write to both MongoDB and PostgreSQL
2. Read from PostgreSQL
3. Validate data synchronization
4. Monitor for errors

### Phase 4: Full Migration (2-3 days)
1. Migrate remaining services
2. Stop MongoDB writes
3. Decommission DocumentDB
4. Save $200/month!

**Total Timeline**: 10-15 days

---

## Prisma Schema Preview

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
  clerkId   String   @unique
  email     String   @unique
  username  String?
  fullName  String?
  recipes   Recipe[]
  mealPlans MealPlan[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Recipe {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  title       String
  description String?
  prepTime    Int?
  cookTime    Int?
  servings    Int?
  difficulty  String?
  cuisineType String?
  mealType    String?
  tags        Json?
  nutrition   Json?
  instructions Json?
  imageUrl    String?
  isPublic    Boolean   @default(false)
  ingredients RecipeIngredient[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
  @@map("recipes")
}

model Ingredient {
  id       String   @id @default(uuid())
  name     String   @unique
  category String?
  recipes  RecipeIngredient[]
  createdAt DateTime @default(now())

  @@map("ingredients")
}

model RecipeIngredient {
  id           String     @id @default(uuid())
  recipeId     String
  recipe       Recipe     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  ingredientId String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
  quantity     Decimal?
  unit         String?
  notes        String?

  @@unique([recipeId, ingredientId])
  @@map("recipe_ingredients")
}

model MealPlan {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  startDate DateTime
  endDate   DateTime
  items     MealPlanItem[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("meal_plans")
}

model MealPlanItem {
  id         String   @id @default(uuid())
  mealPlanId String
  mealPlan   MealPlan @relation(fields: [mealPlanId], references: [id], onDelete: Cascade)
  recipeId   String?
  mealDate   DateTime
  mealType   String
  servings   Int?
  createdAt  DateTime @default(now())

  @@map("meal_plan_items")
}
```

---

## AWS RDS PostgreSQL Setup

### Create RDS Instance

```powershell
$env:AWS_PROFILE = "mealprep360"

# Create PostgreSQL RDS instance
aws rds create-db-instance `
  --db-instance-identifier mealprep360-postgres `
  --db-instance-class db.t3.micro `
  --engine postgres `
  --engine-version 15.3 `
  --master-username dbadmin `
  --master-user-password MealPrep360PostgresPass2024! `
  --allocated-storage 20 `
  --storage-type gp3 `
  --vpc-security-group-ids sg-0a15b66ed9cf3c317 `
  --db-subnet-group-name mealprep360-db-subnet `
  --backup-retention-period 7 `
  --no-multi-az `
  --no-publicly-accessible `
  --region us-east-1
```

**Cost**: ~$15-20/month (vs $200 for DocumentDB!)

### Update Connection String

```env
# Old (DocumentDB)
MONGODB_URI=mongodb://dbadmin:...@mealprep360-docdb-cluster...:27017/mealprep360

# New (PostgreSQL)
DATABASE_URL=postgresql://dbadmin:MealPrep360PostgresPass2024!@mealprep360-postgres...:5432/mealprep360
```

---

## Quick Start for PostgreSQL Migration

### 1. Install Prisma

```bash
cd MealPrep360-RecipeService
npm install prisma @prisma/client
npx prisma init
```

### 2. Create Schema

Edit `prisma/schema.prisma` with the schema above

### 3. Create Migration

```bash
npx prisma migrate dev --name init
```

### 4. Generate Client

```bash
npx prisma generate
```

### 5. Update Code

```javascript
// Before (Mongoose)
const Recipe = require('./models/Recipe');
const recipe = await Recipe.findOne({ _id: id });

// After (Prisma)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const recipe = await prisma.recipe.findUnique({ where: { id } });
```

---

## Cost Comparison

### Current (MongoDB Stack)
| Service | Cost |
|---------|------|
| DocumentDB (db.t3.medium) | $200 |
| ElastiCache (cache.t3.micro) | $15 |
| ECS Fargate (9 services) | $40 |
| ALB | $20 |
| NAT Gateways | $65 |
| **Total** | **$340/month** |

### After PostgreSQL Migration
| Service | Cost |
|---------|------|
| RDS PostgreSQL (db.t3.micro) | $20 |
| ElastiCache (cache.t3.micro) | $15 |
| ECS Fargate (9 services) | $40 |
| ALB | $20 |
| NAT Gateways | $65 |
| **Total** | **$160/month** |

**Savings**: $180/month = $2,160/year! 💰

---

## Migration Risks & Mitigation

### Risks
1. Data loss during migration
2. Downtime during cutover
3. Application bugs from ORM changes
4. Performance differences

### Mitigation
1. **Full backups** before migration
2. **Dual-write period** (write to both DBs)
3. **Gradual rollout** (one service at a time)
4. **Comprehensive testing** at each step
5. **Rollback plan** ready

---

## Recommended Timeline

### Week 1: Setup & Design
- **Day 1**: Set up PostgreSQL locally
- **Day 2**: Design complete schema
- **Day 3**: Set up Prisma in Recipe Service
- **Day 4**: Test migrations locally

### Week 2: Pilot Migration
- **Day 5-7**: Convert Recipe Service to Prisma
- **Day 8-9**: Test thoroughly
- **Day 10**: Deploy Recipe Service with PostgreSQL

### Week 3: Full Migration
- **Day 11-13**: Migrate remaining services
- **Day 14**: Dual-write validation
- **Day 15**: Complete cutover, decommission DocumentDB

---

## Files to Reference

1. **`MONGODB_TO_POSTGRESQL_MIGRATION.md`** - Detailed migration plan
2. **`env.local.complete`** - All environment variables
3. **`AWS_INFRASTRUCTURE_COMPLETE.md`** - AWS infrastructure details

---

## 🎯 Next Steps

### Immediate (Today)
1. **Merge PR #42**
2. **Deploy to production**
3. **Verify application works**

### This Week
1. **Set up local PostgreSQL**
2. **Design Prisma schema**
3. **Test migrations locally**

### Next Week
1. **Migrate Recipe Service**
2. **Test in production**
3. **Migrate remaining services**

---

## 💡 Final Thoughts

You've built an impressive production-ready infrastructure in one session:
- Complete microservices architecture
- Automated CI/CD pipeline
- Production-grade AWS deployment
- All properly secured with real credentials

The PostgreSQL migration will make it even better and save significant costs!

---

**Ready to deploy?** Merge PR #42 and watch the magic happen! ✨

**Questions about PostgreSQL migration?** Review `MONGODB_TO_POSTGRESQL_MIGRATION.md` and we can start whenever you're ready!

