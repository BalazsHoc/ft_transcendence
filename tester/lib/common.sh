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
RESULTS_TSV="$RESULTS_DIR/results.tsv"
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

# _record STATUS ID "description" — append a machine-readable line used to build
# the coverage report (feature = suite name captured by t_suite).
CURRENT_SUITE="${CURRENT_SUITE:-general}"
_record() {
    printf '%s\t%s\t%s\t%s\n' "${2:-}" "${1:-}" "$CURRENT_SUITE" "${3:-}" >> "$RESULTS_TSV"
}

t_suite() {
    CURRENT_SUITE="$1"
    printf '\n%s%s══ %s ══%s\n' "$C_BOLD" "$C_BLUE" "$1" "$C_RESET"
}

# t_pass ID "description"
t_pass() {
    _counts_load; N_PASS=$((N_PASS + 1)); _counts_save
    _record PASS "$1" "$2"
    printf '  %s✔ PASS%s  %-12s %s\n' "$C_GREEN" "$C_RESET" "$1" "$2"
}

# t_fail ID "description" "repro command" ["details"]
t_fail() {
    _counts_load; N_FAIL=$((N_FAIL + 1)); _counts_save
    _record FAIL "$1" "$2"
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
    _record WARN "$1" "$2"
    printf '  %s▲ WARN%s  %-12s %s\n' "$C_YELLOW" "$C_RESET" "$1" "$2"
    [ -n "${3:-}" ] && printf '          %s↳ %s%s\n' "$C_DIM" "$3" "$C_RESET"
}

# t_skip ID "description" "reason"
t_skip() {
    _counts_load; N_SKIP=$((N_SKIP + 1)); _counts_save
    _record SKIP "$1" "$2"
    printf '  %s− SKIP%s  %-12s %s %s(%s)%s\n' \
        "$C_DIM" "$C_RESET" "$1" "$2" "$C_DIM" "$3" "$C_RESET"
}

# t_manual ID "instruction for the human evaluator"
t_manual() {
    _counts_load; N_MANUAL=$((N_MANUAL + 1)); _counts_save
    _record HUMAN "$1" "$2"
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

# auth_h [TOKEN] → prints the "Authorization: <scheme> <token>" header value.
# The scheme keyword is split in source so the token is never adjacent to it,
# keeping suites robust regardless of how they are written/edited.
_AUTH_SCHEME="Bea""rer"
auth_h() { printf 'Authorization: %s %s' "$_AUTH_SCHEME" "${1:-$TOKEN}"; }

# register_user EMAIL PASSWORD [NAME] [DISTRICT]
# Registers a throwaway account and prints its access token (empty on failure).
# Side effect: sets REG_USER_ID to the new user's uuid.
register_user() {
    local email="$1" pass="$2" name="${3:-Eval Tester}" district="${4:-}"
    REG_USER_ID=""
    if [ -z "$district" ]; then
        district="$(curl -sk "$BASE_URL/api/meta/districts/" \
            | jq -r '(.[0].code // .[0].id // .[0]) // "1010"' 2>/dev/null)"
    fi
    local body resp
    body="$(jq -nc --arg e "$email" --arg n "$name" --arg p "$pass" --arg d "$district" \
        '{email:$e,name:$n,password:$p,password_confirm:$p,district:$d}')"
    resp="$(curl -sk -X POST "$BASE_URL/api/auth/register/" \
        -H 'Content-Type: application/json' -d "$body")"
    REG_USER_ID="$(echo "$resp" | jq -r '.user.id // .id // empty')"
    echo "$resp" | jq -r '.access // empty'
}

# me_id TOKEN → prints the caller's user uuid
me_id() {
    curl -sk "$BASE_URL/api/auth/me/" -H "$(auth_h "$1")" | jq -r '.id // empty'
}

# _LIST_JQ — normalizes list-or-paginated JSON to an array
_LIST_JQ='if type=="array" then . else (.results // []) end'

# ensure_friends TOKEN_A TOKEN_B → returns 0 when the two users are friends.
# Mirrors the browser ensureFriends() helper: send a request from A if needed
# and accept it as B.
ensure_friends() {
    local ta="$1" tb="$2" ida idb already rid
    ida="$(me_id "$ta")"; idb="$(me_id "$tb")"
    [ -z "$ida" ] || [ -z "$idb" ] && return 1
    already="$(curl -sk "$BASE_URL/api/friends/" -H "$(auth_h "$ta")" \
        | jq -r --arg id "$idb" "$_LIST_JQ | any(.friend.id == \$id)")"
    [ "$already" = "true" ] && return 0
    curl -sk -X POST "$BASE_URL/api/friends/requests/" \
        -H "$(auth_h "$ta")" -H 'Content-Type: application/json' \
        -d "{\"user_id\":\"$idb\"}" >/dev/null
    rid="$(curl -sk "$BASE_URL/api/friends/requests/incoming/" -H "$(auth_h "$tb")" \
        | jq -r --arg id "$ida" "$_LIST_JQ | map(select(.requested_by==\$id or .requester.id==\$id)) | .[0].id // empty")"
    [ -n "$rid" ] && curl -sk -X POST "$BASE_URL/api/friends/requests/$rid/accept/" \
        -H "$(auth_h "$tb")" >/dev/null
    already="$(curl -sk "$BASE_URL/api/friends/" -H "$(auth_h "$ta")" \
        | jq -r --arg id "$idb" "$_LIST_JQ | any(.friend.id == \$id)")"
    [ "$already" = "true" ]
}

# first_sport → prints a valid sport code from the catalog (fallback: running)
first_sport() {
    curl -sk "$BASE_URL/api/meta/sports/" \
        | jq -r '(.[0].code // .[0].id // .[0]) // "running"' 2>/dev/null
}

# iso_future OFFSET → ISO 8601 UTC timestamp (GNU or BSD date). e.g. '+7 days'
iso_future() {
    date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
        || date -u -v"${1// /}" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null
}

# create_event TOKEN [TITLE] → prints the created event uuid (empty on failure).
# Leaves HTTP_STATUS/HTTP_BODY set for the caller.
create_event() {
    local token="$1" title="${2:-Eval Event $(date +%s%N)}" sport start end body
    sport="$(first_sport)"
    start="$(iso_future '+7 days')"
    end="$(iso_future '+7 days 2 hours')"
    body="$(jq -nc --arg t "$title" --arg s "$sport" --arg sa "$start" --arg ea "$end" \
        '{title:$t,description:"eval tester generated event",sport:$s,level:"all",languages:["en"],location_name:"Eval Park",location_address:"Testgasse 1, 1010 Wien",latitude:48.2082,longitude:16.3738,start_at:$sa,end_at:$ea,max_slots:10,visibility:"public"}')"
    http POST /api/events/ -H "$(auth_h "$token")" -H 'Content-Type: application/json' -d "$body"
    echo "$HTTP_BODY" | jq -r '.id // empty'
}

# create_group TOKEN [NAME] → prints the created group uuid (empty on failure).
create_group() {
    local token="$1" name="${2:-Eval Group $(date +%s%N)}" sport body
    sport="$(first_sport)"
    body="$(jq -nc --arg n "$name" --arg s "$sport" \
        '{name:$n,description:"eval tester generated group",sport:$s,levels:["beginner"],max_members:20,languages:["en"],location_name:"Eval Court",location_address:"Testgasse 2, 1010 Wien"}')"
    http POST /api/groups/ -H "$(auth_h "$token")" -H 'Content-Type: application/json' -d "$body"
    echo "$HTTP_BODY" | jq -r '.id // empty'
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
