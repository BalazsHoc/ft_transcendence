#!/usr/bin/env bash
# Walk through every make target so you can review the demoscene UI.
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

AUTO=0
if [[ "${1:-}" == "--auto" ]]; then
  AUTO=1
fi

if [[ -t 1 ]]; then
  R=$'\033[0m'
  B=$'\033[1m'
  C=$'\033[96m'
  Y=$'\033[93m'
  D=$'\033[2m'
else
  R= B= C= Y= D=
fi

pause_step() {
  local label=$1
  if (( AUTO )); then
    sleep 1
    return
  fi
  printf '\n%s────────────────────────────────────────────────────────%s\n' "$D" "$R"
  printf '%sPress Enter for next:%s %s%s%s\n' "$D" "$R" "$Y" "$label" "$R"
  read -r
}

run_make() {
  local target=$1
  shift
  printf '\n%s╔══════════════════════════════════════════════════════════╗%s\n' "$C" "$R"
  printf '%s║%s  %sTesting:%s make %-40s %s║%s\n' "$C" "$R" "$B" "$R" "$target" "$C" "$R"
  printf '%s╚══════════════════════════════════════════════════════════╝%s\n' "$C" "$R"
  if MAKEFLAGS='--no-print-directory' make -s "$target" "$@"; then
    printf '%s✓ make %s finished%s\n' "$C" "$target" "$R"
  else
    printf '%s✗ make %s failed (continuing)%s\n' "$Y" "$target" "$R"
  fi
}

printf '%s%s%s\n' "$B" "Make UI visual walkthrough" "$R"
printf '%sRun from:%s %s\n' "$D" "$R" "$ROOT"
if (( AUTO )); then
  printf '%sAuto mode:%s 1 second pause between steps\n' "$D" "$R"
else
  printf '%sInteractive:%s press Enter before each target\n' "$D" "$R"
fi
printf '%sNote:%s make empty / fclean / re wipe or rebuild data and take longer.\n' "$D" "$R"
printf '%sTip:%s use %s./scripts/test-make-ui.sh --auto%s for a quick unattended pass.\n\n' "$D" "$R" "$Y" "$R"

pause_step "make help"
run_make help

pause_step "make ps (current state)"
run_make ps

pause_step "make empty (wipe volumes + empty stack)"
run_make empty

pause_step "make ps"
run_make ps

pause_step "make seed"
run_make seed

pause_step "make down"
run_make down

pause_step "make up"
run_make up

pause_step "make restart"
run_make restart

pause_step "make ps"
run_make ps

pause_step "make clean"
run_make clean

pause_step "make re (no-cache rebuild — slow)"
run_make re

pause_step "make down"
run_make down

pause_step "make fclean"
run_make fclean

pause_step "make logs (3 second preview)"
printf '\n%sStreaming logs for 3 seconds…%s\n' "$D" "$R"
timeout 3 env MAKEFLAGS='--no-print-directory' make -s logs || true

pause_step "make db (postgres only)"
run_make db

printf '\n%s%sWalkthrough complete.%s\n' "$B" "$C" "$R"
printf '%sReview the screens above for logo, frames, spinners, and completion panels.\n' "$D"
