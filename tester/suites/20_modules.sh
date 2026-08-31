#!/usr/bin/env bash
# Module verification — all claimed modules from POINTS.md (20 pts).
source "$(dirname "$0")/../lib/common.sh"

t_suite "20 MODULES — verify each claimed Major/Minor module"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
TOKEN2="$(login "$DEMO2_EMAIL" "$DEMO2_PASSWORD")"

# ---------------------------------------------------------------------------
# W-2 Real-time WebSockets
# ---------------------------------------------------------------------------
if [ -n "$TOKEN" ]; then
    ws_out="$(cd "$TESTER_DIR/browser" && TOKEN="$TOKEN" WS_URL="$WS_URL" node ws-test.js 2>&1)" || ws_rc=$?
    ws_rc="${ws_rc:-0}"
    if echo "$ws_out" | grep -q '^PASS'; then
        t_pass "MOD-W2" "WebSocket presence channel works with JWT"
        module_result "W-2" "MAJOR" "Real-time WebSockets" "pass"
    else
        t_fail "MOD-W2" "WebSocket presence channel works" \
            "TOKEN=\$(login) WS_URL=$WS_URL node tester/browser/ws-test.js" \
            "$(echo "$ws_out" | tr '\n' ' ')"
        module_result "W-2" "MAJOR" "Real-time WebSockets" "fail"
    fi
else
    t_fail "MOD-W2" "WebSocket test needs demo login" "login $DEMO_EMAIL"
    module_result "W-2" "MAJOR" "Real-time WebSockets" "fail" "no token"
fi

# ---------------------------------------------------------------------------
# W-3 Chat + profile + friends
# ---------------------------------------------------------------------------
mod_w3_ok=1

http GET /api/users/ -H "Authorization: Bearer $TOKEN"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W3a" "user search/list API works" || { t_fail "MOD-W3a" "GET /api/users/" "curl -sk $BASE_URL/api/users/ -H \"Authorization: Bearer \$TOKEN\""; mod_w3_ok=0; }

http GET /api/auth/me/ -H "Authorization: Bearer $TOKEN"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W3b" "profile API (/api/auth/me/) works" || { t_fail "MOD-W3b" "profile API" "curl -sk $BASE_URL/api/auth/me/ -H \"Authorization: Bearer \$TOKEN\""; mod_w3_ok=0; }

http GET /api/friends/ -H "Authorization: Bearer $TOKEN"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W3c" "friends list API works" || { t_fail "MOD-W3c" "friends API" "curl -sk $BASE_URL/api/friends/ -H \"Authorization: Bearer \$TOKEN\""; mod_w3_ok=0; }

http GET /api/messages/conversations/ -H "Authorization: Bearer $TOKEN"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W3d" "direct chat conversations API works" || { t_fail "MOD-W3d" "chat API" "curl -sk $BASE_URL/api/messages/conversations/ -H \"Authorization: Bearer \$TOKEN\""; mod_w3_ok=0; }

if [ "$mod_w3_ok" = 1 ]; then
    module_result "W-3" "MAJOR" "Chat, profile, friends" "pass"
else
    module_result "W-3" "MAJOR" "Chat, profile, friends" "fail"
fi

# ---------------------------------------------------------------------------
# W-4 Public API (key, rate limit, docs, ≥5 endpoints)
# ---------------------------------------------------------------------------
mod_w4_ok=1

# Issue or reuse API key
API_KEY="$(compose exec -T backend python manage.py create_public_api_key --name "eval-tester-$(date +%s)" 2>/dev/null \
    | awk '/^tr_pub_/{print; exit}')"
if [ -z "$API_KEY" ]; then
    t_fail "MOD-W4a" "issue public API key" \
        "docker compose exec backend python manage.py create_public_api_key --name eval"
    mod_w4_ok=0
else
    t_pass "MOD-W4a" "public API key issued (prefix ${API_KEY:0:16}...)"
fi

