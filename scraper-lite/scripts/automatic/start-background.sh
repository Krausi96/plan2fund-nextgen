#!/bin/bash
# Start background scraper runner
# Usage: ./start-background.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if already running
if pgrep -f "background-runner.js" > /dev/null; then
    echo "⚠️  Background runner is already running"
    echo "   PID: $(pgrep -f 'background-runner.js')"
    exit 1
fi

# Start in background
nohup node scripts/automatic/background-runner.js > /dev/null 2>&1 &

echo "✅ Background runner started"
echo "   PID: $!"
echo "   Logs: logs/background-runner.log"
echo "   Errors: logs/background-runner-errors.log"
echo ""
echo "To stop: kill $!"
echo "To check status: tail -f logs/background-runner.log"



