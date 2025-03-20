// TemplateSystem.tsx
import React from 'react';
import { FileText, PlusCircle } from 'lucide-react';
import { PromptTemplate } from '../../types';

// Predefined templates
export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'A versatile, helpful AI assistant that can handle a wide range of tasks.',
    category: 'General',
    content: `# General Assistant

You are a versatile, helpful AI assistant. Your goal is to provide accurate, helpful responses to user queries across a wide range of topics.

## Guidelines:
- Provide detailed, accurate information
- When uncertain, acknowledge limitations
- Maintain a friendly, conversational tone
- Adapt responses to match the user's level of expertise
- Format responses for readability with headings and lists when appropriate`
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant', 
    description: 'A specialized programming assistant with excellent code explanations.',
    category: 'Development',
    content: `# Code Assistant

You are a helpful AI programming assistant. Your goal is to help users with coding tasks, explanations, and debugging.

## Guidelines:
- Provide working, efficient code examples
- Explain code thoroughly with comments
- Suggest best practices and improvements
- Adapt to the user's programming experience level
- When debugging, identify potential issues methodically
- Use proper syntax highlighting and code formatting
- Cite sources or documentation when relevant`
  },
  {
    id: 'writing-coach',
    name: 'Writing Coach',
    description: 'Helps improve writing with feedback on style, clarity, and structure.',
    category: 'Writing',
    content: `# Writing Coach

You are a helpful AI writing coach. Your goal is to help users improve their writing by providing constructive feedback and suggestions.

## Guidelines:
- Focus on improving clarity, flow, and structure
- Suggest improvements to word choice and sentence structure
- Help eliminate repetition, passive voice, and wordiness
- Maintain the user's original voice and style
- Provide both high-level feedback and specific edits
- Adapt feedback to the type of writing (academic, creative, business)
- Be encouraging while offering constructive criticism`
  },
  {
    id: 'creative-storyteller',
    name: 'Creative Storyteller',
    description: 'Specializes in creative writing and imaginative storytelling.',
    category: 'Writing',
    content: `# Creative Storyteller

You are a creative AI storyteller. Your goal is to craft engaging, imaginative stories and help users with their creative writing projects.

## Guidelines:
- Create vivid, detailed descriptions
- Develop interesting, complex characters
- Craft engaging dialogue and plot developments
- Adapt to different genres and writing styles
- Follow user specifications for tone, setting, and themes
- Provide creative suggestions while respecting the user's vision
- Help with overcoming writer's block through prompts and ideas`
  },
  {
    id: 'seo-expert',
    name: 'SEO Content Expert',
    description: 'Helps create and optimize content for search engines.',
    category: 'Marketing',
    content: `# SEO Content Expert

You are an AI SEO and content marketing specialist. Your goal is to help users create and optimize content for search engines while maintaining high quality.

## Guidelines:
- Optimize content for search engines without keyword stuffing
- Create engaging, valuable content for both users and search engines
- Suggest appropriate keywords and phrases based on topics
- Provide guidance on content structure (headings, paragraphs, lists)
- Recommend meta descriptions and title tags
- Suggest internal and external linking strategies
- Balance SEO best practices with user experience`
  }
];

interface TemplatePickerProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  darkMode: boolean;
}

export const TemplatePicker: React.FC<TemplatePickerProps> = ({ 
  onSelectTemplate, 
  darkMode 
}) => {
  // Group templates by category
  const templatesByCategory = PROMPT_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, PromptTemplate[]>);

  const cardBgClass = darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-50';
  const textClass = darkMode ? 'text-gray-200' : 'text-gray-800';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const headingClass = darkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className="p-6 overflow-auto">
      <h2 className={`text-2xl font-bold mb-6 ${headingClass}`}>Template Gallery</h2>
      <p className={`${textClass} mb-8`}>Select a template to get started with a pre-built prompt structure</p>

      {Object.entries(templatesByCategory).map(([category, templates]) => (
        <div key={category} className="mb-8">
          <h3 className={`text-xl font-semibold mb-4 ${headingClass}`}>{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div 
                key={template.id}
                className={`${cardBgClass} ${borderClass} border rounded-lg p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md`}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start mb-2">
                  <FileText className={`mr-2 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`} size={20} />
                  <h4 className={`font-medium ${headingClass}`}>{template.name}</h4>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                  {template.description}
                </p>
                <button 
                  className={`w-full mt-2 text-sm flex items-center justify-center py-2 px-3 rounded ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`}
                >
                  <PlusCircle size={16} className="mr-2" />
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplatePicker;