# Phoenix Reaper Esports Website

A tournament management platform for esports events.

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. Access the site at `http://localhost:3007`

## Domain Configuration

The site is now configured to work on any domain. The following files have been updated:

- `config.js` - Centralized configuration
- All client-side API calls now use relative paths or the dynamic API_BASE_URL
- CORS settings in server.js are now configurable

## Deployment to a Custom Domain

1. Set up your server environment
2. Update the `.env` file with your custom domain settings:
   ```
   # For single domain
   CORS_ORIGIN=https://yourdomain.com
   
   # For multiple domains
   CORS_ORIGIN=https://yourdomain.com,https://admin.yourdomain.com
   ```

3. Update Google OAuth settings:
   - Go to [Google Developer Console](https://console.developers.google.com/)
   - Add your new domain to the authorized JavaScript origins
   - Update the GOOGLE_CLIENT_ID in your `.env` file if needed

4. Deploy the application to your server
5. The client-side code will automatically detect your domain

## Troubleshooting Login Issues

If you encounter problems logging in when deployed to your domain, try these steps:

1. **Use the Debug Page**:
   - Navigate to `https://yourdomain.com/debug`
   - Check if the API connection is working
   - Test the admin login directly from this page
   - Look for errors in the browser console (F12)

2. **Check CORS Settings**:
   - Ensure your domain is correctly listed in the `CORS_ORIGIN` environment variable
   - Check the server logs for any CORS rejection messages

3. **Emergency Direct Login**:
   - If API login is failing, use the "Emergency Direct Login" button on the login page
   - This bypasses the API and lets you access the admin dashboard

4. **Check Network Configuration**:
   - Make sure your server's firewall allows connections to the API port (3007)
   - If using a reverse proxy (like Nginx), ensure it's correctly forwarding requests

5. **Restart the Server**:
   - After making configuration changes, restart the server:
   ```
   npm start
   ```

## Environment Variables

- `PORT` - Server port (default: 3007)
- `MONGO_URI` - MongoDB connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `CORS_ORIGIN` - Allowed origins for CORS (comma-separated list, default: all origins)
- `API_BASE_URL` - Base URL for API calls (auto-detected in production)

## Security Notes

- Update the MongoDB connection string to use proper authentication
- Use environment variables for all sensitive data
- Consider implementing proper JWT-based authentication instead of the simple token system 