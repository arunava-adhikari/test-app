#!/bin/bash
# VPN Testing Setup Script for Linux/Mac

echo "🌍 VPN Geo-Blocking Testing Setup"
echo "================================="

# Check if Node.js is installed
echo -e "\n🔍 Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js is installed: $NODE_VERSION"
else
    echo "❌ Node.js is not installed!"
    echo "💡 Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Check if Go server is running
echo -e "\n🔍 Checking Go server status..."
if curl -s "http://localhost:8080/api/ip-info" > /dev/null; then
    echo "✅ Go server is running"
    IP_INFO=$(curl -s "http://localhost:8080/api/ip-info")
    echo "📍 Server is accessible"
else
    echo "❌ Go server is not running!"
    echo "💡 Please start the server with: go run shopify_customers.go"
    
    echo -n "Would you like to start the server now? (y/n): "
    read -r START_SERVER
    if [[ $START_SERVER == "y" || $START_SERVER == "Y" ]]; then
        echo "🚀 Starting Go server..."
        go run shopify_customers.go &
        echo "⏳ Waiting for server to start..."
        sleep 5
        
        if curl -s "http://localhost:8080/api/ip-info" > /dev/null; then
            echo "✅ Server started successfully!"
        else
            echo "❌ Server failed to start"
            exit 1
        fi
    else
        exit 1
    fi
fi

# Install Node.js dependencies
echo -e "\n📦 Installing Node.js dependencies..."
if [[ -f "package.json" ]]; then
    npm install
    if [[ $? -eq 0 ]]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "❌ package.json not found!"
    exit 1
fi

# Check for VPN clients
echo -e "\n🔍 Checking for VPN clients..."
VPN_CLIENTS=("expressvpn" "nordvpn" "surfshark" "protonvpn")
FOUND_VPN=""

for vpn in "${VPN_CLIENTS[@]}"; do
    if command -v "$vpn" &> /dev/null; then
        echo "✅ Found VPN client: $vpn"
        FOUND_VPN="$vpn"
        break
    fi
done

if [[ -z "$FOUND_VPN" ]]; then
    echo "⚠️  No VPN client found in PATH"
    echo "💡 Supported VPN clients: ExpressVPN, NordVPN, Surfshark, ProtonVPN"
    echo "💡 For simulation testing only, we'll use the virtual VPN tester"
fi

# Show testing options
echo -e "\n🧪 Testing Options Available:"
echo "1. Virtual VPN Simulation Testing (Works without real VPN)"
echo "2. Real VPN Connection Testing (Requires VPN client)"
echo "3. Frontend Interface Testing"
echo "4. Complete Test Suite"

echo -n "Select testing option (1-4): "
read -r CHOICE

case $CHOICE in
    1)
        echo -e "\n🌐 Running Virtual VPN Simulation Testing..."
        node test-vpn-automation.js
        ;;
    2)
        if [[ -n "$FOUND_VPN" ]]; then
            echo -e "\n🔌 Running Real VPN Connection Testing..."
            echo "⚠️  This will actually connect/disconnect your VPN!"
            echo -n "Continue? (y/n): "
            read -r CONFIRM
            if [[ $CONFIRM == "y" || $CONFIRM == "Y" ]]; then
                node real-vpn-tester.js
            fi
        else
            echo "❌ No VPN client found for real testing"
            echo "💡 Falling back to virtual simulation..."
            node test-vpn-automation.js
        fi
        ;;
    3)
        echo -e "\n🎨 Opening Frontend Interface..."
        HTML_PATH="file://$(pwd)/index.html"
        if command -v xdg-open &> /dev/null; then
            xdg-open "$HTML_PATH"
        elif command -v open &> /dev/null; then
            open "$HTML_PATH"
        else
            echo "📂 Please open this file in your browser: $HTML_PATH"
        fi
        echo "✅ Frontend opened in browser"
        ;;
    4)
        echo -e "\n🚀 Running Complete Test Suite..."
        node test-vpn-automation.js
        if [[ -n "$FOUND_VPN" ]]; then
            echo -e "\n🔌 Running Real VPN Tests..."
            echo -n "Continue with real VPN testing? (y/n): "
            read -r CONFIRM
            if [[ $CONFIRM == "y" || $CONFIRM == "Y" ]]; then
                node real-vpn-tester.js
            fi
        fi
        ;;
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo -e "\n🎉 Testing completed!"
echo "📊 Check the console output above for detailed results"
