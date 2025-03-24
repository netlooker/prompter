# Integration with Editor

## Overview

The Editor Integration module connects the Block Library with the text editor, allowing users to seamlessly insert blocks at the cursor position, replace selected text, and receive context-aware suggestions. This integration ensures a smooth workflow between block management and prompt creation, enabling users to efficiently construct prompts from reusable components.

## Key Components

### 1. Editor Interface

#### Editor Service Interface
```typescript
export interface EditorService {
  // Content manipulation
  insertTextAtCursor(text: string): void;
  replaceSelectedText(text: string): void;
  getSelectedText(): string;
  getCursorPosition(): CursorPosition;
  
  // Context awareness
  getTextBeforeCursor(charCount?: number): string;
  getTextAfterCursor(charCount?: number): string;
  getCurrentLine(): string;
  
  // Event registration
  onContentChange(callback: (content: string) => void): () => void;
  onSelectionChange(callback: (selection: Selection) => void): () => void;
  onCursorMove(callback: (position: CursorPosition) => void): () => void;
  
  // Block insertion
  insertBlock(block: Block): void;
  replaceSelectionWithBlock(block: Block): void;
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface Selection {
  start: CursorPosition;
  end: CursorPosition;
  text: string;
}
```

### 2. Editor Integration Manager

```typescript
export class EditorIntegrationManager {
  private editorService: EditorService;
  private blockService: BlockService;
  private searchService: SearchService;
  private suggestionManager: SuggestionManager;
  
  private lastCursorPosition: CursorPosition | null = null;
  private lastContent: string = '';
  
  constructor(
    editorService: EditorService,
    blockService: BlockService,
    searchService: SearchService
  ) {
    this.editorService = editorService;
    this.blockService = blockService;
    this.searchService = searchService;
    this.suggestionManager = new SuggestionManager(searchService);
    
    // Register event listeners
    this.registerEventListeners();
  }
  
  private registerEventListeners(): void {
    // Listen for cursor movement to update context-aware suggestions
    this.editorService.onCursorMove((position) => {
      this.lastCursorPosition = position;
      this.updateContextAwareSuggestions();
    });
    
    // Listen for content changes to update context-aware suggestions
    this.editorService.onContentChange((content) => {
      this.lastContent = content;
      this.updateContextAwareSuggestions();
      
      // Check for slash commands
      if (this.lastCursorPosition) {
        const lineText = this.editorService.getCurrentLine();
        this.checkForSlashCommand(lineText);
      }
    });
  }
  
  // Insert a block at the current cursor position
  public insertBlock(block: Block): void {
    this.editorService.insertTextAtCursor(block.content);
    this.blockService.incrementBlockUsage(block.id);
  }
  
  // Replace selected text with a block
  public replaceSelectionWithBlock(block: Block): void {
    this.editorService.replaceSelectedText(block.content);
    this.blockService.incrementBlockUsage(block.id);
  }
  
  // Create a new block from the current selection
  public createBlockFromSelection(blockType: string): Promise<Block | null> {
    const selectedText = this.editorService.getSelectedText();
    
    if (!selectedText.trim()) {
      return Promise.resolve(null);
    }
    
    // Create a new block
    const newBlock: Partial<Block> = {
      typeId: blockType,
      content: selectedText,
      name: this.generateBlockName(selectedText),
      created: Date.now(),
      updated: Date.now(),
      favorite: false,
      usage_count: 0,
      is_system: false
    };
    
    return this.blockService.createBlock(newBlock);
  }
  
  // Get context-aware suggestions based on cursor position
  public async getContextAwareSuggestions(): Promise<Block[]> {
    if (!this.lastCursorPosition) {
      return [];
    }
    
    const context = {
      text: this.editorService.getTextBeforeCursor(200),
      line: this.editorService.getCurrentLine(),
      position: this.lastCursorPosition
    };
    
    return this.suggestionManager.getSuggestionsForContext(context);
  }
  
  // Update context-aware suggestions (called internally)
  private updateContextAwareSuggestions(): void {
    // This would typically update a suggestion UI or store
    // For now, we'll just calculate suggestions on demand via getContextAwareSuggestions()
  }
  
  // Check for slash commands to trigger block insertion
  private checkForSlashCommand(lineText: string): void {
    const slashCommandRegex = /\/([a-zA-Z0-9_-]+)$/;
    const match = lineText.match(slashCommandRegex);
    
    if (match) {
      const command = match[1].toLowerCase();
      this.handleSlashCommand(command);
    }
  }
  
  // Handle slash commands
  private async handleSlashCommand(command: string): Promise<void> {
    // Simple implementation - in a real app, you'd have a more robust command system
    if (command === 'role') {
      const blocks = await this.blockService.getBlocksByType('role-setting');
      // Trigger UI to show blocks
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'context') {
      const blocks = await this.blockService.getBlocksByType('context');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'task') {
      const blocks = await this.blockService.getBlocksByType('task-description');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'action') {
      const blocks = await this.blockService.getBlocksByType('action');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'output') {
      const blocks = await this.blockService.getBlocksByType('output-format');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'criteria') {
      const blocks = await this.blockService.getBlocksByType('success-criteria');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'constraints') {
      const blocks = await this.blockService.getBlocksByType('constraints');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'examples') {
      const blocks = await this.blockService.getBlocksByType('examples');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'boosters') {
      const blocks = await this.blockService.getBlocksByType('boosters');
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'favorites') {
      const blocks = await this.blockService.getFavoriteBlocks();
      this.triggerBlockSuggestions(blocks);
    } else if (command === 'recent') {
      const blocks = await this.blockService.getRecentBlocks(10);
      this.triggerBlockSuggestions(blocks);
    } else {
      // Search for blocks matching the command
      const results = await this.searchService.search(command);
      const blocks = results.items.map(item => item.block);
      this.triggerBlockSuggestions(blocks);
    }
  }
  
  // Trigger block suggestions UI
  private triggerBlockSuggestions(blocks: Block[]): void {
    // Dispatch an event or call a callback to show the suggestions UI
    // This would typically be implemented by the consuming application
    const event = new CustomEvent('blockSuggestions', { detail: { blocks } });
    document.dispatchEvent(event);
  }
  
  // Generate a block name from content
  private generateBlockName(content: string): string {
    const maxLength = 40;
    const name = content.split('\n')[0].trim();
    
    if (name.length <= maxLength) {
      return name;
    }
    
    return name.substring(0, maxLength - 3) + '...';
  }
}
```

