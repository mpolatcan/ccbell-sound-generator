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

echo ""
echo "========================================"
echo "  CCBell Sound Generator - Space Logs"
echo "========================================"
echo ""
echo "Fetching logs from: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator"
echo ""

# Fetch logs with timestamps
LOGS=$(curl -s -N \
    -H "Authorization: Bearer $HF_TOKEN" \
    "https://huggingface.co/api/spaces/mpolatcan/ccbell-sound-generator/logs/run")

if [ -z "$LOGS" ] || [ "$LOGS" = "null" ]; then
    echo "No logs available or Space may not be running."
else
    echo "$LOGS"
fi

echo ""
echo "----------------------------------------"
echo "End of logs"
echo "========================================"
echo ""
