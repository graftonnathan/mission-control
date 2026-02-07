#!/bin/bash
# Mission Control - Safe Restart Script
# Kills existing instances before starting new one

PROJECT_DIR="/home/molten/.openclaw/workspace/PROJECTS/mission-control/code"
LOGFILE="/tmp/mission-control-dev.log"
PIDFILE="/tmp/mission-control.pid"
PORT=5173

echo "=== Mission Control Restart ==="
echo "$(date): Starting restart sequence..."

# Kill any existing mission-control vite processes
echo "Stopping existing instances..."
pkill -f "vite.*mission-control" 2>/dev/null
pkill -f "npm.*dev.*mission-control" 2>/dev/null

# Also kill by port if still running
for pid in $(lsof -t -i :$PORT 2>/dev/null); do
    if [ -n "$pid" ]; then
        echo "Killing process on port $PORT (PID: $pid)..."
        kill -9 $pid 2>/dev/null
    fi
done

sleep 2

# Verify port is free
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "ERROR: Port $PORT still in use after kill attempt"
    exit 1
fi

echo "Port $PORT is free. Starting new instance..."

# Start new instance
cd "$PROJECT_DIR" || exit 1
nohup npm run dev -- --port $PORT --host 0.0.0.0 > "$LOGFILE" 2>&1 &
NEW_PID=$!

# Save PID
echo $NEW_PID > "$PIDFILE"

sleep 3

# Verify it started
if kill -0 $NEW_PID 2>/dev/null && lsof -i :$PORT > /dev/null 2>&1; then
    echo "✅ Mission Control started (PID: $NEW_PID, Port: $PORT)"
    echo "Log: $LOGFILE"
else
    echo "❌ Failed to start Mission Control"
    exit 1
fi
