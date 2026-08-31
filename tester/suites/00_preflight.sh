#!/usr/bin/env bash
# Preflight: required tools, repo sanity, no malicious aliases.
source "$(dirname "$0")/../lib/common.sh"

t_suite "00 PREFLIGHT — tools & repository sanity"

for tool in git curl jq docker node make openssl; do
    if command -v "$tool" >/dev/null 2>&1; then
        t_pass "PRE-$tool" "$tool is installed ($(command -v "$tool"))"
    else
        t_fail "PRE-$tool" "$tool is installed" "command -v $tool" \
            "required by the tester; install it first"
    fi
done

# Compose v2 plugin or v1 binary
if docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; then
    t_pass "PRE-compose" "docker compose (v2) or docker-compose (v1) available"
else
    t_fail "PRE-compose" "docker compose available" "docker compose version" \
        "neither 'docker compose' nor 'docker-compose' works"
fi

# Chrome for the console-error suite
CHROME="$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser || true)"
if [ -n "$CHROME" ]; then
    t_pass "PRE-chrome" "Google Chrome found for browser checks ($CHROME)"
else
    t_fail "PRE-chrome" "Google Chrome found for browser checks" \
        "command -v google-chrome" "browser suite (console errors) needs Chrome"
fi

# Detect the browser matrix used by the cross-browser suite (22). Missing
# browsers are informational — cross-browser skips them with a warning.
detected_browsers=""
declare -A _BROWSER_BINS=(
    [chrome]="google-chrome google-chrome-stable"
    [chromium]="chromium chromium-browser"
    [edge]="microsoft-edge microsoft-edge-stable msedge"
    [firefox]="firefox firefox-esr"
)
for bkind in chrome chromium edge firefox; do
    bpath=""
    for bin in ${_BROWSER_BINS[$bkind]}; do
        bpath="$(command -v "$bin" 2>/dev/null || true)"
        [ -n "$bpath" ] && break
    done
    [ -n "$bpath" ] && detected_browsers="$detected_browsers $bkind"
done
detected_browsers="$(echo "$detected_browsers" | xargs 2>/dev/null || true)"
n_browsers="$(echo "$detected_browsers" | wc -w)"
if [ "$n_browsers" -ge 2 ]; then
    t_pass "PRE-browsers" "multiple browsers available for cross-browser smoke: $detected_browsers"
else
    t_warn "PRE-browsers" "only ${detected_browsers:-none} detected" \
        "install a second browser (e.g. microsoft-edge or chromium) for cross-browser coverage (suite 22)"
fi

# Verify this is the expected repository (eval sheet: right repo, no alias tricks)
origin="$(cd "$REPO_DIR" && git remote get-url origin 2>/dev/null)"
case "$origin" in
    *BalazsHoc/ft_transcendence*)
        t_pass "PRE-repo" "origin is the official repository ($origin)" ;;
    *)
        t_warn "PRE-repo" "origin is '$origin'" \
            "eval sheet: double-check the repo belongs to the evaluated team" ;;
esac

# Detect shell alias tampering for the commands the evaluator will type
for cmd in make docker git curl; do
    resolved="$(type -t "$cmd")"
    if [ "$resolved" = "file" ] || [ "$resolved" = "" ]; then
        :
    else
        t_warn "PRE-alias" "'$cmd' resolves to a $resolved, not a binary" \
            "eval sheet: check for malicious aliases (type $cmd)"
    fi
done
t_pass "PRE-alias" "make/docker/git/curl resolve to real binaries (no alias tricks)"

# node deps for browser + websocket suites
if [ ! -d "$TESTER_DIR/browser/node_modules" ]; then
    echo "  installing tester browser deps (puppeteer-core, ws) ..."
    (cd "$TESTER_DIR/browser" && npm install --no-fund --no-audit --loglevel=error >/dev/null 2>&1)
fi
if [ -d "$TESTER_DIR/browser/node_modules/puppeteer-core" ] && \
   [ -d "$TESTER_DIR/browser/node_modules/ws" ]; then
    t_pass "PRE-nodedeps" "tester node deps installed (puppeteer-core, ws)"
else
    t_fail "PRE-nodedeps" "tester node deps installed" \
        "cd tester/browser && npm install" "puppeteer-core / ws missing"
fi
