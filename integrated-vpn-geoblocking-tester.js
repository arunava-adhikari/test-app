/**
 * Integrated VPN Geo-Blocking Testing Suite
 * 
 * This script provides complete automation for VPN-based geo-blocking testing
 * with integrated VPN connection management and headless browser automation.
 * 
 * Features:
 * - Multiple VPN provider support
 * - Automated browser testing
 * - Real-time IP detection
 * - Complete geo-blocking validation
 * - Comprehensive reporting
 */

const puppeteer = require('puppeteer');
const { execSync, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class IntegratedVPNGeoBlockingTester {
    constructor(config = {}) {
        this.config = {
            apiUrl: config.apiUrl || 'http://localhost:8080',
            vpnProvider: config.vpnProvider || 'auto', // auto, expressvpn, nordvpn, surfshark, protonvpn
            testCountries: config.testCountries || ['US', 'DE', 'RU', 'FR', 'GB', 'ES', 'CN'],
            blockedCountries: config.blockedCountries || ['DE', 'RU', 'CN'],
            headless: config.headless !== undefined ? config.headless : false,
            slowMo: config.slowMo || 1000,
            timeout: config.timeout || 30000,
            reportFile: config.reportFile || 'vpn-test-report.json',
            ...config
        };
        
        this.browser = null;
        this.page = null;
        this.vpnProvider = null;
        this.originalLocation = null;
        this.testResults = [];
        this.vpnConnections = new Map();
        
        // VPN provider configurations
        this.vpnProviders = {
            expressvpn: {
                name: 'ExpressVPN',
                commands: {
                    connect: (country) => `expressvpn connect "${this.getCountryName(country)}"`,
                    disconnect: () => 'expressvpn disconnect',
                    status: () => 'expressvpn status',
                    list: () => 'expressvpn list'
                },
                countries: {
                    'US': 'USA - New York',
                    'DE': 'Germany - Frankfurt',
                    'GB': 'UK - London',
                    'FR': 'France - Paris',
                    'ES': 'Spain - Madrid',
                    'RU': 'Russia - Moscow',
                    'CN': 'Hong Kong'
                },
                parseStatus: (output) => {
                    if (output.includes('Connected to')) {
                        const match = output.match(/Connected to (.+)/);
                        return { connected: true, location: match ? match[1] : 'Unknown' };
                    }
                    return { connected: false, location: null };
                }
            },
            
            nordvpn: {
                name: 'NordVPN',
                commands: {
                    connect: (country) => `nordvpn connect ${this.getCountryName(country)}`,
                    disconnect: () => 'nordvpn disconnect',
                    status: () => 'nordvpn status',
                    list: () => 'nordvpn countries'
                },
                countries: {
                    'US': 'United_States',
                    'DE': 'Germany',
                    'GB': 'United_Kingdom',
                    'FR': 'France',
                    'ES': 'Spain',
                    'RU': 'Russia',
                    'CN': 'Taiwan'
                },
                parseStatus: (output) => {
                    if (output.includes('Status: Connected')) {
                        const match = output.match(/Country: (.+)/);
                        return { connected: true, location: match ? match[1] : 'Unknown' };
                    }
                    return { connected: false, location: null };
                }
            },
            
            surfshark: {
                name: 'Surfshark',
                commands: {
                    connect: (country) => `surfshark-vpn attack --country=${country.toLowerCase()}`,
                    disconnect: () => 'surfshark-vpn down',
                    status: () => 'surfshark-vpn status',
                    list: () => 'surfshark-vpn locations'
                },
                countries: {
                    'US': 'us',
                    'DE': 'de',
                    'GB': 'uk',
                    'FR': 'fr',
                    'ES': 'es',
                    'RU': 'ru',
                    'CN': 'hk'
                },
                parseStatus: (output) => {
                    if (output.includes('Connected')) {
                        return { connected: true, location: 'Connected' };
                    }
                    return { connected: false, location: null };
                }
            },
            
            protonvpn: {
                name: 'ProtonVPN',
                commands: {
                    connect: (country) => `protonvpn connect --country ${country}`,
                    disconnect: () => 'protonvpn disconnect',
                    status: () => 'protonvpn status',
                    list: () => 'protonvpn list'
                },
                countries: {
                    'US': 'US',
                    'DE': 'DE',
                    'GB': 'GB',
                    'FR': 'FR',
                    'ES': 'ES',
                    'RU': 'RU',
                    'CN': 'HK'
                },
                parseStatus: (output) => {
                    if (output.includes('Connected')) {
                        const match = output.match(/Server: (.+)/);
                        return { connected: true, location: match ? match[1] : 'Connected' };
                    }
                    return { connected: false, location: null };
                }
            },

            eonvpn: {
                name: 'eonVPN',
                commands: {
                    connect: (country) => `eonvpn connect ${this.getCountryName(country)}`,
                    disconnect: () => 'eonvpn disconnect',
                    status: () => 'eonvpn status',
                    list: () => 'eonvpn list'
                },
                countries: {
                    'US': 'United States',
                    'DE': 'Germany',
                    'GB': 'United Kingdom',
                    'FR': 'France',
                    'ES': 'Spain',
                    'RU': 'Russia',
                    'CN': 'Hong Kong',
                    'AU': 'Australia',
                    'CA': 'Canada',
                    'JP': 'Japan'
                },
                parseStatus: (output) => {
                    if (output.includes('Connected') || output.includes('connected')) {
                        const match = output.match(/(?:to|in|at)\s+([A-Za-z\s]+)/i);
                        return { connected: true, location: match ? match[1].trim() : 'Connected' };
                    }
                    return { connected: false, location: null };
                }
            }
        };
    }

    /**
     * Initialize the testing environment
     */
    async initialize() {
        this.log('🚀 Initializing Integrated VPN Geo-Blocking Tester...', 'info');
        
        try {
            // Detect and initialize VPN provider
            await this.initializeVPNProvider();
            
            // Initialize browser
            await this.initializeBrowser();
            
            // Check API server
            await this.checkAPIServer();
            
            this.log('✅ Initialization completed successfully', 'success');
            return true;
        } catch (error) {
            this.log(`❌ Initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Auto-detect and initialize VPN provider
     */
    async initializeVPNProvider() {
        this.log('🔍 Detecting VPN provider...', 'info');
        
        if (this.config.vpnProvider !== 'auto') {
            this.vpnProvider = this.vpnProviders[this.config.vpnProvider];
            if (!this.vpnProvider) {
                throw new Error(`Unknown VPN provider: ${this.config.vpnProvider}`);
            }
            this.log(`✅ Using configured VPN provider: ${this.vpnProvider.name}`, 'success');
            return;
        }
        
        // Auto-detect VPN clients
        for (const [key, provider] of Object.entries(this.vpnProviders)) {
            try {
                const testCommand = key === 'expressvpn' ? 'expressvpn --version' : 
                                    key === 'nordvpn' ? 'nordvpn --version' :
                                    key === 'surfshark' ? 'surfshark-vpn --version' :
                                    key === 'protonvpn' ? 'protonvpn --version' :
                                    key === 'eonvpn' ? 'eonvpn --version' :
                                    'unknown --version';
                
                execSync(testCommand, { stdio: 'ignore', timeout: 5000 });
                this.vpnProvider = provider;
                this.vpnProvider.key = key;
                this.log(`✅ Detected VPN provider: ${provider.name}`, 'success');
                return;
            } catch (error) {
                // Provider not found, continue
            }
        }
        
        throw new Error('No supported VPN provider found. Install ExpressVPN, NordVPN, Surfshark, or ProtonVPN.');
    }

    /**
     * Initialize Puppeteer browser
     */
    async initializeBrowser() {
        this.log('🌐 Starting headless browser...', 'info');
        
        this.browser = await puppeteer.launch({
            headless: this.config.headless,
            slowMo: this.config.slowMo,
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
        
        // Enable request interception for better debugging
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            if (request.url().includes('/api/')) {
                this.log(`📡 API Request: ${request.method()} ${request.url()}`, 'debug');
            }
            request.continue();
        });
        
        this.page.on('response', (response) => {
            if (response.url().includes('/api/')) {
                this.log(`📡 API Response: ${response.status()} ${response.url()}`, 'debug');
            }
        });
        
        this.log('✅ Browser initialized', 'success');
    }

    /**
     * Check if API server is running
     */
    async checkAPIServer() {
        this.log('🔍 Checking API server...', 'info');
        
        try {
            const response = await this.page.goto(`${this.config.apiUrl}/api/ip-info`, {
                waitUntil: 'networkidle2',
                timeout: 10000
            });
            
            if (response && response.ok()) {
                this.log('✅ API server is running', 'success');
                return true;
            } else {
                throw new Error(`API server returned ${response ? response.status() : 'no response'}`);
            }
        } catch (error) {
            throw new Error(`API server not accessible: ${error.message}`);
        }
    }

    /**
     * Get current location from API
     */
    async getCurrentLocation() {
        try {
            const response = await this.page.evaluate(async (apiUrl) => {
                const resp = await fetch(`${apiUrl}/api/ip-info`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                return await resp.json();
            }, this.config.apiUrl);
            
            return {
                ip: response.ip,
                country: response.country_code,
                countryName: response.country_name,
                city: response.city,
                region: response.region,
                isp: response.isp
            };
        } catch (error) {
            this.log(`❌ Failed to get location: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Connect to VPN in specific country
     */
    async connectVPN(countryCode) {
        const countryName = this.vpnProvider.countries[countryCode];
        if (!countryName) {
            throw new Error(`Country ${countryCode} not supported by ${this.vpnProvider.name}`);
        }
        
        this.log(`🔌 Connecting to ${countryCode} via ${this.vpnProvider.name}...`, 'info');
        
        try {
            // Disconnect first
            await this.disconnectVPN();
            
            // Connect to target country
            const connectCommand = this.vpnProvider.commands.connect(countryCode);
            this.log(`Executing: ${connectCommand}`, 'debug');
            
            execSync(connectCommand, { 
                stdio: 'pipe', 
                timeout: this.config.timeout,
                encoding: 'utf8'
            });
            
            // Wait for connection to stabilize
            this.log('⏳ Waiting for VPN connection to stabilize...', 'info');
            await this.sleep(8000);
            
            // Verify connection
            const status = await this.getVPNStatus();
            if (status.connected) {
                this.log(`✅ Connected to ${countryCode} (${status.location})`, 'success');
                this.vpnConnections.set(countryCode, {
                    connected: true,
                    location: status.location,
                    timestamp: new Date()
                });
                return true;
            } else {
                throw new Error('VPN connection verification failed');
            }
            
        } catch (error) {
            this.log(`❌ Failed to connect to ${countryCode}: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Disconnect VPN
     */
    async disconnectVPN() {
        try {
            const disconnectCommand = this.vpnProvider.commands.disconnect();
            execSync(disconnectCommand, { 
                stdio: 'ignore', 
                timeout: 15000 
            });
            
            this.log('🔌 VPN disconnected', 'info');
            await this.sleep(3000);
            
        } catch (error) {
            this.log('⚠️  VPN disconnect warning (might already be disconnected)', 'warning');
        }
    }

    /**
     * Get VPN connection status
     */
    async getVPNStatus() {
        try {
            const statusCommand = this.vpnProvider.commands.status();
            const output = execSync(statusCommand, { 
                encoding: 'utf8', 
                timeout: 10000 
            });
            
            return this.vpnProvider.parseStatus(output);
        } catch (error) {
            return { connected: false, location: null };
        }
    }

    /**
     * Test API access
     */
    async testAPIAccess() {
        try {
            const response = await this.page.evaluate(async (apiUrl) => {
                const resp = await fetch(`${apiUrl}/api/test-access`);
                const data = await resp.json();
                return {
                    status: resp.status,
                    data: data
                };
            }, this.config.apiUrl);
            
            return {
                allowed: response.status === 200,
                blocked: response.status === 403,
                status: response.status,
                data: response.data
            };
        } catch (error) {
            return {
                error: true,
                message: error.message
            };
        }
    }

    /**
     * Block countries via API
     */
    async blockCountries(countries) {
        this.log(`🚫 Blocking countries: ${countries.join(', ')}`, 'info');
        
        try {
            await this.page.evaluate(async (apiUrl, countriesToBlock) => {
                const resp = await fetch(`${apiUrl}/api/block-countries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ countries: countriesToBlock })
                });
                
                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}`);
                }
                
                return await resp.json();
            }, this.config.apiUrl, countries);
            
            this.log('✅ Countries blocked successfully', 'success');
        } catch (error) {
            this.log(`❌ Failed to block countries: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Run complete integrated test suite
     */
    async runCompleteTest() {
        this.log('🌍 Starting Integrated VPN Geo-Blocking Test Suite', 'title');
        this.log('='.repeat(60), 'separator');
        
        const startTime = new Date();
        
        try {
            // Initialize everything
            await this.initialize();
            
            // Step 1: Get baseline location
            this.log('\n📍 STEP 1: Baseline Location Check', 'step');
            this.originalLocation = await this.getCurrentLocation();
            if (!this.originalLocation) {
                throw new Error('Could not get baseline location');
            }
            
            this.log(`📍 Baseline: ${this.originalLocation.countryName} (${this.originalLocation.country})`, 'info');
            this.log(`📍 IP: ${this.originalLocation.ip}`, 'info');
            
            this.addTestResult('baseline', {
                location: this.originalLocation,
                timestamp: new Date()
            });
            
            // Step 2: Test baseline access
            this.log('\n🧪 STEP 2: Baseline Access Test', 'step');
            const baselineAccess = await this.testAPIAccess();
            this.log(`Access: ${baselineAccess.allowed ? '✅ GRANTED' : '🚫 BLOCKED'}`, 'info');
            
            this.addTestResult('baseline_access', baselineAccess);
            
            // Step 3: Block countries
            this.log('\n🚫 STEP 3: Block Target Countries', 'step');
            await this.blockCountries(this.config.blockedCountries);
            
            // Step 4: Test each country with real VPN
            this.log('\n🌐 STEP 4: Real VPN Testing', 'step');
            for (const countryCode of this.config.testCountries) {
                await this.testCountryWithVPN(countryCode);
                await this.sleep(2000); // Brief pause between tests
            }
            
            // Step 5: Generate and save report
            this.log('\n📊 STEP 5: Generate Report', 'step');
            await this.generateReport();
            
            const endTime = new Date();
            const duration = Math.round((endTime - startTime) / 1000);
            
            this.log(`\n🎉 Test suite completed in ${duration} seconds!`, 'success');
            
        } catch (error) {
            this.log(`❌ Test suite failed: ${error.message}`, 'error');
            throw error;
        } finally {
            await this.cleanup();
        }
    }

    /**
     * Test specific country with VPN connection
     */
    async testCountryWithVPN(countryCode) {
        this.log(`\n--- Testing ${countryCode} ---`, 'info');
        
        const testStart = new Date();
        const testResult = {
            country: countryCode,
            timestamp: testStart,
            vpnConnection: null,
            locationAfterVPN: null,
            apiAccess: null,
            expectedBlocked: this.config.blockedCountries.includes(countryCode),
            success: false,
            error: null
        };
        
        try {
            // Connect VPN
            const connected = await this.connectVPN(countryCode);
            if (!connected) {
                testResult.error = 'VPN connection failed';
                this.addTestResult('vpn_test', testResult);
                return;
            }
            
            testResult.vpnConnection = this.vpnConnections.get(countryCode);
            
            // Get new location
            const vpnLocation = await this.getCurrentLocation();
            if (!vpnLocation) {
                testResult.error = 'Could not detect location after VPN connection';
                this.addTestResult('vpn_test', testResult);
                return;
            }
            
            testResult.locationAfterVPN = vpnLocation;
            this.log(`📍 VPN Location: ${vpnLocation.countryName} (${vpnLocation.country})`, 'info');
            this.log(`📍 New IP: ${vpnLocation.ip}`, 'info');
            
            // Test API access
            const apiAccess = await this.testAPIAccess();
            testResult.apiAccess = apiAccess;
            
            // Validate results
            const actuallyBlocked = !apiAccess.allowed;
            const expectedResult = testResult.expectedBlocked;
            
            if (vpnLocation.country === countryCode) {
                if (actuallyBlocked === expectedResult) {
                    this.log(`✅ EXPECTED: Access ${actuallyBlocked ? 'blocked' : 'allowed'} for ${countryCode}`, 'success');
                    testResult.success = true;
                } else {
                    this.log(`❌ UNEXPECTED: Expected ${expectedResult ? 'blocked' : 'allowed'}, got ${actuallyBlocked ? 'blocked' : 'allowed'}`, 'error');
                    testResult.error = 'Unexpected access result';
                }
            } else {
                this.log(`⚠️  VPN connected to ${vpnLocation.country} instead of ${countryCode}`, 'warning');
                testResult.error = `Connected to wrong country: ${vpnLocation.country}`;
            }
            
        } catch (error) {
            this.log(`❌ Test failed for ${countryCode}: ${error.message}`, 'error');
            testResult.error = error.message;
        } finally {
            // Always disconnect VPN
            await this.disconnectVPN();
            this.addTestResult('vpn_test', testResult);
        }
    }

    /**
     * Generate comprehensive test report
     */
    async generateReport() {
        const report = {
            testSuite: 'Integrated VPN Geo-Blocking Test',
            timestamp: new Date(),
            config: this.config,
            vpnProvider: this.vpnProvider ? this.vpnProvider.name : 'None',
            results: this.testResults,
            summary: this.generateSummary()
        };
        
        // Save to file
        try {
            await fs.writeFile(
                this.config.reportFile, 
                JSON.stringify(report, null, 2)
            );
            this.log(`📄 Report saved to: ${this.config.reportFile}`, 'success');
        } catch (error) {
            this.log(`⚠️  Could not save report: ${error.message}`, 'warning');
        }
        
        // Print summary
        this.printSummary(report.summary);
        
        return report;
    }

    /**
     * Generate test summary
     */
    generateSummary() {
        const vpnTests = this.testResults.filter(r => r.type === 'vpn_test');
        const successful = vpnTests.filter(r => r.data.success);
        const failed = vpnTests.filter(r => !r.data.success);
        const blocked = vpnTests.filter(r => r.data.apiAccess && !r.data.apiAccess.allowed);
        const allowed = vpnTests.filter(r => r.data.apiAccess && r.data.apiAccess.allowed);
        
        return {
            totalTests: vpnTests.length,
            successful: successful.length,
            failed: failed.length,
            blocked: blocked.length,
            allowed: allowed.length,
            vpnProvider: this.vpnProvider ? this.vpnProvider.name : 'None',
            baselineLocation: this.originalLocation,
            countriesTested: vpnTests.map(r => r.data.country),
            blockedCountries: this.config.blockedCountries
        };
    }

    /**
     * Print test summary
     */
    printSummary(summary) {
        this.log('\n📊 TEST RESULTS SUMMARY', 'title');
        this.log('='.repeat(50), 'separator');
        
        if (summary.baselineLocation) {
            this.log(`📍 Baseline: ${summary.baselineLocation.countryName} (${summary.baselineLocation.country})`, 'info');
            this.log(`📍 IP: ${summary.baselineLocation.ip}`, 'info');
        }
        
        this.log(`🌐 VPN Provider: ${summary.vpnProvider}`, 'info');
        this.log(`🧪 Total Tests: ${summary.totalTests}`, 'info');
        this.log(`✅ Successful: ${summary.successful}`, 'success');
        this.log(`❌ Failed: ${summary.failed}`, summary.failed > 0 ? 'error' : 'info');
        
        this.log('\n🌍 Country Test Results:', 'info');
        const vpnTests = this.testResults.filter(r => r.type === 'vpn_test');
        vpnTests.forEach(test => {
            const { country, success, apiAccess, expectedBlocked, error } = test.data;
            const status = success ? '✅' : '❌';
            const access = apiAccess ? (apiAccess.allowed ? 'ALLOWED' : 'BLOCKED') : 'ERROR';
            const expected = expectedBlocked ? 'BLOCKED' : 'ALLOWED';
            
            if (error) {
                this.log(`   ${status} ${country}: ERROR - ${error}`, 'error');
            } else {
                this.log(`   ${status} ${country}: ${access} (expected: ${expected})`, success ? 'success' : 'error');
            }
        });
    }

    /**
     * Add test result to collection
     */
    addTestResult(type, data) {
        this.testResults.push({
            type,
            data,
            timestamp: new Date()
        });
    }

    /**
     * Get country name for VPN commands
     */
    getCountryName(countryCode) {
        const countryNames = {
            'US': 'United States',
            'DE': 'Germany',
            'GB': 'United Kingdom', 
            'FR': 'France',
            'ES': 'Spain',
            'RU': 'Russia',
            'CN': 'China'
        };
        return countryNames[countryCode] || countryCode;
    }

    /**
     * Utility: Sleep for specified milliseconds
     */
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Utility: Logging with colors and timestamps
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const colors = {
            title: '\x1b[1m\x1b[36m',    // Bold Cyan
            step: '\x1b[1m\x1b[33m',     // Bold Yellow
            success: '\x1b[32m',         // Green
            error: '\x1b[31m',           // Red
            warning: '\x1b[33m',         // Yellow
            info: '\x1b[37m',            // White
            debug: '\x1b[90m',           // Gray
            separator: '\x1b[90m',       // Gray
            reset: '\x1b[0m'             // Reset
        };
        
        const color = colors[type] || colors.info;
        const reset = colors.reset;
        
        console.log(`${color}[${timestamp}] ${message}${reset}`);
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        this.log('🧹 Cleaning up...', 'info');
        
        try {
            // Ensure VPN is disconnected
            await this.disconnectVPN();
            
            // Close browser
            if (this.browser) {
                await this.browser.close();
            }
            
            this.log('✅ Cleanup completed', 'success');
        } catch (error) {
            this.log(`⚠️  Cleanup warning: ${error.message}`, 'warning');
        }
    }
}

/**
 * Main execution function
 */
async function main() {
    // Configuration
    const config = {
        apiUrl: 'http://localhost:8080',
        vpnProvider: 'auto', // Will auto-detect
        testCountries: ['US', 'DE', 'RU', 'FR', 'GB', 'ES'],
        blockedCountries: ['DE', 'RU', 'CN'],
        headless: false, // Set to true for true headless mode
        slowMo: 1000,
        timeout: 30000,
        reportFile: 'vpn-geoblocking-test-report.json'
    };
    
    const tester = new IntegratedVPNGeoBlockingTester(config);
    
    try {
        await tester.runCompleteTest();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Export for use as module
module.exports = IntegratedVPNGeoBlockingTester;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

