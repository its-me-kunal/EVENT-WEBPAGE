/**
 * Configuration for Phoenix Reaper Esports Website
 */

const config = {
    // Domain information
    domain: {
        url: "https://www.phoenixreaperesports.com",
        name: "Phoenix Reaper Esports"
    },
    
    // Server configuration
    server: {
        port: process.env.PORT || 3000,
        mongoUri: process.env.MONGO_URI,
        googleClientId: process.env.GOOGLE_CLIENT_ID
    },
    
    // Admin credentials (should be moved to environment variables in production)
    admin: {
        defaultUsername: "admin",
        defaultPassword: "1234"
    }
};

module.exports = config; 