public_paths=(
    "/api/public/v1/health/"
    "/api/public/v1/sports/"
    "/api/public/v1/districts/"
    "/api/public/v1/events/"
    "/api/public/v1/groups/"
    "/api/public/v1/users/"
)
endpoints_ok=0
for p in "${public_paths[@]}"; do
    http GET "$p" -H "X-API-Key: $API_KEY"
    if [ "$HTTP_STATUS" = 200 ]; then
        endpoints_ok=$((endpoints_ok + 1))
    else
        t_fail "MOD-W4-$p" "public endpoint $p → HTTP $HTTP_STATUS" \
            "curl -sk -H 'X-API-Key: $API_KEY' $BASE_URL$p"
        mod_w4_ok=0
    fi
done
[ "$endpoints_ok" -ge 5 ] && t_pass "MOD-W4b" "$endpoints_ok public API endpoints respond 200"

# Without key → 401/403
http GET /api/public/v1/health/
case "$HTTP_STATUS" in
    401|403) t_pass "MOD-W4c" "public API rejects missing key (HTTP $HTTP_STATUS)" ;;
    *) t_fail "MOD-W4c" "public API requires API key" "curl -sk $BASE_URL/api/public/v1/health/"; mod_w4_ok=0 ;;
esac

# Docs
http GET /api/docs/
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W4d" "Swagger UI at /api/docs/" || { t_fail "MOD-W4d" "Swagger docs" "curl -sk $BASE_URL/api/docs/"; mod_w4_ok=0; }
http GET /api/schema/
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W4e" "OpenAPI schema at /api/schema/" || { t_fail "MOD-W4e" "OpenAPI schema" "curl -sk $BASE_URL/api/schema/"; mod_w4_ok=0; }

if [ -f "$REPO_DIR/backend/PUBLIC_API.md" ]; then
    t_pass "MOD-W4f" "PUBLIC_API.md documentation present"
else
    t_warn "MOD-W4f" "PUBLIC_API.md not found"
fi

# ---------------------------------------------------------------------------
# W-7 Advanced search (before rate-limit burst — shared API key)
# ---------------------------------------------------------------------------
mod_w7_ok=1
http GET "/api/events/?sport=running&search=vienna&page=1&page_size=5"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.results // .count // length' >/dev/null 2>&1; then
    t_pass "MOD-W7a" "events list supports sport+search+pagination"
else
    t_fail "MOD-W7a" "events search/filter/pagination" "curl -sk '$BASE_URL/api/events/?sport=running&search=vienna&page=1'"
    mod_w7_ok=0
fi

http GET "/api/public/v1/events/?ordering=-start_at&page=1" -H "X-API-Key: $API_KEY"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.results' >/dev/null 2>&1; then
    t_pass "MOD-W7b" "public events support ordering+pagination"
else
    t_fail "MOD-W7b" "public API ordering" "curl -sk -H 'X-API-Key: ...' '$BASE_URL/api/public/v1/events/?ordering=-start_at'"
    mod_w7_ok=0
fi

if [ "$mod_w7_ok" = 1 ]; then
    module_result "W-7" "MINOR" "Advanced search (filters, sort, pagination)" "pass"
else
    module_result "W-7" "MINOR" "Advanced search" "fail"
fi

# Rate limiting (skip in --fast)
if [ "${TESTER_FAST:-0}" = 1 ]; then
    t_skip "MOD-W4g" "rate limiting returns 429" "TESTER_FAST=1"
else
    hit429=0
    for _ in $(seq 1 70); do
        code="$(curl -sk -o /dev/null -w '%{http_code}' -H "X-API-Key: $API_KEY" "$BASE_URL/api/public/v1/health/")"
        [ "$code" = "429" ] && { hit429=1; break; }
    done
    if [ "$hit429" = 1 ]; then
        t_pass "MOD-W4g" "rate limiting enforced (HTTP 429 after burst)"
    else
        t_fail "MOD-W4g" "rate limiting enforced" \
            "for i in \$(seq 1 70); do curl -sk -o /dev/null -w '%{http_code}' -H 'X-API-Key: \$KEY' $BASE_URL/api/public/v1/health/; done" \
            "never got 429 (limit may be misconfigured)"
        mod_w4_ok=0
    fi
fi

