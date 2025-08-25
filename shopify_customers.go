package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// Address represents a customer's address
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

// Customer represents a Shopify customer
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

// CustomersResponse represents the Shopify API response
type CustomersResponse struct {
	Customers []Customer `json:"customers"`
}

// CustomerCountry represents country information for a customer
type CustomerCountry struct {
	CustomerID     int64    `json:"customer_id"`
	CustomerName   string   `json:"customer_name"`
	CustomerEmail  string   `json:"customer_email"`
	CountryCodes   []string `json:"country_codes"`
	DefaultCountry string   `json:"default_country"`
	AddressCount   int      `json:"address_count"`
}

// API Request/Response structures
type CustomerRequest struct {
	ShopURL string `json:"shop_url"`
	APIKey  string `json:"api_key"`
}

type CustomerResponse struct {
	TotalCustomers    int               `json:"total_customers"`
	CustomerCountries []CustomerCountry `json:"customer_countries"`
	UniqueCountries   []string          `json:"unique_countries"`
}

type BusinessPresenceResponse struct {
	CountriesWithBusiness    []string `json:"countries_with_business"`
	CountriesWithoutBusiness []string `json:"countries_without_business"`
	TotalCountries           int      `json:"total_countries"`
}

type BlockingRequest struct {
	Countries []string `json:"countries"`
}

type BlockingResponse struct {
	Message          string   `json:"message"`
	BlockedCountries []string `json:"blocked_countries"`
	Success          bool     `json:"success"`
}

type ValidationRequest struct {
	BlockedCountries []string `json:"blocked_countries"`
	TestCountries    []string `json:"test_countries"`
}

type TestResult struct {
	Country      string `json:"country"`
	Blocked      bool   `json:"blocked"`
	Status       string `json:"status"`
	ResponseTime int    `json:"response_time"`
}

type ValidationResponse struct {
	TestResults []TestResult `json:"test_results"`
	Summary     struct {
		BlockedCount int `json:"blocked_count"`
		AllowedCount int `json:"allowed_count"`
		TotalTests   int `json:"total_tests"`
	} `json:"summary"`
}

// IPInfo represents IP geolocation data
type IPInfo struct {
	IP          string `json:"ip"`
	CountryCode string `json:"country_code"`
	CountryName string `json:"country_name"`
	City        string `json:"city"`
	Region      string `json:"region"`
	ISP         string `json:"isp"`
}

