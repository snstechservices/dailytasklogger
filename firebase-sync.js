/**
 * Firebase State Sync Manager
 * Handles user authentication and state synchronization across devices
 * Works with GitHub Pages deployment - no backend required
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

class FirebaseStateSync {
  constructor(firebaseConfig) {
    // Initialize Firebase
    this.app = initializeApp(firebaseConfig);
    this.analytics = getAnalytics(this.app);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.provider = new GoogleAuthProvider();

    this.currentUser = null;
    this.unsubscribeSnapshot = null;
    this.authStateListeners = [];
    this.stateSyncListeners = [];

    // Setup auth state observer
    this.initAuthObserver();
  }

  /**
   * Initialize authentication state observer
   */
  initAuthObserver() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser = user;

      // Notify all auth listeners
      this.authStateListeners.forEach(callback => callback(user));

      if (user) {
        console.log(`✅ User signed in: ${user.email}`);
        await this.loadUserState();
        this.setupRealtimeSync();
      } else {
        console.log('❌ User signed out');
        this.stopRealtimeSync();
      }
    });
  }

  /**
   * Register callback for auth state changes
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Immediately call with current state
    if (this.currentUser !== null) {
      callback(this.currentUser);
    }
  }

  /**
   * Register callback for state sync events
   */
  onStateSync(callback) {
    this.stateSyncListeners.push(callback);
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(this.auth, this.provider);
      const user = result.user;
      console.log(`✅ Successfully signed in: ${user.email}`);
      return user;
    } catch (error) {
      console.error('❌ Sign-in error:', error.code, error.message);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      this.stopRealtimeSync();
      await firebaseSignOut(this.auth);
      console.log('✅ Successfully signed out');
    } catch (error) {
      console.error('❌ Sign-out error:', error);
      throw error;
    }
  }

  /**
   * Get Firestore document reference for current user
   */
  getUserDocRef() {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }
    return doc(this.db, 'userStates', this.currentUser.uid);
  }

  /**
   * Save app state to Firestore and IndexedDB
   * @param {Object} state - The application state to save
   * @param {Object} options - Storage options
   */
  async saveState(state, options = {}) {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }

    const {
      useIndexedDB = true,
      uiSettings = null
    } = options;

    try {
      const stateSize = new Blob([JSON.stringify(state)]).size;
      const sizeInMB = stateSize / (1024 * 1024);

      console.log(`💾 Saving state (${sizeInMB.toFixed(2)} MB)...`);

      // Large state (>5 MB) goes to IndexedDB
      if (sizeInMB > 5 && useIndexedDB) {
        console.log('📦 State is large (>5 MB), using IndexedDB');
        await this.saveToIndexedDB(state);

        // Save only metadata to Firestore
        const metadata = {
          userId: this.currentUser.uid,
          email: this.currentUser.email,
          lastSync: serverTimestamp(),
          storageType: 'indexeddb',
          stateSize: stateSize,
          stateSummary: this.createStateSummary(state),
          uiSettings: uiSettings || this.getUISettings()
        };

        await setDoc(this.getUserDocRef(), metadata);
        console.log('✅ Metadata saved to Firestore, full state in IndexedDB');
      } else {
        // Small state (<5 MB) goes directly to Firestore
        console.log('☁️ State is small, saving to Firestore');
        const firestoreData = {
          userId: this.currentUser.uid,
          email: this.currentUser.email,
          lastSync: serverTimestamp(),
          storageType: 'firestore',
          stateSize: stateSize,
          state: state,
          uiSettings: uiSettings || this.getUISettings()
        };

        await setDoc(this.getUserDocRef(), firestoreData);
        console.log('✅ State saved to Firestore');
      }

      // Save UI settings to localStorage
      if (uiSettings) {
        this.saveUISettings(uiSettings);
      }

      return { success: true, size: sizeInMB };
    } catch (error) {
      console.error('❌ Error saving state:', error);
      throw error;
    }
  }

  /**
   * Load user state from Firestore/IndexedDB
   */
  async loadUserState() {
    if (!this.currentUser) {
      throw new Error('No user signed in');
    }

    try {
      console.log('📥 Loading user state...');
      const docSnap = await getDoc(this.getUserDocRef());

      if (!docSnap.exists()) {
        console.log('ℹ️ No existing state found for user');
        return null;
      }

      const data = docSnap.data();
      let state = null;

      if (data.storageType === 'indexeddb') {
        console.log('📦 Loading state from IndexedDB...');
        state = await this.loadFromIndexedDB();
      } else {
        console.log('☁️ Loading state from Firestore...');
        state = data.state;
      }

      // Restore UI settings to localStorage
      if (data.uiSettings) {
        this.saveUISettings(data.uiSettings);
        console.log('🎨 UI settings restored to localStorage');
      }

      console.log('✅ State loaded successfully');

      // Notify listeners
      this.stateSyncListeners.forEach(callback =>
        callback({ type: 'loaded', state, metadata: data })
      );

      return {
        state,
        metadata: {
          lastSync: data.lastSync,
          stateSize: data.stateSize,
          storageType: data.storageType
        }
      };
    } catch (error) {
      console.error('❌ Error loading state:', error);
      throw error;
    }
  }

  /**
   * Setup real-time sync listener (Firestore)
   */
  setupRealtimeSync() {
    if (!this.currentUser || this.unsubscribeSnapshot) {
      return;
    }

    console.log('🔄 Setting up real-time sync...');

    this.unsubscribeSnapshot = onSnapshot(
      this.getUserDocRef(),
      async (doc) => {
        if (!doc.exists()) return;

        const data = doc.data();
        console.log('🔔 Remote state update detected');

        let state = null;
        if (data.storageType === 'indexeddb') {
          state = await this.loadFromIndexedDB();
        } else {
          state = data.state;
        }

        // Restore UI settings
        if (data.uiSettings) {
          this.saveUISettings(data.uiSettings);
        }

        // Notify listeners
        this.stateSyncListeners.forEach(callback =>
          callback({ type: 'synced', state, metadata: data })
        );
      },
      (error) => {
        console.error('❌ Real-time sync error:', error);
      }
    );
  }

  /**
   * Stop real-time sync
   */
  stopRealtimeSync() {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
      console.log('⏸️ Real-time sync stopped');
    }
  }

  /**
   * Save to IndexedDB
   */
  async saveToIndexedDB(state) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AppStateDB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('states')) {
          db.createObjectStore('states');
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['states'], 'readwrite');
        const store = transaction.objectStore('states');

        const putRequest = store.put(state, this.currentUser.uid);

        putRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        putRequest.onerror = () => {
          db.close();
          reject(putRequest.error);
        };
      };
    });
  }

  /**
   * Load from IndexedDB
   */
  async loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AppStateDB', 1);

      request.onerror = () => reject(request.error);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('states')) {
          db.createObjectStore('states');
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['states'], 'readonly');
        const store = transaction.objectStore('states');

        const getRequest = store.get(this.currentUser.uid);

        getRequest.onsuccess = () => {
          db.close();
          resolve(getRequest.result || null);
        };

        getRequest.onerror = () => {
          db.close();
          reject(getRequest.error);
        };
      };
    });
  }

  /**
   * Save UI settings to localStorage
   */
  saveUISettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(`ui_${key}`, JSON.stringify(value));
    });
  }

  /**
   * Get UI settings from localStorage
   */
  getUISettings() {
    const settings = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('ui_')) {
        const settingKey = key.replace('ui_', '');
        try {
          settings[settingKey] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          settings[settingKey] = localStorage.getItem(key);
        }
      }
    }
    return settings;
  }

  /**
   * Create a summary of state for metadata
   */
  createStateSummary(state) {
    const summary = {};

    if (Array.isArray(state)) {
      summary.type = 'array';
      summary.length = state.length;
    } else if (typeof state === 'object' && state !== null) {
      summary.type = 'object';
      summary.keys = Object.keys(state).slice(0, 10); // First 10 keys
      summary.keyCount = Object.keys(state).length;
    }

    return summary;
  }

  /**
   * Get current user info
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn() {
    return this.currentUser !== null;
  }
}

// Export the class
export default FirebaseStateSync;
