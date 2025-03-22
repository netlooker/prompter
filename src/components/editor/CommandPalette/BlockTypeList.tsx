// src/components/editor/CommandPalette/BlockTypeList.tsx
import React from "react";
import { BlockTypeListProps } from "./types";
import { BlockTypeItem } from "./BlockTypeItem";

export const BlockTypeList: React.FC<BlockTypeListProps> = ({
  blockTypes,
  selectedId,
  onSelectBlockType,
  darkMode,
}) => {
  if (blockTypes.length === 0) {
    const textMutedClass = darkMode ? "text-gray-400" : "text-gray-500";
    return (
      <div className={`p-4 text-center ${textMutedClass}`}>
        No block types found
      </div>
    );
  }

  return (
    <div className="py-2" role="listbox">
      {blockTypes.map((blockType) => (
        <BlockTypeItem
          key={blockType.id}
          blockType={blockType}
          isSelected={selectedId === blockType.id}
          onSelect={() => onSelectBlockType(blockType)}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
};
