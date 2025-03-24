# Search & Discovery Engine

## Overview

The Search & Discovery Engine provides fast, client-side search functionality across all blocks and their properties. It enables users to quickly find relevant blocks based on text search, filters, and context-awareness. The engine is optimized for performance with web workers to ensure a responsive UI even with large collections.

## Key Components

### 1. Search Engine Core

#### Search Service Interface
```typescript
export interface SearchService {
  // Full text search
  search(query: string, options?: SearchOptions): Promise<SearchResults>;
  
  // Advanced filtering
  filter(filters: FilterCriteria): Promise<Block[]>;
  
  // Suggestions based on context
  suggestBlocks(context: EditorContext): Promise<Block[]>;
  
  // Recent and popular blocks
  getRecentBlocks(limit?: number): Promise<Block[]>;
  getPopularBlocks(limit?: number): Promise<Block[]>;
}

export interface SearchOptions {
  types?: string[];              // Filter by block types
  collections?: string[];        // Filter by collections
  favorites?: boolean;           // Only favorites
  limit?: number;                // Maximum results
  includeTags?: boolean;         // Include tag matches
  includeContent?: boolean;      // Include content matches
  fuzzy?: boolean;               // Enable fuzzy matching
}

export interface SearchResults {
  items: SearchResultItem[];
  total: number;                 // Total matches
  query: string;                 // Original query
}

export interface SearchResultItem {
  block: Block;
  score: number;                 // Relevance score
  matches: SearchMatch[];        // Where matches occurred
}

export interface SearchMatch {
  field: string;                 // Field where match occurred
  text: string;                  // Matched text
  positions: [number, number][]; // Start/end positions of matches
}
```

### 2. Search Algorithm

#### Ranking Strategy
```typescript
interface RankingStrategy {
  calculateScore(block: Block, query: string, options: SearchOptions): number;
}

class DefaultRankingStrategy implements RankingStrategy {
  // Weights for different fields
  private weights = {
    name: 1.0,
    description: 0.8,
    tags: 0.9,
    content: 0.6
  };
  
  calculateScore(block: Block, query: string, options: SearchOptions): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Score exact matches in name highest
    if (block.name.toLowerCase().includes(queryLower)) {
      score += this.weights.name;
      // Bonus for matches at beginning of name
      if (block.name.toLowerCase().startsWith(queryLower)) {
        score += 0.5;
      }
    }
    
    // Score matches in description
    if (options.includeContent !== false && block.description?.toLowerCase().includes(queryLower)) {
      score += this.weights.description;
    }
    
    // Score matches in tags
    if (options.includeTags !== false && block.tags) {
      for (const tag of block.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += this.weights.tags;
          // Exact tag match bonus
          if (tag.toLowerCase() === queryLower) {
            score += 0.3;
          }
        }
      }
    }
    
    // Score matches in content
    if (options.includeContent !== false && block.content.toLowerCase().includes(queryLower)) {
      score += this.weights.content;
    }
    
    // Apply recency bonus
    if (block.last_used) {
      const daysAgo = (Date.now() - block.last_used) / (1000 * 60 * 60 * 24);
      if (daysAgo < 7) {
        score += 0.1 * (7 - daysAgo) / 7; // Bonus decreases with age
      }
    }
    
    // Apply popularity bonus
    if (block.usage_count > 5) {
      score += Math.min(block.usage_count / 100, 0.2); // Cap at 0.2
    }
    
    // Apply favorite bonus
    if (block.favorite) {
      score += 0.2;
    }
    
    return score;
  }
}
```

### 3. Web Worker Implementation

#### Worker Message Types
```typescript
export enum SearchWorkerMessageType {
  SEARCH_REQUEST = 'search:request',
  SEARCH_RESPONSE = 'search:response',
  INDEX_UPDATE = 'index:update',
  INDEX_COMPLETE = 'index:complete',
  ERROR = 'error'
}

export interface SearchWorkerMessage {
  type: SearchWorkerMessageType;
  data: any;
}
```

#### Search Worker Code (search.worker.ts)
```typescript
// This code runs in a web worker

import { SearchWorkerMessageType, SearchWorkerMessage } from './types';
import { Block, SearchOptions, SearchResults } from '../models';

// In-memory search index
let blocksIndex: Block[] = [];

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<SearchWorkerMessage>) => {
  const { type, data } = event.data;
  
  switch (type) {
    case SearchWorkerMessageType.SEARCH_REQUEST:
      handleSearch(data.query, data.options);
      break;
    case SearchWorkerMessageType.INDEX_UPDATE:
      updateIndex(data.blocks);
      break;
    default:
      console.error('Unknown message type:', type);
  }
});

// Update the search index with new blocks data
function updateIndex(blocks: Block[]): void {
  blocksIndex = blocks;
  
  // Send confirmation
  self.postMessage({
    type: SearchWorkerMessageType.INDEX_COMPLETE,
    data: { count: blocks.length }
  });
}

// Perform search and send results back
function handleSearch(query: string, options: SearchOptions = {}): void {
  try {
    const rankingStrategy = new DefaultRankingStrategy();
    let results = [];
    
    if (!query.trim()) {
      // Empty query returns all blocks, sorted by recent/popular
      results = [...blocksIndex].sort((a, b) => {
        const aScore = (a.favorite ? 100 : 0) + a.usage_count + (a.last_used || 0) / 1000000;
        const bScore = (b.favorite ? 100 : 0) + b.usage_count + (b.last_used || 0) / 1000000;
        return bScore - aScore;
      });
    } else {
      // Full search
      results = blocksIndex
        .map(block => {
          const score = rankingStrategy.calculateScore(block, query, options);
          return { block, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);
    }
    
    // Apply type filters
    if (options.types?.length) {
      results = results.filter(item => options.types!.includes(item.block.typeId));
    }
    
    // Apply favorites filter
    if (options.favorites) {
      results = results.filter(item => item.block.favorite);
    }
    
    // Apply limit
    const limitedResults = options.limit ? results.slice(0, options.limit) : results;
    
    // Find match positions for highlighting
    const searchResults: SearchResults = {
      items: limitedResults.map(item => ({
        block: item.block,
        score: item.score,
        matches: findMatches(item.block, query)
      })),
      total: results.length,
      query
    };
    
    // Send results back to main thread
    self.postMessage({
      type: SearchWorkerMessageType.SEARCH_RESPONSE,
      data: searchResults
    });
  } catch (error) {
    self.postMessage({
      type: SearchWorkerMessageType.ERROR,
      data: { error: String(error) }
    });
  }
}

// Find the positions of matches for highlighting
function findMatches(block: Block, query: string): any[] {
  const matches = [];
  const queryLower = query.toLowerCase();
  
  if (block.name.toLowerCase().includes(queryLower)) {
    matches.push({
      field: 'name',
      text: block.name,
      positions: findPositions(block.name, queryLower)
    });
  }
  
  if (block.description?.toLowerCase().includes(queryLower)) {
    matches.push({
      field: 'description',
      text: block.description,
      positions: findPositions(block.description, queryLower)
    });
  }
  
  // Find matches in other fields...
  
  return matches;
}

function findPositions(text: string, query: string): [number, number][] {
  const positions: [number, number][] = [];
  const textLower = text.toLowerCase();
  let pos = textLower.indexOf(query);
  
  while (pos !== -1) {
    positions.push([pos, pos + query.length]);
    pos = textLower.indexOf(query, pos + 1);
  }
  
  return positions;
}
```

### 4. Search Service Implementation

```typescript
export class WebWorkerSearchService implements SearchService {
  private worker: Worker;
  private requestMap: Map<string, { resolve: Function, reject: Function }> = new Map();
  private blockRepository: BlockRepository;
  private requestId = 0;
  
  constructor(blockRepository: BlockRepository) {
    this.blockRepository = blockRepository;
    this.worker = new Worker(new URL('./search.worker.ts', import.meta.url));
    
    // Set up worker message handling
    this.worker.addEventListener('message', this.handleWorkerMessage);
    
    // Initialize the search index
    this.updateSearchIndex();
    
    // Subscribe to block changes to update index
    blockRepository.onBlocksChanged(() => {
      this.updateSearchIndex();
    });
  }
  
  private async updateSearchIndex(): Promise<void> {
    // Get all blocks and send to worker
    const blocks = await this.blockRepository.getAllBlocks();
    
    this.worker.postMessage({
      type: SearchWorkerMessageType.INDEX_UPDATE,
      data: { blocks }
    });
  }
  
  private handleWorkerMessage = (event: MessageEvent<SearchWorkerMessage>): void => {
    const { type, data } = event.data;
    
    switch (type) {
      case SearchWorkerMessageType.SEARCH_RESPONSE: {
        const requestId = data.requestId;
        const pendingRequest = this.requestMap.get(requestId);
        
        if (pendingRequest) {
          pendingRequest.resolve(data.results);
          this.requestMap.delete(requestId);
        }
        break;
      }
        
      case SearchWorkerMessageType.ERROR: {
        const requestId = data.requestId;
        const pendingRequest = this.requestMap.get(requestId);
        
        if (pendingRequest) {
          pendingRequest.reject(new Error(data.error));
          this.requestMap.delete(requestId);
        }
        break;
      }
      
      case SearchWorkerMessageType.INDEX_COMPLETE:
        console.log(`Search index updated with ${data.count} blocks`);
        break;
        
      default:
        console.error('Unknown message type from worker:', type);
    }
  };
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const requestId = `search_${this.requestId++}`;
    
    return new Promise((resolve, reject) => {
      this.requestMap.set(requestId, { resolve, reject });
      
      this.worker.postMessage({
        type: SearchWorkerMessageType.SEARCH_REQUEST,
        data: { query, options, requestId }
      });
      
      // Set timeout to prevent hanging promises
      setTimeout(() => {
        if (this.requestMap.has(requestId)) {
          reject(new Error('Search request timed out'));
          this.requestMap.delete(requestId);
        }
      }, 5000);
    });
  }
  
  async filter(filters: FilterCriteria): Promise<Block[]> {
    // Directly use block repository for simpler filters
    return this.blockRepository.getBlocksWithFilters(filters);
  }
  
  async suggestBlocks(context: EditorContext): Promise<Block[]> {
    // Extract keywords from the context
    const keywords = this.extractKeywords(context.text);
    
    // Perform searches for each keyword and combine results
    const searchPromises = keywords.map(keyword => 
      this.search(keyword, { limit: 3, includeContent: true })
    );
    
    const searchResults = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const blockMap = new Map<string, SearchResultItem>();
    
    for (const result of searchResults) {
      for (const item of result.items) {
        if (!blockMap.has(item.block.id) || blockMap.get(item.block.id)!.score < item.score) {
          blockMap.set(item.block.id, item);
        }
      }
    }
    
    // Sort by score and convert to blocks
    return Array.from(blockMap.values())
      .sort((a, b) => b.score - a.score)
      .map(item => item.block);
  }
  
  async getRecentBlocks(limit: number = 10): Promise<Block[]> {
    return this.blockRepository.getBlocksSortedBy('last_used', 'desc', limit);
  }
  
  async getPopularBlocks(limit: number = 10): Promise<Block[]> {
    return this.blockRepository.getBlocksSortedBy('usage_count', 'desc', limit);
  }
  
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction for context-aware suggestions
    // In a real implementation, this would use NLP techniques
    
    // Remove common stop words
    const stopWords = new Set(['the', 'and', 'a', 'to', 'of', 'in', 'is', 'that', 'for', 'with']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')  // Remove punctuation
      .split(/\s+/)              // Split by whitespace
      .filter(word => word.length > 3 && !stopWords.has(word))  // Remove stop words and short words
      .slice(-5);                // Take the last 5 words (most recent context)
  }
}
```

### 5. Highlighting Matched Text

```typescript
export function highlightMatches(text: string, matches: [number, number][]): React.ReactNode[] {
  if (!matches || matches.length === 0) {
    return [text];
  }
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  // Sort matches by start position
  const sortedMatches = [...matches].sort((a, b) => a[0] - b[0]);
  
  for (const [start, end] of sortedMatches) {
    // Add text before the match
    if (start > lastIndex) {
      result.push(text.substring(lastIndex, start));
    }
    
    // Add the highlighted match
    result.push(
      <span className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5" key={`${start}-${end}`}>
        {text.substring(start, end)}
      </span>
    );
    
    lastIndex = end;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
  return result;
}
```

## Implementation Steps

### Step 1: Create Basic Search Service

1. Create a simple search service that works directly without web workers:
```typescript
export class SimpleSearchService implements SearchService {
  private blockRepository: BlockRepository;
  
  constructor(blockRepository: BlockRepository) {
    this.blockRepository = blockRepository;
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    const blocks = await this.blockRepository.getAllBlocks();
    const rankingStrategy = new DefaultRankingStrategy();
    
    // Perform in-memory search
    const results = blocks
      .map(block => {
        const score = rankingStrategy.calculateScore(block, query, options);
        return { block, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
    
    // Apply filters and limits
    let filteredResults = results;
    
    if (options.types?.length) {
      filteredResults = filteredResults.filter(
        item => options.types!.includes(item.block.typeId)
      );
    }
    
    if (options.favorites) {
      filteredResults = filteredResults.filter(item => item.block.favorite);
    }
    
    const limitedResults = options.limit 
      ? filteredResults.slice(0, options.limit) 
      : filteredResults;
    
    // Find match positions for highlighting
    return {
      items: limitedResults.map(item => ({
        block: item.block,
        score: item.score,
        matches: this.findMatches(item.block, query)
      })),
      total: filteredResults.length,
      query
    };
  }
  
  // Implement other methods...
  
  private findMatches(block: Block, query: string): any[] {
    // Implementation similar to worker version
  }
}
```

