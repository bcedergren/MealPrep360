# MealPrep360 Admin to API Migration Plan

## Overview

This migration plan outlines the systematic approach to move business logic, API endpoints, and database operations from the `MealPrep360-Admin` project to the centralized `MealPrep360-API` project. The goal is to establish a clean separation of concerns where the Admin project serves as a pure frontend consuming the API.

## Current State Analysis

### Admin Project API Endpoints (To Be Migrated)

Based on analysis, the Admin project contains **47 API endpoints** that need to be evaluated for migration:

#### Critical Business Logic Endpoints (High Priority)

1. **Recipe Management**

   - `/api/recipes` - Recipe listing with pagination/filtering
   - `/api/recipes/counts` - Recipe statistics
   - `/api/admin/recipes/generate` - AI recipe generation
   - `/api/admin/recipes/update` - Bulk recipe updates
   - `/api/admin/recipes/make-all-public` - Bulk visibility changes
   - `/api/admin/recipes/ensure-images` - Image management
   - `/api/admin/recipes/generate-image` - AI image generation
   - `/api/admin/recipes/reported-images` - Content moderation
   - `/api/admin/recipes/delete-all` - Bulk deletion
   - `/api/admin/recipes/image-status/[recipeId]` - Image status tracking

2. **User Management**

   - `/api/admin/users` - User CRUD operations
   - `/api/users/[userId]` - User profile management
   - `/api/users/[userId]/follow` - Social following system

3. **Blog Management**

   - `/api/blog/posts` - Blog post CRUD (duplicate of API project)
   - `/api/blog/generate` - AI blog generation
   - `/api/blog/generate-image` - Blog image generation

4. **System Administration**

   - `/api/admin/stats` - System statistics
   - `/api/admin/setup` - Initial system setup
   - `/api/admin/services/health` - Service health monitoring
   - `/api/admin/check-status` - System status checks

5. **Content Moderation**
   - `/api/admin/moderation/flagged` - Flagged content management
   - `/api/admin/moderation/stats` - Moderation statistics

#### Job Management & Monitoring (Medium Priority)

6. **Recipe Generation Jobs**
   - `/api/admin/recipes/generate/jobs` - Job listing
   - `/api/admin/recipes/generate/jobs/[jobId]` - Job management
   - `/api/admin/recipes/generate/status/[jobId]` - Job status
   - `/api/admin/recipes/generate/metrics` - Job metrics
   - `/api/admin/recipes/generate/performance` - Performance monitoring
   - `/api/admin/recipes/generate/health` - Health checks
   - `/api/admin/recipes/generate/trace` - Debugging/tracing

#### Stub/Placeholder Endpoints (Low Priority)

7. **Social Features** (Currently stubs)

   - `/api/social/feed` - Social feed
   - `/api/social/post` - Post creation
   - `/api/social/[postId]/comment` - Comments
   - `/api/social/[postId]/reaction` - Reactions

8. **Notifications** (Currently stubs)
   - `/api/notifications` - Notification management
   - `/api/notifications/[userId]` - User notifications
   - `/api/notifications/read/[notificationId]` - Mark as read
   - `/api/admin/notifications` - Admin notifications

## Migration Strategy

### Phase 1: Foundation & Core Infrastructure (Week 1-2)

**Priority: Critical**

#### 1.1 Admin Authentication in API Project

- **Create**: `/MealPrep360-API/src/lib/auth/adminAuth.ts`
- **Move**: Admin authentication middleware from Admin project
- **Enhance**: Add role-based permissions system
- **Test**: Verify admin authentication works in API context

#### 1.2 Admin Namespace Structure

- **Create**: `/MealPrep360-API/src/app/api/admin/` directory structure
- **Implement**: Consistent admin route authentication
- **Document**: Admin API endpoints in Swagger

#### 1.3 Shared Models & Schemas

- **Audit**: Compare MongoDB schemas between projects
- **Consolidate**: Merge schema definitions in API project
- **Remove**: Duplicate schemas from Admin project

### Phase 2: Core Business Logic Migration (Week 3-4)

**Priority: High**

#### 2.1 Recipe Management APIs

- **Move**: All recipe-related admin endpoints to API project
- **Path**: `MealPrep360-Admin/src/app/api/admin/recipes/*` → `MealPrep360-API/src/app/api/admin/recipes/*`
- **Update**: Database connection references
- **Test**: Recipe generation, bulk operations, image management

#### 2.2 User Management APIs

- **Move**: User management endpoints to API project
- **Path**: `MealPrep360-Admin/src/app/api/admin/users/*` → `MealPrep360-API/src/app/api/admin/users/*`
- **Consolidate**: With existing user endpoints in API project
- **Test**: User CRUD operations, following system

