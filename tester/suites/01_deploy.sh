#!/usr/bin/env bash
# Deployment: single-command Docker deploy, all containers healthy, app reachable.
source "$(dirname "$0")/../lib/common.sh"

t_suite "01 DEPLOYMENT — single command, containers, reachability"

# Eval sheet: "deployed with a containerization solution using a single command".
# `make` is that command. If the stack is already up we keep it (use --fast to
# force keeping it); otherwise we run `make` and time it.
running="$(compose ps -q --status running 2>/dev/null | wc -l)"
if [ "$running" -ge 4 ]; then
    t_pass "DEP-01" "stack already running ($running containers) — single command is 'make'"
else
    echo "  stack not running — deploying with a single 'make' (this builds images)..."
    start=$(date +%s)
    if (cd "$REPO_DIR" && make >/dev/null 2>&1); then
        t_pass "DEP-01" "single command 'make' deployed the stack in $(( $(date +%s) - start ))s"
    else
        t_fail "DEP-01" "single command 'make' deploys the stack" "cd $REPO_DIR && make" \
            "make exited non-zero; run 'make logs' to inspect"
    fi
fi

# All four services healthy
for svc in db backend frontend nginx; do
    state="$(compose ps --format '{{.Service}} {{.Health}}' 2>/dev/null | awk -v s="$svc" '$1==s{print $2}')"
    if [ "$state" = "healthy" ]; then
        t_pass "DEP-02-$svc" "container '$svc' is healthy"
    else
        # give slow starters up to 90s
        ok=0
        for _ in $(seq 1 18); do
            sleep 5
            state="$(compose ps --format '{{.Service}} {{.Health}}' 2>/dev/null | awk -v s="$svc" '$1==s{print $2}')"
            [ "$state" = "healthy" ] && { ok=1; break; }
        done
        if [ "$ok" = 1 ]; then
            t_pass "DEP-02-$svc" "container '$svc' became healthy"
        else
            t_fail "DEP-02-$svc" "container '$svc' is healthy" \
                "cd $REPO_DIR && docker compose ps && docker compose logs $svc --tail 50" \
                "state: '${state:-not running}'"
        fi
    fi
done

# App reachable over HTTPS
http GET /
t_expect "DEP-03" "frontend served at $BASE_URL/ (HTTP 200)" 200 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/"

http GET /api/auth/me/
t_expect "DEP-04" "backend API proxied at $BASE_URL/api/ (401 without token)" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/api/auth/me/"

# Database really is PostgreSQL and holds the app schema
tables="$(compose exec -T db psql -U postgres -d transcendence -tAc \
    "select count(*) from information_schema.tables where table_schema='public'" 2>/dev/null | tr -d '[:space:]')"
if [ -n "$tables" ] && [ "$tables" -gt 10 ] 2>/dev/null; then
    t_pass "DEP-05" "PostgreSQL is up with $tables application tables"
else
    t_fail "DEP-05" "PostgreSQL holds the application schema" \
        "docker compose exec db psql -U postgres -d transcendence -c '\\dt'" \
        "got '$tables' tables"
fi

# Seed data present (demo users) so the defense can be demonstrated
http POST /api/auth/login/ -H 'Content-Type: application/json' \
    -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}"
if [ "$HTTP_STATUS" = 200 ]; then
    t_pass "DEP-06" "demo data seeded (login $DEMO_EMAIL works)"
else
    t_fail "DEP-06" "demo data seeded (login $DEMO_EMAIL works)" \
        "cd $REPO_DIR && make seed  # then retry login" \
        "login returned HTTP $HTTP_STATUS"
fi

t_manual "DEP-H1" "Eval sheet: have a TEAM MEMBER run the deploy on a clean clone ('git clone' into an EMPTY folder, then 'make')."
