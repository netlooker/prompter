// src/components/editor/CommandPalette/types.ts

export type PromptBlockCategory =
  | "personas"
  | "instructions"
  | "templates"
  | "constraints"
  | "system";

export interface PromptBlock {
  id: string;
  title: string;
  description: string;
  category: PromptBlockCategory;
  content: string;
  tags?: string[];
  shortcut?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (block: PromptBlock) => void;
  editorInstance?: any; // Monaco editor instance
  darkMode: boolean; // Add dark mode support to match app
}

export interface CommandSearchProps {
  searchQuery: string;
  onChange: (value: string) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  darkMode: boolean;
}

export interface CommandItemProps {
  block: PromptBlock;
  isSelected: boolean;
  onSelect: () => void;
  darkMode: boolean;
}

export interface CommandGroupProps {
  category: PromptBlockCategory;
  blocks: PromptBlock[];
  selectedId: string | null;
  onSelectBlock: (block: PromptBlock) => void;
  darkMode: boolean;
}
