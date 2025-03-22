// src/components/editor/CommandPalette/BlockTypeItem.tsx
import React from "react";
import { BlockTypeItemProps } from "./types";
import * as LucideIcons from "lucide-react";

export const BlockTypeItem: React.FC<BlockTypeItemProps> = ({
  blockType,
  isSelected,
  onSelect,
  darkMode,
}) => {
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
  const iconClass = darkMode ? "text-indigo-300" : "text-indigo-600";

  // Dynamically get the icon component
  // Type assertion to bypass TypeScript strict checking
  const IconComponent = (LucideIcons as any)[blockType.icon];

  return (
    <div
      className={`px-4 py-3 flex items-center cursor-pointer ${bgClass} ${textClass}`}
      onClick={onSelect}
      role="option"
      aria-selected={isSelected}
      tabIndex={-1}
      data-block-type-id={blockType.id}
    >
      {IconComponent && (
        <div className={`mr-3 ${iconClass}`}>
          <IconComponent size={20} />
        </div>
      )}
      <div className="flex-grow">
        <div className="font-medium">{blockType.name}</div>
        <div className={`text-sm ${descriptionClass}`}>
          {blockType.description}
        </div>
      </div>
      <div className="ml-2 text-gray-400">
        <svg
          className="w-5 h-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
};
