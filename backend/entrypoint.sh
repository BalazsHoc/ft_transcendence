#!/bin/sh
set -eu

python - <<'PY'
import os
import sys
import time

import psycopg2

host = os.environ.get("POSTGRES_HOST", "db")
port = os.environ.get("POSTGRES_PORT", "5432")
name = os.environ.get("POSTGRES_DB", "transcendence")
user = os.environ.get("POSTGRES_USER", "postgres")
password = os.environ.get("POSTGRES_PASSWORD", "postgres")

last_error = None
for _ in range(30):
    try:
        connection = psycopg2.connect(
            host=host,
            port=port,
            dbname=name,
            user=user,
            password=password,
        )
        connection.close()
        sys.exit(0)
    except Exception as exc:  # noqa: BLE001 - retry until Postgres is up
        last_error = exc
        time.sleep(1)

sys.stderr.write(f"Postgres did not become ready at {host}:{port}: {last_error}\n")
sys.exit(1)
PY

python manage.py migrate --noinput
python manage.py collectstatic --noinput
python manage.py seed_eval

exec daphne -b 0.0.0.0 -p 8000 core.asgi:application
