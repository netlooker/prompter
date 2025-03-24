# User Preferences & Personalization

## Overview

The User Preferences & Personalization module enables users to customize their experience with the Block Library. It provides mechanisms for saving and retrieving preferences, customizing the UI, managing favorites, tracking usage history, and creating custom collections. This module ensures that the application adapts to each user's unique workflow and preferences, enhancing productivity and satisfaction.

## Key Components

### 1. Preferences Service

#### Interface and Core Implementation
```typescript
export interface PreferencesService {
  // Basic preference operations
  getPreference<T>(key: string, defaultValue?: T): Promise<T | null>;
  setPreference<T>(key: string, value: T): Promise<void>;
  removePreference(key: string): Promise<void>;
  
  // UI preferences
  getTheme(): Promise<'light' | 'dark' | 'system'>;
  setTheme(theme: 'light' | 'dark' | 'system'): Promise<void>;
  
  getSidebarState(): Promise<SidebarState | null>;
  setSidebarState(state: SidebarState): Promise<void>;
  
  getDefaultView(): Promise<'command-palette' | 'sidebar' | 'floating-toolbar'>;
  setDefaultView(view: 'command-palette' | 'sidebar' | 'floating-toolbar'): Promise<void>;
  
  // Block-related preferences
  getPinnedBlocks(): Promise<string[]>;
  setPinnedBlocks(blockIds: string[]>;
  pinBlock(blockId: string): Promise<void>;
  unpinBlock(blockId: string): Promise<void>;
  
  getFavoriteBlocks(): Promise<string[]>;
  setFavoriteBlocks(blockIds: string[]): Promise<void>;
  
  // Collection preferences
  getCustomCollections(): Promise<CustomCollection[]>;
  addCustomCollection(collection: CustomCollection): Promise<string>;
  updateCustomCollection(collection: CustomCollection): Promise<void>;
  removeCustomCollection(id: string): Promise<void>;
  
  // Layout preferences
  getLayoutPreferences(): Promise<LayoutPreferences>;
  setLayoutPreferences(preferences: LayoutPreferences): Promise<void>;
  
  // Keyboard shortcuts
  getKeyboardShortcuts(): Promise<KeyboardShortcutMap>;
  setKeyboardShortcuts(shortcuts: KeyboardShortcutMap): Promise<void>;
  resetKeyboardShortcuts(): Promise<void>;
}

export interface SidebarState {
  isExpanded: boolean;
  width: number;
  position: 'left' | 'right';
  collapsedSections: Record<string, boolean>;
}

export interface LayoutPreferences {
  editorFontSize: number;
  editorFontFamily: string;
  editorLineHeight: number;
  blockItemSize: 'compact' | 'normal' | 'large';
  showDescriptions: boolean;
  showTags: boolean;
}

export interface KeyboardShortcutMap {
  openCommandPalette: KeyboardShortcut;
  toggleSidebar: KeyboardShortcut;
  newBlock: KeyboardShortcut;
  openBlockExplorer: KeyboardShortcut;
  saveBlock: KeyboardShortcut;
  // More shortcuts...
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface CustomCollection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  blockIds: string[];
  sortOrder?: 'name' | 'created' | 'updated' | 'custom';
  customSortOrder?: string[]; // Array of block IDs in custom order
}
```

