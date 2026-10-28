#!/usr/bin/env bash
# One-time setup of the Firestore database that holds form entries, admin codes and the audit log.
# Run it yourself after `gcloud auth login`. It does not touch the Cloud Run service's code.
#   scripts/setup-firestore.sh            create the database and grant access (nothing is switched on)
#   scripts/setup-firestore.sh --switch   also point the live service at it (DATA_STORE=firestore)
set -euo pipefail
PROJECT="nexus-501421"; REGION="us-central1"; SERVICE="radiant-nexus-site"; DB="radiant-site"
gcloud config set project "$PROJECT" >/dev/null
gcloud services enable firestore.googleapis.com
if ! gcloud firestore databases describe --database="$DB" >/dev/null 2>&1; then
  gcloud firestore databases create --database="$DB" --location="$REGION" --type=firestore-native --delete-protection --enable-pitr
else
  gcloud firestore databases update --database="$DB" --delete-protection --enable-pitr
fi
SA="$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(spec.template.spec.serviceAccountName)')"
if [ -z "$SA" ]; then SA="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')-compute@developer.gserviceaccount.com"; fi
gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$SA" --role="roles/datastore.user" --condition=None >/dev/null
echo "Database $DB ready. $SA can read and write it."
if [ "${1:-}" = "--switch" ]; then
  gcloud run services update "$SERVICE" --region "$REGION" --update-env-vars "DATA_STORE=firestore,FIRESTORE_DATABASE=$DB"
  echo "Live service now stores everything in Firestore."
fi
