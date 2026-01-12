/**
 * Integration module for Daily Task Logger with Firebase State Sync
 *
 * This module connects your existing app to Firebase for cross-device sync
 * Usage: Import this module and initialize it with your Firebase config
 */

import FirebaseStateSync from './firebase-sync.js';

class TaskLoggerStateManager {
  constructor(firebaseConfig) {
    this.stateSync = new FirebaseStateSync(firebaseConfig);
    this.syncInterval = null;
    this.autoSaveDelay = 2000; // Auto-save after 2 seconds of inactivity
    this.autoSaveTimeout = null;

    this.setupEventListeners();
  }

  /**
   * Initialize the state manager
   */
  setupEventListeners() {
    // Listen for auth state changes
    this.stateSync.onAuthStateChange(async (user) => {
      if (user) {
        console.log('User authenticated, loading app state...');
        await this.loadAppState();
        this.enableAutoSync();
      } else {
        console.log('User signed out, disabling auto-sync');
        this.disableAutoSync();
      }
    });

    // Listen for remote state updates
    this.stateSync.onStateSync((event) => {
      if (event.type === 'synced') {
        console.log('Remote state update detected');
        this.handleRemoteUpdate(event.state);
      }
    });
  }

  /**
   * Get current app state from your Daily Task Logger
   * Captures all work sessions, settings, and user preferences
   */
  getAppState() {
    try {
      const state = {
        // Main work sessions data
        workSessions: this.getWorkSessions(),
        
        // Active session/activity (if any)
        activeSession: this.getActiveSession(),
        activeActivity: this.getActiveActivity(),
        
        // User preferences
        customProjects: this.getCustomProjects(),
        customCategories: this.getCustomCategories(),
        holidays: this.getHolidays(),
        
        // Report settings
        reportBrand: this.getReportBrand(),
        reportUserName: this.getReportUserName(),
        reportWorkstation: this.getReportWorkstation(),
        reportTimezone: this.getReportTimezone(),
        
        // Goals
        workGoals: this.getWorkGoals(),
        
        // Reminder settings
        reminderSettings: this.getReminderSettings(),
        
        // UI preferences
        analyticsVisible: this.getAnalyticsVisible(),
        
        // Paused tasks
        pausedTasks: this.getPausedTasks(),
        
        // Metadata
        version: '1.0.0',
        lastModified: new Date().toISOString()
      };

      return state;
    } catch (error) {
      console.error('Error getting app state:', error);
      return {};
    }
  }

  /**
   * Get work sessions from localStorage
   */
  getWorkSessions() {
    try {
      const data = localStorage.getItem('workSessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting work sessions:', error);
      return [];
    }
  }

