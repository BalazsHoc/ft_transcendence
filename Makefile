# Single-command deploy for the subject / eval sheet: `make`
# Detect Compose v2 plugin first, then the v1 binary.

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || true)
ifeq ($(strip $(COMPOSE)),)
COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || true)
endif

.PHONY: all up down logs ps restart re clean help prepare-env

all: up

help:
	@echo "make          Build and start the stack (eval command)"
	@echo "make up       Same as make"
	@echo "make down     Stop containers (keeps sqlite and media)"
	@echo "make logs     Follow container logs"
	@echo "make ps       Show container status"
	@echo "make restart  Restart running containers"
	@echo "make re       down then up"
	@echo "make clean    Stop containers and remove generated static volume"

prepare-env:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example"; fi
	@current_key=$$(awk -F= '/^SECRET_KEY=/{print substr($$0, index($$0,"=")+1); exit}' .env); \
	case "$$current_key" in \
		""|change-me-in-production|dev-secret-key) \
			if command -v python3 >/dev/null 2>&1; then \
				new_key=$$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))'); \
			elif command -v openssl >/dev/null 2>&1; then \
				new_key=$$(openssl rand -base64 48 | tr -d '\n='); \
			else \
				echo "Need python3 or openssl to generate SECRET_KEY." >&2; \
				exit 1; \
			fi; \
			tmp=$$(mktemp); \
			awk -v key="$$new_key" 'BEGIN{done=0} /^SECRET_KEY=/{print "SECRET_KEY=" key; done=1; next} {print} END{if(!done) print "SECRET_KEY=" key}' .env > "$$tmp"; \
			mv "$$tmp" .env; \
			echo "Wrote a new SECRET_KEY to .env" ;; \
	esac

up: prepare-env
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	@echo "Using: $(COMPOSE)"
	$(COMPOSE) up --build -d
	@echo "Application is starting at https://localhost"
	@echo "Accept the self-signed certificate warning in the browser if prompted."

down:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed." >&2; \
		exit 1; \
	fi
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart

re: down up

clean: down
	@if [ -n "$(COMPOSE)" ]; then $(COMPOSE) down -v; fi
	@echo "Containers stopped. backend/db.sqlite3 and media files are kept."
