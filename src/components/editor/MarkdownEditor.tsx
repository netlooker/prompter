import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import MarkdownToolbar from './MarkdownToolbar';
import MarkdownPreview from './MarkdownPreview';
import { AlertTriangle, ChevronsRight, Edit, Eye } from 'lucide-react';
import { loadTokyoNightThemes } from './monaco-themes';
import './monaco-suggestion.css';

interface MarkdownEditorProps {
  darkMode: boolean;
  initialValue?: string;
  onChange?: (value: string) => void;
  autosaveKey?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  darkMode, 
  initialValue = '', 
  onChange,
  autosaveKey = 'prompter-editor-content' 
}) => {
  const [editorContent, setEditorContent] = useState<string>(initialValue);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [splitView, setSplitView] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [themesLoaded, setThemesLoaded] = useState<boolean>(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  
  // Define shared Monaco editor options
  const editorOptions = useMemo(() => ({
    wordWrap: 'on',
    minimap: { enabled: true, scale: 0.5, showSlider: 'mouseover' },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    renderLineHighlight: 'all',
    fontFamily: "'IBM Plex Mono', 'Fira Code', 'Source Code Pro', Menlo, Monaco, 'Courier New', monospace",
    fontSize: 14,
    tabSize: 2,
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
      verticalSliderSize: 8,
      horizontalSliderSize: 8,
      alwaysConsumeMouseWheel: false
    },
    formatOnPaste: true,
    quickSuggestions: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    suggest: {
      showIcons: true,
      showStatusBar: true,
      preview: false, // Disable preview to prevent jumping
      snippetsPreventQuickSuggestions: false,
      suggestLineHeight: 24,
      suggestFontSize: 14,
      maxVisibleSuggestions: 20,
      suggestSelection: 'first',
      showInlineDetails: false,
      insertMode: 'insert'
    },
    hover: {
      enabled: true,
      above: false, // Force hover to stay below
      delay: 300
    }
  }), []);

  // Load from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem(autosaveKey);
    if (savedContent && !initialValue) {
      setEditorContent(savedContent);
    }
  }, [autosaveKey, initialValue]);

  // Auto-save to localStorage
  useEffect(() => {
    const autosaveTimer = setTimeout(() => {
      if (editorContent) {
        localStorage.setItem(autosaveKey, editorContent);
        setIsSaved(true);
        setSaveMessage('Auto-saved');
        
        // Clear the message after 2 seconds
        setTimeout(() => {
          setSaveMessage('');
        }, 2000);
      }
    }, 2000);

    return () => clearTimeout(autosaveTimer);
  }, [editorContent, autosaveKey]);

  // Configure Monaco editor before mounting
  const handleBeforeMount = async (monaco: typeof import('monaco-editor')) => {
    monacoRef.current = monaco;
    
    // Load Tokyo Night themes
    const loaded = await loadTokyoNightThemes(monaco);
    setThemesLoaded(loaded);
    
    // Customize suggestion items rendering
    const originalRenderer = monaco.languages.CompletionItemKind.toIcon;
    monaco.languages.CompletionItemKind.toIcon = function(kind) {
      const result = originalRenderer(kind);
      
      // Override icons for our markdown snippets
      if (kind === monaco.languages.CompletionItemKind.Snippet) {
        return { fontText: '✏️' };
      }
      
      return result;
    };
    
    // Register markdown specific features
    monaco.languages.registerCompletionItemProvider('markdown', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        
        const suggestions = [
          {
            label: '# Heading 1',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '# ${1:Heading}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Main heading',
            documentation: 'Insert a level 1 heading (title)'
          },
          {
            label: '## Heading 2',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '## ${1:Heading}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Section heading',
            documentation: 'Insert a level 2 heading (section)'
          },
          {
            label: '### Heading 3',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '### ${1:Heading}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Subsection heading',
            documentation: 'Insert a level 3 heading (subsection)'
          },
          {
            label: '**Bold**',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '**${1:text}**',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Bold text',
            documentation: 'Make selected text bold'
          },
          {
            label: '*Italic*',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '*${1:text}*',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Italic text',
            documentation: 'Make selected text italic'
          },
          {
            label: '- List item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '- ${1:List item}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Bullet list',
            documentation: 'Insert a bullet point list item'
          },
          {
            label: '1. Numbered list item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '1. ${1:List item}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Numbered list',
            documentation: 'Insert a numbered list item (automatically continues)'
          },
          {
            label: '> Blockquote',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '> ${1:Blockquote}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Quote block',
            documentation: 'Insert a blockquote for references or emphasis'
          },
          {
            label: '- [ ] Task',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '- [ ] ${1:Task description}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Checklist item',
            documentation: 'Insert a checkbox task item'
          },
          {
            label: 'Link',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '[${1:Link text}](${2:url})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Hyperlink',
            documentation: 'Insert a link to a URL'
          },
          {
            label: 'Image',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '![${1:Alt text}](${2:url})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Image embed',
            documentation: 'Insert an image with alt text'
          },
          {
            label: 'Code block',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '```${1:language}\n${2:code}\n```',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Formatted code',
            documentation: 'Insert a code block with syntax highlighting'
          },
          {
            label: '`Inline code`',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '`${1:code}`',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
            detail: 'Code span',
            documentation: 'Format text as inline code'
          },
          {
            label: 'Horizontal rule',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '---\n',
            range,
            detail: 'Section divider',
            documentation: 'Insert a horizontal dividing line'
          }
        ];
        
        return { suggestions };
      }
    });
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Setup editor keybindings for common markdown tasks
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // Save action still works with keyboard shortcut despite button removal
      handleToolbarAction('save');
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      handleToolbarAction('togglePreview');
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      handleToolbarAction('toggleSplitView');
    });
    
    // Add auto-continue for ordered lists
    editor.onKeyDown((e) => {
      if (e.keyCode === monaco.KeyCode.Enter) {
        const model = editor.getModel();
        const position = editor.getPosition();
        
        if (model && position) {
          const lineContent = model.getLineContent(position.lineNumber);
          
          // Match ordered list pattern: `1. `, `2. `, etc.
          const orderedListMatch = lineContent.match(/^(\s*)(\d+)\.(\s+)(.*)/);
          
          // Match unordered list pattern: `- `, `* `, etc.
          const unorderedListMatch = lineContent.match(/^(\s*)([\-\*\+])(\s+)(.*)/);
          
          if (orderedListMatch) {
            const [, indent, num, space, text] = orderedListMatch;
            const nextNum = parseInt(num, 10) + 1;
            
            // Only continue the list if there was content in the item
            if (text.trim().length > 0) {
              // Let the default Enter happen first
              setTimeout(() => {
                const newPosition = editor.getPosition();
                if (newPosition) {
                  const nextItem = `${indent}${nextNum}.${space}`;
                  editor.executeEdits('auto-list', [{
                    range: {
                      startLineNumber: newPosition.lineNumber,
                      startColumn: 1,
                      endLineNumber: newPosition.lineNumber,
                      endColumn: 1
                    },
                    text: nextItem
                  }]);
                  
                  // Move cursor to end of inserted text
                  editor.setPosition({
                    lineNumber: newPosition.lineNumber,
                    column: nextItem.length + 1
                  });
                }
              }, 0);
            }
          } else if (unorderedListMatch) {
            const [, indent, bullet, space, text] = unorderedListMatch;
            
            // Only continue the list if there was content in the item
            if (text.trim().length > 0) {
              // Let the default Enter happen first
              setTimeout(() => {
                const newPosition = editor.getPosition();
                if (newPosition) {
                  const nextItem = `${indent}${bullet}${space}`;
                  editor.executeEdits('auto-list', [{
                    range: {
                      startLineNumber: newPosition.lineNumber,
                      startColumn: 1,
                      endLineNumber: newPosition.lineNumber,
                      endColumn: 1
                    },
                    text: nextItem
                  }]);
                  
                  // Move cursor to end of inserted text
                  editor.setPosition({
                    lineNumber: newPosition.lineNumber,
                    column: nextItem.length + 1
                  });
                }
              }, 0);
            }
          }
        }
      }
    });
    
    // Make editor focus automatically
    setTimeout(() => editor.focus(), 100);
  };

  const handleEditorChange = (value: string = '') => {
    setEditorContent(value);
    setIsSaved(false);
    if (onChange) {
      onChange(value);
    }
  };

  const insertTextAtCursor = (textBefore: string, textAfter: string = '') => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    const selectedText = editor.getModel().getValueInRange(selection);
    
    const range = new monaco.Range(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn
    );

    const text = textBefore + selectedText + textAfter;
    
    editor.executeEdits('insert-text', [{ range, text }]);
    editor.focus();
  };

  const handleToolbarAction = (action: string) => {
    if (action === 'togglePreview') {
      setSplitView(false);
      setIsPreviewMode(!isPreviewMode);
      return;
    }
    
    if (action === 'toggleEdit') {
      setIsPreviewMode(false);
      setSplitView(false);
      return;
    }
    
    if (action === 'toggleSplitView') {
      setIsPreviewMode(false);
      setSplitView(!splitView);
      return;
    }

    if (action === 'save') {
      localStorage.setItem(autosaveKey, editorContent);
      setIsSaved(true);
      setSaveMessage('Saved successfully');
      
      // Clear the message after 2 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 2000);
      return;
    }

    // Don't proceed with other actions if in preview mode
    if (isPreviewMode && !splitView) return;

    const editor = editorRef.current;
    if (!editor) return;

    // Handle different formatting actions
    switch (action) {
      case 'heading':
        insertTextAtCursor('# ');
        break;
      case 'heading2':
        insertTextAtCursor('## ');
        break;
      case 'heading3':
        insertTextAtCursor('### ');
        break;
      case 'heading4':
        insertTextAtCursor('#### ');
        break;
      case 'heading5':
        insertTextAtCursor('##### ');
        break;
      case 'heading6':
        insertTextAtCursor('###### ');
        break;
      case 'bold':
        insertTextAtCursor('**', '**');
        break;
      case 'italic':
        insertTextAtCursor('*', '*');
        break;
      case 'unorderedList':
        insertTextAtCursor('- ');
        break;
      case 'orderedList':
        insertTextAtCursor('1. ');
        break;
      case 'code':
        insertTextAtCursor('```\n', '\n```');
        break;
      case 'inlineCode':
        insertTextAtCursor('`', '`');
        break;
      case 'link':
        insertTextAtCursor('[', '](url)');
        break;
      case 'blockquote':
        insertTextAtCursor('> ');
        break;
      case 'checkbox':
        insertTextAtCursor('- [ ] ');
        break;
      case 'horizontalRule':
        insertTextAtCursor('---\n');
        break;
      default:
        break;
    }
  };

  // Define view mode buttons
  // Removed floating ViewModeButtons component as requested;

  return (
    <div className="flex flex-col h-full">
      <MarkdownToolbar 
        onAction={handleToolbarAction} 
        isPreviewMode={isPreviewMode}
        isSplitView={splitView}
        darkMode={darkMode}
        saveMessage={saveMessage}
      />

      
      <div className="flex-grow relative">
        
        {/* Split View */}
        {splitView && (
          <div className="flex h-full">
            {/* Editor */}
            <div className="w-1/2 h-full border-r border-gray-300 dark:border-gray-700">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                value={editorContent}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                beforeMount={handleBeforeMount}
                theme={darkMode ? 'tokyo-night' : 'tokyo-night-light'}
                options={editorOptions}
              />
            </div>
            
            {/* Preview */}
            <div className="w-1/2 h-full overflow-auto">
              {editorContent ? (
                <MarkdownPreview 
                  markdown={editorContent} 
                  darkMode={darkMode} 
                />
              ) : (
                <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <AlertTriangle size={48} className="mb-4 opacity-50" />
                  <p>No content to preview</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Editor Only View */}
        {!isPreviewMode && !splitView && (
          <div className="absolute inset-0">
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={editorContent}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              beforeMount={handleBeforeMount}
              theme={darkMode ? 'tokyo-night' : 'tokyo-night-light'}
              options={editorOptions}
            />
          </div>
        )}
        
        {/* Preview Only View */}
        {isPreviewMode && !splitView && (
          <div className="absolute inset-0">
            {editorContent ? (
              <MarkdownPreview 
                markdown={editorContent} 
                darkMode={darkMode} 
              />
            ) : (
              <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <AlertTriangle size={48} className="mb-4 opacity-50" />
                <p>No content to preview</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;