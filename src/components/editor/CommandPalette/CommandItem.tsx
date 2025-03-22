// src/components/editor/CommandPalette/CommandItem.tsx
import React from "react";
import { CommandItemProps } from "./types";

export const CommandItem: React.FC<CommandItemProps> = ({
  block,
  isSelected,
  onSelect,
  darkMode,
}) => {
  // Use dynamic classes based on dark mode and selection state
  const bgClass = darkMode
    ? isSelected
      ? "bg-indigo-900"
      : "hover:bg-gray-800"
    : isSelected
      ? "bg-indigo-100"
      : "hover:bg-gray-100";

  const textClass = darkMode ? "text-white" : "text-gray-900";
  const descriptionClass = darkMode ? "text-gray-300" : "text-gray-500";

  return (
    <div
      className={`px-4 py-2 flex items-center justify-between cursor-pointer ${bgClass} ${textClass}`}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      data-block-id={block.id}
    >
      <div className="flex flex-col">
        <div className="font-medium">{block.name}</div>
        <div className={`text-sm ${descriptionClass}`}>{block.description}</div>
      </div>

      {block.tags && block.tags.length > 0 && (
        <div className="ml-4 flex-shrink-0">
          <span
            className={`px-2 py-1 text-xs rounded ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
          >
            {block.tags[0]}
          </span>
        </div>
      )}
    </div>
  );
};
