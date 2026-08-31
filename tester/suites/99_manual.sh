#!/usr/bin/env bash
# Human-only eval sheet items — printed for the peer evaluator walkthrough.
source "$(dirname "$0")/../lib/common.sh"

t_suite "99 MANUAL CHECKLIST — items the automated tester cannot verify"

t_manual "H-TEAM" "Confirm ALL 4–5 team members are present. Stop if anyone is missing."
t_manual "H-ROLE" "Ask EACH member: role (PO/PM/Tech Lead/Dev), contributions, one feature they built."
t_manual "H-COHERENCE" "Ask two members to explain project concept, stack, and coordination."
t_manual "H-GIT-LIVE" "Member shows 'git log --oneline --graph' — commits from everyone, meaningful messages."
t_manual "H-DEPLOY-CLEAN" "Clean clone in EMPTY folder: git clone … && make — no manual steps."
t_manual "H-CHROME-LIVE" "Open Chrome DevTools console during demo — zero errors AND zero warnings."
t_manual "H-RESPONSIVE" "Resize to mobile width — UI remains usable (tester checks headless, confirm visually)."
t_manual "H-PASSWORD" "Team explains password hashing (PBKDF2 + salt via Django)."
t_manual "H-FORMS-UI" "Submit invalid forms in browser — inline validation visible before/alongside API errors."
t_manual "H-HTTPS-BAR" "Chrome address bar shows encrypted connection (accept self-signed cert once)."
t_manual "H-MODULES-DEMO" "Demonstrate EACH claimed module live with explanation (non-working = 0 pts)."
t_manual "H-MODULES-POINTS" "Count validated modules only: Major=2, Minor=1, need ≥14 to pass."
t_manual "H-BONUS" "Bonus only if mandatory perfect: extra modules beyond 14, max +5 bonus pts."
t_manual "H-STABILITY" "Multi-user: two browsers logged in simultaneously — no crashes."
t_manual "H-QUALITY" "Assess effort, learning, creativity — subjective final judgment."

printf '\n  %sThese items mirror the official eval sheet sections that require human judgment.%s\n' "$C_DIM" "$C_RESET"
