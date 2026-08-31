#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# ft_transcendence eval tester
#
#   ./tester/run.sh              run EVERY suite (Chrome window opens)
#   ./tester/run.sh --headless   same, but hide the browser
#   ./tester/run.sh --fast       skip slow checks (rate-limit burst)
#   ./tester/run.sh --list       list suites
#   ./tester/run.sh events chat  run matching suites only
#
# Failures: tester/results/latest/failures.md  (copy-paste repro commands)
# ---------------------------------------------------------------------------
set -u

cd "$(dirname "$0")" || exit 1
export RUN_STAMP="$(date +%Y%m%d-%H%M%S)"
export TESTER_FAST=0
export TESTER_HEADLESS="${TESTER_HEADLESS:-0}"
export TESTER_STRICT="${TESTER_STRICT:-1}"

source lib/common.sh

usage() {
    sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
}

list_suites() {
    echo "Available suites (all run by default):"
    for f in suites/*.sh; do
        name="$(basename "$f" .sh)"
        desc="$(sed -n '2s/^# \{0,1\}//p' "$f")"
        printf '  %-22s %s\n' "${name#*_}" "$desc"
    done
}

SELECTED=()
for arg in "$@"; do
    case "$arg" in
        -h|--help) usage; exit 0 ;;
        --list) list_suites; exit 0 ;;
        --fast) export TESTER_FAST=1 ;;
        --headless) export TESTER_HEADLESS=1 ;;
        --headed|--visible) export TESTER_HEADLESS=0 ;;
        --no-color) export NO_COLOR=1 ;;
        *) SELECTED+=("$arg") ;;
    esac
done

run_suite() {
    bash "$1" 2>&1 | tee -a "$RESULTS_DIR/run.log"
}

matches_selection() {
    local name="$1" sel
    [ "${#SELECTED[@]}" -eq 0 ] && return 0
    for sel in "${SELECTED[@]}"; do
        case "$name" in *"$sel"*) return 0 ;; esac
    done
    return 1
}

banner() {
    printf '\n'
    printf '%s' "$C_BOLD"
    cat <<'EOF'
  ┌─────────────────────────────────────────────────────────────┐
  │           VIENNA ACTIVE  ·  EVAL SHEET TESTER               │
  │     deploy · security · https · auth · modules · chrome     │
  └─────────────────────────────────────────────────────────────┘
EOF
    printf '%s' "$C_RESET"
    printf '  stamp     %s\n' "$RUN_STAMP"
    printf '  target    %s\n' "$BASE_URL"
    printf '  results   tester/results/%s/\n' "$RUN_STAMP"
    if [ "$TESTER_HEADLESS" = "1" ]; then
        printf '  browser   headless (pass --headed to watch Chrome)\n'
    else
        printf '  browser   %svisible Chrome + DevTools, then a second window (two users)%s\n' "$C_GREEN" "$C_RESET"
    fi
    printf '\n'
}

banner

for f in suites/*.sh; do
    name="$(basename "$f" .sh)"
    matches_selection "$name" || continue
    run_suite "$f"
done

_counts_load
{
    printf '\n%s══ SUMMARY ══%s\n' "$C_BOLD" "$C_RESET"
    printf '  %sPASS %d%s   %sFAIL %d%s   %sWARN %d%s   SKIP %d   HUMAN %d\n' \
        "$C_GREEN" "$N_PASS" "$C_RESET" "$C_RED" "$N_FAIL" "$C_RESET" \
        "$C_YELLOW" "$N_WARN" "$C_RESET" "$N_SKIP" "$N_MANUAL"

    if [ -f "$MODULES_TSV" ]; then
        printf '\n%s══ MODULE POINTS (automated verdicts) ══%s\n' "$C_BOLD" "$C_RESET"
        sort -u -t$'\t' -k1,1 "$MODULES_TSV" | while IFS=$'\t' read -r id kind name verdict note; do
            pts=0
            if [ "$verdict" = "pass" ]; then
                [ "$kind" = "MAJOR" ] && pts=2 || pts=1
                mark="${C_GREEN}✔${C_RESET}"
            else
                mark="${C_RED}✘${C_RESET}"
            fi
            printf '  %b %-9s %-5s %-58s %s pts %s\n' \
                "$mark" "$id" "$kind" "$name" "$pts" "${note:+($note)}"
        done
        total="$(sort -u -t$'\t' -k1,1 "$MODULES_TSV" | awk -F'\t' '$4=="pass"{s+=$2=="MAJOR"?2:1} END{print s+0}')"
        printf '  %s→ validated module points: %d / 14 required (20 claimed)%s\n' \
            "$C_BOLD" "$total" "$C_RESET"
        if [ "$total" -ge 14 ]; then
            printf '  %s✔ reaches the 14-point minimum%s' "$C_GREEN" "$C_RESET"
            [ "$total" -gt 14 ] && printf ' %s(+%d candidate bonus points, max 5 count)%s' \
                "$C_DIM" "$((total - 14))" "$C_RESET"
            printf '\n'
        else
            printf '  %s✘ BELOW the 14-point minimum — project would fail%s\n' "$C_RED" "$C_RESET"
        fi
        printf '  %sNote: points only count if the team also demonstrates each module live.%s\n' \
            "$C_DIM" "$C_RESET"
    fi

    if [ "$N_FAIL" -gt 0 ]; then
        printf '\n%sFailed checks: tester/results/%s/failures.md%s\n' \
            "$C_RED" "$RUN_STAMP" "$C_RESET"
        printf 'Each failure includes the exact command to reproduce it.\n'
    else
        printf '\n%sAll automated checks passed.%s\n' "$C_GREEN" "$C_RESET"
    fi
    [ "$N_MANUAL" -gt 0 ] && \
        printf 'HUMAN items are the live defense checklist (suite 99).\n'
} | tee "$SUMMARY_TXT"

ln -sfn "$RUN_STAMP" "$RESULTS_ROOT/latest"

[ "$N_FAIL" -eq 0 ]
