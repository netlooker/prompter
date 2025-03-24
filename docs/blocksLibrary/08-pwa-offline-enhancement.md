# PWA & Offline Enhancement

## Overview

The PWA & Offline Enhancement module ensures that the Block Library functions seamlessly without an internet connection. It implements service workers for resource caching, provides robust client-side storage with IndexedDB, handles offline detection, and manages storage quotas. This ensures that users can continue to work productively even when disconnected from the internet, with all data safely stored locally and synchronized when connectivity is restored.

## Key Components

### 1. Service Worker Implementation

#### Service Worker Registration
```typescript
// src/serviceWorker.ts
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registered successfully:', registration.scope);
        })
        .catch(error => {
          console.error('ServiceWorker registration failed:', error);
        });
    });
  }
}

// Trigger this function from the main application entry point
registerServiceWorker();
```

#### Service Worker Script
```javascript
// public/service-worker.js
const CACHE_NAME = 'prompter-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip for non-GET requests or browser extension requests
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if response is not valid or if it's not a basic HTTP response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response to cache it and return it
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            // For navigation requests, fallback to index.html
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            console.error('Fetch failed:', error);
            throw error;
          });
      })
  );
});
```

### 2. Web App Manifest

```json
// public/manifest.json
{
  "name": "Prompter PWA",
  "short_name": "Prompter",
  "description": "A powerful prompt engineering tool with block library",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 3. Offline Detection Service

```typescript
// src/services/offline-service.ts
export class OfflineService {
  private isOffline: boolean = !navigator.onLine;
  private offlineListeners: Array<(isOffline: boolean) => void> = [];
  
  constructor() {
    // Initialize and set up event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Add online/offline event listeners
    window.addEventListener('online', () => this.handleConnectionChange(false));
    window.addEventListener('offline', () => this.handleConnectionChange(true));
  }
  
  private handleConnectionChange(offline: boolean): void {
    this.isOffline = offline;
    
    // Notify all listeners
    this.offlineListeners.forEach(listener => listener(offline));
    
    // Show notification
    if (offline) {
      this.showOfflineNotification();
    } else {
      this.showOnlineNotification();
    }
  }
  
  private showOfflineNotification(): void {
    // Implement a toast or banner notification
    // This would use your app's notification system
    console.log('App is now offline. Changes will be saved locally.');
  }
  
  private showOnlineNotification(): void {
    // Implement a toast or banner notification
    console.log('Back online. All changes have been saved.');
  }
  
  /**
   * Check if the application is currently offline
   */
  public checkIfOffline(): boolean {
    return this.isOffline;
  }
  
  /**
   * Subscribe to offline status changes
   * @param listener Callback function to be called when offline status changes
   * @returns Function to unsubscribe
   */
  public subscribeToOfflineChanges(listener: (isOffline: boolean) => void): () => void {
    this.offlineListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.offlineListeners = this.offlineListeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Manually check online status and update if needed
   * Useful for when the app is resumed from sleep
   */
  public checkConnectionStatus(): void {
    const currentOfflineStatus = !navigator.onLine;
    if (this.isOffline !== currentOfflineStatus) {
      this.handleConnectionChange(currentOfflineStatus);
    }
  }
}

// Create singleton instance
export const offlineService = new OfflineService();
```

### 4. Enhanced IndexedDB Storage with Quota Management

```typescript
// src/services/storage-service.ts
export class EnhancedIndexedDBStorage implements StorageService {
  private db: Dexie;
  private storageLimitBytes: number = 50 * 1024 * 1024; // 50MB default limit
  private warningThresholdPercent: number = 80; // Warn at 80% usage
  
  constructor() {
    this.db = new Dexie('PromptBlocksDB');
    
    // Define database schema
    this.db.version(1).stores({
      blocks: 'id, typeId, name, *tags, created, updated, favorite, usage_count, last_used, is_system',
      blockTypes: 'id, name, is_system',
      collections: 'id, name, is_system',
      templates: 'id, name, *tags, created, updated, is_system',
      templateBlocks: 'id, templateId, blockId, position, isPlaceholder',
      preferences: 'key'
    });
    
    // Check storage usage periodically
    this.scheduleStorageCheck();
  }
  
