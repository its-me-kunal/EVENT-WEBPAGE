// Configuration for Phoenix Reaper Esports website
// This file centralizes all configuration variables

console.log("Loading config.js...");

// Determine environment-based configuration
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
console.log("Environment detection - isDevelopment:", isDevelopment, "hostname:", window.location.hostname);

// API Base URL configuration
let API_BASE_URL;

// First, check if we're accessing via IP or localhost (development)
if (isDevelopment) {
    API_BASE_URL = 'http://localhost:3007';
    console.log("Development environment detected, using local API URL:", API_BASE_URL);
} 
// For production, use the current domain's origin
else {
    API_BASE_URL = window.location.origin;
    console.log("Production environment detected, using domain origin for API:", API_BASE_URL);
}

// Configuration object to export
const config = {
    API_BASE_URL,
    GOOGLE_CLIENT_ID: '429889031258-oua4vuc19jhtd5m4l75p2rm0p90n633t.apps.googleusercontent.com',
    IS_DEVELOPMENT: isDevelopment,
    VERSION: '1.0.1', // Increment this when you make changes to track versions
    TIMESTAMP: new Date().toISOString()
};

// Log the final configuration
console.log("Phoenix Reaper Esports config initialized:", config);

// Make configuration available globally
window.PRConfig = config;

// Add a little helper function for debugging
window.PRDebug = function(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [PRDebug] ${message}`);
    return true;
};

// Test the API URL with a simple connection check
if (typeof fetch !== 'undefined') {
    console.log(`Testing API connectivity to: ${config.API_BASE_URL}/api/config`);
    fetch(`${config.API_BASE_URL}/api/config`)
        .then(response => {
            console.log(`API connectivity test result: ${response.status} ${response.statusText}`);
            if (response.ok) {
                return response.json().then(data => {
                    console.log("API config data:", data);
                });
            }
        })
        .catch(error => {
            console.error("API connectivity test failed:", error.message);
        });
} 