### Step 2: Implement Web Worker for Performance

1. Create the worker file as shown earlier
2. Set up the worker communication
3. Implement the main thread service that uses the worker

### Step 3: Implement Context-Aware Suggestions

```typescript
export function getContextFromEditor(editor: Editor): EditorContext {
  const position = editor.getCursorPosition();
  const currentLine = editor.getLine(position.line);
  const precedingText = editor.getTextBeforeCursor(100); // Get up to 100 chars before cursor
  
  return {
    text: precedingText,
    line: currentLine,
    position
  };
}

export class SuggestionManager {
  private searchService: SearchService;
  
  constructor(searchService: SearchService) {
    this.searchService = searchService;
  }
  
  async getSuggestionsForContext(context: EditorContext): Promise<Block[]> {
    return this.searchService.suggestBlocks(context);
  }
  
  // Additional suggestion methods based on prompt structure
  async getSuggestionsForBlockType(typeId: string, limit: number = 5): Promise<Block[]> {
    return this.searchService.filter({ typeId, limit });
  }
  
  async getSuggestionsAfterBlock(previousBlockTypeId: string): Promise<Block[]> {
    // Suggest logical next blocks based on the previous block type
    // For example, after a Role block, suggest Context blocks
    const suggestionMap: Record<string, string[]> = {
      'role-setting': ['context', 'task-description'],
      'context': ['task-description', 'action'],
      'task-description': ['action', 'constraints'],
      'action': ['output-format', 'success-criteria'],
      // More mappings...
    };
    
    const suggestedTypes = suggestionMap[previousBlockTypeId] || [];
    if (suggestedTypes.length === 0) return [];
    
    // Get top blocks from each suggested type
    const blocksPromises = suggestedTypes.map(typeId => 
      this.searchService.filter({ typeId, limit: 2 })
    );
    
    const results = await Promise.all(blocksPromises);
    return results.flat();
  }
}
```

### Step 4: Implement Search Results Caching

```typescript
export class CachedSearchService implements SearchService {
  private delegate: SearchService;
  private cache: Map<string, { results: SearchResults, timestamp: number }> = new Map();
  private cacheTTL = 30 * 1000; // 30 seconds in milliseconds
  
  constructor(delegate: SearchService) {
    this.delegate = delegate;
  }
  
  async search(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    // Create cache key from query and options
    const cacheKey = this.createCacheKey(query, options);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.results;
    }
    
    // Perform search
    const results = await this.delegate.search(query, options);
    
    // Cache results
    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });
    
    return results;
  }
  
  // Implement other methods, delegating to the wrapped service
  
  private createCacheKey(query: string, options: SearchOptions): string {
    return `${query}|${JSON.stringify(options)}`;
  }
  
  clearCache(): void {
    this.cache.clear();
  }
  
  invalidateCacheFor(query: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${query}|`)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### Step 5: Add Fuzzy Search Capabilities

```typescript
export function fuzzyMatch(text: string, pattern: string): { matched: boolean, score: number } {
  const text_lower = text.toLowerCase();
  const pattern_lower = pattern.toLowerCase();
  
  // Exact match gets highest score
  if (text_lower === pattern_lower) {
    return { matched: true, score: 1.0 };
  }
  
  // Check if all characters in pattern appear in text in order
  let score = 0;
  let patternIdx = 0;
  let textIdx = 0;
  let consecutiveMatches = 0;
  
  while (patternIdx < pattern_lower.length && textIdx < text_lower.length) {
    if (pattern_lower[patternIdx] === text_lower[textIdx]) {
      patternIdx++;
      consecutiveMatches++;
      
      // Boost score for consecutive matches
      score += 0.1 + (consecutiveMatches * 0.05);
    } else {
      consecutiveMatches = 0;
    }
    
    textIdx++;
  }
  
  // If we matched all pattern characters
  if (patternIdx === pattern_lower.length) {
    // Normalize score based on pattern length and matchedness
    score = score / pattern_lower.length;
    
    // Bonus for matching at start of text
    if (text_lower.startsWith(pattern_lower.charAt(0))) {
      score += 0.2;
    }
    
    // Bonus for shorter texts (better matches)
    score += 0.3 * (1 - (text_lower.length - pattern_lower.length) / text_lower.length);
    
    return { matched: true, score: Math.min(score, 0.95) }; // Cap at 0.95 to keep below exact match
  }
  
  return { matched: false, score: 0 };
}
```

