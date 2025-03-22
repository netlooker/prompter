// src/components/editor/CommandPalette/types.ts

export interface BlockType {
  id: string; // UUID
  name: string; // Display name
  description: string; // Explanation of this block type
  icon: string; // Icon name from lucide-react
}

export interface Block {
  id: string; // UUID
  typeId: string; // Reference to parent BlockType.id
  name: string; // Display name
  description?: string; // Optional explanation
  content: string; // Actual block content
  tags?: string[]; // Optional tags for searching
  createdAt: number; // Timestamp
  updatedAt: number; // Last update timestamp
}

// Command Palette interfaces
export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (block: Block) => void;
  editorInstance?: any; // Monaco editor instance
  darkMode: boolean;
}

export interface CommandSearchProps {
  searchQuery: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  darkMode: boolean;
}

export interface BlockTypeItemProps {
  blockType: BlockType;
  isSelected: boolean;
  onSelect: () => void;
  darkMode: boolean;
}

export interface BlockItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  darkMode: boolean;
}

export interface BlockTypeListProps {
  blockTypes: BlockType[];
  selectedId: string | null;
  onSelectBlockType: (blockType: BlockType) => void;
  darkMode: boolean;
}

export interface BlockListProps {
  blocks: Block[];
  selectedId: string | null;
  onSelectBlock: (block: Block) => void;
  blockType: BlockType;
  darkMode: boolean;
  onBack: () => void;
}

// For backward compatibility during transition
export interface CommandGroupProps {
  category: string;
  blocks: Block[];
  selectedId: string | null;
  onSelectBlock: (block: Block) => void;
  darkMode: boolean;
}

export interface CommandItemProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  darkMode: boolean;
}

export enum PaletteView {
  TYPES = "types",
  BLOCKS = "blocks",
}
