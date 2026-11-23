#!/bin/sh
# Downloads the map library, Hebrew-text plugin and font into vendor/ (served from the site itself, no outside code at runtime).
set -e
cd "$(dirname "$0")/.."
mkdir -p vendor/fonts
U=https://unpkg.com
curl -fsSL $U/maplibre-gl@6.19.0/dist/maplibre-gl.mjs -o vendor/maplibre-gl.mjs
curl -fsSL $U/maplibre-gl@6.19.0/dist/maplibre-gl-worker.mjs -o vendor/maplibre-gl-worker.mjs
curl -fsSL $U/maplibre-gl@6.19.0/dist/maplibre-gl.css -o vendor/maplibre-gl.css
curl -fsSL $U/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js -o vendor/rtl-text.mjs
echo "vendor ready (fonts: copy vendor/fonts.css + vendor/fonts/*.woff2 from the live site once)"