  /**
   * Schedule regular storage usage checks
   */
  private scheduleStorageCheck(): void {
    // Check storage usage on startup
    this.checkStorageUsage();
    
    // Then check periodically (every 30 minutes)
    setInterval(() => this.checkStorageUsage(), 30 * 60 * 1000);
  }
  
  /**
   * Check current storage usage and show warning if approaching limit
   */
  public async checkStorageUsage(): Promise<StorageInfo> {
    try {
      // Get estimation from browser
      const estimation = await this.getStorageEstimation();
      
      // Calculate usage percentage
      const usagePercent = (estimation.usage / estimation.quota) * 100;
      
      // Show warning if approaching limit
      if (usagePercent >= this.warningThresholdPercent) {
        this.showStorageWarning(usagePercent, estimation.quota);
      }
      
      return {
        usageBytes: estimation.usage,
        quotaBytes: estimation.quota,
        usagePercent,
        isApproachingLimit: usagePercent >= this.warningThresholdPercent
      };
    } catch (error) {
      console.error('Failed to check storage usage:', error);
      return {
        usageBytes: 0,
        quotaBytes: this.storageLimitBytes,
        usagePercent: 0,
        isApproachingLimit: false,
        error: String(error)
      };
    }
  }
  
  /**
   * Get storage estimation from the browser
   */
  private async getStorageEstimation(): Promise<{ usage: number, quota: number }> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimation = await navigator.storage.estimate();
      return {
        usage: estimation.usage || 0,
        quota: estimation.quota || this.storageLimitBytes
      };
    }
    
