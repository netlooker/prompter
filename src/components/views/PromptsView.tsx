import { useState } from "react";
import { FileText, Pencil, Search, Trash } from "lucide-react";
import { Prompt } from "../../types";

interface PromptsViewProps {
  darkMode: boolean;
  prompts: Prompt[];
  onEdit: (promptId: string) => void;
  onDelete: (promptId: string) => void;
}

function PromptsView({
  darkMode,
  prompts,
  onEdit,
  onDelete,
}: PromptsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter prompts based on search query
  const filteredPrompts = searchQuery
    ? prompts.filter(
        (prompt: Prompt) =>
          prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prompt.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : prompts;

  // CSS Classes based on theme
  const cardBgClass = darkMode ? "bg-slate-800" : "bg-gray-50";
  const cardTextClass = darkMode ? "text-gray-300" : "text-gray-600";
  const hoverBgClass = darkMode ? "hover:bg-slate-700" : "hover:bg-gray-100";
  const inputBgClass = darkMode ? "bg-slate-700" : "bg-white";
  const borderClass = darkMode ? "border-gray-700" : "border-gray-200";

  // Format date function
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      <div
        className={`${cardBgClass} h-16 p-4 flex items-center border-b ${borderClass}`}
      >
        <div className="flex items-center">
          <FileText className="mr-3 h-6 w-6" />
          <h1 className="text-xl font-semibold">Prompts</h1>
        </div>
      </div>

      <div className="p-4">
        <div className={`relative ${inputBgClass} mb-6`}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border ${borderClass} leading-5 ${inputBgClass} ${cardTextClass} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((prompt: Prompt) => (
            <div
              key={prompt.id}
              className={`${cardBgClass} shadow p-4 border ${borderClass} ${hoverBgClass} transition-colors`}
            >
              <div className="font-medium text-lg mb-2">{prompt.name}</div>
              <p className={`${cardTextClass} mb-4 text-sm line-clamp-3`}>
                {prompt.content.replace(/^#.*$/m, "").trim()}
              </p>
              <div className="flex justify-between items-center">
                <div className={`text-xs ${cardTextClass}`}>
                  {prompt.updatedAt
                    ? `Updated: ${formatDate(prompt.updatedAt)}`
                    : ""}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onDelete(prompt.id)}
                    className={`p-2 rounded-md ${darkMode ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-100 text-red-600"}`}
                    title="Delete prompt"
                  >
                    <Trash size={16} />
                  </button>
                  <button
                    onClick={() => onEdit(prompt.id)}
                    className={`p-2 rounded-md ${darkMode ? "hover:bg-indigo-900/30 text-indigo-400" : "hover:bg-indigo-100 text-indigo-600"}`}
                    title="Edit prompt"
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PromptsView;
