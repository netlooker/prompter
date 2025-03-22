// src/components/editor/CommandPalette/CommandPalette.tsx
import React, { useEffect, useRef } from "react";
import "./CommandPalette.css";
import { createPortal } from "react-dom";
import { CommandPaletteProps, PromptBlockCategory } from "./types";
import { CommandSearch } from "./CommandSearch";
import { CommandGroup } from "./CommandGroup";
import { useCommandPalette } from "./hooks";

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectBlock,
  editorInstance,
  darkMode,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Define category order for display
  const categoryOrder: PromptBlockCategory[] = [
    "personas",
    "instructions",
    "templates",
    "constraints",
    "system",
  ];

  const {
    searchQuery,
    groupedBlocks,
    selectedId,
    handleSearchChange,
    handleKeyDown,
    handleSelectBlock,
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

  // Render modal using portal
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
            Prompt Blocks
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
          {Object.keys(groupedBlocks).length > 0 ? (
            // Sort categories according to the defined order
            categoryOrder
              .filter((category) => groupedBlocks[category]?.length > 0)
              .map((category) => (
                <CommandGroup
                  key={category}
                  category={category}
                  blocks={groupedBlocks[category] || []}
                  selectedId={selectedId}
                  onSelectBlock={handleSelectBlock}
                  darkMode={darkMode}
                />
              ))
          ) : (
            <div className={`p-4 text-center ${textMutedClass}`}>
              No matching prompt blocks found
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