    // Fallback to manual estimation
    return this.estimateManualUsage();
  }
  
  /**
   * Estimate storage usage manually by calculating size of all objects
   */
  private async estimateManualUsage(): Promise<{ usage: number, quota: number }> {
    try {
      // Get all data from tables
      const [blocks, blockTypes, collections, templates, templateBlocks, preferences] = await Promise.all([
        this.db.table('blocks').toArray(),
        this.db.table('blockTypes').toArray(),
        this.db.table('collections').toArray(),
        this.db.table('templates').toArray(),
        this.db.table('templateBlocks').toArray(),
        this.db.table('preferences').toArray()
      ]);
      
      // Calculate sizes
      const blocksSize = this.estimateObjectSize(blocks);
      const blockTypesSize = this.estimateObjectSize(blockTypes);
      const collectionsSize = this.estimateObjectSize(collections);
      const templatesSize = this.estimateObjectSize(templates);
      const templateBlocksSize = this.estimateObjectSize(templateBlocks);
      const preferencesSize = this.estimateObjectSize(preferences);
      
      // Sum up the total
      const totalSize = blocksSize + blockTypesSize + collectionsSize + 
                         templatesSize + templateBlocksSize + preferencesSize;
      
      return {
        usage: totalSize,
        quota: this.storageLimitBytes
      };
    } catch (error) {
      console.error('Error estimating manual usage:', error);
      return {
        usage: 0,
        quota: this.storageLimitBytes
      };
    }
  }
  
  /**
   * Estimate the size of a JavaScript object in bytes
   */
  private estimateObjectSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    
    // In browsers that support TextEncoder
    if (window.TextEncoder) {
      return new TextEncoder().encode(jsonString).length;
    }
    
    // Fallback approximation
    return jsonString.length * 2; // Assuming 2 bytes per character (UTF-16)
  }
  
  /**
   * Show a warning notification when storage is approaching the limit
   */
  private showStorageWarning(usagePercent: number, quotaBytes: number): void {
    const quotaMB = Math.round(quotaBytes / (1024 * 1024));
    
    // Dispatch an event to show a warning notification
    const event = new CustomEvent('storageQuotaWarning', {
      detail: {
        usagePercent: Math.round(usagePercent),
        quotaMB,
        message: `Storage usage is at ${Math.round(usagePercent)}% of your ${quotaMB}MB quota. Consider exporting and deleting unused blocks.`
      }
    });
    
    document.dispatchEvent(event);
  }
  
  /**
   * Export all data for backup
   */
  public async exportAllData(): Promise<Blob> {
    try {
      // Get all data from tables
      const [blocks, blockTypes, collections, templates, templateBlocks, preferences] = await Promise.all([
        this.db.table('blocks').toArray(),
        this.db.table('blockTypes').toArray(),
        this.db.table('collections').toArray(),
        this.db.table('templates').toArray(),
        this.db.table('templateBlocks').toArray(),
        this.db.table('preferences').toArray()
      ]);
      
      // Create export data object
      const exportData = {
        version: 1,
        timestamp: Date.now(),
        data: {
          blocks,
          blockTypes,
          collections,
          templates,
          templateBlocks,
          preferences
        }
      };
      
      // Convert to JSON blob
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      return blob;
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Failed to export data: ' + String(error));
    }
  }
  
  /**
   * Import data from a backup file
   */
  public async importData(file: File): Promise<ImportResult> {
    try {
      // Read file content
      const fileContent = await this.readFileAsText(file);
      
      // Parse JSON
      const importData = JSON.parse(fileContent);
      
      // Validate data structure
      if (!importData.version || !importData.data) {
        throw new Error('Invalid backup file format');
      }
      
      // Begin transaction
      await this.db.transaction('rw', 
        this.db.table('blocks'),
        this.db.table('blockTypes'),
        this.db.table('collections'),
        this.db.table('templates'),
        this.db.table('templateBlocks'),
        this.db.table('preferences'),
        async () => {
          // Import block types first
          if (importData.data.blockTypes) {
            await this.db.table('blockTypes').bulkPut(importData.data.blockTypes);
          }
          
          // Import blocks
          if (importData.data.blocks) {
            await this.db.table('blocks').bulkPut(importData.data.blocks);
          }
          
          // Import collections
          if (importData.data.collections) {
            await this.db.table('collections').bulkPut(importData.data.collections);
          }
          
          // Import templates
          if (importData.data.templates) {
            await this.db.table('templates').bulkPut(importData.data.templates);
          }
          
          // Import template blocks
          if (importData.data.templateBlocks) {
            await this.db.table('templateBlocks').bulkPut(importData.data.templateBlocks);
          }
          
          // Import preferences
          if (importData.data.preferences) {
            await this.db.table('preferences').bulkPut(importData.data.preferences);
          }
        }
      );
      
      // Calculate import statistics
      const stats = {
        blockTypesCount: importData.data.blockTypes?.length || 0,
        blocksCount: importData.data.blocks?.length || 0,
        collectionsCount: importData.data.collections?.length || 0,
        templatesCount: importData.data.templates?.length || 0,
        templateBlocksCount: importData.data.templateBlocks?.length || 0,
        preferencesCount: importData.data.preferences?.length || 0
      };
      
      return {
        success: true,
        message: 'Import completed successfully',
        stats
      };
    } catch (error) {
      console.error('Failed to import data:', error);
      return {
        success: false,
        message: 'Failed to import data: ' + String(error),
        stats: {
          blockTypesCount: 0,
          blocksCount: 0,
          collectionsCount: 0,
          templatesCount: 0,
          templateBlocksCount: 0,
          preferencesCount: 0
        }
      };
    }
  }
  
  /**
   * Read a file as text
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  /**
   * Clear all data from the database
   * Use with caution!
   */
  public async clearAllData(): Promise<void> {
    try {
      await this.db.delete();
      // Recreate the database
      this.db = new Dexie('PromptBlocksDB');
      
      // Redefine schema
      this.db.version(1).stores({
        blocks: 'id, typeId, name, *tags, created, updated, favorite, usage_count, last_used, is_system',
        blockTypes: 'id, name, is_system',
        collections: 'id, name, is_system',
        templates: 'id, name, *tags, created, updated, is_system',
        templateBlocks: 'id, templateId, blockId, position, isPlaceholder',
        preferences: 'key'
      });
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw new Error('Failed to clear database: ' + String(error));
    }
  }
  
  // Implement other methods from StorageService interface...
}
```

### 5. Offline-Aware UI Components

#### Offline Status Indicator
```tsx
// src/components/offline/OfflineIndicator.tsx
interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ className }) => {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine);
    
    // Subscribe to offline service
    const unsubscribe = offlineService.subscribeToOfflineChanges(offline => {
      setIsOffline(offline);
    });
    
    return unsubscribe;
  }, []);
  
  if (!isOffline) {
    return null;
  }
  
  return (
    <div className={`bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center ${className}`}>
      <WifiOffIcon className="w-4 h-4 mr-1" />
      <span>Offline</span>
    </div>
  );
};
```

#### Storage Usage Indicator
```tsx
// src/components/storage/StorageUsageIndicator.tsx
interface StorageUsageIndicatorProps {
  showLabel?: boolean;
  showDetails?: boolean;
  className?: string;
}

