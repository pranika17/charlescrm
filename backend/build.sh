#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

if [[ -n "$ADMIN_EMAIL" && -n "$ADMIN_PASSWORD" ]]; then
  python manage.py ensure_admin --email "$ADMIN_EMAIL" --password "$ADMIN_PASSWORD" --full-name "${ADMIN_FULL_NAME:-CharlesCRM Admin}"
fi
