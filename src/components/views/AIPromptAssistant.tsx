// AIPromptAssistant.tsx
import React, { useState } from 'react';
import { Sparkles, MessageCircle, Plus, ThumbsUp, ThumbsDown, X, Send } from 'lucide-react';

interface AIPromptAssistantProps {
  currentContent: string;
  onInsertSuggestion: (text: string) => void;
  darkMode: boolean;
}

type SuggestionType = 'improve' | 'examples' | 'formatting' | 'expand' | 'condense';

interface Suggestion {
  id: string;
  type: SuggestionType;
  description: string;
  content: string;
}

export const AIPromptAssistant: React.FC<AIPromptAssistantProps> = ({
  currentContent,
  onInsertSuggestion,
  darkMode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'chat'>('suggestions');
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    {role: 'assistant', content: 'Hello! I\'m your AI prompt assistant. How can I help you improve your prompt?'}
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // In a real implementation, these would come from an AI service
  // For now, we'll simulate with pre-defined suggestions
  const suggestions: Suggestion[] = [
    {
      id: 's1',
      type: 'improve',
      description: 'Add clearer constraints',
      content: `## Constraints
- Focus responses on the specified topic only
- Keep explanations concise and simple unless details are requested
- Avoid speculating beyond what's directly relevant
- Clearly indicate when information might be uncertain`
    },
    {
      id: 's2',
      type: 'examples',
      description: 'Add example interactions',
      content: `## Example Interactions

**User:** [Example user query]
**Assistant:** [Example detailed, helpful response]

**User:** [Another example query]
**Assistant:** [Another example response]`
    },
    {
      id: 's3',
      type: 'formatting',
      description: 'Improve formatting structure',
      content: `# [Main Role/Title]

## About You
- [Key characteristic 1]
- [Key characteristic 2]
- [Key characteristic 3]

## Goals
- [Primary goal]
- [Secondary goal]
- [Tertiary goal]

## Guidelines
- [Guideline 1]
- [Guideline 2]
- [Guideline 3]`
    },
    {
      id: 's4',
      type: 'expand',
      description: 'Expand on user understanding',
      content: `## User Context
- Understand that users may have varying levels of knowledge on this topic
- Adapt explanations based on the user's demonstrated expertise
- Ask clarifying questions when the user's request is ambiguous
- Consider the user's likely goals when formulating responses`
    },
    {
      id: 's5',
      type: 'condense',
      description: 'Focus your instructions',
      content: `## Key Priorities
1. Accuracy - Provide factual, well-reasoned information
2. Clarity - Express ideas in straightforward language
3. Relevance - Focus on addressing the user's actual needs
4. Actionability - Offer practical, implementable advice`
    }
  ];
  
  const bgClass = darkMode ? 'bg-slate-800' : 'bg-white';
  const borderClass = darkMode ? 'border-gray-700' : 'border-gray-200';
  const textClass = darkMode ? 'text-gray-300' : 'text-gray-700';
  const headingClass = darkMode ? 'text-white' : 'text-gray-900';
  const buttonClass = darkMode 
    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
    : 'bg-gray-200 hover:bg-gray-300 text-gray-800';
  const primaryButtonClass = darkMode 
    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
    : 'bg-indigo-500 hover:bg-indigo-600 text-white';
  
  const handleInsertSuggestion = (text: string) => {
    onInsertSuggestion(text);
  };
  
  const simulateAIResponse = (message: string) => {
    // In a real app, this would call an AI service
    // For demo, we'll return canned responses based on simple pattern matching
    setIsGenerating(true);
    
    // Simulate a delay for realism
    setTimeout(() => {
      let response = '';
      
      if (message.toLowerCase().includes('format') || message.toLowerCase().includes('structure')) {
        response = "I recommend structuring your prompt with these sections:\n\n1. **Role & Context** - Who the AI should be and what situation it's in\n2. **Goals** - Clear outcomes the AI should aim for\n3. **Constraints** - Limitations on what the AI should do\n4. **Guidelines** - Specific instructions for tone, format, etc.\n5. **Examples** - Sample interactions if helpful";
      } 
      else if (message.toLowerCase().includes('example') || message.toLowerCase().includes('sample')) {
        response = "Here's an example section you could add:\n\n## Examples\n\n**User:** How do I implement a sorting algorithm in Python?\n**Assistant:** I'd be happy to help with that! Let's implement a simple bubble sort algorithm:\n\n```python\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n```\n\nThis implementation works by repeatedly stepping through the list, comparing adjacent elements, and swapping them if they're in the wrong order.";
      }
      else if (message.toLowerCase().includes('improve') || message.toLowerCase().includes('better')) {
        response = "Based on your current prompt, I suggest these improvements:\n\n1. Add more specific guidelines about the depth of responses\n2. Clarify if code examples should include comments\n3. Specify any formatting preferences\n4. Consider adding constraints around topics to avoid\n5. Make sure your instructions aren't contradictory";
      }
      else {
        response = "I'd be happy to help with your prompt. Could you tell me more specifically what aspect you'd like assistance with? For example:\n\n- Overall structure and organization\n- Making instructions clearer\n- Adding examples or scenarios\n- Refining the tone or style\n- Addressing specific issues or edge cases";
      }
      
      setChatMessages([...chatMessages, {role: 'assistant', content: response}]);
      setIsGenerating(false);
    }, 1500);
  };
  
  const handleSendMessage = () => {
    if (!userMessage.trim()) return;
    
    const updatedMessages = [...chatMessages, {role: 'user', content: userMessage}];
    setChatMessages(updatedMessages);
    setUserMessage('');
    
    simulateAIResponse(userMessage);
  };
  
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 ${primaryButtonClass} rounded-full p-3 shadow-lg`}
        title="AI Prompt Assistant"
      >
        <Sparkles size={20} />
      </button>
    );
  }
  
  return (
    <div className={`fixed bottom-6 right-6 ${bgClass} border ${borderClass} rounded-lg shadow-xl w-80 md:w-96 flex flex-col transition-all duration-300 ease-in-out z-50`} style={{height: '500px'}}>
      {/* Header */}
      <div className={`p-3 ${borderClass} border-b flex justify-between items-center`}>
        <h3 className={`${headingClass} font-semibold flex items-center`}>
          <Sparkles size={18} className="mr-2" />
          AI Prompt Assistant
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={18} />
        </button>
      </div>
      
      {/* Tabs */}
      <div className={`flex ${borderClass} border-b`}>
        <button
          className={`flex-1 py-2 px-4 text-center transition-colors duration-200 ${
            activeTab === 'suggestions'
              ? darkMode 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-100 text-gray-900'
              : `${textClass}`
          }`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
        <button
          className={`flex-1 py-2 px-4 text-center transition-colors duration-200 ${
            activeTab === 'chat'
              ? darkMode 
                ? 'bg-gray-700 text-white' 
                : 'bg-gray-100 text-gray-900'
              : `${textClass}`
          }`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'suggestions' ? (
          <div className="p-2">
            <p className={`${textClass} text-sm mb-3 px-2`}>
              Try these suggestions to improve your prompt:
            </p>
            <ul className="space-y-2">
              {suggestions.map(suggestion => (
                <li key={suggestion.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-3`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`${headingClass} font-medium`}>
                      {suggestion.description}
                    </span>
                    <button
                      onClick={() => handleInsertSuggestion(suggestion.content)}
                      className={`${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'} rounded-md p-1`}
                      title="Insert this suggestion"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <pre className={`${textClass} text-xs whitespace-pre-wrap font-mono`}>
                    {suggestion.content.length > 100 
                      ? `${suggestion.content.slice(0, 100)}...` 
                      : suggestion.content}
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-3">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-3 ${
                    msg.role === 'user'
                      ? 'ml-8 bg-indigo-500 text-white'
                      : darkMode 
                        ? 'mr-8 bg-gray-700 text-white' 
                        : 'mr-8 bg-gray-100 text-gray-800'
                  } p-3 rounded-lg`}
                >
                  {msg.content}
                </div>
              ))}
              {isGenerating && (
                <div className={`mb-3 mr-8 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'} p-3 rounded-lg`}>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></div>
                  </div>
                </div>
              )}
            </div>
            <div className={`p-3 ${borderClass} border-t`}>
              <div className="flex items-center">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Ask for help with your prompt..."
                  className={`flex-1 p-2 rounded-l-md ${
                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
                  } border ${borderClass} focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !userMessage.trim()}
                  className={`${primaryButtonClass} p-2 rounded-r-md ${
                    (isGenerating || !userMessage.trim()) && 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPromptAssistant;