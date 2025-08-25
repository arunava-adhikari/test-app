# PowerShell script to restart the Go server properly
Write-Host "🔄 Restarting Go Server with Enhanced IP Detection" -ForegroundColor Cyan

# Stop any existing Go processes
Write-Host "⏹️  Stopping existing Go processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -match "go"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait for processes to clean up
Start-Sleep 2

# Check if port is free
$portCheck = netstat -an | findstr ":8080"
if ($portCheck) {
    Write-Host "⚠️  Port 8080 still in use, waiting..." -ForegroundColor Yellow
    Start-Sleep 3
}

# Start the server
Write-Host "🚀 Starting Go server..." -ForegroundColor Green
Start-Process -FilePath "go" -ArgumentList "run", "shopify_customers.go" -NoNewWindow

# Wait for server to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep 4

# Test the server
Write-Host "🧪 Testing enhanced IP detection..." -ForegroundColor Cyan
try {
    $result = Invoke-RestMethod "http://localhost:8080/api/ip-info" -TimeoutSec 10
    Write-Host "✅ Success! Detected IP and Country:" -ForegroundColor Green
    Write-Host "   IP: $($result.ip)" -ForegroundColor White
    Write-Host "   Country: $($result.country_name) ($($result.country_code))" -ForegroundColor White
    
    if ($result.country_code -eq "IN") {
        Write-Host "🇮🇳 Correctly detected India! (Your current VPN location)" -ForegroundColor Green
    } else {
        Write-Host "🌍 Detected country: $($result.country_code)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Server test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check if the server started successfully" -ForegroundColor Yellow
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test in browser: http://localhost:8080" -ForegroundColor White
Write-Host "2. Open check-real-ip.html and test detection" -ForegroundColor White
Write-Host "3. Block India (IN) to test geo-blocking" -ForegroundColor White
