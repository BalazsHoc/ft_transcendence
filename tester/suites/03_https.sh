#!/usr/bin/env bash
# HTTPS: TLS serving, security headers, WSS, no mixed content endpoints.
source "$(dirname "$0")/../lib/common.sh"

t_suite "03 HTTPS / SECURE CONNECTIONS"

# TLS handshake works and serves the SPA
http GET /
t_expect "TLS-01" "HTTPS serves the app on 443" 200 "$HTTP_STATUS" \
    "curl -sk -o /dev/null -w '%{http_code}' $BASE_URL/"

# Certificate details (self-signed is fine for eval, but must exist)
host_port="${BASE_URL#https://}"; host_port="${host_port%%/*}"
[ "${host_port#*:}" = "$host_port" ] && host_port="$host_port:443"
cert="$(echo | openssl s_client -connect "$host_port" -servername "${host_port%%:*}" 2>/dev/null \
    | openssl x509 -noout -subject -enddate 2>/dev/null)"
if [ -n "$cert" ]; then
    t_pass "TLS-02" "TLS certificate present ($(echo "$cert" | tr '\n' ' '))"
else
    t_fail "TLS-02" "TLS certificate present" \
        "echo | openssl s_client -connect $host_port | openssl x509 -noout -subject"
fi

# API only via HTTPS: plain HTTP on port 80 must not serve the app unencrypted.
plain="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://${host_port%%:*}/" 2>/dev/null)"
case "$plain" in
    000)
        t_pass "TLS-03" "port 80 does not serve unencrypted content (connection refused/reset)" ;;
    301|302|307|308)
        t_pass "TLS-03" "port 80 redirects to HTTPS (HTTP $plain)" ;;
    *)
        t_fail "TLS-03" "port 80 must redirect to HTTPS or be closed" \
            "curl -sv http://${host_port%%:*}/ -o /dev/null" \
            "got HTTP $plain — content served unencrypted" ;;
esac

# WSS endpoint — unauthenticated upgrade is rejected (403); authenticated works (see MOD-W2).
ws_status="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 5 \
    -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
    -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGVzdGVyLWtleS1oZXJlIQ==' \
    "$BASE_URL/ws/presence/" 2>/dev/null)"
case "$ws_status" in
    101)
        t_pass "TLS-04" "WebSocket upgrade over TLS works (wss://, HTTP 101)" ;;
    403|401)
        t_pass "TLS-04" "WSS endpoint reachable and rejects unauthenticated upgrade (HTTP $ws_status — JWT required)" ;;
    *)
        t_fail "TLS-04" "WebSocket upgrade over TLS works (wss://)" \
            "curl -skv -H 'Connection: Upgrade' -H 'Upgrade: websocket' -H 'Sec-WebSocket-Version: 13' -H 'Sec-WebSocket-Key: dGVzdGVyLWtleS1oZXJlIQ==' $BASE_URL/ws/presence/" \
            "expected HTTP 101 or 403, got $ws_status" ;;
esac

# Frontend bundle must not hard-code insecure http:// or ws:// backend URLs
mixed="$(curl -sk "$BASE_URL/" | grep -oE 'src="[^"]+\.js"' | head -3 | grep -oE '/[^"]+' | while read -r js; do
    curl -sk "$BASE_URL$js" | grep -oE '(http|ws)://(localhost|127\.0\.0\.1)[^"'"'"' ]*' | grep -v 'w3.org' || true
done | sort -u)"
if [ -z "$mixed" ]; then
    t_pass "TLS-05" "no insecure http://ws:// backend URLs in the served JS bundle"
else
    t_warn "TLS-05" "insecure URLs found in JS bundle" "$mixed"
fi

t_manual "TLS-H1" "In Chrome, confirm the address bar shows the connection as encrypted (self-signed warning accepted once)."