export const StorageUsageIndicator: React.FC<StorageUsageIndicatorProps> = ({
  showLabel = true,
  showDetails = false,
  className
}) => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [showStorageModal, setShowStorageModal] = useState(false);
  
  // Enhanced IndexedDB storage service
  const storageService = useStorageService();
  
  // Load storage info
  useEffect(() => {
    const loadStorageInfo = async () => {
      const info = await storageService.checkStorageUsage();
      setStorageInfo(info);
    };
    
    loadStorageInfo();
    
    // Set up periodic checks
    const interval = setInterval(loadStorageInfo, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, [storageService]);
  
  // Listen for storage warning events
  useEffect(() => {
    const handleStorageWarning = (event: CustomEvent<{ message: string }>) => {
      // Show toast notification
      toast({
        title: 'Storage Warning',
        description: event.detail.message,
        status: 'warning',
        duration: 9000,
        isClosable: true,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStorageModal(true)}
          >
            Manage Storage
          </Button>
        )
      });
    };
    
    document.addEventListener('storageQuotaWarning', handleStorageWarning as EventListener);
    
    return () => {
      document.removeEventListener('storageQuotaWarning', handleStorageWarning as EventListener);
    };
  }, []);
  
  if (!storageInfo) {
    return null;
  }
  
  // Determine color based on usage
  const getColor = () => {
    if (storageInfo.usagePercent >= 90) return 'text-red-500 dark:text-red-400';
    if (storageInfo.usagePercent >= 75) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-green-500 dark:text-green-400';
  };
  
  // Format bytes to human-readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <>
      <div 
        className={`flex items-center ${className}`}
        onClick={() => setShowStorageModal(true)}
        role="button"
        tabIndex={0}
      >
        <div className="relative w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${getColor()}`}
            style={{ width: `${storageInfo.usagePercent}%` }}
          />
        </div>
        
        {showLabel && (
          <span className="ml-2 text-sm">
            {Math.round(storageInfo.usagePercent)}%
          </span>
        )}
        
        {showDetails && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
            {formatBytes(storageInfo.usageBytes)} of {formatBytes(storageInfo.quotaBytes)}
          </span>
        )}
      </div>
      
      {/* Storage management modal */}
      {showStorageModal && (
        <StorageManagementModal
          storageInfo={storageInfo}
          onClose={() => setShowStorageModal(false)}
          onStorageCleared={() => {
            // Refresh storage info
            storageService.checkStorageUsage().then(setStorageInfo);
          }}
        />
      )}
    </>
  );
};
```

### 6. Data Synchronization for Multi-Device Support

```typescript
// src/services/sync-service.ts
export class SyncService {
  private storageService: StorageService;
  private offlineService: OfflineService;
  private syncQueue: SyncOperation[] = [];
  private isSyncing: boolean = false;
  
  constructor(storageService: StorageService, offlineService: OfflineService) {
    this.storageService = storageService;
    this.offlineService = offlineService;
    
    // Load pending operations from IndexedDB
    this.loadSyncQueue();
    
    // Listen for online status changes
    this.offlineService.subscribeToOfflineChanges(isOffline => {
      if (!isOffline) {
        // We're online, try to sync
        this.sync();
      }
    });
  }
  
  /**
   * Load pending sync operations from storage
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await this.storageService.getPreference('syncQueue');
      
      if (queue) {
        this.syncQueue = JSON.parse(queue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }
  
  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await this.storageService.setPreference('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }
  
  /**
   * Add an operation to the sync queue
   */
  public async addToSyncQueue(operation: SyncOperation): Promise<void> {
    this.syncQueue.push(operation);
    await this.saveSyncQueue();
    
    // Try to sync immediately if online
    if (!this.offlineService.checkIfOffline()) {
      this.sync();
    }
  }
  
