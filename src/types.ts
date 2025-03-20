// Centralized types for the application
export interface Prompt {
  id: string;
  name: string;
  content: string;
  createdAt?: number;
  updatedAt?: number;

}


export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: string;
}