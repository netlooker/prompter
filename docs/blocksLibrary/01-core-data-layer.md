# Core Data Layer Implementation

## Overview

The core data layer establishes the foundation for storing and managing blocks in the Block Library. It provides the underlying data models, storage mechanisms, and CRUD operations needed by all other components.

## Key Components

### 1. Data Models

#### Block Type Model
```typescript
export interface BlockType {
  id: string;              // UUID
  name: string;            // Display name
  description: string;     // Explanation of this block type
  icon: string;            // Icon name from lucide-react
  is_system: boolean;      // Indicates if it's a built-in block type
}
```

#### Block Model
```typescript
export interface Block {
  id: string;              // UUID
  typeId: string;          // Reference to parent block type
  name: string;            // User-friendly display name
  description: string;     // Optional detailed explanation
  content: string;         // The actual text content to be inserted
  tags: string[];          // Optional array of searchable keywords
  created: number;         // Timestamp of creation
  updated: number;         // Timestamp of last modification
  favorite: boolean;       // Favorite status
  usage_count: number;     // Number of times the block has been used
  last_used: number;       // Timestamp of most recent usage
  is_system: boolean;      // Indicates if it's a built-in block
  icon: string;            // Icon name from lucide-react library
}
```

#### Collection Model
```typescript
export interface Collection {
  id: string;              // UUID
  name: string;            // Display name
  description: string;     // Purpose of the collection
  icon: string;            // Icon name from lucide-react
  blockIds: string[];      // References to blocks in this collection
  is_system: boolean;      // Indicates if it's a built-in collection
}
```

### 2. IndexedDB Storage Service

#### Database Schema
```typescript
const DB_NAME = 'block-library';
const DB_VERSION = 1;

const schema = {
  blocks: 'id, typeId, name, tags, created, updated, favorite, usage_count, last_used, is_system',
  blockTypes: 'id, name, is_system',
  collections: 'id, name, is_system'
};
```

#### Storage Service Interface
```typescript
export interface StorageService {
  // Block operations
  getBlock(id: string): Promise<Block | null>;
  getBlocks(options?: FilterOptions): Promise<Block[]>;
  saveBlock(block: Block): Promise<string>;
  deleteBlock(id: string): Promise<void>;
  
  // Block type operations
  getBlockType(id: string): Promise<BlockType | null>;
  getBlockTypes(): Promise<BlockType[]>;
  saveBlockType(blockType: BlockType): Promise<string>;
  deleteBlockType(id: string): Promise<void>;
  
  // Collection operations
  getCollection(id: string): Promise<Collection | null>;
  getCollections(): Promise<Collection[]>;
  saveCollection(collection: Collection): Promise<string>;
  deleteCollection(id: string): Promise<void>;
  
  // Utility operations
  getStorageUsage(): Promise<StorageUsageInfo>;
  exportData(): Promise<ExportData>;
  importData(data: ExportData): Promise<ImportResult>;
  clearAllData(): Promise<void>;
}
```

### 3. Event System

#### Event Types
```typescript
export enum BlockLibraryEventType {
  BLOCK_CREATED = 'block:created',
  BLOCK_UPDATED = 'block:updated',
  BLOCK_DELETED = 'block:deleted',
  BLOCK_FAVORITED = 'block:favorited',
  BLOCK_UNFAVORITED = 'block:unfavorited',
  BLOCK_USED = 'block:used',
  BLOCK_TYPE_CREATED = 'blockType:created',
  BLOCK_TYPE_UPDATED = 'blockType:updated',
  BLOCK_TYPE_DELETED = 'blockType:deleted',
  COLLECTION_CREATED = 'collection:created',
  COLLECTION_UPDATED = 'collection:updated',
  COLLECTION_DELETED = 'collection:deleted',
  STORAGE_QUOTA_WARNING = 'storage:quotaWarning',
}
```

#### Event Service Interface
```typescript
export interface EventService {
  subscribe<T>(eventType: BlockLibraryEventType, handler: (data: T) => void): () => void;
  publish<T>(eventType: BlockLibraryEventType, data: T): void;
}
```

## Implementation Steps

### Step 1: Set Up IndexedDB with Dexie.js

1. Install Dexie.js:
```bash
npm install dexie
```

2. Create IndexedDB database class:
```typescript
import Dexie from 'dexie';

class BlockLibraryDatabase extends Dexie {
  blocks: Dexie.Table<Block, string>;
  blockTypes: Dexie.Table<BlockType, string>;
  collections: Dexie.Table<Collection, string>;

  constructor() {
    super('BlockLibraryDatabase');
    
    this.version(1).stores({
      blocks: 'id, typeId, name, *tags, created, updated, favorite, usage_count, last_used, is_system',
      blockTypes: 'id, name, is_system',
      collections: 'id, name, is_system'
    });
    
    this.blocks = this.table('blocks');
    this.blockTypes = this.table('blockTypes');
    this.collections = this.table('collections');
  }
}

export const db = new BlockLibraryDatabase();
```

