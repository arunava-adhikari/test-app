#!/bin/bash

echo "🧪 Testing Shopify API with curl"
echo "================================"
echo

# Test the exact API endpoint
echo "📡 Testing GET customers API..."
echo "URL: https://sandbox-arun3.myshopify.com/admin/api/2025-07/customers.json?limit=250"
echo

curl -X GET \
  -H "X-Shopify-Access-Token: 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" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://sandbox-arun3.myshopify.com/admin/api/2025-07/customers.json?limit=250"

echo
echo
echo "✅ Curl test completed!"
echo "If you see JSON data above, the API is working correctly."
