#!/usr/bin/env bash
# Put the site on its own private preview URL (Cloud Run service hydra-site-preview).
# Never touches the live service or radiantinnovatech.com. Needs: gcloud auth login.
# Usage: scripts/deploy-preview.sh        (prints the URL and the password)
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT="nexus-501421"; REGION="us-central1"; SERVICE="hydra-site-preview"
PASS="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
JWT="$(openssl rand -hex 32)"
gcloud run deploy "$SERVICE" --project "$PROJECT" --region "$REGION" --source . \
  --allow-unauthenticated --max-instances 1 \
  --set-env-vars "NODE_ENV=production,PREVIEW_PASSWORD=$PASS,JWT_SECRET=$JWT"
URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format='value(status.url)')"
echo; echo "Preview: $URL"; echo "User name: anything   Password: $PASS"
