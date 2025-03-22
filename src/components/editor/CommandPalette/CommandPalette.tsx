// src/components/editor/CommandPalette/CommandPalette.tsx
import React, { useEffect, useRef, useCallback } from "react";
import "./CommandPalette.css";
import { createPortal } from "react-dom";
import { CommandPaletteProps, Block, BlockType } from "./types";
import { CommandSearch } from "./CommandSearch";
import { BlockTypeList } from "./BlockTypeList";
import { BlockList } from "./BlockList";

import { blockTypes, getBlocksByType } from "./data";

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  editorInstance,
  darkMode,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // States for level 1 (block types)
  const [typeView, setTypeView] = React.useState<"types" | "blocks">("types");
  const [selectedTypeIndex, setSelectedTypeIndex] = React.useState(0);
  const [selectedTypeId, setSelectedTypeId] = React.useState<string>(
    blockTypes[0].id,
  );
  const [selectedType, setSelectedType] = React.useState<BlockType>(
    blockTypes[0],
  );

  // States for level 2 (blocks)
  const [filteredBlocks, setFilteredBlocks] = React.useState<Block[]>([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = React.useState(0);
  const [selectedBlockId, setSelectedBlockId] = React.useState<string | null>(
    null,
  );

  // Common states
  const [searchQuery, setSearchQuery] = React.useState("");

  // When the palette opens, reset to default view
  useEffect(() => {
    if (isOpen) {
      setTypeView("types");
      setSelectedTypeIndex(0);
      setSelectedTypeId(blockTypes[0].id);
      setSelectedType(blockTypes[0]);
      setSearchQuery("");
    }
  }, [isOpen]);

  // When type view changes, reset block selection
  useEffect(() => {
    if (typeView === "blocks") {
      const blocks = getBlocksByType(selectedType.id);
      setFilteredBlocks(blocks);
      if (blocks.length > 0) {
        setSelectedBlockIndex(0);
        setSelectedBlockId(blocks[0].id);
      }
    }
  }, [typeView, selectedType.id]);

  // Handle search input change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  // Handle key navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (typeView === "types") {
        // Level 1 navigation
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const nextTypeIndex = (selectedTypeIndex + 1) % blockTypes.length;
            setSelectedTypeIndex(nextTypeIndex);
            setSelectedTypeId(blockTypes[nextTypeIndex].id);
            setSelectedType(blockTypes[nextTypeIndex]);
            break;
          case "ArrowUp":
            event.preventDefault();
            const prevTypeIndex =
              (selectedTypeIndex - 1 + blockTypes.length) % blockTypes.length;
            setSelectedTypeIndex(prevTypeIndex);
            setSelectedTypeId(blockTypes[prevTypeIndex].id);
            setSelectedType(blockTypes[prevTypeIndex]);
            break;
          case "ArrowRight":
          case "Enter":
            event.preventDefault();
            setTypeView("blocks");
            break;
          case "Escape":
            event.preventDefault();
            onClose();
            break;
        }
      } else {
        // Level 2 navigation
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            if (filteredBlocks.length > 0) {
              const nextBlockIndex =
                (selectedBlockIndex + 1) % filteredBlocks.length;
              setSelectedBlockIndex(nextBlockIndex);
              setSelectedBlockId(filteredBlocks[nextBlockIndex].id);

              // Scroll into view after state update
              setTimeout(() => {
                const blockElement = document.querySelector(
                  `[data-block-id="${filteredBlocks[nextBlockIndex].id}"]`,
                );
                if (blockElement && contentRef.current) {
                  const container = contentRef.current;
                  const containerRect = container.getBoundingClientRect();
                  const blockRect = blockElement.getBoundingClientRect();

                  if (
                    blockRect.bottom > containerRect.bottom ||
                    blockRect.top < containerRect.top
                  ) {
                    blockElement.scrollIntoView({ block: "nearest" });
                  }
                }
              }, 0);
            }
            break;
          case "ArrowUp":
            event.preventDefault();
            if (filteredBlocks.length > 0) {
              const prevBlockIndex =
                (selectedBlockIndex - 1 + filteredBlocks.length) %
                filteredBlocks.length;
              setSelectedBlockIndex(prevBlockIndex);
              setSelectedBlockId(filteredBlocks[prevBlockIndex].id);

              // Scroll into view after state update
              setTimeout(() => {
                const blockElement = document.querySelector(
                  `[data-block-id="${filteredBlocks[prevBlockIndex].id}"]`,
                );
                if (blockElement && contentRef.current) {
                  const container = contentRef.current;
                  const containerRect = container.getBoundingClientRect();
                  const blockRect = blockElement.getBoundingClientRect();

                  if (
                    blockRect.bottom > containerRect.bottom ||
                    blockRect.top < containerRect.top
                  ) {
                    blockElement.scrollIntoView({ block: "nearest" });
                  }
                }
              }, 0);
            }
            break;
          case "ArrowLeft":
            event.preventDefault();
            setTypeView("types");
            break;
          case "Enter":
            event.preventDefault();
            if (selectedBlockId) {
              const block = filteredBlocks.find(
                (b) => b.id === selectedBlockId,
              );
              if (block) {
                handleSelectBlock(block);
              }
            }
            break;
          case "Escape":
            event.preventDefault();
            onClose();
            break;
        }
      }
    },
    [typeView, selectedTypeIndex, selectedBlockIndex, filteredBlocks, onClose],
  );

  // Handle block type selection
  const handleSelectBlockType = useCallback((blockType: BlockType) => {
    setSelectedType(blockType);
    setTypeView("blocks");
  }, []);

  // Handle back button
  const handleBack = useCallback(() => {
    setTypeView("types");
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

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Set up ESC key event listener
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  // Dynamic styling based on dark mode
  const bgClass = darkMode ? "bg-gray-900" : "bg-white";
  const borderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const textMutedClass = darkMode ? "text-gray-400" : "text-gray-500";
  const footerBgClass = darkMode ? "bg-gray-800" : "bg-gray-50";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className={`w-full max-w-2xl max-h-[70vh] ${bgClass} rounded-lg shadow-lg flex flex-col overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
      >
        <div
          className={`flex items-center justify-between px-4 py-3 border-b ${borderClass}`}
        >
          <h2
            id="command-palette-title"
            className={`text-lg font-medium ${textClass}`}
          >
            {typeView === "types"
              ? "Prompt Blocks"
              : selectedType?.name
                ? `${selectedType.name} Blocks`
                : "Blocks"}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            aria-label="Close"
          >
            <svg
              className={`w-5 h-5 ${textMutedClass}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <CommandSearch
          searchQuery={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          darkMode={darkMode}
        />

        <div
          ref={contentRef}
          className={`flex-1 overflow-y-auto command-palette-scrollable command-palette-${darkMode ? "dark" : "light"}`}
          id="command-palette-content"
        >
          {typeView === "types" ? (
            // Block Types View
            <BlockTypeList
              blockTypes={blockTypes}
              selectedId={selectedTypeId}
              onSelectBlockType={handleSelectBlockType}
              darkMode={darkMode}
            />
          ) : (
            // Blocks View (for selected type)
            <BlockList
              blocks={filteredBlocks}
              selectedId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
              blockType={selectedType}
              darkMode={darkMode}
              onBack={handleBack}
            />
          )}

          {/* No results message */}
          {((typeView === "types" && blockTypes.length === 0) ||
            (typeView === "blocks" && filteredBlocks.length === 0)) && (
            <div className={`p-4 text-center ${textMutedClass}`}>
              No matching items found
            </div>
          )}
        </div>

        <div
          className={`px-4 py-3 ${footerBgClass} text-xs ${textMutedClass} border-t ${borderClass}`}
        >
          <div className="flex justify-between">
            <div>
              <span className="mr-2">↑↓</span>
              <span>Navigate</span>
            </div>
            {typeView === "types" ? (
              <div>
                <span className="mr-2">→</span>
                <span>Select</span>
              </div>
            ) : (
              <div>
                <span className="mr-2">←</span>
                <span>Back</span>
              </div>
            )}
            <div>
              <span className="mr-2">Enter</span>
              <span>Select</span>
            </div>
            <div>
              <span className="mr-2">Esc</span>
              <span>Close</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