#### Implementation
```typescript
export class IndexedDBPreferencesService implements PreferencesService {
  private db: Dexie;
  
  constructor() {
    this.db = new Dexie('PromptBlocksDB');
    
    // Ensure preferences table exists
    this.db.version(1).stores({
      preferences: 'key'
    });
  }
  
  // Get a preference by key
  async getPreference<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const preference = await this.db.table('preferences').get(key);
      
      if (!preference) {
        return defaultValue !== undefined ? defaultValue : null;
      }
      
      return preference.value as T;
    } catch (error) {
      console.error(`Failed to get preference '${key}':`, error);
      return defaultValue !== undefined ? defaultValue : null;
    }
  }
  
  // Set a preference by key
  async setPreference<T>(key: string, value: T): Promise<void> {
    try {
      await this.db.table('preferences').put({
        key,
        value,
        updated: Date.now()
      });
      
      // Trigger a change event for listeners
      this.notifyPreferenceChanged(key, value);
    } catch (error) {
      console.error(`Failed to set preference '${key}':`, error);
      throw new Error(`Failed to set preference: ${error}`);
    }
  }
  
  // Remove a preference
  async removePreference(key: string): Promise<void> {
    try {
      await this.db.table('preferences').delete(key);
      
      // Trigger a removal event for listeners
      this.notifyPreferenceRemoved(key);
    } catch (error) {
      console.error(`Failed to remove preference '${key}':`, error);
      throw new Error(`Failed to remove preference: ${error}`);
    }
  }
  
  // Notify listeners of preference changes
  private notifyPreferenceChanged<T>(key: string, value: T): void {
    const event = new CustomEvent('preferenceChanged', {
      detail: { key, value }
    });
    
    document.dispatchEvent(event);
  }
  
  // Notify listeners of preference removal
  private notifyPreferenceRemoved(key: string): void {
    const event = new CustomEvent('preferenceRemoved', {
      detail: { key }
    });
    
    document.dispatchEvent(event);
  }
  
  // Get the current theme
  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    return this.getPreference<'light' | 'dark' | 'system'>('theme', 'system');
  }
  
  // Set the theme
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    await this.setPreference('theme', theme);
    
    // Apply theme immediately
    this.applyTheme(theme);
  }
  
  // Apply theme to the document
  private applyTheme(theme: 'light' | 'dark' | 'system'): void {
    const isDark = theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  // Get sidebar state
  async getSidebarState(): Promise<SidebarState | null> {
    return this.getPreference<SidebarState>('sidebarState', {
      isExpanded: true,
      width: 300,
      position: 'left',
      collapsedSections: {}
    });
  }
  
  // Set sidebar state
  async setSidebarState(state: SidebarState): Promise<void> {
    await this.setPreference('sidebarState', state);
  }
  
  // Get default view
  async getDefaultView(): Promise<'command-palette' | 'sidebar' | 'floating-toolbar'> {
    return this.getPreference<'command-palette' | 'sidebar' | 'floating-toolbar'>(
      'defaultView', 
      'command-palette'
    );
  }
  
  // Set default view
  async setDefaultView(view: 'command-palette' | 'sidebar' | 'floating-toolbar'): Promise<void> {
    await this.setPreference('defaultView', view);
  }
  
  // Get pinned blocks
  async getPinnedBlocks(): Promise<string[]> {
    return this.getPreference<string[]>('pinnedBlocks', []);
  }
  
  // Set pinned blocks
  async setPinnedBlocks(blockIds: string[]): Promise<void> {
    await this.setPreference('pinnedBlocks', blockIds);
  }
  
  // Pin a block
  async pinBlock(blockId: string): Promise<void> {
    const pinnedBlocks = await this.getPinnedBlocks();
    
    if (!pinnedBlocks.includes(blockId)) {
      pinnedBlocks.push(blockId);
      await this.setPinnedBlocks(pinnedBlocks);
    }
  }
  
  // Unpin a block
  async unpinBlock(blockId: string): Promise<void> {
    const pinnedBlocks = await this.getPinnedBlocks();
    const index = pinnedBlocks.indexOf(blockId);
    
    if (index !== -1) {
      pinnedBlocks.splice(index, 1);
      await this.setPinnedBlocks(pinnedBlocks);
    }
  }
  
  // Get favorite blocks
  // Note: This is a convenience method that reads from the blocks table
  async getFavoriteBlocks(): Promise<string[]> {
    try {
      const favoriteBlocks = await this.db.table('blocks')
        .where('favorite')
        .equals(true)
        .toArray();
      
      return favoriteBlocks.map(block => block.id);
    } catch (error) {
      console.error('Failed to get favorite blocks:', error);
      return [];
    }
  }
  
  // Set favorite blocks
  // Note: This is a convenience method that updates the blocks table
  async setFavoriteBlocks(blockIds: string[]): Promise<void> {
    try {
      // Begin transaction
      await this.db.transaction('rw', this.db.table('blocks'), async () => {
        // First, unfavorite all blocks
        await this.db.table('blocks')
          .where('favorite')
          .equals(true)
          .modify({ favorite: false });
        
        // Then, favorite the specified blocks
        for (const blockId of blockIds) {
          await this.db.table('blocks')
            .where('id')
            .equals(blockId)
            .modify({ favorite: true });
        }
      });
    } catch (error) {
      console.error('Failed to set favorite blocks:', error);
      throw new Error(`Failed to set favorite blocks: ${error}`);
    }
  }
  
  // Get custom collections
  async getCustomCollections(): Promise<CustomCollection[]> {
    return this.getPreference<CustomCollection[]>('customCollections', []);
  }
  
  // Add a custom collection
  async addCustomCollection(collection: CustomCollection): Promise<string> {
    const collections = await this.getCustomCollections();
    
    // Ensure the collection has an ID
    if (!collection.id) {
      collection.id = crypto.randomUUID();
    }
    
    collections.push(collection);
    await this.setPreference('customCollections', collections);
    
    return collection.id;
  }
  
  // Update a custom collection
  async updateCustomCollection(collection: CustomCollection): Promise<void> {
    const collections = await this.getCustomCollections();
    const index = collections.findIndex(c => c.id === collection.id);
    
    if (index !== -1) {
      collections[index] = collection;
      await this.setPreference('customCollections', collections);
    } else {
      throw new Error(`Collection not found: ${collection.id}`);
    }
  }
  
  // Remove a custom collection
  async removeCustomCollection(id: string): Promise<void> {
    const collections = await this.getCustomCollections();
    const index = collections.findIndex(c => c.id === id);
    
    if (index !== -1) {
      collections.splice(index, 1);
      await this.setPreference('customCollections', collections);
    }
  }
  
  // Get layout preferences
  async getLayoutPreferences(): Promise<LayoutPreferences> {
    return this.getPreference<LayoutPreferences>('layoutPreferences', {
      editorFontSize: 16,
      editorFontFamily: 'system-ui, sans-serif',
      editorLineHeight: 1.5,
      blockItemSize: 'normal',
      showDescriptions: true,
      showTags: true
    });
  }
  
  // Set layout preferences
  async setLayoutPreferences(preferences: LayoutPreferences): Promise<void> {
    await this.setPreference('layoutPreferences', preferences);
  }
  
  // Get keyboard shortcuts
  async getKeyboardShortcuts(): Promise<KeyboardShortcutMap> {
    return this.getPreference<KeyboardShortcutMap>('keyboardShortcuts', this.getDefaultKeyboardShortcuts());
  }
  
  // Set keyboard shortcuts
  async setKeyboardShortcuts(shortcuts: KeyboardShortcutMap): Promise<void> {
    await this.setPreference('keyboardShortcuts', shortcuts);
  }
  
  // Reset keyboard shortcuts to defaults
  async resetKeyboardShortcuts(): Promise<void> {
    await this.setPreference('keyboardShortcuts', this.getDefaultKeyboardShortcuts());
  }
  
  // Get default keyboard shortcuts
  private getDefaultKeyboardShortcuts(): KeyboardShortcutMap {
    return {
      openCommandPalette: { key: '/', ctrl: true },
      toggleSidebar: { key: 'b', ctrl: true },
      newBlock: { key: 'n', ctrl: true },
      openBlockExplorer: { key: 'e', ctrl: true },
      saveBlock: { key: 's', ctrl: true }
      // More defaults...
    };
  }
}

// Create a singleton instance
export const preferencesService = new IndexedDBPreferencesService();
```

