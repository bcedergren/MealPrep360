# Content Service (scaffold)

Run locally:

- npm ci
- npm run dev
- npm run worker (for demo worker)

Endpoints (protected by JWT):

- POST /content/blog/outline
- POST /content/blog/draft
- GET /content/jobs/:id
- GET /healthz

Notes:

- This is a stubbed implementation with in-memory jobs. Replace with durable queue and Clerk JWT verification.
