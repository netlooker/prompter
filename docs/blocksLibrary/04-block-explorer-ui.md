# Block Explorer UI

## Overview

The Block Explorer UI provides a dedicated, full-featured interface for browsing, managing, and organizing blocks. Unlike the Command Palette's focused insertion workflow, the Block Explorer offers comprehensive tools for block management including advanced filtering, bulk operations, and detailed block information. It serves as the central hub for users to curate their block library.

## Key Components

### 1. Block Explorer Container

#### Interface and Props
```typescript
export interface BlockExplorerProps {
  onInsertBlock?: (block: Block) => void;
  onCreateBlock?: (block: Block) => void;
  initialView?: 'grid' | 'list';
  initialFilter?: FilterCriteria;
}

export interface BlockExplorerState {
  view: 'grid' | 'list';
  selectedBlockIds: string[];
  currentFilter: FilterCriteria;
  sortOrder: SortOrder;
  isBlockDetailOpen: boolean;
  currentBlockId: string | null;
  isCreateModalOpen: boolean;
  editingBlockId: string | null;
}

export interface FilterCriteria {
  query?: string;
  typeIds?: string[];
  tags?: string[];
  favorite?: boolean;
  dateRange?: [Date, Date];
  collections?: string[];
}

export type SortOrder = {
  field: 'name' | 'created' | 'updated' | 'last_used' | 'usage_count';
  direction: 'asc' | 'desc';
};
```

