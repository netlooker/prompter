import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Link,
  Eye,
  CheckSquare,
  Hash,
  Quote,
  Minus,
  SplitSquareVertical,
  Edit,
  ChevronDown,
} from "lucide-react";

interface MarkdownToolbarProps {
  onAction: (action: string) => void;
  isPreviewMode: boolean;
  isSplitView?: boolean;
  darkMode: boolean;
  saveMessage?: string;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onAction,
  isPreviewMode,
  isSplitView = false,
  darkMode,
  saveMessage = "",
}) => {
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setHeadingMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const buttonClass = `p-2 rounded-md transition-colors ${
    darkMode
      ? "hover:bg-gray-700 text-gray-300 hover:text-white"
      : "hover:bg-gray-200 text-gray-700 hover:text-gray-900"
  }`;

  const activeButtonClass = `p-2 rounded-md ${
    darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-900"
  }`;

  const isEditingDisabled = isPreviewMode && !isSplitView;

  // Function to render tooltip
  const withTooltip = (
    component: React.ReactNode,
    tooltip: string,
    isLeftmost: boolean = false,
  ) => (
    <div className="group relative">
      {component}
      <div
        className={`absolute top-full ${isLeftmost ? "left-0" : "left-1/2 transform -translate-x-1/2"} mt-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20`}
      >
        {tooltip}
      </div>
    </div>
  );

  return (
    <div
      className={`flex flex-wrap gap-1 p-2 ${darkMode ? "bg-slate-800 border-gray-700" : "bg-gray-100 border-gray-200"} border-b sticky top-0 z-10`}
    >
      {/* View mode buttons */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button
            className={
              !isPreviewMode && !isSplitView ? activeButtonClass : buttonClass
            }
            onClick={() => onAction("toggleEdit")}
            title="Edit Mode"
          >
            <Edit size={18} />
          </button>,
          "Edit Mode (Ctrl+E)",
          true,
        )}

        {withTooltip(
          <button
            className={isPreviewMode ? activeButtonClass : buttonClass}
            onClick={() => onAction("togglePreview")}
            title="Preview Mode"
          >
            <Eye size={18} />
          </button>,
          "Preview Mode (Ctrl+E)",
          true,
        )}

        {withTooltip(
          <button
            className={isSplitView ? activeButtonClass : buttonClass}
            onClick={() => onAction("toggleSplitView")}
            title="Split View"
          >
            <SplitSquareVertical size={18} />
          </button>,
          "Split View (Ctrl+P)",
          true,
        )}
      </div>

      {/* Header dropdown */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        <div className="relative group">
          <button
            className={`${buttonClass} flex items-center`}
            onClick={() => setHeadingMenuOpen(!headingMenuOpen)}
            disabled={isEditingDisabled}
          >
            <Hash size={18} />
            <ChevronDown size={14} className="ml-1" />
          </button>

          {headingMenuOpen && (
            <div
              className={`absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} ring-1 ring-black ring-opacity-5 z-30`}
              ref={dropdownRef}
            >
              <div className="py-1" role="menu" aria-orientation="vertical">
                {[
                  { level: 1, label: "Heading 1", action: "heading" },
                  { level: 2, label: "Heading 2", action: "heading2" },
                  { level: 3, label: "Heading 3", action: "heading3" },
                  { level: 4, label: "Heading 4", action: "heading4" },
                  { level: 5, label: "Heading 5", action: "heading5" },
                  { level: 6, label: "Heading 6", action: "heading6" },
                ].map((heading) => (
                  <button
                    key={heading.level}
                    className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                    role="menuitem"
                    onClick={() => {
                      onAction(heading.action);
                      setHeadingMenuOpen(false);
                    }}
                  >
                    <span className="inline-flex items-center">
                      <Hash size={16} className="mr-2" />
                      <span
                        className={
                          heading.level === 1
                            ? "text-base font-bold"
                            : heading.level === 2
                              ? "text-sm font-semibold"
                              : "text-xs"
                        }
                      >
                        {heading.label}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text formatting */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("bold")}
            disabled={isEditingDisabled}
          >
            <Bold size={18} />
          </button>,
          "Bold",
        )}

        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("italic")}
            disabled={isEditingDisabled}
          >
            <Italic size={18} />
          </button>,
          "Italic",
        )}
      </div>

      {/* Lists and items */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("unorderedList")}
            disabled={isEditingDisabled}
          >
            <List size={18} />
          </button>,
          "Bullet List",
        )}

        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("orderedList")}
            disabled={isEditingDisabled}
          >
            <ListOrdered size={18} />
          </button>,
          "Numbered List",
        )}

        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("checkbox")}
            disabled={isEditingDisabled}
          >
            <CheckSquare size={18} />
          </button>,
          "Task List",
        )}
      </div>

      {/* Other markdown elements */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("code")}
            disabled={isEditingDisabled}
          >
            <Code size={18} />
          </button>,
          "Code Block",
        )}

        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("link")}
            disabled={isEditingDisabled}
          >
            <Link size={18} />
          </button>,
          "Link",
        )}

        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("blockquote")}
            disabled={isEditingDisabled}
          >
            <Quote size={18} />
          </button>,
          "Blockquote",
        )}

        {withTooltip(
          <button
            className={buttonClass}
            onClick={() => onAction("horizontalRule")}
            disabled={isEditingDisabled}
          >
            <Minus size={18} />
          </button>,
          "Horizontal Rule",
        )}
      </div>

      <div className="flex items-center ml-auto">
        {saveMessage && (
          <div className="text-sm flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
              {saveMessage}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownToolbar;
