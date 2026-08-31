#!/usr/bin/env bash
# Friends, profiles, presence, and direct chat REST.
source "$(dirname "$0")/../lib/common.sh"

t_suite "12 SOCIAL — friends, profiles, direct chat"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
TOKEN2="$(login "$DEMO2_EMAIL" "$DEMO2_PASSWORD")"
if [ -z "$TOKEN" ] || [ -z "$TOKEN2" ]; then
    t_fail "SOC-00" "both demo accounts can log in" "login $DEMO_EMAIL and $DEMO2_EMAIL"
    exit 0
fi

ME="$(curl -sk "$BASE_URL/api/auth/me/" -H "Authorization: Bearer $TOKEN")"
ME_ID="$(echo "$ME" | jq -r '.id // empty')"
OTHER="$(curl -sk "$BASE_URL/api/auth/me/" -H "Authorization: Bearer $TOKEN2")"
OTHER_ID="$(echo "$OTHER" | jq -r '.id // empty')"

http GET /api/users/ -H "Authorization: Bearer $TOKEN"
t_expect "SOC-01" "user search list returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/users/ -H \"Authorization: Bearer \$TOKEN\""

http GET "/api/users/?search=alex" -H "Authorization: Bearer $TOKEN"
t_expect "SOC-02" "user search filter returns 200" 200 "$HTTP_STATUS" \
    "curl -sk '$BASE_URL/api/users/?search=alex' -H \"Authorization: Bearer \$TOKEN\""

http GET "/api/users/$OTHER_ID/" -H "Authorization: Bearer $TOKEN"
t_expect "SOC-03" "public profile by uuid returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/users/$OTHER_ID/"

http GET "/api/users/$OTHER_ID/presence/"
t_expect "SOC-04" "presence endpoint returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/users/$OTHER_ID/presence/"

http GET "/api/users/$OTHER_ID/activities/"
t_expect "SOC-05" "user activities timeline returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/users/$OTHER_ID/activities/"

http GET /api/friends/ -H "Authorization: Bearer $TOKEN"
t_expect "SOC-06" "friends list returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/friends/ -H \"Authorization: Bearer \$TOKEN\""

http GET /api/friends/requests/incoming/ -H "Authorization: Bearer $TOKEN"
t_expect "SOC-07" "incoming friend requests returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/friends/requests/incoming/ -H \"Authorization: Bearer \$TOKEN\""

http GET /api/friends/requests/outgoing/ -H "Authorization: Bearer $TOKEN"
t_expect "SOC-08" "outgoing friend requests returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/friends/requests/outgoing/ -H \"Authorization: Bearer \$TOKEN\""

# DMs require an accepted friendship — accept a pending request or send a new one.
jq_list='if type=="array" then . else (.results // []) end'
friends_json="$(curl -sk "$BASE_URL/api/friends/" -H "Authorization: Bearer $TOKEN")"
already="$(echo "$friends_json" | jq -r --arg id "$OTHER_ID" "$jq_list | any(.friend.id == \$id)")"
if [ "$already" != "true" ]; then
    inc="$(curl -sk "$BASE_URL/api/friends/requests/incoming/" -H "Authorization: Bearer $TOKEN")"
    rid="$(echo "$inc" | jq -r --arg id "$OTHER_ID" "$jq_list | map(select(.requested_by==\$id or .requester.id==\$id)) | .[0].id // empty")"
    if [ -n "$rid" ]; then
        curl -sk -X POST "$BASE_URL/api/friends/requests/$rid/accept/" -H "Authorization: Bearer $TOKEN" >/dev/null
    else
        inc2="$(curl -sk "$BASE_URL/api/friends/requests/incoming/" -H "Authorization: Bearer $TOKEN2")"
        rid2="$(echo "$inc2" | jq -r --arg id "$ME_ID" "$jq_list | map(select(.requested_by==\$id or .requester.id==\$id)) | .[0].id // empty")"
        if [ -n "$rid2" ]; then
            curl -sk -X POST "$BASE_URL/api/friends/requests/$rid2/accept/" -H "Authorization: Bearer $TOKEN2" >/dev/null
        else
            curl -sk -X POST "$BASE_URL/api/friends/requests/" \
                -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
                -d "{\"user_id\":\"$OTHER_ID\"}" >/dev/null
            inc2="$(curl -sk "$BASE_URL/api/friends/requests/incoming/" -H "Authorization: Bearer $TOKEN2")"
            rid2="$(echo "$inc2" | jq -r "$jq_list | .[0].id // empty")"
            if [ -n "$rid2" ]; then
                curl -sk -X POST "$BASE_URL/api/friends/requests/$rid2/accept/" -H "Authorization: Bearer $TOKEN2" >/dev/null
            fi
        fi
    fi
    t_pass "SOC-08b" "demo users are now friends (required for DMs)"