### 3. Block Suggestions Component

```tsx
interface BlockSuggestionsProps {
  position: CursorPosition | null;
  blocks: Block[];
  onSelectBlock: (block: Block) => void;
  onClose: () => void;
}

const BlockSuggestions: React.FC<BlockSuggestionsProps> = ({
  position,
  blocks,
  onSelectBlock,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % blocks.length);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + blocks.length) % blocks.length);
          break;
          
        case 'Enter':
          e.preventDefault();
          if (blocks[selectedIndex]) {
            onSelectBlock(blocks[selectedIndex]);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
          
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [blocks, selectedIndex, onSelectBlock, onClose]);
  
  // Reset selected index when blocks change
  useEffect(() => {
    setSelectedIndex(0);
  }, [blocks]);
  
  if (!position || blocks.length === 0) {
    return null;
  }
  
  // In a real implementation, you would calculate the position based on cursor
  // For now, we'll use fixed styling
  
  return (
    <div 
      className="absolute z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 w-80 max-h-80 overflow-auto"
      style={{ 
        top: `calc(${position.line * 1.5}em + 20px)`, 
        left: `${position.column * 8}px` 
      }}
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-sm font-medium">
        Block Suggestions
      </div>
      <div className="py-1">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
              index === selectedIndex 
                ? 'bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSelectBlock(block)}
          >
            <div className={`p-1 rounded ${index === selectedIndex ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Icon name={block.icon || 'file-text'} className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{block.name}</div>
              {block.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {block.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 4. Slash Command Handler

```tsx
interface SlashCommandHandlerProps {
  editor: EditorService;
  integrationManager: EditorIntegrationManager;
}

const SlashCommandHandler: React.FC<SlashCommandHandlerProps> = ({
  editor,
  integrationManager
}) => {
  const [isActive, setIsActive] = useState(false);
  const [command, setCommand] = useState('');
  const [suggestedBlocks, setSuggestedBlocks] = useState<Block[]>([]);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  
  // Listen for cursor movement
  useEffect(() => {
    const unsubscribe = editor.onCursorMove((position) => {
      setCursorPosition(position);
      
      // Check current line for slash command
      const currentLine = editor.getCurrentLine();
      checkForSlashCommand(currentLine);
    });
    
    return unsubscribe;
  }, [editor]);
  
  // Listen for content changes
  useEffect(() => {
    const unsubscribe = editor.onContentChange(() => {
      const currentLine = editor.getCurrentLine();
      checkForSlashCommand(currentLine);
    });
    
    return unsubscribe;
  }, [editor]);
  
  // Listen for block suggestions event
  useEffect(() => {
    const handleBlockSuggestions = (event: CustomEvent<{ blocks: Block[] }>) => {
      const { blocks } = event.detail;
      setSuggestedBlocks(blocks);
      setIsActive(true);
    };
    
    document.addEventListener('blockSuggestions', handleBlockSuggestions as EventListener);
    return () => document.removeEventListener('blockSuggestions', handleBlockSuggestions as EventListener);
  }, []);
  
  // Check for slash command
  const checkForSlashCommand = (line: string) => {
    const slashCommandRegex = /\/([a-zA-Z0-9_-]*)$/;
    const match = line.match(slashCommandRegex);
    
    if (match) {
      const cmd = match[1];
      setCommand(cmd);
      setIsActive(true);
      
      // Only trigger suggestions if the command has content
      if (cmd) {
        triggerSuggestions(cmd);
      }
    } else {
      setIsActive(false);
      setCommand('');
      setSuggestedBlocks([]);
    }
  };
  
  // Trigger slash command suggestions
  const triggerSuggestions = async (cmd: string) => {
    // Defer to integration manager for actual handling
    // The manager will fire an event that we're already listening for
    
    // This is just a backup direct implementation for immediate results
    try {
      const blockService = (await import('../services/block-service')).blockService;
      const searchService = (await import('../services/search-service')).searchService;
      
      // First check for specific commands
      if (['role', 'context', 'task', 'action', 'output', 'criteria', 'constraints', 'examples', 'boosters'].includes(cmd)) {
        const blocks = await blockService.getBlocksByType(getTypeIdFromCommand(cmd));
        setSuggestedBlocks(blocks);
      } else if (cmd === 'favorites') {
        const blocks = await blockService.getFavoriteBlocks();
        setSuggestedBlocks(blocks);
      } else if (cmd === 'recent') {
        const blocks = await blockService.getRecentBlocks(10);
        setSuggestedBlocks(blocks);
      } else {
        // Search for blocks matching the command
        const results = await searchService.search(cmd);
        setSuggestedBlocks(results.items.map(item => item.block));
      }
    } catch (error) {
      console.error('Error fetching slash command suggestions:', error);
    }
  };
  
  // Map command to type ID
  const getTypeIdFromCommand = (cmd: string): string => {
    const commandToTypeMap: Record<string, string> = {
      'role': 'role-setting',
      'context': 'context',
      'task': 'task-description',
      'action': 'action',
      'output': 'output-format',
      'criteria': 'success-criteria',
      'constraints': 'constraints',
      'examples': 'examples',
      'boosters': 'boosters'
    };
    
    return commandToTypeMap[cmd] || cmd;
  };
  
  // Handle block selection
  const handleSelectBlock = (block: Block) => {
    // Replace the slash command with the block content
    const currentLine = editor.getCurrentLine();
    const replacementRegex = new RegExp(`\/${command}$`);
    const newLine = currentLine.replace(replacementRegex, block.content);
    
    // Calculate how much to delete before inserting
    const deleteCount = command.length + 1; // +1 for the slash
    
    // Delete the slash command
    const position = editor.getCursorPosition();
    for (let i = 0; i < deleteCount; i++) {
      editor.replaceSelectedText('', { moveBackward: true });
    }
    
    // Insert the block content
    editor.insertTextAtCursor(block.content);
    
    // Track block usage
    integrationManager.insertBlock(block);
    
    // Close suggestions
    setIsActive(false);
    setSuggestedBlocks([]);
  };
  
  // Handle closing suggestions
  const handleClose = () => {
    setIsActive(false);
    setSuggestedBlocks([]);
  };
  
  if (!isActive) {
    return null;
  }
  
  return (
    <BlockSuggestions
      position={cursorPosition}
      blocks={suggestedBlocks}
      onSelectBlock={handleSelectBlock}
      onClose={handleClose}
    />
  );
};
```

### 5. Context Menu Integration

```tsx
interface EditorContextMenuProps {
  editor: EditorService;
  blockService: BlockService;
  position: { x: number; y: number } | null;
  onClose: () => void;
}

const EditorContextMenu: React.FC<EditorContextMenuProps> = ({
  editor,
  blockService,
  position,
  onClose
}) => {
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  
  // Load block types
  useEffect(() => {
    if (position) {
      blockService.getBlockTypes().then(setBlockTypes);
    }
  }, [position, blockService]);
  
  if (!position) {
    return null;
  }
  
  const hasSelection = !!editor.getSelectedText().trim();
  
  const createBlockFromSelection = async (typeId: string) => {
    const selectedText = editor.getSelectedText();
    
    if (!selectedText.trim()) {
      return;
    }
    
    // Find block type
    const blockType = blockTypes.find(type => type.id === typeId);
    
    if (!blockType) {
      return;
    }
    
    try {
      // Create a new block
      const newBlock: Partial<Block> = {
        typeId,
        content: selectedText,
        name: selectedText.split('\n')[0].substring(0, 40) || `New ${blockType.name}`,
        description: `Created from editor selection`,
        created: Date.now(),
        updated: Date.now(),
        favorite: false,
        usage_count: 0,
        is_system: false,
        icon: blockType.icon
      };
      
      await blockService.createBlock(newBlock);
      
      // Show success notification
      onClose();
    } catch (error) {
      console.error('Failed to create block:', error);
      // Show error notification
    }
  };
  
  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 w-64"
      style={{ top: position.y, left: position.x }}
    >
      <div className="py-1">
        {hasSelection ? (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Create Block from Selection
            </div>
            {blockTypes.map(type => (
              <button
                key={type.id}
                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => createBlockFromSelection(type.id)}
              >
                <Icon name={type.icon || 'box'} className="w-4 h-4" />
                <span>Create {type.name}</span>
              </button>
            ))}
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          </>
        ) : null}
        
        <button
          className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => {
            // Open command palette
            const event = new CustomEvent('openCommandPalette');
            document.dispatchEvent(event);
            onClose();
          }}
        >
          <SearchIcon className="w-4 h-4" />
          <span>Insert Block...</span>
        </button>
        
        <button
          className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => {
            // Open block explorer
            const event = new CustomEvent('openBlockExplorer');
            document.dispatchEvent(event);
            onClose();
          }}
        >
          <LayoutGridIcon className="w-4 h-4" />
          <span>Browse Blocks...</span>
        </button>
      </div>
    </div>
  );
};
```

### 6. Drag and Drop Integration

```tsx
interface DragAndDropHandlerProps {
  editor: EditorService;
  children: React.ReactNode;
}

const DragAndDropHandler: React.FC<DragAndDropHandlerProps> = ({
  editor,
  children
}) => {
  // State to track if we're dragging over the editor
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Track the block being dragged
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);
  
  // Subscribe to block drag events
  useEffect(() => {
    const handleBlockDragStart = (event: CustomEvent<{ block: Block }>) => {
      setDraggedBlock(event.detail.block);
    };
    
    const handleBlockDragEnd = () => {
      setDraggedBlock(null);
    };
    
    document.addEventListener('blockDragStart', handleBlockDragStart as EventListener);
    document.addEventListener('blockDragEnd', handleBlockDragEnd as EventListener);
    
    return () => {
      document.removeEventListener('blockDragStart', handleBlockDragStart as EventListener);
      document.removeEventListener('blockDragEnd', handleBlockDragEnd as EventListener);
    };
  }, []);
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };
  
  // Handle drag leave
  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    // Check if we have a dragged block
    if (draggedBlock) {
      // Insert the block content at the cursor position
      editor.insertTextAtCursor(draggedBlock.content);
      
      // Track block usage
      const blockService = (window as any).blockService;
      if (blockService) {
        blockService.incrementBlockUsage(draggedBlock.id);
      }
    }
  };
  
  // Render a drop indicator when dragging over
  const dropIndicator = isDraggingOver && (
    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 bg-opacity-20 dark:bg-opacity-20 flex items-center justify-center z-10 pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <DownloadIcon className="w-6 h-6 text-blue-500" />
        <span className="text-lg font-medium">Drop to Insert Block</span>
      </div>
    </div>
  );
  
  return (
    <div 
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {dropIndicator}
    </div>
  );
};
```

### 7. Floating Suggestion Menu

```tsx
interface FloatingSuggestionMenuProps {
  editor: EditorService;
  integrationManager: EditorIntegrationManager;
}

const FloatingSuggestionMenu: React.FC<FloatingSuggestionMenuProps> = ({
  editor,
  integrationManager
}) => {
  const [suggestions, setSuggestions] = useState<Block[]>([]);
  const [position, setPosition] = useState<CursorPosition | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for cursor movement
  useEffect(() => {
    const unsubscribe = editor.onCursorMove((newPosition) => {
      setPosition(newPosition);
      debouncedUpdateSuggestions();
    });
    
    return unsubscribe;
  }, [editor]);
  
  // Listen for content changes
  useEffect(() => {
    const unsubscribe = editor.onContentChange(() => {
      debouncedUpdateSuggestions();
    });
    
    return unsubscribe;
  }, [editor]);
  
  // Debounced suggestion update
  const debouncedUpdateSuggestions = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(async () => {
      if (!editor.getSelectedText().trim()) {
        // Only show suggestions when there's no selection
        const newSuggestions = await integrationManager.getContextAwareSuggestions();
        setSuggestions(newSuggestions);
        setIsVisible(newSuggestions.length > 0);
      } else {
        setSuggestions([]);
        setIsVisible(false);
      }
    }, 500); // 500ms debounce
  };
  
  // Handle block selection
  const handleSelectBlock = (block: Block) => {
    editor.insertTextAtCursor(block.content);
    integrationManager.insertBlock(block);
    setIsVisible(false);
  };
  
  if (!isVisible || !position) {
    return null;
  }
  
  // Render a small floating button that expands on hover
  return (
    <div 
      className="absolute z-40"
      style={{ 
        top: `calc(${position.line * 1.5}em + 20px)`, 
        left: `${position.column * 8}px` 
      }}
    >
      <div className="relative group">
        <button 
          className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md hover:bg-blue-600"
          onClick={() => setIsVisible(prev => !prev)}
        >
          <PlusIcon className="w-5 h-5" />
        </button>
        
        <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-64 max-h-64 overflow-y-auto overflow-x-hidden">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
              <span className="text-sm font-medium">Suggested Blocks</span>
              <button 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setIsVisible(false)}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="py-1">
              {suggestions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No suggestions available
                </div>
              ) : (
                suggestions.slice(0, 5).map(block => (
                  <div
                    key={block.id}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSelectBlock(block)}
                  >
                    <div className="p-1 rounded bg-gray-100 dark:bg-gray-700">
                      <Icon name={block.icon || 'file-text'} className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{block.name}</div>
                      {block.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {block.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              
              {suggestions.length > 5 && (
                <button
                  className="w-full text-left px-3 py-2 text-sm text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    // Open command palette
                    const event = new CustomEvent('openCommandPalette');
                    document.dispatchEvent(event);
                    setIsVisible(false);
                  }}
                >
                  See {suggestions.length - 5} more suggestions...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Implementation Steps

### Step 1: Create the Editor Service Implementation

```typescript
// Implement the EditorService interface for your editor (e.g., Monaco, CodeMirror, etc.)
export class MonacoEditorService implements EditorService {
  private editor: monaco.editor.IStandaloneCodeEditor;
  
  constructor(editor: monaco.editor.IStandaloneCodeEditor) {
    this.editor = editor;
  }
  
  insertTextAtCursor(text: string): void {
    const selection = this.editor.getSelection();
    if (selection) {
      const position = selection.getPosition();
      this.editor.executeEdits('', [
        {
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
          text,
          forceMoveMarkers: true
        }
      ]);
    }
  }
  
  replaceSelectedText(text: string, options?: { moveBackward?: boolean }): void {
    const selection = this.editor.getSelection();
    if (selection) {
      this.editor.executeEdits('', [
        {
          range: new monaco.Range(
            selection.startLineNumber,
            selection.startColumn,
            selection.endLineNumber,
            selection.endColumn
          ),
          text,
          forceMoveMarkers: true
        }
      ]);
      
      if (options?.moveBackward && text === '') {
        // Move cursor backward for backspace-like functionality
        const pos = this.editor.getPosition();
        if (pos) {
          this.editor.setPosition({
            lineNumber: pos.lineNumber,
            column: Math.max(1, pos.column - 1)
          });
        }
      }
    }
  }
  
  getSelectedText(): string {
    const selection = this.editor.getSelection();
    if (selection) {
      return this.editor.getModel()?.getValueInRange(selection) || '';
    }
    return '';
  }
  
  getCursorPosition(): CursorPosition {
    const position = this.editor.getPosition();
    return {
      line: position?.lineNumber || 1,
      column: position?.column || 1
    };
  }
  
  getTextBeforeCursor(charCount?: number): string {
    const position = this.editor.getPosition();
    if (!position) return '';
    
    const model = this.editor.getModel();
    if (!model) return '';
    
    const line = model.getLineContent(position.lineNumber);
    const textBeforeCursor = line.substring(0, position.column - 1);
    
    if (charCount === undefined) {
      return textBeforeCursor;
    }
    
    return textBeforeCursor.slice(-charCount);
  }
  
  getTextAfterCursor(charCount?: number): string {
    const position = this.editor.getPosition();
    if (!position) return '';
    
    const model = this.editor.getModel();
    if (!model) return '';
    
    const line = model.getLineContent(position.lineNumber);
    const textAfterCursor = line.substring(position.column - 1);
    
    if (charCount === undefined) {
      return textAfterCursor;
    }
    
    return textAfterCursor.slice(0, charCount);
  }
  
  getCurrentLine(): string {
    const position = this.editor.getPosition();
    if (!position) return '';
    
    const model = this.editor.getModel();
    if (!model) return '';
    
    return model.getLineContent(position.lineNumber);
  }
  
  onContentChange(callback: (content: string) => void): () => void {
    const disposable = this.editor.onDidChangeModelContent(() => {
      const content = this.editor.getValue();
      callback(content);
    });
    
    return () => disposable.dispose();
  }
  
  onSelectionChange(callback: (selection: Selection) => void): () => void {
    const disposable = this.editor.onDidChangeCursorSelection(e => {
      const selection = this.editor.getSelection();
      if (selection) {
        callback({
          start: {
            line: selection.startLineNumber,
            column: selection.startColumn
          },
          end: {
            line: selection.endLineNumber,
            column: selection.endColumn
          },
          text: this.editor.getModel()?.getValueInRange(selection) || ''
        });
      }
    });
    
    return () => disposable.dispose();
  }
  
  onCursorMove(callback: (position: CursorPosition) => void): () => void {
    const disposable = this.editor.onDidChangeCursorPosition(e => {
      callback({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });
    
    return () => disposable.dispose();
  }
  
  insertBlock(block: Block): void {
    this.insertTextAtCursor(block.content);
  }
  
  replaceSelectionWithBlock(block: Block): void {
    this.replaceSelectedText(block.content);
  }
}
```

### Step 2: Set Up the Editor Context Menu

```tsx
// Editor component with context menu
export const Editor: React.FC<EditorProps> = (props) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const editorServiceRef = useRef<EditorService | null>(null);
  
  const blockService = useBlockService();
  const searchService = useSearchService();
  
  // Initialize editor
  const handleEditorMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // Create editor service
    const editorService = new MonacoEditorService(editor);
    editorServiceRef.current = editorService;
    
    // Create integration manager
    const integrationManager = new EditorIntegrationManager(
      editorService,
      blockService,
      searchService
    );
    
    // Set up context menu
    editor.onContextMenu(e => {
      e.event.preventDefault();
      e.event.stopPropagation();
      
      setContextMenuPosition({
        x: e.event.posx,
        y: e.event.posy
      });
    });
    
    // Close context menu on editor click
    editor.onMouseDown(() => {
      setContextMenuPosition(null);
    });
    
    // Additional editor setup...
  };
  
  return (
    <div className="relative h-full">
      <MonacoEditor
        value={props.value}
        onChange={props.onChange}
        language="markdown"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          // More editor options...
        }}
        onMount={handleEditorMount}
      />
      
      {editorServiceRef.current && (
        <>
          <EditorContextMenu
            editor={editorServiceRef.current}
            blockService={blockService}
            position={contextMenuPosition}
            onClose={() => setContextMenuPosition(null)}
          />
          
          <SlashCommandHandler
            editor={editorServiceRef.current}
            integrationManager={
              new EditorIntegrationManager(
                editorServiceRef.current,
                blockService,
                searchService
              )
            }
          />
          
          <FloatingSuggestionMenu
            editor={editorServiceRef.current}
            integrationManager={
              new EditorIntegrationManager(
                editorServiceRef.current,
                blockService,
                searchService
              )
            }
          />
        </>
      )}
    </div>
  );
};
```

### Step 3: Implement Draggable Block Components

```tsx
// Draggable block component for sidebars and block explorer
export const DraggableBlock: React.FC<{
  block: Block;
  onClick?: () => void;
}> = ({ block, onClick }) => {
  // Start drag
  const handleDragStart = (e: React.DragEvent) => {
    // Set drag data
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      type: 'block', 
      id: block.id 
    }));
    
    // Set drag image
    const dragPreview = document.createElement('div');
    dragPreview.className = 'bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-200 dark:border-gray-700';
    dragPreview.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="p-1 rounded bg-gray-100 dark:bg-gray-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </div>
        <div class="font-medium">${block.name}</div>
      </div>
    `;
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 20, 20);
    
    // Cleanup after drag image is captured
    setTimeout(() => {
      document.body.removeChild(dragPreview);
    }, 0);
    
    // Fire custom event
    const event = new CustomEvent('blockDragStart', { detail: { block } });
    document.dispatchEvent(event);
  };
  
  // End drag
  const handleDragEnd = () => {
    const event = new CustomEvent('blockDragEnd');
    document.dispatchEvent(event);
  };
  
  return (
    <div
      className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-gray-100 dark:bg-gray-700">
          <Icon name={block.icon || 'file-text'} className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{block.name}</div>
          {block.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {block.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### Step 4: Connect Editor to Command Palette

```tsx
// In the App component or other parent component
export const App: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const editorRef = useRef<EditorService | null>(null);
  
  // Listen for openCommandPalette event
  useEffect(() => {
    const handleOpenCommandPalette = () => {
      setIsCommandPaletteOpen(true);
    };
    
    document.addEventListener('openCommandPalette', handleOpenCommandPalette);
    return () => document.removeEventListener('openCommandPalette', handleOpenCommandPalette);
  }, []);
  
  // Handle block insertion from command palette
  const handleInsertBlock = (block: Block) => {
    if (editorRef.current) {
      editorRef.current.insertBlock(block);
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <main className="flex-1 relative">
          <Editor
            value={/* editor value */}
            onChange={/* handle change */}
            onEditorMount={(editor) => {
              editorRef.current = editor;
            }}
          />
        </main>
      </div>
      
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onInsertBlock={handleInsertBlock}
      />
    </div>
  );
};
```

## Testing

### Unit Tests for Editor Integration

```typescript
describe('EditorIntegrationManager', () => {
  let editorService: EditorService;
  let blockService: BlockService;
  let searchService: SearchService;
  let integrationManager: EditorIntegrationManager;
  
  beforeEach(() => {
    // Mock editor service
    editorService = {
      insertTextAtCursor: jest.fn(),
      replaceSelectedText: jest.fn(),
      getSelectedText: jest.fn().mockReturnValue('Selected text'),
      getCursorPosition: jest.fn().mockReturnValue({ line: 1, column: 1 }),
      getTextBeforeCursor: jest.fn().mockReturnValue('Text before cursor'),
      getTextAfterCursor: jest.fn().mockReturnValue('Text after cursor'),
      getCurrentLine: jest.fn().mockReturnValue('Current line'),
      onContentChange: jest.fn().mockReturnValue(() => {}),
      onSelectionChange: jest.fn().mockReturnValue(() => {}),
      onCursorMove: jest.fn().mockReturnValue(() => {}),
      insertBlock: jest.fn(),
      replaceSelectionWithBlock: jest.fn()
    } as unknown as EditorService;
    
    // Mock block service
    blockService = {
      getBlocksByType: jest.fn().mockResolvedValue([]),
      createBlock: jest.fn().mockImplementation(block => Promise.resolve({ ...block, id: 'new-id' })),
      incrementBlockUsage: jest.fn()
    } as unknown as BlockService;
    
    // Mock search service
    searchService = {
      search: jest.fn().mockResolvedValue({ items: [], total: 0, query: '' }),
      suggestBlocks: jest.fn().mockResolvedValue([])
    } as unknown as SearchService;
    
    // Create manager
    integrationManager = new EditorIntegrationManager(
      editorService,
      blockService,
      searchService
    );
  });
  
  test('insertBlock should insert content and track usage', () => {
    const block = { id: 'block-id', content: 'Block content' } as Block;
    
    integrationManager.insertBlock(block);
    
    expect(editorService.insertTextAtCursor).toHaveBeenCalledWith('Block content');
    expect(blockService.incrementBlockUsage).toHaveBeenCalledWith('block-id');
  });
  
  test('createBlockFromSelection should create a block from selected text', async () => {
    const result = await integrationManager.createBlockFromSelection('type-id');
    
    expect(editorService.getSelectedText).toHaveBeenCalled();
    expect(blockService.createBlock).toHaveBeenCalledWith(expect.objectContaining({
      typeId: 'type-id',
      content: 'Selected text'
    }));
    expect(result).toEqual(expect.objectContaining({ id: 'new-id' }));
  });
  
  test('getContextAwareSuggestions should return suggestions based on context', async () => {
    const mockBlocks = [{ id: 'suggestion-1' }] as Block[];
    (searchService.suggestBlocks as jest.Mock).mockResolvedValueOnce(mockBlocks);
    
    const suggestions = await integrationManager.getContextAwareSuggestions();
    
    expect(editorService.getTextBeforeCursor).toHaveBeenCalled();
    expect(searchService.suggestBlocks).toHaveBeenCalled();
    expect(suggestions).toEqual(mockBlocks);
  });
  
  // More tests...
});
```

### Integration Tests for Slash Commands

```typescript
describe('SlashCommandHandler', () => {
  let editorService: EditorService;
  let integrationManager: EditorIntegrationManager;
  let handleBlockSuggestions: (event: CustomEvent<{ blocks: Block[] }>) => void;
  
  beforeEach(() => {
    // Mock editor service
    editorService = {
      getCurrentLine: jest.fn().mockReturnValue('/role'),
      onCursorMove: jest.fn().mockImplementation(callback => {
        callback({ line: 1, column: 6 });
        return () => {};
      }),
      onContentChange: jest.fn().mockImplementation(callback => {
        callback('/role');
        return () => {};
      }),
      getCursorPosition: jest.fn().mockReturnValue({ line: 1, column: 6 })
    } as unknown as EditorService;
    
    // Mock integration manager
    integrationManager = {
      insertBlock: jest.fn()
    } as unknown as EditorIntegrationManager;
    
    // Mock document event listener
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = jest.fn().mockImplementation((event, callback) => {
      if (event === 'blockSuggestions') {
        handleBlockSuggestions = callback as any;
      }
      return originalAddEventListener(event, callback);
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  test('renders slash command suggestions', () => {
    render(
      <SlashCommandHandler
        editor={editorService}
        integrationManager={integrationManager}
      />
    );
    
    // Simulate block suggestions event
    const mockBlocks = [
      { id: 'block-1', name: 'Test Block', icon: 'user' }
    ] as Block[];
    
    handleBlockSuggestions(new CustomEvent('blockSuggestions', {
      detail: { blocks: mockBlocks }
    }) as any);
    
    // Check if suggestions are rendered
    expect(screen.getByText('Block Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Test Block')).toBeInTheDocument();
  });
  
  // More tests...
});
```

## Integration with Other Components

### How the Editor Integration is Used

- **Core Data Layer**: Uses block repository to store and retrieve blocks
- **Search Engine**: Leverages search service for context-aware suggestions
- **Command Palette**: Connects with command palette for block insertion
- **Block Explorer**: Enables creating blocks from selection and drag-and-drop
- **Template System**: Allows inserting template blocks into the editor
- **Sidebar Panel**: Enables dragging blocks from sidebar to editor

## Implementation Considerations

1. **Performance**: Optimize context-aware suggestions with debouncing and caching
2. **User Experience**: Provide clear visual feedback for drag and drop operations
3. **Accessibility**: Ensure keyboard navigation for all insertion methods
4. **Memory Management**: Clean up event listeners and subscriptions to prevent memory leaks
5. **Editor Agnosticism**: Design the integration to work with different editor implementations