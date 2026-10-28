#!/usr/bin/env bash
# Deploy the Hydra website and its small form backend to the existing Cloud Run service.
# Run once on a new machine: gcloud auth login
set -euo pipefail

PROJECT="nexus-501421"
REGION="us-central1"
SERVICE="radiant-nexus-site"

gcloud config set project "$PROJECT"

# Build & deploy from source (Cloud Build handles the Dockerfile above)
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --max-instances 3 \
  --set-env-vars "^;^NODE_ENV=production;ALLOWED_ORIGINS=https://radiantinnovatech.com,https://www.radiantinnovatech.com;DATA_STORE=firestore;FIRESTORE_DATABASE=radiant-site;ADMIN_EMAILS=samuelmaclar@radiantinnovatech.com,christiandwamena@radiantinnovatech.com" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,BREVO_API_KEY=brevo-api-key:latest"

# The custom domain is already mapped. Do not recreate the mapping during a release.
