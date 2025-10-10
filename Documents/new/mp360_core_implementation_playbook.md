# MP360 — Core Implementation Playbook (for Copilot)

**Purpose:** Implement the Batch Day core flow end‑to‑end and wire the new Content Service. This document gives Copilot precise, commit-ready steps with file paths, commands, environment, and success checks.

> **Outcome** (v1): `/planning/plan → /planning/smart-list → /labels/print → /freezer/scan` works in **dev** from the web UI; content-service is scaffolded and deployable behind `/content/*`.

---

## 0. Assumptions
- Monorepo structure per README with `services/`, `k8s/`, `docker-compose*.yml`, `frontend/` (Next.js), `api-gateway/`.
- Auth = **Clerk** (JWT at gateway → forwarded downstream).
- Datastores: **MongoDB** (existing), **Redis** (existing). Optional Postgres comes later.
- We have two artifact bundles available locally:
  - `refactor_bundle.zip` (planning-service scaffold, k8s, CI)
  - `content_service_bundle_full.zip` (content-service fully wired)

> If either zip is missing, skip that step and create equivalent files from the snippets below.

---

## 1. Create feature branch
```bash
git checkout -b feature/batch-day-core
```

---

## 2. Add Planning Service (merge meal-plan + shopping)
**Goal:** new service at `services/planning-service` with two endpoints.

### 2.1. Place scaffold
- If you have `refactor_bundle.zip`, extract `services/planning-service/` into the repo root.
- Otherwise, create files per the definitions in this document.

### 2.2. Local run
```bash
cd services/planning-service
npm ci
npm run dev
curl -s localhost:4010/healthz
```

### 2.3. K8s (dev)
Add deployment/service as needed (sample exists in bundle under `services/planning-service/k8s/`).

---

## 3. API Gateway routes (dev)
Update your gateway (NGINX/Express/Nest) to proxy to planning-service:
```
POST /planning/plan          → planning-service
POST /planning/smart-list    → planning-service
```
Also prep routes for later services (they can be stubbed today):
```
POST /optimizer/cart         → optimizer-service
POST /labels/print           → label-service
POST /freezer/scan           → freezer-service
```
**Timeouts:** 5s to optimizer; 3s to pricing; 2–3s others.  
**Rate limits:** `/freezer/scan` 10 rps/IP, `/pricing/*` 5 rps/IP.

---

## 4. Frontend: temporary Batch Day flow
Create a hidden page to exercise the chain. Use the `batch-day.tsx` template provided.

---

## 5. Stubs for Optimizer/Label/Freezer (to unblock UX)
Implement minimal handlers in their services or in the gateway to return successful canned responses today.

Replace stubs with real services in Sprint 2.

---

## 6. Content Service (keep separate) — Wire now, use later
**Goal:** `/content/*` endpoints available, worker running; protected by Clerk.

### 6.1. Place bundle
Unzip `content_service_bundle_full.zip` at repo root → `services/content-service/`.

### 6.2. Run locally
```bash
cd services/content-service
npm ci
npm run dev           # API :4020
npm run worker        # Worker (separate shell)
```

### 6.3. Gateway routes
```
POST /content/blog/outline → content-service
POST /content/blog/draft   → content-service
GET  /content/jobs/:id     → content-service
```

### 6.4. Env template (K8s Secret)
**`services/content-service/k8s/secret-example.yaml`** already provided. Fill real values and apply.

---

## 7. Observability (minimal today)
- Each new service exposes `GET /healthz`.
- Add request logging with latency at gateway & service (pino added in content-service).
- Create alerts (dev can be logs-only): 5xx rate and p95 latency spikes.

---

## 8. Security
- Verify Clerk audience/issuer at gateway and services (env: `CLERK_ISSUER`, `CLERK_AUDIENCE`).
- Add basic **NetworkPolicies** so only gateway can call services (manifests provided in bundles).
- Rate-limit hot endpoints as above.

---

## 9. CI/CD
- Add or verify GitHub Actions workflows for planning-service and content-service (bundles include sample `.github/workflows/*.yml`).
- Set `GHCR_PAT` in repo secrets if publishing images to GHCR.

---

## 10. Dev validation checklist
- `curl /planning/plan` and `/planning/smart-list` return 200s with JWT.
- Frontend page `/batch-day` runs end‑to‑end and surfaces JSON results.
- Content-service outline endpoint returns 200 with Clerk JWT; worker logs show job processing when drafting.
- Ingress routes exist and hit correct services (check gateway logs).

---

## 11. Rollout plan (dev → staging → prod)
1. **Dev:** Deploy planning-service & content-service, add routes, validate `/batch-day`.
2. **Staging:** Enable real optimizer/label/freezer services; remove stubs; add dashboards.
3. **Prod (dark):** Keep Batch Day behind a feature flag; release to internal testers, then public.

---

## 12. Future Sprint (Upgrade stubs → real)
- Implement **optimizer-service** (greedy + repair) with OpenAPI and tests.
- Implement **label-service** (Avery PDF + QR) with S3 pre-signed URLs.
- Implement **freezer-service** (state machine + label scan) with persistence.
- Add **thaw scheduler** CronJob and push notifications.

---

## 13. Commands cheat sheet
```bash
# Planning service
cd services/planning-service && npm ci && npm run dev

# Content service API and worker
cd services/content-service && npm ci && npm run dev
cd services/content-service && npm run worker

# K8s apply (dev namespace assumed)
kubectl apply -f services/planning-service/k8s/
kubectl apply -f services/content-service/k8s/
```

---

## 14. Success criteria (definition of done)
- From the web UI, I can:
  1) Generate a plan (200 OK)
  2) Generate a smart shopping list (200 OK)
  3) (Stub) Print labels (URL returns)
  4) (Stub) Scan freezer state (state advances)
- Traces/logs show requests traversing gateway → services with p95 < 500ms (stubs) and no 5xx spikes.
- Content-service responds on `/content/blog/outline` and processes `/content/blog/draft` jobs.

---

## 15. Notes for Copilot
- Prefer small atomic commits per step (gateway routes, planning-service boot, frontend page, etc.).
- Add `GET /healthz` first, verify readiness/liveness before wiring business endpoints.
- Guard new UI behind a feature flag or dev-only route.
- Do not change existing services other than the gateway mappings.

*End of Playbook*
