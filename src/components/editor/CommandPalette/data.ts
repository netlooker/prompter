// src/components/editor/CommandPalette/data.ts
import { PromptBlock } from "./types";

export const promptBlocks: PromptBlock[] = [
  // Personas
  {
    id: "ai-assistant",
    title: "AI Assistant",
    description: "General AI assistant persona",
    category: "personas",
    content: `## Role
You are a helpful, harmless, and honest AI assistant. You provide accurate information and helpful advice on a wide range of topics. You clearly communicate your limitations and avoid making up information.`,
    tags: ["role", "assistant", "general"],
  },
  {
    id: "expert-dev",
    title: "Expert Developer",
    description: "Senior developer with technical expertise",
    category: "personas",
    content: `## Role
You are a Senior Software Developer with over 15 years of experience in building scalable applications. You have deep expertise in software architecture, design patterns, and best practices. You provide detailed, technically accurate explanations and code samples.`,
    tags: ["role", "developer", "expert", "technical"],
  },
  {
    id: "content-writer",
    title: "Content Writer",
    description: "Professional content writer",
    category: "personas",
    content: `## Role
You are a professional Content Writer with expertise in creating engaging, well-researched articles and blog posts. You can adapt your tone and style to match different audiences and purposes. You excel at explaining complex topics in an accessible way.`,
    tags: ["role", "writer", "content"],
  },

  // Instructions
  {
    id: "step-by-step",
    title: "Step-by-Step Guide",
    description: "Break down explanation into clear steps",
    category: "instructions",
    content: `## Instruction Style
Break down your explanation into a clear, step-by-step guide. Number each step and explain its purpose. Include code examples where appropriate. Conclude with a summary of what was covered.`,
    tags: ["instruction", "steps", "guide"],
  },
  {
    id: "code-analysis",
    title: "Code Analysis",
    description: "Analyze code for issues and improvements",
    category: "instructions",
    content: `## Instructions
Analyze the provided code for:
1. Potential bugs and edge cases
2. Performance issues
3. Security vulnerabilities
4. Style and best practices
5. Opportunities for refactoring

Format your response with sections for each category and provide specific suggestions for improvements.`,
    tags: ["code", "review", "analysis"],
  },
  {
    id: "rewrite-content",
    title: "Content Rewrite",
    description: "Rewrite content to improve clarity and style",
    category: "instructions",
    content: `## Instructions
Rewrite the provided text to improve:
- Clarity and conciseness
- Grammar and punctuation
- Flow and organization
- Tone and style consistency

Maintain the original meaning while making the text more engaging and professional.`,
    tags: ["writing", "rewrite", "edit"],
  },

  // Templates
  {
    id: "prompt-template",
    title: "Complete Prompt Template",
    description: "Full prompt with role, instructions, examples, and format",
    category: "templates",
    content: `# Complete Prompt Template

## Role
[Define the AI's expertise, experience, and persona]

## Task
[Describe the specific task or problem to solve]

## Instructions
[Provide detailed instructions on how to approach the task]

## Examples
[Provide example inputs and expected outputs]

## Output Format
[Specify the desired format for the response]

## Constraints
[Set any limitations or requirements]`,
    tags: ["template", "full", "complete"],
  },
  {
    id: "task-template",
    title: "Simple Task Template",
    description: "Basic task and output format template",
    category: "templates",
    content: `## Task
[Describe what you want the AI to do]

## Output Format
[Describe how you want the response structured]`,
    tags: ["template", "simple", "basic"],
  },
  {
    id: "tutorial-template",
    title: "Tutorial Template",
    description: "Template for creating educational tutorials",
    category: "templates",
    content: `# [Tutorial Title]

## Prerequisites
- [Knowledge or setup requirements]

## Learning Objectives
- [What the learner will accomplish]

## Step-by-Step Guide
1. [First step with detailed explanation]
2. [Second step with detailed explanation]
3. [Continue with numbered steps]

## Common Issues and Solutions
- [Problem 1]: [Solution 1]
- [Problem 2]: [Solution 2]

## Next Steps
- [Suggestions for further learning]`,
    tags: ["template", "tutorial", "learning"],
  },

  // Constraints
  {
    id: "concise-response",
    title: "Concise Response",
    description: "Keep response brief and to the point",
    category: "constraints",
    content: `## Constraints\nKeep your response brief and to the point. Limit to 3-5 paragraphs maximum.`,
    tags: ["constraint", "brevity", "concise"],
  },
  {
    id: "detailed-response",
    title: "Detailed Response",
    description: "Provide a comprehensive, in-depth response",
    category: "constraints",
    content: `## Constraints\nProvide a comprehensive, in-depth response that thoroughly explores all aspects of the topic. Include examples, nuances, and address potential counter-arguments.`,
    tags: ["constraint", "detailed", "thorough"],
  },
  {
    id: "beginner-friendly",
    title: "Beginner-Friendly",
    description: "Explain in simple terms for beginners",
    category: "constraints",
    content: `## Constraints\nExplain everything in simple, beginner-friendly terms. Avoid jargon and technical language, or if necessary, explain it thoroughly. Use metaphors and examples that someone with no background in the field would understand.`,
    tags: ["constraint", "beginner", "simple"],
  },

  // System
  {
    id: "markdown-format",
    title: "Use Markdown",
    description: "Format response using Markdown",
    category: "system",
    content: `## Output Format\nFormat your entire response using Markdown. Use headings, lists, code blocks, and emphasis where appropriate to improve readability.`,
    tags: ["format", "markdown", "system"],
  },
  {
    id: "table-format",
    title: "Include Tables",
    description: "Format data in Markdown tables",
    category: "system",
    content: `## Output Format\nPresent comparative data in Markdown tables. Use proper column alignment and headers to organize information clearly.`,
    tags: ["format", "table", "system"],
  },
  {
    id: "citation-format",
    title: "Include Citations",
    description: "Include citations for factual claims",
    category: "system",
    content: `## Output Format\nInclude citations for factual claims. For each important statement, add a reference to indicate the source of information. Acceptable forms include inline references or footnotes in a references section at the end.`,
    tags: ["format", "citations", "system"],
  },
];
