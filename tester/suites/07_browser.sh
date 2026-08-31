#!/usr/bin/env bash
# Browser: Chrome opens, HUD overlay, console errors, legal, theme, logged-in journey.
source "$(dirname "$0")/../lib/common.sh"

t_suite "07 BROWSER — visible Chrome, console, journey"

CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)"
if [ -z "$CHROME" ]; then
    t_fail "BR-00" "Chrome available" "sudo apt install google-chrome-stable"
    exit 0
fi

if [ ! -d "$TESTER_DIR/browser/node_modules/puppeteer-core" ]; then
    echo "  installing browser deps..."
    (cd "$TESTER_DIR/browser" && npm install --no-fund --no-audit --loglevel=error)
fi

export CHROME_PATH="$CHROME"
export TESTER_STRICT="${TESTER_STRICT:-1}"
export TESTER_HEADLESS="${TESTER_HEADLESS:-0}"

if [ "$TESTER_HEADLESS" = "1" ]; then
    echo "  running Chrome headless (TESTER_HEADLESS=1)"
else
    echo "  opening visible Chrome + DevTools (two users / two windows after the first journey)"
fi

out="$(cd "$TESTER_DIR/browser" && node check.js 2>&1)" || rc=$?
rc="${rc:-0}"
printf '%s\n' "$out" >> "$RESULTS_DIR/run.log"

while IFS=$'\t' read -r status id rest; do
    case "$status" in
        PASS) t_pass "$id" "$rest" ;;
        FAIL)
            repro="$(echo "$out" | awk -v id="$id" '$1=="REPRO" && $2==id {sub(/^[^\t]*\t[^\t]*\t/,""); print; exit}')"
            t_fail "$id" "$rest" "${repro:-TESTER_HEADLESS=$TESTER_HEADLESS BASE_URL=$BASE_URL node tester/browser/check.js}"
            ;;
        HUD) printf '          %s%s%s\n' "$C_DIM" "$rest" "$C_RESET" ;;
        JOURNEY_SUMMARY|BROWSER_SUMMARY|MULTI_SUMMARY)
            t_pass "BR-summary" "browser run finished ($rest)"
            ;;
        WARN) t_warn "$id" "$rest" ;;
    esac
done <<< "$out"

if [ "$rc" -ne 0 ] && ! echo "$out" | grep -q '^FAIL'; then
    t_fail "BR-exit" "browser suite exited with code $rc" \
        "TESTER_HEADLESS=$TESTER_HEADLESS CHROME_PATH=$CHROME BASE_URL=$BASE_URL node tester/browser/check.js"
    printf '%s\n' "$out" | tail -20
fi

t_manual "BR-H1" "Eval sheet: during defense, keep DevTools open and confirm no errors/warnings live."
