#!/usr/bin/env bash
# Profile edit: GET/PATCH /api/auth/me/ (bio, district, languages), read-only
# fields, validation and the auth guard (Standard user management).
source "$(dirname "$0")/../lib/common.sh"

t_suite "16 PROFILE — GET/PATCH /api/auth/me/"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
if [ -z "$TOKEN" ]; then
    t_fail "PRO-00" "demo login for profile tests" "login $DEMO_EMAIL"
    exit 0
fi
AUTH="$(auth_h "$TOKEN")"

# Fetch current profile.
http GET /api/auth/me/ -H "$AUTH"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.id and .email' >/dev/null 2>&1; then
    t_pass "PRO-01" "GET /api/auth/me/ returns the profile (id, email)"
else
    t_fail "PRO-01" "GET /api/auth/me/ returns the current profile" \
        "curl -sk $BASE_URL/api/auth/me/ -H '$AUTH'" "HTTP $HTTP_STATUS"
fi
ORIG_EMAIL="$(echo "$HTTP_BODY" | jq -r '.email // empty')"

# PATCH bio, district and languages.
STAMP="eval-bio-$(date +%s)"
patch_payload="$(jq -nc --arg b "$STAMP" '{bio:$b,district:"1010",languages:["en","de"]}')"
http PATCH /api/auth/me/ -H "$AUTH" -H 'Content-Type: application/json' -d "$patch_payload"
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.bio')" = "$STAMP" ]; then
    t_pass "PRO-02" "PATCH updates bio/district/languages (HTTP 200)"
else
    t_fail "PRO-02" "PATCH /api/auth/me/ updates profile fields" \
        "curl -sk -X PATCH $BASE_URL/api/auth/me/ -H '$AUTH' -H 'Content-Type: application/json' -d '$patch_payload'" \
        "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Persistence: a fresh GET must reflect the change.
http GET /api/auth/me/ -H "$AUTH"
got_bio="$(echo "$HTTP_BODY" | jq -r '.bio')"
got_dist="$(echo "$HTTP_BODY" | jq -r '.district')"
if [ "$got_bio" = "$STAMP" ] && [ "$got_dist" = "1010" ]; then
    t_pass "PRO-03" "profile changes persist across requests"
else
    t_fail "PRO-03" "profile changes persist" \
        "curl -sk $BASE_URL/api/auth/me/ -H '$AUTH'" "bio=$got_bio district=$got_dist"
fi

# Invalid district (not in the 23-district catalog) -> 400.
http PATCH /api/auth/me/ -H "$AUTH" -H 'Content-Type: application/json' -d '{"district":"9999"}'
t_expect "PRO-04" "invalid district -> 400" 400 "$HTTP_STATUS" \
    "curl -sk -X PATCH $BASE_URL/api/auth/me/ -H '$AUTH' -H 'Content-Type: application/json' -d '{\"district\":\"9999\"}'"

# email is read-only: PATCHing it is ignored and must not change.
http PATCH /api/auth/me/ -H "$AUTH" -H 'Content-Type: application/json' -d '{"email":"hijack@example.test"}'
new_email="$(echo "$HTTP_BODY" | jq -r '.email // empty')"
if [ "$HTTP_STATUS" = 200 ] && [ "$new_email" = "$ORIG_EMAIL" ]; then
    t_pass "PRO-05" "email is read-only (unchanged after PATCH)"
else
    t_fail "PRO-05" "email field is read-only" \
        "curl -sk -X PATCH $BASE_URL/api/auth/me/ -H '$AUTH' -H 'Content-Type: application/json' -d '{\"email\":\"hijack@example.test\"}'" \
        "HTTP $HTTP_STATUS email=$new_email (expected $ORIG_EMAIL)"
fi

# Auth guard.
http PATCH /api/auth/me/ -H 'Content-Type: application/json' -d '{"bio":"nope"}'
t_expect "PRO-06" "PATCH without token -> 401" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' -X PATCH $BASE_URL/api/auth/me/ -H 'Content-Type: application/json' -d '{\"bio\":\"nope\"}'"
