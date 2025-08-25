# 🌍 Headless Browser VPN Testing Documentation

This documentation explains how to use headless browser automation to test your geo-blocking system with real VPN connections.

## 🚀 **Quick Start**

### **Windows:**
```powershell
.\setup-vpn-testing.ps1
```

### **Linux/Mac:**
```bash
./setup-vpn-testing.sh
```

## 📋 **Prerequisites**

### **Required Software:**
1. **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
2. **Go server** running on `localhost:8080`
3. **One of these VPN clients** (for real testing):
   - ExpressVPN
   - NordVPN
   - Surfshark
   - ProtonVPN

### **Dependencies Installed Automatically:**
- Puppeteer (headless Chrome browser)

## 🧪 **Testing Modes**

### **1. Virtual VPN Simulation (Recommended for Development)**
```bash
node test-vpn-automation.js
```

**Features:**
- ✅ No real VPN required
- ✅ Tests all geo-blocking logic
- ✅ Simulates different countries
- ✅ Safe for continuous integration
- ✅ Fast execution

**What it tests:**
- API endpoint responses
- Country blocking logic
- Frontend interface functionality
- Error handling

### **2. Real VPN Connection Testing (Demo/Production)**
```bash
node real-vpn-tester.js
```

**Features:**
- 🔌 Connects to actual VPN servers
- 🌍 Tests real IP geolocation
- 🛡️ Validates actual geo-blocking
- 📊 Complete end-to-end testing

**What it tests:**
- Real VPN server connections
- Actual IP address changes
- Real-time geolocation detection
- Production-level blocking

## 📁 **File Structure**

```
📁 VPN Testing Suite
├── 📄 test-vpn-automation.js     # Virtual VPN simulation testing
├── 📄 real-vpn-tester.js         # Real VPN connection testing  
├── 📄 package.json               # Node.js dependencies
├── 📄 setup-vpn-testing.ps1      # Windows setup script
├── 📄 setup-vpn-testing.sh       # Linux/Mac setup script
└── 📄 VPN-Testing-README.md      # This documentation
```

## 🔧 **Detailed Usage**

### **Virtual VPN Simulation Testing**

```javascript
const VPNGeoBlockingTester = require('./test-vpn-automation');

const tester = new VPNGeoBlockingTester();
await tester.runCompleteTest();
```

**Test Flow:**
1. **Initialize** headless browser
2. **Check** Go server status
3. **Get** baseline location
4. **Test** baseline API access
5. **Block** target countries
6. **Simulate** VPN connections to different countries
7. **Test** frontend interface
8. **Generate** comprehensive report

### **Real VPN Connection Testing**

```javascript
const RealVPNTester = require('./real-vpn-tester');

const tester = new RealVPNTester();
await tester.runRealVPNTest('expressvpn', ['DE', 'ES', 'FR']);
```

**Test Flow:**
1. **Detect** installed VPN client
2. **Get** baseline location
3. **Block** target countries
4. **Connect** to VPN server in target country
5. **Verify** IP address changed
6. **Test** API access (should be blocked)
7. **Disconnect** VPN
8. **Repeat** for all test countries

## 🎯 **VPN Client Integration**

### **Supported VPN Clients:**

#### **ExpressVPN**
```bash
# Commands used by automation:
expressvpn connect "Germany"
expressvpn disconnect
expressvpn status
```

#### **NordVPN**
```bash
# Commands used by automation:
nordvpn connect Germany
nordvpn disconnect
nordvpn status
```

#### **Surfshark**
```bash
# Commands used by automation:
surfshark-vpn attack --country=de
surfshark-vpn down
surfshark-vpn status
```

#### **ProtonVPN**
```bash
# Commands used by automation:
protonvpn connect --country DE
protonvpn disconnect
protonvpn status
```

## 📊 **Test Reports**

