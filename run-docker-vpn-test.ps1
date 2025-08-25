# VPN Testing Docker Container Runner for Windows
# This script builds and runs the VPN testing container

Write-Host "🐳 Building VPN Testing Docker Container..." -ForegroundColor Green

# Build the container
docker-compose build

Write-Host "🚀 Starting VPN Testing Container..." -ForegroundColor Green

# Run the container with interactive mode
docker-compose run --rm vpn-tester

Write-Host "✅ Container finished. Check the reports directory for results." -ForegroundColor Green