### Step 6: Connect to UI Components

```typescript
export function SearchBox({ onSearch }: SearchBoxProps): JSX.Element {
  const [query, setQuery] = useState('');
  const searchService = useSearchService();
  const debouncedSearch = useDebounce(async (q: string) => {
    const results = await searchService.search(q);
    onSearch(results);
  }, 300);
  
  useEffect(() => {
    if (query.trim()) {
      debouncedSearch(query);
    } else {
      onSearch({ items: [], total: 0, query: '' });
    }
  }, [query, debouncedSearch, onSearch]);
  
  return (
    <div className="relative">
      <input
        type="text"
        className="w-full px-10 py-2 border rounded-lg"
        placeholder="Search blocks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      {query && (
        <button
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          onClick={() => setQuery('')}
        >
          <XIcon />
        </button>
      )}
    </div>
  );
}
```

## Testing

### Unit Tests for Search Functionality

```typescript
describe('SearchService', () => {
  let searchService: SearchService;
  let blockRepository: BlockRepository;
  
  beforeEach(() => {
    // Mock block repository
    blockRepository = {
      getAllBlocks: jest.fn(),
      getBlocksWithFilters: jest.fn(),
      getBlocksSortedBy: jest.fn()
    } as unknown as BlockRepository;
    
    searchService = new SimpleSearchService(blockRepository);
  });
  
  test('search should return matching blocks sorted by score', async () => {
    // Setup
    const blocks = [
      {
        id: '1',
        name: 'Business Analyst Role',
        description: 'Sets the AI as a business analyst',
        content: 'Act as a business analyst',
        tags: ['business', 'analyst'],
        // Other properties...
      },
      {
        id: '2',
        name: 'Technical Document Review',
        description: 'Instructions for reviewing technical documents',
        content: 'Review the technical document for clarity and accuracy',
        tags: ['technical', 'review'],
        // Other properties...
      }
    ] as Block[];
    
    blockRepository.getAllBlocks = jest.fn().mockResolvedValue(blocks);
    
    // Execute
    const results = await searchService.search('business');
    
    // Assert
    expect(results.items.length).toBe(1);
    expect(results.items[0].block.id).toBe('1');
    expect(results.total).toBe(1);
  });
  
  // More tests...
});
```

### Performance Testing

```typescript
describe('SearchService Performance', () => {
  let searchService: SearchService;
  let blockRepository: BlockRepository;
  
  // Generate a large number of blocks for performance testing
  function generateBlocks(count: number): Block[] {
    const blocks: Block[] = [];
    
    for (let i = 0; i < count; i++) {
      blocks.push({
        id: `block-${i}`,
        name: `Block ${i}`,
        description: `Description for block ${i}`,
        content: `Content for block ${i}. This is a longer content to simulate real blocks.`,
        tags: [`tag-${i % 10}`, `category-${i % 5}`],
        typeId: `type-${i % 5}`,
        // Other properties...
      } as Block);
    }
    
    return blocks;
  }
  
  beforeEach(() => {
    blockRepository = {
      getAllBlocks: jest.fn().mockResolvedValue(generateBlocks(1000)),
      // Mock other methods...
    } as unknown as BlockRepository;
    
    searchService = new WebWorkerSearchService(blockRepository);
  });
  
  test('should handle searches over large datasets efficiently', async () => {
    const start = performance.now();
    
    const results = await searchService.search('block 500');
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100); // Search should complete in under 100ms
    expect(results.items.length).toBeGreaterThan(0);
  });
});
```

## Integration with Other Components

### How the Search Engine is Used

- **Command Palette UI**: Uses search to filter blocks as user types
- **Sidebar Panel**: Uses search for filtering blocks by type or query
- **Block Explorer**: Uses search and filter functions for advanced filtering
- **Editor Integration**: Uses context-aware suggestions to recommend blocks
- **Template System**: Uses search to find blocks to include in templates

## Implementation Considerations

1. **Performance vs Accuracy**: Balance search accuracy with performance; optimize for speed on large collections
2. **Memory Management**: For very large block collections, implement pagination and index partitioning
3. **Offline Availability**: Ensure search works fully offline with no degradation in functionality
4. **Context Awareness**: Improve the keyword extraction with more sophisticated NLP techniques as the app matures
5. **Internationalization**: Add support for searching in multiple languages with proper Unicode handling