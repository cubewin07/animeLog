#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/Backend"
PYTHON="$BACKEND_DIR/.venv/bin/python"

if [[ ! -x "$PYTHON" ]]; then
  echo "Error: Python virtualenv not found at $PYTHON" >&2
  echo "Set it up with: cd Backend && python3 -m venv .venv && .venv/bin/pip install -r requirement.txt" >&2
  exit 1
fi

cd "$BACKEND_DIR"
exec "$PYTHON" manage.py runserver "$@"

