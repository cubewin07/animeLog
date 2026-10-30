#!/usr/bin/env bash
# Synchronize skills/animelog-journal to .grok/skills/animelog-journal
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Syncing skills/animelog-journal -> .grok/skills/animelog-journal..."
rm -rf "$ROOT_DIR/.grok/skills/animelog-journal"
cp -r "$ROOT_DIR/skills/animelog-journal" "$ROOT_DIR/.grok/skills/animelog-journal"
echo "Skills successfully synchronized!"
