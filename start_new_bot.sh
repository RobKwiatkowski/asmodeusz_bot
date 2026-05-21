#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-$HOME/sentinel_bot}"
BRANCH="${2:-}"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Blad: $REPO_DIR nie wyglada na repo git."
  exit 1
fi

cd "$REPO_DIR"

if [ -z "$BRANCH" ]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
fi

echo "Repo:   $REPO_DIR"
echo "Branch: $BRANCH"
echo

echo "1. Pobieram zmiany z Git..."
git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo
echo "2. Przebudowuje i uruchamiam kontener..."
docker compose up -d --build

echo
echo "3. Pokazuje logi bota..."
docker logs -f sentinel