if [ "$mod_w4_ok" = 1 ]; then
    module_result "W-4" "MAJOR" "Public API (key, rate limit, docs, endpoints)" "pass"
else
    module_result "W-4" "MAJOR" "Public API" "fail"
fi

# ---------------------------------------------------------------------------
# W-6 Notifications
# ---------------------------------------------------------------------------
mod_w6_ok=1
http GET /api/notifications/ -H "Authorization: Bearer $TOKEN"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W6a" "notifications list API works" || mod_w6_ok=0

http GET /api/notifications/unread-count/ -H "Authorization: Bearer $TOKEN"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-W6b" "unread notification count API works" || mod_w6_ok=0

# Trigger a notification: friend request from demo2 → demo (if not already friends)
target_id="$(curl -sk "$BASE_URL/api/auth/me/" -H "Authorization: Bearer $TOKEN" | jq -r '.id // empty')"
before="$(curl -sk "$BASE_URL/api/notifications/unread-count/" -H "Authorization: Bearer $TOKEN2" | jq -r '.count // 0')"
http POST /api/friends/requests/ -H "Authorization: Bearer $TOKEN2" -H 'Content-Type: application/json' \
    -d "{\"user_id\":\"$target_id\"}"
sleep 1
after="$(curl -sk "$BASE_URL/api/notifications/unread-count/" -H "Authorization: Bearer $TOKEN" | jq -r '.count // 0')"
if [ "$after" -gt "$before" ] 2>/dev/null || [ "$HTTP_STATUS" = 400 ]; then
    t_pass "MOD-W6c" "friend request triggers notification pipeline (count $before→$after or already sent)"
else
    t_fail "MOD-W6c" "friend request should create notification" \
        "send friend request then check /api/notifications/unread-count/"
    mod_w6_ok=0
fi

notif_types="$(compose exec -T db psql -U postgres -d transcendence -tAc \
    "select count(distinct type) from notifications_notification" 2>/dev/null | tr -d '[:space:]')"
if [ -n "$notif_types" ] && [ "$notif_types" -ge 3 ] 2>/dev/null; then
    t_pass "MOD-W6d" "notification system has $notif_types distinct types in DB"
else
    t_warn "MOD-W6d" "few notification types in DB ($notif_types) — seed may be sparse"
fi

if [ "$mod_w6_ok" = 1 ]; then
    module_result "W-6" "MINOR" "Notification system (CRUD actions)" "pass"
else
    module_result "W-6" "MINOR" "Notification system" "fail"
fi

# ---------------------------------------------------------------------------
# A-1 i18n (≥3 languages)
# ---------------------------------------------------------------------------
lang_count="$(find "$REPO_DIR/frontend/src/i18n/locales" -name '*.json' 2>/dev/null | wc -l | tr -d ' ')"
if [ "$lang_count" -ge 3 ] 2>/dev/null; then
    langs="$(find "$REPO_DIR/frontend/src/i18n/locales" -name '*.json' -exec basename {} .json \; | tr '\n' ',' | sed 's/,$//')"
    t_pass "MOD-A1" "$lang_count locale files ($langs)"
    module_result "A-1" "MINOR" "Multiple languages (≥3)" "pass"
else
    t_fail "MOD-A1" "≥3 locale files" "ls frontend/src/i18n/locales/"
    module_result "A-1" "MINOR" "Multiple languages" "fail"
fi

# ---------------------------------------------------------------------------
# A-2 Additional browser support
# ---------------------------------------------------------------------------
if [ -f "$REPO_DIR/frontend/BROWSER_SUPPORT.md" ] && grep -q 'Browserslist' "$REPO_DIR/frontend/BROWSER_SUPPORT.md"; then
    t_pass "MOD-A2" "BROWSER_SUPPORT.md documents cross-browser matrix"
    module_result "A-2" "MINOR" "Additional browser support" "pass"
else
    t_fail "MOD-A2" "BROWSER_SUPPORT.md present" "cat frontend/BROWSER_SUPPORT.md"
    module_result "A-2" "MINOR" "Additional browser support" "fail"
fi

