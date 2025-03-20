import { useState, useEffect, useRef } from 'react';
import { FileText, Save } from 'lucide-react';
import { MarkdownEditor } from '../editor';




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
  


  

  


  return (
    <div className="flex flex-col h-full">
      <div className={`${cardBgClass} h-16 p-4 flex justify-between items-center border-b ${borderClass}`}>
        <div className="flex items-center">
          <FileText className="mr-3 h-6 w-6" />
          <h1 className="text-xl font-semibold">{promptTitle}</h1>
        </div>
        <div className="flex items-center space-x-2">
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
          className="flex-1"
        >
          <MarkdownEditor 
            darkMode={darkMode}
            initialValue={content}
            onChange={setContent}
            autosaveKey={`prompter-editor-${promptId || 'new'}`}
          />
        </div>
      </div>
      

    </div>
  );
}

export default EditorView;