### **Sample Virtual Test Output:**
```
🧪 Starting Complete VPN Geo-Blocking Test Suite
================================================

📍 STEP 1: Baseline Location Check
📍 Current location: United States (US)
📍 IP: 203.0.113.42

🧪 STEP 2: Baseline API Access Test
✅ API Access: GRANTED

🚫 STEP 3: Block Countries
🚫 Blocking countries: DE, RU, CN, FR

🌐 STEP 4: VPN Simulation Tests
✅ VPN Simulation US: ACCESS GRANTED
🚫 VPN Simulation DE: ACCESS BLOCKED
🚫 VPN Simulation RU: ACCESS BLOCKED
🚫 VPN Simulation FR: ACCESS BLOCKED
✅ VPN Simulation GB: ACCESS GRANTED

🎨 STEP 5: Frontend Interface Test
✅ Frontend Interface: WORKING

📊 TEST RESULTS SUMMARY
======================
📍 Baseline Location: United States (US)
🧪 Baseline Access: ✅ ALLOWED
🌐 VPN Simulation Results:
   US: ✅ ALLOWED
   DE: 🚫 BLOCKED
   RU: 🚫 BLOCKED
   FR: 🚫 BLOCKED
   GB: ✅ ALLOWED
🎨 Frontend Interface: ✅ WORKING
```

### **Sample Real VPN Test Output:**
```
🌍 Starting Real VPN Geo-Blocking Test
=====================================

📍 STEP 1: Baseline Location
📍 Location: United States (US)
📍 IP: 203.0.113.42

🚫 STEP 3: Block Countries
🚫 Blocking countries: DE, ES

🌐 STEP 4: Real VPN Testing

--- Testing DE ---
🔌 Connecting to Germany via expressvpn...
✅ Connected to Germany
📍 VPN Location: Germany (DE)
🧪 Testing API access...
🚫 API Access: BLOCKED
✅ EXPECTED: Access blocked from blocked country

--- Testing ES ---
🔌 Connecting to Spain via expressvpn...
✅ Connected to Spain
📍 VPN Location: Spain (ES)
🧪 Testing API access...
🚫 API Access: BLOCKED
✅ EXPECTED: Access blocked from blocked country
```

## 🛠️ **Configuration Options**

### **Customizing Test Countries:**
```javascript
// In test-vpn-automation.js
const testCountries = ['US', 'DE', 'RU', 'FR', 'GB', 'CN'];

// In real-vpn-tester.js
await tester.runRealVPNTest('expressvpn', ['DE', 'ES', 'FR']);
```

### **Browser Settings:**
```javascript
// Headless mode
headless: true,

// Visible mode (for debugging)
headless: false,
slowMo: 1000,
```

### **Timeout Configuration:**
```javascript
// API timeouts
timeout: 5000,

// VPN connection timeout
timeout: 30000,

// Page load timeout
waitUntil: 'networkidle2'
```

## 🐛 **Troubleshooting**

### **Common Issues:**

#### **"Go server is not running"**
```bash
# Start the server first
go run shopify_customers.go
```

#### **"No VPN client found"**
- Install one of the supported VPN clients
- Make sure it's in your system PATH
- Try the virtual simulation mode instead

#### **"VPN connection failed"**
- Check VPN client credentials
- Verify internet connection
- Try a different VPN server location

#### **"Browser automation failed"**
- Check if Puppeteer installed correctly: `npm list puppeteer`
- Try running with visible browser: `headless: false`
- Check for port conflicts on 8080

### **Debug Mode:**
```javascript
// Enable verbose logging
console.log = console.debug = console.info = console.warn = console.error;

// Run with visible browser
const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true 
});
```

## 🎯 **Use Cases**

### **1. Development Testing**
- Use virtual simulation for fast iteration
- Test blocking logic without real VPN
- Continuous integration friendly

### **2. Demo Preparation**
- Use real VPN testing to verify actual blocking
- Create impressive live demonstrations
- Test with actual VPN services

### **3. Production Validation**
- Verify geo-blocking works with real traffic
- Test different VPN providers
- Validate compliance requirements

## 🚀 **Advanced Usage**

### **Custom Test Scenarios:**
```javascript
// Test specific business logic
const customTest = async () => {
    const tester = new VPNGeoBlockingTester();
    await tester.initialize();
    
    // Block specific countries for compliance
    await tester.blockCountries(['RU', 'CN', 'IR']);
    
    // Test access from each blocked country
    for (const country of ['RU', 'CN', 'IR']) {
        const result = await tester.simulateVPNAccess(country);
        assert(result.blocked, `${country} should be blocked`);
    }
};
```

### **Integration with CI/CD:**
```yaml
# GitHub Actions example
- name: Run VPN Geo-blocking Tests
  run: |
    npm install
    go run shopify_customers.go &
    sleep 5
    node test-vpn-automation.js
```

This comprehensive testing suite ensures your geo-blocking system works perfectly with real VPN connections! 🌍🛡️
