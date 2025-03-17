import { ReactNode, useState } from 'react'
import { Settings, BarChart2, Users } from 'lucide-react'
import { DashboardView, EditorView, PromptsLibraryView } from './views'

interface Prompt {
  id: string;
  name: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MainLayoutProps {
  darkMode: boolean;
  children?: ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
}

function MainLayout({ darkMode, activeView, onNavigate }: MainLayoutProps) {
  // CSS Classes based on theme
  const cardBgClass = darkMode ? 'bg-slate-800' : 'bg-gray-50';
  const cardTextClass = darkMode ? 'text-gray-300' : 'text-gray-600';
  
  // State for tracking active prompt and all prompts
  const [activePromptId, setActivePromptId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [prompts, setPrompts] = useState<Prompt[]>([
    { 
      id: '1', 
      name: 'General Writing Assistant', 
      content: '# General Writing Assistant\n\nYou are a helpful writing assistant. Help users improve their writing by providing suggestions, fixing grammar issues, and enhancing clarity.\n\n## Instructions\n- Be concise but thorough\n- Focus on improving clarity and readability\n- Maintain the user\'s original tone and style' 
    },
    { 
      id: '2', 
      name: 'Code Reviewer', 
      content: '# Code Reviewer\n\nYou are a code review expert specializing in identifying bugs, performance issues, and security vulnerabilities.\n\n## Instructions\n- Analyze code snippets for potential bugs\n- Suggest performance improvements\n- Identify security issues\n- Provide clear explanations of all findings' 
    }
  ]);

  // Function to handle creating a new prompt
  const handleNewPrompt = () => {
    const newPrompt = {
      id: `${Date.now()}`,
      name: 'New Prompt',
      content: '# New Prompt\n\nReplace this with your instructions...'
    };
    setPrompts([...prompts, newPrompt]);
    setActivePromptId(newPrompt.id);
    onNavigate('editor');
  };

  // Function to handle prompt content updates
  const handleSavePrompt = (content: string, title: string) => {
    if (activePromptId) {
      setPrompts(prompts.map(prompt => 
        prompt.id === activePromptId 
          ? { ...prompt, content, name: title } 
          : prompt
      ));
    } else {
      // Create new prompt if none is active
      const newPrompt = {
        id: `${Date.now()}`,
        name: title,
        content,
      };
      setPrompts([...prompts, newPrompt]);
      setActivePromptId(newPrompt.id);
    }
    onNavigate('prompts-library');
  };

  // Function to handle editing a prompt
  const handleEditPrompt = (promptId: string) => {
    setActivePromptId(promptId);
    onNavigate('editor');
  };

  // Function to handle deleting a prompt
  const handleDeletePrompt = (promptId: string) => {
    setPrompts(prompts.filter(prompt => prompt.id !== promptId));
    if (activePromptId === promptId) {
      setActivePromptId(null);
    }
  };

  // Render the appropriate view based on activeView
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView 
            darkMode={darkMode} 
            promptCount={prompts.length} 
            onNavigateToPrompts={() => onNavigate('prompts-library')}
          />
        );
      
      case 'prompts-library':
        return (
          <PromptsLibraryView 
            darkMode={darkMode}
            prompts={prompts}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
            onNewPrompt={handleNewPrompt}
          />
        );
      
      case 'editor':
        return (
          <EditorView 
            darkMode={darkMode}
            promptId={activePromptId || undefined}
            initialContent={activePromptId ? 
              prompts.find(p => p.id === activePromptId)?.content : 
              '# New Prompt\n\nReplace this with your instructions...'}
            title={activePromptId ? 
              prompts.find(p => p.id === activePromptId)?.name : 
              'New Prompt'}
            onSave={handleSavePrompt}
          />
        );
      
      case 'analytics':
        return (
          <div className={`${cardBgClass} h-full rounded-lg shadow-md p-4`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" />
              Analytics
            </h2>
            <p className={`${cardTextClass}`}>
              Analytics feature coming soon.
            </p>
          </div>
        );
      
      case 'users':
        return (
          <div className={`${cardBgClass} h-full rounded-lg shadow-md p-4`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Users
            </h2>
            <p className={`${cardTextClass}`}>
              User management feature coming soon.
            </p>
          </div>
        );
      
      case 'settings':
        return (
          <div className={`${cardBgClass} h-full rounded-lg shadow-md p-4`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </h2>
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-slate-700' : 'bg-gray-200'} p-4 rounded-lg`}>
                <h3 className="font-medium mb-2">Appearance</h3>
                <p className={`text-sm ${cardTextClass} mb-2`}>
                  Customize the appearance of the application
                </p>
                <div className="flex items-center">
                  <span className={`text-sm ${cardTextClass} mr-2`}>
                    Dark Mode is currently {darkMode ? 'enabled' : 'disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className={`${cardBgClass} h-full rounded-lg shadow-md p-4`}>
            <h2 className="text-xl font-semibold mb-2">
              Page Not Found
            </h2>
            <p className={`${cardTextClass}`}>
              The requested page does not exist.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 transition-all duration-300 ease-in-out h-screen flex flex-col">
      <div className="w-full h-full overflow-hidden">
        {renderContent()}
      </div>
    </div>
  )
}

export default MainLayout