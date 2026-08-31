#!/usr/bin/env bash
# Events API: list, detail, join/leave, unauthenticated guards.
source "$(dirname "$0")/../lib/common.sh"

t_suite "11 EVENTS — list, detail, join, leave"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
if [ -z "$TOKEN" ]; then
    t_fail "EVT-00" "demo login for events tests" "curl -sk -X POST $BASE_URL/api/auth/login/ -d '{...}'"
    exit 0
fi

http GET "/api/events/?page=1&page_size=5"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.results' >/dev/null 2>&1; then
    t_pass "EVT-01" "events list is paginated (results array)"
else
    t_fail "EVT-01" "GET /api/events/ returns paginated list" \
        "curl -sk '$BASE_URL/api/events/?page=1&page_size=5' | jq ."
fi

count="$(echo "$HTTP_BODY" | jq -r '.count // 0')"
[ "$count" -gt 0 ] 2>/dev/null && t_pass "EVT-02" "seeded events exist (count=$count)" || \
    t_fail "EVT-02" "seeded events exist" "make seed"

EVENT_ID="$(echo "$HTTP_BODY" | jq -r '.results[0].id // empty')"
if [ -z "$EVENT_ID" ]; then
    t_fail "EVT-03" "first event id available" "curl -sk $BASE_URL/api/events/ | jq '.results[0]'"
else
    http GET "/api/events/$EVENT_ID/"
    t_expect "EVT-03" "event detail returns 200" 200 "$HTTP_STATUS" \
        "curl -sk $BASE_URL/api/events/$EVENT_ID/"
fi

http GET "/api/events/?sport=running&page=1"
t_expect "EVT-04" "filter by sport=running returns 200" 200 "$HTTP_STATUS" \
    "curl -sk '$BASE_URL/api/events/?sport=running'"

if [ -z "$EVENT_ID" ]; then
    t_skip "EVT-05" "join/leave/chat" "no event id"
else
    http POST "/api/events/$EVENT_ID/join/"
    t_expect "EVT-05" "join without token is rejected (401)" 401 "$HTTP_STATUS" \
        "curl -sk -X POST $BASE_URL/api/events/$EVENT_ID/join/"

    http POST "/api/events/$EVENT_ID/join/" -H "Authorization: Bearer $TOKEN"
    case "$HTTP_STATUS" in
        200|201) t_pass "EVT-06" "authenticated join works (HTTP $HTTP_STATUS)" ;;
        *) t_fail "EVT-06" "authenticated join" \
            "curl -sk -X POST $BASE_URL/api/events/$EVENT_ID/join/ -H \"Authorization: Bearer \$TOKEN\"" \
            "HTTP $HTTP_STATUS $HTTP_BODY" ;;
    esac

    http POST "/api/events/$EVENT_ID/leave/" -H "Authorization: Bearer $TOKEN"
    case "$HTTP_STATUS" in
        200|204) t_pass "EVT-07" "leave event works (HTTP $HTTP_STATUS)" ;;
        *) t_warn "EVT-07" "leave returned HTTP $HTTP_STATUS (may already have left or be creator)" ;;
    esac

    http GET "/api/events/$EVENT_ID/messages/" -H "Authorization: Bearer $TOKEN"
    case "$HTTP_STATUS" in
        200) t_pass "EVT-08" "event chat history endpoint works" ;;
        403) t_pass "EVT-08" "event chat requires membership (HTTP 403)" ;;
        *) t_fail "EVT-08" "event messages endpoint" \
            "curl -sk $BASE_URL/api/events/$EVENT_ID/messages/ -H \"Authorization: Bearer \$TOKEN\"" \
            "HTTP $HTTP_STATUS" ;;
    esac
fi
