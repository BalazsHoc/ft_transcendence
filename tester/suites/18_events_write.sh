#!/usr/bin/env bash
# Event write lifecycle: create, retrieve, owner edit, non-owner 403, join/leave,
# auth guard and delete. Creates a throwaway event owned by the demo user and
# cleans it up at the end (Events module — write paths).
source "$(dirname "$0")/../lib/common.sh"

t_suite "18 EVENTS (write) — create, edit, join/leave, delete"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
TOKEN2="$(login "$DEMO2_EMAIL" "$DEMO2_PASSWORD")"
if [ -z "$TOKEN" ] || [ -z "$TOKEN2" ]; then
    t_fail "EVT-00" "demo logins for event write tests" "login $DEMO_EMAIL / $DEMO2_EMAIL"
    exit 0
fi
AUTH="$(auth_h "$TOKEN")"; AUTH2="$(auth_h "$TOKEN2")"

STAMP="$(date +%s%N)"
EVT_ID="$(create_event "$TOKEN" "Eval Write Event $STAMP")"
if [ -n "$EVT_ID" ] && [ "$EVT_ID" != "null" ]; then
    t_pass "EVT-01" "create event via POST /api/events/ (id $EVT_ID)"
else
    t_fail "EVT-01" "POST /api/events/ creates an event" \
        "curl -sk -X POST $BASE_URL/api/events/ -H '$AUTH' -H 'Content-Type: application/json' -d '<event json>'" \
        "no id returned (body=$HTTP_BODY)"
    exit 0
fi

# Retrieve.
http GET "/api/events/$EVT_ID/" -H "$AUTH"
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.title')" = "Eval Write Event $STAMP" ]; then
    t_pass "EVT-02" "GET /api/events/<id>/ returns the created event"
else
    t_fail "EVT-02" "GET /api/events/<id>/ returns the event" \
        "curl -sk $BASE_URL/api/events/$EVT_ID/ -H '$AUTH'" "HTTP $HTTP_STATUS"
fi

# Owner edit.
http PATCH "/api/events/$EVT_ID/" -H "$AUTH" -H 'Content-Type: application/json' -d '{"description":"edited by owner"}'
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.description')" = "edited by owner" ]; then
    t_pass "EVT-03" "creator can PATCH the event (200)"
else
    t_fail "EVT-03" "creator can edit their event" \
        "curl -sk -X PATCH $BASE_URL/api/events/$EVT_ID/ -H '$AUTH' -H 'Content-Type: application/json' -d '{\"description\":\"edited by owner\"}'" \
        "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Non-owner cannot edit.
http PATCH "/api/events/$EVT_ID/" -H "$AUTH2" -H 'Content-Type: application/json' -d '{"description":"hijack"}'
t_expect "EVT-04" "non-owner PATCH -> 403" 403 "$HTTP_STATUS" \
    "curl -sk -X PATCH $BASE_URL/api/events/$EVT_ID/ -H '$AUTH2' -H 'Content-Type: application/json' -d '{\"description\":\"hijack\"}'"

# Second user joins then leaves.
http POST "/api/events/$EVT_ID/join/" -H "$AUTH2"
t_expect "EVT-05" "second user joins the event -> 201" 201 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/events/$EVT_ID/join/ -H '$AUTH2'"

http POST "/api/events/$EVT_ID/leave/" -H "$AUTH2"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.success == true' >/dev/null 2>&1; then
    t_pass "EVT-06" "second user leaves the event (200, success)"
else
    t_fail "EVT-06" "POST /api/events/<id>/leave/ succeeds" \
        "curl -sk -X POST $BASE_URL/api/events/$EVT_ID/leave/ -H '$AUTH2'" "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Auth guard on create.
http POST /api/events/ -H 'Content-Type: application/json' -d '{"title":"nope"}'
t_expect "EVT-07" "create without token -> 401" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/events/ -H 'Content-Type: application/json' -d '{\"title\":\"nope\"}'"

# Owner deletes (cleanup).
http DELETE "/api/events/$EVT_ID/" -H "$AUTH"
t_expect "EVT-08" "creator deletes the event -> 204" 204 "$HTTP_STATUS" \
    "curl -sk -X DELETE $BASE_URL/api/events/$EVT_ID/ -H '$AUTH'"

http GET "/api/events/$EVT_ID/" -H "$AUTH"
t_expect "EVT-09" "deleted event returns 404" 404 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/api/events/$EVT_ID/ -H '$AUTH'"