#### 2.3 System Administration

- **Move**: Stats, setup, and health monitoring endpoints
- **Path**: `MealPrep360-Admin/src/app/api/admin/{stats,setup,services}/*` → `MealPrep360-API/src/app/api/admin/{stats,setup,services}/*`
- **Test**: System monitoring and setup flows

### Phase 3: Content & Moderation (Week 5)

**Priority: Medium**

#### 3.1 Blog Management

- **Compare**: Blog endpoints between projects
- **Consolidate**: Remove duplicate blog endpoints from Admin
- **Enhance**: API project blog endpoints with admin features
- **Test**: Blog creation, editing, publishing workflows

#### 3.2 Content Moderation

- **Move**: Moderation endpoints to API project
- **Path**: `MealPrep360-Admin/src/app/api/admin/moderation/*` → `MealPrep360-API/src/app/api/admin/moderation/*`
- **Test**: Content flagging and moderation workflows

### Phase 4: Job Management & Monitoring (Week 6)

**Priority: Medium**

#### 4.1 Recipe Generation Jobs

- **Move**: All job-related endpoints to API project
- **Path**: `MealPrep360-Admin/src/app/api/admin/recipes/generate/*` → `MealPrep360-API/src/app/api/admin/recipes/generate/*`
- **Test**: Job creation, monitoring, and management

### Phase 5: Social & Notifications (Week 7)

**Priority: Low**

#### 5.1 Social Features

- **Assess**: Current implementation status
- **Move**: If implemented, move to API project
- **Path**: `MealPrep360-Admin/src/app/api/social/*` → `MealPrep360-API/src/app/api/social/*`

#### 5.2 Notifications

- **Move**: Notification endpoints to API project
- **Path**: `MealPrep360-Admin/src/app/api/notifications/*` → `MealPrep360-API/src/app/api/notifications/*`
- **Consolidate**: With existing notification endpoints

### Phase 6: Admin UI Updates (Week 8)

**Priority: High**

#### 6.1 Update Admin Frontend

- **Update**: All API calls to use centralized API endpoints
- **Remove**: Local API route files from Admin project
- **Test**: All admin functionality works with new API endpoints

#### 6.2 Environment Configuration

- **Update**: Admin project to use API_URL environment variable
- **Configure**: Authentication headers for API calls
- **Test**: End-to-end admin workflows

## Detailed Migration Steps

### Step 1: Create Admin Authentication in API Project

```typescript
// MealPrep360-API/src/lib/auth/adminAuth.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb/connection';
import { User } from '@/lib/mongodb/schemas';

export async function adminAuth(requiredRole: string = 'admin') {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await connectDB();
		const user = await User.findOne({ clerkId: userId });

		if (!user || user.role !== requiredRole) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
		}

		return null; // Success
	} catch (error) {
		console.error('Admin auth error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
```

### Step 2: Create Admin Namespace Structure

```
MealPrep360-API/src/app/api/admin/
├── users/
│   ├── route.ts
│   └── [userId]/
│       └── route.ts
├── recipes/
│   ├── route.ts
│   ├── generate/
│   │   ├── route.ts
│   │   ├── jobs/
│   │   └── status/
│   ├── update/
│   ├── images/
│   └── moderation/
├── blog/
│   ├── posts/
│   └── generate/
├── stats/
│   └── route.ts
├── moderation/
│   ├── flagged/
│   └── stats/
└── services/
    └── health/
```

### Step 3: Update Admin Frontend Service Layer

```typescript
// MealPrep360-Admin/src/lib/apiClient.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class AdminApiClient {
	private async request(endpoint: string, options: RequestInit = {}) {
		const response = await fetch(`${API_BASE_URL}/api/admin${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...options.headers,
			},
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.statusText}`);
		}

		return response.json();
	}

	// Recipe management
	async getRecipes(params: any) {
		return this.request(`/recipes?${new URLSearchParams(params)}`);
	}

	async generateRecipes(season: string) {
		return this.request('/recipes/generate', {
			method: 'POST',
			body: JSON.stringify({ season }),
		});
	}

	// User management
	async getUsers() {
		return this.request('/users');
	}

	// Stats
	async getStats() {
		return this.request('/stats');
	}
}
```

## File-by-File Migration Checklist

### High Priority Files to Move

#### Recipe Management