  /**
   * Sync all pending operations with the server
   */
  public async sync(): Promise<void> {
    // If already syncing or offline, skip
    if (this.isSyncing || this.offlineService.checkIfOffline()) {
      return;
    }
    
    this.isSyncing = true;
    
    try {
      // If no operations to sync, just return
      if (this.syncQueue.length === 0) {
        this.isSyncing = false;
        return;
      }
      
      // Group operations by type
      const operationsByType = this.groupOperationsByType();
      
      // Process each operation type
      for (const [type, operations] of Object.entries(operationsByType)) {
        await this.processOperations(type, operations);
      }
      
      // Clear sync queue
      this.syncQueue = [];
      await this.saveSyncQueue();
      
      // Show success notification
      this.showSyncSuccessNotification();
    } catch (error) {
      console.error('Sync failed:', error);
      this.showSyncErrorNotification();
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Group operations by type
   */
  private groupOperationsByType(): Record<string, SyncOperation[]> {
    const result: Record<string, SyncOperation[]> = {};
    
    for (const operation of this.syncQueue) {
      if (!result[operation.type]) {
        result[operation.type] = [];
      }
      
      result[operation.type].push(operation);
    }
    
    return result;
  }
  
  /**
   * Process operations of a specific type
   */
  private async processOperations(type: string, operations: SyncOperation[]): Promise<void> {
    // NOTE: In a PWA that's fully offline capable, this would communicate
    // with a server when online. For our purposes, we'll simulate successful
    // sync by just returning successfully.
    
    // In a real implementation, this would make API calls to sync data
    return new Promise(resolve => {
      // Simulate network delay
      setTimeout(resolve, 500);
    });
  }
  
  /**
   * Show a success notification for sync
   */
  private showSyncSuccessNotification(): void {
    // You would use your app's notification system here
    console.log('Sync completed successfully.');
  }
  
  /**
   * Show an error notification for sync
   */
  private showSyncErrorNotification(): void {
    // You would use your app's notification system here
    console.error('Sync failed. Changes will be synced later when connection improves.');
  }
}

/**
 * Represents a sync operation
 */
interface SyncOperation {
  id: string;
  type: string;
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
}
```

### 7. Install Prompt Component

```tsx
// src/components/pwa/InstallPrompt.tsx
export const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // Listen for beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Update UI to show the install button
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Handle install click
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, so clear it
    setDeferredPrompt(null);
    
    // Hide the install button
    setShowPrompt(false);
    
    // Log the outcome
    console.log(`User ${outcome} the A2HS prompt`);
    
    // Track the outcome for analytics
    if (outcome === 'accepted') {
      // User accepted the install prompt
      console.log('User installed the app');
    } else {
      // User dismissed the install prompt
      console.log('User declined to install the app');
    }
  };
  
  // If we don't have the deferred prompt or shouldn't show it, don't render
  if (!showPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 max-w-md z-50">
      <div className="flex items-start">
        <div className="mr-3 flex-shrink-0">
          <DownloadIcon className="w-6 h-6 text-blue-500" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            Install Prompter PWA
          </h3>
          
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Install this app on your device for quick access and offline use.
          </p>
          
          <div className="mt-3 flex gap-3">
            <Button
              variant="primary"
              onClick={handleInstallClick}
            >
              Install
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowPrompt(false)}
            >
              Not Now
            </Button>
          </div>
        </div>
        
        <button
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          onClick={() => setShowPrompt(false)}
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
```

## Implementation Steps

### Step 1: Set Up Basic PWA Configuration

1. Create the Web App Manifest:
```bash
touch public/manifest.json
```

2. Add necessary PWA meta tags to `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#3b82f6">
  <meta name="description" content="A powerful prompt engineering tool with block library">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/icon-192x192.png">
  <link rel="manifest" href="/manifest.json">
  <title>Prompter PWA</title>
</head>
<body>
  <div id="root"></div>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

3. Create PWA icon assets:
```bash
# Using an image generator or design tool
# Save icons to public/icon-192x192.png and public/icon-512x512.png
```

4. Add PWA capabilities to Vite configuration in `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Prompter PWA',
        short_name: 'Prompter',
        description: 'A powerful prompt engineering tool with block library',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

### Step 2: Implement Service Worker

1. Install the required dependencies:
```bash
npm install workbox-window
```

2. Create a service worker registration module in `src/serviceWorker.ts`:
```typescript
import { Workbox } from 'workbox-window';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', event => {
      if (event.isUpdate) {
        // Show a notification that an update is available
        if (confirm('New content is available. Reload to update?')) {
          window.location.reload();
        }
      }
    });

    wb.register();
  }
}
```

3. Register the service worker in the main application entry:
```typescript
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerServiceWorker } from './serviceWorker';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA
registerServiceWorker();
```

### Step 3: Enhance IndexedDB Storage

1. Install Dexie.js for better IndexedDB handling:
```bash
npm install dexie
```

2. Create a custom storage service with Dexie:
```typescript
// src/services/enhanced-storage.ts
import Dexie from 'dexie';