### 2. Theme Provider Component

```tsx
interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  
  // Load theme from preferences on mount
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await preferencesService.getTheme();
      setTheme(savedTheme);
      applyTheme(savedTheme);
    };
    
    loadTheme();
    
    // Listen for preference changes
    const handlePreferenceChanged = (event: CustomEvent<{ key: string, value: any }>) => {
      if (event.detail.key === 'theme') {
        const newTheme = event.detail.value as 'light' | 'dark' | 'system';
        setTheme(newTheme);
        applyTheme(newTheme);
      }
    };
    
    document.addEventListener('preferenceChanged', handlePreferenceChanged as EventListener);
    
    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    
    mediaQuery.addEventListener('change', handleMediaChange);
    
    return () => {
      document.removeEventListener('preferenceChanged', handlePreferenceChanged as EventListener);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [theme]);
  
  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const isDark = theme === 'dark' || 
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Update theme
  const updateTheme = async (newTheme: 'light' | 'dark' | 'system') => {
    await preferencesService.setTheme(newTheme);
  };
  
  // Theme context value
  const themeContextValue = {
    theme,
    setTheme: updateTheme
  };
  
  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme context
export const ThemeContext = createContext<{
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}>({
  theme: 'system',
  setTheme: async () => {}
});

// Custom hook
export function useTheme() {
  return useContext(ThemeContext);
}
```

### 3. Custom Collections Management

```tsx
interface CustomCollectionsProps {
  onSelectCollection: (collection: CustomCollection) => void;
}

export const CustomCollections: React.FC<CustomCollectionsProps> = ({
  onSelectCollection
}) => {
  const [collections, setCollections] = useState<CustomCollection[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CustomCollection | null>(null);
  
  // Load collections
  useEffect(() => {
    const loadCollections = async () => {
      const customCollections = await preferencesService.getCustomCollections();
      setCollections(customCollections);
    };
    
    loadCollections();
    
    // Listen for preference changes
    const handlePreferenceChanged = (event: CustomEvent<{ key: string, value: any }>) => {
      if (event.detail.key === 'customCollections') {
        setCollections(event.detail.value);
      }
    };
    
    document.addEventListener('preferenceChanged', handlePreferenceChanged as EventListener);
    
    return () => {
      document.removeEventListener('preferenceChanged', handlePreferenceChanged as EventListener);
    };
  }, []);
  
  // Create new collection
  const handleCreateCollection = () => {
    setEditingCollection(null);
    setIsCreateModalOpen(true);
  };
  
  // Edit collection
  const handleEditCollection = (collection: CustomCollection) => {
    setEditingCollection(collection);
    setIsCreateModalOpen(true);
  };
  
  // Save collection
  const handleSaveCollection = async (collection: CustomCollection) => {
    try {
      if (editingCollection) {
        // Update existing collection
        await preferencesService.updateCustomCollection(collection);
      } else {
        // Create new collection
        await preferencesService.addCustomCollection(collection);
      }
      
      // Reload collections
      const updatedCollections = await preferencesService.getCustomCollections();
      setCollections(updatedCollections);
      
      // Close modal
      setIsCreateModalOpen(false);
      setEditingCollection(null);
    } catch (error) {
      console.error('Failed to save collection:', error);
      // Show error toast
    }
  };
  
  // Delete collection
  const handleDeleteCollection = async (collectionId: string) => {
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }
    
    try {
      await preferencesService.removeCustomCollection(collectionId);
      
      // Reload collections
      const updatedCollections = await preferencesService.getCustomCollections();
      setCollections(updatedCollections);
    } catch (error) {
      console.error('Failed to delete collection:', error);
      // Show error toast
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Custom Collections</h3>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCreateCollection}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          New Collection
        </Button>
      </div>
      
      {collections.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <FolderIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No custom collections yet</p>
          <p className="text-sm mt-1">Create a collection to organize your blocks</p>
          
          <Button 
            variant="outline" 
            size="sm"
            className="mt-4"
            onClick={handleCreateCollection}
          >
            Create Your First Collection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map(collection => (
            <div 
              key={collection.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex justify-between items-start">
                <div 
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => onSelectCollection(collection)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Icon name={collection.icon || 'folder'} className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{collection.name}</h4>
                    {collection.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {collection.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {collection.blockIds.length} block{collection.blockIds.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditCollection(collection)}
                    title="Edit collection"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCollection(collection.id)}
                    title="Delete collection"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {isCreateModalOpen && (
        <CollectionEditorModal
          collection={editingCollection}
          onSave={handleSaveCollection}
          onCancel={() => {
            setIsCreateModalOpen(false);
            setEditingCollection(null);
          }}
        />
      )}
    </div>
  );
};
```

