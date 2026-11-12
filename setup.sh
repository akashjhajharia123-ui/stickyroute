#!/usr/bin/env bash
# One-time setup for a teammate. Run from the stickyroute folder:  bash setup.sh
# Clones our Bifrost fork into ./bifrost on the feature branch and prepares the Go workspace.
set -euo pipefail

FORK_URL="https://github.com/akashjhajharia123-ui/bifrost.git"
BRANCH="feat/sticky-weighted-targets"
ROOT="$(cd "$(dirname "$0")" && pwd)"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing: $1. $2" >&2; exit 1; }; }
need git "Install Git first."
need go "Install Go 1.27.3 or newer (macOS: brew install go)."

if [ -d "$ROOT/bifrost/.git" ]; then
  echo "bifrost/ already exists: updating it."
  git -C "$ROOT/bifrost" fetch origin "$BRANCH"
  git -C "$ROOT/bifrost" switch "$BRANCH"
  git -C "$ROOT/bifrost" pull --ff-only origin "$BRANCH"
else
  echo "Cloning the Bifrost fork (large repo, takes a few minutes)..."
  git clone --branch "$BRANCH" "$FORK_URL" "$ROOT/bifrost"
fi

if ! git -C "$ROOT/bifrost" remote | grep -qx upstream; then
  git -C "$ROOT/bifrost" remote add upstream https://github.com/maximhq/bifrost.git
fi

echo "Preparing the Go workspace..."
make -C "$ROOT/bifrost" setup-workspace >/dev/null
# setup-workspace runs `go work sync`, which can reorder requires in go.mod files.
# That change is unrelated to our PR, so put the go.mod files back as committed.
git -C "$ROOT/bifrost" checkout -- $(git -C "$ROOT/bifrost" diff --name-only -- '*go.mod') 2>/dev/null || true

echo "Running the sticky routing tests..."
(cd "$ROOT/bifrost/plugins/routing" && go test ./rules/ -run Sticky)

cat <<'EOF'

Setup done.
Next: open Claude Code in this stickyroute folder and paste your role's prompt
from docs/TEAM_PROMPTS.md (your role is listed in docs/TEAM.md).
EOF
