# Sidebar Panel UI

## Overview

The Sidebar Panel UI provides a persistent, easy-to-access interface for browsing and organizing blocks and templates. Unlike the modal command palette, the sidebar remains visible during editing, enabling drag-and-drop operations and giving users a constant overview of available blocks. It supports collapsible categories, pinned favorites, and quick filtering, making it ideal for users who prefer visual navigation over keyboard commands.

## Key Components

### 1. Sidebar Container

#### Interface and Props
```typescript
export interface SidebarProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onInsertBlock?: (block: Block) => void;
  onInsertTemplate?: (template: Template) => void;
  width?: number;
  position?: 'left' | 'right';
}

export interface SidebarState {
  activeTab: 'blocks' | 'templates' | 'collections';
  activeCategory: string | null;
  searchQuery: string;
  pinnedBlockIds: string[];
  collapsedSections: Record<string, boolean>;
}
```

#### Component Structure
```tsx
export const Sidebar: React.FC<SidebarProps> = ({
  isExpanded = true,
  onToggleExpand,
  onInsertBlock,
  onInsertTemplate,
  width = 300,
  position = 'left'
}) => {
  // State
  const [state, setState] = useState<SidebarState>({
    activeTab: 'blocks',
    activeCategory: null,
    searchQuery: '',
    pinnedBlockIds: [],
    collapsedSections: {
      recent: false,
      favorites: false
    }
  });
  
  // Services
  const blockService = useBlockService();
  const templateService = useTemplateService();
  const preferenceService = usePreferenceService();
  
  // Data
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [favoriteBlocks, setFavoriteBlocks] = useState<Block[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<Block[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // Load initial data
  useEffect(() => {
    loadData();
    loadUserPreferences();
  }, []);
  
  // Load blocks when active category changes
  useEffect(() => {
    if (state.activeTab === 'blocks' && state.activeCategory) {
      loadBlocksByType(state.activeCategory);
    }
  }, [state.activeTab, state.activeCategory]);
  
  // Effect for handling search
  useEffect(() => {
    if (state.searchQuery) {
      searchBlocks(state.searchQuery);
    } else if (state.activeTab === 'blocks' && state.activeCategory) {
      loadBlocksByType(state.activeCategory);
    }
  }, [state.searchQuery]);
  
  // Load main data
  const loadData = async () => {
    try {
      // Load block types
      const types = await blockService.getBlockTypes();
      setBlockTypes(types);
      
      // Set initial active category if none selected
      if (!state.activeCategory && types.length > 0) {
        setState(prev => ({ ...prev, activeCategory: types[0].id }));
      }
      
      // Load recent blocks
      const recent = await blockService.getRecentBlocks(5);
      setRecentBlocks(recent);
      
      // Load favorite blocks
      const favorites = await blockService.getFavoriteBlocks();
      setFavoriteBlocks(favorites);
      
      // Load templates
      const allTemplates = await templateService.getTemplates();
      setTemplates(allTemplates);
      
      // Load collections
      const allCollections = await blockService.getCollections();
      setCollections(allCollections);
    } catch (error) {
      console.error('Failed to load sidebar data:', error);
      // Show error toast
    }
  };
  
  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const pinnedBlocks = await preferenceService.getPinnedBlocks();
      const collapsedSections = await preferenceService.getSidebarCollapsedSections();
      
      setState(prev => ({
        ...prev,
        pinnedBlockIds: pinnedBlocks,
        collapsedSections: {
          ...prev.collapsedSections,
          ...collapsedSections
        }
      }));
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };
  
  // Load blocks by type
  const loadBlocksByType = async (typeId: string) => {
    try {
      const blocks = await blockService.getBlocksByType(typeId);
      setFilteredBlocks(blocks);
    } catch (error) {
      console.error(`Failed to load blocks for type ${typeId}:`, error);
      setFilteredBlocks([]);
    }
  };
  
  // Search blocks
  const searchBlocks = async (query: string) => {
    try {
      const results = await blockService.searchBlocks(query);
      setFilteredBlocks(results);
    } catch (error) {
      console.error(`Failed to search blocks for "${query}":`, error);
      setFilteredBlocks([]);
    }
  };
  
  // Toggle section collapsed state
  const toggleSectionCollapsed = (section: string) => {
    const newState = {
      ...state.collapsedSections,
      [section]: !state.collapsedSections[section]
    };
    
    setState(prev => ({
      ...prev,
      collapsedSections: newState
    }));
    
    // Save user preference
    preferenceService.setSidebarCollapsedSections(newState);
  };
  
  // Handle active tab change
  const handleTabChange = (tab: 'blocks' | 'templates' | 'collections') => {
    setState(prev => ({ ...prev, activeTab: tab, searchQuery: '' }));
    
    // Load appropriate data based on tab
    if (tab === 'templates') {
      templateService.getTemplates().then(setTemplates);
    } else if (tab === 'collections') {
      blockService.getCollections().then(setCollections);
    }
  };
  
  // Handle active category change
  const handleCategoryChange = (categoryId: string) => {
    setState(prev => ({ ...prev, activeCategory: categoryId, searchQuery: '' }));
  };
  
  // Handle search
  const handleSearch = (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  };
  
  // Handle block click
  const handleBlockClick = (block: Block) => {
    if (onInsertBlock) {
      onInsertBlock(block);
      
      // Update recent blocks
      blockService.incrementBlockUsage(block.id).then(() => {
        // Reload recent blocks
        blockService.getRecentBlocks(5).then(setRecentBlocks);
      });
    }
  };
  
  // Handle block pin/unpin
  const handleTogglePin = async (block: Block) => {
    const isPinned = state.pinnedBlockIds.includes(block.id);
    
    // Update state
    setState(prev => ({
      ...prev,
      pinnedBlockIds: isPinned
        ? prev.pinnedBlockIds.filter(id => id !== block.id)
        : [...prev.pinnedBlockIds, block.id]
    }));
    
    // Save preference
    if (isPinned) {
      await preferenceService.unpinBlock(block.id);
    } else {
      await preferenceService.pinBlock(block.id);
    }
  };
  
  // Handle template click
  const handleTemplateClick = (template: Template) => {
    if (onInsertTemplate) {
      onInsertTemplate(template);
      
      // Update template usage
      templateService.incrementTemplateUsage(template.id);
    }
  };
  
  // Handle block edit
  const handleEditBlock = (block: Block) => {
    // Open block editor modal
    // This would dispatch an event or use a context to open the modal
    const event = new CustomEvent('openBlockEditor', { detail: { blockId: block.id } });
    document.dispatchEvent(event);
  };
  
  // Handle block favorite toggle
  const handleToggleFavorite = async (block: Block) => {
    await blockService.toggleFavorite(block.id, !block.favorite);
    
    // Reload favorite blocks
    const favorites = await blockService.getFavoriteBlocks();
    setFavoriteBlocks(favorites);
    
    // Reload filtered blocks to update UI
    if (state.activeTab === 'blocks' && state.activeCategory) {
      loadBlocksByType(state.activeCategory);
    }
  };
  
  // Render the sidebar content based on active tab
  const renderContent = () => {
    if (state.activeTab === 'blocks') {
      return (
        <div className="space-y-4">
          {/* Special sections */}
          {!state.searchQuery && (
            <>
              {/* Pinned blocks */}
              {state.pinnedBlockIds.length > 0 && (
                <SidebarSection
                  title="Pinned"
                  isCollapsed={state.collapsedSections['pinned'] || false}
                  onToggleCollapse={() => toggleSectionCollapsed('pinned')}
                >
                  <div className="space-y-1">
                    {state.pinnedBlockIds.map(id => {
                      // Find the block
                      const block = 
                        [...filteredBlocks, ...recentBlocks, ...favoriteBlocks]
                          .find(b => b.id === id);
                      
                      if (!block) return null;
                      
                      return (
                        <BlockItem
                          key={block.id}
                          block={block}
                          onClick={() => handleBlockClick(block)}
                          onEdit={() => handleEditBlock(block)}
                          onFavoriteToggle={() => handleToggleFavorite(block)}
                          onPin={() => handleTogglePin(block)}
                          isPinned={true}
                          compact={true}
                        />
                      );
                    })}
                  </div>
                </SidebarSection>
              )}
              
              {/* Recent blocks */}
              <SidebarSection
                title="Recent"
                isCollapsed={state.collapsedSections['recent'] || false}
                onToggleCollapse={() => toggleSectionCollapsed('recent')}
              >
                <div className="space-y-1">
                  {recentBlocks.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      No recent blocks
                    </div>
                  ) : (
                    recentBlocks.map(block => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        onClick={() => handleBlockClick(block)}
                        onEdit={() => handleEditBlock(block)}
                        onFavoriteToggle={() => handleToggleFavorite(block)}
                        onPin={() => handleTogglePin(block)}
                        isPinned={state.pinnedBlockIds.includes(block.id)}
                        compact={true}
                      />
                    ))
                  )}
                </div>
              </SidebarSection>
              
              {/* Favorites */}
              <SidebarSection
                title="Favorites"
                isCollapsed={state.collapsedSections['favorites'] || false}
                onToggleCollapse={() => toggleSectionCollapsed('favorites')}
              >
                <div className="space-y-1">
                  {favoriteBlocks.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                      No favorite blocks
                    </div>
                  ) : (
                    favoriteBlocks.map(block => (
                      <BlockItem
                        key={block.id}
                        block={block}
                        onClick={() => handleBlockClick(block)}
                        onEdit={() => handleEditBlock(block)}
                        onFavoriteToggle={() => handleToggleFavorite(block)}
                        onPin={() => handleTogglePin(block)}
                        isPinned={state.pinnedBlockIds.includes(block.id)}
                        compact={true}
                      />
                    ))
                  )}
                </div>
              </SidebarSection>
            </>
          )}
          
          {/* Filtered blocks */}
          <div className="space-y-1">
            {filteredBlocks.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
                {state.searchQuery
                  ? 'No blocks found'
                  : 'Select a category or search for blocks'}
              </div>
            ) : (
              filteredBlocks.map(block => (
                <BlockItem
                  key={block.id}
                  block={block}
                  onClick={() => handleBlockClick(block)}
                  onEdit={() => handleEditBlock(block)}
                  onFavoriteToggle={() => handleToggleFavorite(block)}
                  onPin={() => handleTogglePin(block)}
                  isPinned={state.pinnedBlockIds.includes(block.id)}
                  compact={false}
                />
              ))
            )}
          </div>
        </div>
      );
    } else if (state.activeTab === 'templates') {
      return (
        <div className="space-y-1">
          {templates.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
              No templates found
            </div>
          ) : (
            templates.map(template => (
              <TemplateItem
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template)}
              />
            ))
          )}
        </div>
      );
    } else {
      // Collections tab
      return (
        <div className="space-y-1">
          {collections.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
              No collections found
            </div>
          ) : (
            collections.map(collection => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                onClick={() => {
                  // Load blocks for this collection
                  blockService.getBlocksByCollection(collection.id)
                    .then(setFilteredBlocks);
                }}
              />
            ))
          )}
        </div>
      );
    }
  };
  
  // Conditional rendering for collapsed sidebar
  if (!isExpanded) {
    return (
      <div
        className={`h-full border-r border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 ${
          position === 'right' ? 'border-l' : 'border-r'
        }`}
        style={{ width: 50 }}
      >
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-center">
          <button
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onToggleExpand}
            title="Expand sidebar"
          >
            {position === 'left' ? (
              <ChevronRightIcon className="w-5 h-5" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="flex flex-col items-center py-4 space-y-4">
          <button
            className={`p-2 rounded-md ${
              state.activeTab === 'blocks'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleTabChange('blocks')}
            title="Blocks"
          >
            <CubeIcon className="w-5 h-5" />
          </button>
          
          <button
            className={`p-2 rounded-md ${
              state.activeTab === 'templates'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleTabChange('templates')}
            title="Templates"
          >
            <LayoutTemplateIcon className="w-5 h-5" />
          </button>
          
          <button
            className={`p-2 rounded-md ${
              state.activeTab === 'collections'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            onClick={() => handleTabChange('collections')}
            title="Collections"
          >
            <FolderIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`h-full border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 ${
        position === 'right' ? 'border-l' : 'border-r'
      }`}
      style={{ width }}
    >
      {/* Header */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold px-2">
          {state.activeTab === 'blocks' 
            ? 'Block Library' 
            : state.activeTab === 'templates' 
              ? 'Templates'
              : 'Collections'}
        </h2>
        
        <div className="flex items-center">
          <button
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onToggleExpand}
            title="Collapse sidebar"
          >
            {position === 'left' ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            state.activeTab === 'blocks'
              ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
          onClick={() => handleTabChange('blocks')}
        >
          Blocks
        </button>
        
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            state.activeTab === 'templates'
              ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
          onClick={() => handleTabChange('templates')}
        >
          Templates
        </button>
        
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            state.activeTab === 'collections'
              ? 'border-b-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
          onClick={() => handleTabChange('collections')}
        >
          Collections
        </button>
      </div>
      
      {/* Search and categories */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="mb-2">
          <SearchInput
            value={state.searchQuery}
            onChange={handleSearch}
            placeholder={`Search ${state.activeTab}...`}
          />
        </div>
        
        {state.activeTab === 'blocks' && !state.searchQuery && (
          <div className="flex flex-wrap gap-1">
            {blockTypes.map(type => (
              <button
                key={type.id}
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  state.activeCategory === type.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => handleCategoryChange(type.id)}
              >
                {type.name}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        {renderContent()}
      </div>
      
      {/* Footer actions */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Open block explorer
            const event = new CustomEvent('openBlockExplorer');
            document.dispatchEvent(event);
          }}
        >
          <GridIcon className="w-4 h-4 mr-1" />
          Block Explorer
        </Button>
        
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => {
            // Create new block/template/collection
            if (state.activeTab === 'blocks') {
              const event = new CustomEvent('openBlockEditor');
              document.dispatchEvent(event);
            } else if (state.activeTab === 'templates') {
              const event = new CustomEvent('openTemplateEditor');
              document.dispatchEvent(event);
            } else {
              const event = new CustomEvent('openCollectionEditor');
              document.dispatchEvent(event);
            }
          }}
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Create New
        </Button>
      </div>
    </div>
  );
};
```

### 2. Sidebar Section Component

```tsx
interface SidebarSectionProps {
  title: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  isCollapsed,
  onToggleCollapse,
  children
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <div 
        className="flex justify-between items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 cursor-pointer"
        onClick={onToggleCollapse}
      >
        <h3 className="text-sm font-medium">{title}</h3>
        <button className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="p-2">
          {children}
        </div>
      )}
    </div>
  );
};
```

### 3. Block Item Component

```tsx
interface BlockItemProps {
  block: Block;
  onClick: () => void;
  onEdit: () => void;
  onFavoriteToggle: () => void;
  onPin: () => void;
  isPinned: boolean;
  compact: boolean;
}

