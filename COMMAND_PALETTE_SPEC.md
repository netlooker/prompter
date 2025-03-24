# Command Palette Business Requirements Specification

## 1. Introduction

The Command Palette is a core feature of the Prompter PWA that enables users to efficiently insert pre-defined prompt blocks into the editor. This document outlines the requirements for the Command Palette's functionality, user interface, and behavior.

## 2. Purpose

The Command Palette provides quick access to reusable prompt blocks, allowing users to construct complex prompts without having to type them from scratch. It improves user efficiency and promotes consistency in prompt creation.

## 3. Feature Overview

The Command Palette implements a hierarchical two-level navigation system:
- **Level 1**: Block types (Role, Instruction, Template, etc.)
- **Level 2**: Individual blocks within the selected type

## 4. User Interface Requirements

### 4.1 Visual Appearance

- The palette should be a modal dialog overlaying the editor
- Maximum width of 2xl (42rem/672px)
- Maximum height of 70vh with scrolling for overflow content
- Dark/light mode support to match the application theme
- Minimum height of 300px for Level 1 to display at least 5 items
- Rounded corners (lg/0.5rem)
- Drop shadow (lg)

### 4.2 Components

#### 4.2.1 Header
- Title reflecting current view ("Prompt Blocks" or "[Type] Blocks")
- Close button (X) in the top-right corner

#### 4.2.2 Search Box
- Only present in Level 2 (blocks view)
- Search icon on the left
- Full-width input field
- Placeholder text: "Search prompt blocks..."

#### 4.2.3 Content Area
- Scrollable area for displaying block types or blocks
- Clear visual indication of the currently selected item
- Proper spacing between items
- Custom scrollbar styling

#### 4.2.4 Footer
- Keyboard shortcut indicators
- Styled pill buttons for keyboard keys
- Navigation information (↑↓, →/←, Enter, Esc, F)

## 5. Functional Requirements

### 5.1 Block Organization

- **Favorites**: User-marked favorite blocks
- **Recent**: Recently used blocks
- **Role**: Blocks defining AI expertise and persona
- **Instruction**: Guidelines on approaching tasks
- **Template**: Reusable prompt structures
- **Constraint**: Limitations or requirements
- **System**: Format and presentation instructions

### 5.2 Block Structure

Each block must contain:
- Unique ID
- Type ID (reference to parent block type)
- Name (display name)
- Description (optional)
- Content (actual block text to insert)
- Tags (optional, for improved searchability)
- Creation timestamp
- Update timestamp
- Favorite status (boolean)

### 5.3 Navigation

- Two-level hierarchical navigation
- Level 1: Select block type
- Level 2: Select specific block
- Back navigation from Level 2 to Level 1
- Keyboard-focused interaction

### 5.4 Search Functionality

- Real-time filtering as user types
- Search across name, description, and tags
- Context-aware (searches only in current view)
- Clear feedback when no results match
- Score-based relevance ranking (matches at beginning of text have higher priority)

### 5.5 Block Selection

- Clear visual indication of the currently selected item
- Arrow keys to navigate between items
- Enter to select an item
- Block insertion at cursor position in editor

## 6. User Interaction Requirements

### 6.1 Keyboard Shortcuts

- **Ctrl+/**: Open the Command Palette
- **Arrow Up/Down**: Navigate between items
- **Arrow Right/Enter**: Select block type (Level 1)
- **Arrow Left**: Go back to block types (from Level 2)
- **Enter**: Insert selected block (Level 2)
- **Escape**: Close the palette
- **F**: Toggle favorite status for the selected block

### 6.2 Mouse Interaction

- Click on block type to navigate to Level 2
- Click on block to insert it into the editor
- Click on back button to return to Level 1
- Click on star icon to toggle favorite status
- Click outside the palette to close

### 6.3 Scrolling

- Automatic scrolling to keep the selected item in view
- Mouse wheel scrolling
- Custom scrollbar styling
- Reliable keyboard-based scrolling

## 7. Accessibility Requirements

- Proper ARIA attributes (aria-modal, aria-labelledby, etc.)
- Focus trapping within the palette when open
- Clear focus indicators
- Keyboard navigability
- Proper contrast ratios
- Responsive to font size changes

## 8. Performance Requirements

- Fast opening time (<100ms)
- Responsive interaction (no noticeable lag)
- Efficient rendering of large lists
- Smooth scrolling
- Minimal DOM manipulation during navigation

## 9. Implementation Details

### 9.1 Component Structure

- `CommandPalette`: Main container component
- `CommandSearch`: Search input component
- `BlockTypeList`: Level 1 view component
- `BlockList`: Level 2 view component
- `BlockTypeItem`: Individual block type display
- `BlockItem`: Individual block display

### 9.2 State Management

- Track current view (types or blocks)
- Track selected type and block indexes
- Maintain filtered lists based on search input
- Persist favorites in localStorage
- Track recent usage

### 9.3 Favorites System

- Toggle favorite status with star icon or F key
- Store favorites persistently
- Special "Favorites" section at the top of Level 1
- Update UI immediately when favorite status changes

### 9.4 Recent Blocks System

- Track block usage
- Display most recently used blocks in "Recent" section
- Order by last used timestamp
- Limit to reasonable number (5-10)

## 10. Edge Cases and Error Handling

- Empty results handling (display "No matching items found")
- Loading state for slow operations
- Graceful degradation for older browsers
- Handling large numbers of blocks
- Keyboard navigation edge cases
- Window resize handling

## 11. Future Enhancements

- Drag and drop reordering of favorites
- Custom user-created blocks
- Block categories/tagging system
- Block preview
- Export/import of blocks
- Keyboard shortcut customization
