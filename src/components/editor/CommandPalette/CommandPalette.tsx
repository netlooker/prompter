// src/components/editor/CommandPalette/CommandPalette.tsx
import React, { useEffect, useRef } from "react";
import "./CommandPalette.css";
import { createPortal } from "react-dom";
import { CommandPaletteProps, PaletteView } from "./types";
import { CommandSearch } from "./CommandSearch";
import { BlockTypeList } from "./BlockTypeList";
import { BlockList } from "./BlockList";
import { useCommandPalette } from "./hooks";

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  editorInstance,
  darkMode,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useCommandPalette({
    isOpen,
    onClose,
    onSelectBlock,
    editorInstance,
  });

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
            {view === PaletteView.TYPES
              ? "Prompt Blocks"
              : selectedBlockType?.name
                ? `${selectedBlockType.name} Blocks`
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
          className={`flex-1 overflow-y-auto command-palette-scrollable command-palette-${darkMode ? "dark" : "light"}`}
          id="command-palette-content"
        >
          {view === PaletteView.TYPES ? (
            // Block Types View
            <BlockTypeList
              blockTypes={filteredBlockTypes}
              selectedId={selectedTypeId}
              onSelectBlockType={handleSelectBlockType}
              darkMode={darkMode}
            />
          ) : (
            // Blocks View (for selected type)
            selectedBlockType && (
              <BlockList
                blocks={filteredBlocks}
                selectedId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
                blockType={selectedBlockType}
                darkMode={darkMode}
                onBack={handleBack}
              />
            )
          )}

          {/* No results message */}
          {((view === PaletteView.TYPES && filteredBlockTypes.length === 0) ||
            (view === PaletteView.BLOCKS && filteredBlocks.length === 0)) && (
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
            {view === PaletteView.TYPES ? (
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
