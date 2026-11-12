#!/usr/bin/env bash
# Starts the Bifrost gateway for the free-provider benchmark (Gemini + Groq) on port 8081.
# Asks for the two API keys without echoing them; they live only in this process's
# environment. Nothing is written to disk or shell history. Stop with Ctrl-C.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

read -r -s -p "Paste your Gemini API key (hidden), then press Enter: " GEMINI_API_KEY; echo
read -r -s -p "Paste your Groq API key (hidden), then press Enter: " GROQ_API_KEY; echo
if [ -z "$GEMINI_API_KEY" ] || [ -z "$GROQ_API_KEY" ]; then
  echo "Both keys are needed. Run this again." >&2
  exit 1
fi
export GEMINI_API_KEY GROQ_API_KEY

echo "Starting Bifrost on http://localhost:8081 ... leave this window open."
exec "$ROOT/bin/bifrost-http" -app-dir "$ROOT/bench/free" -port 8081 -log-style pretty -log-level info
