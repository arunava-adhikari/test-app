#!/usr/bin/env node

/**
 * VPN Geo-Blocking Test Launcher
 * 
 * Simple command-line interface to run integrated VPN testing
 * 
 * Usage:
 *   node run-vpn-test.js                    # Interactive mode
 *   node run-vpn-test.js --config basic     # Use basic configuration
 *   node run-vpn-test.js --config demo      # Use demo configuration
 *   node run-vpn-test.js --headless         # Run in headless mode
 *   node run-vpn-test.js --help             # Show help
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const IntegratedVPNGeoBlockingTester = require('./integrated-vpn-geoblocking-tester');

class VPNTestLauncher {
    constructor() {
        this.configFile = path.join(__dirname, 'vpn-test-config.json');
        this.config = null;
        this.args = process.argv.slice(2);
    }

    async run() {
        try {
            // Parse command line arguments
            const options = this.parseArgs();
            
            if (options.help) {
                this.showHelp();
                return;
            }

            // Load configuration
            this.loadConfig();

            // Get test configuration
            const testConfig = await this.getTestConfiguration(options);
            
            // Show configuration summary
            this.showConfigSummary(testConfig);
            
            // Confirm before starting
            if (!options.yes && !await this.confirmStart()) {
                console.log('Test cancelled by user.');
                return;
            }

            // Run the test
            console.log('\n🚀 Starting VPN Geo-Blocking Test...\n');
            const tester = new IntegratedVPNGeoBlockingTester(testConfig);
            await tester.runCompleteTest();
            
        } catch (error) {
            console.error('❌ Test launcher failed:', error.message);
            process.exit(1);
        }
    }

    parseArgs() {
        const options = {
            config: null,
            headless: false,
            help: false,
            yes: false,
            vpn: null
        };

        for (let i = 0; i < this.args.length; i++) {
            const arg = this.args[i];
            
            switch (arg) {
                case '--config':
                case '-c':
                    options.config = this.args[++i];
                    break;
                case '--headless':
                case '-h':
                    options.headless = true;
                    break;
                case '--help':
                    options.help = true;
                    break;
                case '--yes':
                case '-y':
                    options.yes = true;
                    break;
                case '--vpn':
                case '-v':
                    options.vpn = this.args[++i];
                    break;
                default:
                    if (arg.startsWith('-')) {
                        console.warn(`Unknown option: ${arg}`);
                    }
            }
        }

        return options;
    }

    loadConfig() {
        try {
            const configData = fs.readFileSync(this.configFile, 'utf8');
            this.config = JSON.parse(configData);
        } catch (error) {
            throw new Error(`Could not load configuration file: ${error.message}`);
        }
    }

    async getTestConfiguration(options) {
        let configName = options.config;

        // If no config specified, show interactive menu
        if (!configName) {
            configName = await this.showConfigMenu();
        }

        // Get base configuration
        const baseConfig = this.config.testConfigurations[configName];
        if (!baseConfig) {
            throw new Error(`Configuration '${configName}' not found`);
        }

        // Apply command line overrides
        const testConfig = { ...baseConfig };
        
        if (options.headless !== undefined) {
            testConfig.headless = options.headless;
        }
        
        if (options.vpn) {
            testConfig.vpnProvider = options.vpn;
        }

        return testConfig;
    }

    async showConfigMenu() {
        console.log('\n📋 Available Test Configurations:\n');
        
        const configs = Object.entries(this.config.testConfigurations);
        configs.forEach(([key, config], index) => {
            console.log(`${index + 1}. ${config.name}`);
            console.log(`   ${config.description}`);
            console.log(`   Countries: ${config.testCountries.join(', ')}`);
            console.log(`   Blocked: ${config.blockedCountries.join(', ')}\n`);
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question('Select configuration (1-' + configs.length + '): ', (answer) => {
                rl.close();
                const index = parseInt(answer) - 1;
                
                if (index >= 0 && index < configs.length) {
                    resolve(configs[index][0]);
                } else {
                    console.log('Invalid selection. Using basic configuration.');
                    resolve('basic');
                }
            });
        });
    }

    showConfigSummary(config) {
        console.log('\n📋 Test Configuration Summary:');
        console.log('================================');
        console.log(`Name: ${config.name || 'Custom'}`);
        console.log(`API URL: ${config.apiUrl}`);
        console.log(`VPN Provider: ${config.vpnProvider}`);
        console.log(`Test Countries: ${config.testCountries.join(', ')}`);
        console.log(`Blocked Countries: ${config.blockedCountries.join(', ')}`);
        console.log(`Headless Mode: ${config.headless ? 'Yes' : 'No'}`);
        console.log(`Timeout: ${config.timeout / 1000}s`);
        
        if (config.reportFile) {
            console.log(`Report File: ${config.reportFile}`);
        }
    }

    async confirmStart() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question('\n⚠️  This will connect and disconnect your VPN multiple times. Continue? (y/N): ', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }

    showHelp() {
        console.log(`
🌍 VPN Geo-Blocking Test Launcher

Usage:
  node run-vpn-test.js [options]

Options:
  --config, -c <name>    Use specific test configuration
  --headless, -h         Run browser in headless mode
  --vpn, -v <provider>   Use specific VPN provider
  --yes, -y              Skip confirmation prompts
  --help                 Show this help message

Available Configurations:
  basic                  Basic functionality test
  comprehensive          Full test suite
  compliance             Compliance/sanctions testing
  demo                   Optimized for live demos
  ci                     Continuous integration

Supported VPN Providers:
  auto                   Auto-detect installed VPN
  expressvpn            ExpressVPN
  nordvpn               NordVPN
  surfshark             Surfshark
  protonvpn             ProtonVPN
  eonvpn                eonVPN

Examples:
  node run-vpn-test.js                           # Interactive mode
  node run-vpn-test.js --config demo             # Demo configuration
  node run-vpn-test.js --config basic --headless # Basic test in headless mode
  node run-vpn-test.js --vpn expressvpn --yes    # Use ExpressVPN, skip confirmation

Prerequisites:
  1. Node.js and npm installed
  2. Go server running on localhost:8080
  3. VPN client installed and configured
  4. Run 'npm install' to install dependencies

For more information, see VPN-Testing-README.md
        `);
    }
}

// Main execution
async function main() {
    const launcher = new VPNTestLauncher();
    await launcher.run();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = VPNTestLauncher;

