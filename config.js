// Configuration for Phoenix Reaper Esports website
// This file centralizes all configuration variables

// Determine environment-based configuration
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// API Base URL configuration
const API_BASE_URL = isDevelopment 
    ? 'http://localhost:3007' 
    : window.location.origin; // Use actual domain in production

// Configuration object to export
const config = {
    API_BASE_URL,
    GOOGLE_CLIENT_ID: '429889031258-oua4vuc19jhtd5m4l75p2rm0p90n633t.apps.googleusercontent.com',
    IS_DEVELOPMENT: isDevelopment
};

// Make configuration available globally
window.PRConfig = config; 