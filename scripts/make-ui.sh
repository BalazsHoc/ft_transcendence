#!/usr/bin/env bash
# Demoscene-style quiet runner for Makefile targets.
set -euo pipefail

SCENE="${1:?scene}"
TITLE="${2:?title}"
SUBTITLE="${3:?subtitle}"
shift 3
[[ "${1:-}" == "--" ]] && shift

STREAM="${MAKE_UI_STREAM:-0}"
SHOW_OUTPUT="${MAKE_UI_OUTPUT:-0}"

BOX_INNER=62
INDENT='  '

if [[ -t 1 ]]; then
  R=$'\033[0m'
  B=$'\033[1m'
  D=$'\033[2m'
  K=$'\033[90m'
  C=$'\033[96m'
  G=$'\033[92m'
  Y=$'\033[93m'
  E=$'\033[91m'
  BL=$'\033[94m'
  W=$'\033[97m'
  BD=$'\033[36m'
else
  R= B= D= K= C= G= Y= E= BL= W= BD=
fi

visible_len() {
  local s=$1
  s=$(printf '%s' "$s" | sed $'s/\033\\[[0-9;]*m//g')
  printf '%s' "$s" | wc -m
}

box_repeat() {
  local char=$1 count=$2 i
  for ((i = 0; i < count; i++)); do printf '%s' "$char"; done
}

