#!/bin/sh
set -eu

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "Docker Compose is not installed. Install the Compose plugin (docker compose) or docker-compose." >&2
    exit 1
fi

echo "Using: $COMPOSE"
$COMPOSE up --build -d
echo "Application is starting at https://localhost"
echo "Accept the self-signed certificate warning in the browser if prompted."