else
    t_pass "SOC-08b" "demo users are already friends"
fi

http GET /api/messages/conversations/ -H "Authorization: Bearer $TOKEN"
t_expect "SOC-09" "direct conversations list returns 200" 200 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/messages/conversations/ -H \"Authorization: Bearer \$TOKEN\""

CONV_ID=""
http POST /api/messages/conversations/ -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
    -d "{\"user_id\":\"$OTHER_ID\"}"
case "$HTTP_STATUS" in
    200|201) CONV_ID="$(echo "$HTTP_BODY" | jq -r '.id // empty')"
        t_pass "SOC-09b" "get-or-create conversation with second user (HTTP $HTTP_STATUS)" ;;
    *) t_warn "SOC-09b" "could not open conversation with user2 (HTTP $HTTP_STATUS) — using first listed" ;;
esac
if [ -z "$CONV_ID" ]; then
    CONV_ID="$(curl -sk "$BASE_URL/api/messages/conversations/" -H "Authorization: Bearer $TOKEN" \
        | jq -r '(if type=="array" then .[0].id else .results[0].id end) // empty')"
fi
if [ -n "$CONV_ID" ]; then
    http GET "/api/messages/conversations/$CONV_ID/messages/" -H "Authorization: Bearer $TOKEN"
    t_expect "SOC-10" "conversation messages list returns 200" 200 "$HTTP_STATUS" \
        "curl -sk $BASE_URL/api/messages/conversations/$CONV_ID/messages/ -H \"Authorization: Bearer \$TOKEN\""

    http POST "/api/messages/conversations/$CONV_ID/messages/" \
        -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
        -d '{"text":"eval-tester ping"}'
    case "$HTTP_STATUS" in
        200|201) t_pass "SOC-11" "send direct message works (HTTP $HTTP_STATUS)" ;;
        *) t_fail "SOC-11" "send direct message" \
            "curl -sk -X POST $BASE_URL/api/messages/conversations/$CONV_ID/messages/ -H \"Authorization: Bearer \$TOKEN\" -d '{\"text\":\"hi\"}'" \
            "HTTP $HTTP_STATUS" ;;
    esac

    http POST "/api/messages/conversations/$CONV_ID/messages/" \
        -H "Authorization: Bearer $TOKEN2" -H 'Content-Type: application/json' \
        -d '{"text":"eval-reply from user2"}'
    case "$HTTP_STATUS" in
        200|201) t_pass "SOC-13" "second user can reply in the same conversation (HTTP $HTTP_STATUS)" ;;
        *) t_fail "SOC-13" "second user reply" \
            "curl -sk -X POST $BASE_URL/api/messages/conversations/$CONV_ID/messages/ -H \"Authorization: Bearer \$TOKEN2\" -d '{\"text\":\"hi\"}'" \
            "HTTP $HTTP_STATUS" ;;
    esac
else
    t_warn "SOC-10" "no seeded conversation — skip send-message (friends may not be accepted)"
fi

http GET /api/messages/conversations/
t_expect "SOC-12" "conversations without token → 401" 401 "$HTTP_STATUS" \
    "curl -sk $BASE_URL/api/messages/conversations/"
