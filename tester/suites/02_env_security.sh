#!/usr/bin/env bash
# Environment & credential security: .env handling, no secrets committed, hashed passwords.
source "$(dirname "$0")/../lib/common.sh"

t_suite "02 ENV & CREDENTIAL SECURITY"

cd "$REPO_DIR"

# .env exists locally but is git-ignored
if [ -f .env ]; then
    t_pass "SEC-01" ".env file exists at repo root"
else
    t_fail "SEC-01" ".env file exists at repo root" "ls -la $REPO_DIR/.env" \
        "run 'make' once — it copies .env.example to .env"
fi

if git check-ignore -q .env; then
    t_pass "SEC-02" ".env is covered by .gitignore"
else
    t_fail "SEC-02" ".env is covered by .gitignore" "cd $REPO_DIR && git check-ignore -v .env" \
        "eval sheet: committed credentials = immediate failure"
fi

if git ls-files --error-unmatch .env >/dev/null 2>&1; then
    t_fail "SEC-03" ".env is NOT tracked by git" "git ls-files | grep -x '.env'" \
        ".env is committed — immediate failure per eval sheet"
else
    t_pass "SEC-03" ".env is not tracked by git"
fi

if [ -f .env.example ]; then
    t_pass "SEC-04" ".env.example template is provided"
else
    t_fail "SEC-04" ".env.example template is provided" "ls $REPO_DIR/.env.example"
fi

# .env.example must not contain real secrets (only empty or placeholder values)
bad_example="$(grep -E '^(SECRET_KEY|.*PASSWORD|.*API_KEY|.*CLIENT_SECRET)=' .env.example 2>/dev/null \
    | grep -vE '=($|change-me|changeme|example|placeholder|postgres$|dev-)' || true)"
if [ -z "$bad_example" ]; then
    t_pass "SEC-05" ".env.example contains only placeholder values"
else
    t_fail "SEC-05" ".env.example contains only placeholder values" \
        "grep -E '(SECRET|PASSWORD|KEY)=' $REPO_DIR/.env.example" \
        "suspicious: $bad_example"
fi

# Scan the working tree for secret-looking values (excluding .env itself)
leaks="$(git grep -nIE \
    '(AKIA[0-9A-Z]{16}|-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----|xox[bap]-[0-9A-Za-z-]{10,}|ghp_[0-9A-Za-z]{36}|AIza[0-9A-Za-z_-]{35})' \
    -- ':!tester' 2>/dev/null || true)"
if [ -z "$leaks" ]; then
    t_pass "SEC-06" "no API keys / private keys / tokens in tracked files"
else
    t_fail "SEC-06" "no API keys / private keys / tokens in tracked files" \
        "cd $REPO_DIR && git grep -nE '(AKIA|BEGIN.*PRIVATE KEY|ghp_|AIza)'" \
        "$leaks"
fi

# Same scan across full git history (lightweight: filenames typical for secrets)
hist="$(git log --all --diff-filter=A --name-only --pretty=format: 2>/dev/null \
    | grep -xE '\.env|.*\.pem|.*\.key|id_rsa.*' | sort -u || true)"
if [ -z "$hist" ]; then
    t_pass "SEC-07" "no .env/.pem/.key files ever committed in git history"
else
    t_fail "SEC-07" "no .env/.pem/.key files ever committed in git history" \
        "cd $REPO_DIR && git log --all --diff-filter=A --name-only --pretty=format: | sort -u | grep -E '\\.env|\\.pem|\\.key'" \
        "found in history: $hist"
fi

# Passwords hashed & salted in the database (eval sheet: never plain text)
hashes="$(compose exec -T db psql -U postgres -d transcendence -tAc \
    "select count(*) from accounts_user where password not like 'pbkdf2_%' and password not like 'argon2%' and password not like 'bcrypt%' and password <> ''" \
    2>/dev/null | tr -d '[:space:]')"
if [ "$hashes" = "0" ]; then
    algo="$(compose exec -T db psql -U postgres -d transcendence -tAc \
        "select split_part(password,'\$',1) from accounts_user where password<>'' limit 1" 2>/dev/null | tr -d '[:space:]')"
    t_pass "SEC-08" "all DB passwords hashed+salted (algorithm: ${algo:-pbkdf2_sha256})"
else
    t_fail "SEC-08" "all DB passwords hashed+salted" \
        "docker compose exec db psql -U postgres -d transcendence -c \"select username, left(password,20) from accounts_user limit 5\"" \
        "$hashes user(s) with non-hashed password field"
fi

# DEBUG must be off in the deployed backend (stack traces leak internals)
http GET /api/this-route-does-not-exist/
if echo "$HTTP_BODY" | grep -qi "traceback\|django version"; then
    t_fail "SEC-09" "Django DEBUG disabled in deployment" \
        "curl -sk $BASE_URL/api/this-route-does-not-exist/" \
        "404 page leaks a Django debug page"
else
    t_pass "SEC-09" "Django DEBUG disabled (404 does not leak stack traces)"
fi

t_manual "SEC-H1" "Ask the team to explain their password hashing approach (Django PBKDF2-SHA256 with per-user salt)."