# ---------------------------------------------------------------------------
# U-1 Standard auth (covered by suite 10 — register result here if auth passed)
# ---------------------------------------------------------------------------
http POST /api/auth/login/ -H 'Content-Type: application/json' \
    -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.access' >/dev/null 2>&1; then
    module_result "U-1" "MAJOR" "Standard user management & authentication" "pass"
    t_pass "MOD-U1" "JWT auth module validated (see also suite 10_auth)"
else
    module_result "U-1" "MAJOR" "Standard user management & authentication" "fail"
    t_fail "MOD-U1" "JWT auth" "run ./tester/run.sh auth"
fi

# ---------------------------------------------------------------------------
# U-2 Google OAuth
# ---------------------------------------------------------------------------
http GET /api/auth/google/start/
case "$HTTP_STATUS" in
    302)
        loc="$(curl -sk -o /dev/null -w '%{redirect_url}' "$BASE_URL/api/auth/google/start/")"
        if echo "$loc" | grep -qi 'accounts.google.com'; then
            t_pass "MOD-U2" "Google OAuth start redirects to Google ($loc)"
            module_result "U-2" "MINOR" "Remote OAuth 2.0 (Google)" "pass"
        else
            t_warn "MOD-U2" "OAuth start returns 302 but not to Google — credentials may be unset"
            module_result "U-2" "MINOR" "Remote OAuth 2.0 (Google)" "fail" "redirect not Google"
        fi
        ;;
    503|500)
        t_warn "MOD-U2" "Google OAuth not configured (HTTP $HTTP_STATUS) — set GOOGLE_OAUTH_* in .env"
        module_result "U-2" "MINOR" "Remote OAuth 2.0 (Google)" "fail" "not configured"
        ;;
    *)
        t_fail "MOD-U2" "Google OAuth /api/auth/google/start/" \
            "curl -skv $BASE_URL/api/auth/google/start/" "HTTP $HTTP_STATUS"
        module_result "U-2" "MINOR" "Remote OAuth 2.0 (Google)" "fail"
        ;;
esac

# ---------------------------------------------------------------------------
# M-1 Map integration
# ---------------------------------------------------------------------------
mod_m1_ok=1
http GET /api/geo/map-style/
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.styles.light.url // .light // .url' >/dev/null 2>&1; then
    t_pass "MOD-M1a" "map tile style API works"
else
    t_fail "MOD-M1a" "GET /api/geo/map-style/" "curl -sk $BASE_URL/api/geo/map-style/ | jq ."
    mod_m1_ok=0
fi

http GET "/api/geo/search/?q=Stephansplatz%20Wien"
[ "$HTTP_STATUS" = 200 ] && t_pass "MOD-M1b" "geocoding search API works" || { t_fail "MOD-M1b" "geo search"; mod_m1_ok=0; }

if [ -f "$REPO_DIR/frontend/src/pages/MapPage.tsx" ]; then
    t_pass "MOD-M1c" "MapPage frontend route exists (/map)"
else
    t_fail "MOD-M1c" "MapPage.tsx missing"; mod_m1_ok=0
fi

if [ "$mod_m1_ok" = 1 ]; then
    module_result "M-1" "MAJOR" "Map integration" "pass"
else
    module_result "M-1" "MAJOR" "Map integration" "fail"
fi

# ---------------------------------------------------------------------------
# M-2 Dark/Light theme
# ---------------------------------------------------------------------------
if grep -q 'body\.dark\|classList.*dark' "$REPO_DIR/frontend/src/layouts/AppLayout.tsx" 2>/dev/null && \
   grep -q 'body\.dark' "$REPO_DIR/frontend/src/styles/global.css" 2>/dev/null; then
    t_pass "MOD-M2" "dark/light theme via body.dark + AppLayout toggle"
    module_result "M-2" "MINOR" "Dark/Light theme" "pass"
else
    t_fail "MOD-M2" "theme implementation" "grep dark frontend/src/layouts/AppLayout.tsx"
    module_result "M-2" "MINOR" "Dark/Light theme" "fail"
fi

t_manual "MOD-H1" "Live defense: demonstrate EACH major module with explanation (chat send, map search, public API in Swagger, Google login)."
