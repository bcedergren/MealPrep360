# Archive

This folder contains legacy and archived files that are no longer actively used but kept for reference.

## Contents

### legacy-services/
Old service implementations that have been replaced by the current microservices architecture in the main MealPrep360-* folders. These services include:
- api-gateway (legacy)
- content-service
- planning-service
- freezer-service
- label-service
- optimizer-service

**Note:** These have been replaced by the current service implementations:
- MealPrep360-API (current API Gateway)
- MealPrep360-BlogService (replaces content-service)
- MealPrep360-MealPlanService (replaces planning-service)
- And other current services

### legacy-data/
Historical data files including:
- CSV files (ingredients, products, recipes, etc.)
- ZIP bundles of old service implementations
- Legacy to-do lists and backlogs
- OpenAPI specifications

## When to Use

These files are kept for:
- Historical reference
- Migration verification
- Understanding evolution of the codebase
- Backup purposes

## Cleanup

If you're certain these files are no longer needed, they can be safely removed. However, it's recommended to keep them for at least one major version cycle after migration.

---

Last archived: {{ current_date }}

