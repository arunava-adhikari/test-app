# 🌍 Integrated VPN Geo-Blocking Testing Suite

**Complete automation for VPN-based geo-blocking testing with real VPN connections integrated directly into headless browser scripts.**

## 🚀 **Quick Start**

### **1. Setup (One-time)**
```powershell
# Windows
.\setup-integrated-vpn-testing.ps1

# Or manually
npm install
```

### **2. Run Tests**
```bash
# Interactive mode (recommended for first use)
node run-vpn-test.js

# Quick demo
npm run test-demo

# Basic functionality test
npm run test-basic

# Comprehensive test suite
npm run test-comprehensive
```

## 📁 **File Overview**

| File | Purpose |
|------|---------|
| **`integrated-vpn-geoblocking-tester.js`** | Main testing engine with VPN integration |
| **`run-vpn-test.js`** | Command-line launcher with configuration options |
| **`vpn-test-config.json`** | Pre-configured test scenarios |
| **`setup-integrated-vpn-testing.ps1`** | Automated setup script |
| **`package.json`** | Dependencies and npm scripts |

## 🎯 **What This Script Does**

### **Complete Automation:**
1. **🔍 Auto-detects** your VPN client (ExpressVPN, NordVPN, Surfshark, ProtonVPN)
2. **🌐 Launches** headless Chrome browser
3. **📍 Gets** your baseline location via your Go API
4. **🚫 Configures** country blocking via API calls
5. **🔌 Connects** to real VPN servers in target countries
6. **📊 Tests** API access from each VPN location
7. **✅ Validates** geo-blocking is working correctly
8. **🔄 Disconnects** VPN and moves to next country
9. **📄 Generates** comprehensive test report

### **Real VPN Integration:**
```javascript
// Example: Testing Germany with ExpressVPN
await tester.connectVPN('DE');           // Connects to German VPN server
const location = await tester.getCurrentLocation(); // Gets new IP via your API
const access = await tester.testAPIAccess();        // Tests if blocked
// Result: location.country = 'DE', access.blocked = true
```

## 🛠️ **Configuration Options**

### **Pre-built Configurations:**

#### **🎯 Demo Configuration (`--config demo`)**
```json
{
  "testCountries": ["US", "DE", "ES"],
  "blockedCountries": ["DE"],
  "headless": false,
  "slowMo": 2000,
  "timeout": 30000
}
```
*Perfect for live demonstrations - slow, visual, reliable*

#### **⚡ Basic Configuration (`--config basic`)**
```json
{
  "testCountries": ["US", "DE", "GB", "FR"],
  "blockedCountries": ["DE", "RU"],
  "headless": false,
  "slowMo": 1000,
  "timeout": 30000
}
```
*Quick functionality test*

#### **🔬 Comprehensive Configuration (`--config comprehensive`)**
```json
{
  "testCountries": ["US", "DE", "RU", "FR", "GB", "ES", "CN", "AU", "CA"],
  "blockedCountries": ["DE", "RU", "CN", "IR"],
  "headless": false,
  "timeout": 45000
}
```
*Full test suite with multiple countries*

#### **🏛️ Compliance Configuration (`--config compliance`)**
```json
{
  "testCountries": ["RU", "CN", "IR", "KP", "CU"],
  "blockedCountries": ["RU", "CN", "IR", "KP", "CU"],
  "slowMo": 1500,
  "timeout": 60000
}
```
*Test blocking of sanctioned countries*

#### **🤖 CI Configuration (`--config ci`)**
```json
{
  "testCountries": ["US", "DE", "FR"],
  "blockedCountries": ["DE"],
  "headless": true,
  "slowMo": 0,
  "timeout": 20000
}
```
*Fast, headless testing for continuous integration*

## 🎮 **Usage Examples**

### **Interactive Mode:**
```bash
node run-vpn-test.js
```
Shows configuration menu, lets you select test type.

