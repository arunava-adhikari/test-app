#!/bin/bash

# VPN Testing Docker Container Runner
# This script builds and runs the VPN testing container

echo "🐳 Building VPN Testing Docker Container..."

# Build the container
docker-compose build

echo "🚀 Starting VPN Testing Container..."

# Run the container with interactive mode
docker-compose run --rm vpn-tester

echo "✅ Container finished. Check the reports directory for results."
