# Single-command deploy for the subject: `make` starts the full Docker stack.
MAKEFLAGS += --no-print-directory

# ---------------------------------------------------------------------------
# Tools
# Pick Docker Compose (v2 plugin preferred, then v1 binary).
# ---------------------------------------------------------------------------

COMPOSE := $(shell docker compose version >/dev/null 2>&1 && echo "docker compose" || true)
ifeq ($(strip $(COMPOSE)),)
COMPOSE := $(shell command -v docker-compose >/dev/null 2>&1 && echo "docker-compose" || true)
endif

DEV_COMPOSE := $(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml
Q := >/dev/null 2>&1

.PHONY: all help require-compose prepare-env \
	up empty db seed \
	logs ps restart \
	down clean fclean re \
	test-eval

all: up

# ---------------------------------------------------------------------------
# Help
# List available make targets.
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
	@echo "  make test-eval  run the eval tester (ARGS=...)"

# ---------------------------------------------------------------------------
# Setup
# Make sure Compose exists and .env is ready before starting services.
# ---------------------------------------------------------------------------

require-compose:
	@if [ -z "$(COMPOSE)" ]; then \
		echo "Docker Compose is not installed. Install docker compose or docker-compose." >&2; \
		exit 1; \
	fi

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
# Start
# Bring the stack (or just the database) up.
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
# Inspect
# Look at running containers and their logs.
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
# Stop / reset
# Stop the stack, or wipe volumes / rebuild from scratch.
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

# ---------------------------------------------------------------------------
# Tests
# Run the evaluation tester.
# ---------------------------------------------------------------------------

test-eval:
	@echo "Running eval tester..."
	@bash tester/run.sh $(ARGS)