### **Direct Configuration:**
```bash
# Demo with visual browser
node run-vpn-test.js --config demo

# Basic test in headless mode  
node run-vpn-test.js --config basic --headless

# Force specific VPN provider
node run-vpn-test.js --config demo --vpn expressvpn

# Skip confirmation prompts
node run-vpn-test.js --config comprehensive --yes
```

### **NPM Scripts:**
```bash
npm run test-demo           # Demo configuration
npm run test-basic          # Basic functionality  
npm run test-comprehensive  # Full test suite
npm run test-headless       # Headless mode
npm run test-compliance     # Compliance testing
npm run test-ci             # CI/CD mode
```

## 🌐 **VPN Provider Support**

### **Auto-Detection:**
The script automatically detects which VPN client you have installed:

```javascript
// Auto-detection process
✅ Found VPN client: ExpressVPN
🔌 Using ExpressVPN for testing
```

### **Supported Commands by Provider:**

#### **ExpressVPN:**
```bash
expressvpn connect "Germany"      # Connect
expressvpn disconnect             # Disconnect  
expressvpn status                 # Check status
```

#### **NordVPN:**
```bash
nordvpn connect Germany           # Connect
nordvpn disconnect                # Disconnect
nordvpn status                    # Check status
```

#### **Surfshark:**
```bash
surfshark-vpn attack --country=de # Connect
surfshark-vpn down                # Disconnect
surfshark-vpn status              # Check status
```

#### **ProtonVPN:**
```bash
protonvpn connect --country DE    # Connect
protonvpn disconnect              # Disconnect
protonvpn status                  # Check status
```

## 📊 **Test Output Example**

```
🌍 Starting Integrated VPN Geo-Blocking Test Suite
==========================================================

📍 STEP 1: Baseline Location Check
📍 Baseline: India (IN)
📍 IP: 43.251.171.199

🧪 STEP 2: Baseline Access Test
Access: ✅ GRANTED

🚫 STEP 3: Block Target Countries
🚫 Blocking countries: DE, RU

🌐 STEP 4: Real VPN Testing

--- Testing US ---
🔌 Connecting to US via ExpressVPN...
✅ Connected to US (USA - New York)
📍 VPN Location: United States (US)
📍 New IP: 198.51.100.42
🧪 Testing API access...
✅ EXPECTED: Access allowed for US

--- Testing DE ---
🔌 Connecting to DE via ExpressVPN...
✅ Connected to DE (Germany - Frankfurt)
📍 VPN Location: Germany (DE)
📍 New IP: 185.199.108.153
🧪 Testing API access...
🚫 API Access: BLOCKED
✅ EXPECTED: Access blocked for DE

📊 STEP 5: Generate Report
📄 Report saved to: vpn-geoblocking-test-report.json

📊 TEST RESULTS SUMMARY
======================
📍 Baseline: India (IN)
🌐 VPN Provider: ExpressVPN
🧪 Total Tests: 2
✅ Successful: 2
❌ Failed: 0

🌍 Country Test Results:
   ✅ US: ALLOWED (expected: ALLOWED)
   ✅ DE: BLOCKED (expected: BLOCKED)

🎉 Test suite completed in 45 seconds!
```

## 📄 **Generated Reports**

### **JSON Report Structure:**
```json
{
  "testSuite": "Integrated VPN Geo-Blocking Test",
  "timestamp": "2023-12-07T10:30:00.000Z",
  "vpnProvider": "ExpressVPN",
  "summary": {
    "totalTests": 3,
    "successful": 3,
    "failed": 0,
    "blocked": 2,
    "allowed": 1
  },
  "results": [
    {
      "type": "vpn_test",
      "data": {
        "country": "DE",
        "success": true,
        "vpnConnection": {
          "connected": true,
          "location": "Germany - Frankfurt"
        },
        "locationAfterVPN": {
          "ip": "185.199.108.153",
          "country": "DE",
          "countryName": "Germany"
        },
        "apiAccess": {
          "allowed": false,
          "blocked": true,
          "status": 403
        },
        "expectedBlocked": true
      }
    }
  ]
}
```

