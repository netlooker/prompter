import { ReactNode } from 'react'
import { Settings, ChevronRight, ChevronDown } from 'lucide-react'

interface MainLayoutProps {
  darkMode: boolean;
  children?: ReactNode;
}

function MainLayout({ darkMode }: MainLayoutProps) {
  // CSS Classes based on theme
  const cardBgClass = darkMode ? 'bg-slate-800' : 'bg-gray-50'
  const cardSecondaryBgClass = darkMode ? 'bg-slate-700' : 'bg-gray-200'
  const cardTextClass = darkMode ? 'text-gray-300' : 'text-gray-600'
  const buttonBgClass = darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-600'

  return (
    <div className="flex-1 transition-all duration-300 ease-in-out">
      <div className="w-full px-4 py-3">
        <div className={`${cardBgClass} rounded-lg shadow-md p-4`}>
          <h2 className="text-xl font-semibold mb-2 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Dashboard Content
          </h2>

          <p className={`mb-2 ${cardTextClass}`}>
            This is your main dashboard area. You can put your app content here.
          </p>

          <div className="space-y-2">
            <div className={`${cardSecondaryBgClass} p-3 rounded-lg`}>
              <h3 className="font-medium mb-1 flex items-center">
                <ChevronRight className="mr-1 h-4 w-4" />
                Section 1
              </h3>
              <p className={`text-sm ${cardTextClass}`}>
                This is a collapsible section that can contain additional content.
              </p>
            </div>

            <div className={`${cardSecondaryBgClass} p-3 rounded-lg`}>
              <h3 className="font-medium mb-1 flex items-center">
                <ChevronDown className="mr-1 h-4 w-4" />
                Section 2
              </h3>
              <div className={`text-sm ${cardTextClass}`}>
                <p className="mb-1">
                  This section is expanded and shows more content.
                </p>
                <button className={`px-3 py-1 ${buttonBgClass} text-white rounded flex items-center transition-colors`}>
                  See more <ChevronDown className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainLayout
