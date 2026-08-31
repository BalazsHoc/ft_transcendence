#!/usr/bin/env bash
# Form validation: server-side (mandatory) + frontend hints where testable via API.
source "$(dirname "$0")/../lib/common.sh"

t_suite "08 FORM VALIDATION — frontend + backend input checks"

district="$(curl -sk "$BASE_URL/api/meta/districts/" | jq -r '.[0].code // .[0].id // .[0] // "1010"' 2>/dev/null)"

# --- Registration validation (backend) ------------------------------------
http POST /api/auth/register/ -H 'Content-Type: application/json' -d '{}'
t_expect "VAL-01" "empty signup rejected (HTTP 400)" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/auth/register/ -H 'Content-Type: application/json' -d '{}'"

http POST /api/auth/register/ -H 'Content-Type: application/json' \
    -d "{\"email\":\"not-an-email\",\"name\":\"X\",\"password\":\"short\",\"password_confirm\":\"short\",\"district\":\"$district\"}"
t_expect "VAL-02" "invalid email + weak password rejected (HTTP 400)" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/auth/register/ -H 'Content-Type: application/json' -d '{\"email\":\"not-an-email\",\"password\":\"short\"}'"

http POST /api/auth/register/ -H 'Content-Type: application/json' \
    -d "{\"email\":\"xss-<script>alert(1)</script>@test.com\",\"name\":\"<img onerror=alert(1)>\",\"password\":\"ValidPass1!\",\"password_confirm\":\"ValidPass1!\",\"district\":\"$district\"}"
case "$HTTP_STATUS" in
    201|400)
        if [ "$HTTP_STATUS" = 201 ]; then
            stored_name="$(compose exec -T db psql -U postgres -d transcendence -tAc \
                "select first_name from accounts_user where email like 'xss-%' limit 1" 2>/dev/null | tr -d '[:space:]')"
            if echo "$stored_name" | grep -q '<'; then
                t_fail "VAL-03" "XSS payload not sanitized in stored name" \
                    "inspect accounts_user.first_name for xss test user"
            else
                t_pass "VAL-03" "XSS-like signup handled (stored without raw tags or rejected)"
            fi
        else
            t_pass "VAL-03" "XSS-like signup rejected server-side (HTTP 400)"
        fi
        ;;
    *) t_fail "VAL-03" "XSS signup test inconclusive" "retry register with script tags" "HTTP $HTTP_STATUS" ;;
esac

# SQL injection style input — ORM should parameterize
http POST /api/auth/login/ -H 'Content-Type: application/json' \
    -d '{"email":"'\'' OR 1=1 --","password":"anything"}'
case "$HTTP_STATUS" in
    400|401) t_pass "VAL-04" "SQLi-style login rejected safely (HTTP $HTTP_STATUS)" ;;
    *) t_fail "VAL-04" "SQLi-style login must not succeed" \
        "curl -sk -X POST $BASE_URL/api/auth/login/ -H 'Content-Type: application/json' -d '{\"email\":\"'\'' OR 1=1 --\",\"password\":\"x\"}'" \
        "HTTP $HTTP_STATUS" ;;
esac

# Password mismatch
http POST /api/auth/register/ -H 'Content-Type: application/json' \
    -d "{\"email\":\"mismatch-$(date +%s)@test.com\",\"name\":\"Tester\",\"password\":\"ValidPass1!\",\"password_confirm\":\"OtherPass1!\",\"district\":\"$district\"}"
t_expect "VAL-05" "password mismatch rejected (HTTP 400)" 400 "$HTTP_STATUS" \
    "register with mismatched password_confirm"

# Event create validation (authenticated)
token="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
http POST /api/events/ -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d '{}'
case "$HTTP_STATUS" in
    400|403) t_pass "VAL-06" "empty event creation rejected (HTTP $HTTP_STATUS)" ;;
    *) t_fail "VAL-06" "empty event creation must be rejected" \
        "TOKEN=\$(login); curl -sk -X POST $BASE_URL/api/events/ -H \"Authorization: Bearer \$TOKEN\" -d '{}'" \
        "HTTP $HTTP_STATUS" ;;
esac

# Friend request to self
me_id="$(curl -sk "$BASE_URL/api/auth/me/" -H "Authorization: Bearer $token" | jq -r '.id // empty')"
http POST /api/friends/requests/ -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d "{\"user_id\":\"$me_id\"}"
case "$HTTP_STATUS" in
    400|403|404) t_pass "VAL-07" "friend request to self rejected (HTTP $HTTP_STATUS)" ;;
    *) t_fail "VAL-07" "friend request to self must be rejected" \
        "curl -sk -X POST $BASE_URL/api/friends/requests/ -H \"Authorization: Bearer \$TOKEN\" -d '{\"user_id\":\"<self>\"}'" \
        "HTTP $HTTP_STATUS" ;;
esac

# Frontend validation evidence (HTML5 + React forms in source)
if grep -rq 'required\|minLength\|pattern\|validate' "$REPO_DIR/frontend/src/pages/auth" 2>/dev/null; then
    t_pass "VAL-08" "frontend auth forms include client-side validation attributes/logic"
else
    t_warn "VAL-08" "could not detect client-side validation in auth pages" \
        "check RegisterPage.tsx / LoginPage.tsx manually"
fi

t_manual "VAL-H1" "In Chrome, submit empty login/register forms — confirm inline errors appear before/alongside API errors."
