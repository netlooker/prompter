import { ReactNode, useState, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { DashboardView, EditorView, PromptsView } from './views'
import { Prompt } from '../types'

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
  const [prompts, setPrompts] = useState<Prompt[]>([
    { 
      id: '1', 
      name: 'General Writing Assistant', 
      content: '# General Writing Assistant\n\nYou are a helpful writing assistant. Help users improve their writing by providing suggestions, fixing grammar issues, and enhancing clarity.\n\n## Instructions\n- Be concise but thorough\n- Focus on improving clarity and readability\n- Maintain the user\'s original tone and style',
      createdAt: Date.now() - 1000000, // Some time in the past
      updatedAt: Date.now() - 500000 // Some time in the past
    },
    { 
      id: '2', 
      name: 'Code Reviewer', 
      content: '# Code Reviewer\n\nYou are a code review expert specializing in identifying bugs, performance issues, and security vulnerabilities.\n\n## Instructions\n- Analyze code snippets for potential bugs\n- Suggest performance improvements\n- Identify security issues\n- Provide clear explanations of all findings',
      createdAt: Date.now() - 700000, // Some time in the past
      updatedAt: Date.now() - 200000 // Some time in the past
    }
  ]);

  // Load prompts from local storage on mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('prompter-prompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (error) {
        console.error('Error loading prompts from localStorage:', error);
      }
    }
  }, []);

  // Save prompts to local storage when they change
  useEffect(() => {
    localStorage.setItem('prompter-prompts', JSON.stringify(prompts));
  }, [prompts]);

  // Function to handle prompt content updates
  const handleSavePrompt = (content: string, title: string) => {
    const now = Date.now();
    
    if (activePromptId) {
      // Update the prompt with new content
      setPrompts(prompts.map(prompt => 
        prompt.id === activePromptId 
          ? { ...prompt, content, name: title, updatedAt: now } 
          : prompt
      ));
    } else {
      // Create new prompt if none is active
      const newPromptId = `${Date.now()}`;
      const newPrompt: Prompt = {
        id: newPromptId,
        name: title,
        content,
        createdAt: now,
        updatedAt: now
      };
      setPrompts([...prompts, newPrompt]);
      setActivePromptId(newPromptId);
    }
    onNavigate('prompts');
  };

  // Function to handle editing a prompt
  const handleEditPrompt = (promptId: string) => {
    setActivePromptId(promptId);
    onNavigate('editor');
  };

  // Function to handle deleting a prompt
  const handleDeletePrompt = (promptId: string) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      setPrompts(prompts.filter(prompt => prompt.id !== promptId));
      if (activePromptId === promptId) {
        setActivePromptId(null);
      }
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
            onNavigateToPrompts={() => onNavigate('prompts')}
          />
        );
      
      case 'prompts':
        return (
          <PromptsView 
            darkMode={darkMode}
            prompts={prompts}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
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
      

      
      case 'settings':
        return (
          <div className={`${cardBgClass} h-full shadow-md p-4`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </h2>
            <div className="space-y-4">
              <div className={`${darkMode ? 'bg-slate-700' : 'bg-gray-200'} p-4`}>
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
          <div className={`${cardBgClass} h-full shadow-md p-4`}>
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