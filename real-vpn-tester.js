// Real VPN Connection Testing Script
// This script integrates with actual VPN software for real testing

const puppeteer = require('puppeteer');
const { execSync, spawn } = require('child_process');
const fs = require('fs');

class RealVPNTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.apiBaseUrl = 'http://localhost:8080';
        this.vpnProcess = null;
        this.originalLocation = null;
    }

    // VPN connection configurations for popular VPN clients
    getVPNCommands() {
        return {
            // ExpressVPN commands
            expressvpn: {
                connect: (country) => `expressvpn connect "${country}"`,
                disconnect: () => `expressvpn disconnect`,
                status: () => `expressvpn status`,
                countries: {
                    'DE': 'Germany',
                    'FR': 'France', 
                    'ES': 'Spain',
                    'RU': 'Russia',
                    'GB': 'UK',
                    'US': 'USA'
                }
            },
            
            // NordVPN commands
            nordvpn: {
                connect: (country) => `nordvpn connect ${country}`,
                disconnect: () => `nordvpn disconnect`,
                status: () => `nordvpn status`,
                countries: {
                    'DE': 'Germany',
                    'FR': 'France',
                    'ES': 'Spain', 
                    'GB': 'United_Kingdom',
                    'US': 'United_States'
                }
            },
            
            // Surfshark commands
            surfshark: {
                connect: (country) => `surfshark-vpn attack --country=${country}`,
                disconnect: () => `surfshark-vpn down`,
                status: () => `surfshark-vpn status`,
                countries: {
                    'DE': 'de',
                    'FR': 'fr',
                    'ES': 'es',
                    'GB': 'uk',
                    'US': 'us'
                }
            },

            // ProtonVPN commands
            protonvpn: {
                connect: (country) => `protonvpn connect --country ${country}`,
                disconnect: () => `protonvpn disconnect`,
                status: () => `protonvpn status`,
                countries: {
                    'DE': 'DE',
                    'FR': 'FR',
                    'ES': 'ES',
                    'GB': 'GB', 
                    'US': 'US'
                }
            }
        };
    }

    // Auto-detect installed VPN client
    async detectVPNClient() {
        console.log('🔍 Detecting installed VPN clients...');
        
        const vpnClients = ['expressvpn', 'nordvpn', 'surfshark-vpn', 'protonvpn'];
        
        for (const client of vpnClients) {
            try {
                execSync(`which ${client}`, { stdio: 'ignore' });
                console.log(`✅ Found VPN client: ${client}`);
                return client.replace('-vpn', '').replace('-', '');
            } catch (error) {
                // Client not found
            }
        }
        
        // Try Windows detection
        try {
            execSync('where expressvpn', { stdio: 'ignore' });
            console.log('✅ Found VPN client: ExpressVPN (Windows)');
            return 'expressvpn';
        } catch (error) {
            // Not found
        }
        
        console.log('❌ No supported VPN client found');
        console.log('💡 Supported VPN clients: ExpressVPN, NordVPN, Surfshark, ProtonVPN');
        return null;
    }

    // Initialize browser
    async initialize() {
        console.log('🚀 Initializing real VPN testing...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 1000,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1200, height: 800 });
        
        console.log('✅ Browser initialized');
    }

    // Get current real location
    async getCurrentLocation() {
        console.log('📍 Getting current location...');
        
        try {
            const response = await this.page.evaluate(async (apiUrl) => {
                const resp = await fetch(`${apiUrl}/api/ip-info`);
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                return await resp.json();
            }, this.apiBaseUrl);
            
            const location = {
                ip: response.ip,
                country: response.country_code,
                countryName: response.country_name,
                city: response.city,
                region: response.region
            };
            
            console.log(`📍 Location: ${location.countryName} (${location.country})`);
            console.log(`📍 IP: ${location.ip}`);
            console.log(`📍 City: ${location.city}, ${location.region}`);
            
            return location;
        } catch (error) {
            console.log('❌ Failed to get location:', error.message);
            return null;
        }
    }

    // Connect to VPN
    async connectVPN(vpnClient, countryCode) {
        const vpnConfig = this.getVPNCommands()[vpnClient];
        if (!vpnConfig) {
            throw new Error(`Unsupported VPN client: ${vpnClient}`);
        }
        
        const countryName = vpnConfig.countries[countryCode];
        if (!countryName) {
            throw new Error(`Country ${countryCode} not supported by ${vpnClient}`);
        }
        
        console.log(`🔌 Connecting to ${countryName} via ${vpnClient}...`);
        
        try {
            // Disconnect first if connected
            try {
                execSync(vpnConfig.disconnect(), { stdio: 'ignore', timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                // Ignore disconnect errors
            }
            
            // Connect to target country
            const connectCommand = vpnConfig.connect(countryName);
            console.log(`Executing: ${connectCommand}`);
            
            execSync(connectCommand, { 
                stdio: 'inherit', 
                timeout: 30000 
            });
            
            // Wait for connection to stabilize
            console.log('⏳ Waiting for VPN connection to stabilize...');
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Verify connection
            try {
                const status = execSync(vpnConfig.status(), { encoding: 'utf8' });
                console.log('📊 VPN Status:', status.trim());
            } catch (error) {
                console.log('⚠️  Could not get VPN status');
            }
            
            console.log(`✅ Connected to ${countryName}`);
            return true;
            
        } catch (error) {
            console.log(`❌ Failed to connect to ${countryName}:`, error.message);
            return false;
        }
    }

    // Disconnect VPN
    async disconnectVPN(vpnClient) {
        const vpnConfig = this.getVPNCommands()[vpnClient];
        if (!vpnConfig) return;
        
        console.log(`🔌 Disconnecting VPN...`);
        
        try {
            execSync(vpnConfig.disconnect(), { stdio: 'inherit', timeout: 15000 });
            console.log('✅ VPN disconnected');
            
            // Wait for disconnection to complete
            await new Promise(resolve => setTimeout(resolve, 5000));
            
        } catch (error) {
            console.log('⚠️  VPN disconnect error (might already be disconnected)');
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
                return { allowed: true, data: response.data };
            } else if (response.status === 403) {
                console.log('🚫 API Access: BLOCKED');
                return { allowed: false, data: response.data };
            } else {
                console.log('❌ API Access: ERROR', response.status);
                return { error: true, status: response.status };
            }
        } catch (error) {
            console.log('❌ API test failed:', error.message);
            return { error: true, message: error.message };
        }
    }

    // Block countries
    async blockCountries(countries) {
        console.log(`🚫 Blocking countries: ${countries.join(', ')}`);
        
        try {
            await this.page.evaluate(async (apiUrl, countriesToBlock) => {
                const resp = await fetch(`${apiUrl}/api/block-countries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ countries: countriesToBlock })
                });
                return await resp.json();
            }, this.apiBaseUrl, countries);
            
            console.log('✅ Countries blocked successfully');
        } catch (error) {
            console.log('❌ Failed to block countries:', error.message);
            throw error;
        }
    }

    // Run complete real VPN test
    async runRealVPNTest(vpnClient, testCountries = ['DE', 'ES', 'FR']) {
        console.log('🌍 Starting Real VPN Geo-Blocking Test');
        console.log('='.repeat(50));
        
        try {
            await this.initialize();
            
            // Get baseline location
            console.log('\n📍 STEP 1: Baseline Location');
            this.originalLocation = await this.getCurrentLocation();
            if (!this.originalLocation) {
                throw new Error('Could not get baseline location');
            }
            
            // Test baseline access
            console.log('\n🧪 STEP 2: Baseline Access Test');
            const baselineAccess = await this.testAPIAccess();
            console.log('Baseline result:', baselineAccess.allowed ? 'ALLOWED' : 'BLOCKED');
            
            // Block test countries
            console.log('\n🚫 STEP 3: Block Countries');
            await this.blockCountries(testCountries);
            
            // Test each country with real VPN
            console.log('\n🌐 STEP 4: Real VPN Testing');
            for (const country of testCountries) {
                console.log(`\n--- Testing ${country} ---`);
                
                // Connect VPN
                const connected = await this.connectVPN(vpnClient, country);
                if (!connected) {
                    console.log(`⚠️  Skipping ${country} - VPN connection failed`);
                    continue;
                }
                
                // Get new location
                const vpnLocation = await this.getCurrentLocation();
                if (vpnLocation) {
                    console.log(`📍 VPN Location: ${vpnLocation.countryName} (${vpnLocation.country})`);
                    
                    // Test API access
                    const accessResult = await this.testAPIAccess();
                    
                    if (vpnLocation.country === country) {
                        if (accessResult.allowed) {
                            console.log('❌ UNEXPECTED: Access allowed from blocked country!');
                        } else {
                            console.log('✅ EXPECTED: Access blocked from blocked country');
                        }
                    } else {
                        console.log(`⚠️  VPN connected to ${vpnLocation.country} instead of ${country}`);
                    }
                } else {
                    console.log('❌ Could not detect VPN location');
                }
                
                // Disconnect VPN
                await this.disconnectVPN(vpnClient);
                
                // Wait between tests
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            console.log('\n🎉 Real VPN test completed!');
            
        } catch (error) {
            console.log('❌ Test failed:', error.message);
        } finally {
            await this.cleanup();
        }
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up...');
        
        // Ensure VPN is disconnected
        if (this.vpnClient) {
            await this.disconnectVPN(this.vpnClient);
        }
        
        if (this.browser) {
            await this.browser.close();
        }
        
        console.log('✅ Cleanup completed');
    }
}

// Main execution
async function main() {
    const tester = new RealVPNTester();
    
    // Auto-detect VPN client
    const vpnClient = await tester.detectVPNClient();
    if (!vpnClient) {
        console.log('❌ No VPN client detected. Please install one of the supported VPN clients.');
        return;
    }
    
    // Run the test
    await tester.runRealVPNTest(vpnClient, ['DE', 'ES']);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealVPNTester;
