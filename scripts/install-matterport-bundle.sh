#!/usr/bin/env bash
# Downloads the Matterport Showcase Bundle SDK into public/matterport-bundle (not committed: Matterport SDK license).
set -euo pipefail
VERSION="26.10.4_webgl-1728-g1cd7e0997a"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/matterport-bundle"
if [ -f "$DEST/showcase.html" ] && [ "${1:-}" != "--force" ]; then
  echo "Matterport bundle already installed (use --force to reinstall)."; exit 0
fi
TMP="$(mktemp -d)"
curl -fsSL -o "$TMP/bundle.zip" "https://static.matterport.com/showcase-sdk/bundle/$VERSION/showcase-bundle.zip"
mkdir -p "$DEST"
# Build machines (such as Vercel's) don't always ship `unzip`; fall back to Python's zipfile.
if command -v unzip >/dev/null 2>&1; then unzip -qo "$TMP/bundle.zip" -d "$DEST"
elif command -v python3 >/dev/null 2>&1; then python3 -m zipfile -e "$TMP/bundle.zip" "$DEST"
else echo "Neither unzip nor python3 is available to extract the Matterport bundle." >&2; exit 1; fi
[ -f "$DEST/showcase.html" ] || { echo "Matterport bundle extracted but showcase.html is missing." >&2; exit 1; }
echo "Installed Matterport bundle $(cat "$DEST/version.txt" 2>/dev/null) into $DEST"
