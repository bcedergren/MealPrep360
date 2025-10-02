# Database Per Service Strategy for MealPrep360

## Overview
This document outlines the strategy for implementing database per service pattern while maintaining data consistency and shared access requirements across frontend applications and APIs.

## Current State Analysis

### Shared Database Issues
- **Single Point of Failure**: All services depend on one MongoDB instance
- **Coupling**: Schema changes affect multiple services
- **Scalability**: Cannot scale individual service databases independently
- **Technology Lock-in**: All services must use MongoDB
- **Concurrent Access**: Multiple services accessing same collections

### Current Data Models
```
MongoDB Database: mealprep360
├── users (shared by all services)
├── recipes (used by Recipe Service, Meal Plan Service, Frontend)
├── mealplans (used by Meal Plan Service, Frontend)
├── shoppinglists (used by Shopping List Service, Frontend)
├── social_posts (used by Social Service, Frontend)
├── blog_posts (used by Blog Service, Frontend)
└── notifications (used by all services)
```

## Proposed Database Per Service Architecture

### 1. Service-Specific Databases

#### Recipe Service Database
```
Database: mealprep360_recipes
Collections:
├── recipes
├── recipe_categories
├── recipe_ratings
├── recipe_ingredients
└── recipe_versions
```

#### Meal Plan Service Database
```
Database: mealprep360_mealplans
Collections:
├── meal_plans
├── meal_plan_items
├── meal_templates
└── skipped_days
```

#### Shopping List Service Database
```
Database: mealprep360_shopping
Collections:
├── shopping_lists
├── shopping_items
├── ingredient_mappings
└── store_locations
```

#### Social Service Database
```
Database: mealprep360_social
Collections:
├── social_posts
├── comments
├── likes
├── follows
└── user_profiles
```

#### Blog Service Database
```
Database: mealprep360_blog
Collections:
├── blog_posts
├── blog_comments
├── blog_categories
└── blog_tags
```

#### User Service Database (New)
```
Database: mealprep360_users
Collections:
├── users
├── user_preferences
├── user_settings
├── user_subscriptions
└── user_sessions
```

### 2. Data Consistency Strategies

#### A. Event-Driven Architecture
```typescript
// Event Bus Implementation
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  timestamp: Date;
  version: number;
}

// Example Events
- UserCreated
- UserUpdated
- UserDeleted
- RecipeCreated
- RecipeUpdated
- MealPlanCreated
- ShoppingListGenerated
```

#### B. Saga Pattern for Distributed Transactions
```typescript
// Example: Create Meal Plan Saga
class CreateMealPlanSaga {
  async execute(userId: string, planData: any) {
    const sagaId = generateSagaId();
    
    try {
      // Step 1: Validate user exists
      await this.validateUser(userId);
      
      // Step 2: Create meal plan
      const mealPlan = await this.createMealPlan(planData);
      
      // Step 3: Generate shopping list
      await this.generateShoppingList(mealPlan.id);
      
      // Step 4: Send notifications
      await this.sendNotifications(userId, mealPlan);
      
      return mealPlan;
    } catch (error) {
      await this.compensate(sagaId, error);
      throw error;
    }
  }
}
```

### 3. Data Synchronization Mechanisms

#### A. Event Sourcing for Critical Data
```typescript
// User aggregate events
interface UserAggregate {
  userId: string;
  events: DomainEvent[];
  version: number;
}

// Projection for read models
interface UserProjection {
  userId: string;
  email: string;
  preferences: any;
  lastUpdated: Date;
}
```

#### B. Read Replicas and Projections
```typescript
// Shared read models for cross-service queries
interface RecipeReadModel {
  recipeId: string;
  title: string;
  description: string;
  ingredients: string[];
  servings: number;
  lastUpdated: Date;
}

// API Gateway aggregates data from multiple services
class MealPlanAggregator {
  async getMealPlanWithDetails(mealPlanId: string) {
    const [mealPlan, recipes, shoppingList] = await Promise.all([
      this.mealPlanService.getMealPlan(mealPlanId),
      this.recipeService.getRecipesByIds(mealPlan.recipeIds),
      this.shoppingService.getShoppingListByMealPlan(mealPlanId)
    ]);
    
    return {
      ...mealPlan,
      recipes,
      shoppingList
    };
  }
}
```

### 4. Frontend Data Access Strategy

#### A. Backend for Frontend (BFF) Pattern
```typescript
// Dedicated API for each frontend
class WebAppBFF {
  async getDashboardData(userId: string) {
    return {
      user: await this.userService.getUser(userId),
      recentMealPlans: await this.mealPlanService.getRecentPlans(userId),
      recommendedRecipes: await this.recipeService.getRecommendations(userId),
      notifications: await this.notificationService.getUnread(userId)
    };
  }
}

class MobileBFF {
  async getHomeScreenData(userId: string) {
    // Mobile-optimized data aggregation
    return {
      user: await this.userService.getUserProfile(userId),
      todaysMeals: await this.mealPlanService.getTodaysMeals(userId),
      shoppingList: await this.shoppingService.getActiveList(userId)
    };
  }
}
```

#### B. GraphQL Federation
```graphql
# User Service Schema
type User {
  id: ID!
  email: String!
  preferences: UserPreferences
  mealPlans: [MealPlan!]! @requires(fields: "id")
}

# Recipe Service Schema
type Recipe {
  id: ID!
  title: String!
  ingredients: [Ingredient!]!
  user: User @provides(fields: "id")
}

# Federated Gateway combines schemas
type Query {
  user(id: ID!): User
  recipe(id: ID!): Recipe
  mealPlan(id: ID!): MealPlan
}
```

