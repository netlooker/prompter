// src/components/editor/CommandPalette/BlockList.tsx
import React from "react";
import { BlockListProps, Block } from "./types";
import { BlockItem } from "./BlockItem";
import * as LucideIcons from "lucide-react";

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  selectedId,
  onSelectBlock,
  blockType,
  darkMode,
  onBack,
}) => {
  const headerBgClass = darkMode ? "bg-gray-800" : "bg-gray-100";
  const headerTextClass = darkMode ? "text-gray-300" : "text-gray-600";
  const iconClass = darkMode ? "text-indigo-300" : "text-indigo-600";
  const backButtonClass = darkMode
    ? "text-gray-300 hover:text-white"
    : "text-gray-600 hover:text-black";

  // Get the icon component - using type assertion to bypass TypeScript strict checking
  const IconComponent = (LucideIcons as any)[blockType.icon];

  return (
    <div>
      <div
        className={`sticky top-0 z-10 px-4 py-2 ${headerBgClass} flex items-center`}
      >
        <button
          className={`mr-2 ${backButtonClass}`}
          aria-label="Back to block types"
          onClick={onBack}
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className={`flex items-center ${headerTextClass} font-medium`}>
          {IconComponent && (
            <div className={`mr-2 ${iconClass}`}>
              <IconComponent size={16} />
            </div>
          )}
          {blockType.name}
        </div>
      </div>

      <div className="py-2" role="listbox">
        {blocks.length > 0 ? (
          blocks.map((block: Block) => (
            <BlockItem
              key={block.id}
              block={block}
              isSelected={selectedId === block.id}
              onSelect={() => onSelectBlock(block)}
              darkMode={darkMode}
            />
          ))
        ) : (
          <div
            className={`p-4 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            No blocks found in this category
          </div>
        )}
      </div>
    </div>
  );
};
