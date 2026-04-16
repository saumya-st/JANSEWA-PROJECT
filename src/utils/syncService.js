import { getPendingIssues, deleteIssueFromQueue, markIssueAsSynced } from './indexedDB';
import { issuesAPI } from '../services/api';
import { uploadImageToSupabase } from './supabaseImageUpload';
import { getAuth } from 'firebase/auth';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
  }

  // Convert base64 to File object
  async base64ToFile(base64String, filename = 'image.jpg') {
    try {
      // Remove data URL prefix if present
      const base64Data = base64String.startsWith('data:image/')
        ? base64String.split(',')[1]
        : base64String;

      // Determine MIME type from data URL or use default
      let mimeType = 'image/jpeg';
      if (base64String.includes('data:image/')) {
        const match = base64String.match(/data:(image\/\w+);/);
        if (match) mimeType = match[1];
      }

      // Convert base64 to Blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Create File object
      return new File([blob], filename, { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to file:', error);
      throw error;
    }
  }

  // Check if string is base64 image
  isBase64Image(str) {
    if (typeof str !== 'string') return false;
    return str.startsWith('data:image/') || (/^[A-Za-z0-9+/=]+$/.test(str) && str.length > 100);
  }

  // Add listener for sync events
  addListener(callback) {
    this.syncListeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.syncListeners.forEach(callback => callback(event, data));
  }

  // Check if online
  isOnline() {
    return navigator.onLine;
  }

  // Sync pending issues
  async syncPendingIssues() {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.isOnline()) {
      console.log('Cannot sync - offline');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('sync_started', null);

    try {
      const pendingIssues = await getPendingIssues();
      const unsynced = pendingIssues.filter(issue => !issue.synced);

      if (unsynced.length === 0) {
        console.log('No pending issues to sync');
        this.notifyListeners('sync_completed', { synced: 0, failed: 0 });
        return;
      }

      console.log(`Syncing ${unsynced.length} pending issues`);

      const results = {
        synced: 0,
        failed: 0,
        errors: [],
      };

      // Sync issues one by one
      for (const issue of unsynced) {
        try {
          // Remove IndexedDB-specific fields
          const { id, timestamp, synced, ...issueData } = issue;

          // Handle offline image upload
          if (issueData.imageUrl && this.isBase64Image(issueData.imageUrl)) {
            try {
              console.log('Converting and uploading base64 image from offline issue...');
              const auth = getAuth();
              const firebaseUser = auth.currentUser;

              if (!firebaseUser) {
                throw new Error('User not authenticated');
              }

              // Convert base64 to File
              const imageFile = await this.base64ToFile(issueData.imageUrl, 'offline-image.jpg');

              // Upload to Supabase
              const uploadResult = await uploadImageToSupabase(imageFile, firebaseUser.uid);
              
              // Update imageUrl to Supabase URL
              issueData.imageUrl = uploadResult.url;
              console.log('Image uploaded to Supabase successfully');
            } catch (uploadError) {
              console.error('Error uploading image during sync:', uploadError);
              // Continue with base64 if upload fails as a fallback
              this.notifyListeners('image_upload_failed', { issue, error: uploadError.message });
            }
          }

          // Submit to API
          await issuesAPI.createIssue(issueData);

          // Mark as synced or delete from queue
          await deleteIssueFromQueue(issue.id);
          results.synced++;

          this.notifyListeners('issue_synced', { issue, success: true });
        } catch (error) {
          console.error('Error syncing issue:', error);
          results.failed++;
          results.errors.push({ issue, error: error.message });

          this.notifyListeners('issue_synced', { issue, success: false, error });
        }
      }

      console.log('Sync completed:', results);
      this.notifyListeners('sync_completed', results);

      return results;
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners('sync_error', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Start automatic sync on online event
  startAutoSync() {
    window.addEventListener('online', () => {
      console.log('Connection restored - starting sync');
      this.syncPendingIssues();
    });
  }
}

// Export singleton instance
export const syncService = new SyncService();