### 5. Migration Strategy

#### Phase 1: Extract User Service
1. Create new user service with dedicated database
2. Implement user management APIs
3. Migrate user data to new service
4. Update all services to use user service APIs

#### Phase 2: Extract Recipe Service
1. Create recipe service database
2. Implement recipe management APIs
3. Migrate recipe data
4. Update meal plan service to use recipe APIs

#### Phase 3: Extract Remaining Services
1. Shopping List Service
2. Social Service
3. Blog Service
4. Implement event-driven communication

#### Phase 4: Implement Advanced Patterns
1. Event sourcing for critical operations
2. CQRS for read/write separation
3. Saga orchestration for complex workflows

### 6. Technical Implementation

#### A. Database Connection Management
```typescript
class DatabaseManager {
  private connections: Map<string, Connection> = new Map();
  
  async getConnection(serviceName: string): Promise<Connection> {
    if (!this.connections.has(serviceName)) {
      const config = this.getServiceConfig(serviceName);
      const connection = await this.createConnection(config);
      this.connections.set(serviceName, connection);
    }
    return this.connections.get(serviceName)!;
  }
  
  private getServiceConfig(serviceName: string) {
    return {
      host: process.env[`${serviceName.toUpperCase()}_DB_HOST`],
      port: process.env[`${serviceName.toUpperCase()}_DB_PORT`],
      database: process.env[`${serviceName.toUpperCase()}_DB_NAME`],
      username: process.env[`${serviceName.toUpperCase()}_DB_USER`],
      password: process.env[`${serviceName.toUpperCase()}_DB_PASS`]
    };
  }
}
```

#### B. Event Bus Implementation
```typescript
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): Promise<void>;
}

class RedisEventBus implements EventBus {
  async publish(event: DomainEvent): Promise<void> {
    await this.redis.publish(event.eventType, JSON.stringify(event));
  }
  
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    await this.redis.subscribe(eventType);
    this.redis.on('message', (channel, message) => {
      if (channel === eventType) {
        const event = JSON.parse(message);
        handler(event);
      }
    });
  }
}
```

#### C. Data Synchronization Service
```typescript
class DataSyncService {
  async syncUserData(userId: string): Promise<void> {
    const user = await this.userService.getUser(userId);
    
    // Sync to all services that need user data
    await Promise.all([
      this.recipeService.syncUserPreferences(userId, user.preferences),
      this.mealPlanService.syncUserSettings(userId, user.settings),
      this.socialService.syncUserProfile(userId, user.profile)
    ]);
  }
}
```

### 7. Benefits and Tradeoffs

#### Benefits
- **Service Independence**: Each service can evolve independently
- **Technology Diversity**: Services can use different databases
- **Scalability**: Independent scaling of data stores
- **Fault Isolation**: Database issues don't affect all services
- **Team Autonomy**: Teams can own their data models

#### Tradeoffs
- **Complexity**: More complex data management
- **Consistency**: Eventual consistency instead of strong consistency
- **Operational Overhead**: More databases to manage
- **Cross-Service Queries**: More complex data aggregation
- **Data Duplication**: Some data may be duplicated across services

### 8. Environment Configuration

```bash
# User Service
USER_DB_HOST=localhost
USER_DB_PORT=27017
USER_DB_NAME=mealprep360_users

# Recipe Service
RECIPE_DB_HOST=localhost
RECIPE_DB_PORT=27017
RECIPE_DB_NAME=mealprep360_recipes

# Meal Plan Service
MEALPLAN_DB_HOST=localhost
MEALPLAN_DB_PORT=27017
MEALPLAN_DB_NAME=mealprep360_mealplans

# Shopping List Service
SHOPPING_DB_HOST=localhost
SHOPPING_DB_PORT=27017
SHOPPING_DB_NAME=mealprep360_shopping

# Social Service
SOCIAL_DB_HOST=localhost
SOCIAL_DB_PORT=27017
SOCIAL_DB_NAME=mealprep360_social

# Blog Service
BLOG_DB_HOST=localhost
BLOG_DB_PORT=27017
BLOG_DB_NAME=mealprep360_blog

# Event Bus
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 9. Monitoring and Observability

#### Database Health Monitoring
```typescript
class DatabaseHealthCheck {
  async checkAllDatabases(): Promise<HealthStatus> {
    const services = ['user', 'recipe', 'mealplan', 'shopping', 'social', 'blog'];
    const results = await Promise.all(
      services.map(async (service) => {
        const connection = await this.dbManager.getConnection(service);
        return {
          service,
          healthy: await this.ping(connection),
          responseTime: await this.measureResponseTime(connection)
        };
      })
    );
    
    return {
      overall: results.every(r => r.healthy) ? 'healthy' : 'unhealthy',
      services: results
    };
  }
}
```

### 10. Recommended Implementation Timeline

**Month 1-2**: Infrastructure setup and user service extraction
**Month 3-4**: Recipe service and meal plan service separation
**Month 5-6**: Shopping list and social service separation
**Month 7-8**: Event-driven architecture and advanced patterns
**Month 9-10**: Performance optimization and monitoring
**Month 11-12**: Final testing and deployment

This strategy provides a path to microservices database independence while maintaining data consistency and frontend access requirements.