// getCountryFromIPAddress determines the country based on IP address using ipinfo.io only
func getCountryFromIPAddress(ip string) (string, error) {
	// For localhost/private IPs, get real public IP and country
	if isPrivateIP(ip) {
		fmt.Printf("🏠 Private IP detected (%s), getting real public IP...\n", ip)
		if realIP, realCountry, err := getRealPublicIPAndCountry(); err == nil && realIP != "" && realCountry != "" {
			fmt.Printf("🌍 Real public IP: %s -> %s\n", realIP, realCountry)
			return realCountry, nil
		}
		// Fallback for private IPs when external service fails
		fmt.Printf("⚠️  Could not get real public IP, cannot determine country for private IP\n")
		return "", fmt.Errorf("cannot determine country for private IP %s", ip)
	}

	// For public IPs, use ipinfo.io directly
	fmt.Printf("🌍 Getting country for public IP: %s\n", ip)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("https://ipinfo.io/%s/json", ip))
	if err != nil {
		return "", fmt.Errorf("failed to get country for IP %s: %v", ip, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 200 {
		var info PublicIPInfo
		if err := json.NewDecoder(resp.Body).Decode(&info); err == nil && info.Country != "" {
			fmt.Printf("🌍 ipinfo.io result: %s -> %s\n", ip, info.Country)
			return info.Country, nil
		}
	}

	return "", fmt.Errorf("could not determine country for IP %s from ipinfo.io", ip)
}

// isPrivateIP checks if an IP address is private/local
func isPrivateIP(ip string) bool {
	return strings.HasPrefix(ip, "192.168.") ||
		strings.HasPrefix(ip, "10.") ||
		strings.HasPrefix(ip, "172.16.") ||
		strings.HasPrefix(ip, "172.17.") ||
		strings.HasPrefix(ip, "172.18.") ||
		strings.HasPrefix(ip, "172.19.") ||
		strings.HasPrefix(ip, "172.2") ||
		strings.HasPrefix(ip, "172.30.") ||
		strings.HasPrefix(ip, "172.31.") ||
		strings.HasPrefix(ip, "127.") ||
		ip == "::1"
}

// getRealIP extracts the real IP address from request headers
func getRealIP(r *http.Request) string {
	// Check X-Forwarded-For header (load balancers/proxies)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		ip := strings.TrimSpace(ips[0])
		if ip != "" {
			fmt.Printf("🔍 IP from X-Forwarded-For: %s\n", ip)
			return ip
		}
	}

	// Check X-Real-IP header
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		fmt.Printf("🔍 IP from X-Real-IP: %s\n", xri)
		return xri
	}

	// Check CF-Connecting-IP (Cloudflare)
	if cfip := r.Header.Get("CF-Connecting-IP"); cfip != "" {
		fmt.Printf("🔍 IP from CF-Connecting-IP: %s\n", cfip)
		return cfip
	}

	// Fall back to RemoteAddr and extract IP from address:port format
	remoteAddr := r.RemoteAddr
	fmt.Printf("🔍 Raw RemoteAddr: %s\n", remoteAddr)

	// Handle IPv6 addresses [::1]:port format
	if strings.HasPrefix(remoteAddr, "[") {
		// IPv6 format like [::1]:12345
		if endBracket := strings.Index(remoteAddr, "]"); endBracket > 0 {
			ip := remoteAddr[1:endBracket]
			fmt.Printf("🔍 Extracted IPv6 IP: %s\n", ip)
			return ip
		}
	}

	// Handle IPv4 addresses ip:port format
	if colonIndex := strings.LastIndex(remoteAddr, ":"); colonIndex > 0 {
		ip := remoteAddr[:colonIndex]
		fmt.Printf("🔍 Extracted IPv4 IP: %s\n", ip)
		return ip
	}

	// If no port separator found, return as-is
	fmt.Printf("🔍 Using RemoteAddr as-is: %s\n", remoteAddr)
	return remoteAddr
}

// countryBlockingMiddleware checks if the request comes from a blocked country
func countryBlockingMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get client IP
		clientIP := getRealIP(r)

		// Determine country from IP - use enhanced detection for localhost
		var countryCode string
		var actualIP string

		if isPrivateIP(clientIP) {
			// Get real public IP and country for localhost requests
			if realIP, realCountry, err := getRealPublicIPAndCountry(); err == nil && realIP != "" {
				actualIP = realIP
				countryCode = realCountry
			} else {
				actualIP = clientIP
				countryCode, _ = getCountryFromIPAddress(clientIP)
			}
		} else {
			actualIP = clientIP
			countryCode, _ = getCountryFromIPAddress(clientIP)
		}

		if countryCode == "" {
			fmt.Printf("⚠️  Could not determine country for IP %s\n", actualIP)
			countryCode = "UNKNOWN"
		}

		fmt.Printf("📍 Request from IP: %s (actual: %s), Country: %s\n", clientIP, actualIP, countryCode)

		// Check if country is blocked
		isBlocked := contains(blockedCountriesList, countryCode)

		if isBlocked {
			fmt.Printf("🚫 BLOCKED: Request from %s (actual: %s, %s) - Country is blocked\n", clientIP, actualIP, countryCode)

			// Return 403 Forbidden with detailed message
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)

			blockResponse := map[string]interface{}{
				"error":        "Country Blocked",
				"message":      fmt.Sprintf("Access denied: Your country (%s) has been blocked", countryCode),
				"country_code": countryCode,
				"client_ip":    actualIP,
				"detected_via": clientIP,
				"blocked_at":   time.Now().Format(time.RFC3339),
				"reason":       "Geo-blocking policy in effect",
			}

			json.NewEncoder(w).Encode(blockResponse)
			return
		}

		fmt.Printf("✅ ALLOWED: Request from %s (%s) - Country not blocked\n", clientIP, countryCode)

		// Add country info to response headers for debugging
		w.Header().Set("X-Client-Country", countryCode)
		w.Header().Set("X-Client-IP", clientIP)

		// Proceed to next handler
		next(w, r)
	}
}

