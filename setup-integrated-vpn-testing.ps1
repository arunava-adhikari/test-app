# Integrated VPN Testing Setup Script
# Sets up complete VPN geo-blocking testing environment

Write-Host "🌍 Integrated VPN Geo-Blocking Testing Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check Node.js
Write-Host "`n🔍 Checking Node.js..." -ForegroundColor Yellow
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "💡 Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    $installNode = Read-Host "Open download page? (y/n)"
    if ($installNode -eq 'y' -or $installNode -eq 'Y') {
        Start-Process "https://nodejs.org/"
    }
    exit 1
}

# Check Go
Write-Host "`n🔍 Checking Go..." -ForegroundColor Yellow
if (Test-Command "go") {
    $goVersion = go version
    Write-Host "✅ Go found: $goVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️  Go not found - needed for API server" -ForegroundColor Yellow
}

# Install Node.js dependencies
Write-Host "`n📦 Installing Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    try {
        npm install
        Write-Host "✅ Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  package.json not found, creating minimal one..." -ForegroundColor Yellow
    $packageJson = @{
        name = "vpn-geoblocking-tester"
        version = "1.0.0"
        dependencies = @{
            puppeteer = "^21.0.0"
        }
    } | ConvertTo-Json -Depth 3
    
    $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    npm install
}

# Check for VPN clients
Write-Host "`n🔍 Checking for VPN clients..." -ForegroundColor Yellow
$vpnClients = @("expressvpn", "nordvpn", "surfshark", "protonvpn")
$foundVPNs = @()

foreach ($vpn in $vpnClients) {
    if (Test-Command $vpn) {
        Write-Host "✅ Found: $vpn" -ForegroundColor Green
        $foundVPNs += $vpn
    }
}

if ($foundVPNs.Count -eq 0) {
    Write-Host "⚠️  No VPN clients found in PATH" -ForegroundColor Yellow
    Write-Host "💡 Supported VPN clients:" -ForegroundColor White
    Write-Host "   • ExpressVPN - https://www.expressvpn.com/" -ForegroundColor White
    Write-Host "   • NordVPN - https://nordvpn.com/" -ForegroundColor White  
    Write-Host "   • Surfshark - https://surfshark.com/" -ForegroundColor White
    Write-Host "   • ProtonVPN - https://protonvpn.com/" -ForegroundColor White
    
    $installVPN = Read-Host "`nWould you like to continue without VPN client? (y/n)"
    if ($installVPN -ne 'y' -and $installVPN -ne 'Y') {
        exit 1
    }
} else {
    Write-Host "✅ Found $($foundVPNs.Count) VPN client(s): $($foundVPNs -join ', ')" -ForegroundColor Green
}

# Check Go server
Write-Host "`n🔍 Checking Go server..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod "http://localhost:8080/api/ip-info" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Go server is running" -ForegroundColor Green
    Write-Host "📍 Current IP: $($response.ip)" -ForegroundColor White
    Write-Host "📍 Current Country: $($response.country_name) ($($response.country_code))" -ForegroundColor White
} catch {
    Write-Host "❌ Go server not running" -ForegroundColor Red
    
    if (Test-Path "shopify_customers.go") {
        $startServer = Read-Host "Start Go server now? (y/n)"
        if ($startServer -eq 'y' -or $startServer -eq 'Y') {
            Write-Host "🚀 Starting Go server..." -ForegroundColor Green
            Start-Process -FilePath "go" -ArgumentList "run", "shopify_customers.go" -NoNewWindow
            
            Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
            Start-Sleep 6
            
            try {
                $response = Invoke-RestMethod "http://localhost:8080/api/ip-info" -TimeoutSec 5
                Write-Host "✅ Server started successfully!" -ForegroundColor Green
            } catch {
                Write-Host "⚠️  Server may still be starting..." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "⚠️  shopify_customers.go not found" -ForegroundColor Yellow
    }
}

# Test configuration files
Write-Host "`n🔍 Checking configuration files..." -ForegroundColor Yellow
$requiredFiles = @(
    "integrated-vpn-geoblocking-tester.js",
    "run-vpn-test.js", 
    "vpn-test-config.json"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $file" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "⚠️  Some required files are missing" -ForegroundColor Yellow
    Write-Host "💡 Make sure all script files are in the current directory" -ForegroundColor White
}

# Show usage instructions
Write-Host "`n🎯 Setup Complete! Usage Instructions:" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`n📋 Quick Start Commands:" -ForegroundColor White
Write-Host "  node run-vpn-test.js                    # Interactive mode" -ForegroundColor Gray
Write-Host "  node run-vpn-test.js --config demo      # Demo configuration" -ForegroundColor Gray
Write-Host "  node run-vpn-test.js --config basic     # Basic test" -ForegroundColor Gray
Write-Host "  node run-vpn-test.js --headless         # Headless mode" -ForegroundColor Gray

Write-Host "`n🌐 Available Test Configurations:" -ForegroundColor White
if (Test-Path "vpn-test-config.json") {
    try {
        $config = Get-Content "vpn-test-config.json" | ConvertFrom-Json
        foreach ($configName in $config.testConfigurations.PSObject.Properties.Name) {
            $configObj = $config.testConfigurations.$configName
            Write-Host "  $configName - $($configObj.description)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  (Could not read configuration file)" -ForegroundColor Yellow
    }
}

Write-Host "`n⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "  • Make sure your VPN client is installed and configured" -ForegroundColor White
Write-Host "  • The test will connect/disconnect your VPN multiple times" -ForegroundColor White
Write-Host "  • Ensure Go server is running before starting tests" -ForegroundColor White
Write-Host "  • Some VPN clients may require admin/sudo privileges" -ForegroundColor White

Write-Host "`n🎉 Ready to test! Run your first test:" -ForegroundColor Green
Write-Host "      node run-vpn-test.js --config demo" -ForegroundColor Cyan

# Optional: Run a test immediately
$runTest = Read-Host "`nWould you like to run a test now? (y/n)"
if ($runTest -eq 'y' -or $runTest -eq 'Y') {
    Write-Host "`n�� Starting demo test..." -ForegroundColor Green
    node run-vpn-test.js --config demo
}