### Step 2: Implement StorageService

Create a service to handle all data operations:

```typescript
export class IndexedDBStorageService implements StorageService {
  // Block operations
  async getBlock(id: string): Promise<Block | null> {
    return await db.blocks.get(id);
  }
  
  async getBlocks(options?: FilterOptions): Promise<Block[]> {
    let query = db.blocks.toCollection();
    
    if (options) {
      // Apply filters based on options
      if (options.typeId) {
        query = db.blocks.where('typeId').equals(options.typeId);
      }
      
      if (options.favorite) {
        query = query.and(item => item.favorite === true);
      }
      
      // More filters...
    }
    
    return await query.toArray();
  }
  
  async saveBlock(block: Block): Promise<string> {
    // Ensure block has a valid UUID
    if (!block.id) {
      block.id = crypto.randomUUID();
    }
    
    // Set timestamps if not provided
    const now = Date.now();
    if (!block.created) {
      block.created = now;
    }
    block.updated = now;
    
    await db.blocks.put(block);
    return block.id;
  }
  
  async deleteBlock(id: string): Promise<void> {
    await db.blocks.delete(id);
  }
  
  // Implement the remaining methods...

  async getStorageUsage(): Promise<StorageUsageInfo> {
    // Estimate storage usage
    const [blocks, blockTypes, collections] = await Promise.all([
      db.blocks.toArray(),
      db.blockTypes.toArray(),
      db.collections.toArray()
    ]);
    
    // Calculate size estimation by serializing to JSON
    const blocksSize = new Blob([JSON.stringify(blocks)]).size;
    const blockTypesSize = new Blob([JSON.stringify(blockTypes)]).size;
    const collectionsSize = new Blob([JSON.stringify(collections)]).size;
    
    return {
      totalSize: blocksSize + blockTypesSize + collectionsSize,
      blocksCount: blocks.length,
      blockTypesCount: blockTypes.length,
      collectionsCount: collections.length,
      // Get quota from browser if available
      quota: await this.getStorageQuota()
    };
  }
  
  private async getStorageQuota(): Promise<number | null> {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || null;
    }
    return null;
  }
}
```

### Step 3: Implement Event System

Create a simple event publisher/subscriber system:

```typescript
export class EventBus implements EventService {
  private handlers: Map<BlockLibraryEventType, Array<(data: any) => void>> = new Map();
  
  subscribe<T>(eventType: BlockLibraryEventType, handler: (data: T) => void): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const eventHandlers = this.handlers.get(eventType);
      if (eventHandlers) {
        const index = eventHandlers.indexOf(handler);
        if (index > -1) {
          eventHandlers.splice(index, 1);
        }
      }
    };
  }
  
  publish<T>(eventType: BlockLibraryEventType, data: T): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      eventHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }
}

export const eventBus = new EventBus();
```

### Step 4: Create Repository Pattern for Common Operations

Implement a repository to encapsulate common operations and integrate event publishing:

```typescript
export class BlockRepository {
  private storageService: StorageService;
  private eventService: EventService;
  
  constructor(storageService: StorageService, eventService: EventService) {
    this.storageService = storageService;
    this.eventService = eventService;
  }
  
  async getBlock(id: string): Promise<Block | null> {
    return this.storageService.getBlock(id);
  }
  
  async saveBlock(block: Block): Promise<string> {
    const isNew = !block.id || !(await this.storageService.getBlock(block.id));
    const id = await this.storageService.saveBlock(block);
    
    // Publish appropriate event
    if (isNew) {
      this.eventService.publish(BlockLibraryEventType.BLOCK_CREATED, block);
    } else {
      this.eventService.publish(BlockLibraryEventType.BLOCK_UPDATED, block);
    }
    
    return id;
  }
  
  async deleteBlock(id: string): Promise<void> {
    const block = await this.storageService.getBlock(id);
    if (!block) return;
    
    await this.storageService.deleteBlock(id);
    this.eventService.publish(BlockLibraryEventType.BLOCK_DELETED, block);
  }
  
  async markBlockAsFavorite(id: string, favorite: boolean): Promise<void> {
    const block = await this.storageService.getBlock(id);
    if (!block) return;
    
    block.favorite = favorite;
    await this.storageService.saveBlock(block);
    
    if (favorite) {
      this.eventService.publish(BlockLibraryEventType.BLOCK_FAVORITED, block);
    } else {
      this.eventService.publish(BlockLibraryEventType.BLOCK_UNFAVORITED, block);
    }
  }
  
  async incrementBlockUsage(id: string): Promise<void> {
    const block = await this.storageService.getBlock(id);
    if (!block) return;
    
    block.usage_count += 1;
    block.last_used = Date.now();
    await this.storageService.saveBlock(block);
    
    this.eventService.publish(BlockLibraryEventType.BLOCK_USED, block);
  }
  
  // Implement other repository methods...
}
```

