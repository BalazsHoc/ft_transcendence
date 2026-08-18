#!/bin/sh
set -eu

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
fi

generate_secret() {
    if command -v python3 >/dev/null 2>&1; then
        python3 -c 'import secrets; print(secrets.token_urlsafe(50))'
    elif command -v openssl >/dev/null 2>&1; then
        openssl rand -base64 48 | tr -d '\n='
    else
        echo "Need python3 or openssl to generate SECRET_KEY." >&2
        exit 1
    fi
}

current_key=$(awk -F= '/^SECRET_KEY=/{print substr($0, index($0,"=")+1); exit}' .env)
case "$current_key" in
    ''|change-me-in-production|dev-secret-key)
        new_key=$(generate_secret)
        tmp=$(mktemp)
        awk -v key="$new_key" 'BEGIN{done=0} /^SECRET_KEY=/{print "SECRET_KEY=" key; done=1; next} {print} END{if(!done) print "SECRET_KEY=" key}' .env > "$tmp"
        mv "$tmp" .env
        echo "Wrote a new SECRET_KEY to .env"
        ;;
esac

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