#### Component Structure
```tsx
export const BlockExplorer: React.FC<BlockExplorerProps> = ({
  onInsertBlock,
  onCreateBlock,
  initialView = 'grid',
  initialFilter = {}
}) => {
  // State
  const [state, setState] = useState<BlockExplorerState>({
    view: initialView,
    selectedBlockIds: [],
    currentFilter: initialFilter,
    sortOrder: { field: 'updated', direction: 'desc' },
    isBlockDetailOpen: false,
    currentBlockId: null,
    isCreateModalOpen: false,
    editingBlockId: null
  });
  
  // Services
  const blockService = useBlockService();
  const searchService = useSearchService();
  
  // Data
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  // Load initial data
  useEffect(() => {
    loadData();
  }, []);
  
  // Load data based on current filters
  useEffect(() => {
    loadBlocks();
  }, [state.currentFilter, state.sortOrder]);
  
  // Load all required data
  const loadData = async () => {
    setIsLoading(true);
    
    try {
      const [types, cols] = await Promise.all([
        blockService.getBlockTypes(),
        blockService.getCollections()
      ]);
      
      setBlockTypes(types);
      setCollections(cols);
      
      await loadBlocks();
    } catch (error) {
      console.error('Failed to load data:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load blocks with current filters
  const loadBlocks = async () => {
    setIsLoading(true);
    
    try {
      const { query, ...filters } = state.currentFilter;
      
      let results: Block[];
      
      if (query) {
        // Use search service for text query
        const searchResults = await searchService.search(query, {
          types: filters.typeIds,
          favorites: filters.favorite,
          includeContent: true,
          includeTags: true
        });
        
        results = searchResults.items.map(item => item.block);
        setTotalCount(searchResults.total);
      } else {
        // Use direct filtering
        results = await blockService.getBlocksWithFilters(filters);
        setTotalCount(results.length);
      }
      
      // Apply sorting
      results = sortBlocks(results, state.sortOrder);
      
      setBlocks(results);
    } catch (error) {
      console.error('Failed to load blocks:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sort blocks
  const sortBlocks = (blocksToSort: Block[], order: SortOrder): Block[] => {
    return [...blocksToSort].sort((a, b) => {
      let valueA = a[order.field];
      let valueB = b[order.field];
      
      // Handle dates
      if (['created', 'updated', 'last_used'].includes(order.field)) {
        valueA = valueA || 0;
        valueB = valueB || 0;
      }
      
      // String comparison
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Number comparison
      return order.direction === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilter: Partial<FilterCriteria>) => {
    setState(prev => ({
      ...prev,
      currentFilter: {
        ...prev.currentFilter,
        ...newFilter
      },
      // Reset selection when filter changes
      selectedBlockIds: []
    }));
  };
  
  // Handle sort order change
  const handleSortChange = (field: SortOrder['field']) => {
    setState(prev => {
      // Toggle direction if same field, otherwise use desc
      const direction = prev.sortOrder.field === field && prev.sortOrder.direction === 'desc'
        ? 'asc'
        : 'desc';
        
      return {
        ...prev,
        sortOrder: { field, direction }
      };
    });
  };
  
  // Handle view change
  const handleViewChange = (view: 'grid' | 'list') => {
    setState(prev => ({ ...prev, view }));
  };
  
  // Handle block selection
  const handleBlockSelect = (block: Block, isMultiSelect: boolean) => {
    setState(prev => {
      if (isMultiSelect) {
        // Toggle selection
        const isSelected = prev.selectedBlockIds.includes(block.id);
        
        return {
          ...prev,
          selectedBlockIds: isSelected
            ? prev.selectedBlockIds.filter(id => id !== block.id)
            : [...prev.selectedBlockIds, block.id]
        };
      } else {
        // Single selection
        return {
          ...prev,
          selectedBlockIds: [block.id]
        };
      }
    });
  };
  
  // Handle block click (show details)
  const handleBlockClick = (block: Block) => {
    setState(prev => ({
      ...prev,
      isBlockDetailOpen: true,
      currentBlockId: block.id
    }));
  };
  
  // Handle block insertion
  const handleInsertBlock = (block: Block) => {
    blockService.incrementBlockUsage(block.id);
    onInsertBlock?.(block);
  };
  
  // Handle favorite toggle
  const handleFavoriteToggle = async (blockId: string, isFavorite: boolean) => {
    await blockService.toggleFavorite(blockId, isFavorite);
    
    // Update block in state
    setBlocks(prev => 
      prev.map(block => 
        block.id === blockId 
          ? { ...block, favorite: isFavorite } 
          : block
      )
    );
  };
  
  // Handle bulk operations
  const handleBulkDelete = async () => {
    if (!state.selectedBlockIds.length) return;
    
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete ${state.selectedBlockIds.length} block(s)?`
    );
    
    if (!confirmed) return;
    
    try {
      // Delete blocks
      await Promise.all(
        state.selectedBlockIds.map(id => blockService.deleteBlock(id))
      );
      
      // Refresh blocks
      await loadBlocks();
      
      // Clear selection
      setState(prev => ({ ...prev, selectedBlockIds: [] }));
      
      // Show success toast
    } catch (error) {
      console.error('Failed to delete blocks:', error);
      // Show error toast
    }
  };
  
  // Handle bulk favorite
  const handleBulkFavorite = async (isFavorite: boolean) => {
    if (!state.selectedBlockIds.length) return;
    
    try {
      // Update favorites
      await Promise.all(
        state.selectedBlockIds.map(id => blockService.toggleFavorite(id, isFavorite))
      );
      
      // Refresh blocks
      await loadBlocks();
      
      // Show success toast
    } catch (error) {
      console.error('Failed to update favorites:', error);
      // Show error toast
    }
  };
  
  // Handle create new block
  const handleCreateNew = () => {
    setState(prev => ({ 
      ...prev, 
      isCreateModalOpen: true,
      editingBlockId: null
    }));
  };
  
  // Handle edit block
  const handleEditBlock = (blockId: string) => {
    setState(prev => ({
      ...prev,
      isCreateModalOpen: true,
      editingBlockId: blockId
    }));
  };
  
  // Handle save block (create or edit)
  const handleSaveBlock = async (block: Block, isNew: boolean) => {
    try {
      await blockService.saveBlock(block);
      
      // Refresh blocks
      await loadBlocks();
      
      // Close modal
      setState(prev => ({ 
        ...prev, 
        isCreateModalOpen: false,
        editingBlockId: null
      }));
      
      // Notify parent if needed
      if (isNew) {
        onCreateBlock?.(block);
      }
      
      // Show success toast
    } catch (error) {
      console.error('Failed to save block:', error);
      // Show error toast
    }
  };
  
  // Handle close block detail
  const handleCloseDetail = () => {
    setState(prev => ({
      ...prev,
      isBlockDetailOpen: false,
      currentBlockId: null
    }));
  };
  
  // Get current block for detail view
  const currentBlock = useMemo(() => {
    return blocks.find(block => block.id === state.currentBlockId) || null;
  }, [blocks, state.currentBlockId]);
  
  // Get selected blocks
  const selectedBlocks = useMemo(() => {
    return blocks.filter(block => state.selectedBlockIds.includes(block.id));
  }, [blocks, state.selectedBlockIds]);
  
  // Render
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">Block Library</h1>
          
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <ViewToggle 
              value={state.view}
              onChange={handleViewChange}
            />
            
            {/* Create new button */}
            <Button 
              variant="primary"
              onClick={handleCreateNew}
              icon={<PlusIcon />}
            >
              Create New
            </Button>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <FilterPanel
          filter={state.currentFilter}
          onChange={handleFilterChange}
          blockTypes={blockTypes}
          collections={collections}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Bulk actions */}
            <BulkActions
              selectedCount={state.selectedBlockIds.length}
              onDelete={handleBulkDelete}
              onFavorite={() => handleBulkFavorite(true)}
              onUnfavorite={() => handleBulkFavorite(false)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort order */}
            <SortOrderSelector
              value={state.sortOrder}
              onChange={handleSortChange}
            />
            
            {/* Results count */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {totalCount} block{totalCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {/* Block list */}
        <div className="overflow-auto h-full p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="lg" />
            </div>
          ) : blocks.length === 0 ? (
            <EmptyState
              icon={<BoxIcon className="w-12 h-12" />}
              title="No blocks found"
              description="Try adjusting your filters or create a new block."
              action={
                <Button 
                  variant="primary" 
                  onClick={handleCreateNew}
                  icon={<PlusIcon />}
                >
                  Create New Block
                </Button>
              }
            />
          ) : state.view === 'grid' ? (
            <BlockGrid
              blocks={blocks}
              selectedIds={state.selectedBlockIds}
              onSelect={handleBlockSelect}
              onClick={handleBlockClick}
              onInsert={handleInsertBlock}
              onFavoriteToggle={handleFavoriteToggle}
              onEdit={handleEditBlock}
            />
          ) : (
            <BlockList
              blocks={blocks}
              selectedIds={state.selectedBlockIds}
              onSelect={handleBlockSelect}
              onClick={handleBlockClick}
              onInsert={handleInsertBlock}
              onFavoriteToggle={handleFavoriteToggle}
              onEdit={handleEditBlock}
              sortOrder={state.sortOrder}
              onSortChange={handleSortChange}
            />
          )}
        </div>
      </div>
      
      {/* Block detail drawer */}
      {state.isBlockDetailOpen && currentBlock && (
        <BlockDetailDrawer
          block={currentBlock}
          onClose={handleCloseDetail}
          onInsert={() => handleInsertBlock(currentBlock)}
          onEdit={() => handleEditBlock(currentBlock.id)}
          onFavoriteToggle={(isFavorite) => 
            handleFavoriteToggle(currentBlock.id, isFavorite)
          }
          blockTypes={blockTypes}
        />
      )}
      
      {/* Create/Edit modal */}
      {state.isCreateModalOpen && (
        <BlockEditorModal
          blockId={state.editingBlockId}
          blockTypes={blockTypes}
          onSave={handleSaveBlock}
          onCancel={() => setState(prev => ({ 
            ...prev, 
            isCreateModalOpen: false,
            editingBlockId: null
          }))}
        />
      )}
    </div>
  );
};
```

### 2. Filter Panel Component

```tsx
interface FilterPanelProps {
  filter: FilterCriteria;
  onChange: (filter: Partial<FilterCriteria>) => void;
  blockTypes: BlockType[];
  collections: Collection[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onChange,
  blockTypes,
  collections
}) => {
  // State for expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    types: true,
    collections: false,
    tags: false,
    date: false
  });
  
  // Toggle section expanded state
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Clear all filters
  const handleClearAll = () => {
    onChange({
      query: '',
      typeIds: undefined,
      collections: undefined,
      tags: undefined,
      favorite: undefined,
      dateRange: undefined
    });
  };
  
  // Get available tags from all block types
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  useEffect(() => {
    const loadTags = async () => {
      const blockService = await import('../services/block-service').then(m => m.blockService);
      const blocks = await blockService.getAllBlocks();
      
      // Extract unique tags
      const tags = new Set<string>();
      blocks.forEach(block => {
        if (block.tags) {
          block.tags.forEach(tag => tags.add(tag));
        }
      });
      
      setAvailableTags(Array.from(tags).sort());
    };
    
    loadTags();
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div>
        <SearchBox
          value={filter.query || ''}
          onChange={(value) => onChange({ query: value })}
          placeholder="Search blocks..."
        />
      </div>
      
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</h3>
        
        {/* Only show clear button if we have any filters applied */}
        {(filter.typeIds?.length || filter.collections?.length || filter.tags?.length || 
         filter.favorite || filter.dateRange) && (
          <button
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            onClick={handleClearAll}
          >
            Clear all
          </button>
        )}
      </div>
      
      {/* Active filters */}
      {(filter.typeIds?.length || filter.collections?.length || filter.tags?.length || 
        filter.favorite || filter.dateRange) && (
        <div className="flex flex-wrap gap-2">
          {filter.favorite && (
            <Chip 
              label="Favorites" 
              icon={<StarIcon className="w-3 h-3" />} 
              onRemove={() => onChange({ favorite: undefined })}
            />
          )}
          
          {filter.typeIds?.map(typeId => {
            const type = blockTypes.find(t => t.id === typeId);
            return (
              <Chip
                key={typeId}
                label={type?.name || typeId}
                onRemove={() => onChange({ 
                  typeIds: filter.typeIds?.filter(id => id !== typeId) 
                })}
              />
            );
          })}
          
          {filter.collections?.map(collectionId => {
            const collection = collections.find(c => c.id === collectionId);
            return (
              <Chip
                key={collectionId}
                label={collection?.name || collectionId}
                onRemove={() => onChange({ 
                  collections: filter.collections?.filter(id => id !== collectionId) 
                })}
              />
            );
          })}
          
          {filter.tags?.map(tag => (
            <Chip
              key={tag}
              label={tag}
              onRemove={() => onChange({ 
                tags: filter.tags?.filter(t => t !== tag) 
              })}
            />
          ))}
          
          {filter.dateRange && (
            <Chip
              label={`${formatDate(filter.dateRange[0])} - ${formatDate(filter.dateRange[1])}`}
              onRemove={() => onChange({ dateRange: undefined })}
            />
          )}
        </div>
      )}
      
      {/* Filter sections */}
      <div className="space-y-2">
        {/* Type filter */}
        <FilterSection
          title="Block Types"
          isExpanded={expandedSections.types}
          onToggle={() => toggleSection('types')}
        >
          <div className="grid grid-cols-2 gap-2">
            {blockTypes.map(type => (
              <Checkbox
                key={type.id}
                label={type.name}
                checked={filter.typeIds?.includes(type.id) || false}
                onChange={(checked) => {
                  const currentTypes = filter.typeIds || [];
                  onChange({
                    typeIds: checked
                      ? [...currentTypes, type.id]
                      : currentTypes.filter(id => id !== type.id)
                  });
                }}
              />
            ))}
          </div>
        </FilterSection>
        
        {/* Collections filter */}
        <FilterSection
          title="Collections"
          isExpanded={expandedSections.collections}
          onToggle={() => toggleSection('collections')}
        >
          <div className="grid grid-cols-2 gap-2">
            {collections.map(collection => (
              <Checkbox
                key={collection.id}
                label={collection.name}
                checked={filter.collections?.includes(collection.id) || false}
                onChange={(checked) => {
                  const currentCollections = filter.collections || [];
                  onChange({
                    collections: checked
                      ? [...currentCollections, collection.id]
                      : currentCollections.filter(id => id !== collection.id)
                  });
                }}
              />
            ))}
          </div>
        </FilterSection>
        
        {/* Tags filter */}
        <FilterSection
          title="Tags"
          isExpanded={expandedSections.tags}
          onToggle={() => toggleSection('tags')}
        >
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                className={`px-2 py-1 rounded-full text-xs ${
                  filter.tags?.includes(tag)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => {
                  const currentTags = filter.tags || [];
                  onChange({
                    tags: currentTags.includes(tag)
                      ? currentTags.filter(t => t !== tag)
                      : [...currentTags, tag]
                  });
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </FilterSection>
        
        {/* Favorite filter */}
        <div className="px-2">
          <Checkbox
            label="Favorites only"
            checked={!!filter.favorite}
            onChange={(checked) => onChange({ favorite: checked || undefined })}
          />
        </div>
        
        {/* Date range filter */}
        <FilterSection
          title="Date Range"
          isExpanded={expandedSections.date}
          onToggle={() => toggleSection('date')}
        >
          <div className="space-y-2">
            <DateRangePicker
              value={filter.dateRange}
              onChange={(range) => onChange({ dateRange: range })}
            />
          </div>
        </FilterSection>
      </div>
    </div>
  );
};
```

### 3. Block Grid Component

```tsx
interface BlockGridProps {
  blocks: Block[];
  selectedIds: string[];
  onSelect: (block: Block, isMultiSelect: boolean) => void;
  onClick: (block: Block) => void;
  onInsert: (block: Block) => void;
  onFavoriteToggle: (blockId: string, isFavorite: boolean) => void;
  onEdit: (blockId: string) => void;
}

const BlockGrid: React.FC<BlockGridProps> = ({
  blocks,
  selectedIds,
  onSelect,
  onClick,
  onInsert,
  onFavoriteToggle,
  onEdit
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {blocks.map(block => (
        <BlockCard
          key={block.id}
          block={block}
          isSelected={selectedIds.includes(block.id)}
          onSelect={(isMultiSelect) => onSelect(block, isMultiSelect)}
          onClick={() => onClick(block)}
          onInsert={() => onInsert(block)}
          onFavoriteToggle={(isFavorite) => onFavoriteToggle(block.id, isFavorite)}
          onEdit={() => onEdit(block.id)}
        />
      ))}
    </div>
  );
};

interface BlockCardProps {
  block: Block;
  isSelected: boolean;
  onSelect: (isMultiSelect: boolean) => void;
  onClick: () => void;
  onInsert: () => void;
  onFavoriteToggle: (isFavorite: boolean) => void;
  onEdit: () => void;
}

const BlockCard: React.FC<BlockCardProps> = ({
  block,
  isSelected,
  onSelect,
  onClick,
  onInsert,
  onFavoriteToggle,
  onEdit
}) => {
  // Get Icon component
  const Icon = block.icon 
    ? lucideIcons[block.icon as keyof typeof lucideIcons] 
    : FileTextIcon;
  
  return (
    <div 
      className={`relative border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
        isSelected
          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={() => onClick()}
    >
      {/* Selection checkbox */}
      <div 
        className="absolute top-2 left-2 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(e.ctrlKey || e.metaKey || e.shiftKey);
        }}
      >
        <Checkbox checked={isSelected} onChange={() => {}} />
      </div>
      
      {/* Favorite button */}
      <div 
        className="absolute top-2 right-2 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle(!block.favorite);
        }}
      >
        <button className="p-1 text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300">
          {block.favorite ? (
            <StarIcon className="w-5 h-5 fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" />
          ) : (
            <StarIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Card content */}
      <div className="p-4 pt-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-medium truncate">{block.name}</h3>
        </div>
        
        {block.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
            {block.description}
          </p>
        )}
        
        {/* Preview content */}
        <div className="mb-4 mt-2">
          <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">
            Content Preview
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 h-16 overflow-hidden text-sm text-gray-600 dark:text-gray-300">
            {block.content}
          </div>
        </div>
        
        {/* Tags */}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {block.tags.map(tag => (
              <span 
                key={tag} 
                className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div>Used {block.usage_count || 0} times</div>
          <div>{formatDistanceToNow(new Date(block.updated))} ago</div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="flex-1"
          >
            Edit
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onInsert();
            }}
            className="flex-1"
          >
            Insert
          </Button>
        </div>
      </div>
    </div>
  );
};
```

### 4. Block List Component

```tsx
interface BlockListProps {
  blocks: Block[];
  selectedIds: string[];
  onSelect: (block: Block, isMultiSelect: boolean) => void;
  onClick: (block: Block) => void;
  onInsert: (block: Block) => void;
  onFavoriteToggle: (blockId: string, isFavorite: boolean) => void;
  onEdit: (blockId: string) => void;
  sortOrder: SortOrder;
  onSortChange: (field: SortOrder['field']) => void;
}

