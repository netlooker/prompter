import {
  Menu,
  X,
  Home,
  Settings,
  Users,
  BarChart2,
  Sun,
  Moon
} from 'lucide-react'

interface SidebarProps {
  sidebarOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
}

function Sidebar({ sidebarOpen, darkMode, toggleSidebar, toggleDarkMode }: SidebarProps) {
  // CSS Classes based on theme
  const sidebarBgClass = darkMode ? 'bg-slate-800' : 'bg-gray-100';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const logoColor = darkMode ? 'text-indigo-400' : 'text-indigo-600';
  const activeNavItemBgClass = darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50';
  const activeNavItemTextClass = darkMode ? 'text-indigo-400' : 'text-indigo-600';
  const hoverBgClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200';

  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', active: true },
    { icon: <BarChart2 size={20} />, label: 'Analytics' },
    { icon: <Users size={20} />, label: 'Users' },
    { icon: <Settings size={20} />, label: 'Settings' }
  ];

  return (
    <div
      className={`${
        sidebarOpen ? 'w-48' : 'w-16'
      } ${sidebarBgClass} h-screen fixed left-0 transition-all duration-300 ease-in-out flex flex-col shadow-md z-10`}
    >
      {/* Sidebar header */}
      <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'} p-3 border-b ${borderClass}`}>
        {sidebarOpen && (
          <h1 className={`text-xl font-semibold ${logoColor}`}>Prompter</h1>
        )}
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-lg ${hoverBgClass} transition-colors`}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar content */}
      <nav className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => (
            <li key={index}>
              <a
                href="#"
                className={`flex ${sidebarOpen ? 'items-center' : 'justify-center'} p-2 rounded-lg ${
                  item.active
                    ? `${activeNavItemBgClass} ${activeNavItemTextClass}`
                    : hoverBgClass
                } transition-colors`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar footer */}
      <div className={`p-3 border-t ${borderClass}`}>
        <button
          onClick={toggleDarkMode}
          className={`flex items-center justify-center w-full p-2 rounded-lg ${hoverBgClass} transition-colors`}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <>
              <Sun size={20} />
              {sidebarOpen && <span className="ml-3">Light Mode</span>}
            </>
          ) : (
            <>
              <Moon size={20} />
              {sidebarOpen && <span className="ml-3">Dark Mode</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
