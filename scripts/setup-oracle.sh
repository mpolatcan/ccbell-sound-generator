#!/bin/bash
# Oracle Cloud Free Tier Setup Script
# Run this ON the Oracle VM after SSH'ing in.
#
# Prerequisites:
#   - Oracle Cloud Always Free VM (Ampere A1, 4 OCPU, 24GB RAM)
#   - Ubuntu 22.04 or 24.04 (default Oracle Linux works too)
#   - SSH access configured
#
# Usage:
#   ssh ubuntu@<your-vm-ip>
#   curl -fsSL https://raw.githubusercontent.com/mpolatcan/ccbell-sound-generator/master/scripts/setup-oracle.sh | bash
#   # Or clone first, then run:
#   git clone https://github.com/mpolatcan/ccbell-sound-generator.git
#   cd ccbell-sound-generator
#   bash scripts/setup-oracle.sh

set -euo pipefail

echo "=== CCBell Sound Generator - Oracle Cloud Setup ==="
echo ""

# --- 1. Install Docker ---
if ! command -v docker &> /dev/null; then
    echo ">>> Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo ">>> Docker installed. You may need to log out and back in for group changes."
else
    echo ">>> Docker already installed"
fi

# --- 2. Install Docker Compose plugin ---
if ! docker compose version &> /dev/null; then
    echo ">>> Installing Docker Compose plugin..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
else
    echo ">>> Docker Compose already installed"
fi

# --- 3. Clone repo if not in it ---
if [ ! -f "docker-compose.oracle.yml" ]; then
    echo ">>> Cloning repository..."
    git clone https://github.com/mpolatcan/ccbell-sound-generator.git
    cd ccbell-sound-generator
fi

# --- 4. Build and start ---
echo ">>> Building Docker image (this takes 10-15 minutes on first run)..."
docker compose -f docker-compose.oracle.yml up -d --build

echo ""
echo "=== Setup Complete ==="
echo ""
echo "App is starting at: http://$(curl -s ifconfig.me):7860"
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.oracle.yml logs -f    # View logs"
echo "  docker compose -f docker-compose.oracle.yml restart     # Restart"
echo "  docker compose -f docker-compose.oracle.yml down        # Stop"
echo "  docker compose -f docker-compose.oracle.yml up -d       # Start"
echo ""
echo "IMPORTANT: Open port 7860 in Oracle Cloud Security List:"
echo "  1. Go to: Oracle Cloud Console > Networking > Virtual Cloud Networks"
echo "  2. Click your VCN > Default Security List"
echo "  3. Add Ingress Rule: Source 0.0.0.0/0, TCP, Port 7860"
echo "  4. Also open the port in the VM firewall:"
echo "     sudo iptables -I INPUT -p tcp --dport 7860 -j ACCEPT"
echo "     sudo netfilter-persistent save"
echo ""
echo "For HTTPS with free domain (optional):"
echo "  1. Get a free subdomain at https://www.duckdns.org"
echo "  2. Install Caddy: sudo apt install caddy"
echo "  3. Edit /etc/caddy/Caddyfile:"
echo "     yourapp.duckdns.org {"
echo "       reverse_proxy localhost:7860"
echo "     }"
echo "  4. sudo systemctl restart caddy"
