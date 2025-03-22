// src/components/editor/CommandPalette/hooks.ts
import { useState, useEffect, useCallback } from "react";
import { PromptBlock } from "./types";
import { promptBlocks } from "./data";
import { fuzzySearch, groupByCategory } from "./utils";

// Keyboard navigation hook
export interface UseKeyboardNavigationProps {
  filteredBlocks: PromptBlock[];
  onSelect: (block: PromptBlock) => void;
  onClose: () => void;
}

export const useKeyboardNavigation = ({
  filteredBlocks,
  onSelect,
  onClose,
}: UseKeyboardNavigationProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    filteredBlocks.length > 0 ? filteredBlocks[0].id : null,
  );

  // Update selected item when filtered blocks change
  useEffect(() => {
    if (filteredBlocks.length > 0) {
      // Reset to first item when filter changes
      setSelectedIndex(0);
      setSelectedId(filteredBlocks[0].id);
    } else {
      setSelectedId(null);
    }
  }, [filteredBlocks]);

  // Function to scroll selected item into view
  const scrollSelectedIntoView = useCallback((id: string) => {
    setTimeout(() => {
      const container = document.getElementById("command-palette-content");
      const selectedElement = document.querySelector(`[data-block-id="${id}"]`);

      if (container && selectedElement) {
        const containerRect = container.getBoundingClientRect();
        const selectedRect = selectedElement.getBoundingClientRect();

        // Check if the element is not fully visible
        if (
          selectedRect.bottom > containerRect.bottom ||
          selectedRect.top < containerRect.top
        ) {
          // If item is below visible area or above visible area, scroll it into view
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

        case "Enter":
          event.preventDefault();
          if (selectedId && filteredBlocks.length > 0) {
            const selectedBlock = filteredBlocks.find(
              (block) => block.id === selectedId,
            );
            if (selectedBlock) {
              onSelect(selectedBlock);
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
      onSelect,
      onClose,
      scrollSelectedIntoView,
    ],
  );

  // Handle item selection
  const handleSelect = useCallback(
    (block: PromptBlock) => {
      setSelectedId(block.id);
      setSelectedIndex(filteredBlocks.findIndex((b) => b.id === block.id));
    },
    [filteredBlocks],
  );

  return {
    selectedId,
    handleKeyDown,
    handleSelect,
  };
};

// Main command palette hook
interface UseCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (block: PromptBlock) => void;
  editorInstance?: any;
}

export const useCommandPalette = ({
  isOpen,
  onClose,
  onSelectBlock,
  editorInstance,
}: UseCommandPaletteProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBlocks, setFilteredBlocks] =
    useState<PromptBlock[]>(promptBlocks);

  // Reset search query when command palette opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setFilteredBlocks(promptBlocks);
    }
  }, [isOpen]);

  // Filter blocks based on search query
  useEffect(() => {
    const results = fuzzySearch(promptBlocks, searchQuery);
    setFilteredBlocks(results);
  }, [searchQuery]);

  // Group filtered blocks by category
  const groupedBlocks = groupByCategory(filteredBlocks);

  // Handle block selection
  const handleSelectBlock = useCallback(
    (block: PromptBlock) => {
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

  // Use keyboard navigation hook
  const { selectedId, handleKeyDown, handleSelect } = useKeyboardNavigation({
    filteredBlocks,
    onSelect: handleSelectBlock,
    onClose,
  });

  // Update search query
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return {
    searchQuery,
    filteredBlocks,
    groupedBlocks,
    selectedId,
    handleSearchChange,
    handleKeyDown,
    handleSelectBlock,
    handleSelect,
  };
};

// Monaco editor integration hook - this hook is not currently used but kept for reference
export const useMonacoCommandPalette = (_editorRef: React.RefObject<any>) => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true);
  }, []);

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false);
  }, []);

  const handleSelectBlock = useCallback((block: PromptBlock) => {
    console.log(`Selected block: ${block.title}`);
  }, []);

  // We're not using this effect in the current implementation
  // The keyboard shortcut is registered directly in MarkdownEditor.tsx
  /*
  useEffect(() => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    // This requires Monaco to be in scope, which we don't have here
    const keyMod = 2048; // CtrlCmd
    const keyCode = 85;  // KeyP/Slash

    const disposable = editorInstance.addCommand(
      keyMod | keyCode,
      () => {
        window.event?.preventDefault();
        openCommandPalette();
        return null;
      }
    );

    return () => {
      disposable?.dispose();
    };
  }, [editorRef, openCommandPalette]);
  */

  return {
    isCommandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    handleSelectBlock,
  };
};
