#!/usr/bin/env bash
# Authentication: register, login, JWT lifecycle, duplicate/invalid credentials.
source "$(dirname "$0")/../lib/common.sh"

t_suite "10 AUTHENTICATION (User Management major module)"

TS="$(date +%s)"
NEW_EMAIL="tester-$TS@example.test"
NEW_PASS="TestPass1!x"

district="$(curl -sk "$BASE_URL/api/meta/districts/" | jq -r '.[0].code // .[0].id // .[0] // empty' 2>/dev/null)"
if [ -n "$district" ]; then
    t_pass "AUTH-01" "district catalog available for signup (first code: $district)"
else
    t_fail "AUTH-01" "district catalog available for signup" \
        "curl -sk $BASE_URL/api/meta/districts/ | jq ."
fi

# Signup with email + password (eval sheet requirement)
# Use a short password — long timestamp suffixes can trip Django validators.
NEW_PASS="TestPass1!x"
reg_payload="{\"email\":\"$NEW_EMAIL\",\"name\":\"Eval Tester\",\"password\":\"$NEW_PASS\",\"password_confirm\":\"$NEW_PASS\",\"district\":\"$district\"}"
http POST /api/auth/register/ -H 'Content-Type: application/json' -d "$reg_payload"
case "$HTTP_STATUS" in
    200|201) t_pass "AUTH-02" "signup with email+password succeeds (HTTP $HTTP_STATUS)" ;;
    *) t_fail "AUTH-02" "signup with email+password succeeds (HTTP 200/201)" \
        "$(repro_http POST /api/auth/register/ "-H 'Content-Type: application/json' -d '$reg_payload'")" \
        "HTTP $HTTP_STATUS — $(echo "$HTTP_BODY" | jq -c . 2>/dev/null || echo "$HTTP_BODY")" ;;
esac

# Login with the fresh account
token="$(login "$NEW_EMAIL" "$NEW_PASS")"
if [ -n "$token" ]; then
    t_pass "AUTH-03" "login returns JWT access token for the new account"
else
    t_fail "AUTH-03" "login returns JWT access token for the new account" \
        "curl -sk -X POST $BASE_URL/api/auth/login/ -H 'Content-Type: application/json' -d '{\"email\":\"$NEW_EMAIL\",\"password\":\"$NEW_PASS\"}'"
fi

# JWT actually authenticates
http GET /api/auth/me/ -H "Authorization: Bearer $token"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.email' >/dev/null 2>&1; then
    t_pass "AUTH-04" "/api/auth/me/ returns the profile with a valid JWT"
else
    t_fail "AUTH-04" "/api/auth/me/ returns the profile with a valid JWT" \
        "TOKEN=\$(curl -sk -X POST $BASE_URL/api/auth/login/ -H 'Content-Type: application/json' -d '{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}' | jq -r .access); curl -sk $BASE_URL/api/auth/me/ -H \"Authorization: Bearer \$TOKEN\"" \
        "HTTP $HTTP_STATUS"
fi

# Refresh token flow
refresh="$(curl -sk -X POST "$BASE_URL/api/auth/login/" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" | jq -r '.refresh // empty')"
http POST /api/auth/refresh/ -H 'Content-Type: application/json' -d "{\"refresh\":\"$refresh\"}"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.access' >/dev/null 2>&1; then
    t_pass "AUTH-05" "JWT refresh endpoint issues a new access token"
else
    t_fail "AUTH-05" "JWT refresh endpoint issues a new access token" \
        "$(repro_http POST /api/auth/refresh/ "-d '{\"refresh\":\"<refresh>\"}'")" "HTTP $HTTP_STATUS"
fi

# Duplicate email rejected
http POST /api/auth/register/ -H 'Content-Type: application/json' -d "$reg_payload"
t_expect "AUTH-06" "duplicate email registration is rejected (HTTP 400)" 400 "$HTTP_STATUS" \
    "$(repro_http POST /api/auth/register/ "-H 'Content-Type: application/json' -d '$reg_payload'  # run twice")"

# Wrong password rejected without leaking info
http POST /api/auth/login/ -H 'Content-Type: application/json' \
    -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"definitely-wrong\"}"
case "$HTTP_STATUS" in
    400|401) t_pass "AUTH-07" "wrong password rejected (HTTP $HTTP_STATUS)" ;;
    *) t_fail "AUTH-07" "wrong password rejected" \
        "$(repro_http POST /api/auth/login/ "-d '{\"email\":\"$DEMO_EMAIL\",\"password\":\"definitely-wrong\"}'")" \
        "HTTP $HTTP_STATUS" ;;
esac

# Unknown user rejected identically (no user enumeration via status code)
http POST /api/auth/login/ -H 'Content-Type: application/json' \
    -d '{"email":"ghost-does-not-exist@example.test","password":"whatever123"}'
case "$HTTP_STATUS" in
    400|401) t_pass "AUTH-08" "unknown email rejected with same class of error (HTTP $HTTP_STATUS)" ;;
    *) t_fail "AUTH-08" "unknown email rejected" \
        "$(repro_http POST /api/auth/login/ "-d '{\"email\":\"ghost-does-not-exist@example.test\",\"password\":\"whatever123\"}'")" \
        "HTTP $HTTP_STATUS" ;;
esac

# Google OAuth start (cannot finish without a real Google account)
loc="$(curl -sk -o /dev/null -w '%{http_code} %{redirect_url}' "$BASE_URL/api/auth/google/start/")"
code="${loc%% *}"
url="${loc#* }"
case "$code" in
    302|301)
        if echo "$url" | grep -qi 'accounts.google.com'; then
            t_pass "AUTH-google" "Continue with Google redirects to accounts.google.com"
        else
            t_fail "AUTH-google" "Google OAuth start redirects to Google" \
                "curl -skv $BASE_URL/api/auth/google/start/" "redirected to $url"
        fi
        ;;
    *) t_fail "AUTH-google" "GET /api/auth/google/start/ returns a redirect" \
        "curl -skv $BASE_URL/api/auth/google/start/" "HTTP $code $url" ;;
esac

# Protected endpoints reject missing / garbage tokens
http GET /api/notifications/
t_expect "AUTH-09" "protected endpoint without token → 401" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/api/notifications/"
http GET /api/notifications/ -H "Authorization: Bearer not.a.jwt"
t_expect "AUTH-10" "protected endpoint with forged token → 401" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' -H 'Authorization: Bearer not.a.jwt' $BASE_URL/api/notifications/"

# New user's password is stored hashed (defense-in-depth vs SEC-08)
stored="$(compose exec -T db psql -U postgres -d transcendence -tAc \
    "select left(password,14) from accounts_user where email='$NEW_EMAIL'" 2>/dev/null | tr -d '[:space:]')"
case "$stored" in
    pbkdf2_sha256* ) t_pass "AUTH-11" "freshly registered password stored as pbkdf2_sha256 hash" ;;
    * ) t_fail "AUTH-11" "freshly registered password stored hashed" \
        "docker compose exec db psql -U postgres -d transcendence -c \"select left(password,20) from accounts_user where email='$NEW_EMAIL'\"" \
        "stored prefix: '$stored'" ;;
esac
