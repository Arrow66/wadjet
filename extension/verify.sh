#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Wedjet extension folder: $DIR"
echo

python3 - <<PY
import json, os
m = json.load(open("$DIR/manifest.json"))
required = ["manifest.json", m["background"]["service_worker"], *m["content_scripts"][0]["js"], *m["content_scripts"][0]["css"]]
for r in m.get("web_accessible_resources", [{}])[0].get("resources", []):
    required.append(r)
for icon in m.get("icons", {}).values():
    required.append(icon)
for f in required:
    path = os.path.join("$DIR", f)
    print(("OK  " if os.path.isfile(path) else "MISSING "), f)
PY

echo
echo "Load in WSL Chrome:"
echo "  1. Run: google-chrome chrome://extensions"
echo "  2. Enable Developer mode"
echo "  3. Load unpacked -> select THIS folder:"
echo "     $DIR"
echo "  4. On a LinkedIn job page, click the Wedjet logo beside the job title"
echo "  5. Visit: https://www.linkedin.com/jobs/"
