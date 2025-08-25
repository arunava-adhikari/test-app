# VPN Testing Setup Script
# This script sets up and runs automated VPN testing

Write-Host "🌍 VPN Geo-Blocking Testing Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`n🔍 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed!" -ForegroundColor Red
    Write-Host "💡 Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if Go server is running
Write-Host "`n🔍 Checking Go server status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod "http://localhost:8080/api/ip-info" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Go server is running" -ForegroundColor Green
    Write-Host "📍 Current IP: $($response.ip)" -ForegroundColor White
    Write-Host "📍 Current Country: $($response.country_name) ($($response.country_code))" -ForegroundColor White
} catch {
    Write-Host "❌ Go server is not running!" -ForegroundColor Red
    Write-Host "💡 Please start the server with: go run shopify_customers.go" -ForegroundColor Yellow
    
    $startServer = Read-Host "`nWould you like to start the server now? (y/n)"
    if ($startServer -eq 'y' -or $startServer -eq 'Y') {
        Write-Host "🚀 Starting Go server..." -ForegroundColor Green
        Start-Process -FilePath "go" -ArgumentList "run", "shopify_customers.go" -NoNewWindow
        Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
        Start-Sleep 5
        
        try {
            $response = Invoke-RestMethod "http://localhost:8080/api/ip-info" -TimeoutSec 5
            Write-Host "✅ Server started successfully!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Server failed to start" -ForegroundColor Red
            exit 1
        }
    } else {
        exit 1
    }
}

# Install Node.js dependencies
Write-Host "`n📦 Installing Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        npm install
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ package.json not found!" -ForegroundColor Red
    exit 1
}

# Check for VPN clients
Write-Host "`n🔍 Checking for VPN clients..." -ForegroundColor Yellow
$vpnClients = @("expressvpn", "nordvpn", "surfshark", "protonvpn")
$foundVPN = $null

foreach ($vpn in $vpnClients) {
    try {
        $null = Get-Command $vpn -ErrorAction Stop
        Write-Host "✅ Found VPN client: $vpn" -ForegroundColor Green
        $foundVPN = $vpn
        break
    } catch {
        # VPN not found
    }
}

if (-not $foundVPN) {
    Write-Host "⚠️  No VPN client found in PATH" -ForegroundColor Yellow
    Write-Host "💡 Supported VPN clients: ExpressVPN, NordVPN, Surfshark, ProtonVPN" -ForegroundColor White
    Write-Host "💡 For simulation testing only, we'll use the virtual VPN tester" -ForegroundColor White
}

# Show testing options
Write-Host "`n🧪 Testing Options Available:" -ForegroundColor Cyan
Write-Host "1. Virtual VPN Simulation Testing (Works without real VPN)" -ForegroundColor White
Write-Host "2. Real VPN Connection Testing (Requires VPN client)" -ForegroundColor White
Write-Host "3. Frontend Interface Testing" -ForegroundColor White
Write-Host "4. Complete Test Suite" -ForegroundColor White

$choice = Read-Host "`nSelect testing option (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 Running Virtual VPN Simulation Testing..." -ForegroundColor Green
        node test-vpn-automation.js
    }
    "2" {
        if ($foundVPN) {
            Write-Host "`n🔌 Running Real VPN Connection Testing..." -ForegroundColor Green
            Write-Host "⚠️  This will actually connect/disconnect your VPN!" -ForegroundColor Yellow
            $confirm = Read-Host "Continue? (y/n)"
            if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                node real-vpn-tester.js
            }
        } else {
            Write-Host "❌ No VPN client found for real testing" -ForegroundColor Red
            Write-Host "💡 Falling back to virtual simulation..." -ForegroundColor Yellow
            node test-vpn-automation.js
        }
    }
    "3" {
        Write-Host "`n🎨 Opening Frontend Interface..." -ForegroundColor Green
        $htmlPath = (Get-Location).Path + "\index.html"
        Start-Process $htmlPath
        Write-Host "✅ Frontend opened in browser" -ForegroundColor Green
    }
    "4" {
        Write-Host "`n🚀 Running Complete Test Suite..." -ForegroundColor Green
        node test-vpn-automation.js
        if ($foundVPN) {
            Write-Host "`n🔌 Running Real VPN Tests..." -ForegroundColor Green
            $confirm = Read-Host "Continue with real VPN testing? (y/n)"
            if ($confirm -eq 'y' -or $confirm -eq 'Y') {
                node real-vpn-tester.js
            }
        }
    }
    default {
        Write-Host "❌ Invalid option selected" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 Testing completed!" -ForegroundColor Green
Write-Host "📊 Check the console output above for detailed results" -ForegroundColor White