const BlockItem: React.FC<BlockItemProps> = ({
  block,
  onClick,
  onEdit,
  onFavoriteToggle,
  onPin,
  isPinned,
  compact
}) => {
  // For drag support
  const handleDragStart = (e: React.DragEvent) => {
    // Set data transfer
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'block',
      id: block.id
    }));
    
    // Fire custom event for drag tracking
    const event = new CustomEvent('blockDragStart', { detail: { block } });
    document.dispatchEvent(event);
  };
  
  const handleDragEnd = () => {
    // Fire custom event for drag end
    const event = new CustomEvent('blockDragEnd');
    document.dispatchEvent(event);
  };
  
  // Get icon
  const Icon = block.icon ? lucideIcons[block.icon as keyof typeof lucideIcons] : FileText;
  
  if (compact) {
    // Compact view for recent/favorites sections
    return (
      <div
        className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group"
        onClick={onClick}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mr-2">
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{block.name}</div>
        </div>
        
        {/* Actions - visible on hover */}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            title={block.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {block.favorite ? (
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" />
            ) : (
              <StarIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            title={isPinned ? 'Unpin block' : 'Pin block'}
          >
            {isPinned ? (
              <PinIcon className="w-4 h-4 fill-blue-400 text-blue-400 dark:fill-blue-300 dark:text-blue-300" />
            ) : (
              <PinIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    );
  }
  
  // Full block item for main list
  return (
    <div
      className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center mb-1">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mr-2">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{block.name}</div>
        </div>
        
        {/* Actions - always visible */}
        <div className="flex items-center ml-2">
          <button
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle();
            }}
            title={block.favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {block.favorite ? (
              <StarIcon className="w-4 h-4 fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" />
            ) : (
              <StarIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            title={isPinned ? 'Unpin block' : 'Pin block'}
          >
            {isPinned ? (
              <PinIcon className="w-4 h-4 fill-blue-400 text-blue-400 dark:fill-blue-300 dark:text-blue-300" />
            ) : (
              <PinIcon className="w-4 h-4" />
            )}
          </button>
          
          <button
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Edit block"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {block.description && (
        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 ml-10">
          {block.description}
        </div>
      )}
      
      {block.tags && block.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-10">
          {block.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700"
            >
              {tag}
            </span>
          ))}
          {block.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700">
              +{block.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

### 4. Template Item Component

```tsx
interface TemplateItemProps {
  template: Template;
  onClick: () => void;
}

const TemplateItem: React.FC<TemplateItemProps> = ({
  template,
  onClick
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    // Set data transfer
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'template',
      id: template.id
    }));
    
    // Fire custom event
    const event = new CustomEvent('templateDragStart', { detail: { template } });
    document.dispatchEvent(event);
  };
  
  const handleDragEnd = () => {
    const event = new CustomEvent('templateDragEnd');
    document.dispatchEvent(event);
  };
  
  // Get icon
  const Icon = template.icon ? lucideIcons[template.icon as keyof typeof lucideIcons] : LayoutTemplate;
  
  return (
    <div
      className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex items-center mb-1">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mr-2">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{template.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {template.is_system ? 'Framework Template' : 'Custom Template'}
            {template.usage_count > 0 && ` • Used ${template.usage_count} times`}
          </div>
        </div>
      </div>
      
      {template.description && (
        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 ml-10">
          {template.description}
        </div>
      )}
      
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-10">
          {template.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
```

### 5. Collection Item Component

```tsx
interface CollectionItemProps {
  collection: Collection;
  onClick: () => void;
}

const CollectionItem: React.FC<CollectionItemProps> = ({
  collection,
  onClick
}) => {
  // Get icon
  const Icon = collection.icon ? lucideIcons[collection.icon as keyof typeof lucideIcons] : Folder;
  
  return (
    <div
      className="p-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer group border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800 mr-2">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{collection.name}</div>
          {collection.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {collection.description}
            </div>
          )}
        </div>
        
        {/* Block count badge */}
        <div className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">
          {collection.blockCount || 0}
        </div>
      </div>
    </div>
  );
};
```

### 6. Search Input Component

```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...'
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        className="w-full pl-9 pr-3 py-1.5 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-sm"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      
      <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <SearchIcon className="w-4 h-4" />
      </div>
      
      {value && (
        <button
          className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={() => onChange('')}
        >
          <XIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
```

### 7. Resizable Sidebar Component

```tsx
interface ResizableSidebarProps extends SidebarProps {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
}

const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  minWidth = 200,
  maxWidth = 500,
  defaultWidth = 300,
  onWidthChange,
  ...sidebarProps
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    // Add event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    
    // Add resize styles
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
  };
  
  // Handle resize move
  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !sidebarRef.current) return;
    
    const rect = sidebarRef.current.getBoundingClientRect();
    
    let newWidth: number;
    
    if (sidebarProps.position === 'right') {
      newWidth = document.body.clientWidth - e.clientX;
    } else {
      newWidth = e.clientX - rect.left;
    }
    
    // Constrain to min/max
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    setWidth(newWidth);
    onWidthChange?.(newWidth);
  };
  
  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    // Remove resize styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    // Save width preference
    localStorage.setItem('sidebar-width', width.toString());
  };
  
  // Load saved width
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
      }
    }
  }, [minWidth, maxWidth]);
  
  return (
    <div ref={sidebarRef} className="relative h-full">
      <Sidebar {...sidebarProps} width={width} />
      
      {sidebarProps.isExpanded && (
        <div
          className={`absolute top-0 h-full w-1 cursor-ew-resize ${
            sidebarProps.position === 'right' 
              ? 'left-0 border-l border-gray-300 dark:border-gray-600' 
              : 'right-0 border-r border-gray-300 dark:border-gray-600'
          } ${isResizing ? 'bg-blue-500 dark:bg-blue-400' : ''}`}
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};
```

## Implementation Steps

### Step 1: Create the Basic Sidebar Structure

1. Start with a fixed-width sidebar container
2. Implement tab navigation between blocks, templates, and collections
3. Add search box and category filter buttons
4. Create collapsible section components

### Step 2: Implement Block Items

```typescript
// Create a service hook for pinned blocks
export function usePinnedBlocks() {
  const [pinnedBlocks, setPinnedBlocks] = useState<string[]>([]);
  const preferenceService = usePreferenceService();
  
  // Load pinned blocks
  useEffect(() => {
    preferenceService.getPinnedBlocks().then(setPinnedBlocks);
  }, []);
  
  // Pin a block
  const pinBlock = async (blockId: string) => {
    if (!pinnedBlocks.includes(blockId)) {
      const newPinned = [...pinnedBlocks, blockId];
      await preferenceService.setPinnedBlocks(newPinned);
      setPinnedBlocks(newPinned);
    }
  };
  
  // Unpin a block
  const unpinBlock = async (blockId: string) => {
    if (pinnedBlocks.includes(blockId)) {
      const newPinned = pinnedBlocks.filter(id => id !== blockId);
      await preferenceService.setPinnedBlocks(newPinned);
      setPinnedBlocks(newPinned);
    }
  };
  
  // Toggle pin status
  const togglePin = async (blockId: string) => {
    if (pinnedBlocks.includes(blockId)) {
      await unpinBlock(blockId);
    } else {
      await pinBlock(blockId);
    }
  };
  
  return {
    pinnedBlocks,
    pinBlock,
    unpinBlock,
    togglePin,
    isPinned: (blockId: string) => pinnedBlocks.includes(blockId)
  };
}
```

### Step 3: Implement Drag and Drop Support

```typescript
// Add drag and drop handlers to the sidebar
// This makes blocks draggable from the sidebar to the editor
export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<{
    type: 'block' | 'template';
    id: string;
  } | null>(null);
  
  // Set up event listeners
  useEffect(() => {
    // Handle block drag start
    const handleBlockDragStart = (event: CustomEvent<{ block: Block }>) => {
      setDraggedItem({
        type: 'block',
        id: event.detail.block.id
      });
    };
    
    // Handle template drag start
    const handleTemplateDragStart = (event: CustomEvent<{ template: Template }>) => {
      setDraggedItem({
        type: 'template',
        id: event.detail.template.id
      });
    };
    
    // Handle drag end
    const handleDragEnd = () => {
      setDraggedItem(null);
    };
    
    // Add event listeners
    document.addEventListener('blockDragStart', handleBlockDragStart as EventListener);
    document.addEventListener('templateDragStart', handleTemplateDragStart as EventListener);
    document.addEventListener('blockDragEnd', handleDragEnd);
    document.addEventListener('templateDragEnd', handleDragEnd);
    
    return () => {
      // Remove event listeners
      document.removeEventListener('blockDragStart', handleBlockDragStart as EventListener);
      document.removeEventListener('templateDragStart', handleTemplateDragStart as EventListener);
      document.removeEventListener('blockDragEnd', handleDragEnd);
      document.removeEventListener('templateDragEnd', handleDragEnd);
    };
  }, []);
  
  return {
    draggedItem
  };
}
```

### Step 4: Implement Resizable Sidebar

```typescript
// In App or layout component
export const AppLayout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  
  // Preferece service to save/load sidebar state
  const preferenceService = usePreferenceService();
  
  // Load sidebar preferences
  useEffect(() => {
    preferenceService.getSidebarState().then(state => {
      if (state) {
        setIsSidebarExpanded(state.isExpanded);
        setSidebarWidth(state.width);
      }
    });
  }, []);
  
  // Save sidebar state when changed
  useEffect(() => {
    preferenceService.setSidebarState({
      isExpanded: isSidebarExpanded,
      width: sidebarWidth
    });
  }, [isSidebarExpanded, sidebarWidth]);
  
  // Handle sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarExpanded(prev => !prev);
  };
  
  // Handle sidebar width change
  const handleWidthChange = (width: number) => {
    setSidebarWidth(width);
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <ResizableSidebar
          isExpanded={isSidebarExpanded}
          onToggleExpand={toggleSidebar}
          defaultWidth={sidebarWidth}
          onWidthChange={handleWidthChange}
          onInsertBlock={handleInsertBlock}
          onInsertTemplate={handleInsertTemplate}
        />
        
        <main className="flex-1 overflow-auto">
          <Editor />
        </main>
      </div>
    </div>
  );
};
```

### Step 5: Implement Collapsed State for Sections

```typescript
// Hook for managing collapsed sections
export function useCollapsedSections() {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const preferenceService = usePreferenceService();
  
  // Load collapsed sections
  useEffect(() => {
    preferenceService.getSidebarCollapsedSections().then(sections => {
      if (sections) {
        setCollapsedSections(sections);
      }
    });
  }, []);
  
  // Toggle section
  const toggleSection = (section: string) => {
    const newState = {
      ...collapsedSections,
      [section]: !collapsedSections[section]
    };
    
    setCollapsedSections(newState);
    preferenceService.setSidebarCollapsedSections(newState);
  };
  
  return {
    collapsedSections,
    toggleSection,
    isCollapsed: (section: string) => collapsedSections[section] || false
  };
}
```

## Testing

### Unit Tests for Sidebar Components

```typescript
describe('Sidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockOnInsertBlock = jest.fn();
  const mockOnInsertTemplate = jest.fn();
  const mockOnToggleExpand = jest.fn();
  
  test('renders expanded sidebar', () => {
    render(
      <Sidebar 
        isExpanded={true}
        onToggleExpand={mockOnToggleExpand}
        onInsertBlock={mockOnInsertBlock}
        onInsertTemplate={mockOnInsertTemplate}
      />
    );
    
    expect(screen.getByText('Block Library')).toBeInTheDocument();
    expect(screen.getByText('Blocks')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Collections')).toBeInTheDocument();
  });
  
  test('renders collapsed sidebar', () => {
    render(
      <Sidebar 
        isExpanded={false}
        onToggleExpand={mockOnToggleExpand}
        onInsertBlock={mockOnInsertBlock}
        onInsertTemplate={mockOnInsertTemplate}
      />
    );
    
    // Should not show the title, but should show tab icons
    expect(screen.queryByText('Block Library')).not.toBeInTheDocument();
    
    // Find by title attributes
    expect(screen.getByTitle('Blocks')).toBeInTheDocument();
    expect(screen.getByTitle('Templates')).toBeInTheDocument();
    expect(screen.getByTitle('Collections')).toBeInTheDocument();
  });
  
  test('switches between tabs', async () => {
    render(
      <Sidebar 
        isExpanded={true}
        onToggleExpand={mockOnToggleExpand}
        onInsertBlock={mockOnInsertBlock}
        onInsertTemplate={mockOnInsertTemplate}
      />
    );
    
    // Default tab is 'blocks'
    expect(screen.getByText('Block Library')).toBeInTheDocument();
    
    // Click Templates tab
    fireEvent.click(screen.getByText('Templates'));
    expect(screen.getByText('Templates')).toBeInTheDocument();
    
    // Check if templateService.getTemplates was called
    await waitFor(() => {
      expect(mockTemplateService.getTemplates).toHaveBeenCalled();
    });
    
    // Click Collections tab
    fireEvent.click(screen.getByText('Collections'));
    expect(screen.getByText('Collections')).toBeInTheDocument();
    
    // Check if blockService.getCollections was called
    await waitFor(() => {
      expect(mockBlockService.getCollections).toHaveBeenCalled();
    });
  });
  
  test('handles block insertion', async () => {
    const mockBlock = { id: 'block1', name: 'Test Block' };
    
    // Mock services
    jest.mock('../hooks/useBlockService', () => ({
      useBlockService: () => ({
        getBlockTypes: jest.fn().mockResolvedValue([
          { id: 'type1', name: 'Type 1' }
        ]),
        getRecentBlocks: jest.fn().mockResolvedValue([mockBlock]),
        getFavoriteBlocks: jest.fn().mockResolvedValue([]),
        getBlocksByType: jest.fn().mockResolvedValue([mockBlock]),
        incrementBlockUsage: jest.fn().mockResolvedValue(undefined)
      })
    }));
    
    render(
      <Sidebar 
        isExpanded={true}
        onToggleExpand={mockOnToggleExpand}
        onInsertBlock={mockOnInsertBlock}
        onInsertTemplate={mockOnInsertTemplate}
      />
    );
    
    // Wait for recent blocks to load
    await waitFor(() => {
      expect(screen.getByText('Test Block')).toBeInTheDocument();
    });
    
    // Click the block
    fireEvent.click(screen.getByText('Test Block'));
    
    // Check if onInsertBlock was called
    expect(mockOnInsertBlock).toHaveBeenCalledWith(mockBlock);
    
    // Check if incrementBlockUsage was called
    await waitFor(() => {
      expect(mockBlockService.incrementBlockUsage).toHaveBeenCalledWith('block1');
    });
  });
  
  // More tests...
});
```

### Integration Tests for Drag and Drop

```typescript
describe('Sidebar Drag and Drop', () => {
  test('makes blocks draggable', () => {
    const mockBlock = { id: 'block1', name: 'Test Block' };
    
    // Mock services
    jest.mock('../hooks/useBlockService', () => ({
      useBlockService: () => ({
        getBlockTypes: jest.fn().mockResolvedValue([
          { id: 'type1', name: 'Type 1' }
        ]),
        getRecentBlocks: jest.fn().mockResolvedValue([mockBlock]),
        getFavoriteBlocks: jest.fn().mockResolvedValue([]),
        getBlocksByType: jest.fn().mockResolvedValue([mockBlock])
      })
    }));
    
    render(
      <Sidebar 
        isExpanded={true}
        onToggleExpand={jest.fn()}
        onInsertBlock={jest.fn()}
        onInsertTemplate={jest.fn()}
      />
    );
    
    // Wait for block to render
    await waitFor(() => {
      expect(screen.getByText('Test Block')).toBeInTheDocument();
    });
    
    // Get the block element
    const blockElement = screen.getByText('Test Block').closest('div[draggable="true"]');
    expect(blockElement).toBeInTheDocument();
    expect(blockElement).toHaveAttribute('draggable', 'true');
    
    // Mock dataTransfer
    const dataTransfer = {
      setData: jest.fn()
    };
    
    // Dispatch dragstart event
    fireEvent.dragStart(blockElement!, { dataTransfer });
    
    // Check that data was set
    expect(dataTransfer.setData).toHaveBeenCalledWith(
      'application/json',
      expect.stringContaining('block1')
    );
  });
  
  // More tests...
});
```

## Integration with Other Components

### How the Sidebar Panel is Used

- **Core Data Layer**: Uses block repository to fetch blocks, templates, and collections
- **Search Engine**: Integrates with search service for filtering blocks
- **Command Palette**: Complements the palette with a persistent visual interface
- **Block Explorer**: Links to the explorer for more advanced management
- **Editor Integration**: Provides drag-and-drop insertion directly into the editor
- **Template System**: Displays and enables insertion of templates
- **User Preferences**: Stores and retrieves user customization preferences

## Implementation Considerations

1. **Performance**:
   - Implement virtualized lists for large collections of blocks
   - Use pagination for initial loading of blocks
   - Implement lazy loading for block content previews
   - Cache recent searches for faster response

2. **User Experience**:
   - Make drag operations feel natural with visual feedback
   - Ensure smooth resizing with proper animation
   - Support keyboard navigation within the sidebar
   - Implement responsive design for different screen sizes

3. **Mobile Support**:
   - Design a collapsible sidebar that works well on smaller screens
   - Implement touch-friendly controls and larger tap targets
   - Support slide-out gesture for opening/closing on mobile

4. **Customization**:
   - Allow users to rearrange and customize sections
   - Support user-defined tabs or collections
   - Remember user's preferred width and expanded/collapsed state
   - Allow pinning of frequently used blocks for quick access

5. **Integration**:
   - Ensure smooth communication with the editor
   - Coordinate with command palette for consistent block access
   - Keep block state synchronized across components