// handleTestAccess - Simple endpoint for testing country blocking
func handleTestAccess(w http.ResponseWriter, r *http.Request) {
	clientIP := getRealIP(r)
	countryCode, _ := getCountryFromIPAddress(clientIP)

	response := map[string]interface{}{
		"success":      true,
		"message":      "Access granted! You can access this API.",
		"client_ip":    clientIP,
		"country_code": countryCode,
		"timestamp":    time.Now().Format(time.RFC3339),
		"server_time":  time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleIPInfo - Returns IP and country information (not blocked)
func handleIPInfo(w http.ResponseWriter, r *http.Request) {
	clientIP := getRealIP(r)

	// If we're getting localhost, try to get the real public IP
	var publicIP string
	var countryCode string

	if isPrivateIP(clientIP) {
		// Get real public IP and country since we're on localhost
		if realIP, realCountry, err := getRealPublicIPAndCountry(); err == nil && realIP != "" {
			publicIP = realIP
			if realCountry != "" {
				countryCode = realCountry
			} else {
				countryCode, _ = getCountryFromIPAddress(realIP)
			}
			fmt.Printf("🌍 Using real public IP: %s -> %s\n", publicIP, countryCode)
		} else {
			// Fallback to detected IP
			publicIP = clientIP
			countryCode, _ = getCountryFromIPAddress(clientIP)
			fmt.Printf("⚠️  Could not get public IP, using detected: %s -> %s\n", publicIP, countryCode)
		}
	} else {
		// Public IP detected directly
		publicIP = clientIP
		countryCode, _ = getCountryFromIPAddress(clientIP)
		fmt.Printf("📍 Public IP detected: %s -> %s\n", publicIP, countryCode)
	}

	countryName := "Unknown"
	if name, exists := getCountryName(countryCode); exists {
		countryName = name
	}

	ipInfo := IPInfo{
		IP:          publicIP,
		CountryCode: countryCode,
		CountryName: countryName,
		City:        "Demo City",
		Region:      "Demo Region",
		ISP:         "Demo ISP",
	}

	fmt.Printf("📊 IP Info response: %s -> %s (%s)\n", publicIP, countryCode, countryName)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ipInfo)
}

// PublicIPInfo represents the response from ipinfo.io
type PublicIPInfo struct {
	IP       string `json:"ip"`
	City     string `json:"city"`
	Region   string `json:"region"`
	Country  string `json:"country"`
	Loc      string `json:"loc"`
	Org      string `json:"org"`
	Timezone string `json:"timezone"`
}

// getRealPublicIPAndCountry gets both IP and country from ipinfo.io
func getRealPublicIPAndCountry() (string, string, error) {
	client := &http.Client{Timeout: 5 * time.Second}

	// First try ipinfo.io for complete information
	resp, err := client.Get("https://ipinfo.io/json")
	if err != nil {
		fmt.Printf("⚠️  ipinfo.io failed: %v\n", err)
	} else {
		defer resp.Body.Close()
		if resp.StatusCode == 200 {
			var info PublicIPInfo
			if err := json.NewDecoder(resp.Body).Decode(&info); err == nil {
				if info.IP != "" && info.Country != "" && !isPrivateIP(info.IP) {
					fmt.Printf("🌐 Got IP and country from ipinfo.io: %s -> %s\n", info.IP, info.Country)
					return info.IP, info.Country, nil
				}
			}
		}
	}

	// Fallback to just getting IP
	return getRealPublicIP()
}

// getRealPublicIP tries to get the real public IP from external services
func getRealPublicIP() (string, string, error) {
	// Try multiple services for reliability
	services := []string{
		"https://api.ipify.org?format=text",
		"https://checkip.amazonaws.com",
		"https://icanhazip.com",
	}

	client := &http.Client{Timeout: 3 * time.Second}

	for _, service := range services {
		resp, err := client.Get(service)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			body, err := io.ReadAll(resp.Body)
			if err == nil {
				ip := strings.TrimSpace(string(body))
				if ip != "" && !isPrivateIP(ip) {
					fmt.Printf("🌐 Got public IP from %s: %s\n", service, ip)
					// Get country using ipinfo.io
					if country, err := getCountryFromIPAddress(ip); err == nil && country != "" {
						return ip, country, nil
					}
					return ip, "", nil
				}
			}
		}
	}

	return "", "", fmt.Errorf("could not get public IP from any service")
}

