#!/usr/bin/env bash
# Deploy Radiant Nexus site+backend to Cloud Run and map it to radiantinnovatech.com
# Run once: gcloud auth login
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
  --set-env-vars "^;^NODE_ENV=production;ALLOWED_ORIGINS=https://radiantinnovatech.com,https://www.radiantinnovatech.com" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,SMTP_USER=smtp-user:latest,SMTP_PASS=smtp-pass:latest"

# One-time: map the custom domain (prints DNS records you add at your registrar)
gcloud beta run domain-mappings create \
  --service "$SERVICE" \
  --domain radiantinnovatech.com \
  --region "$REGION"
