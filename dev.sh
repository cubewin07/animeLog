#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BE_PID=""
FE_PID=""

cleanup() {
  trap - INT TERM EXIT
  for pid in "$BE_PID" "$FE_PID"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      pkill -TERM -P "$pid" 2>/dev/null || true
      kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
}

trap cleanup INT TERM EXIT

"$ROOT_DIR/backend.sh" &
BE_PID=$!

"$ROOT_DIR/frontend.sh" &
FE_PID=$!

wait

