# cPanel Deployment Guide

This guide will help you deploy your Daily Task Logger app to a cPanel hosting account.

## Prerequisites

- cPanel hosting account with FTP/File Manager access
- Your domain name configured in cPanel
- All project files ready for upload

## Step-by-Step Deployment

### Method 1: Using cPanel File Manager (Recommended)

1. **Log into cPanel**
   - Access your cPanel dashboard
   - Navigate to **File Manager**

2. **Navigate to Public HTML Directory**
   - Go to `public_html` folder (or `www` depending on your hosting)
   - If deploying to a subdomain, use `public_html/subdomain-name`
   - If deploying to root domain, use `public_html`

3. **Upload Files**
   - Create a new folder (e.g., `task-logger`) or upload directly to root
   - Upload all project files:
     - `index.html`
     - `script.js`
     - `style.css`
     - `tabs.js`
     - `analytics-enhanced.js`
     - `app-state-integration.js`
     - `firebase-sync.js`
     - `sw.js` (Service Worker)
     - `manifest.json`
     - `icons/` folder (with all icon files)
   - **Important**: Maintain the folder structure, especially the `icons/` folder

4. **Set Permissions**
   - Ensure files have `644` permissions
   - Folders should have `755` permissions
   - Service worker (`sw.js`) must be accessible (644 is fine)

5. **Verify HTTPS**
   - Ensure your domain has SSL certificate enabled
   - Service workers require HTTPS (or localhost for development)
   - Check SSL status in cPanel → SSL/TLS Status

### Method 2: Using FTP Client

1. **Connect via FTP**
   - Use an FTP client (FileZilla, WinSCP, etc.)
   - Connect using your cPanel FTP credentials
   - Navigate to `public_html` directory

2. **Upload Files**
   - Upload all files maintaining the same structure
   - Ensure `icons/` folder and all its contents are uploaded

3. **Verify Upload**
   - Check that all files are in place
   - Verify file permissions

## Post-Deployment Configuration

### 1. Firebase Configuration

**Update Authorized Domains:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Navigate to **Authentication** → **Settings** → **Authorized domains**
- Add your domain: `yourdomain.com` and `www.yourdomain.com`
- If using a subdomain: `subdomain.yourdomain.com`

**Update Firestore Security Rules:**
- Go to Firebase Console → **Firestore Database** → **Rules**
- Ensure rules are configured (see [SECURITY.md](./SECURITY.md))

### 2. Verify Service Worker

1. Visit your deployed site: `https://yourdomain.com/task-logger/` (or root if deployed there)
2. Open browser Developer Tools (F12)
3. Go to **Application** tab → **Service Workers**
4. Verify the service worker is registered
5. Check **Console** for any errors

### 3. Test PWA Features

- Test offline functionality
- Try installing as PWA (should see "Install App" prompt)
- Verify icons display correctly
- Test Firebase authentication

## File Structure in cPanel

Your deployed structure should look like this:

```
public_html/
  ├── index.html
  ├── script.js
  ├── style.css
  ├── tabs.js
  ├── analytics-enhanced.js
  ├── app-state-integration.js
  ├── firebase-sync.js
  ├── sw.js
  ├── manifest.json
  └── icons/
      ├── icon-16x16.png
      ├── icon-32x32.png
      ├── icon-72x72.png
      ├── icon-96x96.png
      ├── icon-128x128.png
      ├── icon-144x144.png
      ├── icon-152x152.png
      ├── icon-167x167.png
      ├── icon-180x180.png
      ├── icon-192x192.png
      ├── icon-384x384.png
      ├── icon-512x512.png
      └── icon.svg
```

## Troubleshooting

### Service Worker Not Registering

**Issue**: Service worker fails to register

**Solutions**:
- Ensure you're accessing the site via HTTPS (required for service workers)
- Check that `sw.js` file is accessible: `https://yourdomain.com/sw.js`
- Verify file permissions (644 for files, 755 for folders)
- Clear browser cache and try again
- Check browser console for specific error messages

### Firebase Authentication Fails

**Issue**: Google Sign-In doesn't work

**Solutions**:
- Verify your domain is added to Firebase authorized domains
- Check Firebase configuration in `index.html` matches your Firebase project
- Ensure Google Sign-In is enabled in Firebase Console
- Check browser console for authentication errors

### Files Not Loading

**Issue**: CSS, JS, or other assets not loading

**Solutions**:
- Verify all files are uploaded correctly
- Check file paths in browser Network tab
- Ensure relative paths are correct (no leading slashes for same-directory files)
- Verify file permissions

### 404 Errors

**Issue**: Getting 404 errors for files

**Solutions**:
- Double-check file names (case-sensitive on Linux servers)
- Verify files are in the correct directory
- Check `.htaccess` file if present (shouldn't block your files)
- Ensure `index.html` is set as default document

### PWA Not Installing

**Issue**: "Install App" option not appearing

**Solutions**:
- Ensure HTTPS is enabled
- Verify `manifest.json` is accessible
- Check that all required icons are present
- Service worker must be registered successfully
- Try accessing from a mobile device

## Additional cPanel Settings

### Enable GZIP Compression (Optional but Recommended)

1. Go to cPanel → **Optimize Website**
2. Enable compression for better performance

### Set Default Document

1. Go to cPanel → **Indexes**
2. Ensure `index.html` is listed as a default document

### Custom Error Pages (Optional)

If you want custom 404 pages, you can create them in cPanel → **Error Pages**

## Security Considerations

1. **SSL Certificate**: Always use HTTPS (required for service workers and PWA)
2. **Firebase Rules**: Ensure Firestore security rules are properly configured
3. **File Permissions**: Don't set files to 777 (too permissive)
4. **Hidden Files**: Consider adding `.htaccess` to prevent directory listing if needed

## Updating Your Deployment

When you need to update your app:

1. Upload new files via File Manager or FTP
2. Replace existing files
3. Clear browser cache or do a hard refresh (Ctrl+F5)
4. Service worker will auto-update, but users may need to refresh

## Support

If you encounter issues:
- Check browser console for errors
- Review Firebase Console logs
- Verify file permissions and paths
- Test in incognito/private browsing mode
- Check cPanel error logs

## Notes

- The service worker automatically detects the base path, so it works whether deployed to root or subdirectory
- All paths in the app use relative paths for compatibility
- Firebase configuration in `index.html` needs to match your Firebase project
- The app works offline once the service worker is registered

