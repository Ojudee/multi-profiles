#!/usr/bin/env bash
set -e

# Deployment Helper Script for GitHub Pages on MAIN branch
# Usage: ./publish.sh <github-repo-url-with-token>
# Example: ./publish.sh https://ghp_YOUR_TOKEN@github.com/username/my-repo.git

REPO_URL="$1"

echo "==> Building production static bundle for GitHub Pages..."
npm run build

if [ -n "$REPO_URL" ]; then
  git remote set-url origin "$REPO_URL"
fi

echo "==> Staging all changes including production docs/ build..."
git add -A

echo "==> Creating deployment commit..."
git commit -m "deploy: update production GitHub Pages static site on main branch" || echo "No changes to commit"

echo "==> Pushing directly to origin main branch..."
git push origin main

echo "==> Successfully deployed to GitHub main branch!"
echo "GitHub Pages is active on branch: main (either /docs or /root folder, or GitHub Actions)."
