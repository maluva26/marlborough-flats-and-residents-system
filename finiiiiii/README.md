# Marlborough Flats & Apartments - Visitor Management System

A static website visitor management system for Marlborough Flats & Apartments.

## Features

- **Admin Dashboard**: Create and manage visitor requests
- **Security Gate Verification**: Verify visitor access at the gate
- **PIN-based Entry System**: 5-character alphanumeric PIN (NNLLN format)
- **14-day PIN Validity**: PINs expire after 14 days
- **Entry/Exit Logging**: Track visitor check-ins and check-outs
- **Reports Export**: Export visitor data to Documents folder

## Login Credentials

- **Admin**: admin123
- **Security Guard**: guard123

## How It Works

### Admin Workflow:
1. Admin logs in with password `admin123`
2. Resident requests a visit for their visitor
3. System generates a 5-character PIN (format: 2 numbers + 2 letters + 1 number)
4. Admin shares the PIN with the resident
5. Resident communicates the PIN to the visitor

### Gate Verification:
1. Guard opens the gate verification screen with password `guard123`
2. Visitor provides their PIN at the gate
3. System verifies the PIN and grants/denies access
4. Entry and exit times are recorded

## Deployment

### Netlify Deploy:
1. Push this folder to a GitHub repository
2. Log in to Netlify
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Build settings: No build command needed (Static)
6. Deploy directory: /
7. Your site is live!

### Local Testing:
Simply open `index.html` in your browser.

## Data Storage

All data is stored in the browser's localStorage. Each browser instance maintains its own data. For multi-device use, deploy to Netlify and use the same URL.

## Files

- `index.html` - Main HTML structure
- `styles.css` - Visual styling
- `app.js` - Application logic
- `_redirects` - Netlify configuration