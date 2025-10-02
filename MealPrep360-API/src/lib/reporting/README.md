# Reporting Service Documentation

The Reporting Service provides comprehensive reporting and analytics capabilities for MealPrep360. It enables users to create, manage, and execute reports, as well as build dashboards and set up alerts.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Examples](#examples)

## Features

### Report Management

- Create and manage reports
- Multiple report types (user activity, recipe analytics, meal plan insights, etc.)
- Customizable parameters and filters
- Scheduled report execution
- Export to various formats (JSON, CSV, PDF, Excel, HTML)

### Templates

- Reusable report templates
- Template versioning
- Customizable layouts and styling
- Parameter validation
- Preview functionality

### Dashboards

- Interactive dashboards
- Multiple widget types
- Real-time updates
- Sharing and permissions
- Custom layouts (grid, flex, custom)

### Alerts

- Condition-based alerts
- Multiple notification channels (email, webhook, Slack, SMS)
- Alert testing and validation
- Incident tracking and resolution
- Escalation policies

### Analytics

- Usage metrics
- Performance monitoring
- Resource utilization tracking
- Error rate analysis
- Trend analysis

## Architecture

### Core Components

1. **Types (`/types/index.ts`, `/types/reporting.ts`)**
   - Report types and interfaces
   - MongoDB document interfaces
   - Type definitions for all domain entities

2. **Validation (`/validation/ReportingValidator.ts`)**
   - Request validation rules
   - Data integrity checks
   - Parameter validation

3. **Service Interface (`/interfaces/IReportingService.ts`)**
   - Comprehensive service contract
   - Type-safe method definitions
   - Clear separation of concerns

4. **External Service (`/services/ExternalReportingService.ts`)**
   - Implementation of IReportingService
   - Integration with external reporting system
   - Resilient HTTP client usage

5. **API Routes (`/api/reporting/route.ts`, `/api/reporting/execute/route.ts`)**
   - RESTful endpoints
   - Authentication and authorization
   - Error handling
   - Request/response processing

### SOLID Principles Implementation

1. **Single Responsibility Principle**
   - Each class has a focused purpose
   - Separate validators for different entities
   - Dedicated service for reporting functionality

2. **Open/Closed Principle**
   - Extensible report types
   - Pluggable notification channels
   - Customizable dashboard widgets

3. **Liskov Substitution Principle**
   - Consistent service interface
   - Proper type inheritance
   - Standardized error handling

4. **Interface Segregation Principle**
   - Focused interfaces
   - Clear method contracts
   - Specific validation rules

5. **Dependency Inversion Principle**
   - Service abstraction
   - External service integration
   - Container-based dependency management

## Usage

### Creating a Report

```typescript
const reportingService =
	Container.getInstance().getService<IReportingService>('reportingService');

const report = await reportingService.createReport({
	userId: 'user123',
	name: 'Monthly Recipe Analytics',
	description: 'Analysis of recipe usage and ratings',
	type: 'recipe_analytics',
	format: 'pdf',
	schedule: {
		frequency: 'monthly',
		startDate: new Date(),
		timezone: 'UTC',
	},
	parameters: {
		dateRange: {
			start: new Date('2024-01-01'),
			end: new Date('2024-01-31'),
		},
		filters: {
			minRating: 4,
			cuisine: ['italian', 'mexican'],
		},
	},
});
```

### Setting Up a Dashboard

```typescript
const dashboard = await reportingService.createDashboard({
	name: 'Recipe Performance',
	description: 'Key metrics for recipe engagement',
	layout: {
		type: 'grid',
		config: { columns: 3 },
		widgets: [
			{
				id: 'w1',
				type: 'chart',
				reportId: 'report123',
				position: { x: 0, y: 0, width: 2, height: 1 },
				config: {
					chartType: 'line',
					metrics: ['views', 'saves', 'ratings'],
				},
			},
		],
	},
	sharing: {
		public: false,
		roles: ['admin', 'analyst'],
		users: [],
	},
});
```

### Creating an Alert

```typescript
const alert = await reportingService.createAlert({
	reportId: 'report123',
	name: 'High Error Rate Alert',
	description: 'Alert when recipe API error rate exceeds threshold',
	conditions: [
		{
			metric: 'error_rate',
			operator: 'gt',
			value: 5,
			timeframe: {
				duration: 5,
				unit: 'minutes',
			},
		},
	],
	notifications: [
		{
			type: 'email',
			recipients: ['admin@mealprep360.com'],
			template: 'error_alert',
		},
		{
			type: 'slack',
			recipients: ['#alerts'],
			config: {
				channel: 'monitoring',
			},
		},
	],
	schedule: {
		frequency: '5m',
		timezone: 'UTC',
		active: true,
	},
});
```

## API Endpoints

### Reports

- `POST /api/reporting` - Create a new report
- `GET /api/reporting` - List reports
- `PUT /api/reporting` - Update a report
- `DELETE /api/reporting` - Delete a report

### Report Execution

- `POST /api/reporting/execute` - Execute a report
- `GET /api/reporting/execute` - Get execution status
- `PUT /api/reporting/execute` - Retry execution
- `DELETE /api/reporting/execute` - Cancel execution

## Data Types

### Report Types

```typescript
type ReportType =
	| 'user_activity'
	| 'recipe_analytics'
	| 'meal_plan_insights'
	| 'shopping_trends'
	| 'nutrition_analysis'
	| 'cost_analysis'
	| 'engagement_metrics'
	| 'system_health';
```

### Report Formats

```typescript
type ReportFormat = 'json' | 'csv' | 'pdf' | 'excel' | 'html' | 'dashboard';
```

### Report Frequencies

```typescript
type ReportFrequency =
	| 'realtime'
	| 'hourly'
	| 'daily'
	| 'weekly'
	| 'monthly'
	| 'quarterly'
	| 'yearly'
	| 'once';
```

## Examples

### Generating a Recipe Analytics Report

```typescript
// Create a report template
const template = await reportingService.createTemplate({
  name: 'Recipe Performance Analysis',
  description: 'Comprehensive analysis of recipe engagement and ratings',
  type: 'recipe_analytics',
  format: 'dashboard',
  definition: {
    dataSources: [
      {
        type: 'database',
        config: {
          collection: 'recipes',
          metrics: ['views', 'ratings', 'saves'],
          dimensions: ['cuisine', 'difficulty', 'prepTime']
        }
      }
    ],
    layout: {
      sections: [
        {
          id: 'overview',
          type: 'metrics',
          content: {
            metrics: ['totalViews', 'avgRating', 'totalSaves']
          }
        },
        {
          id: 'trends',
          type: 'chart',
          content: {
            chartType: 'line',
            metrics: ['views', 'saves'],
            timeframe: 'last_30_days'
          }
        }
      ]
    }
  }
});

// Execute report with template
const execution = await reportingService.executeReport(template.id, {
  dateRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-01-31')
  },
  filters: {
    cuisine: ['italian', 'mexican'],
    minRating: 4
  }
});

// Export results
const export = await reportingService.exportReport(execution.id, 'pdf', {
  filters: {
    metrics: ['views', 'ratings', 'saves'],
    limit: 100
  }
});
```

### Setting Up Real-time Monitoring

```typescript
// Create performance monitoring dashboard
const dashboard = await reportingService.createDashboard({
	name: 'System Health Monitor',
	description: 'Real-time monitoring of system performance',
	layout: {
		type: 'grid',
		config: { columns: 4 },
		widgets: [
			{
				id: 'errors',
				type: 'counter',
				position: { x: 0, y: 0, width: 1, height: 1 },
				config: {
					metric: 'error_rate',
					threshold: 5,
					alert: true,
				},
			},
			{
				id: 'latency',
				type: 'gauge',
				position: { x: 1, y: 0, width: 1, height: 1 },
				config: {
					metric: 'avg_response_time',
					max: 1000,
					units: 'ms',
				},
			},
		],
	},
	settings: {
		refreshInterval: 30,
		theme: 'dark',
		interactivity: {
			drilldown: true,
			filters: true,
			export: true,
		},
	},
});

// Set up alerts
const alert = await reportingService.createAlert({
	reportId: dashboard.id,
	name: 'Performance Degradation',
	conditions: [
		{
			metric: 'error_rate',
			operator: 'gt',
			value: 5,
		},
		{
			metric: 'avg_response_time',
			operator: 'gt',
			value: 1000,
		},
	],
	notifications: [
		{
			type: 'slack',
			recipients: ['#alerts'],
			template: 'performance_alert',
		},
	],
});
```
