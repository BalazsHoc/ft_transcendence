#!/usr/bin/env bash
# Friendship lifecycle: send -> reject -> resend -> accept -> list -> remove,
# plus the recipient-only permission guards. Fully self-contained: it uses two
# throwaway accounts so demo friendships are never touched (W-6).
source "$(dirname "$0")/../lib/common.sh"

t_suite "17 SOCIAL — friend request lifecycle"

STAMP="$(date +%s%N)"
TA="$(register_user "soc-a-$STAMP@example.test" "TestPass1x" "Soc Alpha")"
TB="$(register_user "soc-b-$STAMP@example.test" "TestPass1x" "Soc Beta")"
if [ -z "$TA" ] || [ -z "$TB" ]; then
    t_fail "SOC-00" "register two throwaway users" "register_user soc-a-$STAMP@example.test ..."
    exit 0
fi
AUTH_A="$(auth_h "$TA")"; AUTH_B="$(auth_h "$TB")"
IDA="$(me_id "$TA")"; IDB="$(me_id "$TB")"

# A -> B request.
http POST /api/friends/requests/ -H "$AUTH_A" -H 'Content-Type: application/json' -d "{\"user_id\":\"$IDB\"}"
FR_ID="$(echo "$HTTP_BODY" | jq -r '.id // empty')"
if [ "$HTTP_STATUS" = 201 ] && [ "$(echo "$HTTP_BODY" | jq -r '.status')" = "pending" ]; then
    t_pass "SOC-01" "A sends friend request to B (201, pending, id $FR_ID)"
else
    t_fail "SOC-01" "POST /api/friends/requests/ creates a pending request" \
        "curl -sk -X POST $BASE_URL/api/friends/requests/ -H '$AUTH_A' -H 'Content-Type: application/json' -d '{\"user_id\":\"$IDB\"}'" \
        "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# B sees it in the incoming list.
http GET /api/friends/requests/incoming/ -H "$AUTH_B"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e --argjson fr "${FR_ID:-0}" "($_LIST_JQ) | any(.id == \$fr)" >/dev/null 2>&1; then
    t_pass "SOC-02" "request appears in B's incoming list"
else
    t_fail "SOC-02" "GET /api/friends/requests/incoming/ shows the request" \
        "curl -sk $BASE_URL/api/friends/requests/incoming/ -H '$AUTH_B'" "HTTP $HTTP_STATUS"
fi

# Requester cannot reject their own request.
http POST "/api/friends/requests/$FR_ID/reject/" -H "$AUTH_A"
t_expect "SOC-03" "requester cannot reject own request -> 400" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/friends/requests/$FR_ID/reject/ -H '$AUTH_A'"

# B rejects.
http POST "/api/friends/requests/$FR_ID/reject/" -H "$AUTH_B"
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.status')" = "rejected" ]; then
    t_pass "SOC-04" "B rejects the request (status rejected)"
else
    t_fail "SOC-04" "POST /api/friends/requests/<id>/reject/ sets rejected" \
        "curl -sk -X POST $BASE_URL/api/friends/requests/$FR_ID/reject/ -H '$AUTH_B'" "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# A resends after rejection (same pair re-opens to pending).
http POST /api/friends/requests/ -H "$AUTH_A" -H 'Content-Type: application/json' -d "{\"user_id\":\"$IDB\"}"
if [ "$HTTP_STATUS" = 201 ] && [ "$(echo "$HTTP_BODY" | jq -r '.status')" = "pending" ]; then
    t_pass "SOC-05" "A resends after rejection (pending again)"
else
    t_fail "SOC-05" "resend after rejection re-opens the request" \
        "curl -sk -X POST $BASE_URL/api/friends/requests/ -H '$AUTH_A' -H 'Content-Type: application/json' -d '{\"user_id\":\"$IDB\"}'" \
        "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Requester cannot accept their own request.
http POST "/api/friends/requests/$FR_ID/accept/" -H "$AUTH_A"
t_expect "SOC-06" "requester cannot accept own request -> 400" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/friends/requests/$FR_ID/accept/ -H '$AUTH_A'"

# B accepts.
http POST "/api/friends/requests/$FR_ID/accept/" -H "$AUTH_B"
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r '.status')" = "accepted" ]; then
    t_pass "SOC-07" "B accepts the request (status accepted)"
else
    t_fail "SOC-07" "POST /api/friends/requests/<id>/accept/ sets accepted" \
        "curl -sk -X POST $BASE_URL/api/friends/requests/$FR_ID/accept/ -H '$AUTH_B'" "HTTP $HTTP_STATUS body=$HTTP_BODY"
fi

# Both friend lists now include the other user.
http GET /api/friends/ -H "$AUTH_A"
if echo "$HTTP_BODY" | jq -e --arg id "$IDB" "($_LIST_JQ) | any(.friend.id == \$id)" >/dev/null 2>&1; then
    t_pass "SOC-08" "A's friend list contains B"
else
    t_fail "SOC-08" "GET /api/friends/ lists the new friend for A" \
        "curl -sk $BASE_URL/api/friends/ -H '$AUTH_A'" "HTTP $HTTP_STATUS"
fi
http GET /api/friends/ -H "$AUTH_B"
if echo "$HTTP_BODY" | jq -e --arg id "$IDA" "($_LIST_JQ) | any(.friend.id == \$id)" >/dev/null 2>&1; then
    t_pass "SOC-09" "B's friend list contains A"
else
    t_fail "SOC-09" "GET /api/friends/ lists the new friend for B" \
        "curl -sk $BASE_URL/api/friends/ -H '$AUTH_B'" "HTTP $HTTP_STATUS"
fi

# Duplicate request while already friends is rejected.
http POST /api/friends/requests/ -H "$AUTH_A" -H 'Content-Type: application/json' -d "{\"user_id\":\"$IDB\"}"
t_expect "SOC-10" "duplicate request while friends -> 400" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/friends/requests/ -H '$AUTH_A' -H 'Content-Type: application/json' -d '{\"user_id\":\"$IDB\"}'"

# A removes the friendship (unfriend).
http DELETE "/api/friends/$FR_ID/" -H "$AUTH_A"
t_expect "SOC-11" "A removes the friendship (unfriend) -> 204" 204 "$HTTP_STATUS" \
    "curl -sk -X DELETE $BASE_URL/api/friends/$FR_ID/ -H '$AUTH_A'"

# Friendship is gone from A's list.
http GET /api/friends/ -H "$AUTH_A"
if echo "$HTTP_BODY" | jq -e --arg id "$IDB" "($_LIST_JQ) | any(.friend.id == \$id) | not" >/dev/null 2>&1; then
    t_pass "SOC-12" "friendship no longer in A's list after removal"
else
    t_fail "SOC-12" "friend list no longer contains the removed user" \
        "curl -sk $BASE_URL/api/friends/ -H '$AUTH_A'" "HTTP $HTTP_STATUS"
fi
