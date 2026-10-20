#!/bin/sh
set -eu

echo "Starting Pix2Text OCR service..."
cd /app/ocr-service
gunicorn --bind 127.0.0.1:5000 --workers 1 --timeout 300 --access-logfile - --error-logfile - app:app &
OCR_PID=$!

cleanup() {
  kill "$OCR_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd /app
export PORT="${PORT:-10000}"

echo "Starting Express web server on port $PORT..."
node server/index.js &
NODE_PID=$!

wait "$NODE_PID"
