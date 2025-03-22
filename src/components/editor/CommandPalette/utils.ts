// src/components/editor/CommandPalette/utils.ts

/**
 * Enhanced fuzzy search implementation that matches query against specified fields
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  keys: (keyof T)[],
): T[] {
  if (!query.trim()) {
    return items;
  }

  const lowerCaseQuery = query.toLowerCase();

  return items.filter((item) => {
    return keys.some((key) => {
      const value = item[key];

      // Handle array values (like tags)
      if (Array.isArray(value)) {
        return value.some((v) =>
          String(v).toLowerCase().includes(lowerCaseQuery),
        );
      }

      // Handle string values
      if (typeof value === "string") {
        return value.toLowerCase().includes(lowerCaseQuery);
      }

      return false;
    });
  });
}
