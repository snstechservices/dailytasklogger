# GitHub Pages Deployment Guide

## Quick Start

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages (REQUIRED - Must be done manually)**
   - ⚠️ **IMPORTANT**: You MUST enable GitHub Pages manually before the workflow can deploy
   - Go to your repository Settings
   - Navigate to **Pages** section
   - Under "Build and deployment" → "Source", select **GitHub Actions**
   - Click **Save** to apply the changes
   - The workflow will automatically deploy on the next push

3. **Configure Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add your GitHub Pages domain: `*.github.io`
   - Go to **Firestore Database** → **Rules**
   - Update rules (see below)

## Firebase Configuration

### ⚠️ IMPORTANT: Security Setup

**Firebase API keys are safe to expose** in client-side code (they're public identifiers). However, you MUST configure security rules to protect your data.

### 1. Firestore Security Rules (CRITICAL - DO THIS FIRST!)

**Go to Firebase Console → Firestore Database → Rules**

Update your Firestore rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User states collection - users can only access their own data
    match /userStates/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Why this is critical:**
- Without these rules, anyone could access your database
- These rules ensure only authenticated users can access their own data
- **Never deploy without proper security rules!**

### 2. Authorized Domains

Add your GitHub Pages domain to Firebase:
- Go to Firebase Console → Authentication → Settings
- Under "Authorized domains", click "Add domain"
- Add: `yourusername.github.io` (or your custom domain)

### 3. API Key Restrictions (Optional but Recommended)

Restrict your API key to your GitHub Pages domain:

**Option A: Via Firebase Console**
- Go to Firebase Console → Project Settings → General
- Find your web app configuration
- Add domain restrictions if available

**Option B: Via Google Cloud Console**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Select your Firebase project
- Navigate to **APIs & Services → Credentials**
- Find your API key and click **Edit**
- Under **Application restrictions**, select **HTTP referrers**
- Add: `https://*.github.io/*` and `https://yourusername.github.io/*`

See [SECURITY.md](./SECURITY.md) for detailed security information.

### 3. Firebase Config

The Firebase configuration is already in `index.html`. Make sure it matches your Firebase project:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ... other config
};
```

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] GitHub Pages enabled (GitHub Actions)
- [ ] Firebase authorized domains configured
- [ ] Firestore security rules updated
- [ ] Test authentication flow
- [ ] Test data sync across devices

## Testing After Deployment

1. **Test Authentication**
   - Visit your GitHub Pages URL
   - Click "Sign in to Sync"
   - Complete Google authentication
   - Verify user info displays

2. **Test Data Sync**
   - Add some work sessions
   - Wait a few seconds for auto-sync
   - Open the app on another device/browser
   - Sign in with the same Google account
   - Verify data appears

3. **Test PWA Features**
   - Check if "Install App" prompt appears
   - Install the app
   - Test offline functionality

## Troubleshooting

### GitHub Pages Deployment Fails with "Resource not accessible by integration"
**Error**: `Get Pages site failed` or `Create Pages site failed. Error: Resource not accessible by integration`

**Solution**: 
1. GitHub Pages must be enabled manually before the workflow can deploy
2. Go to your repository → **Settings** → **Pages**
3. Under "Build and deployment" → "Source", select **GitHub Actions**
4. Click **Save**
5. Push a new commit or re-run the workflow

**Why this happens**: The workflow doesn't have admin permissions to automatically enable Pages. You must enable it manually in repository settings first.

### Service Worker Not Registering
- Check browser console for errors
- Ensure HTTPS is enabled (GitHub Pages uses HTTPS)
- Clear browser cache and reload

### Firebase Authentication Fails
- Verify authorized domains include `*.github.io`
- Check Firebase API key is correct
- Ensure Google Sign-In is enabled in Firebase Console

### Data Not Syncing
- Check browser console for errors
- Verify Firestore rules allow read/write
- Check network tab for failed requests
- Ensure user is authenticated

### Path Issues
- If deployed to a subdirectory (e.g., `/repo-name/`), paths are auto-detected
- Service worker handles both root and subdirectory deployments
- Manifest uses relative paths for compatibility

## Custom Domain (Optional)

If you want to use a custom domain:

1. Add your domain to Firebase authorized domains
2. Update DNS records as per GitHub Pages instructions
3. The app will automatically work with your custom domain

## Support

For issues or questions:
- Check browser console for errors
- Review Firebase Console logs
- Check GitHub Actions workflow logs

