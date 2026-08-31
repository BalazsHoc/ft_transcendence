#!/usr/bin/env bash
# Styling solution (Tailwind) + architecture components + code structure smoke checks.
source "$(dirname "$0")/../lib/common.sh"

t_suite "09 STYLING & ARCHITECTURE — CSS framework, three-tier stack, code layout"

# Mandatory three components
for dir in frontend backend; do
    if [ -d "$REPO_DIR/$dir" ]; then
        t_pass "ARC-01-$dir" "$dir/ directory present"
    else
        t_fail "ARC-01-$dir" "$dir/ directory present" "ls $REPO_DIR/$dir"
    fi
done
if compose ps -q db 2>/dev/null | grep -q .; then
    t_pass "ARC-01-db" "database container running (PostgreSQL)"
else
    t_fail "ARC-01-db" "database container running" "cd $REPO_DIR && make && docker compose ps"
fi

# Tailwind CSS framework (eval: plain CSS alone is not sufficient)
if [ -f "$REPO_DIR/frontend/tailwind.config.js" ] && \
   grep -q tailwindcss "$REPO_DIR/frontend/package.json" 2>/dev/null; then
    t_pass "STY-01" "Tailwind CSS configured (tailwind.config.js + dependency)"
else
    t_fail "STY-01" "CSS framework (Tailwind) configured" "cat frontend/package.json | jq .dependencies.tailwindcss"
fi

tw_usage="$(grep -rl 'className=.*\(flex\|grid\|text-\|bg-\|p-\|m-\)' "$REPO_DIR/frontend/src" 2>/dev/null | wc -l | tr -d ' ')"
if [ "$tw_usage" -gt 10 ] 2>/dev/null; then
    t_pass "STY-02" "Tailwind utility classes used across $tw_usage source files"
else
    t_fail "STY-02" "Tailwind used in components" "grep -r 'className=.*flex' frontend/src | head"
fi

# Design system reusable components (module W-8)
shared_count="$(find "$REPO_DIR/frontend/src/components/shared" -maxdepth 1 -name '*.tsx' 2>/dev/null | wc -l | tr -d ' ')"
if [ "$shared_count" -ge 10 ] 2>/dev/null; then
    t_pass "STY-03" "design system: $shared_count reusable shared components (≥10 required)"
    module_result "W-8" "MINOR" "Custom design system (≥10 components)" "pass"
else
    t_fail "STY-03" "≥10 reusable shared components" "ls frontend/src/components/shared/"
    module_result "W-8" "MINOR" "Custom design system (≥10 components)" "fail" "found $shared_count"
fi

# ORM evidence (module W-5)
model_files="$(find "$REPO_DIR/backend" -name 'models.py' ! -path '*/migrations/*' 2>/dev/null | wc -l | tr -d ' ')"
if [ "$model_files" -ge 5 ] 2>/dev/null; then
    t_pass "ARC-02" "Django ORM models in $model_files apps"
    module_result "W-5" "MINOR" "ORM for database" "pass"
else
    t_fail "ARC-02" "Django ORM models present" "find backend -name models.py"
    module_result "W-5" "MINOR" "ORM for database" "fail"
fi

# Frameworks major module W-1
if [ -f "$REPO_DIR/frontend/package.json" ] && grep -q '"react"' "$REPO_DIR/frontend/package.json" && \
   [ -f "$REPO_DIR/backend/manage.py" ]; then
    t_pass "MOD-W1" "frontend (React/Vite) + backend (Django) frameworks in use"
    module_result "W-1" "MAJOR" "Framework for frontend and backend" "pass"
else
    t_fail "MOD-W1" "frontend + backend frameworks" "inspect frontend/package.json and backend/manage.py"
    module_result "W-1" "MAJOR" "Framework for frontend and backend" "fail"
fi

# Database schema documentation
if grep -qiE 'schema|ERD|accounts_user|models' "$REPO_DIR/README.md" "$REPO_DIR/POINTS.md" "$REPO_DIR/backend/README.md" 2>/dev/null; then
    t_pass "ARC-03" "database schema documented somewhere in repo docs"
else
    t_warn "ARC-03" "database schema section may be incomplete in README" \
        "add Database Schema section with tables/relations"
fi

t_manual "ARC-H1" "Ask different members to explain frontend, backend, and database roles."
