#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/Frontend"

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Error: Frontend dependencies not installed ($FRONTEND_DIR/node_modules missing)." >&2
  echo "Run: cd Frontend && npm install" >&2
  exit 1
fi

cd "$FRONTEND_DIR"
if [[ $# -gt 0 ]]; then
  exec npm run dev -- "$@"
else
  exec npm run dev
fi

