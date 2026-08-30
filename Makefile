# Single-command deploy for the subject / eval sheet: `make`
# Detect Compose v2 plugin first, then the v1 binary.

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || true)
ifeq ($(strip $(COMPOSE)),)
COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || true)
endif
DEV_COMPOSE := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: all up empty down logs ps restart re clean fclean help prepare-env db seed

all: up

help:
	@echo "make          Build and start the eval stack (HTTPS at https://localhost)"
	@echo "make up       Same as make"
	@echo "make empty    Same as make, but migrate only — no sample users/events"
	@echo "make db       Start only Postgres on localhost:5432 (daily Daphne + Vite)"
	@echo "make seed     Reset the database to the committed snapshot"
	@echo "make down     Stop containers (keeps volumes)"
	@echo "make logs     Follow container logs"
	@echo "make ps       Show container status"
	@echo "make restart  Restart running containers"
	@echo "make re       Clean containers, rebuild images, and start"
	@echo "make clean    Stop/remove containers (keeps volumes)"
	@echo "make fclean   Stop/remove containers AND delete all Compose volumes"
	@echo "make prepare-env  Create .env and generate SECRET_KEY if needed"

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
	$(COMPOSE) up -d
	@echo "Application is starting at https://localhost"
	@echo "Accept the self-signed certificate warning in the browser if prompted."

empty: prepare-env
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	@echo "Using: $(COMPOSE) (no sample data)"
	NO_SEED=1 $(COMPOSE) up -d
	@echo "Application is starting at https://localhost (empty database, no sample data)"
	@echo "Accept the self-signed certificate warning in the browser if prompted."

db: prepare-env
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	$(DEV_COMPOSE) up -d db
	@echo "Waiting for Postgres on localhost:5432..."
	@i=0; \
	until $(DEV_COMPOSE) exec -T db pg_isready -U postgres >/dev/null 2>&1; do \
		i=$$((i+1)); \
		if [ $$i -ge 30 ]; then echo "Postgres did not become ready." >&2; exit 1; fi; \
		sleep 1; \
	done
	@echo "Postgres is ready on localhost:5432"

seed: prepare-env
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed." >&2; \
		exit 1; \
	fi
	@running=$$($(COMPOSE) ps -q --status running backend 2>/dev/null || true); \
	if [ -n "$$running" ]; then \
		$(COMPOSE) exec backend python manage.py seed_eval --flush; \
	else \
		$(MAKE) db; \
		$(COMPOSE) run --rm --no-deps --entrypoint python backend manage.py seed_eval --flush; \
	fi

# Stop and REMOVE the containers, but keep named/anonymous volumes.
# This is the non-destructive cleanup used by `make re`.
clean:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	$(COMPOSE) down
	@echo "Containers removed. Volumes were kept."

# Stop/remove containers AND remove Compose-managed volumes.
# Use this when you explicitly want to reset persistent data.
fclean:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	$(COMPOSE) down -v
	@echo "Containers and Compose volumes removed."

down:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

restart:
	$(COMPOSE) restart

# Rebuild images from scratch after removing the old containers.
# Volumes are preserved, so database/media data survives.
re: clean
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi
	@echo "Rebuilding images..."
	$(COMPOSE) build --no-cache
	$(MAKE) up
