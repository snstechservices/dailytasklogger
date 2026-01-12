# Security Guide for Firebase on GitHub Pages

## 🔐 Is It Safe to Expose Firebase Keys?

**Yes, Firebase API keys are safe to expose in client-side code.** This is by design.

### Why Firebase Keys Are Safe to Expose:

1. **API Keys ≠ Secret Keys**: Firebase API keys are **public identifiers**, not secret credentials
2. **Domain Restrictions**: You can restrict which domains can use your API key
3. **Security Rules**: Firestore security rules control actual data access
4. **Authentication Required**: Users must authenticate (Google Sign-In) to access data

## 🛡️ Security Measures You MUST Implement

### 1. Firestore Security Rules (CRITICAL)

Your Firestore database MUST have proper security rules. Without these, anyone could access your data.

**Go to Firebase Console → Firestore Database → Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only allow authenticated users to access their own data
    match /userStates/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**This ensures:**
- ✅ Only authenticated users can access data
- ✅ Users can ONLY access their own data (matching userId)
- ✅ Unauthenticated users cannot read/write anything

### 2. API Key Restrictions (RECOMMENDED)

Restrict your API key to specific domains to prevent unauthorized usage.

**Go to Firebase Console → Project Settings → General → Your Web App**

1. Click on your web app
2. Under "API restrictions", add:
   - `*.github.io` (for GitHub Pages)
   - Your specific domain: `yourusername.github.io`
   - Any custom domains you use

**Or use Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services → Credentials**
4. Find your API key
5. Click **Edit**
6. Under **Application restrictions**, select **HTTP referrers**
7. Add your domains:
   ```
   https://*.github.io/*
   https://yourusername.github.io/*
   ```

### 3. Authorized Domains (REQUIRED)

Add your GitHub Pages domain to Firebase authorized domains.

**Go to Firebase Console → Authentication → Settings → Authorized domains**

Add:
- `yourusername.github.io`
- `*.github.io` (if supported)

### 4. Authentication Requirements

Your app already requires Google Sign-In, which is good. Make sure:
- ✅ Users must authenticate before accessing data
- ✅ Data is tied to user ID (`request.auth.uid`)
- ✅ No public read/write access without authentication

## 🔍 What's Actually Protected?

### ✅ Safe to Expose (Public):
- `apiKey` - Public identifier
- `authDomain` - Public domain
- `projectId` - Public project identifier
- `storageBucket` - Public storage URL
- `messagingSenderId` - Public identifier
- `appId` - Public app identifier

### 🔒 Protected by Security Rules:
- **User Data** - Protected by Firestore rules
- **Authentication** - Requires Google Sign-In
- **Database Access** - Controlled by security rules

## ⚠️ Common Security Mistakes

### ❌ DON'T:
- Leave Firestore rules open: `allow read, write: if true;`
- Allow unauthenticated access
- Use admin SDK keys in client code
- Store sensitive data without encryption

### ✅ DO:
- Always require authentication: `request.auth != null`
- Match user ID: `request.auth.uid == userId`
- Use proper security rules
- Restrict API keys to your domains
- Regularly review your security rules

## 🧪 Testing Your Security

### Test 1: Unauthenticated Access
```javascript
// In browser console (not signed in)
// Should fail - no access without auth
```

### Test 2: Wrong User Access
```javascript
// Sign in as User A
// Try to access User B's data
// Should fail - can only access own data
```

### Test 3: Direct API Access
```javascript
// Try to access Firestore directly via API
// Should fail - requires authentication
```

## 📋 Security Checklist

Before deploying to GitHub Pages:

- [ ] Firestore security rules configured
- [ ] Rules require authentication (`request.auth != null`)
- [ ] Rules match user ID (`request.auth.uid == userId`)
- [ ] API key restrictions added (if desired)
- [ ] Authorized domains configured
- [ ] Tested unauthenticated access (should fail)
- [ ] Tested cross-user access (should fail)
- [ ] Reviewed Firebase security checklist

## 🔗 Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Security Checklist](https://firebase.google.com/support/guides/security-checklist)
- [API Key Restrictions](https://firebase.google.com/docs/projects/api-keys)

## 💡 Summary

**Your Firebase keys are safe to expose** because:
1. They're public identifiers, not secrets
2. Security comes from Firestore rules (which you control)
3. Users must authenticate to access data
4. You can add domain restrictions for extra protection

**The real security is in your Firestore rules** - make sure they're properly configured!

