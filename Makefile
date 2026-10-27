# ---------------------------------------------------------------------------
# News Intelligence Platform - developer entry points.
#
#   make            # list all targets
#   make up         # start the development stack
#   make smoke      # check the health endpoints
#
# Requirements:
#   - Every target below is a plain command: you can always copy/paste it
#     directly if `make` is not installed (Windows PowerShell users: see README,
#     PowerShell 5.1 has no `&&` - use `;` between commands).
#   - Docker targets need Docker Desktop (Compose v2).
#   - Host-side targets (test/lint/...) need Python 3.13 (backend/.venv) and
#     Node 24+ (frontend/node_modules), see README "Host development".
# ---------------------------------------------------------------------------

# Python used for host-side backend commands. On Windows after
# `backend\.venv\Scripts\activate`, plain `python` also works:
PYTHON ?= python3
BACKEND_URL ?= http://localhost:8001

.DEFAULT_GOAL := help

.PHONY: help env up down restart ps logs smoke curl \
        prod-up prod-down prod-logs prod-smoke \
        test lint fmt fmt-check typecheck frontend-lint frontend-build check \
        migrate makemigrations

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-18s %s\n", $$1, $$2}'

env: ## Create .env from .env.example (once)
	@test -f .env || cp .env.example .env
	@test -f .env && echo ".env is present (never committed - see .gitignore)"

# --- Development stack ------------------------------------------------------

up: ## Build and start the development stack (detached)
	docker compose up --build -d

down: ## Stop the development stack (keeps database data)
	docker compose down

restart: ## Restart backend, worker and beat (code is bind-mounted)
	docker compose restart backend worker beat

ps: ## Show service status and health
	docker compose ps

logs: ## Follow all logs (Ctrl+C to stop)
	docker compose logs -f

smoke: ## Hit all health endpoints (BACKEND_URL=... to override)
	backend/.venv/bin/python scripts/smoke_test.py --base-url $(BACKEND_URL) 2>/dev/null \
		|| backend/.venv/Scripts/python.exe scripts/smoke_test.py --base-url $(BACKEND_URL)

curl: ## Minimal health check with curl only
	curl -fsS $(BACKEND_URL)/api/v1/health/ && echo

# --- Production-style stack -------------------------------------------------

prod-up: ## Start the production-style stack (needs real DJANGO_SECRET_KEY)
	docker compose -f compose.production.yaml up --build -d

prod-down: ## Stop the production-style stack (add -v via command to drop data)
	docker compose -f compose.production.yaml down

prod-logs: ## Follow production-style logs
	docker compose -f compose.production.yaml logs -f

prod-smoke: ## Health endpoints through the production nginx (port 8080)
	backend/.venv/bin/python scripts/smoke_test.py --base-url http://localhost:8080 2>/dev/null \
		|| backend/.venv/Scripts/python.exe scripts/smoke_test.py --base-url http://localhost:8080

# --- Host-side quality gates ------------------------------------------------

test: ## Backend tests (pytest, uses sqlite - no Docker needed)
	cd backend && $(PYTHON) -m pytest

lint: ## Backend: ruff lint
	cd backend && $(PYTHON) -m ruff check .

fmt: ## Backend: ruff format (rewrites files)
	cd backend && $(PYTHON) -m ruff format .

fmt-check: ## Backend: ruff format --check (CI-style, no writes)
	cd backend && $(PYTHON) -m ruff format --check .

typecheck: ## Frontend: TypeScript (tsc --noEmit)
	cd frontend && npm run typecheck

frontend-lint: ## Frontend: ESLint
	cd frontend && npm run lint

frontend-build: ## Frontend: production build (vite build)
	cd frontend && npm run build

check: lint fmt-check test typecheck frontend-lint ## Run every quality gate
	@echo "All quality gates passed."
