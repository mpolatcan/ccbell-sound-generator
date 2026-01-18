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

echo "===== CCBell Sound Generator Logs ====="
curl -s -N \
    -H "Authorization: Bearer $HF_TOKEN" \
    "https://huggingface.co/api/spaces/mpolatcan/ccbell-sound-generator/logs/run"

echo ""
echo "===== End of Logs ====="
