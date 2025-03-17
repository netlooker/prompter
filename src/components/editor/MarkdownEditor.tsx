import React, { useState, useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import Editor, { OnMount, BeforeMount } from '@monaco-editor/react';
import MarkdownToolbar from './MarkdownToolbar';
import MarkdownPreview from './MarkdownPreview';
import { AlertTriangle, ChevronsRight, Edit, Eye } from 'lucide-react';
import { loadTokyoNightThemes } from './monaco-themes';

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
            range
          },
          {
            label: '## Heading 2',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '## ${1:Heading}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '### Heading 3',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '### ${1:Heading}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '**Bold**',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '**${1:text}**',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '*Italic*',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '*${1:text}*',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '- List item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '- ${1:List item}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '1. Numbered list item',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '1. ${1:List item}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '> Blockquote',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '> ${1:Blockquote}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '- [ ] Task',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '- [ ] ${1:Task description}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Link',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '[${1:Link text}](${2:url})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Image',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '![${1:Alt text}](${2:url})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Code block',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '```${1:language}\n${2:code}\n```',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: '`Inline code`',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '`${1:code}`',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range
          },
          {
            label: 'Horizontal rule',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '---\n',
            range
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
      handleToolbarAction('save');
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyE, () => {
      handleToolbarAction('togglePreview');
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      handleToolbarAction('toggleSplitView');
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
      />
      
      {saveMessage && (
        <div className={`px-4 py-2 ${darkMode ? 'bg-slate-700 text-gray-100' : 'bg-gray-100 text-gray-800'} flex items-center transition-all duration-300`}>
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
          {saveMessage}
        </div>
      )}
      
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
                options={{
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
                    preview: true,
                    snippetsPreventQuickSuggestions: false
                  }
                }}
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
              options={{
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
                  preview: true,
                  snippetsPreventQuickSuggestions: false
                }
              }}
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