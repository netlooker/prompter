# Block Library Business Requirements Specification

## 1. Introduction

The Block Library is a core infrastructure component of the Prompter PWA that manages, categorizes, and provides access to reusable prompt blocks. This document outlines the requirements for the Block Library's functionality, architecture, and integration points, as well as potential user interface options for interacting with the library. The Block Library is designed to function entirely within the browser environment, supporting offline usage scenarios.

## 2. Purpose and Vision

The Block Library serves as the central repository for all reusable content blocks within the application. It enables users to efficiently construct complex prompts by providing a structured way to store, organize, search, and insert pre-defined content. The library promotes consistency, reduces repetitive work, and accelerates the prompt creation process.

## 3. Core Business Requirements

### 3.1 Block Management
- Store and organize reusable prompt blocks
- Categorize blocks by type, purpose, and user-defined tags
- Track block usage metrics for optimization
- Support bulk operations (import/export)

### 3.2 Block Accessibility
- Make blocks available across the entire application
- Provide consistent access patterns regardless of UI implementation
- Support programmatic access for automation features
- Enable efficient searching and filtering of blocks

### 3.3 Block Customization
- Allow users to create and edit custom blocks
- Enable sharing and collaboration around blocks
- Implement a favorites system for frequently used blocks

## 4. Block Data Structure

### 4.1 Block Properties
Each block must contain:
- **id**: Unique identifier (UUID)
- **typeId**: Reference to parent block type
- **name**: User-friendly display name
- **description**: Optional detailed explanation
- **content**: The actual text content to be inserted
- **tags**: Optional array of searchable keywords
- **created**: Timestamp of creation
- **updated**: Timestamp of last modification
- **favorite**: Boolean indicating favorite status
- **usage_count**: Number of times the block has been used
- **last_used**: Timestamp of most recent usage
- **is_system**: Boolean indicating if it's a built-in block
- **icon**: Icon name from lucide-react library

### 4.2 Block Types
A block type contains:
- **id**: Unique identifier (UUID)
- **name**: Display name
- **description**: Explanation of this block type
- **icon**: Icon name from lucide-react
- **is_system**: Boolean indicating if it's a built-in block type

Standard system block types include:
- **Role Setting**: Defines who the AI should act as (expertise level and persona)
- **Context**: Provides background information and explains why the task matters
- **Task Description**: Specifies what needs to be done
- **Action**: Describes how the task should be approached or executed
- **Output Format**: Desired structure and formatting of the response
- **Success Criteria**: Defines what makes a response complete and valuable
- **Constraints**: Sets boundaries, requirements, and limitations
- **Examples**: Provides reference examples of expected format or content
- **Boosters**: Phrases that optimize AI performance ("think step by step")

Users can create additional block types based on their specific needs.

### 4.3 Collections
- Support for grouping blocks into user-defined collections
- Collection properties (name, description, icon)
- Blocks can belong to multiple collections
- Special system collections (Favorites, Recent, Most Used)

## 5. Functional Capabilities

### 5.1 CRUD Operations
- Create new blocks (custom user blocks)
- Read blocks and their metadata
- Update existing blocks (user blocks and copies of system blocks)
- Delete blocks (with safeguards for system blocks)
- Duplicate blocks to create variations

### 5.2 Search and Discovery
- Fast, client-side full-text search across all block properties
- Tag-based filtering
- Type-based filtering
- Recency and popularity sorting
- Smart suggestions based on current content
- Context-aware block recommendations

### 5.3 Import/Export
- Export blocks or collections to JSON/YAML
- Import blocks from external sources
- Batch creation of blocks
- Sharing blocks between users

### 5.4 Templates System
- Create templates that combine multiple blocks
- Insert placeholder blocks to be filled in the editor
- Save frequently used block combinations as templates
- Organize templates by purpose or use case
- Support common prompt frameworks (RACE, CARE, TAG, etc.)
- Allow for custom prompt frameworks

## 6. Integration Points

### 6.1 Editor Integration
- Insert blocks at cursor position
- Replace selected text with block content
- Auto-suggest relevant blocks based on editor content
- Drag-and-drop block insertion

### 6.2 API for Extensions
- Well-defined API for accessing block data
- Event hooks for block usage, creation, modification
- Methods for block rendering and formatting
- Integration with third-party services

