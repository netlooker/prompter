import React from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code, 
  Link, 
  FileText, 
  Eye, 
  Save, 
  CheckSquare,
  Hash,
  Type,
  Quote,
  Minus,
  SplitSquareVertical,
  Edit
} from 'lucide-react';

interface MarkdownToolbarProps {
  onAction: (action: string) => void;
  isPreviewMode: boolean;
  isSplitView?: boolean;
  darkMode: boolean;
  saveMessage?: string;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ 
  onAction, 
  isPreviewMode, 
  isSplitView = false,
  darkMode,
  saveMessage = ''
 }) => {
  const buttonClass = `p-2 rounded-md transition-colors ${darkMode 
    ? 'hover:bg-gray-700 text-gray-300 hover:text-white' 
    : 'hover:bg-gray-200 text-gray-700 hover:text-gray-900'}`;
  
  const activeButtonClass = `p-2 rounded-md ${darkMode 
    ? 'bg-gray-700 text-white' 
    : 'bg-gray-200 text-gray-900'}`;
  
  const isEditingDisabled = isPreviewMode && !isSplitView;

  // Function to render tooltip
  const withTooltip = (component: React.ReactNode, tooltip: string) => (
    <div className="group relative">
      {component}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {tooltip}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-wrap gap-1 p-2 ${darkMode ? 'bg-slate-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-b sticky top-0 z-10`}>
      {/* View mode buttons */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button 
            className={!isPreviewMode && !isSplitView ? activeButtonClass : buttonClass}
            onClick={() => onAction('toggleEdit')}
            title="Edit Mode"
          >
            <Edit size={18} />
          </button>,
          "Edit Mode (Ctrl+E)"
        )}
        
        {withTooltip(
          <button 
            className={isPreviewMode ? activeButtonClass : buttonClass}
            onClick={() => onAction('togglePreview')}
            title="Preview Mode"
          >
            <Eye size={18} />
          </button>,
          "Preview Mode (Ctrl+E)"
        )}
        
        {withTooltip(
          <button 
            className={isSplitView ? activeButtonClass : buttonClass}
            onClick={() => onAction('toggleSplitView')}
            title="Split View"
          >
            <SplitSquareVertical size={18} />
          </button>,
          "Split View (Ctrl+P)"
        )}
      </div>
      
      {/* Header buttons */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('heading')} 
            disabled={isEditingDisabled}
          >
            <Hash size={18} />
          </button>,
          "Heading 1"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('heading2')} 
            disabled={isEditingDisabled}
          >
            <Type size={18} />
          </button>,
          "Heading 2"
        )}
      </div>
      
      {/* Text formatting */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('bold')}
            disabled={isEditingDisabled}
          >
            <Bold size={18} />
          </button>,
          "Bold"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('italic')}
            disabled={isEditingDisabled}
          >
            <Italic size={18} />
          </button>,
          "Italic"
        )}
      </div>
      
      {/* Lists and items */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('unorderedList')}
            disabled={isEditingDisabled}
          >
            <List size={18} />
          </button>,
          "Bullet List"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('orderedList')}
            disabled={isEditingDisabled}
          >
            <ListOrdered size={18} />
          </button>,
          "Numbered List"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('checkbox')}
            disabled={isEditingDisabled}
          >
            <CheckSquare size={18} />
          </button>,
          "Task List"
        )}
      </div>
      
      {/* Other markdown elements */}
      <div className="flex mr-4 border-r pr-4 border-gray-700">
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('code')}
            disabled={isEditingDisabled}
          >
            <Code size={18} />
          </button>,
          "Code Block"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('link')}
            disabled={isEditingDisabled}
          >
            <Link size={18} />
          </button>,
          "Link"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('blockquote')}
            disabled={isEditingDisabled}
          >
            <Quote size={18} />
          </button>,
          "Blockquote"
        )}
        
        {withTooltip(
          <button 
            className={buttonClass}
            onClick={() => onAction('horizontalRule')}
            disabled={isEditingDisabled}
          >
            <Minus size={18} />
          </button>,
          "Horizontal Rule"
        )}
      </div>

      <div className="flex items-center ml-auto">
        {saveMessage && (
          <div className="text-sm mr-2 flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{saveMessage}</span>
          </div>
        )}
        
        {withTooltip(
          <button 
            className={`${buttonClass} ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`}
            onClick={() => onAction('save')}
          >
            <Save size={18} />
          </button>,
          "Save (Ctrl+S)"
        )}
      </div>
    </div>
  );
};

export default MarkdownToolbar;