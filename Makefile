# =============================================================================
# Makefile — one place to start / stop / reset the whole Docker project.
#
# Idea: instead of typing long docker compose commands, you run simple targets
# like `make`, `make down`, or `make fclean`. Everything below just wraps
# Docker Compose so the stack is easy to launch on evaluation day.
#
# =============================================================================

# ---------------------------------------------------------------------------
# here we decide whether to use docker compose or docker-compose
# ---------------------------------------------------------------------------

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || true)
ifeq ($(strip $(COMPOSE)),)
COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || true)
endif

# ---------------------------------------------------------------------------
# here we define the compose command and the quiet flag
# ---------------------------------------------------------------------------

DEV_COMPOSE := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml
Q := >/dev/null 2>&1

# ---------------------------------------------------------------------------
# Declared targets + default
#
# prepare-env: create .env from .env.example if needed
# require-compose: fail early with a clear message if Compose is missing.
# ---------------------------------------------------------------------------

.PHONY: all help require-compose prepare-env \
	up empty db seed \
	logs ps restart \
	down clean fclean re

all: up

# ---------------------------------------------------------------------------
# Help — print what each make target does
#
# Run `make help` if you forget which command starts, stops, or resets things.
# ---------------------------------------------------------------------------

help:
	@echo "Targets:"
	@echo "  make            build and start the stack (with seed)"
	@echo "  make up         same as make"
	@echo "  make empty      wipe volumes, start without seed"
	@echo "  make db         postgres on localhost:5432"
	@echo "  make seed       reset the eval snapshot"
	@echo "  make down       stop containers, keep volumes"
	@echo "  make logs       follow container logs"
	@echo "  make ps         container status"
	@echo "  make restart    restart running containers"
	@echo "  make re         no-cache rebuild and start"
	@echo "  make clean      same as down"
	@echo "  make fclean     stop containers and delete volumes"

# ---------------------------------------------------------------------------
# Setup — safety checks before we touch Docker
#
# require-compose: fail early with a clear message if Compose is missing.
# prepare-env: create .env from .env.example if needed, and replace a weak /
# placeholder SECRET_KEY with a real random one (python3 or openssl).
# ---------------------------------------------------------------------------

require-compose:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi

# ---------------------------------------------------------------------------
# prepare-env — only touches .env / SECRET_KEY (nothing else)
#
# .env.example = template (safe to commit, placeholder values)
# .env         = real settings file the app/Docker actually use
#
# What it does:
# 1) If .env is missing, copy .env.example -> .env
# 2) Read SECRET_KEY from .env
# 3) If SECRET_KEY is empty or a known weak placeholder
#    (change-me-in-production / dev-secret-key), generate a random one
#    (python3, or openssl) and write it into .env
#
# SECRET_KEY is a long random string Django uses to sign sessions, cookies,
# and other security tokens. A weak/public key is unsafe.
#
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Start — bring the app (or only the database) up
#
# up:     normal start — build/start the full stack in the background.
# empty:  wipe volumes first, then start with NO_SEED=1 (clean DB, no sample data).
# db:     start only Postgres (dev compose) and wait until it accepts connections.
# seed:   load/reset the evaluation sample data. Uses a running backend if one
#         exists; otherwise starts the DB temporarily and runs seed via compose.
# ---------------------------------------------------------------------------

up: prepare-env require-compose
	@echo "Starting stack..."
	@$(COMPOSE) up -d $(Q)

empty: prepare-env require-compose
	@echo "Starting empty stack (no seed)..."
	@$(COMPOSE) down -v $(Q)
	@$(COMPOSE) build backend $(Q)
	@NO_SEED=1 $(COMPOSE) up -d $(Q)

db: prepare-env require-compose
	@echo "Starting database..."
	@$(DEV_COMPOSE) up -d db $(Q)
	@i=0; \
	until $(DEV_COMPOSE) exec -T db pg_isready -U postgres $(Q); do \
		i=$$((i+1)); \
		if [ $$i -ge 30 ]; then echo "Postgres did not become ready." >&2; exit 1; fi; \
		sleep 1; \
	done

seed: prepare-env require-compose
	@echo "Loading sample data..."
	@running=$$($(COMPOSE) ps -q --status running backend 2>/dev/null || true); \
	if [ -n "$$running" ]; then \
		$(COMPOSE) exec -T backend python manage.py seed_eval --flush $(Q); \
	else \
		$(DEV_COMPOSE) up -d db $(Q); \
		i=0; \
		until $(DEV_COMPOSE) exec -T db pg_isready -U postgres $(Q); do \
			i=$$((i+1)); \
			if [ $$i -ge 30 ]; then echo "Postgres did not become ready." >&2; exit 1; fi; \
			sleep 1; \
		done; \
		$(COMPOSE) run --rm --no-deps --entrypoint python backend manage.py seed_eval --flush $(Q); \
	fi

# ---------------------------------------------------------------------------
# Inspect — check what is running
#
# logs:    stream container output (Ctrl+C to stop following).
# ps:      show container status like docker compose ps.
# restart: restart containers that are already up (no full rebuild).
# ---------------------------------------------------------------------------

logs: require-compose
	@echo "Following logs (Ctrl+C to stop)..."
	@$(COMPOSE) logs -f

ps: require-compose
	@echo "Container status:"
	@$(COMPOSE) ps

restart: require-compose
	@echo "Restarting containers..."
	@$(COMPOSE) restart $(Q)

# ---------------------------------------------------------------------------
# Stop / reset — shut down or wipe and rebuild
#
# down / clean: stop containers but keep Docker volumes (data stays).
# fclean:       stop containers AND delete volumes (full wipe).
# re:           stop, rebuild images with --no-cache, then start again.
# ---------------------------------------------------------------------------

down: require-compose
	@echo "Stopping stack..."
	@$(COMPOSE) down $(Q)

clean: require-compose
	@echo "Stopping stack..."
	@$(COMPOSE) down $(Q)

fclean: require-compose
	@echo "Removing containers and volumes..."
	@$(COMPOSE) down -v $(Q)

re: prepare-env require-compose
	@echo "Rebuilding stack (no cache)..."
	@$(COMPOSE) down $(Q)
	@$(COMPOSE) build --no-cache $(Q)
	@$(COMPOSE) up -d $(Q)