// VPN Simulation Request structure
type VPNSimulationRequest struct {
	CountryCode string `json:"country_code"`
}

// VPN Simulation Response structure
type VPNSimulationResponse struct {
	Success     bool   `json:"success"`
	Message     string `json:"message"`
	CountryCode string `json:"country_code"`
	CountryName string `json:"country_name"`
	SimulatedIP string `json:"simulated_ip"`
	IsBlocked   bool   `json:"is_blocked"`
	Timestamp   string `json:"timestamp"`
	Error       string `json:"error,omitempty"`
}

// handleSimulateVPN - Simulate VPN access from a specific country
func handleSimulateVPN(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req VPNSimulationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response := VPNSimulationResponse{
			Success: false,
			Error:   "Invalid JSON request",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Validate country code
	if req.CountryCode == "" {
		response := VPNSimulationResponse{
			Success: false,
			Error:   "Country code is required",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Get country name
	countryName := "Unknown Country"
	if name, exists := getCountryName(req.CountryCode); exists {
		countryName = name
	}

	// Generate a simulated IP for the country
	simulatedIP := generateSimulatedIP(req.CountryCode)

	// Check if this country is blocked
	isBlocked := contains(blockedCountriesList, req.CountryCode)

	fmt.Printf("🌐 VPN Simulation: %s (%s) from IP %s - Blocked: %v\n",
		countryName, req.CountryCode, simulatedIP, isBlocked)

	if isBlocked {
		// Return blocked response
		response := VPNSimulationResponse{
			Success:     false,
			Message:     fmt.Sprintf("Access denied: %s (%s) is blocked", countryName, req.CountryCode),
			CountryCode: req.CountryCode,
			CountryName: countryName,
			SimulatedIP: simulatedIP,
			IsBlocked:   true,
			Timestamp:   time.Now().Format(time.RFC3339),
			Error:       "Country is geo-blocked",
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Return success response
	response := VPNSimulationResponse{
		Success:     true,
		Message:     fmt.Sprintf("Access granted from %s (%s)", countryName, req.CountryCode),
		CountryCode: req.CountryCode,
		CountryName: countryName,
		SimulatedIP: simulatedIP,
		IsBlocked:   false,
		Timestamp:   time.Now().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// generateSimulatedIP - Generate a realistic IP address for a country
func generateSimulatedIP(countryCode string) string {
	// Simulated IP ranges for different countries
	ipRanges := map[string]string{
		"US": "192.168.1.100",   // USA
		"DE": "185.199.108.153", // Germany
		"RU": "46.4.96.137",     // Russia
		"CN": "103.21.244.8",    // China
		"FR": "46.19.37.108",    // France
		"GB": "151.101.193.140", // United Kingdom
		"AU": "203.0.113.195",   // Australia
		"CA": "198.51.100.42",   // Canada
		"JP": "210.251.121.3",   // Japan
		"BR": "191.232.38.25",   // Brazil
		"IN": "103.21.244.15",   // India
		"NL": "185.40.4.193",    // Netherlands
		"IT": "151.101.1.140",   // Italy
		"ES": "185.199.110.153", // Spain
		"SE": "185.40.4.194",    // Sweden
	}

	if ip, exists := ipRanges[countryCode]; exists {
		return ip
	}

	// Default fallback IP
	return "198.51.100.1"
}

// Helper function to get country name
func getCountryName(countryCode string) (string, bool) {
	countryNames := map[string]string{
		"US": "United States", "CA": "Canada", "GB": "United Kingdom",
		"DE": "Germany", "FR": "France", "AU": "Australia", "JP": "Japan",
		"RU": "Russia", "CN": "China", "NL": "Netherlands", "BR": "Brazil",
		"IN": "India", "ES": "Spain", "IT": "Italy", "SE": "Sweden",
		// Add more as needed...
	}
	name, exists := countryNames[countryCode]
	return name, exists
}

// Global variables for demo
var (
	currentShopifyConfig struct {
		ShopURL string
		APIKey  string
	}
	blockedCountriesList []string
)

func main() {
	// Protected endpoints with country blocking
	http.HandleFunc("/api/customers", enableCORS(handleCustomers))
	http.HandleFunc("/api/analyze-business-presence", enableCORS(handleAnalyzeBusinessPresence))

	// Management endpoints (not blocked)
	http.HandleFunc("/api/block-countries", enableCORS(handleBlockCountries))
	http.HandleFunc("/api/validate-blocking", enableCORS(handleValidateBlocking))

	// Add new endpoint for testing blocking
	http.HandleFunc("/api/test-access", enableCORS(countryBlockingMiddleware(handleTestAccess)))
	http.HandleFunc("/api/ip-info", enableCORS(handleIPInfo))
	http.HandleFunc("/api/simulate-vpn", enableCORS(handleSimulateVPN))

	fmt.Println("🚀 Geo-Blocking API Server starting on port 8080...")
	fmt.Println("📡 Endpoints available:")
	fmt.Println("   POST /api/customers")
	fmt.Println("   GET  /api/analyze-business-presence")
	fmt.Println("   POST /api/block-countries")
	fmt.Println("   POST /api/validate-blocking")
	fmt.Println("   GET  /api/test-access (geo-blocked)")
	fmt.Println("   GET  /api/ip-info")
	fmt.Println("   POST /api/simulate-vpn")
	fmt.Println("\n🌐 Frontend should connect to: http://localhost:8080")

	log.Fatal(http.ListenAndServe(":8080", nil))
}

// CORS middleware
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

// Step 1: Handle customer data retrieval
func handleCustomers(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CustomerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Store config for later use
	currentShopifyConfig.ShopURL = req.ShopURL
	currentShopifyConfig.APIKey = req.APIKey

	fmt.Printf("📡 Fetching customers from: %s\n", req.ShopURL)

	// Fetch customers using your existing logic
	customers, err := fetchAllCustomersFromShopify(req.APIKey)
	if err != nil {
		fmt.Printf("❌ Error fetching customers: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to fetch customers: %v", err), http.StatusInternalServerError)
		return
	}

	// Extract country codes
	customerCountries := extractCountryCodes(customers)
	uniqueCountries := extractUniqueCountries(customerCountries)

	response := CustomerResponse{
		TotalCustomers:    len(customers),
		CustomerCountries: customerCountries,
		UniqueCountries:   uniqueCountries,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	fmt.Printf("✅ Successfully returned %d customers\n", len(customers))
}

// Step 2: Handle business presence analysis
func handleAnalyzeBusinessPresence(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fmt.Println("🔍 Analyzing business presence...")

	// Get countries with business (this would normally fetch from customer data)
	countriesWithBusiness := []string{"US", "CA", "GB", "DE", "FR", "AU", "JP", "NL", "SE", "BR", "IN"}
	countriesWithoutBusiness := countriesWithoutBusinessPresence(countriesWithBusiness)

	response := BusinessPresenceResponse{
		CountriesWithBusiness:    countriesWithBusiness,
		CountriesWithoutBusiness: countriesWithoutBusiness,
		TotalCountries:           len(getAllCountryCodes()),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	fmt.Printf("✅ Found %d countries without business presence\n", len(countriesWithoutBusiness))
	fmt.Println(countriesWithoutBusiness)
}

// Step 3: Handle country blocking
func handleBlockCountries(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req BlockingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("🚫 Blocking countries: %v\n", req.Countries)

	// Store blocked countries (in real implementation, this would call geo-blocking service)
	blockedCountriesList = req.Countries

	// Simulate API call delay
	time.Sleep(1 * time.Second)

	response := BlockingResponse{
		Message:          fmt.Sprintf("Successfully blocked %d countries", len(req.Countries)),
		BlockedCountries: req.Countries,
		Success:          true,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	fmt.Printf("✅ Successfully blocked %d countries\n", len(req.Countries))
}

// Step 4: Handle blocking validation
func handleValidateBlocking(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ValidationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	fmt.Printf("🧪 Validating blocking for countries: %v\n", req.TestCountries)

	var testResults []TestResult
	blockedCount := 0
	allowedCount := 0

	for _, country := range req.TestCountries {
		isBlocked := contains(req.BlockedCountries, country)

		result := TestResult{
			Country:      country,
			Blocked:      isBlocked,
			Status:       getStatusMessage(isBlocked),
			ResponseTime: 50 + (len(country) * 10), // Simulate varying response times
		}

		if isBlocked {
			blockedCount++
		} else {
			allowedCount++
		}

		testResults = append(testResults, result)

		// Simulate progressive testing
		time.Sleep(200 * time.Millisecond)
	}

	response := ValidationResponse{
		TestResults: testResults,
	}
	response.Summary.BlockedCount = blockedCount
	response.Summary.AllowedCount = allowedCount
	response.Summary.TotalTests = len(req.TestCountries)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
	fmt.Printf("✅ Validation complete: %d blocked, %d allowed\n", blockedCount, allowedCount)
}

// Modified fetchAllCustomers to use dynamic API key
func fetchAllCustomersFromShopify(apiKey string) ([]Customer, error) {
	const (
		SHOPIFY_SHOP = "sandbox-arun3"
		API_VERSION  = "2025-07"
		apiKey1      = "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"
	)

	baseURL := fmt.Sprintf("https://%s.myshopify.com/admin/api/%s", SHOPIFY_SHOP, API_VERSION)

	var allCustomers []Customer
	url := fmt.Sprintf("%s/customers.json?limit=250", baseURL)

	client := &http.Client{Timeout: 30 * time.Second}

	for url != "" {
		fmt.Printf("📡 Calling Shopify API: %s\n", url)
		fmt.Printf("📡 Shopify API Token: %s\n", apiKey1)

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return nil, fmt.Errorf("failed to create request: %w", err)
		}

		// Set required headers with dynamic API key
		req.Header.Set("X-Shopify-Access-Token", apiKey1)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")

		// Make the request
		resp, err := client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("failed to make request: %w", err)
		}
		defer resp.Body.Close()

		// Check status code
		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
		}

		// Read and parse response
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("failed to read response: %w", err)
		}

		var response CustomersResponse
		if err := json.Unmarshal(body, &response); err != nil {
			return nil, fmt.Errorf("failed to parse JSON: %w", err)
		}

		// Add customers to our collection
		allCustomers = append(allCustomers, response.Customers...)
		fmt.Printf("📥 Retrieved %d customers (total: %d)\n", len(response.Customers), len(allCustomers))

		// For demo purposes, just get first page
		url = ""
	}

	return allCustomers, nil
}

// extractCountryCodes extracts country codes from all customer addresses
func extractCountryCodes(customers []Customer) []CustomerCountry {
	var customerCountries []CustomerCountry

	for _, customer := range customers {
		// Track unique country codes for this customer
		countryCodesMap := make(map[string]bool)
		var defaultCountry string

		// Extract from default address
		if customer.DefaultAddress != nil && customer.DefaultAddress.CountryCode != "" {
			countryCode := strings.ToUpper(customer.DefaultAddress.CountryCode)
			defaultCountry = countryCode
			countryCodesMap[countryCode] = true
		}

		// Extract from all addresses
		for _, addr := range customer.Addresses {
			if addr.CountryCode != "" {
				countryCode := strings.ToUpper(addr.CountryCode)
				countryCodesMap[countryCode] = true
			}
		}

		// Convert map to slice
		var countryCodes []string
		for code := range countryCodesMap {
			countryCodes = append(countryCodes, code)
		}

		// Sort country codes alphabetically
		sortStringSlice(countryCodes)

		// Create customer country record
		customerCountry := CustomerCountry{
			CustomerID:     customer.ID,
			CustomerName:   fmt.Sprintf("%s %s", customer.FirstName, customer.LastName),
			CustomerEmail:  customer.Email,
			CountryCodes:   countryCodes,
			DefaultCountry: defaultCountry,
			AddressCount:   len(customer.Addresses),
		}

		customerCountries = append(customerCountries, customerCountry)
	}

	return customerCountries
}

// extractUniqueCountries gets all unique countries from customer data
func extractUniqueCountries(customerCountries []CustomerCountry) []string {
	countryMap := make(map[string]bool)

	for _, cc := range customerCountries {
		for _, code := range cc.CountryCodes {
			countryMap[code] = true
		}
	}

	var countries []string
	for country := range countryMap {
		countries = append(countries, country)
	}

	sortStringSlice(countries)
	return countries
}

// countriesWithoutBusinessPresence returns countries without business presence
func countriesWithoutBusinessPresence(countriesWithBusiness []string) []string {
	allCountries := getAllCountryCodes()

	lookup := make(map[string]struct{}, len(countriesWithBusiness))
	for _, v := range countriesWithBusiness {
		lookup[v] = struct{}{}
	}

	var countriesWithoutBusiness []string
	for _, v := range allCountries {
		if _, found := lookup[v]; !found {
			countriesWithoutBusiness = append(countriesWithoutBusiness, v)
		}
	}
	return countriesWithoutBusiness
}

// getAllCountryCodes returns all ISO country codes
func getAllCountryCodes() []string {
	return []string{
		"AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG",
		"AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB",
		"BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW",
		"BV", "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA",
		"CV", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM",
		"CG", "CD", "CK", "CR", "CI", "HR", "CU", "CW", "CY", "CZ",
		"DK", "DJ", "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE",
		"SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF",
		"GA", "GM", "GE", "DE", "GH", "GI", "GR", "GL", "GD", "GP",
		"GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN",
		"HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL",
		"IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR",
		"KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT",
		"LU", "MO", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ",
		"MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS",
		"MA", "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI",
		"NE", "NG", "NU", "NF", "MK", "MP", "NO", "OM", "PK", "PW",
		"PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR",
		"QA", "RE", "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF",
		"PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL",
		"SG", "SX", "SK", "SI", "SB", "SO", "ZA", "GS", "SS", "ES",
		"LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ",
		"TH", "TL", "TG", "TK", "TO", "TT", "TN", "TR", "TM", "TC",
		"TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU",
		"VE", "VN", "VG", "VI", "WF", "EH", "YE", "ZM", "ZW",
	}
}

// Helper functions
func sortStringSlice(slice []string) {
	n := len(slice)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if slice[j] > slice[j+1] {
				slice[j], slice[j+1] = slice[j+1], slice[j]
			}
		}
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func getStatusMessage(isBlocked bool) string {
	if isBlocked {
		return "Access denied (geo-blocked)"
	}
	return "Access granted"
}
