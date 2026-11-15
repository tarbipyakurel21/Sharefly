#!/usr/bin/env bash
# Downloads the Matterport Showcase Bundle SDK into public/matterport-bundle (not committed: Matterport SDK license).
set -euo pipefail
VERSION="26.10.4_webgl-1728-g1cd7e0997a"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/matterport-bundle"
TMP="$(mktemp -d)"
curl -fsSL -o "$TMP/bundle.zip" "https://static.matterport.com/showcase-sdk/bundle/$VERSION/showcase-bundle.zip"
mkdir -p "$DEST" && unzip -qo "$TMP/bundle.zip" -d "$DEST"
echo "Installed Matterport bundle $(cat "$DEST/version.txt" 2>/dev/null) into $DEST"
