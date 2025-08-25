#!/bin/bash

echo "🚀 Running Shopify Customer Fetcher"
echo "=================================="
echo

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go first."
    exit 1
fi

echo "✅ Go is installed"

# Run the program
echo "🏃 Running the Shopify customer fetcher..."
echo

go run shopify_customers.go

echo
echo "✅ Program completed!"