  /**
   * Get active session
   */
  getActiveSession() {
    try {
      const data = localStorage.getItem('activeSession');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get active activity
   */
  getActiveActivity() {
    try {
      const data = localStorage.getItem('activeActivity');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get custom projects
   */
  getCustomProjects() {
    try {
      const data = localStorage.getItem('customProjects');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get custom categories
   */
  getCustomCategories() {
    try {
      const data = localStorage.getItem('customCategories');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get holidays
   */
  getHolidays() {
    try {
      const data = localStorage.getItem('holidays');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get report branding
   */
  getReportBrand() {
    try {
      const data = localStorage.getItem('reportBrand');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get report user name
   */
  getReportUserName() {
    return localStorage.getItem('reportUserName') || '';
  }

  /**
   * Get report workstation
   */
  getReportWorkstation() {
    return localStorage.getItem('reportWorkstation') || '';
  }

  /**
   * Get report timezone
   */
  getReportTimezone() {
    return localStorage.getItem('reportTimezone') || '';
  }

  /**
   * Get work goals
   */
  getWorkGoals() {
    try {
      const data = localStorage.getItem('workGoals');
      return data ? JSON.parse(data) : { daily: 8, weekly: 40 };
    } catch (error) {
      return { daily: 8, weekly: 40 };
    }
  }

  /**
   * Get reminder settings
   */
  getReminderSettings() {
    try {
      const data = localStorage.getItem('reminderSettings');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get analytics visible state
   */
  getAnalyticsVisible() {
    return localStorage.getItem('analyticsVisible') === 'true';
  }

  /**
   * Get paused tasks
   */
  getPausedTasks() {
    try {
      const data = localStorage.getItem('pausedTasks');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Apply state to your app
   * Restores all work sessions, settings, and user preferences
   */
  applyStateToApp(state) {
    if (!state) return;

    try {
      // Apply work sessions
      if (state.workSessions && Array.isArray(state.workSessions)) {
        localStorage.setItem('workSessions', JSON.stringify(state.workSessions));
      }

      // Apply active session/activity
      if (state.activeSession) {
        localStorage.setItem('activeSession', JSON.stringify(state.activeSession));
      } else {
        localStorage.removeItem('activeSession');
      }

      if (state.activeActivity) {
        localStorage.setItem('activeActivity', JSON.stringify(state.activeActivity));
      } else {
        localStorage.removeItem('activeActivity');
      }

      // Apply user preferences
      if (state.customProjects && Array.isArray(state.customProjects)) {
        localStorage.setItem('customProjects', JSON.stringify(state.customProjects));
      }

      if (state.customCategories && Array.isArray(state.customCategories)) {
        localStorage.setItem('customCategories', JSON.stringify(state.customCategories));
      }

      if (state.holidays && Array.isArray(state.holidays)) {
        localStorage.setItem('holidays', JSON.stringify(state.holidays));
      }

      // Apply report settings
      if (state.reportBrand && typeof state.reportBrand === 'object') {
        localStorage.setItem('reportBrand', JSON.stringify(state.reportBrand));
      }

      if (state.reportUserName !== undefined) {
        if (state.reportUserName) {
          localStorage.setItem('reportUserName', state.reportUserName);
        } else {
          localStorage.removeItem('reportUserName');
        }
      }

      if (state.reportWorkstation !== undefined) {
        if (state.reportWorkstation) {
          localStorage.setItem('reportWorkstation', state.reportWorkstation);
        } else {
          localStorage.removeItem('reportWorkstation');
        }
      }

      if (state.reportTimezone !== undefined) {
        if (state.reportTimezone) {
          localStorage.setItem('reportTimezone', state.reportTimezone);
        } else {
          localStorage.removeItem('reportTimezone');
        }
      }

      // Apply goals
      if (state.workGoals && typeof state.workGoals === 'object') {
        localStorage.setItem('workGoals', JSON.stringify(state.workGoals));
      }

      // Apply reminder settings
      if (state.reminderSettings && typeof state.reminderSettings === 'object') {
        localStorage.setItem('reminderSettings', JSON.stringify(state.reminderSettings));
      }

      // Apply analytics visible
      if (state.analyticsVisible !== undefined) {
        localStorage.setItem('analyticsVisible', state.analyticsVisible ? 'true' : 'false');
      }

      // Apply paused tasks
      if (state.pausedTasks && Array.isArray(state.pausedTasks)) {
        localStorage.setItem('pausedTasks', JSON.stringify(state.pausedTasks));
      }

      // Trigger UI update (dispatch custom event)
      window.dispatchEvent(new CustomEvent('state-synced', {
        detail: { source: 'firebase', state }
      }));

      // Also trigger a reload event for the app to refresh UI
      window.dispatchEvent(new CustomEvent('firebase-state-loaded', {
        detail: { state }
      }));

      console.log('✅ App state applied successfully');
    } catch (error) {
      console.error('❌ Error applying state:', error);
    }
  }

  /**
   * Save current app state to Firebase
   */
  async saveAppState() {
    if (!this.stateSync.isSignedIn()) {
      console.log('Not signed in, skipping save');
      return;
    }

    try {
      const state = this.getAppState();

      // Get UI settings
      const uiSettings = {
        theme: localStorage.getItem('ui_theme') || 'light',
        lastTab: localStorage.getItem('ui_lastTab') || 'home',
        language: localStorage.getItem('ui_language') || 'en'
      };

      await this.stateSync.saveState(state, { uiSettings });
      console.log('✅ App state saved to Firebase');

      return { success: true };
    } catch (error) {
      console.error('❌ Error saving app state:', error);
      return { success: false, error };
    }
  }

  /**
   * Load app state from Firebase
   */
  async loadAppState() {
    if (!this.stateSync.isSignedIn()) {
      console.log('Not signed in, skipping load');
      return;
    }

    try {
      const result = await this.stateSync.loadUserState();

      if (result && result.state) {
        this.applyStateToApp(result.state);
        console.log('✅ App state loaded from Firebase');
        return { success: true, state: result.state };
      } else {
        console.log('ℹ️ No saved state found');
        return { success: true, state: null };
      }
    } catch (error) {
      console.error('❌ Error loading app state:', error);
      return { success: false, error };
    }
  }

  /**
   * Handle remote state updates
   */
  handleRemoteUpdate(state) {
    // Check if there are local changes that might conflict
    const localState = this.getAppState();
    const localModified = localState.lastModified || '';
    const remoteModified = state?.lastModified || '';

    // If remote is newer, apply it automatically (or ask user)
    // For now, auto-apply but dispatch event so UI can refresh
    if (state) {
      this.applyStateToApp(state);
      
      // Show notification if app is visible
      if (document.visibilityState === 'visible') {
        // You can customize this notification
        console.log('🔄 Data synced from another device');
      }
    }
  }

  /**
   * Enable auto-sync (saves state periodically)
   */
  enableAutoSync(intervalMs = 60000) {
    // Auto-save every 60 seconds (or specified interval)
    this.syncInterval = setInterval(() => {
      this.saveAppState();
    }, intervalMs);

    console.log(`✅ Auto-sync enabled (interval: ${intervalMs}ms)`);
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Auto-sync disabled');
    }
  }

  /**
   * Trigger auto-save after user activity
   * Call this after user makes changes (add task, edit task, etc.)
   */
  triggerAutoSave() {
    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Set new timeout
    this.autoSaveTimeout = setTimeout(() => {
      this.saveAppState();
    }, this.autoSaveDelay);
  }

  /**
   * Manual save (for save buttons)
   */
  async manualSave() {
    return await this.saveAppState();
  }

  /**
   * Manual load (for load/refresh buttons)
   */
  async manualLoad() {
    return await this.loadAppState();
  }

  /**
   * Sign in with Google
   */
  async signIn() {
    return await this.stateSync.signInWithGoogle();
  }

  /**
   * Sign out
   */
  async signOut() {
    this.disableAutoSync();
    return await this.stateSync.signOut();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.stateSync.getCurrentUser();
  }

  /**
   * Check if signed in
   */
  isSignedIn() {
    return this.stateSync.isSignedIn();
  }

  /**
   * Add auth state change listener
   */
  onAuthStateChange(callback) {
    this.stateSync.onAuthStateChange(callback);
  }

  /**
   * Get the underlying state sync instance
   */
  getStateSync() {
    return this.stateSync;
  }
}

export default TaskLoggerStateManager;
