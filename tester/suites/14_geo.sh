#!/usr/bin/env bash
# Geo & map module: tile style, search, reverse geocode, remember, meta catalogs.
source "$(dirname "$0")/../lib/common.sh"

t_suite "14 GEO & MAP — tile style, search, reverse, remember"

# Map tile style (also checked by MOD-M1a; kept here for the geo suite).
http GET /api/geo/map-style/
if [ "$HTTP_STATUS" = 200 ] && echo "$HTTP_BODY" | jq -e '.styles.light.url' >/dev/null 2>&1; then
    prov="$(echo "$HTTP_BODY" | jq -r '.provider // "?"')"
    t_pass "GEO-01" "map-style returns light/dark tile URLs (provider: $prov)"
else
    t_fail "GEO-01" "GET /api/geo/map-style/ returns tile styles" \
        "curl -sk $BASE_URL/api/geo/map-style/ | jq ." "HTTP $HTTP_STATUS"
fi

# Location search for a real Vienna address. External provider — a gateway
# error (502) is environmental, not a code defect, so it only warns.
http GET "/api/geo/search/?q=Stephansplatz%20Wien"
case "$HTTP_STATUS" in
    200)
        n="$(echo "$HTTP_BODY" | jq -r '.results | length' 2>/dev/null)"
        t_pass "GEO-02" "address search returns 200 (${n:-0} results for Stephansplatz)" ;;
    502|503|504)
        t_warn "GEO-02" "geo provider unavailable (HTTP $HTTP_STATUS) — external network required" ;;
    *)
        t_fail "GEO-02" "geo search returns 200" \
            "curl -sk '$BASE_URL/api/geo/search/?q=Stephansplatz%20Wien' | jq ." "HTTP $HTTP_STATUS" ;;
esac

# Missing query → 400
http GET "/api/geo/search/?q="
t_expect "GEO-03" "empty geo search query rejected (HTTP 400)" 400 "$HTTP_STATUS" \
    "curl -sk '$BASE_URL/api/geo/search/?q='"

# Reverse geocode for Vienna city centre coordinates.
http GET "/api/geo/reverse/?lat=48.2082&lon=16.3738"
case "$HTTP_STATUS" in
    200)
        t_pass "GEO-04" "reverse geocode returns 200 for Vienna coordinates" ;;
    502|503|504)
        t_warn "GEO-04" "geo provider unavailable (HTTP $HTTP_STATUS) — external network required" ;;
    *)
        t_fail "GEO-04" "reverse geocode returns 200" \
            "curl -sk '$BASE_URL/api/geo/reverse/?lat=48.2082&lon=16.3738' | jq ." "HTTP $HTTP_STATUS" ;;
esac

# Reverse geocode with non-numeric coordinates → 400
http GET "/api/geo/reverse/?lat=abc&lon=def"
t_expect "GEO-05" "reverse geocode rejects non-numeric coordinates (HTTP 400)" 400 "$HTTP_STATUS" \
    "curl -sk '$BASE_URL/api/geo/reverse/?lat=abc&lon=def'"

# Remember a search result (local cache write — no external network needed).
remember_payload="$(jq -nc '{query:"eval tester spot",suggestion:{id:"eval-remember-1",label:"Eval Spot",address:"Testgasse 1, 1010 Wien",latitude:48.2082,longitude:16.3738,source:"nominatim",raw:{}}}')"
http POST /api/geo/remember/ -H 'Content-Type: application/json' -d "$remember_payload"
case "$HTTP_STATUS" in
    200|201)
        t_pass "GEO-06" "remember search caches a suggestion (HTTP $HTTP_STATUS)" ;;
    *)
        t_fail "GEO-06" "POST /api/geo/remember/ caches a suggestion" \
            "$(repro_http POST /api/geo/remember/ "-H 'Content-Type: application/json' -d '$remember_payload'")" \
            "HTTP $HTTP_STATUS" ;;
esac

# Remember with a malformed suggestion → 400
http POST /api/geo/remember/ -H 'Content-Type: application/json' -d '{"query":"x"}'
t_expect "GEO-07" "remember rejects a missing suggestion (HTTP 400)" 400 "$HTTP_STATUS" \
    "curl -sk -X POST $BASE_URL/api/geo/remember/ -H 'Content-Type: application/json' -d '{\"query\":\"x\"}'"

# Meta catalogs backing the map/discover filters.
http GET /api/meta/sports/
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r 'length' 2>/dev/null)" -gt 0 ] 2>/dev/null; then
    t_pass "GEO-08" "sports catalog returns $(echo "$HTTP_BODY" | jq -r 'length') entries"
else
    t_fail "GEO-08" "GET /api/meta/sports/ returns a catalog" "curl -sk $BASE_URL/api/meta/sports/ | jq ."
fi

http GET /api/meta/districts/
if [ "$HTTP_STATUS" = 200 ] && [ "$(echo "$HTTP_BODY" | jq -r 'length' 2>/dev/null)" -gt 0 ] 2>/dev/null; then
    t_pass "GEO-09" "districts catalog returns $(echo "$HTTP_BODY" | jq -r 'length') entries"
else
    t_fail "GEO-09" "GET /api/meta/districts/ returns a catalog" "curl -sk $BASE_URL/api/meta/districts/ | jq ."
fi
