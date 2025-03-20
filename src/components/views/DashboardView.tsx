import { Home, FileText, Info } from 'lucide-react';

interface DashboardViewProps {
  darkMode: boolean;
  promptCount: number;
  onNavigateToPrompts: () => void;
}

function DashboardView({ darkMode, promptCount, onNavigateToPrompts }: DashboardViewProps) {
  // CSS Classes based on theme
  const cardBgClass = darkMode ? 'bg-slate-800' : 'bg-gray-50';
  const cardSecondaryBgClass = darkMode ? 'bg-slate-700' : 'bg-gray-200';
  const cardTextClass = darkMode ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className="flex flex-col h-full">
      <div className={`${cardBgClass} h-16 p-4 flex items-center border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h1 className="text-xl font-semibold flex items-center">
          <Home className="mr-3 h-6 w-6" />
          Dashboard
        </h1>
        <p className={`ml-4 ${cardTextClass}`}>
          Welcome to the Prompter PWA
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className={`${cardSecondaryBgClass} p-4 cursor-pointer hover:shadow-md transition-shadow`}
            onClick={onNavigateToPrompts}
          >
            <h3 className="font-medium mb-2 flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Prompts
            </h3>
            <p className={`text-sm ${cardTextClass}`}>
              {promptCount} prompts in your library
            </p>
          </div>
          
          <div className={`${cardSecondaryBgClass} p-4`}>
            <h3 className="font-medium mb-2 flex items-center">
              <Info className="mr-2 h-4 w-4" />
              Getting Started
            </h3>
            <p className={`text-sm ${cardTextClass}`}>
              Create and manage your prompts in the Prompts Library
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardView;