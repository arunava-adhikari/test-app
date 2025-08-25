# Shopify Customer Fetcher & Country Code Extractor

A Go program that fetches customers from the Shopify Admin API and extracts country codes from their addresses.

## 🎯 What This Program Does

1. **Fetches Customers**: Calls the Shopify Customer API to retrieve all customers
2. **Stores in Structures**: Stores all customer data in Go struct arrays
3. **Prints Customer Info**: Displays detailed customer information
4. **Extracts Country Codes**: Processes addresses to extract ISO country codes
5. **Prints Country Data**: Shows country codes for each customer

## 🛍️ Shopify Configuration

The program is configured for:
- **Store**: `sandbox-arun3.myshopify.com`
- **API Version**: `2025-07`
- **Access Token**: `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`

## 🏗️ Data Structures

### Customer Structure
```go
type Customer struct {
    ID             int64     `json:"id"`
    Email          string    `json:"email"`
    FirstName      string    `json:"first_name"`
    LastName       string    `json:"last_name"`
    Phone          string    `json:"phone"`
    State          string    `json:"state"`
    Verified       bool      `json:"verified_email"`
    CreatedAt      time.Time `json:"created_at"`
    UpdatedAt      time.Time `json:"updated_at"`
    Tags           string    `json:"tags"`
    AcceptsMkt     bool      `json:"accepts_marketing"`
    DefaultAddress *Address  `json:"default_address"`
    Addresses      []Address `json:"addresses"`
}
```

### Address Structure
```go
type Address struct {
    ID           int64  `json:"id"`
    CustomerID   int64  `json:"customer_id"`
    FirstName    string `json:"first_name"`
    LastName     string `json:"last_name"`
    Company      string `json:"company"`
    Address1     string `json:"address1"`
    Address2     string `json:"address2"`
    City         string `json:"city"`
    Province     string `json:"province"`
    Country      string `json:"country"`
    CountryCode  string `json:"country_code"`
    CountryName  string `json:"country_name"`
    Zip          string `json:"zip"`
    Phone        string `json:"phone"`
    ProvinceCode string `json:"province_code"`
    Default      bool   `json:"default"`
}
```

### Country Code Structure
```go
type CustomerCountry struct {
    CustomerID     int64    `json:"customer_id"`
    CustomerName   string   `json:"customer_name"`
    CustomerEmail  string   `json:"customer_email"`
    CountryCodes   []string `json:"country_codes"`
    DefaultCountry string   `json:"default_country"`
    AddressCount   int      `json:"address_count"`
}
```

## 🚀 How to Run

### Prerequisites
- Go 1.21 or higher installed
- Access to the Shopify store (credentials already configured)

### Running the Program

**Option 1: Direct Go run**
```bash
go run shopify_customers.go
```

**Option 2: Using the script**
```bash
chmod +x run_example.sh
./run_example.sh
```

**Option 3: Build and run**
```bash
go build -o shopify-customers shopify_customers.go
./shopify-customers
```

## 📊 Expected Output

### Step 1: Customer Information
```
👤 Customer #1:
   ID: 123456
   Name: Steve Lastnameson
   Email: steve.lastnameson@example.com
   Phone: +15142546011
   State: enabled
   Verified: true
   Created: 2024-01-15 10:30:00
   Tags: 
   Accepts Marketing: false
   🏠 Default Address:
      ID: 789012
      Name: Mother Lastnameson
      Company: 
      Address: 123 Oak St 
      City: Ottawa, ON 123 ABC
      Country: CA (CA)
      Phone: 555-1212
      Default: true
   📍 All Addresses (1 total):
      Address #1:
         [Same as default address]
```

### Step 2: Country Code Extraction
```
🌍 Country Codes Extracted from 1 Customers:

👤 Customer #1: Steve Lastnameson (steve.lastnameson@example.com)
   ID: 123456
   Country Codes: [CA]
   Default Country: CA
   Address Count: 1

📊 Summary:
   Total Customers: 1
   Unique Countries: 1
   Countries Found: [CA]
```

## 🔍 API Endpoints Used

### 1. Fetch Customers
```
GET https://sandbox-arun3.myshopify.com/admin/api/2025-07/customers.json?limit=250
Headers:
  X-Shopify-Access-Token: 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
  Content-Type: application/json
```

### 2. Country Code Extraction
The program processes the address data from the customer response to extract:
- **Default country code** from `default_address.country_code`
- **All country codes** from `addresses[].country_code`
- **Unique countries** per customer (deduplication)
- **Summary statistics** across all customers

## 🛠️ Key Functions

- **`fetchAllCustomers()`**: Calls Shopify API and handles pagination
- **`printAllCustomers()`**: Displays detailed customer information
- **`extractCountryCodes()`**: Processes addresses to extract country codes
- **`printCountryCodes()`**: Shows country code analysis

## 🌍 Country Code Format

Country codes are returned in **ISO 3166-1 alpha-2** format:
- **CA** = Canada
- **US** = United States  
- **GB** = United Kingdom
- **DE** = Germany
- etc.

## 📝 Notes

- The program fetches the first 250 customers (Shopify's maximum per page)
- Country codes are normalized to uppercase
- Duplicate country codes per customer are removed
- The program includes comprehensive error handling
- All data is stored in structured Go arrays before processing

## 🔧 Customization

To modify for your own Shopify store:
1. Change the `SHOPIFY_SHOP` constant
2. Update the `SHOPIFY_ACCESS_TOKEN` with your token
3. Adjust `API_VERSION` if needed
4. Modify pagination logic if you need more than 250 customers
