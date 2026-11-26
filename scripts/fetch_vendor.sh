#!/bin/sh
# Downloads the map library and the Hebrew-text plugin into vendor/ (served from the site itself, no outside code at
# runtime). Every file is pinned by version and sha256; a mismatch stops the script and the build (scripts/build.py
# reads the 'get' lines below and copies only these files). '-' = not pinned yet: the script prints the hash to pin.
# The font (Rubik) is in public/fonts/, not here.
set -e
cd "$(dirname "$0")/.."
mkdir -p vendor
U=https://unpkg.com
fail=0
get() { # name url sha256|-
  curl -fsSL "$2" -o "vendor/$1.tmp"
  h=$(sha256sum "vendor/$1.tmp" | cut -d' ' -f1)
  if [ "$3" = "-" ]; then echo "warning: $1 not pinned, sha256 $h"
  elif [ "$h" != "$3" ]; then echo "error: $1 sha256 $h != pinned $3"; rm -f "vendor/$1.tmp"; fail=1; return 0; fi
  mv "vendor/$1.tmp" "vendor/$1"
}
get maplibre-gl.mjs        $U/maplibre-gl@6.19.0/dist/maplibre-gl.mjs        01590c9875ea5bb0e8cdc534479f607f7d1695ca5debbccaf730edf5fa5f39e5
get maplibre-gl-worker.mjs $U/maplibre-gl@6.19.0/dist/maplibre-gl-worker.mjs c8564c4a4147326a587c9cc4c2a871c4b02a6c37c3f1ea51da55be3220d4b112
get maplibre-gl.css        $U/maplibre-gl@6.19.0/dist/maplibre-gl.css        a90798a1953017790e590f7e1bd35ff103a8a4263972cb47290b78adf86f8c20
get rtl-text.mjs           $U/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js d1c69035295613baaf83fe23fd9266b0eaed7e5e472e9632b0b5438afc3f589e
[ "$fail" = 0 ] || { echo "vendor: hash mismatch, nothing replaced for those files"; exit 1; }
echo "vendor ready"
