// src/components/editor/CommandPalette/utils.ts
import { PromptBlock } from "./types";

/**
 * Simple fuzzy search implementation that matches query against multiple fields
 */
export const fuzzySearch = (
  blocks: PromptBlock[],
  query: string,
): PromptBlock[] => {
  if (!query.trim()) {
    return blocks;
  }

  const lowerCaseQuery = query.toLowerCase();

  return blocks.filter((block) => {
    // Check matches in title, description, category, and tags
    const titleMatch = block.title.toLowerCase().includes(lowerCaseQuery);
    const descMatch = block.description.toLowerCase().includes(lowerCaseQuery);
    const categoryMatch = block.category.toLowerCase().includes(lowerCaseQuery);

    // Check tags (if available)
    const tagMatch =
      block.tags?.some((tag) => tag.toLowerCase().includes(lowerCaseQuery)) ||
      false;

    return titleMatch || descMatch || categoryMatch || tagMatch;
  });
};

/**
 * Group blocks by category
 */
export const groupByCategory = (
  blocks: PromptBlock[],
): Record<string, PromptBlock[]> => {
  return blocks.reduce(
    (acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = [];
      }
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<string, PromptBlock[]>,
  );
};
