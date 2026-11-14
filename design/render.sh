#!/bin/bash
# Render tshirt-v2.html to print-size PNGs (3600x3600, i.e. 12in at 300dpi) with headless Chrome.
set -euo pipefail
cd "$(dirname "$0")"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for bg in dark light none; do
  echo "$(date +%T) rendering $bg"
  timeout 60 "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=3 \
    --window-size=1200,1200 --default-background-color=00000000 --virtual-time-budget=8000 \
    --screenshot="$PWD/tshirt-v2-$bg.png" "file://$PWD/tshirt-v2.html?bg=$bg" >/dev/null 2>&1
done
echo "$(date +%T) done"

# Keep the home page splash in sync with the shirt art.
python3 "$PWD/splash.py"
