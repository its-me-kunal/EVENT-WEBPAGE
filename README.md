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