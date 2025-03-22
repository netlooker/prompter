// src/components/editor/CommandPalette/CommandGroup.tsx
import React from "react";
import { CommandGroupProps } from "./types";
import { CommandItem } from "./CommandItem";

export const CommandGroup: React.FC<CommandGroupProps> = ({
  category,
  blocks,
  selectedId,
  onSelectBlock,
  darkMode,
}) => {
  if (blocks.length === 0) {
    return null;
  }

  // Format category name for display (capitalize first letter)
  const displayCategory = category.charAt(0).toUpperCase() + category.slice(1);

  // Dynamic styling based on dark mode
  const headerBgClass = darkMode ? "bg-gray-800" : "bg-gray-100";
  const headerTextClass = darkMode ? "text-gray-300" : "text-gray-500";

  return (
    <div className="mb-2">
      <div
        className={`px-4 py-1 text-xs font-semibold ${headerTextClass} uppercase tracking-wider ${headerBgClass}`}
      >
        {displayCategory}
      </div>

      <div role="listbox">
        {blocks.map((block) => (
          <CommandItem
            key={block.id}
            block={block}
            isSelected={selectedId === block.id}
            onSelect={() => onSelectBlock(block)}
            darkMode={darkMode}
          />
        ))}
      </div>
    </div>
  );
};
