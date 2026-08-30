# Single-command deploy for the subject / eval sheet: `make`
# Detect Compose v2 plugin first, then the v1 binary.

# Makefile targets — hide "Entering directory" noise from nested make calls.
MAKEFLAGS += --no-print-directory

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || true)
ifeq ($(strip $(COMPOSE)),)
COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || true)
endif
DEV_COMPOSE := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml
UI := bash scripts/make-ui.sh

.PHONY: all up empty down logs ps restart re clean fclean help prepare-env db seed test-ui

all: up

test-ui:
	@bash scripts/test-make-ui.sh

help:
	@$(UI) help "Make targets" "Available commands" -- true

prepare-env:
	@if [ ! -f .env ]; then cp .env.example .env; fi
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
			mv "$$tmp" .env ;; \
	esac

define CHECK_COMPOSE
if [ -z "$(COMPOSE)" ]; then \
	echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
	exit 1; \
fi
endef

up: prepare-env
	@$(CHECK_COMPOSE)
	@$(UI) up "Starting stack" "Building and launching services" -- $(COMPOSE) up -d

empty: prepare-env
	@$(CHECK_COMPOSE)
	@$(UI) empty "Starting empty stack" "Removing volumes and booting without seed" -- \
		bash -c '$(COMPOSE) down -v && $(COMPOSE) build backend && NO_SEED=1 $(COMPOSE) up -d'

db: prepare-env
	@$(CHECK_COMPOSE)
	@$(UI) db "Starting database" "Waiting for Postgres on port 5432" -- \
		bash -c '$(DEV_COMPOSE) up -d db && i=0; \
		until $(DEV_COMPOSE) exec -T db pg_isready -U postgres >/dev/null 2>&1; do \
			i=$$((i+1)); \
			if [ $$i -ge 30 ]; then echo "Postgres did not become ready." >&2; exit 1; fi; \
			sleep 1; \
		done'

seed: prepare-env
	@$(CHECK_COMPOSE)
	@$(UI) seed "Loading sample data" "Restoring eval snapshot" -- \
		bash -c 'running=$$($(COMPOSE) ps -q --status running backend 2>/dev/null || true); \
		if [ -n "$$running" ]; then \
			$(COMPOSE) exec -T backend python manage.py seed_eval --flush; \
		else \
			$(DEV_COMPOSE) up -d db; \
			i=0; \
			until $(DEV_COMPOSE) exec -T db pg_isready -U postgres >/dev/null 2>&1; do \
				i=$$((i+1)); \
				if [ $$i -ge 30 ]; then echo "Postgres did not become ready." >&2; exit 1; fi; \
				sleep 1; \
			done; \
			$(COMPOSE) run --rm --no-deps --entrypoint python backend manage.py seed_eval --flush; \
		fi'

clean:
	@$(CHECK_COMPOSE)
	@$(UI) clean "Removing containers" "Keeping volumes intact" -- $(COMPOSE) down

fclean:
	@$(CHECK_COMPOSE)
	@$(UI) fclean "Removing everything" "Containers and all volumes" -- $(COMPOSE) down -v

down:
	@$(CHECK_COMPOSE)
	@$(UI) down "Stopping stack" "Keeping volumes intact" -- $(COMPOSE) down

logs:
	@$(CHECK_COMPOSE)
	@MAKE_UI_STREAM=1 $(UI) logs "Opening logs" "Press Ctrl+C to exit" -- $(COMPOSE) logs -f

ps:
	@$(CHECK_COMPOSE)
	@MAKE_UI_OUTPUT=1 $(UI) ps "Checking status" "Reading container state" -- $(COMPOSE) ps

restart:
	@$(CHECK_COMPOSE)
	@$(UI) restart "Restarting services" "Recycling all containers" -- $(COMPOSE) restart

re: prepare-env
	@$(CHECK_COMPOSE)
	@$(UI) re "Rebuilding stack" "No-cache image rebuild and launch" -- \
		bash -c '$(COMPOSE) down && $(COMPOSE) build --no-cache && $(COMPOSE) up -d'