## 🛡️ **Security & Safety**

### **Automatic Cleanup:**
- **VPN disconnection** ensured even if test fails
- **Browser cleanup** prevents resource leaks
- **Error handling** prevents stuck connections

### **Safe Testing:**
- Tests run in isolated browser context
- No permanent configuration changes
- VPN credentials never logged or stored

## 🔧 **Troubleshooting**

### **Common Issues:**

#### **"No VPN provider found"**
```bash
# Check if VPN client is installed and in PATH
expressvpn --version  # or nordvpn --version, etc.

# Install VPN client if needed
# ExpressVPN: https://www.expressvpn.com/
# NordVPN: https://nordvpn.com/
```

#### **"Go server not accessible"**
```bash
# Start Go server
go run shopify_customers.go

# Check server is running
curl http://localhost:8080/api/ip-info
```

#### **"VPN connection failed"**
- Check VPN client is logged in and configured
- Try connecting manually first: `expressvpn connect Germany`
- Ensure no other VPN connections are active

#### **"Permission denied" (Linux/Mac)**
```bash
# Some VPN clients need sudo
sudo node run-vpn-test.js --config demo
```

### **Debug Mode:**
```bash
# Run with verbose logging
DEBUG=* node run-vpn-test.js --config basic

# Run with visible browser for debugging
node run-vpn-test.js --config basic --headless false
```

## 🎯 **Use Cases**

### **1. Live Demonstrations:**
```bash
npm run test-demo
```
- Slow, visual execution
- Perfect for showing clients/stakeholders
- Clear step-by-step progress

### **2. Compliance Testing:**
```bash
npm run test-compliance
```
- Test blocking of sanctioned countries
- Generate compliance reports
- Validate regulatory requirements

### **3. Development Testing:**
```bash
npm run test-basic
```
- Quick functionality verification
- Test core blocking logic
- Validate API changes

### **4. CI/CD Integration:**
```bash
npm run test-ci
```
- Headless, fast execution
- Automated testing in pipelines
- JSON report generation

## 🚀 **Advanced Usage**

### **Custom Configuration:**
```javascript
const config = {
    apiUrl: 'http://localhost:8080',
    vpnProvider: 'expressvpn',
    testCountries: ['US', 'DE', 'CN'],
    blockedCountries: ['CN'],
    headless: true,
    timeout: 60000,
    reportFile: 'custom-report.json'
};

const tester = new IntegratedVPNGeoBlockingTester(config);
await tester.runCompleteTest();
```

### **Programmatic Usage:**
```javascript
const IntegratedVPNGeoBlockingTester = require('./integrated-vpn-geoblocking-tester');

async function customTest() {
    const tester = new IntegratedVPNGeoBlockingTester({
        testCountries: ['DE'],
        blockedCountries: ['DE']
    });
    
    await tester.initialize();
    await tester.connectVPN('DE');
    const location = await tester.getCurrentLocation();
    const access = await tester.testAPIAccess();
    
    console.log(`Germany VPN: ${access.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    
    await tester.cleanup();
}
```

## 📋 **Prerequisites**

### **Required Software:**
- ✅ **Node.js** (v16+) - [Download](https://nodejs.org/)
- ✅ **Go** - For running your API server
- ✅ **VPN Client** - ExpressVPN, NordVPN, Surfshark, or ProtonVPN

### **Setup Steps:**
1. Install Node.js and Go
2. Install and configure VPN client
3. Run setup script: `.\setup-integrated-vpn-testing.ps1`
4. Start Go server: `go run shopify_customers.go`
5. Run tests: `npm run test-demo`

## 🎉 **Ready to Test!**

Your integrated VPN geo-blocking testing suite is ready for professional demonstrations and automated validation. The script handles everything from VPN connections to detailed reporting, giving you a complete solution for testing geo-blocking with real VPN traffic.

**Start with a demo test:**
```bash
npm run test-demo
```

🌍🛡️ **Complete automation for VPN geo-blocking testing!**
