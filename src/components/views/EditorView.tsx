import { useState, useEffect, useRef } from 'react';
import { FileText, Save, MenuSquare, Sparkles } from 'lucide-react';
import { MarkdownEditor } from '../editor';
import { TemplatePicker } from './TemplateSystem';
import { AIPromptAssistant } from './AIPromptAssistant';
import { PromptTemplate } from '../../types';

interface EditorViewProps {
  darkMode: boolean;
  promptId?: string;
  initialContent?: string;
  title?: string;
  onSave?: (content: string, title: string) => void;
}

function EditorView({ 
  darkMode, 
  promptId, 
  initialContent = '# New Prompt\n\nReplace this with your instructions...',
  title = 'New Prompt',
  onSave 
}: EditorViewProps) {
  const [content, setContent] = useState(initialContent);
  const [promptTitle, setPromptTitle] = useState(title);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<'templates' | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const cardBgClass = darkMode ? 'bg-slate-800' : 'bg-gray-50';
  const cardTextClass = darkMode ? 'text-gray-300' : 'text-gray-600';
  const buttonBgClass = darkMode ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-indigo-500 hover:bg-indigo-600';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(content, promptTitle);
    }
  };

  // Extract title from markdown content
  useEffect(() => {
    // Find the first heading in the markdown
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch && headingMatch[1]) {
      setPromptTitle(headingMatch[1]);
    }
  }, [content]);
  
  // Handle template selection
  const handleSelectTemplate = (template: PromptTemplate) => {
    // Confirm if there's existing content
    if (content !== initialContent && !window.confirm('This will replace your current content. Continue?')) {
      return;
    }
    
    setContent(template.content);
    setPromptTitle(template.name);
    setSidebarOpen(false);
  };
  

  
  // Handle inserting AI suggestion
  const handleInsertSuggestion = (text: string) => {
    setContent(prevContent => {
      // Find cursor position or end of content
      const position = prevContent.length;
      
      // Add two newlines if we're not at the beginning of the content
      const separator = position > 0 ? '\n\n' : '';
      
      return prevContent + separator + text;
    });
  };
  
  // Toggle sidebar
  const toggleSidebar = (content: 'templates' | null) => {
    if (sidebarContent === content && sidebarOpen) {
      setSidebarOpen(false);
      setSidebarContent(null);
    } else {
      setSidebarOpen(true);
      setSidebarContent(content);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`${cardBgClass} h-16 p-4 flex justify-between items-center border-b ${borderClass}`}>
        <div className="flex items-center">
          <FileText className="mr-3 h-6 w-6" />
          <h1 className="text-xl font-semibold">{promptTitle}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => toggleSidebar('templates')}
            className={`p-2 rounded-md ${
              sidebarOpen && sidebarContent === 'templates'
                ? darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } flex items-center`}
            title="Template Gallery"
          >
            <MenuSquare size={18} />
            <span className="ml-2 hidden md:inline">Templates</span>
          </button>
          

          
          <button 
            onClick={handleSave}
            className={`${buttonBgClass} text-white px-4 py-2 rounded-md flex items-center`}
          >
            <Save size={16} className="mr-2" />
            Save Prompt
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex">
        {/* Main editor area */}
        <div 
          ref={editorRef}
          className={`flex-1 transition-all duration-300`}
        >
          <MarkdownEditor 
            darkMode={darkMode}
            initialValue={content}
            onChange={setContent}
            autosaveKey={`prompter-editor-${promptId || 'new'}`}
          />
        </div>
        
        {/* Sidebar */}
        {sidebarOpen && (
          <div 
            className={`w-80 md:w-96 border-l ${borderClass} ${cardBgClass} overflow-hidden flex flex-col transition-all duration-300`}
          >
            {sidebarContent === 'templates' && (
              <TemplatePicker 
                onSelectTemplate={handleSelectTemplate}
                darkMode={darkMode}
              />
            )}
          </div>
        )}
      </div>
      
      {/* AI Assistant */}
      <AIPromptAssistant
        currentContent={content}
        onInsertSuggestion={handleInsertSuggestion}
        darkMode={darkMode}
      />
    </div>
  );
}

export default EditorView;