// Define the database
class PromptBlocksDB extends Dexie {
  blocks: Dexie.Table<Block, string>;
  blockTypes: Dexie.Table<BlockType, string>;
  collections: Dexie.Table<Collection, string>;
  templates: Dexie.Table<Template, string>;
  templateBlocks: Dexie.Table<TemplateBlock, string>;
  preferences: Dexie.Table<Preference, string>;

  constructor() {
    super('PromptBlocksDB');
    
    // Define tables and indexes
    this.version(1).stores({
      blocks: 'id, typeId, name, *tags, created, updated, favorite, usage_count, last_used, is_system',
      blockTypes: 'id, name, is_system',
      collections: 'id, name, is_system',
      templates: 'id, name, *tags, created, updated, is_system',
      templateBlocks: 'id, templateId, blockId, position, isPlaceholder',
      preferences: 'key'
    });
    
    // Define table types
    this.blocks = this.table('blocks');
    this.blockTypes = this.table('blockTypes');
    this.collections = this.table('collections');
    this.templates = this.table('templates');
    this.templateBlocks = this.table('templateBlocks');
    this.preferences = this.table('preferences');
  }
}
```

### Step 4: Implement Offline Status Detection

1. Create the offline status service:
```typescript
// src/services/offline-service.ts
export class OfflineService {
  private isOffline: boolean = !navigator.onLine;
  private offlineListeners: Array<(isOffline: boolean) => void> = [];
  
  constructor() {
    // Initialize and set up event listeners
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Add online/offline event listeners
    window.addEventListener('online', () => this.handleConnectionChange(false));
    window.addEventListener('offline', () => this.handleConnectionChange(true));
  }
  
  private handleConnectionChange(offline: boolean): void {
    this.isOffline = offline;
    
    // Notify all listeners
    this.offlineListeners.forEach(listener => listener(offline));
    
    // Show notification
    if (offline) {
      this.showOfflineNotification();
    } else {
      this.showOnlineNotification();
    }
  }
  
  // Other methods...
}
```

2. Create a hook for accessing offline status:
```typescript
// src/hooks/useOfflineStatus.ts
import { useState, useEffect } from 'react';
import { offlineService } from '../services/offline-service';

