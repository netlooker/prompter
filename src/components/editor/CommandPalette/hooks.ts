// src/components/editor/CommandPalette/hooks.ts
import { useState, useEffect, useCallback } from "react";
import { Block, BlockType, PaletteView } from "./types";
import { blockTypes, getBlocksByType } from "./data";
import { fuzzySearch } from "./utils";

// Hook for navigating between block types
export interface UseBlockTypeNavigationProps {
  onSelectBlockType: (blockType: BlockType) => void;
  onClose: () => void;
  searchQuery: string;
}

export const useBlockTypeNavigation = ({
  onSelectBlockType,
  onClose,
  searchQuery,
}: UseBlockTypeNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    blockTypes.length > 0 ? blockTypes[0].id : null,
  );

  // Filter block types based on search query
  const filteredBlockTypes = searchQuery
    ? fuzzySearch(blockTypes, searchQuery, ["name", "description"])
    : blockTypes;

  // Update selected item when filtered block types change
  useEffect(() => {
    if (filteredBlockTypes.length > 0) {
      setSelectedIndex(0);
      setSelectedId(filteredBlockTypes[0].id);
    } else {
      setSelectedId(null);
    }
  }, [filteredBlockTypes]);

  // Scroll selected item into view
  const scrollSelectedIntoView = useCallback((id: string) => {
    setTimeout(() => {
      const container = document.getElementById("command-palette-content");
      const selectedElement = document.querySelector(
        `[data-block-type-id="${id}"]`,
      );

      if (container && selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        if (
          selectedRect.bottom > containerRect.bottom ||
          selectedRect.top < containerRect.top
        ) {
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, 0);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (filteredBlockTypes.length > 0) {
            const newIndex = (selectedIndex + 1) % filteredBlockTypes.length;
            const newId = filteredBlockTypes[newIndex].id;
            setSelectedIndex(newIndex);
            setSelectedId(newId);
            scrollSelectedIntoView(newId);
          }
          break;

        case "ArrowUp":
          event.preventDefault();
          if (filteredBlockTypes.length > 0) {
            const newIndex =
              (selectedIndex - 1 + filteredBlockTypes.length) %
              filteredBlockTypes.length;
            const newId = filteredBlockTypes[newIndex].id;
            setSelectedIndex(newIndex);
            setSelectedId(newId);
            scrollSelectedIntoView(newId);
          }
          break;

        case "ArrowRight":
        case "Enter":
          event.preventDefault();
          if (selectedId && filteredBlockTypes.length > 0) {
            const selectedBlockType = filteredBlockTypes.find(
              (blockType) => blockType.id === selectedId,
            );
            if (selectedBlockType) {
              onSelectBlockType(selectedBlockType);
            }
          }
          break;

        case "Escape":
          event.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    },
    [
      filteredBlockTypes,
      selectedIndex,
      selectedId,
      onSelectBlockType,
      onClose,
      scrollSelectedIntoView,
    ],
  );

  return {
    selectedId,
    filteredBlockTypes,
    handleKeyDown,
  };
};

// Hook for navigating blocks within a type
export interface UseBlockNavigationProps {
  blockType: BlockType;
  onSelectBlock: (block: Block) => void;
  onBack: () => void;
  onClose: () => void;
  searchQuery: string;
}

export const useBlockNavigation = ({
  blockType,
  onSelectBlock,
  onBack,
  onClose,
  searchQuery,
}: UseBlockNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Get blocks for the selected type
  const typeBlocks = getBlocksByType(blockType.id);

  // Filter blocks based on search query
  const filteredBlocks = searchQuery
    ? fuzzySearch(typeBlocks, searchQuery, ["name", "description", "tags"])
    : typeBlocks;

  // Update selected item when filtered blocks change
  useEffect(() => {
    if (filteredBlocks.length > 0) {
      setSelectedIndex(0);
      setSelectedId(filteredBlocks[0].id);
    } else {
      setSelectedId(null);
    }
  }, [filteredBlocks, blockType.id]);

  // Scroll selected item into view
  const scrollSelectedIntoView = useCallback((id: string) => {
    setTimeout(() => {
      const container = document.getElementById("command-palette-content");
      const selectedElement = document.querySelector(`[data-block-id="${id}"]`);

      if (container && selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        if (
          selectedRect.bottom > containerRect.bottom ||
          selectedRect.top < containerRect.top
        ) {
          selectedElement.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        }
      }
    }, 0);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (filteredBlocks.length > 0) {
            const newIndex = (selectedIndex + 1) % filteredBlocks.length;
            const newId = filteredBlocks[newIndex].id;
            setSelectedIndex(newIndex);
            setSelectedId(newId);
            scrollSelectedIntoView(newId);
          }
          break;

        case "ArrowUp":
          event.preventDefault();
          if (filteredBlocks.length > 0) {
            const newIndex =
              (selectedIndex - 1 + filteredBlocks.length) %
              filteredBlocks.length;
            const newId = filteredBlocks[newIndex].id;
            setSelectedIndex(newIndex);
            setSelectedId(newId);
            scrollSelectedIntoView(newId);
          }
          break;

        case "ArrowLeft":
          event.preventDefault();
          onBack();
          break;

        case "Enter":
          event.preventDefault();
          if (selectedId && filteredBlocks.length > 0) {
            const selectedBlock = filteredBlocks.find(
              (block) => block.id === selectedId,
            );
            if (selectedBlock) {
              onSelectBlock(selectedBlock);
            }
          }
          break;

        case "Escape":
          event.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    },
    [
      filteredBlocks,
      selectedIndex,
      selectedId,
      onSelectBlock,
      onBack,
      onClose,
      scrollSelectedIntoView,
    ],
  );

  return {
    selectedId,
    filteredBlocks,
    handleKeyDown,
  };
};

// Main command palette hook
interface UseCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (block: Block) => void;
  editorInstance?: any;
}

export const useCommandPalette = ({
  isOpen,
  onClose,
  onSelectBlock,
  editorInstance,
}: UseCommandPaletteProps) => {
  const [view, setView] = useState<PaletteView>(PaletteView.TYPES);
  const [selectedBlockType, setSelectedBlockType] = useState<BlockType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Reset state when command palette opens or closes
  useEffect(() => {
    if (isOpen) {
      setView(PaletteView.TYPES);
      setSelectedBlockType(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle block type selection
  const handleSelectBlockType = useCallback((blockType: BlockType) => {
    setSelectedBlockType(blockType);
    setView(PaletteView.BLOCKS);
  }, []);

  // Handle back navigation
  const handleBack = useCallback(() => {
    setView(PaletteView.TYPES);
    setSelectedBlockType(null);
  }, []);

  // Handle block selection and insertion
  const handleSelectBlock = useCallback(
    (block: Block) => {
      if (editorInstance) {
        // Get current cursor position
        const selection = editorInstance.getSelection();
        const position = selection ? selection.getPosition() : null;

        if (position) {
          // Insert block content at cursor position
          const operation = {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            text: block.content,
            forceMoveMarkers: true,
          };

          editorInstance.executeEdits("command-palette", [operation]);
        }
      }

      // Call the onSelectBlock callback
      onSelectBlock(block);

      // Close the command palette
      onClose();
    },
    [editorInstance, onSelectBlock, onClose],
  );

  // Update search query
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Block type navigation
  const {
    selectedId: selectedTypeId,
    filteredBlockTypes,
    handleKeyDown: handleTypeKeyDown,
  } = useBlockTypeNavigation({
    onSelectBlockType: handleSelectBlockType,
    onClose,
    searchQuery,
  });

  // Block navigation (only used when a block type is selected)
  const {
    selectedId: selectedBlockId,
    filteredBlocks,
    handleKeyDown: handleBlockKeyDown,
  } = useBlockNavigation({
    blockType: selectedBlockType || blockTypes[0], // Fallback to first block type
    onSelectBlock: handleSelectBlock,
    onBack: handleBack,
    onClose,
    searchQuery,
  });

  // Determine which key handler to use based on current view
  const handleKeyDown =
    view === PaletteView.TYPES ? handleTypeKeyDown : handleBlockKeyDown;

  return {
    view,
    searchQuery,
    selectedBlockType,
    selectedTypeId,
    selectedBlockId,
    filteredBlockTypes,
    filteredBlocks,
    handleSearchChange,
    handleKeyDown,
    handleSelectBlockType,
    handleSelectBlock,
    handleBack,
  };
};
