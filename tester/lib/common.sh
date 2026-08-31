# shellcheck shell=bash
# ---------------------------------------------------------------------------
# Eval tester framework: check registration, colored output, repro logging,
# module point tally, and the final summary.
# Sourced by run.sh and every suite. Do not execute directly.
# ---------------------------------------------------------------------------

TESTER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_DIR="$(cd "$TESTER_DIR/.." && pwd)"

BASE_URL="${BASE_URL:-https://localhost}"
WS_URL="${WS_URL:-wss://localhost}"
DEMO_EMAIL="${DEMO_EMAIL:-alex@example.com}"
DEMO_PASSWORD="${DEMO_PASSWORD:-testpass123}"
DEMO2_EMAIL="${DEMO2_EMAIL:-carlito@example.com}"
DEMO2_PASSWORD="${DEMO2_PASSWORD:-12345678}"

RESULTS_ROOT="$TESTER_DIR/results"
RUN_STAMP="${RUN_STAMP:-$(date +%Y%m%d-%H%M%S)}"
RESULTS_DIR="$RESULTS_ROOT/$RUN_STAMP"
FAILURES_MD="$RESULTS_DIR/failures.md"
SUMMARY_TXT="$RESULTS_DIR/summary.txt"
MODULES_TSV="$RESULTS_DIR/modules.tsv"
COUNTS_FILE="$RESULTS_DIR/.counts"

mkdir -p "$RESULTS_DIR"
[ -f "$COUNTS_FILE" ] || echo "0 0 0 0 0" > "$COUNTS_FILE"
[ -f "$FAILURES_MD" ] || {
    printf '# Failed checks — %s\n\nEvery failure below includes the exact command to reproduce it.\n' \
        "$RUN_STAMP" > "$FAILURES_MD"
}

# --- colors (disabled when not a tty or NO_COLOR set) ----------------------
if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
    C_GREEN=$'\033[32m'; C_RED=$'\033[31m'; C_YELLOW=$'\033[33m'
    C_BLUE=$'\033[34m'; C_DIM=$'\033[2m'; C_BOLD=$'\033[1m'; C_RESET=$'\033[0m'
else
    C_GREEN=""; C_RED=""; C_YELLOW=""; C_BLUE=""; C_DIM=""; C_BOLD=""; C_RESET=""
fi

_counts_load() { read -r N_PASS N_FAIL N_WARN N_SKIP N_MANUAL < "$COUNTS_FILE"; }
_counts_save() { echo "$N_PASS $N_FAIL $N_WARN $N_SKIP $N_MANUAL" > "$COUNTS_FILE"; }

t_suite() {
    printf '\n%s%s══ %s ══%s\n' "$C_BOLD" "$C_BLUE" "$1" "$C_RESET"
}

# t_pass ID "description"
t_pass() {
    _counts_load; N_PASS=$((N_PASS + 1)); _counts_save
    printf '  %s✔ PASS%s  %-12s %s\n' "$C_GREEN" "$C_RESET" "$1" "$2"
}

# t_fail ID "description" "repro command" ["details"]
t_fail() {
    _counts_load; N_FAIL=$((N_FAIL + 1)); _counts_save
    printf '  %s✘ FAIL%s  %-12s %s\n' "$C_RED" "$C_RESET" "$1" "$2"
    [ -n "${4:-}" ] && printf '          %s↳ %s%s\n' "$C_DIM" "$4" "$C_RESET"
    [ -n "${3:-}" ] && printf '          %s↳ reproduce: %s%s\n' "$C_DIM" "$3" "$C_RESET"
    {
        printf '\n## %s — %s\n' "$1" "$2"
        [ -n "${4:-}" ] && printf '\n%s\n' "$4"
        [ -n "${3:-}" ] && printf '\nReproduce:\n\n```bash\n%s\n```\n' "$3"
    } >> "$FAILURES_MD"
}

# t_warn ID "description" ["details"]  — noted, does not fail the run
t_warn() {
    _counts_load; N_WARN=$((N_WARN + 1)); _counts_save
    printf '  %s▲ WARN%s  %-12s %s\n' "$C_YELLOW" "$C_RESET" "$1" "$2"
    [ -n "${3:-}" ] && printf '          %s↳ %s%s\n' "$C_DIM" "$3" "$C_RESET"
}

# t_skip ID "description" "reason"
t_skip() {
    _counts_load; N_SKIP=$((N_SKIP + 1)); _counts_save
    printf '  %s− SKIP%s  %-12s %s %s(%s)%s\n' \
        "$C_DIM" "$C_RESET" "$1" "$2" "$C_DIM" "$3" "$C_RESET"
}

# t_manual ID "instruction for the human evaluator"
t_manual() {
    _counts_load; N_MANUAL=$((N_MANUAL + 1)); _counts_save
    printf '  %s☐ HUMAN%s %-12s %s\n' "$C_BLUE" "$C_RESET" "$1" "$2"
}

# t_expect ID "description" <expected> <actual> "repro"
# Convenience: pass when expected == actual.
t_expect() {
    if [ "$3" = "$4" ]; then
        t_pass "$1" "$2"
    else
        t_fail "$1" "$2" "$5" "expected '$3', got '$4'"
    fi
}

# --- HTTP helper ------------------------------------------------------------
# http METHOD PATH [curl args...]  → sets HTTP_STATUS and HTTP_BODY
# Path may be absolute (starts with http) or relative to BASE_URL.
http() {
    local method="$1" path="$2"; shift 2
    local url="$path"
    case "$url" in http*) ;; *) url="$BASE_URL$path" ;; esac
    local out
    out="$(curl -sk -X "$method" "$url" -w '\n%{http_code}' "$@" 2>/dev/null)" || {
        HTTP_STATUS="000"; HTTP_BODY=""; return 0
    }
    HTTP_STATUS="${out##*$'\n'}"
    HTTP_BODY="${out%$'\n'*}"
}

# repro_http METHOD PATH [extra] — printable curl command for repro messages
repro_http() {
    local method="$1" path="$2"; shift 2
    local url="$path"
    case "$url" in http*) ;; *) url="$BASE_URL$path" ;; esac
    printf 'curl -sk -X %s %q %s' "$method" "$url" "$*"
}

# login EMAIL PASSWORD → prints access token, empty on failure
login() {
    curl -sk -X POST "$BASE_URL/api/auth/login/" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$1\",\"password\":\"$2\"}" | jq -r '.access // empty'
}

# --- module tally -----------------------------------------------------------
# module_result "MOD-ID" MAJOR|MINOR "Module name" pass|fail ["note"]
module_result() {
    printf '%s\t%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "$4" "${5:-}" >> "$MODULES_TSV"
}

# --- docker compose helper ---------------------------------------------------
compose() {
    if docker compose version >/dev/null 2>&1; then
        (cd "$REPO_DIR" && docker compose "$@")
    else
        (cd "$REPO_DIR" && docker-compose "$@")
    fi
}