const BlockList: React.FC<BlockListProps> = ({
  blocks,
  selectedIds,
  onSelect,
  onClick,
  onInsert,
  onFavoriteToggle,
  onEdit,
  sortOrder,
  onSortChange
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <th className="p-2 text-left w-10">
              <Checkbox 
                checked={selectedIds.length > 0 && selectedIds.length === blocks.length}
                indeterminate={selectedIds.length > 0 && selectedIds.length < blocks.length}
                onChange={(checked) => {
                  // Select/deselect all
                  if (checked) {
                    blocks.forEach(block => {
                      if (!selectedIds.includes(block.id)) {
                        onSelect(block, true);
                      }
                    });
                  } else {
                    // Deselect all - just pass the first block to clear
                    if (blocks.length > 0) {
                      onSelect(blocks[0], true);
                    }
                  }
                }}
              />
            </th>
            <th className="p-2 text-left w-10"></th>
            <th 
              className="p-2 text-left cursor-pointer"
              onClick={() => onSortChange('name')}
            >
              <div className="flex items-center gap-1">
                Name
                {sortOrder.field === 'name' && (
                  sortOrder.direction === 'asc' 
                    ? <ArrowUpIcon className="w-4 h-4" />
                    : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Tags</th>
            <th 
              className="p-2 text-left cursor-pointer"
              onClick={() => onSortChange('usage_count')}
            >
              <div className="flex items-center gap-1">
                Usage
                {sortOrder.field === 'usage_count' && (
                  sortOrder.direction === 'asc' 
                    ? <ArrowUpIcon className="w-4 h-4" />
                    : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th 
              className="p-2 text-left cursor-pointer"
              onClick={() => onSortChange('updated')}
            >
              <div className="flex items-center gap-1">
                Updated
                {sortOrder.field === 'updated' && (
                  sortOrder.direction === 'asc' 
                    ? <ArrowUpIcon className="w-4 h-4" />
                    : <ArrowDownIcon className="w-4 h-4" />
                )}
              </div>
            </th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map(block => (
            <tr 
              key={block.id}
              className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                selectedIds.includes(block.id) 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : ''
              }`}
              onClick={() => onClick(block)}
            >
              <td className="p-2">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(block, e.ctrlKey || e.metaKey || e.shiftKey);
                  }}
                >
                  <Checkbox checked={selectedIds.includes(block.id)} onChange={() => {}} />
                </div>
              </td>
              <td className="p-2">
                <button 
                  className="p-1 text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(block.id, !block.favorite);
                  }}
                >
                  {block.favorite ? (
                    <StarIcon className="w-5 h-5 fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" />
                  ) : (
                    <StarIcon className="w-5 h-5" />
                  )}
                </button>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <Icon name={block.icon || 'file-text'} className="w-5 h-5" />
                  <span className="font-medium">{block.name}</span>
                </div>
              </td>
              <td className="p-2">{block.typeId}</td>
              <td className="p-2">
                {block.tags && block.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
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
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">No tags</span>
                )}
              </td>
              <td className="p-2">{block.usage_count || 0}</td>
              <td className="p-2">{formatDistanceToNow(new Date(block.updated))} ago</td>
              <td className="p-2 text-right whitespace-nowrap">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(block.id);
                  }}
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onInsert(block);
                  }}
                >
                  Insert
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 5. Block Editor Modal

```tsx
interface BlockEditorModalProps {
  blockId?: string | null;
  blockTypes: BlockType[];
  onSave: (block: Block, isNew: boolean) => void;
  onCancel: () => void;
}

const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  blockId,
  blockTypes,
  onSave,
  onCancel
}) => {
  // State
  const [block, setBlock] = useState<Partial<Block>>({
    name: '',
    description: '',
    content: '',
    typeId: '',
    tags: [],
    icon: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get block service
  const blockService = useBlockService();
  
  // Load block if editing
  useEffect(() => {
    if (blockId) {
      setIsLoading(true);
      
      blockService.getBlock(blockId)
        .then(existingBlock => {
          if (existingBlock) {
            setBlock(existingBlock);
          }
        })
        .catch(error => {
          console.error('Failed to load block:', error);
          // Show error toast
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [blockId]);
  
  // Handle input change
  const handleInputChange = (field: keyof Block, value: any) => {
    setBlock(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Handle tags change
  const handleTagsChange = (tags: string[]) => {
    setBlock(prev => ({ ...prev, tags }));
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!block.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!block.typeId) {
      newErrors.typeId = 'Block type is required';
    }
    
    if (!block.content?.trim()) {
      newErrors.content = 'Content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;
    
    const isNew = !blockId;
    const now = Date.now();
    
    const completeBlock: Block = {
      id: blockId || crypto.randomUUID(),
      name: block.name!,
      description: block.description || '',
      content: block.content!,
      typeId: block.typeId!,
      tags: block.tags || [],
      icon: block.icon || '',
      created: isNew ? now : (block.created || now),
      updated: now,
      favorite: block.favorite || false,
      usage_count: block.usage_count || 0,
      last_used: block.last_used || 0,
      is_system: false
    };
    
    onSave(completeBlock, isNew);
  };
  
  return (
    <Modal
      title={blockId ? 'Edit Block' : 'Create New Block'}
      onClose={onCancel}
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Block details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={block.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Block Type</Label>
              <Select
                id="type"
                value={block.typeId || ''}
                onChange={(value) => handleInputChange('typeId', value)}
                error={errors.typeId}
              >
                <option value="">Select a type</option>
                {blockTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <IconPicker
                value={block.icon || ''}
                onChange={(icon) => handleInputChange('icon', icon)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                value={block.tags || []}
                onChange={handleTagsChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={block.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={block.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={10}
              error={errors.content}
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {blockId ? 'Save Changes' : 'Create Block'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
```

### 6. Block Detail Drawer

```tsx
interface BlockDetailDrawerProps {
  block: Block;
  onClose: () => void;
  onInsert: () => void;
  onEdit: () => void;
  onFavoriteToggle: (isFavorite: boolean) => void;
  blockTypes: BlockType[];
}

const BlockDetailDrawer: React.FC<BlockDetailDrawerProps> = ({
  block,
  onClose,
  onInsert,
  onEdit,
  onFavoriteToggle,
  blockTypes
}) => {
  // Find block type
  const blockType = blockTypes.find(type => type.id === block.typeId);
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md flex flex-col h-full shadow-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Block Details</h2>
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-6">
            {/* Block header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Icon name={block.icon || 'file-text'} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">{block.name}</h3>
                  {blockType && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {blockType.name}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                className="p-2 text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300"
                onClick={() => onFavoriteToggle(!block.favorite)}
              >
                {block.favorite ? (
                  <StarIcon className="w-6 h-6 fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" />
                ) : (
                  <StarIcon className="w-6 h-6" />
                )}
              </button>
            </div>
            
            {/* Description */}
            {block.description && (
              <div>
                <h4 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Description
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {block.description}
                </p>
              </div>
            )}
            
            {/* Content */}
            <div>
              <h4 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">
                Content
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-60">
                <pre className="text-sm whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                  {block.content}
                </pre>
              </div>
            </div>
            
            {/* Tags */}
            {block.tags && block.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {block.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 text-sm rounded bg-gray-200 dark:bg-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Metadata */}
            <div>
              <h4 className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">
                Metadata
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>{' '}
                  <span>{format(new Date(block.created), 'PPP')}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Updated:</span>{' '}
                  <span>{format(new Date(block.updated), 'PPP')}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Used:</span>{' '}
                  <span>{block.usage_count || 0} times</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Last used:</span>{' '}
                  <span>
                    {block.last_used
                      ? formatDistanceToNow(new Date(block.last_used)) + ' ago'
                      : 'Never'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">System block:</span>{' '}
                  <span>{block.is_system ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Favorite:</span>{' '}
                  <span>{block.favorite ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <Button 
            variant="outline" 
            onClick={onEdit}
            className="flex-1"
          >
            Edit
          </Button>
          <Button 
            variant="primary" 
            onClick={onInsert}
            className="flex-1"
          >
            Insert Block
          </Button>
        </div>
      </div>
    </div>
  );
};
```

## Implementation Steps

### Step 1: Create the UI Components

1. Start with basic UI elements like buttons, inputs, checkboxes, etc.
2. Create filter panel with search and filtering options
3. Implement the block grid and list views
4. Build the block detail drawer
5. Create the block editor modal

### Step 2: Implement Block Management Operations

```typescript
// Hook for block operations
export function useBlockOperations() {
  const blockService = useBlockService();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Delete blocks
  const deleteBlocks = async (blockIds: string[]): Promise<boolean> => {
    if (!blockIds.length) return true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all(blockIds.map(id => blockService.deleteBlock(id)));
      return true;
    } catch (err) {
      setError('Failed to delete blocks. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update blocks
  const updateBlocksProperty = async <K extends keyof Block>(
    blockIds: string[], 
    property: K, 
    value: Block[K]
  ): Promise<boolean> => {
    if (!blockIds.length) return true;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all(
        blockIds.map(async id => {
          const block = await blockService.getBlock(id);
          if (block) {
            await blockService.saveBlock({
              ...block,
              [property]: value,
              updated: Date.now()
            });
          }
        })
      );
      return true;
    } catch (err) {
      setError(`Failed to update blocks. Please try again.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export blocks
  const exportBlocks = async (blockIds: string[]): Promise<Blob | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!blockIds.length) {
        // Export all blocks
        return await blockService.exportAllBlocks();
      } else {
        // Export selected blocks
        return await blockService.exportBlocks(blockIds);
      }
    } catch (err) {
      setError('Failed to export blocks. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    deleteBlocks,
    updateBlocksProperty,
    exportBlocks,
    isLoading,
    error
  };
}
```

### Step 3: Implement Bulk Operations UI

```tsx
interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onFavorite: () => void;
  onUnfavorite: () => void;
  onExport?: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onDelete,
  onFavorite,
  onUnfavorite,
  onExport
}) => {
  if (selectedCount === 0) {
    return <div className="text-sm text-gray-500">Select blocks to perform actions</div>;
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      
      <div className="h-4 border-r border-gray-300 dark:border-gray-600" />
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onFavorite}
        title="Add to favorites"
      >
        <StarIcon className="w-4 h-4 mr-1" />
        Favorite
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onUnfavorite}
        title="Remove from favorites"
      >
        <StarOffIcon className="w-4 h-4 mr-1" />
        Unfavorite
      </Button>
      
      {onExport && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onExport}
          title="Export selected blocks"
        >
          <DownloadIcon className="w-4 h-4 mr-1" />
          Export
        </Button>
      )}
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onDelete}
        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        title="Delete selected blocks"
      >
        <TrashIcon className="w-4 h-4 mr-1" />
        Delete
      </Button>
    </div>
  );
};
```

### Step 4: Implement Drag and Drop for Block Ordering

```typescript
// Using react-beautiful-dnd for drag and drop functionality
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

// Add to Block Grid component
const BlockGridWithDnd: React.FC<BlockGridProps> = (props) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const reorderedBlocks = Array.from(props.blocks);
    const [removed] = reorderedBlocks.splice(result.source.index, 1);
    reorderedBlocks.splice(result.destination.index, 0, removed);
    
    // Call onReorder callback with new order
    props.onReorder?.(reorderedBlocks);
  };
  
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="blocks" direction="horizontal">
        {(provided) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {props.blocks.map((block, index) => (
              <Draggable key={block.id} draggableId={block.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <BlockCard
                      block={block}
                      isSelected={props.selectedIds.includes(block.id)}
                      onSelect={(isMultiSelect) => props.onSelect(block, isMultiSelect)}
                      onClick={() => props.onClick(block)}
                      onInsert={() => props.onInsert(block)}
                      onFavoriteToggle={(isFavorite) => props.onFavoriteToggle(block.id, isFavorite)}
                      onEdit={() => props.onEdit(block.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### Step 5: Implement Import/Export Functionality

```tsx
// Add to BlockExplorer component
const handleExportSelected = async () => {
  if (!state.selectedBlockIds.length) return;
  
  try {
    const blob = await blockService.exportBlocks(state.selectedBlockIds);
    if (blob) {
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blocks-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to export blocks:', error);
    // Show error toast
  }
};

const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  try {
    await blockService.importBlocks(file);
    // Refresh blocks
    await loadBlocks();
    // Show success toast
  } catch (error) {
    console.error('Failed to import blocks:', error);
    // Show error toast
  }
  
  // Reset file input
  event.target.value = '';
};

// Add to UI
<div className="flex items-center gap-2">
  <Button 
    variant="outline" 
    onClick={() => document.getElementById('import-file')?.click()}
  >
    <UploadIcon className="w-4 h-4 mr-1" />
    Import
  </Button>
  <input
    id="import-file"
    type="file"
    accept=".json"
    className="hidden"
    onChange={handleImport}
  />
  
  <Button 
    variant="outline" 
    onClick={handleExportAll}
  >
    <DownloadIcon className="w-4 h-4 mr-1" />
    Export All
  </Button>
</div>
```

## Testing

### Unit Tests for Block Explorer Components

```typescript
describe('BlockExplorer', () => {
  const mockOnInsertBlock = jest.fn();
  const mockOnCreateBlock = jest.fn();
  
  const mockBlocks = [
    {
      id: 'block1',
      name: 'Test Block 1',
      description: 'Description 1',
      content: 'Content 1',
      typeId: 'type1',
      tags: ['tag1', 'tag2'],
      created: Date.now(),
      updated: Date.now(),
      favorite: false,
      usage_count: 5,
      last_used: Date.now() - 86400000,
      is_system: false,
      icon: 'file-text'
    },
    // More blocks...
  ];
  
  const mockBlockTypes = [
    {
      id: 'type1',
      name: 'Type 1',
      description: 'Description 1',
      icon: 'user',
      is_system: true
    },
    // More types...
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock services
    jest.mock('../hooks/useBlockService', () => ({
      useBlockService: () => ({
        getBlockTypes: jest.fn().mockResolvedValue(mockBlockTypes),
        getCollections: jest.fn().mockResolvedValue([]),
        getBlocksWithFilters: jest.fn().mockResolvedValue(mockBlocks),
        deleteBlock: jest.fn().mockResolvedValue(undefined),
        toggleFavorite: jest.fn().mockResolvedValue(undefined),
        saveBlock: jest.fn().mockResolvedValue(undefined),
        getBlock: jest.fn().mockImplementation((id) => 
          Promise.resolve(mockBlocks.find(block => block.id === id))
        ),
        exportBlocks: jest.fn().mockResolvedValue(new Blob()),
        exportAllBlocks: jest.fn().mockResolvedValue(new Blob()),
        importBlocks: jest.fn().mockResolvedValue(undefined)
      })
    }));
    
    jest.mock('../hooks/useSearchService', () => ({
      useSearchService: () => ({
        search: jest.fn().mockResolvedValue({
          items: mockBlocks.map(block => ({ block, score: 1, matches: [] })),
          total: mockBlocks.length,
          query: ''
        })
      })
    }));
  });
  
  test('renders grid view by default', async () => {
    render(
      <BlockExplorer
        onInsertBlock={mockOnInsertBlock}
        onCreateBlock={mockOnCreateBlock}
      />
    );
    
    // Wait for blocks to load
    await waitFor(() => {
      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
    });
    
    // Check if grid view is rendered
    expect(screen.getByTestId('block-grid')).toBeInTheDocument();
  });
  
  test('switches to list view when toggled', async () => {
    render(
      <BlockExplorer
        onInsertBlock={mockOnInsertBlock}
        onCreateBlock={mockOnCreateBlock}
      />
    );
    
    // Wait for blocks to load
    await waitFor(() => {
      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
    });
    
    // Click list view button
    fireEvent.click(screen.getByTitle('List view'));
    
    // Check if list view is rendered
    expect(screen.getByTestId('block-list')).toBeInTheDocument();
  });
  
  test('selects blocks when checkbox is clicked', async () => {
    render(
      <BlockExplorer
        onInsertBlock={mockOnInsertBlock}
        onCreateBlock={mockOnCreateBlock}
      />
    );
    
    // Wait for blocks to load
    await waitFor(() => {
      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
    });
    
    // Click checkbox
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    
    // Check if bulk actions are shown
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
  
  test('shows block detail drawer when block is clicked', async () => {
    render(
      <BlockExplorer
        onInsertBlock={mockOnInsertBlock}
        onCreateBlock={mockOnCreateBlock}
      />
    );
    
    // Wait for blocks to load
    await waitFor(() => {
      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
    });
    
    // Click block
    fireEvent.click(screen.getByText('Test Block 1'));
    
    // Check if drawer is shown
    expect(screen.getByText('Block Details')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });
  
  // More tests...
});
```

### Keyboard Shortcut Tests

```typescript
describe('BlockExplorer Keyboard Shortcuts', () => {
  test('deletes selected blocks when Delete key is pressed', async () => {
    const deleteBlocksMock = jest.fn().mockResolvedValue(true);
    
    jest.mock('../hooks/useBlockOperations', () => ({
      useBlockOperations: () => ({
        deleteBlocks: deleteBlocksMock,
        updateBlocksProperty: jest.fn(),
        exportBlocks: jest.fn(),
        isLoading: false,
        error: null
      })
    }));
    
    render(
      <BlockExplorer
        onInsertBlock={jest.fn()}
        onCreateBlock={jest.fn()}
      />
    );
    
    // Wait for blocks to load
    await waitFor(() => {
      expect(screen.getByText('Test Block 1')).toBeInTheDocument();
    });
    
    // Select a block
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    
    // Press Delete key
    fireEvent.keyDown(document.body, { key: 'Delete' });
    
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockReturnValue(true);
    
    // Check if deleteBlocks was called
    expect(deleteBlocksMock).toHaveBeenCalled();
  });
  
  // More keyboard shortcut tests...
});
```

## Integration with Other Components

### How the Block Explorer is Used

- **Core Data Layer**: Retrieves and manipulates blocks and block types through the block service
- **Search Engine**: Uses the search service for filtering blocks with search query
- **Command Palette**: Shares UI components and block operations
- **Editor Integration**: Allows inserting blocks directly into the editor
- **Template System**: Facilitates creating templates from existing blocks

## Implementation Considerations

1. **Performance**: Use virtualization for large block collections, implement pagination for list view
2. **Mobile Responsiveness**: Adapt UI for mobile devices, consider using a mobile-optimized layout
3. **Keyboard Navigation**: Implement comprehensive keyboard shortcuts for power users
4. **Accessibility**: Ensure proper ARIA attributes, focus management, and screen reader support
5. **Offline Support**: Handle saving and loading blocks in offline mode through the core data layer