### Step 5: Create System Block Types and Default Blocks

```typescript
export async function initializeBlockLibrary(
  blockRepository: BlockRepository,
  blockTypeRepository: BlockTypeRepository
): Promise<void> {
  // Create default block types if they don't exist
  const blockTypes = await blockTypeRepository.getBlockTypes();
  
  if (blockTypes.length === 0) {
    const defaultBlockTypes: BlockType[] = [
      {
        id: 'role-setting',
        name: 'Role Setting',
        description: 'Defines who the AI should act as (expertise level and persona)',
        icon: 'user',
        is_system: true
      },
      {
        id: 'context',
        name: 'Context',
        description: 'Provides background information and explains why the task matters',
        icon: 'info',
        is_system: true
      },
      // Add all other default block types...
    ];
    
    for (const blockType of defaultBlockTypes) {
      await blockTypeRepository.saveBlockType(blockType);
    }
    
    // Create some example blocks for each type
    const exampleBlocks: Block[] = [
      {
        id: 'role-setting-business-analyst',
        typeId: 'role-setting',
        name: 'Business Analyst',
        description: 'Sets the AI as a senior business analyst',
        content: 'Act as a senior business analyst with expertise in requirements gathering, process optimization, and stakeholder management.',
        tags: ['business', 'analyst', 'requirements'],
        created: Date.now(),
        updated: Date.now(),
        favorite: false,
        usage_count: 0,
        last_used: 0,
        is_system: true,
        icon: 'briefcase'
      },
      // Add more example blocks...
    ];
    
    for (const block of exampleBlocks) {
      await blockRepository.saveBlock(block);
    }
  }
}
```

### Step 6: Implement Import/Export Functionality

```typescript
export async function exportBlockLibrary(storageService: StorageService): Promise<Blob> {
  const exportData = await storageService.exportData();
  
  return new Blob([JSON.stringify(exportData)], {
    type: 'application/json'
  });
}

export async function importBlockLibrary(
  storageService: StorageService,
  file: File
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const result = await storageService.importData(data);
        resolve(result);
      } catch (error) {
        reject(new Error('Invalid file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
```

## Testing

### Unit Tests for Block Operations

```typescript
describe('BlockRepository', () => {
  let blockRepository: BlockRepository;
  let storageService: StorageService;
  let eventService: EventService;
  
  beforeEach(() => {
    // Mock dependencies
    storageService = {
      getBlock: jest.fn(),
      getBlocks: jest.fn(),
      saveBlock: jest.fn(),
      deleteBlock: jest.fn(),
      // Mock other methods...
    } as unknown as StorageService;
    
    eventService = {
      subscribe: jest.fn(),
      publish: jest.fn()
    } as EventService;
    
    blockRepository = new BlockRepository(storageService, eventService);
  });
  
  test('saveBlock should emit BLOCK_CREATED event for new block', async () => {
    // Setup
    const newBlock = { name: 'Test Block' } as Block;
    storageService.getBlock = jest.fn().mockResolvedValue(null);
    storageService.saveBlock = jest.fn().mockResolvedValue('new-id');
    
    // Execute
    await blockRepository.saveBlock(newBlock);
    
    // Assert
    expect(eventService.publish).toHaveBeenCalledWith(
      BlockLibraryEventType.BLOCK_CREATED,
      expect.objectContaining({ name: 'Test Block' })
    );
  });
  
  // More tests...
});
```

## Integration with Other Components

### How the Core Data Layer is Used

- **Search & Discovery Engine**: Uses the StorageService to query blocks and filter results
- **UI Components**: Use the BlockRepository to fetch and display blocks
- **Editor Integration**: Uses BlockRepository to insert blocks and track usage
- **Template System**: Uses both block and template repositories for template functionality
- **PWA Features**: Uses the export/import functionality for backup/restore

## Implementation Considerations

1. **Performance**: For large collections of blocks, implement pagination in the storage service
2. **Error Handling**: Add robust error handling for all DB operations
3. **Migrations**: Prepare for future schema migrations by designing a versioning system
4. **Quota Management**: Regularly check storage usage and warn users when approaching limits
5. **Security**: Ensure data isn't accidentally exposed; consider encrypting sensitive blocks