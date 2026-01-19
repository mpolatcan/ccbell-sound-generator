---
description: Check HuggingFace Space deployment logs
allowed-tools: Bash, Read
---

# Check HuggingFace Logs

Check the deployment logs from HuggingFace Spaces.

## Instructions

### Using the Script
The project includes a script for checking logs:
```bash
./scripts/check-hf-space-logs.sh
```

This requires:
1. `secrets.env` file with `HF_TOKEN` set
2. `jq` installed for JSON parsing

### Setup (First Time)
```bash
# Copy the example file
cp secrets.env.example secrets.env

# Edit and add your HuggingFace token
# The token needs read access to the Space
```

### Manual API Check
If the script doesn't work, you can manually check the Space status:
```bash
# Check Space info
curl -H "Authorization: Bearer $HF_TOKEN" \
  https://huggingface.co/api/spaces/mpolatcan/ccbell-sound-generator

# Check if the Space is running
curl https://mpolatcan-ccbell-sound-generator.hf.space/api/health
```

### Deployment Status Links
- **GitHub Actions**: https://github.com/mpolatcan/ccbell-sound-generator/actions/workflows/deploy.yml
- **HuggingFace Space**: https://huggingface.co/spaces/mpolatcan/ccbell-sound-generator
- **Live App**: https://mpolatcan-ccbell-sound-generator.hf.space

## Important Notes
- Never commit `secrets.env` (it's gitignored)
- The script streams logs in real-time
- Check logs after deployment to verify startup
- Common issues: model download failures, memory limits, dependency errors