### 4. Collection Editor Modal

```tsx
interface CollectionEditorModalProps {
  collection: CustomCollection | null;
  onSave: (collection: CustomCollection) => void;
  onCancel: () => void;
}

export const CollectionEditorModal: React.FC<CollectionEditorModalProps> = ({
  collection,
  onSave,
  onCancel
}) => {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [icon, setIcon] = useState(collection?.icon || 'folder');
  const [blockIds, setBlockIds] = useState<string[]>(collection?.blockIds || []);
  const [selectedBlocks, setSelectedBlocks] = useState<Block[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Block[]>([]);
  
  // Block service
  const blockService = useBlockService();
  
  // Load selected blocks
  useEffect(() => {
    const loadBlocks = async () => {
      if (blockIds.length > 0) {
        const blocks = await Promise.all(
          blockIds.map(id => blockService.getBlock(id))
        );
        
        setSelectedBlocks(blocks.filter(Boolean) as Block[]);
      }
    };
    
    loadBlocks();
  }, [blockIds]);
  
  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await blockService.searchBlocks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search blocks:', error);
      setSearchResults([]);
    }
  };
  
  // Add block to collection
  const handleAddBlock = (block: Block) => {
    if (!blockIds.includes(block.id)) {
      setBlockIds([...blockIds, block.id]);
      setSelectedBlocks([...selectedBlocks, block]);
    }
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };
  
  // Remove block from collection
  const handleRemoveBlock = (blockId: string) => {
    setBlockIds(blockIds.filter(id => id !== blockId));
    setSelectedBlocks(selectedBlocks.filter(block => block.id !== blockId));
  };
  
  // Reorder blocks
  const handleReorderBlocks = (dragIndex: number, hoverIndex: number) => {
    // Create new arrays
    const newBlockIds = [...blockIds];
    const newSelectedBlocks = [...selectedBlocks];
    
    // Move items
    const [draggedBlockId] = newBlockIds.splice(dragIndex, 1);
    newBlockIds.splice(hoverIndex, 0, draggedBlockId);
    
    const [draggedBlock] = newSelectedBlocks.splice(dragIndex, 1);
    newSelectedBlocks.splice(hoverIndex, 0, draggedBlock);
    
    // Update state
    setBlockIds(newBlockIds);
    setSelectedBlocks(newSelectedBlocks);
  };
  
  // Handle save
  const handleSave = () => {
    // Validate name
    if (!name.trim()) {
      alert('Collection name is required');
      return;
    }
    
    // Create or update collection
    const updatedCollection: CustomCollection = {
      id: collection?.id || crypto.randomUUID(),
      name,
      description: description || undefined,
      icon: icon || 'folder',
      blockIds,
      sortOrder: 'custom',
      customSortOrder: blockIds
    };
    
    onSave(updatedCollection);
  };
  
  return (
    <Dialog open={true} onClose={onCancel}>
      <DialogTitle>
        {collection ? 'Edit Collection' : 'Create Collection'}
      </DialogTitle>
      
      <DialogContent>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <IconPicker
                value={icon}
                onChange={setIcon}
              />
            </div>
            
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Collection name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe this collection"
                  rows={2}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Label>Blocks</Label>
            
            <div className="mt-2">
              <SearchInput
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search for blocks to add..."
              />
            </div>
            
            {/* Search results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md max-h-60 overflow-y-auto">
                {searchResults.map(block => (
                  <div 
                    key={block.id}
                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex items-center justify-between"
                    onClick={() => handleAddBlock(block)}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={block.icon || 'file-text'} className="w-4 h-4" />
                      <span>{block.name}</span>
                    </div>
                    
                    <PlusIcon className="w-4 h-4" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected blocks */}
            <div className="mt-4">
              {selectedBlocks.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-md">
                  <p className="text-gray-500 dark:text-gray-400">
                    No blocks added yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Search for blocks to add them to this collection
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-md">
                  <DndProvider backend={HTML5Backend}>
                    <div className="max-h-60 overflow-y-auto">
                      {selectedBlocks.map((block, index) => (
                        <DraggableBlockItem
                          key={block.id}
                          block={block}
                          index={index}
                          onRemove={() => handleRemoveBlock(block.id)}
                          onMove={handleReorderBlocks}
                        />
                      ))}
                    </div>
                  </DndProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {collection ? 'Save Changes' : 'Create Collection'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

// Draggable block item component for reordering
interface DraggableBlockItemProps {
  block: Block;
  index: number;
  onRemove: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableBlockItem: React.FC<DraggableBlockItemProps> = ({
  block,
  index,
  onRemove,
  onMove
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Drop handling
  const [, drop] = useDrop({
    accept: 'BLOCK_ITEM',
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    }
  });
  
  // Drag handling
  const [{ isDragging }, drag] = useDrag({
    type: 'BLOCK_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });
  
  // Initialize drag and drop
  drag(drop(ref));
  
  return (
    <div
      ref={ref}
      className={`p-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex items-center justify-between ${
        isDragging ? 'opacity-50 bg-gray-100 dark:bg-gray-800' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <DragHandleIcon className="w-4 h-4 text-gray-400 cursor-move" />
        <Icon name={block.icon || 'file-text'} className="w-4 h-4" />
        <span>{block.name}</span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        title="Remove from collection"
      >
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};
```

### 5. Settings Page

```tsx
export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'interface' | 'shortcuts' | 'collections'>('general');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [defaultView, setDefaultView] = useState<'command-palette' | 'sidebar' | 'floating-toolbar'>('command-palette');
  const [layoutPreferences, setLayoutPreferences] = useState<LayoutPreferences>({
    editorFontSize: 16,
    editorFontFamily: 'system-ui, sans-serif',
    editorLineHeight: 1.5,
    blockItemSize: 'normal',
    showDescriptions: true,
    showTags: true
  });
  const [shortcuts, setShortcuts] = useState<KeyboardShortcutMap>({} as KeyboardShortcutMap);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  
  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoadingPreferences(true);
      
      try {
        const [themeValue, defaultViewValue, layoutPrefsValue, shortcutsValue] = await Promise.all([
          preferencesService.getTheme(),
          preferencesService.getDefaultView(),
          preferencesService.getLayoutPreferences(),
          preferencesService.getKeyboardShortcuts()
        ]);
        
        setTheme(themeValue);
        setDefaultView(defaultViewValue);
        setLayoutPreferences(layoutPrefsValue);
        setShortcuts(shortcutsValue);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoadingPreferences(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Handle theme change
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    try {
      await preferencesService.setTheme(newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Failed to set theme:', error);
    }
  };
  
  // Handle default view change
  const handleDefaultViewChange = async (newView: 'command-palette' | 'sidebar' | 'floating-toolbar') => {
    try {
      await preferencesService.setDefaultView(newView);
      setDefaultView(newView);
    } catch (error) {
      console.error('Failed to set default view:', error);
    }
  };
  
  // Handle layout preference change
  const handleLayoutPreferenceChange = async <K extends keyof LayoutPreferences>(
    key: K,
    value: LayoutPreferences[K]
  ) => {
    try {
      const newPreferences = {
        ...layoutPreferences,
        [key]: value
      };
      
      await preferencesService.setLayoutPreferences(newPreferences);
      setLayoutPreferences(newPreferences);
    } catch (error) {
      console.error(`Failed to set layout preference '${key}':`, error);
    }
  };
  
  // Handle shortcut change
  const handleShortcutChange = async (
    action: keyof KeyboardShortcutMap,
    shortcut: KeyboardShortcut
  ) => {
    try {
      const newShortcuts = {
        ...shortcuts,
        [action]: shortcut
      };
      
      await preferencesService.setKeyboardShortcuts(newShortcuts);
      setShortcuts(newShortcuts);
    } catch (error) {
      console.error(`Failed to set shortcut for '${action}':`, error);
    }
  };
  
  // Handle shortcut reset
  const handleResetShortcuts = async () => {
    try {
      await preferencesService.resetKeyboardShortcuts();
      const defaultShortcuts = await preferencesService.getKeyboardShortcuts();
      setShortcuts(defaultShortcuts);
    } catch (error) {
      console.error('Failed to reset shortcuts:', error);
    }
  };
  
  // Render loading state
  if (isLoadingPreferences) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading preferences...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'general'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'interface'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          onClick={() => setActiveTab('interface')}
        >
          Interface
        </button>
        
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'shortcuts'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          onClick={() => setActiveTab('shortcuts')}
        >
          Keyboard Shortcuts
        </button>
        
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'collections'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
          onClick={() => setActiveTab('collections')}
        >
          Collections
        </button>
      </div>
      
      {/* General settings */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3">Appearance</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  id="theme"
                  value={theme}
                  onChange={e => handleThemeChange(e.target.value as any)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {theme === 'system' ? 'Follows your system preference' : `Always use ${theme} mode`}
                </div>
              </div>
              
              <div>
                <Label htmlFor="defaultView">Default Block Access</Label>
                <Select
                  id="defaultView"
                  value={defaultView}
                  onChange={e => handleDefaultViewChange(e.target.value as any)}
                >
                  <option value="command-palette">Command Palette</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="floating-toolbar">Floating Toolbar</option>
                </Select>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Choose your preferred way to access blocks
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-medium mb-3">Storage</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Storage Usage</Label>
                  <StorageUsageIndicator showLabel showDetails />
                </div>
                
                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Open the storage management modal
                      const event = new CustomEvent('openStorageManagement');
                      document.dispatchEvent(event);
                    }}
                  >
                    Manage Storage
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Trigger data export
                      const event = new CustomEvent('exportAllData');
                      document.dispatchEvent(event);
                    }}
                  >
                    Export All Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Interface settings */}
      {activeTab === 'interface' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3">Editor</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editorFontSize">Font Size</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="editorFontSize"
                    min="12"
                    max="24"
                    step="1"
                    value={layoutPreferences.editorFontSize}
                    onChange={e => handleLayoutPreferenceChange('editorFontSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-8 text-center">{layoutPreferences.editorFontSize}px</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="editorFontFamily">Font Family</Label>
                <Select
                  id="editorFontFamily"
                  value={layoutPreferences.editorFontFamily}
                  onChange={e => handleLayoutPreferenceChange('editorFontFamily', e.target.value)}
                >
                  <option value="system-ui, sans-serif">System Default</option>
                  <option value="'SF Mono', monospace">SF Mono</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="'Source Code Pro', monospace">Source Code Pro</option>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editorLineHeight">Line Height</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    id="editorLineHeight"
                    min="1"
                    max="2"
                    step="0.1"
                    value={layoutPreferences.editorLineHeight}
                    onChange={e => handleLayoutPreferenceChange('editorLineHeight', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-8 text-center">{layoutPreferences.editorLineHeight}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-medium mb-3">Block Display</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="blockItemSize">Block Item Size</Label>
                <Select
                  id="blockItemSize"
                  value={layoutPreferences.blockItemSize}
                  onChange={e => handleLayoutPreferenceChange('blockItemSize', e.target.value as any)}
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="large">Large</option>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showDescriptions">Show Descriptions</Label>
                <Switch
                  id="showDescriptions"
                  checked={layoutPreferences.showDescriptions}
                  onCheckedChange={checked => handleLayoutPreferenceChange('showDescriptions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showTags">Show Tags</Label>
                <Switch
                  id="showTags"
                  checked={layoutPreferences.showTags}
                  onCheckedChange={checked => handleLayoutPreferenceChange('showTags', checked)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Keyboard shortcuts */}
      {activeTab === 'shortcuts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Keyboard Shortcuts</h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetShortcuts}
            >
              Reset to Defaults
            </Button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(shortcuts).map(([action, shortcut]) => (
              <ShortcutEditor
                key={action}
                label={formatActionName(action)}
                shortcut={shortcut}
                onChange={newShortcut => handleShortcutChange(action as keyof KeyboardShortcutMap, newShortcut)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Collections */}
      {activeTab === 'collections' && (
        <CustomCollections
          onSelectCollection={collection => {
            // Navigate to collection in sidebar or block explorer
            const event = new CustomEvent('openCollection', { detail: { collectionId: collection.id } });
            document.dispatchEvent(event);
          }}
        />
      )}
    </div>
  );
};

// Helper to format action names for display
const formatActionName = (action: string): string => {
  return action
    .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
};
```

### 6. Shortcut Editor Component

```tsx
interface ShortcutEditorProps {
  label: string;
  shortcut: KeyboardShortcut;
  onChange: (shortcut: KeyboardShortcut) => void;
}

export const ShortcutEditor: React.FC<ShortcutEditorProps> = ({
  label,
  shortcut,
  onChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  
  // Format shortcut for display
  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = [];
    
    if (shortcut.meta) parts.push('⌘');
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    
    parts.push(shortcut.key.toUpperCase());
    
    return parts.join(' + ');
  };
  
  // Handle keydown while recording
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    
    // Ignore standalone modifier keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }
    
    e.preventDefault();
    
    // Create new shortcut
    const newShortcut: KeyboardShortcut = {
      key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    };
    
    // Update
    onChange(newShortcut);
    setIsRecording(false);
  };
  
  return (
    <div className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="font-medium">{label}</div>
      
      <div className="flex items-center gap-2">
        {!isRecording ? (
          <>
            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm">
              {formatShortcut(shortcut)}
            </kbd>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRecording(true)}
            >
              Edit
            </Button>
          </>
        ) : (
          <div
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-blue-500 dark:border-blue-400 rounded text-sm focus:outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onBlur={() => setIsRecording(false)}
            autoFocus
          >
            Press shortcut...
          </div>
        )}
      </div>
    </div>
  );
};
```

## Implementation Steps

### Step 1: Set Up Preferences Storage

1. Create the basic preferences service in `src/services/preferences-service.ts`:
```typescript
// Implementation of IndexedDBPreferencesService as defined earlier
```

2. Create a provider and context in `src/contexts/preferences-context.tsx`:
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { preferencesService } from '../services/preferences-service';

// Create context
const PreferencesContext = createContext<{
  getPreference: <T>(key: string, defaultValue?: T) => Promise<T | null>;
  setPreference: <T>(key: string, value: T) => Promise<void>;
  removePreference: (key: string) => Promise<void>;
}>({
  getPreference: async () => null,
  setPreference: async () => {},
  removePreference: async () => {}
});

// Create provider
export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implement provider that wraps preferencesService
};

// Custom hook
export function usePreferences() {
  return useContext(PreferencesContext);
}
```

### Step 2: Implement Theme Provider

```tsx
// src/contexts/theme-context.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { preferencesService } from '../services/preferences-service';

// Create context
const ThemeContext = createContext<{
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
}>({
  theme: 'system',
  setTheme: async () => {}
});

// Create provider
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementation as defined earlier
};

// Custom hook
export function useTheme() {
  return useContext(ThemeContext);
}
```

### Step 3: Create Custom Collection Components

```tsx
// src/components/collections/CustomCollections.tsx
// Implementation as defined earlier

// src/components/collections/CollectionEditorModal.tsx
// Implementation as defined earlier
```

### Step 4: Create Settings Page

```tsx
// src/pages/SettingsPage.tsx
// Implementation as defined earlier
```

### Step 5: Implement Keyboard Shortcuts Manager

```typescript
// src/services/keyboard-shortcuts.ts
export class KeyboardShortcutsManager {
  private shortcuts: KeyboardShortcutMap = {};
  private handlers: Record<string, () => void> = {};
  
  constructor(private preferencesService: PreferencesService) {
    this.loadShortcuts();
    this.setupEventListeners();
  }
  
  private async loadShortcuts(): Promise<void> {
    try {
      const shortcuts = await this.preferencesService.getKeyboardShortcuts();
      this.shortcuts = shortcuts;
    } catch (error) {
      console.error('Failed to load keyboard shortcuts:', error);
    }
  }
  
  private setupEventListeners(): void {
    // Listen for preference changes
    document.addEventListener('preferenceChanged', ((event: CustomEvent<{ key: string, value: any }>) => {
      if (event.detail.key === 'keyboardShortcuts') {
        this.shortcuts = event.detail.value;
      }
    }) as EventListener);
    
    // Listen for key events
    document.addEventListener('keydown', this.handleKeyDown);
  }
  
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Ignore input elements
    if (isInputElement(event.target as HTMLElement)) {
      return;
    }
    
    // Check each shortcut
    for (const [action, shortcut] of Object.entries(this.shortcuts)) {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        event.ctrlKey === !!shortcut.ctrl &&
        event.altKey === !!shortcut.alt &&
        event.shiftKey === !!shortcut.shift &&
        event.metaKey === !!shortcut.meta
      ) {
        // Prevent default behavior
        event.preventDefault();
        
        // Call handler if registered
        if (this.handlers[action]) {
          this.handlers[action]();
        }
        
        break;
      }
    }
  };
  
  // Register a handler for a shortcut
  public registerShortcutHandler(action: keyof KeyboardShortcutMap, handler: () => void): void {
    this.handlers[action] = handler;
  }
  
  // Unregister a handler
  public unregisterShortcutHandler(action: keyof KeyboardShortcutMap): void {
    delete this.handlers[action];
  }
  
  // Get current shortcut for an action
  public getShortcut(action: keyof KeyboardShortcutMap): KeyboardShortcut | undefined {
    return this.shortcuts[action];
  }
  
  // Clean up
  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

// Helper function to check if element is an input
function isInputElement(element: HTMLElement): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.isContentEditable
  );
}
```

### Step 6: Integrate Preferences with Application Components

```typescript
// In main App component
export const App: React.FC = () => {
  return (
    <PreferencesProvider>
      <ThemeProvider>
        <KeyboardShortcutsProvider>
          {/* Application content */}
        </KeyboardShortcutsProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );
};

// In sidebar component
export const Sidebar: React.FC<SidebarProps> = (props) => {
  const [sidebarState, setSidebarState] = useState<SidebarState | null>(null);
  const preferencesService = usePreferencesService();
  
  // Load sidebar state
  useEffect(() => {
    const loadSidebarState = async () => {
      const state = await preferencesService.getSidebarState();
      setSidebarState(state);
    };
    
    loadSidebarState();
  }, []);
  
  // Save sidebar state when it changes
  useEffect(() => {
    if (sidebarState) {
      preferencesService.setSidebarState(sidebarState);
    }
  }, [sidebarState]);
  
  // Component implementation...
};
```

## Testing

### Unit Tests for Preferences Service

```typescript
describe('PreferencesService', () => {
  let preferencesService: PreferencesService;
  
  beforeEach(() => {
    // Mock IndexedDB
    const mockIndexedDB = {
      put: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined)
    };
    
    const mockTable = jest.fn().mockReturnValue(mockIndexedDB);
    
    const mockDB = {
      table: mockTable
    };
    
    // Create service with mocked DB
    preferencesService = new IndexedDBPreferencesService();
    (preferencesService as any).db = mockDB;
  });
  
  test('getPreference should return stored value', async () => {
    const mockValue = { foo: 'bar' };
    (preferencesService as any).db.table().get.mockResolvedValue({ value: mockValue });
    
    const result = await preferencesService.getPreference('testKey');
    
    expect(result).toEqual(mockValue);
    expect((preferencesService as any).db.table).toHaveBeenCalledWith('preferences');
    expect((preferencesService as any).db.table().get).toHaveBeenCalledWith('testKey');
  });
  
  test('getPreference should return default value if key not found', async () => {
    (preferencesService as any).db.table().get.mockResolvedValue(null);
    
    const result = await preferencesService.getPreference('testKey', 'defaultValue');
    
    expect(result).toBe('defaultValue');
  });
  
  test('setPreference should store value', async () => {
    const mockValue = { foo: 'bar' };
    
    await preferencesService.setPreference('testKey', mockValue);
    
    expect((preferencesService as any).db.table).toHaveBeenCalledWith('preferences');
    expect((preferencesService as any).db.table().put).toHaveBeenCalledWith({
      key: 'testKey',
      value: mockValue,
      updated: expect.any(Number)
    });
  });
  
  test('removePreference should delete key', async () => {
    await preferencesService.removePreference('testKey');
    
    expect((preferencesService as any).db.table).toHaveBeenCalledWith('preferences');
    expect((preferencesService as any).db.table().delete).toHaveBeenCalledWith('testKey');
  });
  
  // More tests...
});
```

### Integration Tests for Theme Provider

```typescript
describe('ThemeProvider', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
  };
  
  test('applies dark theme when dark is selected', async () => {
    // Mock the preferences service
    jest.mock('../services/preferences-service', () => ({
      preferencesService: {
        getTheme: jest.fn().mockResolvedValue('dark'),
        setTheme: jest.fn().mockResolvedValue(undefined)
      }
    }));
    
    // Create a test component that uses the theme
    const TestComponent = () => {
      const { theme } = useTheme();
      return <div data-testid="theme-display">{theme}</div>;
    };
    
    renderWithTheme(<TestComponent />);
    
    // Check that dark theme is applied
    expect(await screen.findByTestId('theme-display')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });
  
  test('updates theme when setTheme is called', async () => {
    // Mock the preferences service
    const mockSetTheme = jest.fn().mockResolvedValue(undefined);
    jest.mock('../services/preferences-service', () => ({
      preferencesService: {
        getTheme: jest.fn().mockResolvedValue('light'),
        setTheme: mockSetTheme
      }
    }));
    
    // Create a test component that uses the theme
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <>
          <div data-testid="theme-display">{theme}</div>
          <button onClick={() => setTheme('dark')}>Set Dark</button>
        </>
      );
    };
    
    renderWithTheme(<TestComponent />);
    
    // Check initial theme
    expect(await screen.findByTestId('theme-display')).toHaveTextContent('light');
    
    // Click button to change theme
    fireEvent.click(screen.getByText('Set Dark'));
    
    // Check that service was called
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
  
  // More tests...
});
```

## Integration with Other Components

### How the User Preferences Module is Used

- **Core Data Layer**: Stores preferences in IndexedDB alongside blocks
- **Search Engine**: Uses preferences to customize search behavior
- **Command Palette**: Adapts to keyboard shortcuts and UI preferences
- **Block Explorer**: Uses layout preferences to customize the display
- **Editor Integration**: Applies font and layout preferences
- **Template System**: Uses preferences for default template behavior
- **Sidebar Panel**: Respects sidebar state and collapsed sections
- **PWA Features**: Stores preferences locally for offline access

## Implementation Considerations

1. **Performance**:
   - Cache frequently accessed preferences
   - Batch preference updates when possible
   - Use efficient storage mechanisms for large preference objects
   - Apply preferences lazily to avoid blocking the UI

2. **User Experience**:
   - Provide sensible defaults for all preferences
   - Apply preferences immediately when changed
   - Group related settings logically
   - Offer preview of changes before applying

3. **Maintainability**:
   - Use a well-defined schema for preferences
   - Document default values and constraints
   - Version preference structure to support migrations
   - Separate UI-specific preferences from data preferences

4. **Cross-Device Sync**:
   - Consider future sync capabilities for preferences
   - Design preference storage for easy synchronization
   - Avoid conflicts with device-specific preferences
   - Support merging preferences from multiple sources

5. **Accessibility**:
   - Store accessibility preferences separately
   - Honor user's system accessibility settings
   - Provide keyboard shortcuts for all operations
   - Test preference UI with screen readers