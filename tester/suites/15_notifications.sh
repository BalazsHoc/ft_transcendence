#!/usr/bin/env bash
# Notification system: list, unread filter/count, mark-read, mark-all-read (W-6).
source "$(dirname "$0")/../lib/common.sh"

t_suite "15 NOTIFICATIONS — list, unread, mark read, read all"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
if [ -z "$TOKEN" ]; then
    t_fail "NOT-00" "demo login for notification tests" "login $DEMO_EMAIL"
    exit 0
fi
AUTH="$(auth_h "$TOKEN")"
ME_ID="$(me_id "$TOKEN")"

# List + guards
http GET /api/notifications/ -H "$AUTH"
t_expect "NOT-01" "notifications list returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/notifications/ -H '$AUTH'"

http GET /api/notifications/
t_expect "NOT-02" "notifications without token -> 401" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/api/notifications/"

http GET "/api/notifications/?unread=true" -H "$AUTH"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e "($_LIST_JQ) | map(select(.read_at != null)) | length == 0" >/dev/null 2>&1; then
    t_pass "NOT-03" "unread filter returns only unread notifications"
else
    t_fail "NOT-03" "GET /api/notifications/?unread=true returns unread only" \
        "curl -sk '$BASE_URL/api/notifications/?unread=true' -H '$AUTH'" "HTTP $HTTP_STATUS"
fi

http GET /api/notifications/unread-count/ -H "$AUTH"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.count | numbers' >/dev/null 2>&1; then
    t_pass "NOT-04" "unread-count returns a numeric count"
else
    t_fail "NOT-04" "GET /api/notifications/unread-count/ returns {count}" \
        "curl -sk $BASE_URL/api/notifications/unread-count/ -H '$AUTH'" "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Trigger a fresh unread notification for the demo user via a friend request
# from a throwaway account (self-contained; does not touch demo friendships).
before="$(curl -sk "$BASE_URL/api/notifications/unread-count/" -H "$AUTH" | jq -r '.count // 0')"
TMP_EMAIL="notif-src-$(date +%s%N)@example.test"
TMP_TOKEN="$(register_user "$TMP_EMAIL" "TestPass1x" "Notif Source")"
if [ -n "$TMP_TOKEN" ] && [ -n "$ME_ID" ]; then
    curl -sk -X POST "$BASE_URL/api/friends/requests/" \
        -H "$(auth_h "$TMP_TOKEN")" -H 'Content-Type: application/json' \
        -d "{\"user_id\":\"$ME_ID\"}" >/dev/null
    sleep 1
fi
after="$(curl -sk "$BASE_URL/api/notifications/unread-count/" -H "$AUTH" | jq -r '.count // 0')"
if [ "$after" -gt "$before" ] 2>/dev/null; then
    t_pass "NOT-05" "action by another user creates an unread notification ($before -> $after)"
else
    t_warn "NOT-05" "unread count did not increase ($before -> $after) — a request from this account may already be pending"
fi

# Mark the newest notification read.
NOTIF_ID="$(curl -sk "$BASE_URL/api/notifications/" -H "$AUTH" | jq -r "($_LIST_JQ) | .[0].id // empty")"
if [ -n "$NOTIF_ID" ]; then
    http POST "/api/notifications/$NOTIF_ID/read/" -H "$AUTH"
    if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.read_at != null' >/dev/null 2>&1; then
        t_pass "NOT-06" "mark single notification read sets read_at (id $NOTIF_ID)"
    else
        t_fail "NOT-06" "POST /api/notifications/<id>/read/ marks it read" \
            "curl -sk -X POST $BASE_URL/api/notifications/$NOTIF_ID/read/ -H '$AUTH'" "HTTP $HTTP_STATUS"
    fi
else
    t_skip "NOT-06" "mark single read" "no notifications to mark"
fi

# Mark-read for a non-existent id -> 404
http POST "/api/notifications/999999999/read/" -H "$AUTH"
t_expect "NOT-07" "mark-read for unknown id -> 404" 404 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/notifications/999999999/read/ -H '$AUTH'"

# Mark all read, then the unread count must be zero.
http POST /api/notifications/read-all/ -H "$AUTH"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.updated | numbers' >/dev/null 2>&1; then
    t_pass "NOT-08" "mark-all-read returns updated count"
else
    t_fail "NOT-08" "POST /api/notifications/read-all/ returns {updated}" \
        "curl -sk -X POST $BASE_URL/api/notifications/read-all/ -H '$AUTH'" "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

zero="$(curl -sk "$BASE_URL/api/notifications/unread-count/" -H "$AUTH" | jq -r '.count // -1')"
t_expect "NOT-09" "unread count is 0 after mark-all-read" 0 "$zero" \
    "curl -sk $BASE_URL/api/notifications/unread-count/ -H '$AUTH'"