logo_line() {
  local left_text=$1 right_text=$2
  local raw="${left_text}  ${right_text}"
  local left=$(( (BOX_INNER - ${#raw}) / 2 ))
  (( left < 0 )) && left=0
  local pad
  pad="$(box_repeat ' ' "$left")"
  frame_line "${pad}${C}${B}${left_text}${R}  ${BL}${B}${right_text}${R}"
}

print_logo() {
  local -a v_art=(
    '██╗   ██╗'
    '██║   ██║'
    '██║   ██║'
    '╚██╗ ██╔╝'
    ' ╚████╔╝ '
    '  ╚═══╝  '
  )
  local -a a_art=(
    ' █████╗ '
    '██╔══██╗'
    '███████║'
    '██╔══██║'
    '██║  ██║'
    '╚═╝  ╚═╝'
  )
  local i tag tag_left tag_pad

  printf '\n'
  frame_top
  frame_mid
  for i in "${!v_art[@]}"; do
    logo_line "${v_art[$i]}" "${a_art[$i]}"
  done
  frame_mid
  local wordmark='V I E N N A   A C T I V E'
  local wordmark_left=$(( (BOX_INNER - ${#wordmark}) / 2 ))
  (( wordmark_left < 0 )) && wordmark_left=0
  local wordmark_pad
  wordmark_pad="$(box_repeat ' ' "$wordmark_left")"
  frame_line "${wordmark_pad}${W}${B}${wordmark}${R}"
  tag='vienna · sports · social · stack'
  tag_left=$(( (BOX_INNER - ${#tag}) / 2 ))
  (( tag_left < 0 )) && tag_left=0
  tag_pad="$(box_repeat ' ' "$tag_left")"
  frame_line "${tag_pad}${D}${tag}${R}"
  frame_bottom
  printf '\n'
}

print_orb_rule() {
  local label=$1
  local plain=" ◈ ${label} ◈ "
  local left=$(( (BOX_INNER - $(visible_len "$plain")) / 2 ))
  local right=$(( BOX_INNER - $(visible_len "$plain") - left ))
  (( left < 0 )) && left=0
  (( right < 0 )) && right=0
  printf '%s' "$INDENT"
  printf '%s' "$BL"
  box_repeat '─' "$left"
  printf '%s%s%s' "$Y" "$plain" "$R"
  printf '%s' "$BL"
  box_repeat '─' "$right"
  printf '%s\n' "$R"
}

frame_top() {
  printf '%s%s▛' "$INDENT" "$BL"
  box_repeat '▀' "$BOX_INNER"
  printf '▜%s\n' "$R"
}

frame_mid() {
  printf '%s%s▌%s' "$INDENT" "$BL" "$R"
  box_repeat ' ' "$BOX_INNER"
  printf '%s▐%s\n' "$BL" "$R"
}

frame_bottom() {
  printf '%s%s▙' "$INDENT" "$BL"
  box_repeat '▄' "$BOX_INNER"
  printf '▟%s\n' "$R"
}

frame_line() {
  local text=$1
  local pad=$((BOX_INNER - $(visible_len "$text")))
  (( pad < 0 )) && pad=0
  printf '%s%s▌%s%s%*s%s▐%s\n' "$INDENT" "$BL" "$R" "$text" "$pad" "" "$BL" "$R"
}

frame_title() {
  local title=$1
  local suffix=${2:-}
  frame_line "$(printf '  %s◆ %s%s%s%s ◆' "$Y" "$B" "$title" "$R" "$suffix")"
}

frame_row() {
  local label=$1 value=$2
  frame_line "$(printf '%s  %-12s%s %s▸ %s%s%s' "$D" "$label" "$R" "$K" "$G" "$value" "$R")"
}

filter_output() {
  sed -E '/^time="[^"]+" level=warning msg=/d'
}

# One consistent frame: title + subtitle + animated bar (same ▛▀ style throughout).
spinner_wait() {
  local pid=$1
  local i=0 bar_len=40 pulse=0
  local -a orbs=('◢◣◤◥' '◣◤◥◢' '◤◥◢◣' '◥◢◣◤')
  local -a sparks=('░' '▒' '▓' '█' '▓' '▒')
  local subtitle_text bar_text tail

  subtitle_text="$(printf '  %s%s%s' "$D" "$SUBTITLE" "$R")"

  frame_top
  frame_title "$TITLE"
  frame_line "$subtitle_text"
  frame_bottom

  if [[ ! -t 1 ]]; then
    wait "$pid"
    return
  fi

  tput civis 2>/dev/null || true
  while kill -0 "$pid" 2>/dev/null; do
    pulse=$((i % (bar_len * 2)))
    if (( pulse >= bar_len )); then
      pulse=$((bar_len * 2 - pulse))
    fi

    bar_text=""
    local j
    for ((j = 0; j < bar_len; j++)); do
      if (( j >= pulse - 2 && j <= pulse + 1 )); then
        bar_text+="${C}${sparks[$((i % ${#sparks[@]}))]}${R}"
      else
        bar_text+="${K}░${R}"
      fi
    done

    tail=$((BOX_INNER - bar_len - 8))
    (( tail < 0 )) && tail=0

    printf '\r%s%s▌ %s%s%s %s%s%s%*s%s▐%s' \
      "$INDENT" "$BL" "$R" \
      "${orbs[$((i % ${#orbs[@]}))]}" "$C" "$B" "$R" \
      "$bar_text" "$tail" "" "$BL" "$R"

    i=$((i + 1))
    sleep 0.08
  done

  printf '\r\033[K'
  tput cnorm 2>/dev/null || true
  wait "$pid"
}

show_failure() {
  local log=$1 code=$2
  print_orb_rule "signal lost"
  frame_top
  frame_title "$TITLE"
  frame_mid
  frame_row "result" "failed"
  frame_bottom
  if [[ -f "$log" && -s "$log" ]]; then
    frame_top
    frame_title "trace"
    frame_mid
    tail -n 20 "$log" | while IFS= read -r line; do
      frame_line "$(printf '  %s%s%s' "$E" "$line" "$R")"
    done
    frame_bottom
  fi
  printf '\n'
  exit "$code"
}

show_panel() {
  local heading=$1
  shift
  print_orb_rule "complete"
  frame_top
  frame_title "$heading" "$(printf ' %s✓%s' "$G" "$R")"
  frame_mid
  while [[ $# -ge 2 ]]; do
    frame_row "$1" "$2"
    shift 2
  done
  frame_bottom
  printf '\n'
}

show_scene_up() {
  show_panel "$TITLE" \
    "status" "online" \
    "url" "https://localhost" \
    "tls" "accept self-signed cert"
}

show_scene_empty() {
  show_panel "$TITLE" \
    "status" "online" \
    "database" "empty (no seed)" \
    "url" "https://localhost"
}

show_scene_db() {
  show_panel "$TITLE" \
    "service" "PostgreSQL" \
    "host" "localhost:5432" \
    "status" "ready"
}

show_scene_seed() {
  show_panel "$TITLE" \
    "status" "loaded" \
    "source" "eval_snapshot.json"
}

show_scene_clean() {
  show_panel "$TITLE" \
    "containers" "removed" \
    "volumes" "kept"
}

show_scene_fclean() {
  show_panel "$TITLE" \
    "containers" "removed" \
    "volumes" "deleted"
}

show_scene_down() {
  show_panel "$TITLE" \
    "containers" "stopped" \
    "volumes" "kept"
}

show_scene_restart() {
  show_panel "$TITLE" \
    "status" "restarted" \
    "services" "all containers"
}

show_scene_re() {
  show_panel "$TITLE" \
    "images" "rebuilt (--no-cache)" \
    "status" "online" \
    "url" "https://localhost"
}

show_scene_ps() {
  show_panel "$TITLE" \
    "status" "see below"
}

show_scene_help() {
  print_logo
  print_orb_rule "command deck"
  frame_top
  frame_title "make targets"
  frame_mid
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make" "$R" "build + start (with seed)" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make up" "$R" "same as make" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make empty" "$R" "wipe volumes, no seed" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make db" "$R" "postgres on :5432" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make seed" "$R" "reset eval snapshot" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make down" "$R" "stop (keep volumes)" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make logs" "$R" "follow container logs" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make ps" "$R" "container status" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make restart" "$R" "restart containers" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make re" "$R" "rebuild + start" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make clean" "$R" "remove containers" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make fclean" "$R" "remove all volumes" )"
  frame_line "$(printf '%s  %-14s%s %s%s' "$G" "make test-ui" "$R" "preview all target screens" )"
  frame_bottom
  printf '\n'
}

show_scene() {
  case "$SCENE" in
    up|all) show_scene_up ;;
    empty) show_scene_empty ;;
    db) show_scene_db ;;
    seed) show_scene_seed ;;
    clean) show_scene_clean ;;
    fclean) show_scene_fclean ;;
    down) show_scene_down ;;
    restart) show_scene_restart ;;
    re) show_scene_re ;;
    ps) show_scene_ps ;;
    logs) show_scene_help ;;
    help) show_scene_help ;;
    *) show_scene_up ;;
  esac
}

if [[ "$SCENE" == "help" ]]; then
  show_scene_help
  exit 0
fi

if [[ "$STREAM" == "1" ]]; then
  print_logo
  print_orb_rule "live feed"
  frame_top
  frame_title "$TITLE"
  frame_row "mode" "streaming (Ctrl+C to exit)"
  frame_bottom
  printf '\n'
  exec "$@"
fi

print_logo

log=$(mktemp)
trap 'rm -f "$log"' EXIT

if [[ "$#" -eq 0 ]]; then
  : >"$log"
else
  ("$@") >"$log" 2>&1 &
  pid=$!
  if ! spinner_wait "$pid"; then
    show_failure "$log" "$?"
  fi
fi

if [[ "$SHOW_OUTPUT" == "1" && -s "$log" ]]; then
  show_scene
  filter_output <"$log" | sed "s/^/${INDENT}/"
  printf '\n'
else
  show_scene
fi
