# PowerShell script to test VPN blocking system
# Run this after connecting to different VPN servers

Write-Host "🧪 VPN Blocking System Test" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Test 1: Check current location
Write-Host "`n1️⃣  Checking current location..." -ForegroundColor Yellow
try {
    $location = Invoke-RestMethod "http://localhost:8080/api/ip-info" -TimeoutSec 10
    Write-Host "   📍 IP Address: $($location.ip)" -ForegroundColor Green
    Write-Host "   🌍 Country: $($location.country_name) ($($location.country_code))" -ForegroundColor Green
    Write-Host "   🏢 ISP: $($location.isp)" -ForegroundColor Green
    $currentCountry = $location.country_code
} catch {
    Write-Host "   ❌ Could not detect location: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   💡 Make sure your Go server is running on localhost:8080" -ForegroundColor Yellow
    exit 1
}

# Test 2: Test API access
Write-Host "`n2️⃣  Testing API access from $currentCountry..." -ForegroundColor Yellow
try {
    $access = Invoke-RestMethod "http://localhost:8080/api/test-access" -TimeoutSec 10
    Write-Host "   ✅ ACCESS GRANTED" -ForegroundColor Green
    Write-Host "   📝 Message: $($access.message)" -ForegroundColor Green
    Write-Host "   🕒 Time: $($access.timestamp)" -ForegroundColor Green
    $accessGranted = $true
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        Write-Host "   🚫 ACCESS BLOCKED" -ForegroundColor Red
        Write-Host "   📝 Reason: $($errorDetails.message)" -ForegroundColor Red
        Write-Host "   🌍 Blocked Country: $($errorDetails.country_code)" -ForegroundColor Red
        Write-Host "   🕒 Blocked At: $($errorDetails.blocked_at)" -ForegroundColor Red
        $accessGranted = $false
    } else {
        Write-Host "   ❌ Connection Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Test 3: VPN Simulation Test
Write-Host "`n3️⃣  Testing VPN simulation..." -ForegroundColor Yellow
$testCountries = @("US", "DE", "RU", "FR", "GB")

foreach ($country in $testCountries) {
    try {
        $body = @{ country_code = $country } | ConvertTo-Json
        $headers = @{ "Content-Type" = "application/json" }
        
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/simulate-vpn" -Method POST -Body $body -Headers $headers -TimeoutSec 10
        $simulation = $response.Content | ConvertFrom-Json
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ $country - ALLOWED" -ForegroundColor Green
        } else {
            Write-Host "   🚫 $country - BLOCKED" -ForegroundColor Red
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            Write-Host "   🚫 $country - BLOCKED" -ForegroundColor Red
        } else {
            Write-Host "   ❌ $country - ERROR: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "Current Location: $currentCountry" -ForegroundColor White
if ($accessGranted) {
    Write-Host "Access Status: ✅ GRANTED (Country not blocked)" -ForegroundColor Green
} else {
    Write-Host "Access Status: 🚫 BLOCKED (Geo-blocking active)" -ForegroundColor Red
}

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
if ($accessGranted) {
    Write-Host "   • Connect VPN to a blocked country (DE, RU, CN)" -ForegroundColor White
    Write-Host "   • Run this script again to see blocking in action" -ForegroundColor White
} else {
    Write-Host "   • ✅ Geo-blocking is working correctly!" -ForegroundColor Green
    Write-Host "   • Connect VPN to an allowed country to test access" -ForegroundColor White
}

Write-Host "   • Use your main demo interface for visual testing" -ForegroundColor White
Write-Host "   • Check server logs for detailed blocking information" -ForegroundColor White

Write-Host "`n🎉 Test completed!" -ForegroundColor Cyan
