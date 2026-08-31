#!/usr/bin/env bash
# Groups API: list, detail, members, join/leave.
source "$(dirname "$0")/../lib/common.sh"

t_suite "13 GROUPS — list, detail, members, join"

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
if [ -z "$TOKEN" ]; then
    t_fail "GRP-00" "demo login for groups tests" "login $DEMO_EMAIL"
    exit 0
fi

http GET "/api/groups/?page=1&page_size=5"
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.results' >/dev/null 2>&1; then
    t_pass "GRP-01" "groups list is paginated"
else
    t_fail "GRP-01" "GET /api/groups/ paginated" "curl -sk '$BASE_URL/api/groups/?page=1' | jq ."
fi

GROUP_ID="$(echo "$HTTP_BODY" | jq -r '.results[0].id // empty')"
if [ -z "$GROUP_ID" ]; then
    t_fail "GRP-02" "at least one group in seed data" "make seed"
else
    t_pass "GRP-02" "seeded group id $GROUP_ID"
    http GET "/api/groups/$GROUP_ID/"
    t_expect "GRP-03" "group detail returns 200" 200 "$HTTP_STATUS" \
        "curl -sk $BASE_URL/api/groups/$GROUP_ID/"
fi

http GET "/api/groups/?search=run&page=1"
t_expect "GRP-04" "groups search returns 200" 200 "$HTTP_STATUS" \
    "curl -sk '$BASE_URL/api/groups/?search=run'"

if [ -n "$GROUP_ID" ]; then
    http GET "/api/groups/$GROUP_ID/members/" -H "Authorization: Bearer $TOKEN"
    case "$HTTP_STATUS" in
        200) t_pass "GRP-05" "group members list returns 200" ;;
        403) t_pass "GRP-05" "members hidden until joined (HTTP 403)" ;;
        *) t_fail "GRP-05" "group members" \
            "curl -sk $BASE_URL/api/groups/$GROUP_ID/members/ -H \"Authorization: Bearer \$TOKEN\"" \
            "HTTP $HTTP_STATUS" ;;
    esac

    http POST "/api/groups/$GROUP_ID/join/"
    t_expect "GRP-06" "join group without token → 401" 401 "$HTTP_STATUS" \
        "curl -sk -X POST $BASE_URL/api/groups/$GROUP_ID/join/"

    http POST "/api/groups/$GROUP_ID/join/" -H "Authorization: Bearer $TOKEN"
    case "$HTTP_STATUS" in
        200|201) t_pass "GRP-07" "authenticated group join (HTTP $HTTP_STATUS)" ;;
        *) t_warn "GRP-07" "join returned HTTP $HTTP_STATUS (already a member is OK)" ;;
    esac

    http GET "/api/groups/$GROUP_ID/events/"
    t_expect "GRP-08" "group events list returns 200" 200 "$HTTP_STATUS" \
        "curl -sk $BASE_URL/api/groups/$GROUP_ID/events/"

    http GET "/api/groups/$GROUP_ID/messages/" -H "Authorization: Bearer $TOKEN"
    case "$HTTP_STATUS" in
        200) t_pass "GRP-09" "group chat history returns 200" ;;
        403) t_pass "GRP-09" "group chat restricted to members (HTTP 403)" ;;
        *) t_fail "GRP-09" "group messages" \
            "curl -sk $BASE_URL/api/groups/$GROUP_ID/messages/ -H \"Authorization: Bearer \$TOKEN\"" \
            "HTTP $HTTP_STATUS" ;;
    esac
fi
