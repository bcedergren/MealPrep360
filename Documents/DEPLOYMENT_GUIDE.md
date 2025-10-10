# MealPrep360 Deployment Guide

## Prerequisites

- Docker installed
- Kubernetes cluster access
- kubectl configured
- GHCR_PAT secret for GitHub Container Registry

## Build and Push Images

```
docker build -t ghcr.io/mealprep360/planning-service:dev ./services/planning-service
docker push ghcr.io/mealprep360/planning-service:dev

docker build -t ghcr.io/mealprep360/content-service:dev ./services/content-service
docker push ghcr.io/mealprep360/content-service:dev

docker build -t ghcr.io/mealprep360/api-gateway:dev ./services/api-gateway
docker push ghcr.io/mealprep360/api-gateway:dev
```

## Deploy to Kubernetes

```
kubectl apply -f services/planning-service/k8s/
kubectl apply -f services/content-service/k8s/
kubectl apply -f services/api-gateway/k8s/
```

## Monitor Rollout

- Check health endpoints:
  - `/healthz` on each service
- Review logs for errors and latency spikes

## Rollback

- Use `kubectl rollout undo deployment/<service-name>` if needed

---

**Next:**

- Validate deployment in dev/staging.
- Prepare for production rollout.
- Monitor and optimize performance.
