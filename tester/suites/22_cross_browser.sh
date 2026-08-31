#!/usr/bin/env bash
# Cross-browser smoke: run the same landing -> login -> navigate journey in every
# installed browser (Chrome/Chromium/Edge over CDP, Firefox best-effort). Missing
# browsers are warnings, not failures, unless --strict-browsers is passed
# (Additional browser support module).
source "$(dirname "$0")/../lib/common.sh"

t_suite "22 CROSS-BROWSER — shared smoke across installed browsers"

NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
    t_skip "XB-00" "cross-browser smoke" "node not installed"
    exit 0
fi
if [ ! -d "$TESTER_DIR/browser/node_modules/puppeteer-core" ]; then
    echo "  installing browser deps..."
    (cd "$TESTER_DIR/browser" && npm install --no-fund --no-audit --loglevel=error) >/dev/null 2>&1
fi

# Cross-browser always runs headless (launching 2-3 windows during a headed run
# would be disruptive); override with TESTER_BROWSERS / TESTER_STRICT_BROWSERS.
export TESTER_HEADLESS=1
export TESTER_BROWSERS="${TESTER_BROWSERS:-chrome,edge,chromium,firefox}"
export TESTER_STRICT_BROWSERS="${TESTER_STRICT_BROWSERS:-0}"
export BASE_URL DEMO_EMAIL DEMO_PASSWORD

echo "  browsers: $TESTER_BROWSERS (strict=$TESTER_STRICT_BROWSERS)"

out="$(cd "$TESTER_DIR/browser" && node cross-browser.js 2>&1)"; rc=$?
printf '%s\n' "$out" >> "$RESULTS_DIR/run.log"

while IFS=$'\t' read -r status id rest; do
    case "$status" in
        PASS) t_pass "$id" "$rest" ;;
        FAIL)
            repro="$(echo "$out" | awk -v id="$id" '$1=="REPRO" && $2==id {sub(/^[^\t]*\t[^\t]*\t/,""); print; exit}')"
            t_fail "$id" "$rest" "${repro:-TESTER_HEADLESS=1 node tester/browser/cross-browser.js}"
            ;;
        WARN) t_warn "$id" "$rest" ;;
        HUD) printf '          %s%s%s\n' "$C_DIM" "$rest" "$C_RESET" ;;
        XB_SUMMARY)
            printf '          %ssummary: %s%s%s\n' "$C_DIM" "$id" "$rest" "$C_RESET"
            ;;
    esac
done <<< "$out"

# At least two browsers must complete the smoke for the "additional browser
# support" module to be demonstrable automatically.
pass_ids="$(printf '%s\n' "$out" | awk -F'\t' '$1=="PASS" && $2 ~ /-nav$/ {print $2}' | wc -l)"
if [ "${pass_ids:-0}" -ge 2 ]; then
    t_pass "XB-MULTI" "shared smoke completed in $pass_ids browsers (>= 2)"
else
    if [ "$TESTER_STRICT_BROWSERS" = "1" ]; then
        t_fail "XB-MULTI" "fewer than 2 browsers completed the smoke" \
            "TESTER_STRICT_BROWSERS=1 TESTER_BROWSERS=$TESTER_BROWSERS node tester/browser/cross-browser.js"
    else
        t_warn "XB-MULTI" "only $pass_ids browser(s) completed the smoke — install a second browser for cross-browser coverage"
    fi
fi
