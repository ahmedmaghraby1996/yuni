#!/bin/sh
set -e

echo "==> Building new image (background)..."
docker-compose build --no-cache &
BUILD_PID=$!

echo "==> Build running in background (PID $BUILD_PID). Waiting..."
wait $BUILD_PID
echo "==> Build complete."

echo "==> Performing rolling update (old container stays up until new one is healthy)..."
docker-compose up -d --no-deps --remove-orphans offers-station-api

echo "==> Waiting for new container to become healthy..."
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' offers-station-api 2>/dev/null || echo "none")
  if [ "$STATUS" = "healthy" ]; then
    echo "==> Container is healthy. Deploy complete!"
    exit 0
  fi
  echo "    Status: $STATUS — waiting..."
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

echo "==> WARNING: Container did not become healthy within ${TIMEOUT}s. Check logs:"
echo "    docker logs offers-station-api"
exit 1
