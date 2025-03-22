import { useState, useEffect } from "react";
import MainLayout from "./components/MainLayout";
import Sidebar from "./components/Sidebar";

function App() {
  // Initialize darkMode state from localStorage or default to system preference
  const [darkMode, setDarkMode] = useState(() => {
    // Check for existing preference in localStorage
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }
    // Otherwise use system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("prompts"); // Default to prompts view

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // Save preference to localStorage
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle navigation
  const handleNavigation = (view: string) => {
    setActiveView(view);
    console.log("App received navigation to:", view);
  };

  // Handle "New Prompt" button in sidebar
  const handleNewPrompt = () => {
    // Navigate to editor and MainLayout will create a new prompt
    setActiveView("editor");
  };

  // CSS Classes based on theme
  const bgClass = darkMode ? "bg-slate-900" : "bg-white";
  const textClass = darkMode ? "text-gray-100" : "text-gray-800";

  return (
    <div className={`h-screen ${bgClass} ${textClass} flex overflow-hidden`}>
      {/* Sidebar Component */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        darkMode={darkMode}
        toggleSidebar={toggleSidebar}
        toggleDarkMode={toggleDarkMode}
        onNavigate={handleNavigation}
        activeView={activeView}
        onNewPrompt={handleNewPrompt}
      />

      {/* Main content */}
      <div
        className="flex-1 transition-all duration-300 ease-in-out h-screen overflow-hidden"
        style={{ marginLeft: sidebarOpen ? "12rem" : "4rem" }}
      >
        <MainLayout
          darkMode={darkMode}
          activeView={activeView}
          onNavigate={handleNavigation}
        />
      </div>
    </div>
  );
}

export default App;
