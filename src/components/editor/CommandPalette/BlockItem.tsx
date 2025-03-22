// src/components/editor/CommandPalette/BlockItem.tsx
import React, { useEffect, useRef } from "react";
import { BlockItemProps } from "./types";

export const BlockItem: React.FC<BlockItemProps> = ({
  block,
  isSelected,
  onSelect,
  darkMode,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Scroll selected item into view when selection changes
  useEffect(() => {
    if (isSelected && ref.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        const container = document.getElementById("command-palette-content");
        if (container && ref.current) {
          const containerRect = container.getBoundingClientRect();
          const itemRect = ref.current.getBoundingClientRect();

          if (
            itemRect.bottom > containerRect.bottom ||
            itemRect.top < containerRect.top
          ) {
            ref.current.scrollIntoView({
              block: "nearest",
              behavior: "auto", // Use auto instead of smooth for more reliable scrolling
            });
          }
        }
      });
    }
  }, [isSelected]);

  // Dynamic styling based on dark mode and selection state
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
      ref={ref}
      className={`px-4 py-2 flex items-center cursor-pointer ${bgClass} ${textClass}`}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      data-block-id={block.id}
    >
      <div className="flex-grow">
        <div className="font-medium">{block.name}</div>
        {block.description && (
          <div className={`text-sm ${descriptionClass}`}>
            {block.description}
          </div>
        )}
      </div>

      {block.tags && block.tags.length > 0 && (
        <div className="ml-4 flex-shrink-0 flex gap-1">
          {block.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`px-2 py-1 text-xs rounded ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              {tag}
            </span>
          ))}
          {block.tags.length > 2 && (
            <span
              className={`px-2 py-1 text-xs rounded ${
                darkMode ? "bg-gray-700" : "bg-gray-200"
              }`}
            >
              +{block.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