### 6.3 Storage and Persistence
- Browser-based persistent storage (IndexedDB/localStorage)
- Efficient data serialization for performance
- Automatic data backup to prevent loss
- Export/import functionality for data portability
- Graceful handling of storage limitations

## 7. User Interface Options

The Block Library is a backend service that can be accessed through multiple user interface patterns. Each has specific advantages and use cases:

### 7.1 Command Palette Pattern
- **Description**: Modal overlay activated via keyboard shortcut
- **Advantages**: 
  - Keyboard-focused workflow
  - Minimal screen space usage
  - Quick access for power users
  - Familiarity (similar to VS Code, Sublime Text)
- **Best for**: Quick insertion during active typing, keyboard power users
- **Key interactions**: Keyboard shortcuts, search, hierarchical navigation

### 7.2 Sidebar Panel Pattern
- **Description**: Persistent sidebar showing blocks organized by type
- **Advantages**:
  - Always visible
  - Drag-and-drop friendly
  - Can show more context
  - Category browsing is more visual
- **Best for**: Exploration, learning the available blocks, drag-and-drop workflows
- **Key interactions**: Click, drag, accordion navigation, pinning

### 7.3 Floating Toolbar Pattern
- **Description**: Context-aware floating toolbar that appears near cursor
- **Advantages**:
  - Minimal movement required
  - Context-sensitive suggestions
  - Non-modal interaction
  - Less disruptive to workflow
- **Best for**: Context-aware insertions, minimalist interfaces
- **Key interactions**: Hover activation, quick selection

### 7.4 Block Explorer Pattern
- **Description**: Dedicated full-page view for browsing and managing blocks
- **Advantages**:
  - Comprehensive management
  - Advanced filtering and sorting
  - Detailed block information
  - Bulk operations
- **Best for**: Block management, organization, curation
- **Key interactions**: Grid/list views, multi-select, management tools

### 7.5 Slash Command Pattern
- **Description**: In-line command triggered by typing "/" followed by search terms
- **Advantages**:
  - Stays in the flow of writing
  - No context switching
  - Similar to modern editors (Notion, Slack)
  - Very fast for known blocks
- **Best for**: Seamless writing experience, minimal disruption
- **Key interactions**: Slash trigger, autocomplete, arrow selection

## 8. UI-Agnostic Interaction Requirements

Regardless of the UI pattern chosen, the following interaction capabilities should be supported:

### 8.1 Block Selection
- Clear visual indication of the currently selected block
- Preview of block content before insertion
- Consistent selection behavior across UI patterns

### 8.2 Block Insertion
- Insert at cursor position
- Option to replace selected text
- Variable substitution prompt when needed
- Confirmation for blocks with side effects

### 8.3 Block Management
- Toggle favorite status for quick access
- Create new blocks from selection
- Edit existing blocks
- Categorize and tag blocks

### 8.4 Search and Filter
- Real-time filtering as the user types
- Relevance-based sorting
- History-aware suggestions
- Clear feedback when no results match

## 9. Performance and Technical Requirements

### 9.1 Performance
- Fast loading time (<100ms for initial library load)
- Responsive interaction (no noticeable lag)
- Efficient rendering of large block collections
- Smooth animations and transitions
- Memory-efficient implementation
- Optimize for mobile devices and slower connections

### 9.2 Technical Architecture
- Separation of concerns between data layer and UI
- Event-driven architecture for real-time updates
- Caching strategy for frequent operations
- Lazy loading for large libraries
- Optimistic UI updates

### 9.3 PWA and Offline Capabilities
- Full functionality without internet connection
- Service worker integration for resource caching
- Resilient data storage using IndexedDB
- Clear indication of offline mode to users
- Graceful degradation for limited browser support

### 9.4 Accessibility
- Keyboard navigability across all UI patterns
- Screen reader compatibility
- Focus management
- Proper ARIA attributes
- Color contrast compliance

## 10. Implementation Considerations

### 10.1 Hybrid Approach Recommendation
For optimal usability, consider implementing multiple UI patterns that access the same Block Library backend:

1. **Primary Interface**: Command Palette or Slash Commands for quick, keyboard-driven insertion
2. **Secondary Interface**: Sidebar Panel for exploration and drag-and-drop
3. **Management Interface**: Block Explorer for comprehensive block management

This hybrid approach caters to different user preferences and workflows while maintaining consistency in the underlying block data.

