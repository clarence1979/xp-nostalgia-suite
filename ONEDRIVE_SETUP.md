# Microsoft OneDrive Integration Setup

## Overview
The "My Documents" icon now connects to Microsoft OneDrive, allowing users to save and access files from their personal OneDrive account. All authentication credentials are stored locally in the browser's localStorage for security.

## Prerequisites

### 1. Azure App Registration
You need to create an Azure AD application to enable OneDrive authentication:

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations** > **New registration**
3. Configure the application:
   - **Name**: Your application name (e.g., "CLA Sol Desktop")
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**:
     - Platform: **Single-page application (SPA)**
     - URI: Your application URL (e.g., `http://localhost:5173` for development)
4. Click **Register**

### 2. Get Your Client ID
1. After registration, copy the **Application (client) ID**
2. Open `/src/lib/oneDriveAuth.ts`
3. Replace `'YOUR_AZURE_APP_CLIENT_ID'` with your actual client ID:
```typescript
const msalConfig = {
  auth: {
    clientId: 'YOUR_ACTUAL_CLIENT_ID_HERE',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  ...
};
```

### 3. Configure API Permissions
In your Azure app registration:
1. Go to **API permissions**
2. Click **Add a permission** > **Microsoft Graph** > **Delegated permissions**
3. Add these permissions:
   - `User.Read`
   - `Files.ReadWrite`
   - `Files.ReadWrite.All`
4. Click **Add permissions**
5. (Optional) Click **Grant admin consent** if you want to pre-approve for your organization

## Features

### Implemented Functionality
- ✅ Microsoft account sign-in via popup
- ✅ OneDrive file browser with folder navigation
- ✅ File upload (single and multiple files)
- ✅ File download
- ✅ Folder creation
- ✅ File/folder deletion
- ✅ Credentials stored in localStorage only
- ✅ Automatic token refresh
- ✅ Clean sign-out with credential removal

### Security Features
- All authentication is handled client-side using MSAL (Microsoft Authentication Library)
- Credentials are stored in browser's localStorage only - never sent to any server
- Each user logs into their own Microsoft account
- Access tokens are automatically refreshed when needed
- Tokens are cleared on sign-out

## How to Use

1. Click on the **My Documents** desktop icon
2. Click **Sign in with Microsoft**
3. Complete the Microsoft authentication in the popup window
4. Browse, upload, download, and manage your OneDrive files

## File Operations

### Upload Files
- Click the **Upload** button in the toolbar
- Select one or more files
- Files will be uploaded to the current folder

### Download Files
- Hover over any file
- Click the **Download** icon
- File will be saved to your browser's downloads folder

### Create Folders
- Click **New Folder** in the toolbar
- Enter a folder name
- Folder will be created in the current location

### Navigate Folders
- Click on any folder to open it
- Use the **Back arrow** to go up one level
- Current path is shown in the header

### Delete Items
- Hover over any file or folder
- Click the **Trash** icon
- Confirm the deletion

## Integration with Other Apps

The apps in your desktop environment can save files directly to OneDrive by:

1. Generating the file content (PDF, Word, etc.)
2. Using the OneDrive upload API through `window.postMessage`
3. Example code for apps to save to OneDrive:

```typescript
// In your app, trigger a save
const fileBlob = new Blob([fileContent], { type: 'application/pdf' });
window.parent.postMessage({
  type: 'SAVE_TO_ONEDRIVE',
  fileName: 'document.pdf',
  fileBlob: fileBlob
}, '*');
```

## Troubleshooting

### "Failed to initialize OneDrive authentication"
- Check that you've replaced the client ID in `oneDriveAuth.ts`
- Verify your Azure app registration is configured correctly

### "Failed to connect to OneDrive"
- Check browser console for specific error messages
- Ensure popup blocker is not preventing the sign-in window
- Verify API permissions are granted in Azure

### Files not loading
- Try clicking the **Refresh** button
- Sign out and sign back in
- Check browser console for API errors

## Development Notes

### Local Development
When testing locally:
1. Make sure your redirect URI in Azure includes your local development URL
2. Use `http://localhost:5173` or your actual dev server port
3. Update the `redirectUri` in `oneDriveAuth.ts` if needed

### Production Deployment
Before deploying:
1. Update the redirect URI in Azure to include your production domain
2. The code automatically uses `window.location.origin` as the redirect URI
3. Ensure HTTPS is enabled in production (required by Microsoft)

## Libraries Used

- **@azure/msal-browser**: Microsoft Authentication Library for browser-based authentication
- **@microsoft/microsoft-graph-client**: Microsoft Graph API client for OneDrive operations

## Privacy & Security

- No data is stored on any server - all authentication is client-side
- Each user's credentials remain private in their own browser
- Microsoft handles all authentication security
- Access tokens are short-lived and automatically refreshed
- Users can revoke access anytime through their Microsoft account settings
