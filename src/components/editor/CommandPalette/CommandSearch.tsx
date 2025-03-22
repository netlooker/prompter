// src/components/editor/CommandPalette/CommandSearch.tsx
import React, { useRef, useEffect } from "react";
import { CommandSearchProps } from "./types";

export const CommandSearch: React.FC<CommandSearchProps> = ({
  searchQuery,
  onChange,
  onKeyDown,
  darkMode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Dynamic styling based on dark mode
  const borderClass = darkMode ? "border-gray-600" : "border-gray-300";
  const bgClass = darkMode ? "bg-gray-800" : "bg-white";
  const textClass = darkMode ? "text-gray-100" : "text-gray-900";
  const iconClass = darkMode ? "text-gray-400" : "text-gray-500";

  return (
    <div className={`p-4 border-b ${borderClass}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg
            className={`w-4 h-4 ${iconClass}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          ref={inputRef}
          className={`w-full py-2 pl-10 pr-4 text-sm border rounded-md ${borderClass} ${bgClass} ${textClass} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          placeholder="Search prompt blocks..."
          value={searchQuery}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Search prompt blocks"
        />
      </div>
    </div>
  );
};