### 10.2 Progressive Enhancement
- Start with the essential Command Palette pattern
- Add the Block Explorer for management capabilities
- Implement the Sidebar Panel or Floating Toolbar as the application matures
- Incorporate Slash Commands for the most seamless experience

### 10.3 User Preference
- Allow users to choose their preferred interaction method
- Remember user preferences across sessions
- Support switching between UI patterns without disruption

## 11. User Testing Recommendations

Before committing to a specific UI pattern, conduct user testing to determine:

1. Which pattern(s) users find most intuitive
2. The optimal balance between keyboard and mouse interactions
3. The most effective organization of blocks within each pattern
4. Whether different user segments prefer different patterns

## 12. Future Enhancements

- Block recommendations based on AI analysis of current content
- Community-shared block repository
- Block performance analytics (effectiveness of prompts)
- Block versioning and version history
- Analytics for block usage patterns and effectiveness
- Template blocks with complex variable logic
- Interactive blocks with dynamic content
- Block chaining and sequencing
- Conditional block insertion based on context

## 13. Observations and Considerations

### 13.1 Prompt Frameworks as Templates
Common prompt frameworks could be implemented as ready-to-use templates:

- **RACE Framework**:
  - **R**ole: Block of type "Role Setting"
  - **A**ction: Block of type "Task Description" + "Action"
  - **C**ontext: Block of type "Context"
  - **E**xpectations: Block of type "Output Format" + "Success Criteria"

- **CARE Framework**:
  - **C**ontext: Block of type "Context"
  - **A**ction: Block of type "Action"
  - **R**esult: Block of type "Output Format"
  - **E**xamples: Block of type "Examples"

- **TAG Framework**:
  - **T**ask: Block of type "Task Description"
  - **A**ction: Block of type "Action"
  - **G**oal: Block of type "Success Criteria"

These pre-built templates would give users a quick start while teaching effective prompt construction principles.

### 13.2 Template System Implementation
- The template system should be distinct from block types, serving as a meta-layer that organizes blocks
- Templates could be stored with a structure like:
  ```typescript
  Template {
    id: string;                 // UUID
    name: string;               // Display name
    description: string;        // Purpose of this template
    blocks: TemplateBlock[];    // Array of blocks with positioning info
    icon: string;               // Icon from lucide-react
    created: timestamp;         // Creation date
    updated: timestamp;         // Last modified date
  }
  
  TemplateBlock {
    id: string;                 // UUID
    blockId: string | null;     // Reference to a block or null for placeholder
    position: number;           // Order in the template
    isPlaceholder: boolean;     // Whether this is a placeholder to be filled
    placeholderName: string;    // Name for the placeholder if applicable
  }
  ```
- Placeholder blocks should be visually distinct in the editor, perhaps with a unique styling and an "Edit" button

### 13.3 UI Consideration for Templates
- Consider a visual "template builder" interface that allows dragging blocks into position
- Templates could be visualized as a series of connected blocks, similar to a flowchart
- When inserting a template, unfilled placeholders could trigger a wizard-like interface

### 13.4 Block Type vs Block Instances
- There's a clear separation between the "type" of a block (Role, Instruction, etc.) and individual block instances
- This allows for better organization while maintaining flexibility
- Consider how the UI can make this distinction clear without becoming overly complex

### 13.5 Progressive Disclosure
- The library's advanced features should follow progressive disclosure principles
- Basic usage (inserting individual blocks) should be immediately accessible
- Template creation and management should be accessible but not dominate the interface
- More advanced features can be introduced as users become more familiar with the system

### 13.6 Offline Mode Considerations
- All core functionality should work without an internet connection
- Use browser storage (primarily IndexedDB) for data persistence
- IndexedDB can store significantly more data than localStorage (typically >50MB vs 5MB)
- Use a library like Dexie.js to simplify IndexedDB interactions
- Implement storage quota management to avoid exceeding browser limits
- Provide clear feedback when storage is approaching limits
- Consider data export options as a fallback for storage limitations

### 13.7 PWA Implementation Notes
- Service workers should cache all necessary resources for the Block Library
- The application manifest should include appropriate categories and descriptions
- Consider using a web worker for search operations to keep the UI responsive
- Implement proper install prompts to encourage users to add the app to home screen
- Include offline usage instructions in onboarding or help documentation
- Test thoroughly on various mobile devices and browsers with storage limitations