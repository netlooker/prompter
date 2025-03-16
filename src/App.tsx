import { useState, useEffect } from 'react'
import MainLayout from './components/MainLayout'
import Sidebar from './components/Sidebar'
import InstallPWA from './components/InstallPWA'

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
      <div 
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarOpen ? '12rem' : '4rem' }}
      >
        <MainLayout darkMode={darkMode} />
      </div>

      {/* PWA Install Button */}
      <InstallPWA />
    </div>
  )
}

export default App