- [ ] `MealPrep360-Admin/src/app/api/recipes/route.ts` → `MealPrep360-API/src/app/api/admin/recipes/route.ts`
- [ ] `MealPrep360-Admin/src/app/api/admin/recipes/generate/route.ts` → `MealPrep360-API/src/app/api/admin/recipes/generate/route.ts`
- [ ] `MealPrep360-Admin/src/app/api/admin/recipes/update/route.ts` → `MealPrep360-API/src/app/api/admin/recipes/update/route.ts`
- [ ] `MealPrep360-Admin/src/app/api/admin/recipes/make-all-public/route.ts` → `MealPrep360-API/src/app/api/admin/recipes/make-all-public/route.ts`

#### User Management

- [ ] `MealPrep360-Admin/src/app/api/admin/users/route.ts` → `MealPrep360-API/src/app/api/admin/users/route.ts`
- [ ] `MealPrep360-Admin/src/app/api/users/[userId]/route.ts` → `MealPrep360-API/src/app/api/admin/users/[userId]/route.ts`

#### System Administration

- [ ] `MealPrep360-Admin/src/app/api/admin/stats/route.ts` → `MealPrep360-API/src/app/api/admin/stats/route.ts`
- [ ] `MealPrep360-Admin/src/app/api/admin/setup/route.ts` → `MealPrep360-API/src/app/api/admin/setup/route.ts`
- [ ] `MealPrep360-Admin/src/app/api/admin/services/health/route.ts` → `MealPrep360-API/src/app/api/admin/services/health/route.ts`

### Supporting Files to Update

#### Authentication & Middleware

- [ ] Move `MealPrep360-Admin/src/middleware/adminAuth.ts` → `MealPrep360-API/src/lib/auth/adminAuth.ts`
- [ ] Update authentication logic for API context

#### Models & Schemas

- [ ] Compare and consolidate MongoDB schemas
- [ ] Remove duplicate model definitions from Admin project

#### Utilities & Services

- [ ] Keep `MealPrep360-Admin/src/lib/socialService.ts` as client-side service
- [ ] Update service to call centralized API endpoints

## Testing Strategy

### Unit Tests

- [ ] Test admin authentication middleware
- [ ] Test each migrated endpoint individually
- [ ] Test database operations

### Integration Tests

- [ ] Test admin UI with new API endpoints
- [ ] Test end-to-end admin workflows
- [ ] Test error handling and edge cases

### Performance Tests

- [ ] Compare response times before/after migration
- [ ] Test concurrent admin operations
- [ ] Monitor database connection pooling

## Risk Mitigation

### Backup Strategy

- [ ] Create feature branch for migration
- [ ] Backup current Admin project state
- [ ] Document rollback procedures

### Gradual Migration

- [ ] Implement feature flags for gradual rollout
- [ ] Test each phase thoroughly before proceeding
- [ ] Maintain parallel endpoints during transition

### Error Handling

- [ ] Implement comprehensive error logging
- [ ] Add health checks for new endpoints
- [ ] Monitor API performance metrics

## Post-Migration Cleanup

### Admin Project Cleanup

- [ ] Remove all `/api/` directories from Admin project
- [ ] Remove database connection files
- [ ] Remove duplicate model definitions
- [ ] Update package.json dependencies

### API Project Optimization

- [ ] Optimize database queries
- [ ] Implement caching where appropriate
- [ ] Add comprehensive API documentation
- [ ] Set up monitoring and alerting

## Environment Variables

### Admin Project

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Remove MONGODB_URI and other API-specific variables
```

### API Project

```env
MONGODB_URI=mongodb://...
RECIPE_SERVICE_URL=...
RECIPE_SERVICE_API_KEY=...
# All existing API environment variables
```

## Success Criteria

### Technical Success

- [ ] All admin functionality works through centralized API
- [ ] No business logic remains in Admin project
- [ ] Performance is maintained or improved
- [ ] All tests pass

### Architectural Success

- [ ] Clean separation of concerns achieved
- [ ] Admin project is pure frontend
- [ ] API project is single source of truth for business logic
- [ ] Consistent authentication across all endpoints

## Timeline Summary

- **Week 1-2**: Foundation & Infrastructure
- **Week 3-4**: Core Business Logic Migration
- **Week 5**: Content & Moderation
- **Week 6**: Job Management & Monitoring
- **Week 7**: Social & Notifications
- **Week 8**: Admin UI Updates & Testing

**Total Estimated Time**: 8 weeks

## Next Steps

1. **Review and approve** this migration plan
2. **Create feature branch** for migration work
3. **Set up development environment** for testing
4. **Begin Phase 1** implementation
5. **Establish regular check-ins** to monitor progress

---

_This migration plan should be reviewed and updated as implementation progresses. Each phase should be thoroughly tested before proceeding to the next._