export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(offlineService.checkIfOffline());
  
  useEffect(() => {
    // Subscribe to offline changes
    const unsubscribe = offlineService.subscribeToOfflineChanges((offline) => {
      setIsOffline(offline);
    });
    
    // Check connection status when component mounts or app resumes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        offlineService.checkConnectionStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  return isOffline;
}
```

### Step 5: Implement Storage Management

1. Create a storage management modal component:
```tsx
// src/components/storage/StorageManagementModal.tsx
interface StorageManagementModalProps {
  storageInfo: StorageInfo;
  onClose: () => void;
  onStorageCleared: () => void;
}

export const StorageManagementModal: React.FC<StorageManagementModalProps> = ({
  storageInfo,
  onClose,
  onStorageCleared
}) => {
  const storageService = useStorageService();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  // Handle export all data
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Get export blob
      const blob = await storageService.exportAllData();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompter-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success message
      toast({
        title: 'Export Successful',
        description: 'Your data has been exported successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      // Show error message
      toast({
        title: 'Export Failed',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle clear all data
  const handleClearData = async () => {
    // Confirm with user
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsClearing(true);
      
      // Clear all data
      await storageService.clearAllData();
      
      // Show success message
      toast({
        title: 'Data Cleared',
        description: 'All data has been cleared successfully.',
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      
      // Notify parent
      onStorageCleared();
      
      // Close modal
      onClose();
    } catch (error) {
      // Show error message
      toast({
        title: 'Clear Failed',
        description: String(error),
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Storage Management</DialogTitle>
      <DialogContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">Storage Usage</h3>
            <div className="mt-2">
              <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    storageInfo.usagePercent >= 90 ? 'bg-red-500' :
                    storageInfo.usagePercent >= 75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${storageInfo.usagePercent}%` }}
                />
              </div>
              
              <div className="mt-1 text-sm flex justify-between">
                <span>{formatBytes(storageInfo.usageBytes)}</span>
                <span>{Math.round(storageInfo.usagePercent)}%</span>
                <span>{formatBytes(storageInfo.quotaBytes)}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-medium">Actions</h3>
            
            <div className="mt-3 space-y-3">
              <div>
                <h4 className="font-medium">Export Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Export all your blocks, templates, and settings to a backup file.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={handleExportData}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export All Data'}
                </Button>
              </div>
              
              <div>
                <h4 className="font-medium">Import Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Import blocks, templates, and settings from a backup file.
                </p>
                <div className="mt-2">
                  <input
                    type="file"
                    id="import-file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // Handle import...
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('import-file')?.click()}
                  >
                    Import Data
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-500">Clear All Data</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Delete all blocks, templates, and settings. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="mt-2"
                  onClick={handleClearData}
                  disabled={isClearing}
                >
                  {isClearing ? 'Clearing...' : 'Clear All Data'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
```

### Step 6: Create PWA Installation Component

```tsx
// src/components/pwa/InstallPrompt.tsx
export const InstallPrompt: React.FC = () => {
  // Implementation as shown earlier
};

// Add to main App component
export const App: React.FC = () => {
  return (
    <>
      {/* Application content */}
      <OfflineIndicator />
      <InstallPrompt />
    </>
  );
};
```

## Testing

### Unit Tests for Offline Functionality

```typescript
describe('OfflineService', () => {
  let offlineService: OfflineService;
  let onlineCallback: jest.Mock;
  let offlineCallback: jest.Mock;
  
  // Mock navigator.onLine
  const setNavigatorOnLine = (online: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => online
    });
  };
  
  beforeEach(() => {
    // Start in online state
    setNavigatorOnLine(true);
    
    // Create service and mock callbacks
    offlineService = new OfflineService();
    onlineCallback = jest.fn();
    offlineCallback = jest.fn();
    
    // Set up window event mocks
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should detect initial online state', () => {
    expect(offlineService.checkIfOffline()).toBe(false);
  });
  
  test('should detect initial offline state', () => {
    setNavigatorOnLine(false);
    
    // Create new service to check initial state
    offlineService = new OfflineService();
    
    expect(offlineService.checkIfOffline()).toBe(true);
  });
  
  test('should subscribe to offline status changes', () => {
    const unsubscribe = offlineService.subscribeToOfflineChanges(offlineCallback);
    
    // Simulate going offline
    const offlineEvent = new Event('offline');
    window.dispatchEvent(offlineEvent);
    
    expect(offlineCallback).toHaveBeenCalledWith(true);
    
    // Simulate going online
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);
    
    expect(offlineCallback).toHaveBeenCalledWith(false);
    
    // Unsubscribe and verify callback is not called again
    unsubscribe();
    offlineCallback.mockClear();
    
    window.dispatchEvent(offlineEvent);
    expect(offlineCallback).not.toHaveBeenCalled();
  });
  
  test('should check connection status manually', () => {
    offlineService.subscribeToOfflineChanges(offlineCallback);
    
    // Service starts online, call checkConnectionStatus while online
    setNavigatorOnLine(true);
    offlineService.checkConnectionStatus();
    
    // Callback should not be called since status has not changed
    expect(offlineCallback).not.toHaveBeenCalled();
    
    // Set to offline and check again
    setNavigatorOnLine(false);
    offlineService.checkConnectionStatus();
    
    // Callback should be called with offline=true
    expect(offlineCallback).toHaveBeenCalledWith(true);
  });
});
```

### Integration Tests for Storage Management

```typescript
describe('StorageUsageIndicator', () => {
  // Mock storage service
  const mockStorageService = {
    checkStorageUsage: jest.fn().mockResolvedValue({
      usageBytes: 10 * 1024 * 1024, // 10MB
      quotaBytes: 50 * 1024 * 1024, // 50MB
      usagePercent: 20,
      isApproachingLimit: false
    }),
    exportAllData: jest.fn().mockResolvedValue(new Blob(['test'])),
    clearAllData: jest.fn().mockResolvedValue(undefined)
  };
  
  // Mock toast service
  const mockToast = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hooks
    jest.mock('../hooks/useStorageService', () => ({
      useStorageService: () => mockStorageService
    }));
    
    jest.mock('../hooks/useToast', () => ({
      useToast: () => mockToast
    }));
  });
  
  test('renders storage usage correctly', async () => {
    render(<StorageUsageIndicator showLabel showDetails />);
    
    // Wait for storage info to load
    await waitFor(() => {
      expect(mockStorageService.checkStorageUsage).toHaveBeenCalled();
    });
    
    // Check that the correct values are displayed
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('10 MB of 50 MB')).toBeInTheDocument();
    
    // Check that the progress bar has the correct width
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '20%' });
  });
  
  test('opens storage management modal on click', async () => {
    render(<StorageUsageIndicator />);
    
    // Wait for storage info to load
    await waitFor(() => {
      expect(mockStorageService.checkStorageUsage).toHaveBeenCalled();
    });
    
    // Click to open modal
    fireEvent.click(screen.getByRole('button'));
    
    // Check that modal is displayed
    expect(screen.getByText('Storage Management')).toBeInTheDocument();
    expect(screen.getByText('Export All Data')).toBeInTheDocument();
    expect(screen.getByText('Import Data')).toBeInTheDocument();
    expect(screen.getByText('Clear All Data')).toBeInTheDocument();
  });
  
  test('exports data when export button is clicked', async () => {
    // Mock URL.createObjectURL and document methods
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob-url');
    global.URL.revokeObjectURL = jest.fn();
    
    const appendChildMock = jest.fn();
    const removeChildMock = jest.fn();
    const clickMock = jest.fn();
    
    document.body.appendChild = appendChildMock;
    document.body.removeChild = removeChildMock;
    Element.prototype.click = clickMock;
    
    render(<StorageUsageIndicator />);
    
    // Wait for storage info to load
    await waitFor(() => {
      expect(mockStorageService.checkStorageUsage).toHaveBeenCalled();
    });
    
    // Open modal
    fireEvent.click(screen.getByRole('button'));
    
    // Click export button
    fireEvent.click(screen.getByText('Export All Data'));
    
    // Check that export function was called
    await waitFor(() => {
      expect(mockStorageService.exportAllData).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(appendChildMock).toHaveBeenCalled();
      expect(clickMock).toHaveBeenCalled();
      expect(removeChildMock).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
    
    // Check that success toast was shown
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Export Successful'
    }));
  });
  
  // More tests...
});
```

## Integration with Other Components

### How the PWA & Offline Enhancement is Used

- **Core Data Layer**: Uses IndexedDB for persistent storage that works offline
- **Search Engine**: Ensures search works locally without network requests
- **Command Palette**: Makes palette usable even when offline
- **Block Explorer**: Handles offline management of blocks
- **Editor Integration**: Ensures block insertion works without internet
- **Template System**: Makes templates available offline
- **Sidebar Panel**: Ensures panel functionality in offline mode
- **User Preferences**: Stores preferences locally for offline access

## Implementation Considerations

1. **Storage Limitations**:
   - Monitor storage usage to avoid hitting browser limits
   - Implement data expiration/cleanup strategies for rarely used blocks
   - Provide export functionality before clearing data
   - Handle storage errors gracefully

2. **User Experience**:
   - Provide clear offline status indicators
   - Ensure UI remains responsive even when performing storage operations
   - Show appropriate loading states for async operations
   - Give users control over data management

3. **Performance**:
   - Optimize IndexedDB operations for large datasets
   - Use web workers for heavy computational tasks
   - Implement efficient caching strategies
   - Minimize main thread blocking operations

4. **Compatibility**:
   - Ensure PWA features degrade gracefully in browsers with limited support
   - Provide fallbacks for browsers without IndexedDB
   - Test across different browsers and devices
   - Handle older browsers with partial service worker support

5. **Security**:
   - Protect sensitive user data with appropriate security measures
   - Clearly communicate data storage practices to users
   - Implement data validation before storage and after retrieval
   - Handle data import securely