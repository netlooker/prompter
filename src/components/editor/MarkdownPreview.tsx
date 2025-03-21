import React, { useEffect, useRef } from 'react';
import './editor.css';
import { marked } from 'marked';

interface MarkdownPreviewProps {
  markdown: string;
  darkMode: boolean;
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, darkMode }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      // Convert markdown to HTML and set it to the div
      previewRef.current.innerHTML = marked.parse(markdown) as string;
      
      // Add syntax highlighting to code blocks if needed
      // This could be expanded with a syntax highlighting library like highlight.js
    }
  }, [markdown]);

  return (
    <div 
      ref={previewRef}
      className={`prose max-w-none ${darkMode ? 'prose-invert' : ''} px-4 py-4 overflow-y-auto h-full`}
    ></div>
  );
};

export default MarkdownPreview;