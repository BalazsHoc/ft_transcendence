#!/usr/bin/env bash
# README completeness + Git collaboration evidence (eval preliminaries).
source "$(dirname "$0")/../lib/common.sh"

t_suite "04 README & GIT — documentation and team collaboration"

README="$REPO_DIR/README.md"

if [ -f "$README" ]; then
    t_pass "DOC-01" "README.md exists at repository root"
else
    t_fail "DOC-01" "README.md exists" "ls $REPO_DIR/README.md"
fi

# Required README sections from the eval sheet (🔴 markers in current README = still TODO)
declare -A SECTIONS=(
    ["project name/description"]="Description|ft_transcendence|Vienna"
    ["team members & roles"]="Team Information|Team members|mhoushma|bhocsak|cjuarez|oshcheho|pghajard"
    ["project management"]="Project Management|management"
    ["technical stack"]="Technical Stack|technologies"
    ["database schema"]="Database Schema|schema"
    ["features list"]="Features List|features"
    ["modules + points"]="Modules|Major|Minor|points"
    ["individual contributions"]="Individual Contributions|contributions"
)

doc_n=1
for key in "project name/description" "team members & roles" "project management" \
           "technical stack" "database schema" "features list" \
           "modules + points" "individual contributions"; do
    pattern="${SECTIONS[$key]}"
    doc_n=$((doc_n + 1))
    id="DOC-$(printf '%02d' "$doc_n")"
    if grep -qiE "$pattern" "$README" 2>/dev/null && ! grep -q "🔴" "$README" 2>/dev/null; then
        t_pass "$id" "README section present: $key"
    elif grep -qiE "$pattern" "$README" 2>/dev/null; then
        t_warn "$id" "README has heading for '$key' but still contains 🔴 TODO markers" \
            "complete README.md before defense — incomplete README impacts evaluation"
    else
        t_fail "$id" "README section missing: $key" "grep -iE '$pattern' $README"
    fi
done

# Module points claimed in README or POINTS.md
if [ -f "$REPO_DIR/POINTS.md" ]; then
    claimed="$(grep -E '^\*\*[0-9]+ points\*\*|Total|20 points' "$REPO_DIR/POINTS.md" | head -1)"
    t_pass "DOC-09" "POINTS.md documents claimed modules ($claimed)"
else
    t_warn "DOC-09" "POINTS.md not found — module list should be in README"
fi

# --- Git history -------------------------------------------------------------
authors="$(cd "$REPO_DIR" && git log --format='%an' | sort -u | wc -l | tr -d ' ')"
if [ "$authors" -ge 3 ]; then
    t_pass "GIT-01" "commits from $authors distinct authors (team collaboration)"
else
    t_fail "GIT-01" "git history shows ≥3 contributors" \
        "cd $REPO_DIR && git log --format='%an' | sort | uniq -c"
fi

# Show top contributors for the evaluator
top="$(cd "$REPO_DIR" && git log --format='%an' | sort | uniq -c | sort -rn | head -5 | tr '\n' '; ')"
t_pass "GIT-02" "top contributors: $top"

empty_msgs="$(cd "$REPO_DIR" && git log --format='%s' | grep -cE '^$|^\.|^fix$|^update$' || true)"
if [ "$empty_msgs" -lt 5 ]; then
    t_pass "GIT-03" "commit messages are mostly meaningful (only $empty_msgs vague messages)"
else
    t_warn "GIT-03" "$empty_msgs vague commit messages found" \
        "git log --oneline | head -20"
fi

t_manual "DOC-H1" "Ask EACH team member their role (PO/PM/Tech Lead/Dev) and one feature they implemented."
t_manual "DOC-H2" "Ask two different members to explain the project concept, stack, and coordination."
t_manual "GIT-H1" "Have a member show 'git log --oneline --graph --all' live during defense."
