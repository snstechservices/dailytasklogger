# Daily Task Logger

A Progressive Web App (PWA) for tracking daily tasks, breaks, and productivity with detailed analytics and Excel export. Features Google authentication and Firebase sync for cross-device data synchronization.

## Features

- ✅ **Task & Break Tracking** - Track work sessions, tasks, and breaks throughout the day
- 📊 **Analytics Dashboard** - Visualize productivity with charts and insights
- 📅 **History & Search** - View past sessions and search through your data
- 📗 **Excel Export** - Export your data to Excel with customizable branding
- 🔐 **Google Authentication** - Sign in with Google for secure access
- ☁️ **Firebase Sync** - Automatic cloud sync across all your devices
- 📱 **Progressive Web App** - Install as a native app on any device
- 🌐 **Offline Support** - Works offline with service worker caching

## Deployment to GitHub Pages

This app is configured to deploy automatically to GitHub Pages.

### Automatic Deployment

1. Push your code to the `main` or `master` branch
2. GitHub Actions will automatically deploy to GitHub Pages
3. Your app will be available at `https://yourusername.github.io/repo-name/`

### Manual Setup

1. Go to your repository Settings
2. Navigate to Pages section
3. Select source: **GitHub Actions**
4. The workflow will deploy automatically on push

### 🔐 Firebase Security Configuration (REQUIRED)

**⚠️ IMPORTANT**: Firebase API keys are safe to expose in client-side code, but you MUST configure security rules.

The app uses Firebase for authentication and data sync. Before deploying:

1. **Configure Firestore Security Rules** (CRITICAL)
   - Go to Firebase Console → Firestore Database → Rules
   - Add rules to protect user data (see [SECURITY.md](./SECURITY.md))
   - **Never deploy without proper security rules!**

2. **Enable Authentication**
   - Go to Firebase Console → Authentication
   - Enable Google Sign-In provider

3. **Add Authorized Domains**
   - Go to Firebase Console → Authentication → Settings
   - Add your GitHub Pages domain: `yourusername.github.io`

4. **Optional: Restrict API Key**
   - Add domain restrictions to your API key (see [SECURITY.md](./SECURITY.md))

See [SECURITY.md](./SECURITY.md) for detailed security information and [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment steps.

## Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. For Firebase features, ensure you have the correct Firebase configuration

## Project Structure

```
├── index.html              # Main HTML file
├── script.js              # Main application logic
├── style.css              # Styles
├── tabs.js                # Tab navigation
├── analytics-enhanced.js   # Analytics features
├── app-state-integration.js # Firebase integration
├── firebase-sync.js       # Firebase sync manager
├── sw.js                  # Service worker for PWA
├── manifest.json          # PWA manifest
└── icons/                 # App icons
```

## Technologies Used

- Vanilla JavaScript (ES6+)
- Firebase (Authentication & Firestore)
- Chart.js (Analytics charts)
- ExcelJS (Excel export)
- Service Worker (PWA & Offline support)

## License

MIT License
