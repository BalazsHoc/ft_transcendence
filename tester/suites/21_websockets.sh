#!/usr/bin/env bash
# WebSocket chat: event, group and direct message echo over WSS, plus the
# unauthenticated (4001) and forbidden (4003) rejection paths. Uses throwaway
# event/group owned by the demo user for deterministic access (Live chat / WS).
source "$(dirname "$0")/../lib/common.sh"

t_suite "21 WEBSOCKETS — event / group / direct chat + rejections"

NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
    t_skip "WSX-00" "websocket chat tests" "node not installed"
    exit 0
fi
if [ ! -d "$TESTER_DIR/browser/node_modules/ws" ]; then
    echo "  installing browser deps (ws)..."
    (cd "$TESTER_DIR/browser" && npm install --no-fund --no-audit --loglevel=error) >/dev/null 2>&1
fi

TOKEN="$(login "$DEMO_EMAIL" "$DEMO_PASSWORD")"
TOKEN2="$(login "$DEMO2_EMAIL" "$DEMO2_PASSWORD")"
if [ -z "$TOKEN" ] || [ -z "$TOKEN2" ]; then
    t_fail "WSX-00" "demo logins for websocket tests" "login $DEMO_EMAIL / $DEMO2_EMAIL"
    exit 0
fi
AUTH="$(auth_h "$TOKEN")"

# run_ws ID WS_PATH TOKEN [reject] — runs the node WS probe and reports.
# Pass reject=1 to assert the socket is refused (unauthenticated / forbidden).
run_ws() {
    local id="$1" path="$2" token="$3" reject="${4:-}" out line st rest repro
    out="$(cd "$TESTER_DIR/browser" && WS_ID="$id" WS_PATH="$path" TOKEN="$token" \
        EXPECT_REJECT="$reject" WS_URL="$WS_URL" node chat-ws-test.js 2>&1)"
    printf '%s\n' "$out" >> "$RESULTS_DIR/run.log"
    line="$(printf '%s\n' "$out" | grep -E '^(PASS|FAIL)' | head -1)"
    st="$(printf '%s' "$line" | cut -f1)"
    rest="$(printf '%s' "$line" | cut -f3-)"
    if [ "$st" = "PASS" ]; then
        t_pass "$id" "$rest"
    else
        repro="$(printf '%s\n' "$out" | awk -v id="$id" '$1=="REPRO" && $2==id {sub(/^[^\t]*\t[^\t]*\t/,""); print; exit}')"
        t_fail "$id" "${rest:-websocket test failed}" "${repro:-node tester/browser/chat-ws-test.js}"
    fi
}

# --- Event chat: creator can chat in their own event's room -----------------
EVT_ID="$(create_event "$TOKEN" "Eval WS Event $(date +%s%N)")"
if [ -n "$EVT_ID" ] && [ "$EVT_ID" != "null" ]; then
    run_ws "WSX-01" "ws/events/$EVT_ID" "$TOKEN"
    run_ws "WSX-04" "ws/events/$EVT_ID" "" "1"        # no token -> unauthenticated
    curl -sk -X DELETE "$BASE_URL/api/events/$EVT_ID/" -H "$AUTH" >/dev/null 2>&1
else
    t_fail "WSX-01" "create event for WS test" "create_event failed (body=$HTTP_BODY)"
fi

# --- Group chat: owner is a member and can chat in the group room -----------
GRP_ID="$(create_group "$TOKEN" "Eval WS Group $(date +%s%N)")"
if [ -n "$GRP_ID" ] && [ "$GRP_ID" != "null" ]; then
    run_ws "WSX-02" "ws/groups/$GRP_ID" "$TOKEN"
    curl -sk -X DELETE "$BASE_URL/api/groups/$GRP_ID/" -H "$AUTH" >/dev/null 2>&1
else
    t_fail "WSX-02" "create group for WS test" "create_group failed (body=$HTTP_BODY)"
fi

# --- Direct chat: two accepted friends share a conversation -----------------
ensure_friends "$TOKEN" "$TOKEN2" >/dev/null 2>&1
ID2="$(me_id "$TOKEN2")"
http POST /api/messages/conversations/ -H "$AUTH" -H 'Content-Type: application/json' -d "{\"user_id\":\"$ID2\"}"
CONV_ID="$(echo "$HTTP_BODY" | jq -r '.id // empty')"
if [ -n "$CONV_ID" ]; then
    run_ws "WSX-03" "ws/direct/$CONV_ID" "$TOKEN"
else
    t_warn "WSX-03" "direct chat WS" "could not open a conversation (HTTP $HTTP_STATUS) — are the demo users friends?"
fi

# --- Forbidden path: a valid user cannot open an unrelated conversation ------
run_ws "WSX-05" "ws/direct/00000000-0000-0000-0000-000000000000" "$TOKEN" "1"
