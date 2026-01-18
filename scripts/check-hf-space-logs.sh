#!/bin/bash
# Check HuggingFace Spaces logs for ccbell-sound-generator

set -e

# Read HF_TOKEN from secrets.env
if [ -f "$(dirname "$0")/../secrets.env" ]; then
    source "$(dirname "$0")/../secrets.env"
fi

if [ -z "$HF_TOKEN" ]; then
    echo "Error: HF_TOKEN not found in secrets.env"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Install with: brew install jq"
    exit 1
fi

echo ""
echo "========================================"
echo "  CCBell Sound Generator - Space Logs"
echo "========================================"
echo ""
echo "Fetching logs from: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator"
echo ""

# Fetch logs, remove "data:" prefix, extract log message
curl -s -N \
    -H "Authorization: Bearer $HF_TOKEN" \
    "https://huggingface.co/api/spaces/mpolatcan/ccbell-sound-generator/logs/run" 2>/dev/null | \
    sed 's/^data://' | \
    while IFS= read -r line; do
        # Skip empty lines
        [ -z "$line" ] && continue
        # Skip "event: " and "id: " lines from SSE
        echo "$line" | grep -qE '^(event|id):' && continue
        # Extract and print the log message (data or message field)
        echo "$line" | jq -r '.data // .message // . // empty'
    done

echo ""
echo "----------------------------------------"
echo "End of logs"
echo "========================================"
echo ""
