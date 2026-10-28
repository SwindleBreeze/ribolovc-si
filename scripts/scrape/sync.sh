#!/usr/bin/env bash
# Pulls the stored crawl + OSM layers from the data/revirji branch (no crawling), rebuilds the
# section database locally and copies it into content/revirji. Usage: npm run data:sync
set -euo pipefail
cd "$(dirname "$0")/../.."
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git fetch -q origin data/revirji
git archive FETCH_HEAD out | tar -x -C "$work"
npx tsx scripts/scrape/build.ts "$work/out" > /dev/null
rm -rf content/revirji && mkdir -p content/revirji data
cp "$work"/out/revirji/*.json content/revirji/
cp "$work/out/report.md" data/report.md
echo "Imported $(ls content/revirji | wc -l | tr -d ' ') club files. Report: data/report.md"
sed -n '/| quality/,/| none/p' data/report.md
