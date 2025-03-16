import { useState, useEffect } from 'react'
import {
  Settings,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import Sidebar from './components/Sidebar'

function App() {
  // Initialize darkMode state from localStorage or default to system preference
  const [darkMode, setDarkMode] = useState(() => {
    // Check for existing preference in localStorage
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      return JSON.parse(savedMode)
    }
    // Otherwise use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    console.log('Dark mode set to:', darkMode)
  }, [darkMode])

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // CSS Classes based on theme
  const bgClass = darkMode ? 'bg-slate-900' : 'bg-white'
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800'
  const cardBgClass = darkMode ? 'bg-slate-800' : 'bg-gray-50'
  const cardSecondaryBgClass = darkMode ? 'bg-slate-700' : 'bg-gray-200'
  const cardTextClass = darkMode ? 'text-gray-300' : 'text-gray-600'
  const buttonBgClass = darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-600'

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} flex`}>
      {/* Sidebar Component */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        darkMode={darkMode}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main content */}
      <main className={`flex-1 flex justify-start transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="container px-8 py-6 ml-0">
          <div className={`${cardBgClass} rounded-lg shadow-md p-8`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Dashboard Content
            </h2>
            
            <p className={`mb-4 ${cardTextClass}`}>
              This is your main dashboard area. You can put your app content here.
            </p>
            
            <div className="space-y-4">
              <div className={`${cardSecondaryBgClass} p-4 rounded-lg`}>
                <h3 className="font-medium mb-2 flex items-center">
                  <ChevronRight className="mr-1 h-4 w-4" />
                  Section 1
                </h3>
                <p className={`text-sm ${cardTextClass}`}>
                  This is a collapsible section that can contain additional content.
                </p>
              </div>
              
              <div className={`${cardSecondaryBgClass} p-4 rounded-lg`}>
                <h3 className="font-medium mb-2 flex items-center">
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Section 2
                </h3>
                <div className={`text-sm ${cardTextClass}`}>
                  <p className="mb-2">
                    This section is expanded and shows more content.
                  </p>
                  <button className={`px-4 py-2 ${buttonBgClass} text-white rounded flex items-center transition-colors`}>
                    See more <ChevronDown className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
