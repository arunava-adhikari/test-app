// Headless Browser VPN Testing Automation
// This script automates VPN connection testing with Puppeteer

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');

class VPNGeoBlockingTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.apiBaseUrl = 'http://localhost:8080';
        this.frontendUrl = 'file:///' + process.cwd().replace(/\\/g, '/') + '/index.html';
        this.testResults = [];
    }

    // Initialize browser
    async initialize() {
        console.log('🚀 Starting headless browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for true headless mode
            slowMo: 500,     // Slow down for demo visibility
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1200, height: 800 });
        
        // Enable console logging from browser
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('🔴 Browser Error:', msg.text());
            }
        });
        
        console.log('✅ Browser initialized');
    }

    // Check if Go server is running
    async checkServerStatus() {
        console.log('🔍 Checking server status...');
        try {
            const response = await this.page.goto(`${this.apiBaseUrl}/api/ip-info`, {
                waitUntil: 'networkidle2',
                timeout: 5000
            });
            
            if (response.ok()) {
                console.log('✅ Go server is running');
                return true;
            } else {
                console.log('❌ Go server returned error:', response.status());
                return false;
            }
        } catch (error) {
            console.log('❌ Go server is not running:', error.message);
            return false;
        }
    }

    // Get current IP and country
    async getCurrentLocation() {
        console.log('📍 Getting current location...');
        
        try {
            const response = await this.page.evaluate(async (apiUrl) => {
                const resp = await fetch(`${apiUrl}/api/ip-info`);
                return await resp.json();
            }, this.apiBaseUrl);
            
            console.log(`📍 Current location: ${response.country_name} (${response.country_code})`);
            console.log(`📍 IP: ${response.ip}`);
            
            return {
                ip: response.ip,
                country: response.country_code,
                countryName: response.country_name
            };
        } catch (error) {
            console.log('❌ Failed to get location:', error.message);
            return null;
        }
    }

    // Test API access
    async testAPIAccess() {
        console.log('🧪 Testing API access...');
        
        try {
            const response = await this.page.evaluate(async (apiUrl) => {
                const resp = await fetch(`${apiUrl}/api/test-access`);
                const data = await resp.json();
                return {
                    status: resp.status,
                    data: data
                };
            }, this.apiBaseUrl);
            
            if (response.status === 200) {
                console.log('✅ API Access: GRANTED');
                return { success: true, blocked: false, data: response.data };
            } else if (response.status === 403) {
                console.log('🚫 API Access: BLOCKED');
                return { success: true, blocked: true, data: response.data };
            } else {
                console.log('❌ API Access: ERROR', response.status);
                return { success: false, error: response.status };
            }
        } catch (error) {
            console.log('❌ API test failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Block countries via API
    async blockCountries(countries) {
        console.log(`🚫 Blocking countries: ${countries.join(', ')}`);
        
        try {
            const response = await this.page.evaluate(async (apiUrl, countriesToBlock) => {
                const resp = await fetch(`${apiUrl}/api/block-countries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ countries: countriesToBlock })
                });
                return await resp.json();
            }, this.apiBaseUrl, countries);
            
            console.log('✅ Countries blocked successfully');
            return response;
        } catch (error) {
            console.log('❌ Failed to block countries:', error.message);
            return null;
        }
    }

    // Simulate VPN access
    async simulateVPNAccess(countryCode) {
        console.log(`🌐 Simulating VPN access from: ${countryCode}`);
        
        try {
            const response = await this.page.evaluate(async (apiUrl, country) => {
                const resp = await fetch(`${apiUrl}/api/simulate-vpn`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ country_code: country })
                });
                const data = await resp.json();
                return {
                    status: resp.status,
                    data: data
                };
            }, this.apiBaseUrl, countryCode);
            
            if (response.status === 200) {
                console.log(`✅ VPN Simulation ${countryCode}: ACCESS GRANTED`);
                return { country: countryCode, blocked: false, data: response.data };
            } else if (response.status === 403) {
                console.log(`🚫 VPN Simulation ${countryCode}: ACCESS BLOCKED`);
                return { country: countryCode, blocked: true, data: response.data };
            }
        } catch (error) {
            console.log(`❌ VPN simulation failed for ${countryCode}:`, error.message);
            return { country: countryCode, error: error.message };
        }
    }

    // Test frontend interface
    async testFrontendInterface() {
        console.log('🎨 Testing frontend interface...');
        
        try {
            await this.page.goto(this.frontendUrl, { waitUntil: 'networkidle2' });
            
            // Wait for the page to load
            await this.page.waitForSelector('h1', { timeout: 5000 });
            
            const title = await this.page.$eval('h1', el => el.textContent);
            console.log('✅ Frontend loaded:', title);
            
            // Test Step 4: Country Blocking section
            const step4Exists = await this.page.$('#checkIPBtn');
            if (step4Exists) {
                console.log('✅ Found country blocking test section');
                
                // Click "Check My Location"
                await this.page.click('#checkIPBtn');
                await this.page.waitForTimeout(3000);
                
                // Check if location was detected
                const locationVisible = await this.page.$('#locationInfo:not(.hidden)');
                if (locationVisible) {
                    console.log('✅ Location detection working in frontend');
                } else {
                    console.log('⚠️  Location detection not visible in frontend');
                }
                
                return true;
            } else {
                console.log('⚠️  Country blocking section not found');
                return false;
            }
        } catch (error) {
            console.log('❌ Frontend test failed:', error.message);
            return false;
        }
    }

    // External VPN connection simulation (using system commands)
    async connectToVPNCountry(countryCode) {
        console.log(`🔌 Attempting to connect VPN to: ${countryCode}`);
        
        // Note: This would require actual VPN software integration
        // For demo purposes, we'll simulate by changing our test parameters
        
        const vpnCommands = {
            'DE': 'echo "Simulating VPN connection to Germany"',
            'RU': 'echo "Simulating VPN connection to Russia"', 
            'FR': 'echo "Simulating VPN connection to France"',
            'ES': 'echo "Simulating VPN connection to Spain"'
        };
        
        if (vpnCommands[countryCode]) {
            try {
                const result = execSync(vpnCommands[countryCode], { encoding: 'utf8' });
                console.log('🌐 VPN Command Output:', result.trim());
                
                // Wait for connection to stabilize
                await this.page.waitForTimeout(2000);
                
                console.log(`✅ VPN connection to ${countryCode} simulated`);
                return true;
            } catch (error) {
                console.log(`❌ VPN connection to ${countryCode} failed:`, error.message);
                return false;
            }
        } else {
            console.log(`⚠️  No VPN command configured for ${countryCode}`);
            return false;
        }
    }

    // Run complete test suite
    async runCompleteTest() {
        console.log('🧪 Starting Complete VPN Geo-Blocking Test Suite');
        console.log('='.repeat(60));
        
        try {
            // 1. Initialize
            await this.initialize();
            
            // 2. Check server
            const serverRunning = await this.checkServerStatus();
            if (!serverRunning) {
                console.log('❌ Server not running. Please start with: go run shopify_customers.go');
                return;
            }
            
            // 3. Get baseline location
            console.log('\n📍 STEP 1: Baseline Location Check');
            const baselineLocation = await this.getCurrentLocation();
            this.testResults.push({
                step: 'baseline',
                location: baselineLocation
            });
            
            // 4. Test current access
            console.log('\n🧪 STEP 2: Baseline API Access Test');
            const baselineAccess = await this.testAPIAccess();
            this.testResults.push({
                step: 'baseline_access',
                result: baselineAccess
            });
            
            // 5. Block some countries
            console.log('\n🚫 STEP 3: Block Countries');
            const blockedCountries = ['DE', 'RU', 'CN', 'FR'];
            await this.blockCountries(blockedCountries);
            
            // 6. Test VPN simulations
            console.log('\n🌐 STEP 4: VPN Simulation Tests');
            const testCountries = ['US', 'DE', 'RU', 'FR', 'GB'];
            
            for (const country of testCountries) {
                const result = await this.simulateVPNAccess(country);
                this.testResults.push({
                    step: 'vpn_simulation',
                    country: country,
                    result: result
                });
                await this.page.waitForTimeout(1000);
            }
            
            // 7. Test frontend interface
            console.log('\n🎨 STEP 5: Frontend Interface Test');
            const frontendWorking = await this.testFrontendInterface();
            this.testResults.push({
                step: 'frontend_test',
                result: frontendWorking
            });
            
            // 8. Generate report
            this.generateReport();
            
        } catch (error) {
            console.log('❌ Test suite failed:', error.message);
        } finally {
            await this.cleanup();
        }
    }

    // Generate test report
    generateReport() {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        const baseline = this.testResults.find(r => r.step === 'baseline');
        if (baseline) {
            console.log(`📍 Baseline Location: ${baseline.location?.countryName} (${baseline.location?.country})`);
            console.log(`📍 Baseline IP: ${baseline.location?.ip}`);
        }
        
        const baselineAccess = this.testResults.find(r => r.step === 'baseline_access');
        if (baselineAccess) {
            const status = baselineAccess.result.blocked ? '🚫 BLOCKED' : '✅ ALLOWED';
            console.log(`🧪 Baseline Access: ${status}`);
        }
        
        console.log('\n🌐 VPN Simulation Results:');
        const vpnResults = this.testResults.filter(r => r.step === 'vpn_simulation');
        vpnResults.forEach(result => {
            const status = result.result.blocked ? '🚫 BLOCKED' : '✅ ALLOWED';
            console.log(`   ${result.country}: ${status}`);
        });
        
        const frontendResult = this.testResults.find(r => r.step === 'frontend_test');
        if (frontendResult) {
            const status = frontendResult.result ? '✅ WORKING' : '❌ FAILED';
            console.log(`🎨 Frontend Interface: ${status}`);
        }
        
        console.log('\n🎉 Test Suite Completed!');
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up...');
        if (this.browser) {
            await this.browser.close();
        }
        console.log('✅ Cleanup completed');
    }
}

// Main execution
async function main() {
    const tester = new VPNGeoBlockingTester();
    await tester.runCompleteTest();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = VPNGeoBlockingTester;
