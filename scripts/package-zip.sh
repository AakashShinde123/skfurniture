#!/bin/bash
# Package SK Furniture project zip (same recipe as previous deliveries).
set -e
cd /home/z/my-project

STAGE=/home/z/my-project/.zpack/stage
OUT=/home/z/my-project/download/sk-furniture-netlify-healthfix.zip
mkdir -p "$STAGE" /home/z/my-project/download
rm -rf "$STAGE"
mkdir -p "$STAGE"

rsync -a \
  --exclude '/node_modules' \
  --exclude '/.next' \
  --exclude '/.git' \
  --exclude '/db' \
  --exclude '/.env' \
  --exclude '/bun.lock' \
  --exclude '/worklog.md' \
  --exclude '/upload' \
  --exclude '/.zpack' \
  --exclude '/*.png' \
  --exclude '/scripts/*.png' \
  --exclude '/agent-ctx' \
  --exclude '/download' \
  --exclude '/skills' \
  --exclude '/examples' \
  --exclude '/mini-services' \
  ./ "$STAGE/"

cd "$STAGE"
echo "--- sanity checks ---"
test -f src/app/api/upload/route.ts && echo "OK upload route"
test -f src/proxy.ts && echo "OK proxy.ts"
! test -f src/middleware.ts && echo "OK no middleware.ts"
test -f src/app/api/health/route.ts && echo "OK health route"
test -f src/lib/db-health.ts && echo "OK db-health lib"
test -f package-lock.json && echo "OK package-lock.json"
test -f netlify.toml && echo "OK netlify.toml"
test -d uploads && echo "OK uploads/ demo images"
test -f .env.example && echo "OK .env.example"

zip -qr "$OUT" . -x '.*.DS_Store'
cd /home/z/my-project
sha256sum "$OUT"
unzip -l "$OUT" | tail -1
unzip -l "$OUT" | grep -cE "^\s+[0-9]+\s" || true
