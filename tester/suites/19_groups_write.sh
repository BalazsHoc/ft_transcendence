#!/usr/bin/env bash
# Group write lifecycle: create, retrieve, owner edit, non-admin 403, member
# join, members list, owner-only group event creation, leave rules and delete.
# Creates a throwaway group owned by the demo user and cleans it up (Groups).
source "$(dirname "$0")/../lib/common.sh"

t_suite "19 GROUPS (write) — create, edit, join, group events, leave, delete"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
TOKEN2="$(login "$DEMO2_EMAIL" "$DEMO2_PASSWORD")"
if [ -z "$TOKEN" ] || [ -z "$TOKEN2" ]; then
    t_fail "GRP-00" "demo logins for group write tests" "login $DEMO_EMAIL / $DEMO2_EMAIL"
    exit 0
fi
AUTH="$(auth_h "$TOKEN")"; AUTH2="$(auth_h "$TOKEN2")"
ID2="$(me_id "$TOKEN2")"

STAMP="$(date +%s%N)"
GRP_ID="$(create_group "$TOKEN" "Eval Write Group $STAMP")"
if [ -n "$GRP_ID" ] && [ "$GRP_ID" != "null" ]; then
    t_pass "GRP-01" "create group via POST /api/groups/ (id $GRP_ID)"
else
    t_fail "GRP-01" "POST /api/groups/ creates a group" \
        "curl -sk -X POST $BASE_URL/api/groups/ -H '$AUTH' -H 'Content-Type: application/json' -d '<group json>'" \
        "no id returned (body=$HTTP_BODY)"
    exit 0
fi

# Retrieve.
http GET "/api/groups/$GRP_ID/" -H "$AUTH"
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.name')" = "Eval Write Group $STAMP" ]; then
    t_pass "GRP-02" "GET /api/groups/<id>/ returns the created group"
else
    t_fail "GRP-02" "GET /api/groups/<id>/ returns the group" \
        "curl -sk $BASE_URL/api/groups/$GRP_ID/ -H '$AUTH'" "HTTP $HTTP_STATUS"
fi

# Owner edit.
http PATCH "/api/groups/$GRP_ID/" -H "$AUTH" -H 'Content-Type: application/json' -d '{"description":"edited by owner"}'
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.description')" = "edited by owner" ]; then
    t_pass "GRP-03" "owner can PATCH the group (200)"
else
    t_fail "GRP-03" "owner can edit their group" \
        "curl -sk -X PATCH $BASE_URL/api/groups/$GRP_ID/ -H '$AUTH' -H 'Content-Type: application/json' -d '{\"description\":\"edited by owner\"}'" \
        "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Non-admin cannot edit.
http PATCH "/api/groups/$GRP_ID/" -H "$AUTH2" -H 'Content-Type: application/json' -d '{"description":"hijack"}'
t_expect "GRP-04" "non-admin PATCH -> 403" 403 "$HTTP_STATUS" \
    "curl -sk -X PATCH $BASE_URL/api/groups/$GRP_ID/ -H '$AUTH2' -H 'Content-Type: application/json' -d '{\"description\":\"hijack\"}'"

# Second user joins.
http POST "/api/groups/$GRP_ID/join/" -H "$AUTH2"
t_expect "GRP-05" "second user joins the group -> 201" 201 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/groups/$GRP_ID/join/ -H '$AUTH2'"

# Members list includes the joiner.
http GET "/api/groups/$GRP_ID/members/" -H "$AUTH"
if echo "$HTTP_BODY" | jq -e --arg id "$ID2" "($_LIST_JQ) | any(.user.id == \$id)" >/dev/null 2>&1; then
    t_pass "GRP-06" "members list includes the new member"
else
    t_fail "GRP-06" "GET /api/groups/<id>/members/ lists the member" \
        "curl -sk $BASE_URL/api/groups/$GRP_ID/members/ -H '$AUTH'" "HTTP $HTTP_STATUS"
fi

# Owner creates a group event.
sport="$(first_sport)"; gstart="$(iso_future '+9 days')"; gend="$(iso_future '+9 days 2 hours')"
gev_body="$(jq -nc --arg s "$sport" --arg sa "$gstart" --arg ea "$gend" \
    '{title:"Eval Group Event",description:"group event",sport:$s,level:"all",languages:["en"],location_name:"Eval Field",location_address:"Testgasse 3, 1010 Wien",latitude:48.21,longitude:16.37,start_at:$sa,end_at:$ea,max_slots:8,visibility:"public"}')"
http POST "/api/groups/$GRP_ID/events/" -H "$AUTH" -H 'Content-Type: application/json' -d "$gev_body"
GEV_ID="$(echo "$HTTP_BODY" | jq -r '.id // empty')"
t_expect "GRP-07" "owner creates a group event -> 201" 201 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/groups/$GRP_ID/events/ -H '$AUTH' -H 'Content-Type: application/json' -d '<event json>'"

# Non-owner member cannot create a group event.
http POST "/api/groups/$GRP_ID/events/" -H "$AUTH2" -H 'Content-Type: application/json' -d "$gev_body"
t_expect "GRP-08" "non-owner group event creation -> 403" 403 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/groups/$GRP_ID/events/ -H '$AUTH2' -H 'Content-Type: application/json' -d '<event json>'"

# Member leaves.
http POST "/api/groups/$GRP_ID/leave/" -H "$AUTH2"
t_expect "GRP-09" "member leaves the group -> 204" 204 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/groups/$GRP_ID/leave/ -H '$AUTH2'"

# Owner cannot leave without transferring ownership.
http POST "/api/groups/$GRP_ID/leave/" -H "$AUTH"
t_expect "GRP-10" "owner leave is blocked -> 400" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/groups/$GRP_ID/leave/ -H '$AUTH'"

# Auth guard on create.
http POST /api/groups/ -H 'Content-Type: application/json' -d '{"name":"nope"}'
t_expect "GRP-11" "create without token -> 401" 401 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' -X POST $BASE_URL/api/groups/ -H 'Content-Type: application/json' -d '{\"name\":\"nope\"}'"

# Cleanup: delete the group event (if created) then the group.
[ -n "$GEV_ID" ] && curl -sk -X DELETE "$BASE_URL/api/events/$GEV_ID/" -H "$AUTH" >/dev/null 2>&1
http DELETE "/api/groups/$GRP_ID/" -H "$AUTH"
t_expect "GRP-12" "owner deletes the group -> 204" 204 "$HTTP_STATUS" \
    "curl -sk -X DELETE $BASE_URL/api/groups/$GRP_ID/ -H '$AUTH'"

http GET "/api/groups/$GRP_ID/" -H "$AUTH"
t_expect "GRP-13" "deleted group returns 404" 404 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/api/groups/$GRP_ID/ -H '$AUTH'"
