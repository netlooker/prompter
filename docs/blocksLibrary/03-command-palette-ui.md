# Command Palette UI

## Overview

The Command Palette UI provides a keyboard-focused modal interface for quickly accessing and inserting blocks. It implements a two-level navigation system (block types → blocks) and prioritizes efficient keyboard interactions for power users. The Command Palette can be activated globally via a keyboard shortcut and provides real-time search filtering.

## Key Components

### 1. Command Palette Container

#### Interface and Props
```typescript
export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertBlock: (block: Block) => void;
}

export interface CommandPaletteState {
  view: 'types' | 'blocks';
  selectedTypeId: string | null;
  selectedBlockIndex: number;
  searchQuery: string;
  filteredBlocks: Block[];
}
```

#### Component Structure
```tsx
export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onInsertBlock 
}) => {
  // State
  const [state, setState] = useState<CommandPaletteState>({
    view: 'types',
    selectedTypeId: null,
    selectedBlockIndex: 0,
    searchQuery: '',
    filteredBlocks: []
  });
  
  // Services
  const blockService = useBlockService();
  const searchService = useSearchService();
  
  // Data
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [recentBlocks, setRecentBlocks] = useState<Block[]>([]);
  const [favoriteBlocks, setFavoriteBlocks] = useState<Block[]>([]);
  
  // Refs for keyboard navigation
  const typeListRef = useRef<HTMLDivElement>(null);
  const blockListRef = useRef<HTMLDivElement>(null);
  
  // Load data
  useEffect(() => {
    if (isOpen) {
      loadBlockTypes();
      loadRecentBlocks();
      loadFavoriteBlocks();
    }
  }, [isOpen]);
  
  // Load block types
  const loadBlockTypes = async () => {
    const types = await blockService.getBlockTypes();
    setBlockTypes(types);
  };
  
  // Load blocks for selected type
  const loadBlocksForType = async (typeId: string) => {
    const typeBlocks = await blockService.getBlocksByType(typeId);
    setBlocks(typeBlocks);
    setState(prev => ({
      ...prev,
      selectedTypeId: typeId,
      view: 'blocks',
      selectedBlockIndex: 0,
      searchQuery: '',
      filteredBlocks: typeBlocks
    }));
  };
  
  // Load recent blocks
  const loadRecentBlocks = async () => {
    const recent = await blockService.getRecentBlocks(10);
    setRecentBlocks(recent);
  };
  
  // Load favorite blocks
  const loadFavoriteBlocks = async () => {
    const favorites = await blockService.getFavoriteBlocks();
    setFavoriteBlocks(favorites);
  };
  
  // Handle type selection
  const handleTypeSelect = (typeId: string) => {
    loadBlocksForType(typeId);
  };
  
  // Handle special list selection
  const handleSpecialListSelect = (listType: 'recent' | 'favorites') => {
    const listBlocks = listType === 'recent' ? recentBlocks : favoriteBlocks;
    setBlocks(listBlocks);
    setState(prev => ({
      ...prev,
      selectedTypeId: listType,
      view: 'blocks',
      selectedBlockIndex: 0,
      searchQuery: '',
      filteredBlocks: listBlocks
    }));
  };
  
  // Handle block selection
  const handleBlockSelect = (block: Block) => {
    onInsertBlock(block);
    blockService.incrementBlockUsage(block.id);
    onClose();
  };
  
  // Handle search
  const handleSearch = async (query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
    
    if (!query.trim()) {
      setState(prev => ({ ...prev, filteredBlocks: blocks }));
      return;
    }
    
    // Search within current type
    const searchOptions = {
      types: state.selectedTypeId ? [state.selectedTypeId] : undefined,
      includeTags: true,
      includeContent: true
    };
    
    const results = await searchService.search(query, searchOptions);
    setState(prev => ({ 
      ...prev, 
      filteredBlocks: results.items.map(item => item.block),
      selectedBlockIndex: 0
    }));
  };
  
  // Handle back to types
  const handleBackToTypes = () => {
    setState(prev => ({
      ...prev,
      view: 'types',
      selectedTypeId: null,
      searchQuery: '',
      filteredBlocks: []
    }));
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setState(prev => ({
          ...prev,
          selectedBlockIndex: Math.max(0, prev.selectedBlockIndex - 1)
        }));
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        const maxIndex = state.view === 'types' 
          ? blockTypes.length + 1 // +1 for Recent and Favorites
          : state.filteredBlocks.length - 1;
          
        setState(prev => ({
          ...prev,
          selectedBlockIndex: Math.min(maxIndex, prev.selectedBlockIndex + 1)
        }));
        break;
        
      case 'Enter':
        e.preventDefault();
        if (state.view === 'types') {
          if (state.selectedBlockIndex === 0) {
            // Recent blocks
            handleSpecialListSelect('recent');
          } else if (state.selectedBlockIndex === 1) {
            // Favorite blocks
            handleSpecialListSelect('favorites');
          } else {
            // Regular block type
            const typeIndex = state.selectedBlockIndex - 2;
            if (typeIndex >= 0 && typeIndex < blockTypes.length) {
              handleTypeSelect(blockTypes[typeIndex].id);
            }
          }
        } else {
          // Block selection
          if (state.selectedBlockIndex >= 0 && state.selectedBlockIndex < state.filteredBlocks.length) {
            handleBlockSelect(state.filteredBlocks[state.selectedBlockIndex]);
          }
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        if (state.view === 'blocks') {
          handleBackToTypes();
        } else {
          onClose();
        }
        break;
        
      case 'ArrowLeft':
        if (state.view === 'blocks') {
          e.preventDefault();
          handleBackToTypes();
        }
        break;
        
      case 'ArrowRight':
        if (state.view === 'types' && state.selectedBlockIndex >= 0) {
          e.preventDefault();
          if (state.selectedBlockIndex === 0) {
            handleSpecialListSelect('recent');
          } else if (state.selectedBlockIndex === 1) {
            handleSpecialListSelect('favorites');
          } else {
            const typeIndex = state.selectedBlockIndex - 2;
            if (typeIndex >= 0 && typeIndex < blockTypes.length) {
              handleTypeSelect(blockTypes[typeIndex].id);
            }
          }
        }
        break;
        
      case 'f':
        // Toggle favorite if F key is pressed and a block is selected
        if (state.view === 'blocks' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          if (state.selectedBlockIndex >= 0 && state.selectedBlockIndex < state.filteredBlocks.length) {
            const block = state.filteredBlocks[state.selectedBlockIndex];
            blockService.toggleFavorite(block.id, !block.favorite);
            
            // Update the block in the list
            const updatedBlocks = [...state.filteredBlocks];
            updatedBlocks[state.selectedBlockIndex] = {
              ...block,
              favorite: !block.favorite
            };
            
            setState(prev => ({ ...prev, filteredBlocks: updatedBlocks }));
          }
        }
        break;
        
      default:
        break;
    }
  };
  
  // Effects for scrolling to selected item
  useEffect(() => {
    if (state.view === 'types' && typeListRef.current) {
      const selectedElement = typeListRef.current.querySelector(
        `[data-index="${state.selectedBlockIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    } else if (state.view === 'blocks' && blockListRef.current) {
      const selectedElement = blockListRef.current.querySelector(
        `[data-index="${state.selectedBlockIndex}"]`
      );
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [state.selectedBlockIndex, state.view]);
  
  // Render
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[70vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {state.view === 'types' ? 'Prompt Blocks' : state.selectedTypeId === 'recent' 
              ? 'Recent Blocks' 
              : state.selectedTypeId === 'favorites' 
                ? 'Favorite Blocks' 
                : blockTypes.find(t => t.id === state.selectedTypeId)?.name || 'Blocks'}
          </h2>
          <button 
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search (only in blocks view) */}
        {state.view === 'blocks' && (
          <div className="p-4 border-b">
            <SearchBox 
              value={state.searchQuery}
              onChange={handleSearch}
              placeholder="Search blocks..."
              autoFocus
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {state.view === 'types' ? (
            <div ref={typeListRef} className="py-2">
              {/* Special entries */}
              <TypeListItem
                icon="clock"
                name="Recent"
                description="Recently used blocks"
                isSelected={state.selectedBlockIndex === 0}
                onClick={() => handleSpecialListSelect('recent')}
                dataIndex={0}
              />
              <TypeListItem
                icon="star"
                name="Favorites"
                description="Your favorite blocks"
                isSelected={state.selectedBlockIndex === 1}
                onClick={() => handleSpecialListSelect('favorites')}
                dataIndex={1}
              />
              
              {/* Block types */}
              {blockTypes.map((type, index) => (
                <TypeListItem
                  key={type.id}
                  icon={type.icon}
                  name={type.name}
                  description={type.description}
                  isSelected={state.selectedBlockIndex === index + 2}
                  onClick={() => handleTypeSelect(type.id)}
                  dataIndex={index + 2}
                />
              ))}
            </div>
          ) : (
            <div ref={blockListRef} className="py-2">
              {state.filteredBlocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <SearchIcon className="w-8 h-8 mb-2" />
                  <p>No matching blocks found</p>
                </div>
              ) : (
                state.filteredBlocks.map((block, index) => (
                  <BlockListItem
                    key={block.id}
                    block={block}
                    isSelected={state.selectedBlockIndex === index}
                    onClick={() => handleBlockSelect(block)}
                    onFavoriteToggle={() => blockService.toggleFavorite(block.id, !block.favorite)}
                    searchQuery={state.searchQuery}
                    dataIndex={index}
                  />
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-3 border-t flex flex-wrap gap-2 text-sm text-gray-500">
          <KeyboardShortcut keys={['↑', '↓']} label="Navigate" />
          {state.view === 'types' ? (
            <>
              <KeyboardShortcut keys={['→', 'Enter']} label="Select" />
              <KeyboardShortcut keys={['Esc']} label="Close" />
            </>
          ) : (
            <>
              <KeyboardShortcut keys={['←']} label="Back" />
              <KeyboardShortcut keys={['Enter']} label="Insert" />
              <KeyboardShortcut keys={['F']} label="Favorite" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 2. Type List Item Component

```tsx
interface TypeListItemProps {
  icon: string;
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
  dataIndex: number;
}

const TypeListItem: React.FC<TypeListItemProps> = ({
  icon,
  name,
  description,
  isSelected,
  onClick,
  dataIndex
}) => {
  const Icon = icon ? lucideIcons[icon as keyof typeof lucideIcons] : Box;
  
  return (
    <div
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={onClick}
      data-index={dataIndex}
    >
      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{description}</div>
      </div>
      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
    </div>
  );
};
```

### 3. Block List Item Component

```tsx
interface BlockListItemProps {
  block: Block;
  isSelected: boolean;
  onClick: () => void;
  onFavoriteToggle: () => void;
  searchQuery: string;
  dataIndex: number;
}

const BlockListItem: React.FC<BlockListItemProps> = ({
  block,
  isSelected,
  onClick,
  onFavoriteToggle,
  searchQuery,
  dataIndex
}) => {
  const Icon = block.icon ? lucideIcons[block.icon as keyof typeof lucideIcons] : FileText;
  
  // Get highlights for search matches
  const highlightedName = searchQuery 
    ? highlightMatches(block.name, findPositions(block.name, searchQuery))
    : block.name;
    
  const highlightedDescription = searchQuery && block.description
    ? highlightMatches(block.description, findPositions(block.description, searchQuery))
    : block.description;
  
  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={onClick}
      data-index={dataIndex}
    >
      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{highlightedName}</div>
        {highlightedDescription && (
          <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {highlightedDescription}
          </div>
        )}
        {block.tags && block.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
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
      </div>
      <button
        className="p-1 text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300"
        onClick={e => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
      >
        {block.favorite ? (
          <StarIcon className="w-5 h-5 fill-yellow-400 text-yellow-400 dark:fill-yellow-300 dark:text-yellow-300" />
        ) : (
          <StarIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
```

### 4. Search Box Component

```tsx
interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="w-full px-10 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      {value && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={() => onChange('')}
        >
          <XIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
```

### 5. Keyboard Shortcut Helper Component

```tsx
interface KeyboardShortcutProps {
  keys: string[];
  label: string;
}

const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ keys, label }) => {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span>{label}:</span>
      <div className="flex gap-0.5">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">
              {key}
            </kbd>
            {index < keys.length - 1 && key !== '+' && keys[index + 1] !== '+' && (
              <span>/</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
```

### 6. Global Keyboard Shortcut Hook

```typescript
// Hook to listen for global keyboard shortcuts
export function useGlobalShortcut(
  shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean },
  callback: () => void,
  isEnabled = true
): void {
  useEffect(() => {
    if (!isEnabled) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlPressed = event.ctrlKey === !!shortcut.ctrl;
      const isShiftPressed = event.shiftKey === !!shortcut.shift;
      const isAltPressed = event.altKey === !!shortcut.alt;
      const isMetaPressed = event.metaKey === !!shortcut.meta;
      const isKeyPressed = event.key.toLowerCase() === shortcut.key.toLowerCase();
      
      if (isCtrlPressed && isShiftPressed && isAltPressed && isMetaPressed && isKeyPressed) {
        event.preventDefault();
        callback();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcut, callback, isEnabled]);
}

// Usage in main app component
export function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  useGlobalShortcut(
    { key: '/', ctrl: true },
    () => setIsCommandPaletteOpen(true)
  );
  
  return (
    <>
      {/* Other app content */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onInsertBlock={handleInsertBlock}
      />
    </>
  );
}
```

## Implementation Steps

### Step 1: Create Base UI Components

1. Start with creating the SearchBox, KeyboardShortcut, TypeListItem, and BlockListItem components
2. Implement styling with Tailwind CSS classes for responsive and dark mode support
3. Test rendering with mock data

### Step 2: Implement Focus Management

```typescript
export function useFocusTrap(isActive: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isActive || !ref.current) return;
    
    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    // Save previous active element to restore focus when closing
    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Focus first element
    setTimeout(() => {
      firstElement?.focus();
    }, 100);
    
    element.addEventListener('keydown', handleTabKey);
    
    return () => {
      element.removeEventListener('keydown', handleTabKey);
      // Restore focus when unmounting
      setTimeout(() => {
        previousActiveElement?.focus();
      }, 0);
    };
  }, [isActive]);
  
  return ref;
}
```

### Step 3: Implement Search Highlighting

```typescript
export function findPositions(text: string, query: string): [number, number][] {
  const positions: [number, number][] = [];
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  let pos = textLower.indexOf(queryLower);
  while (pos !== -1) {
    positions.push([pos, pos + queryLower.length]);
    pos = textLower.indexOf(queryLower, pos + 1);
  }
  
  return positions;
}

export function highlightMatches(text: string, positions: [number, number][]): React.ReactNode {
  if (!positions.length) return text;
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Sort positions
  const sortedPositions = [...positions].sort((a, b) => a[0] - b[0]);
  
  for (const [start, end] of sortedPositions) {
    // Text before match
    if (start > lastIndex) {
      result.push(text.substring(lastIndex, start));
    }
    
    // Highlighted match
    result.push(
      <span key={`${start}-${end}`} className="bg-yellow-200 dark:bg-yellow-700/50 rounded">
        {text.substring(start, end)}
      </span>
    );
    
    lastIndex = end;
  }
  
  // Text after last match
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
  return <>{result}</>;
}
```

### Step 4: Implement Animation

```typescript
// Import React Spring for animations
import { useTransition, animated } from 'react-spring';

// Modify CommandPalette render function
return (
  <div 
    className="fixed inset-0 z-50 flex items-center justify-center"
    onClick={onClose}
  >
    {/* Overlay animation */}
    {isOpen && (
      <animated.div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        style={overlayAnimation}
      />
    )}
    
    {/* Modal animation */}
    {transitions((style, item) => 
      item && (
        <animated.div 
          style={style}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-[70vh] flex flex-col relative z-10"
          onClick={e => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          ref={focusTrapRef}
        >
          {/* Content */}
        </animated.div>
      )
    )}
  </div>
);

// Animation configurations
const transitions = useTransition(isOpen, {
  from: { opacity: 0, transform: 'scale(0.95)' },
  enter: { opacity: 1, transform: 'scale(1)' },
  leave: { opacity: 0, transform: 'scale(0.95)' },
  config: { tension: 280, friction: 20 }
});

const overlayAnimation = useSpring({
  opacity: isOpen ? 1 : 0,
  config: { tension: 280, friction: 20 }
});
```

### Step 5: Connect to Block Library Services

```typescript
// Create a hook to access the Block Service
export function useBlockService() {
  const blockRepository = useBlockRepository();
  const eventService = useEventService();
  
  const getBlockTypes = useCallback(async () => {
    return blockRepository.getBlockTypes();
  }, [blockRepository]);
  
  const getBlocksByType = useCallback(async (typeId: string) => {
    return blockRepository.getBlocksByType(typeId);
  }, [blockRepository]);
  
  const getRecentBlocks = useCallback(async (limit: number) => {
    return blockRepository.getBlocksSortedBy('last_used', 'desc', limit);
  }, [blockRepository]);
  
  const getFavoriteBlocks = useCallback(async () => {
    return blockRepository.getBlocksWithFilters({ favorite: true });
  }, [blockRepository]);
  
  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    await blockRepository.markBlockAsFavorite(id, isFavorite);
    eventService.publish(
      isFavorite ? BlockLibraryEventType.BLOCK_FAVORITED : BlockLibraryEventType.BLOCK_UNFAVORITED,
      id
    );
  }, [blockRepository, eventService]);
  
  const incrementBlockUsage = useCallback(async (id: string) => {
    await blockRepository.incrementBlockUsage(id);
  }, [blockRepository]);
  
  return {
    getBlockTypes,
    getBlocksByType,
    getRecentBlocks,
    getFavoriteBlocks,
    toggleFavorite,
    incrementBlockUsage
  };
}
```

### Step 6: Implement Global Shortcut Activation

```typescript
// In your main app component
export function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const editorRef = useRef<EditorRef>(null);
  
  // Global shortcut to open command palette
  useGlobalShortcut(
    { key: '/', ctrl: true },
    () => setIsCommandPaletteOpen(true)
  );
  
  // Handle block insertion
  const handleInsertBlock = (block: Block) => {
    if (!editorRef.current) return;
    
    // Insert block content at cursor
    editorRef.current.insertTextAtCursor(block.content);
  };
  
  return (
    <>
      <Editor ref={editorRef} />
      
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onInsertBlock={handleInsertBlock}
      />
    </>
  );
}
```

## Testing

### Unit Tests for Command Palette UI

```typescript
describe('CommandPalette', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const mockOnClose = jest.fn();
  const mockOnInsertBlock = jest.fn();
  
  test('should not render when closed', () => {
    render(
      <CommandPalette 
        isOpen={false} 
        onClose={mockOnClose} 
        onInsertBlock={mockOnInsertBlock} 
      />
    );
    
    expect(screen.queryByText('Prompt Blocks')).not.toBeInTheDocument();
  });
  
  test('should render block types when open', async () => {
    // Mock block service
    const mockBlockService = {
      getBlockTypes: jest.fn().mockResolvedValue([
        { id: 'role', name: 'Role Setting', description: 'Define AI persona', icon: 'user' }
      ]),
      getRecentBlocks: jest.fn().mockResolvedValue([]),
      getFavoriteBlocks: jest.fn().mockResolvedValue([])
    };
    
    jest.mock('../hooks/useBlockService', () => ({
      useBlockService: () => mockBlockService
    }));
    
    render(
      <CommandPalette 
        isOpen={true} 
        onClose={mockOnClose} 
        onInsertBlock={mockOnInsertBlock} 
      />
    );
    
    // Check for header
    expect(await screen.findByText('Prompt Blocks')).toBeInTheDocument();
    
    // Check for special entries
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    
    // Check for block type
    expect(await screen.findByText('Role Setting')).toBeInTheDocument();
  });
  
  test('should handle keyboard navigation', async () => {
    // Mock services
    const mockBlockService = {
      getBlockTypes: jest.fn().mockResolvedValue([
        { id: 'role', name: 'Role Setting', description: 'Define AI persona', icon: 'user' }
      ]),
      getRecentBlocks: jest.fn().mockResolvedValue([]),
      getFavoriteBlocks: jest.fn().mockResolvedValue([]),
      getBlocksByType: jest.fn().mockResolvedValue([
        { id: 'block1', name: 'Test Block', typeId: 'role', content: 'test content' }
      ])
    };
    
    jest.mock('../hooks/useBlockService', () => ({
      useBlockService: () => mockBlockService
    }));
    
    const { container } = render(
      <CommandPalette 
        isOpen={true} 
        onClose={mockOnClose} 
        onInsertBlock={mockOnInsertBlock} 
      />
    );
    
    // Navigate to Role Setting with arrow down
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    fireEvent.keyDown(container, { key: 'ArrowDown' });
    
    // Select it with Enter
    fireEvent.keyDown(container, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockBlockService.getBlocksByType).toHaveBeenCalledWith('role');
    });
    
    // Verify we're in blocks view
    expect(await screen.findByText('Test Block')).toBeInTheDocument();
    
    // Select the block with Enter
    fireEvent.keyDown(container, { key: 'Enter' });
    
    expect(mockOnInsertBlock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'block1',
      content: 'test content'
    }));
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
```

### Accessibility Testing

```typescript
describe('CommandPalette Accessibility', () => {
  test('should trap focus when open', async () => {
    render(
      <CommandPalette 
        isOpen={true} 
        onClose={jest.fn()} 
        onInsertBlock={jest.fn()} 
      />
    );
    
    // Wait for component to render
    await screen.findByText('Prompt Blocks');
    
    // First focusable element
    const firstFocusable = document.activeElement;
    
    // Tab to the last element
    for (let i = 0; i < 10; i++) {
      fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    }
    
    // Tab again should cycle back to first element
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    
    expect(document.activeElement).toBe(firstFocusable);
  });
  
  test('should have proper ARIA attributes', async () => {
    render(
      <CommandPalette 
        isOpen={true} 
        onClose={jest.fn()} 
        onInsertBlock={jest.fn()} 
      />
    );
    
    const dialog = await screen.findByRole('dialog');
    
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby');
    
    const labelledById = dialog.getAttribute('aria-labelledby');
    const heading = document.getElementById(labelledById!);
    
    expect(heading).toHaveTextContent('Prompt Blocks');
  });
});
```

## Integration with Other Components

### How the Command Palette is Used

- **Core Data Layer**: Retrieves block types and blocks from the repository
- **Search Engine**: Uses search service for filtering blocks
- **Editor Integration**: Inserts selected blocks at cursor position
- **PWA Features**: Fully functional offline with local storage
- **User Preferences**: Respects dark mode settings and custom sorting

## Implementation Considerations

1. **Performance**: Optimize rendering for large lists, consider virtualization for very large collections
2. **Accessibility**: Ensure proper focus management, ARIA attributes, and keyboard navigation
3. **Mobile Support**: Adapt keyboard shortcuts for touch devices, consider different interaction patterns
4. **Internationalization**: Prepare UI for localization of labels and keyboard shortcuts
5. **Memory Management**: Avoid memory leaks with proper cleanup of event listeners and subscriptions