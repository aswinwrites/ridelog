#!/bin/bash
# RideLog — Push to GitHub
# Run this once from the ridelog/ folder:
#   chmod +x push-to-github.sh && ./push-to-github.sh

set -e

cd "$(dirname "$0")"

echo "🏍️  RideLog — GitHub Push Setup"
echo "================================"

# Clean any stale git state
rm -f .git/index.lock 2>/dev/null || true

# Configure git identity
git config user.email "aswinwrites@gmail.com"
git config user.name "Aswin"

# Init and set branch
git init 2>/dev/null || true
git branch -M main 2>/dev/null || true

# Stage everything
git add -A

# Commit
git commit -m "feat: initial RideLog PWA

- Next.js 15 + TypeScript + TailwindCSS PWA
- GPS ride tracking with real analytics engine
- IndexedDB local storage (guest mode)
- Supabase cloud sync (optional)
- GitHub-style riding calendar heatmap
- Speedometer, route maps with Leaflet/OSM
- Signal stop, braking & acceleration analytics
- Bike profiles & maintenance log
- Monthly analytics with Recharts
- Ride Wrapped yearly summary
- PWA manifest + service worker for offline use" 2>/dev/null || echo "(already committed)"

# Add remote and push
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/aswinwrites/ridelog.git
git push -u origin main

echo ""
echo "✅ Pushed to https://github.com/aswinwrites/ridelog"
echo ""
echo "Next: Import on Vercel → https://vercel.com/new"
