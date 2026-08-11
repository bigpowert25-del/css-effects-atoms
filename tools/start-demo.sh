#!/bin/sh

set -eu

PORT="${1:-9876}"
ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PID_FILE="/tmp/css-effects-atoms-${PORT}.pid"
LOG_FILE="/tmp/css-effects-atoms-${PORT}.log"
HEALTH_URL="http://127.0.0.1:${PORT}/demo/index.html"
LAUNCH_LABEL="com.spicy.css-fx-demo"
LAUNCH_DOMAIN="gui/$(id -u)"
LAUNCH_PLIST="$HOME/Library/LaunchAgents/${LAUNCH_LABEL}.plist"
RUNTIME_ROOT="$HOME/Library/Application Support/CSSFXDemo"

if [ "$PORT" = "9876" ] && [ -f "$LAUNCH_PLIST" ]; then
  mkdir -p "$RUNTIME_ROOT"
  rsync -a --delete "$ROOT_DIR/demo/" "$RUNTIME_ROOT/demo/"
  rsync -a "$ROOT_DIR/index.html" "$RUNTIME_ROOT/index.html"
  rsync -a --delete "$ROOT_DIR/intro/" "$RUNTIME_ROOT/intro/"
fi

if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null 2>&1; then
  printf 'CSS FX demo is already available at %s\n' "$HEALTH_URL"
  exit 0
fi

if [ "$PORT" = "9876" ] && [ -f "$LAUNCH_PLIST" ]; then
  if launchctl print "${LAUNCH_DOMAIN}/${LAUNCH_LABEL}" >/dev/null 2>&1; then
    launchctl kickstart -k "${LAUNCH_DOMAIN}/${LAUNCH_LABEL}"
  else
    launchctl bootstrap "$LAUNCH_DOMAIN" "$LAUNCH_PLIST"
  fi

  ATTEMPT=0
  while [ "$ATTEMPT" -lt 30 ]; do
    if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null 2>&1; then
      printf 'CSS FX demo started as a macOS user service at %s\n' "$HEALTH_URL"
      exit 0
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 0.1
  done

  printf 'CSS FX launch service failed. See /tmp/css-effects-atoms-launchd.error.log\n' >&2
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE" 2>/dev/null || true)
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
  fi
fi

nohup python3 -m http.server "$PORT" \
  --bind 127.0.0.1 \
  --directory "$ROOT_DIR" \
  </dev/null >"$LOG_FILE" 2>&1 &
SERVER_PID=$!
printf '%s\n' "$SERVER_PID" >"$PID_FILE"

ATTEMPT=0
while [ "$ATTEMPT" -lt 30 ]; do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null 2>&1; then
    printf 'CSS FX demo started at %s (pid %s)\n' "$HEALTH_URL" "$SERVER_PID"
    exit 0
  fi
  ATTEMPT=$((ATTEMPT + 1))
  sleep 0.1
done

printf 'CSS FX demo failed to start. See %s\n' "$LOG_FILE" >&2
exit 1
