// src/components/editor/CommandPalette/data.ts
import { Block, BlockType } from "./types";
import { v4 as uuidv4 } from "uuid";

// Generate current timestamp
const now = Date.now();

export const blockTypes: BlockType[] = [
  {
    id: "role",
    name: "Role",
    description: "Define the AI's expertise and persona",
    icon: "user",
  },
  {
    id: "instruction",
    name: "Instruction",
    description: "Provide guidelines on how to approach tasks",
    icon: "listChecks",
  },
  {
    id: "template",
    name: "Template",
    description: "Reusable prompt structures",
    icon: "layoutTemplate",
  },
  {
    id: "constraint",
    name: "Constraint",
    description: "Set limitations or requirements",
    icon: "shield",
  },
  {
    id: "system",
    name: "System",
    description: "Format and presentation instructions",
    icon: "settings",
  },
];

export const blocks: Block[] = [
  // Role blocks
  {
    id: uuidv4(),
    typeId: "role",
    name: "AI Assistant",
    description: "General AI assistant persona",
    content: `## Role
You are a helpful, harmless, and honest AI assistant. You provide accurate information and helpful advice on a wide range of topics. You clearly communicate your limitations and avoid making up information.`,
    tags: ["assistant", "general"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "role",
    name: "Expert Developer",
    description: "Senior developer with technical expertise",
    content: `## Role
You are a Senior Software Developer with over 15 years of experience in building scalable applications. You have deep expertise in software architecture, design patterns, and best practices. You provide detailed, technically accurate explanations and code samples.`,
    tags: ["developer", "expert", "technical"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "role",
    name: "Content Writer",
    description: "Professional content writer",
    content: `## Role
You are a professional Content Writer with expertise in creating engaging, well-researched articles and blog posts. You can adapt your tone and style to match different audiences and purposes. You excel at explaining complex topics in an accessible way.`,
    tags: ["writer", "content"],
    createdAt: now,
    updatedAt: now,
  },

  // Instruction blocks
  {
    id: uuidv4(),
    typeId: "instruction",
    name: "Step-by-Step Guide",
    description: "Break down explanation into clear steps",
    content: `## Instruction Style
Break down your explanation into a clear, step-by-step guide. Number each step and explain its purpose. Include code examples where appropriate. Conclude with a summary of what was covered.`,
    tags: ["steps", "guide"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "instruction",
    name: "Code Analysis",
    description: "Analyze code for issues and improvements",
    content: `## Instructions
Analyze the provided code for:
1. Potential bugs and edge cases
2. Performance issues
3. Security vulnerabilities
4. Style and best practices
5. Opportunities for refactoring

Format your response with sections for each category and provide specific suggestions for improvements.`,
    tags: ["code", "review", "analysis"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "instruction",
    name: "Content Rewrite",
    description: "Rewrite content to improve clarity and style",
    content: `## Instructions
Rewrite the provided text to improve:
- Clarity and conciseness
- Grammar and punctuation
- Flow and organization
- Tone and style consistency

Maintain the original meaning while making the text more engaging and professional.`,
    tags: ["writing", "rewrite", "edit"],
    createdAt: now,
    updatedAt: now,
  },

  // Template blocks
  {
    id: uuidv4(),
    typeId: "template",
    name: "Complete Prompt Template",
    description: "Full prompt with role, instructions, examples, and format",
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
    tags: ["full", "complete"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "template",
    name: "Simple Task Template",
    description: "Basic task and output format template",
    content: `## Task
[Describe what you want the AI to do]

## Output Format
[Describe how you want the response structured]`,
    tags: ["simple", "basic"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "template",
    name: "Tutorial Template",
    description: "Template for creating educational tutorials",
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
    tags: ["tutorial", "learning"],
    createdAt: now,
    updatedAt: now,
  },

  // Constraint blocks
  {
    id: uuidv4(),
    typeId: "constraint",
    name: "Concise Response",
    description: "Keep response brief and to the point",
    content: `## Constraints\nKeep your response brief and to the point. Limit to 3-5 paragraphs maximum.`,
    tags: ["brevity", "concise"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "constraint",
    name: "Detailed Response",
    description: "Provide a comprehensive, in-depth response",
    content: `## Constraints\nProvide a comprehensive, in-depth response that thoroughly explores all aspects of the topic. Include examples, nuances, and address potential counter-arguments.`,
    tags: ["detailed", "thorough"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "constraint",
    name: "Beginner-Friendly",
    description: "Explain in simple terms for beginners",
    content: `## Constraints\nExplain everything in simple, beginner-friendly terms. Avoid jargon and technical language, or if necessary, explain it thoroughly. Use metaphors and examples that someone with no background in the field would understand.`,
    tags: ["beginner", "simple"],
    createdAt: now,
    updatedAt: now,
  },

  // System blocks
  {
    id: uuidv4(),
    typeId: "system",
    name: "Use Markdown",
    description: "Format response using Markdown",
    content: `## Output Format\nFormat your entire response using Markdown. Use headings, lists, code blocks, and emphasis where appropriate to improve readability.`,
    tags: ["format", "markdown"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "system",
    name: "Include Tables",
    description: "Format data in Markdown tables",
    content: `## Output Format\nPresent comparative data in Markdown tables. Use proper column alignment and headers to organize information clearly.`,
    tags: ["format", "table"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: uuidv4(),
    typeId: "system",
    name: "Include Citations",
    description: "Include citations for factual claims",
    content: `## Output Format\nInclude citations for factual claims. For each important statement, add a reference to indicate the source of information. Acceptable forms include inline references or footnotes in a references section at the end.`,
    tags: ["format", "citations"],
    createdAt: now,
    updatedAt: now,
  },
];

// Helper function to get blocks by type
export const getBlocksByType = (typeId: string): Block[] => {
  return blocks.filter((block) => block.typeId === typeId);
};
