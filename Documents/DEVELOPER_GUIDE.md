# MealPrep360 Developer Guide

## Getting Started

1. Clone the repository and install dependencies:

   ```
   git clone <repo-url>
   cd MealPrep360
   npm ci
   ```

2. Run services locally:
   ```
   npm run dev
   ```

## Service Endpoints

- **Planning Service**
  - `POST /planning/plan`
  - `POST /planning/smart-list`
- **Content Service**
  - `POST /content/blog/outline`
  - `POST /content/blog/draft`
  - `GET /content/jobs/:id`
- **API Gateway**
  - Proxies all above endpoints
  - Stubs for `/optimizer/cart`, `/labels/print`, `/freezer/scan`

## Authentication

- All endpoints require JWT (Clerk) in the `Authorization` header.

## Testing

- Run unit tests:
  ```
  npm test
  ```

## Deployment

- See `k8s/` for Kubernetes manifests.
- Use provided GitHub Actions workflows for CI/CD.

---

For user guides, create a similar file (e.g., `USER_GUIDE.md`) with instructions for using the application.
