#!/usr/bin/env bash
# Deploy the Hydra website and its small form backend to the existing Cloud Run service.
# Run once on a new machine: gcloud auth login
set -euo pipefail

PROJECT="nexus-501421"
REGION="us-central1"
SERVICE="radiant-nexus-site"
# Cloudflare Turnstile bot check on the forms. The site key is public; the secret key lives in
# Secret Manager as turnstile-secret-key. Until both exist the forms run without the check.
TURNSTILE_SITE_KEY="0x4AAAAAAGVeWdPUJ_RHow2B"

gcloud config set project "$PROJECT"

EXTRA_ENV=""; EXTRA_SECRETS=""
if [ -n "$TURNSTILE_SITE_KEY" ] && gcloud secrets describe turnstile-secret-key --project "$PROJECT" >/dev/null 2>&1; then
  EXTRA_ENV=";TURNSTILE_SITE_KEY=$TURNSTILE_SITE_KEY"; EXTRA_SECRETS=",TURNSTILE_SECRET_KEY=turnstile-secret-key:latest"
  echo "Turnstile bot check: on"
else
  echo "Turnstile bot check: OFF (set TURNSTILE_SITE_KEY above and create the turnstile-secret-key secret)"
fi

# Build & deploy from source (Cloud Build handles the Dockerfile above)
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --max-instances 3 \
  --set-env-vars "^;^NODE_ENV=production;ALLOWED_ORIGINS=https://radiantinnovatech.com,https://www.radiantinnovatech.com;DATA_STORE=firestore;FIRESTORE_DATABASE=radiant-site;ADMIN_EMAILS=samuelmaclar@radiantinnovatech.com,christiandwamena@radiantinnovatech.com;EARLY_ACCESS_ENABLED=true;FORMS_ENABLED=true$EXTRA_ENV" \
  --set-secrets "JWT_SECRET=jwt-secret:latest,BREVO_API_KEY=brevo-api-key:latest$EXTRA_SECRETS"

# The custom domain is already mapped. Do not recreate the mapping during a release.
