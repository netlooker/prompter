# Template System

## Overview

The Template System allows users to combine multiple blocks into reusable templates, with support for placeholder blocks that can be filled in later. Templates can represent common prompt frameworks (like RACE, CARE, TAG) or custom workflows created by users. The system provides a way to organize and streamline complex prompting patterns, making it easier to create consistent, high-quality prompts.

## Key Components

### 1. Template Data Models

#### Template Model
```typescript
export interface Template {
  id: string;                 // UUID
  name: string;               // Display name
  description: string;        // Purpose of this template
  blocks: TemplateBlock[];    // Array of blocks with positioning info
  icon: string;               // Icon from lucide-react
  created: number;            // Creation timestamp
  updated: number;            // Last modified timestamp
  is_system: boolean;         // Whether it's a built-in template
  tags: string[];             // Optional tags for categorization
  usage_count: number;        // Number of times used
  last_used: number;          // Last usage timestamp
}

export interface TemplateBlock {
  id: string;                 // UUID
  templateId: string;         // Reference to parent template
  blockId: string | null;     // Reference to a block or null for placeholder
  position: number;           // Order in the template
  isPlaceholder: boolean;     // Whether this is a placeholder to be filled
  placeholderName: string;    // Name for the placeholder if applicable
  placeholderDescription: string; // Description of what should go in this placeholder
  placeholderTypeId: string | null; // Suggested block type for the placeholder
}
```

### 2. Template Repository

```typescript
export interface TemplateRepository {
  // Basic CRUD operations
  getTemplate(id: string): Promise<Template | null>;
  getTemplates(): Promise<Template[]>;
  getTemplatesByTag(tag: string): Promise<Template[]>;
  saveTemplate(template: Template): Promise<string>;
  deleteTemplate(id: string): Promise<void>;
  
  // Template-specific operations
  getTemplateBlocks(templateId: string): Promise<TemplateBlock[]>;
  getPopulatedTemplate(templateId: string): Promise<PopulatedTemplate>;
  incrementTemplateUsage(id: string): Promise<void>;
  
  // Predefined templates
  getSystemTemplates(): Promise<Template[]>;
  createFrameworkTemplate(framework: string, name: string, description: string): Promise<Template>;
}

export interface PopulatedTemplate extends Template {
  blocks: PopulatedTemplateBlock[];
}

export interface PopulatedTemplateBlock extends TemplateBlock {
  block: Block | null;  // The actual block data, or null for placeholders
}
```

### 3. Template Service

```typescript
export class TemplateService {
  private templateRepository: TemplateRepository;
  private blockRepository: BlockRepository;
  private eventService: EventService;
  
  constructor(
    templateRepository: TemplateRepository,
    blockRepository: BlockRepository,
    eventService: EventService
  ) {
    this.templateRepository = templateRepository;
    this.blockRepository = blockRepository;
    this.eventService = eventService;
  }
  
  // Get a single template by ID
  async getTemplate(id: string): Promise<Template | null> {
    return this.templateRepository.getTemplate(id);
  }
  
  // Get all templates
  async getTemplates(): Promise<Template[]> {
    return this.templateRepository.getTemplates();
  }
  
  // Get populated template with actual block content
  async getPopulatedTemplate(id: string): Promise<PopulatedTemplate | null> {
    return this.templateRepository.getPopulatedTemplate(id);
  }
  
  // Save a template (create or update)
  async saveTemplate(template: Partial<Template>, blocks: TemplateBlock[]): Promise<string> {
    const now = Date.now();
    const isNew = !template.id;
    
    const completeTemplate: Template = {
      id: template.id || crypto.randomUUID(),
      name: template.name || 'Untitled Template',
      description: template.description || '',
      blocks: [],  // Will be populated separately
      icon: template.icon || 'template',
      created: isNew ? now : (template.created || now),
      updated: now,
      is_system: template.is_system || false,
      tags: template.tags || [],
      usage_count: template.usage_count || 0,
      last_used: template.last_used || 0
    };
    
    // Save the template first
    const templateId = await this.templateRepository.saveTemplate(completeTemplate);
    
    // Ensure all blocks have the correct templateId
    const updatedBlocks = blocks.map((block, index) => ({
      ...block,
      templateId,
      position: index,
      id: block.id || crypto.randomUUID()
    }));
    
    // Save the template blocks
    for (const block of updatedBlocks) {
      await this.saveTemplateBlock(block);
    }
    
    // Publish event
    this.eventService.publish(
      isNew ? 'template:created' : 'template:updated',
      { templateId }
    );
    
    return templateId;
  }
  
  // Save a template block
  async saveTemplateBlock(block: TemplateBlock): Promise<string> {
    // Implementation would depend on the storage mechanism
    // For our IndexedDB implementation, we would use a separate table
    return block.id;
  }
  
  // Delete a template
  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.deleteTemplate(id);
    this.eventService.publish('template:deleted', { templateId: id });
  }
  
  // Get template content ready for insertion
  async getTemplateContent(id: string, fillPlaceholders: boolean = false): Promise<string> {
    const template = await this.getPopulatedTemplate(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }
    
    // Track usage
    await this.incrementTemplateUsage(id);
    
    // Build the content
    const content = [];
    
    for (const templateBlock of template.blocks) {
      if (!templateBlock.isPlaceholder && templateBlock.block) {
        // Regular block
        content.push(templateBlock.block.content);
      } else if (fillPlaceholders) {
        // Placeholder - add a marker
        content.push(this.createPlaceholderMarker(templateBlock));
      }
      
      // Add a newline between blocks
      if (content.length > 0) {
        content.push('');
      }
    }
    
    return content.join('\n');
  }
  
  // Create a placeholder marker for the editor
  private createPlaceholderMarker(placeholder: TemplateBlock): string {
    return `[[ ${placeholder.placeholderName || 'PLACEHOLDER'} - ${placeholder.placeholderDescription || 'Fill this in'} ]]`;
  }
  
  // Increment usage count
  async incrementTemplateUsage(id: string): Promise<void> {
    await this.templateRepository.incrementTemplateUsage(id);
  }
  
  // Create a template from a prompt framework
  async createFrameworkTemplate(framework: string, name: string, description: string): Promise<Template> {
    return this.templateRepository.createFrameworkTemplate(framework, name, description);
  }
  
  // Get system provided templates
  async getSystemTemplates(): Promise<Template[]> {
    return this.templateRepository.getSystemTemplates();
  }
  
  // Create a new template from existing blocks
  async createTemplateFromBlocks(
    name: string,
    description: string,
    blockIds: string[],
    placeholders: { index: number, name: string, description: string, typeId: string | null }[] = []
  ): Promise<Template> {
    // Get all blocks
    const blocks = await Promise.all(
      blockIds.map(id => this.blockRepository.getBlock(id))
    );
    
    // Create template blocks
    const templateBlocks: TemplateBlock[] = blocks.map((block, index) => {
      const placeholder = placeholders.find(p => p.index === index);
      
      if (placeholder) {
        // This is a placeholder
        return {
          id: crypto.randomUUID(),
          templateId: '',  // Will be set by saveTemplate
          blockId: null,
          position: index,
          isPlaceholder: true,
          placeholderName: placeholder.name,
          placeholderDescription: placeholder.description,
          placeholderTypeId: placeholder.typeId
        };
      } else if (block) {
        // This is a regular block
        return {
          id: crypto.randomUUID(),
          templateId: '',  // Will be set by saveTemplate
          blockId: block.id,
          position: index,
          isPlaceholder: false,
          placeholderName: '',
          placeholderDescription: '',
          placeholderTypeId: null
        };
      } else {
        throw new Error(`Block not found at index ${index}`);
      }
    });
    
    // Create and save the template
    const templateId = await this.saveTemplate(
      {
        name,
        description,
        icon: 'template',
        is_system: false
      },
      templateBlocks
    );
    
    // Return the created template
    return this.getTemplate(templateId) as Promise<Template>;
  }
}
```

### 4. Template Builder Component

```tsx
interface TemplateBuilderProps {
  initialTemplate?: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  initialTemplate,
  onSave,
  onCancel
}) => {
  const [template, setTemplate] = useState<Partial<Template>>({
    name: initialTemplate?.name || '',
    description: initialTemplate?.description || '',
    icon: initialTemplate?.icon || 'template',
    tags: initialTemplate?.tags || []
  });
  
  const [blocks, setBlocks] = useState<TemplateBlockItem[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  
  // Services
  const blockService = useBlockService();
  const templateService = useTemplateService();
  
  // Load initial template blocks
  useEffect(() => {
    if (initialTemplate) {
      loadTemplateBlocks(initialTemplate.id);
    }
  }, [initialTemplate]);
  
  // Load template blocks
  const loadTemplateBlocks = async (templateId: string) => {
    setIsLoadingBlocks(true);
    
    try {
      const populated = await templateService.getPopulatedTemplate(templateId);
      
      if (populated) {
        setBlocks(
          populated.blocks.map(block => ({
            id: block.id,
            templateId: block.templateId,
            blockId: block.blockId,
            position: block.position,
            isPlaceholder: block.isPlaceholder,
            placeholderName: block.placeholderName,
            placeholderDescription: block.placeholderDescription,
            placeholderTypeId: block.placeholderTypeId,
            block: block.block
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load template blocks:', error);
      // Show error toast
    } finally {
      setIsLoadingBlocks(false);
    }
  };
  
  // Handle template details change
  const handleTemplateChange = (field: keyof Template, value: any) => {
    setTemplate(prev => ({ ...prev, [field]: value }));
  };
  
  // Add a block to the template
  const handleAddBlock = (block: Block) => {
    setBlocks(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        templateId: initialTemplate?.id || '',
        blockId: block.id,
        position: prev.length,
        isPlaceholder: false,
        placeholderName: '',
        placeholderDescription: '',
        placeholderTypeId: null,
        block
      }
    ]);
  };
  
  // Add a placeholder to the template
  const handleAddPlaceholder = (name: string, description: string, typeId: string | null) => {
    setBlocks(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        templateId: initialTemplate?.id || '',
        blockId: null,
        position: prev.length,
        isPlaceholder: true,
        placeholderName: name,
        placeholderDescription: description,
        placeholderTypeId: typeId,
        block: null
      }
    ]);
  };
  
  // Remove a block from the template
  const handleRemoveBlock = (index: number) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks.splice(index, 1);
      
      // Update positions
      return newBlocks.map((block, idx) => ({
        ...block,
        position: idx
      }));
    });
  };
  
  // Move a block up in the template
  const handleMoveBlockUp = (index: number) => {
    if (index === 0) return;
    
    setBlocks(prev => {
      const newBlocks = [...prev];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index - 1];
      newBlocks[index - 1] = temp;
      
      // Update positions
      return newBlocks.map((block, idx) => ({
        ...block,
        position: idx
      }));
    });
  };
  
  // Move a block down in the template
  const handleMoveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    
    setBlocks(prev => {
      const newBlocks = [...prev];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index + 1];
      newBlocks[index + 1] = temp;
      
      // Update positions
      return newBlocks.map((block, idx) => ({
        ...block,
        position: idx
      }));
    });
  };
  
  // Convert a block to a placeholder
  const handleConvertToPlaceholder = (index: number) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const block = newBlocks[index];
      
      // Get the block type if we have a block
      const typeId = block.block?.typeId || null;
      
      newBlocks[index] = {
        ...block,
        isPlaceholder: true,
        blockId: null,
        placeholderName: block.block?.name || 'Placeholder',
        placeholderDescription: `Add ${block.block?.name || 'content'} here`,
        placeholderTypeId: typeId,
        block: null
      };
      
      return newBlocks;
    });
  };
  
  // Convert a placeholder to a block
  const handleConvertToBlock = async (index: number, blockId: string) => {
    try {
      const block = await blockService.getBlock(blockId);
      
      if (block) {
        setBlocks(prev => {
          const newBlocks = [...prev];
          newBlocks[index] = {
            ...newBlocks[index],
            isPlaceholder: false,
            blockId: block.id,
            block
          };
          return newBlocks;
        });
      }
    } catch (error) {
      console.error('Failed to get block:', error);
      // Show error toast
    }
  };
  
  // Edit placeholder details
  const handleEditPlaceholder = (index: number, name: string, description: string, typeId: string | null) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = {
        ...newBlocks[index],
        placeholderName: name,
        placeholderDescription: description,
        placeholderTypeId: typeId
      };
      return newBlocks;
    });
  };
  
  // Save the template
  const handleSave = async () => {
    if (!template.name) {
      // Show validation error
      return;
    }
    
    try {
      // Convert to template blocks
      const templateBlocks: TemplateBlock[] = blocks.map(block => ({
        id: block.id,
        templateId: initialTemplate?.id || '',
        blockId: block.blockId,
        position: block.position,
        isPlaceholder: block.isPlaceholder,
        placeholderName: block.placeholderName,
        placeholderDescription: block.placeholderDescription,
        placeholderTypeId: block.placeholderTypeId
      }));
      
      // Save the template
      const templateId = await templateService.saveTemplate(
        {
          ...template,
          id: initialTemplate?.id
        },
        templateBlocks
      );
      
      // Get the saved template
      const savedTemplate = await templateService.getTemplate(templateId);
      
      if (savedTemplate) {
        onSave(savedTemplate);
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      // Show error toast
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Template details */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <IconPicker
              value={template.icon || ''}
              onChange={(icon) => handleTemplateChange('icon', icon)}
            />
          </div>
          
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Template Name"
              value={template.name || ''}
              onChange={(e) => handleTemplateChange('name', e.target.value)}
            />
            
            <Textarea
              placeholder="Template Description"
              value={template.description || ''}
              onChange={(e) => handleTemplateChange('description', e.target.value)}
              rows={2}
            />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            Tags
          </label>
          <TagInput
            value={template.tags || []}
            onChange={(tags) => handleTemplateChange('tags', tags)}
          />
        </div>
      </div>
      
      {/* Template blocks */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Template Blocks</h3>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open modal to add a placeholder
                // This would typically open a modal component
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Placeholder
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open modal to select a block
                // This would typically open a modal component
              }}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Block
            </Button>
          </div>
        </div>
        
        {isLoadingBlocks ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400 mb-2">
              No blocks added yet
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Add blocks or placeholders to create your template
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open modal to add a placeholder
                }}
              >
                Add Placeholder
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open modal to select a block
                }}
              >
                Add Block
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block, index) => (
              <TemplateBlockItem
                key={block.id}
                block={block}
                index={index}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                onRemove={() => handleRemoveBlock(index)}
                onMoveUp={() => handleMoveBlockUp(index)}
                onMoveDown={() => handleMoveBlockDown(index)}
                onConvertToPlaceholder={() => handleConvertToPlaceholder(index)}
                onConvertToBlock={(blockId) => handleConvertToBlock(index, blockId)}
                onEditPlaceholder={(name, description, typeId) => 
                  handleEditPlaceholder(index, name, description, typeId)
                }
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <Button variant="primary" onClick={handleSave}>
          {initialTemplate ? 'Save Template' : 'Create Template'}
        </Button>
      </div>
    </div>
  );
};
```

### 5. Template Block Item Component

```tsx
interface TemplateBlockItemProps {
  block: TemplateBlockItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onConvertToPlaceholder: () => void;
  onConvertToBlock: (blockId: string) => void;
  onEditPlaceholder: (name: string, description: string, typeId: string | null) => void;
}

const TemplateBlockItem: React.FC<TemplateBlockItemProps> = ({
  block,
  index,
  isFirst,
  isLast,
  onRemove,
  onMoveUp,
  onMoveDown,
  onConvertToPlaceholder,
  onConvertToBlock,
  onEditPlaceholder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // State for editing
  const [name, setName] = useState(block.placeholderName);
  const [description, setDescription] = useState(block.placeholderDescription);
  const [typeId, setTypeId] = useState<string | null>(block.placeholderTypeId);
  
  // Services
  const { blockTypes } = useBlockTypes();
  
  // Reset form when changing block
  useEffect(() => {
    setName(block.placeholderName);
    setDescription(block.placeholderDescription);
    setTypeId(block.placeholderTypeId);
  }, [block]);
  
  // Save changes
  const handleSave = () => {
    onEditPlaceholder(name, description, typeId);
    setIsEditing(false);
  };
  
  return (
    <div className={`border rounded-lg p-3 ${
      block.isPlaceholder 
        ? 'border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      {block.isPlaceholder ? (
        // Placeholder
        isEditing ? (
          // Editing placeholder
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Edit Placeholder</h4>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={() => setIsEditing(false)}
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <Input
                placeholder="Placeholder Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              
              <Textarea
                placeholder="Placeholder Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
              
              <Select
                value={typeId || ''}
                onChange={(value) => setTypeId(value || null)}
              >
                <option value="">No specific type</option>
                {blockTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </Select>
              
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Displaying placeholder
          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FolderOpenIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                
                <div>
                  <h4 className="font-medium">{block.placeholderName || 'Placeholder'}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {block.placeholderDescription || 'Add content here'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  title="Edit placeholder"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // Open block selector modal
                    // This would open a component to select a block
                  }}
                  title="Convert to block"
                >
                  <ReplaceIcon className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  title="Remove placeholder"
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {block.placeholderTypeId && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Suggested type:</span>{' '}
                {blockTypes.find(type => type.id === block.placeholderTypeId)?.name || 'Unknown type'}
              </div>
            )}
          </div>
        )
      ) : (
        // Regular block
        <div>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Icon name={block.block?.icon || 'file-text'} className="w-4 h-4" />
              </div>
              
              <div>
                <h4 className="font-medium">{block.block?.name || 'Block'}</h4>
                {block.block?.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {block.block.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onConvertToPlaceholder}
                title="Convert to placeholder"
              >
                <ReplaceDottedIcon className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onRemove}
                title="Remove block"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded-md max-h-24 overflow-y-auto">
            {block.block?.content?.substring(0, 150) || 'No content'}
            {(block.block?.content?.length || 0) > 150 ? '...' : ''}
          </div>
        </div>
      )}
      
      {/* Reordering controls */}
      <div className="flex items-center justify-center mt-3 space-x-2">
        <Button
          variant="ghost"
          size="icon"
          disabled={isFirst}
          onClick={onMoveUp}
          title="Move up"
        >
          <ArrowUpIcon className="w-4 h-4" />
        </Button>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {index + 1}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          disabled={isLast}
          onClick={onMoveDown}
          title="Move down"
        >
          <ArrowDownIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
```

### 6. Template Inserter Component

```tsx
interface TemplateInserterProps {
  onInsert: (content: string) => void;
  onClose: () => void;
}

const TemplateInserter: React.FC<TemplateInserterProps> = ({ onInsert, onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'list' | 'preview'>('list');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'custom'>('all');
  
  // Services
  const templateService = useTemplateService();
  
  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);
  
  // Load templates
  const loadTemplates = async () => {
    setIsLoading(true);
    
    try {
      const allTemplates = await templateService.getTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter templates based on query and active tab
  const filteredTemplates = useMemo(() => {
    let filtered = [...templates];
    
    // Filter by tab
    if (activeTab === 'system') {
      filtered = filtered.filter(template => template.is_system);
    } else if (activeTab === 'custom') {
      filtered = filtered.filter(template => !template.is_system);
    }
    
    // Filter by query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(lowerQuery) ||
        template.description.toLowerCase().includes(lowerQuery) ||
        (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
    }
    
    return filtered;
  }, [templates, query, activeTab]);
  
  // Select a template
  const handleSelectTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    setCurrentSection('preview');
  };
  
  // Insert template
  const handleInsertTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      const content = await templateService.getTemplateContent(selectedTemplate.id, true);
      onInsert(content);
      onClose();
    } catch (error) {
      console.error('Failed to get template content:', error);
      // Show error toast
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {currentSection === 'list' ? 'Choose a Template' : 'Template Preview'}
          </h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <XIcon className="w-5 h-5" />
          </Button>
        </div>
        
        {currentSection === 'list' ? (
          <>
            {/* Search and tabs */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="mb-3">
                <SearchInput
                  value={query}
                  onChange={setQuery}
                  placeholder="Search templates..."
                />
              </div>
              
              <div className="flex space-x-1">
                <TabButton
                  active={activeTab === 'all'}
                  onClick={() => setActiveTab('all')}
                >
                  All Templates
                </TabButton>
                
                <TabButton
                  active={activeTab === 'system'}
                  onClick={() => setActiveTab('system')}
                >
                  Framework Templates
                </TabButton>
                
                <TabButton
                  active={activeTab === 'custom'}
                  onClick={() => setActiveTab('custom')}
                >
                  My Templates
                </TabButton>
              </div>
            </div>
            
            {/* Template list */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Spinner size="lg" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                  <FileIcon className="w-8 h-8 mb-2" />
                  <p>No matching templates found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onClick={() => handleSelectTemplate(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Template preview */}
            <div className="flex-1 overflow-auto p-4">
              {selectedTemplate && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Icon name={selectedTemplate.icon || 'template'} className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium">{selectedTemplate.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>
                  
                  <TemplatePreview templateId={selectedTemplate.id} />
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentSection('list')}
              >
                <ArrowLeftIcon className="w-4 h-4 mr-1" />
                Back to List
              </Button>
              
              <Button
                variant="primary"
                onClick={handleInsertTemplate}
              >
                Insert Template
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Template preview component
const TemplatePreview: React.FC<{ templateId: string }> = ({ templateId }) => {
  const [template, setTemplate] = useState<PopulatedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Services
  const templateService = useTemplateService();
  
  // Load template
  useEffect(() => {
    loadTemplate();
  }, [templateId]);
  
  // Load template
  const loadTemplate = async () => {
    setIsLoading(true);
    
    try {
      const populated = await templateService.getPopulatedTemplate(templateId);
      setTemplate(populated);
    } catch (error) {
      console.error('Failed to load template:', error);
      // Show error toast
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        Template not found
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase">
        Template Structure
      </div>
      
      <div className="space-y-2">
        {template.blocks.map((block, index) => (
          <div 
            key={block.id}
            className={`p-3 rounded-lg ${
              block.isPlaceholder
                ? 'bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              
              {block.isPlaceholder ? (
                <div className="font-medium">
                  {block.placeholderName || 'Placeholder'}
                </div>
              ) : (
                <div className="font-medium">
                  {block.block?.name || 'Block'}
                </div>
              )}
            </div>
            
            {block.isPlaceholder ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 ml-7">
                {block.placeholderDescription || 'Fill this in'}
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded ml-7 max-h-20 overflow-y-auto">
                {block.block?.content?.substring(0, 100) || 'No content'}
                {(block.block?.content?.length || 0) > 100 ? '...' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 7. Template Card Component

```tsx
interface TemplateCardProps {
  template: Template;
  onClick: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <div 
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Icon name={template.icon || 'template'} className="w-5 h-5" />
        </div>
        
        <div>
          <h3 className="font-medium">{template.name}</h3>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <span className={template.is_system ? 'text-blue-500 dark:text-blue-400' : ''}>
              {template.is_system ? 'Framework Template' : 'Custom Template'}
            </span>
            
            <span className="mx-1">•</span>
            
            <span>
              Used {template.usage_count || 0} times
            </span>
          </div>
        </div>
      </div>
      
      {template.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
          {template.description}
        </p>
      )}
      
      {template.tags && template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {template.tags.map(tag => (
            <span 
              key={tag} 
              className="px-1.5 py-0.5 text-xs rounded bg-gray-200 dark:bg-gray-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Implementation Steps

### Step 1: Implement the Template Data Models

```typescript
// src/models/template.ts
export interface Template {
  id: string;
  name: string;
  description: string;
  blocks: TemplateBlock[];
  icon: string;
  created: number;
  updated: number;
  is_system: boolean;
  tags: string[];
  usage_count: number;
  last_used: number;
}

export interface TemplateBlock {
  id: string;
  templateId: string;
  blockId: string | null;
  position: number;
  isPlaceholder: boolean;
  placeholderName: string;
  placeholderDescription: string;
  placeholderTypeId: string | null;
}

export interface PopulatedTemplate extends Template {
  blocks: PopulatedTemplateBlock[];
}

export interface PopulatedTemplateBlock extends TemplateBlock {
  block: Block | null;
}

export interface TemplateBlockItem extends TemplateBlock {
  block: Block | null;
}
```

### Step 2: Create IndexedDB Storage for Templates

```typescript
// src/services/template-repository.ts
export class IndexedDBTemplateRepository implements TemplateRepository {
  private db: Dexie;
  
  constructor() {
    this.db = new Dexie('PromptBlocksDB');
    
    this.db.version(1).stores({
      templates: 'id, name, created, updated, is_system, *tags',
      templateBlocks: 'id, templateId, blockId, position, isPlaceholder'
    });
  }
  
  async getTemplate(id: string): Promise<Template | null> {
    const template = await this.db.table('templates').get(id);
    
    if (!template) {
      return null;
    }
    
    const blocks = await this.getTemplateBlocks(id);
    
    return {
      ...template,
      blocks
    };
  }
  
  async getTemplates(): Promise<Template[]> {
    const templates = await this.db.table('templates').toArray();
    
    // Sort by updated timestamp
    return templates.sort((a, b) => b.updated - a.updated);
  }
  
  async getTemplatesByTag(tag: string): Promise<Template[]> {
    const templates = await this.db.table('templates')
      .where('tags')
      .equals(tag)
      .toArray();
    
    return templates.sort((a, b) => b.updated - a.updated);
  }
  
  async saveTemplate(template: Template): Promise<string> {
    await this.db.table('templates').put({
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      created: template.created,
      updated: template.updated,
      is_system: template.is_system,
      tags: template.tags,
      usage_count: template.usage_count,
      last_used: template.last_used
    });
    
    return template.id;
  }
  
  async deleteTemplate(id: string): Promise<void> {
    // Delete the template
    await this.db.table('templates').delete(id);
    
    // Delete all template blocks
    await this.db.table('templateBlocks')
      .where('templateId')
      .equals(id)
      .delete();
  }
  
  async getTemplateBlocks(templateId: string): Promise<TemplateBlock[]> {
    const blocks = await this.db.table('templateBlocks')
      .where('templateId')
      .equals(templateId)
      .toArray();
    
    // Sort by position
    return blocks.sort((a, b) => a.position - b.position);
  }
  
  async getPopulatedTemplate(templateId: string): Promise<PopulatedTemplate> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    const blocks = await this.getTemplateBlocks(templateId);
    const blockIds = blocks
      .filter(block => !block.isPlaceholder && block.blockId)
      .map(block => block.blockId as string);
    
    // Get all blocks in one query
    const blockMap = new Map<string, Block>();
    
    if (blockIds.length > 0) {
      const blockService = await import('./block-service').then(m => m.blockService);
      const blockData = await Promise.all(
        blockIds.map(id => blockService.getBlock(id))
      );
      
      blockData.forEach(block => {
        if (block) {
          blockMap.set(block.id, block);
        }
      });
    }
    
    // Create populated template
    const populatedBlocks: PopulatedTemplateBlock[] = blocks.map(block => ({
      ...block,
      block: block.blockId ? blockMap.get(block.blockId) || null : null
    }));
    
    return {
      ...template,
      blocks: populatedBlocks
    };
  }
  
  async incrementTemplateUsage(id: string): Promise<void> {
    const template = await this.db.table('templates').get(id);
    
    if (template) {
      await this.db.table('templates').update(id, {
        usage_count: (template.usage_count || 0) + 1,
        last_used: Date.now()
      });
    }
  }
  
  async getSystemTemplates(): Promise<Template[]> {
    const templates = await this.db.table('templates')
      .where('is_system')
      .equals(1)
      .toArray();
    
    return templates.sort((a, b) => b.updated - a.updated);
  }
  
  async createFrameworkTemplate(framework: string, name: string, description: string): Promise<Template> {
    // Implementation depends on the framework
    // Here we'll implement RACE as an example
    
    if (framework === 'RACE') {
      const blockService = await import('./block-service').then(m => m.blockService);
      
      // Create template
      const templateId = crypto.randomUUID();
      const now = Date.now();
      
      const template: Template = {
        id: templateId,
        name: name || 'RACE Framework',
        description: description || 'Role, Action, Context, Expectations framework',
        blocks: [],
        icon: 'layout-template',
        created: now,
        updated: now,
        is_system: true,
        tags: ['framework', 'race'],
        usage_count: 0,
        last_used: 0
      };
      
      await this.saveTemplate(template);
      
      // Create template blocks with placeholders
      const blocks: TemplateBlock[] = [
        {
          id: crypto.randomUUID(),
          templateId,
          blockId: null,
          position: 0,
          isPlaceholder: true,
          placeholderName: 'Role Setting',
          placeholderDescription: 'Define who the AI should act as',
          placeholderTypeId: 'role-setting'
        },
        {
          id: crypto.randomUUID(),
          templateId,
          blockId: null,
          position: 1,
          isPlaceholder: true,
          placeholderName: 'Action',
          placeholderDescription: 'Specify what needs to be done and how',
          placeholderTypeId: 'action'
        },
        {
          id: crypto.randomUUID(),
          templateId,
          blockId: null,
          position: 2,
          isPlaceholder: true,
          placeholderName: 'Context',
          placeholderDescription: 'Provide background information',
          placeholderTypeId: 'context'
        },
        {
          id: crypto.randomUUID(),
          templateId,
          blockId: null,
          position: 3,
          isPlaceholder: true,
          placeholderName: 'Expectations',
          placeholderDescription: 'Define the desired output format and success criteria',
          placeholderTypeId: 'output-format'
        }
      ];
      
      // Save template blocks
      for (const block of blocks) {
        await this.db.table('templateBlocks').add(block);
      }
      
      return {
        ...template,
        blocks
      };
    }
    
    // Implement other frameworks similarly...
    
    throw new Error(`Unknown framework: ${framework}`);
  }
}
```

### Step 3: Implement Template System Initialization

```typescript
// src/services/template-system.ts
export async function initializeTemplateSystem(): Promise<void> {
  const templateRepository = new IndexedDBTemplateRepository();
  
  // Check if we have any system templates
  const systemTemplates = await templateRepository.getSystemTemplates();
  
  if (systemTemplates.length === 0) {
    // Create default framework templates
    await templateRepository.createFrameworkTemplate('RACE', 'RACE Framework', 'Role, Action, Context, Expectations framework');
    await templateRepository.createFrameworkTemplate('CARE', 'CARE Framework', 'Context, Action, Result, Examples framework');
    await templateRepository.createFrameworkTemplate('TAG', 'TAG Framework', 'Task, Action, Goal framework');
  }
}
```

### Step 4: Create Template Editor Component

```tsx
// src/components/template/TemplateEditor.tsx
export const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
  // Implementation as shown in TemplateBuilder component
  
  return (
    <Dialog open={true} onClose={onCancel} className="max-w-3xl">
      <DialogTitle>
        {template ? 'Edit Template' : 'Create New Template'}
      </DialogTitle>
      
      <DialogContent>
        <TemplateBuilder
          initialTemplate={template}
          onSave={onSave}
          onCancel={onCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
```

### Step 5: Implement Template Placeholder Resolution

```typescript
// src/components/template/TemplatePlaceholderResolver.tsx
interface TemplatePlaceholderResolverProps {
  template: PopulatedTemplate;
  onComplete: (filledTemplate: string) => void;
  onCancel: () => void;
}

const TemplatePlaceholderResolver: React.FC<TemplatePlaceholderResolverProps> = ({
  template,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [filledBlocks, setFilledBlocks] = useState<Record<string, string>>({});
  
  // Get placeholders
  const placeholders = useMemo(() => {
    return template.blocks
      .filter(block => block.isPlaceholder)
      .map((block, index) => ({
        index,
        block
      }));
  }, [template]);
  
  // Current placeholder
  const currentPlaceholder = placeholders[currentStep];
  
  // Check if we have any placeholders
  useEffect(() => {
    if (placeholders.length === 0) {
      // No placeholders, just complete with the template content
      generateFinalContent();
    }
  }, [placeholders]);
  
  // Set content for current placeholder
  const setPlaceholderContent = (content: string) => {
    setFilledBlocks(prev => ({
      ...prev,
      [currentPlaceholder.block.id]: content
    }));
    
    // Move to next step
    if (currentStep < placeholders.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step, complete
      generateFinalContent();
    }
  };
  
  // Generate final content
  const generateFinalContent = () => {
    let content = '';
    
    for (const block of template.blocks) {
      if (block.isPlaceholder) {
        content += filledBlocks[block.id] || `[[ ${block.placeholderName} ]]`;
      } else if (block.block) {
        content += block.block.content;
      }
      
      content += '\n\n';
    }
    
    onComplete(content.trim());
  };
  
  if (!currentPlaceholder) {
    return null;
  }
  
  return (
    <Dialog open={true} onClose={onCancel} className="max-w-2xl">
      <DialogTitle>
        Fill Template: {template.name}
      </DialogTitle>
      
      <DialogContent>
        <div className="mb-4">
          <ProgressIndicator
            steps={placeholders.length}
            currentStep={currentStep}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">
              {currentPlaceholder.block.placeholderName || 'Placeholder'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {currentPlaceholder.block.placeholderDescription || 'Fill in this section'}
            </p>
          </div>
          
          {currentPlaceholder.block.placeholderTypeId && (
            <BlockSelector
              typeId={currentPlaceholder.block.placeholderTypeId}
              onSelectBlock={(block) => setPlaceholderContent(block.content)}
            />
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Custom Content
            </label>
            <Textarea
              rows={8}
              placeholder="Enter your content here..."
              onChange={(e) => setPlaceholderContent(e.target.value)}
            />
          </div>
        </div>
      </DialogContent>
      
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep(prev => prev - 1);
            }
          }}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={() => setPlaceholderContent('')}
        >
          {currentStep === placeholders.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};
```

### Step 6: Integrate with Editor

```tsx
// Integration in Editor component
export const Editor: React.FC<EditorProps> = (props) => {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  // Handle inserting template
  const handleInsertTemplate = (content: string) => {
    // Insert content at cursor
    if (props.onInsertText) {
      props.onInsertText(content);
    }
    
    // Close modal
    setIsTemplateModalOpen(false);
  };
  
  return (
    <div className="relative h-full">
      {/* Editor implementation */}
      
      {/* Template button */}
      <Button
        className="absolute bottom-4 right-4"
        onClick={() => setIsTemplateModalOpen(true)}
      >
        <TemplateIcon className="w-4 h-4 mr-1" />
        Templates
      </Button>
      
      {/* Template modal */}
      {isTemplateModalOpen && (
        <TemplateInserter
          onInsert={handleInsertTemplate}
          onClose={() => setIsTemplateModalOpen(false)}
        />
      )}
    </div>
  );
};
```

## Testing

### Unit Tests for Template Service

```typescript
describe('TemplateService', () => {
  let templateService: TemplateService;
  let mockTemplateRepository: TemplateRepository;
  let mockBlockRepository: BlockRepository;
  let mockEventService: EventService;
  
  beforeEach(() => {
    // Mock dependencies
    mockTemplateRepository = {
      getTemplate: jest.fn(),
      getTemplates: jest.fn(),
      getTemplatesByTag: jest.fn(),
      saveTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      getTemplateBlocks: jest.fn(),
      getPopulatedTemplate: jest.fn(),
      incrementTemplateUsage: jest.fn(),
      getSystemTemplates: jest.fn(),
      createFrameworkTemplate: jest.fn()
    } as unknown as TemplateRepository;
    
    mockBlockRepository = {
      getBlock: jest.fn()
    } as unknown as BlockRepository;
    
    mockEventService = {
      publish: jest.fn(),
      subscribe: jest.fn()
    } as unknown as EventService;
    
    templateService = new TemplateService(
      mockTemplateRepository,
      mockBlockRepository,
      mockEventService
    );
  });
  
  test('getTemplateContent should return content with placeholders', async () => {
    // Arrange
    const templateId = 'test-template';
    const template: PopulatedTemplate = {
      id: templateId,
      name: 'Test Template',
      description: 'Test Description',
      blocks: [
        {
          id: 'block-1',
          templateId,
          blockId: 'test-block-1',
          position: 0,
          isPlaceholder: false,
          placeholderName: '',
          placeholderDescription: '',
          placeholderTypeId: null,
          block: {
            id: 'test-block-1',
            content: 'Block 1 content',
            // Other block properties...
          } as Block
        },
        {
          id: 'block-2',
          templateId,
          blockId: null,
          position: 1,
          isPlaceholder: true,
          placeholderName: 'Test Placeholder',
          placeholderDescription: 'Fill this in',
          placeholderTypeId: 'role-setting',
          block: null
        }
      ],
      // Other template properties...
    } as PopulatedTemplate;
    
    (mockTemplateRepository.getPopulatedTemplate as jest.Mock).mockResolvedValue(template);
    
    // Act
    const content = await templateService.getTemplateContent(templateId, true);
    
    // Assert
    expect(content).toContain('Block 1 content');
    expect(content).toContain('[[ Test Placeholder - Fill this in ]]');
    expect(mockTemplateRepository.incrementTemplateUsage).toHaveBeenCalledWith(templateId);
  });
  
  test('createTemplateFromBlocks should create a template from blocks', async () => {
    // Arrange
    const name = 'Test Template';
    const description = 'Test Description';
    const blockIds = ['block-1', 'block-2'];
    const blocks = [
      { id: 'block-1', content: 'Block 1 content' },
      { id: 'block-2', content: 'Block 2 content' }
    ] as Block[];
    
    (mockBlockRepository.getBlock as jest.Mock)
      .mockResolvedValueOnce(blocks[0])
      .mockResolvedValueOnce(blocks[1]);
    
    (mockTemplateRepository.saveTemplate as jest.Mock).mockResolvedValue('new-template-id');
    
    const expectedTemplate = {
      id: 'new-template-id',
      name,
      description
    };
    
    (mockTemplateRepository.getTemplate as jest.Mock).mockResolvedValue(expectedTemplate);
    
    // Act
    const result = await templateService.createTemplateFromBlocks(name, description, blockIds);
    
    // Assert
    expect(result).toEqual(expectedTemplate);
    expect(mockTemplateRepository.saveTemplate).toHaveBeenCalled();
    expect(mockEventService.publish).toHaveBeenCalledWith('template:created', { templateId: 'new-template-id' });
  });
  
  // More tests...
});
```

### Integration Tests for Template Components

```typescript
describe('TemplateBuilder', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders empty state when no template is provided', () => {
    render(
      <TemplateBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('No blocks added yet')).toBeInTheDocument();
    expect(screen.getByText('Template Name')).toHaveValue('');
    expect(screen.getByText('Template Description')).toHaveValue('');
  });
  
  test('adds a block to the template', async () => {
    // Mock services
    const mockBlock = { id: 'block-1', name: 'Test Block', content: 'Test content' } as Block;
    const mockBlockService = {
      getBlock: jest.fn().mockResolvedValue(mockBlock)
    };
    
    jest.mock('../hooks/useBlockService', () => ({
      useBlockService: () => mockBlockService
    }));
    
    render(
      <TemplateBuilder
        onSave={mockOnSave}
        onCancel={mockOnCancel}
      />
    );
    
    // Click add block button
    fireEvent.click(screen.getByText('Add Block'));
    
    // Select a block (this would typically open a modal)
    // For this test, we'll directly call the handler
    const instance = screen.getByTestId('template-builder');
    const handleAddBlock = instance.props.handleAddBlock;
    
    handleAddBlock(mockBlock);
    
    // Check if block is added
    await waitFor(() => {
      expect(screen.getByText('Test Block')).toBeInTheDocument();
    });
  });
  
  // More tests...
});
```

## Integration with Other Components

### How the Template System is Used

- **Core Data Layer**: Stores templates and relationships with blocks
- **Search & Discovery Engine**: Enables searching for templates
- **Command Palette**: Can include templates as quick-access items
- **Block Explorer**: Provides a way to select blocks for templates
- **Editor Integration**: Allows inserting templates with placeholders
- **Sidebar Panel**: Can include a templates section for quick access

### Key Relationships

1. **Block Repository → Template System**: Templates reference blocks by ID
2. **Template System → Editor**: Templates are inserted into the editor
3. **Command Palette → Template System**: Templates can be accessed from the palette
4. **Sidebar Panel → Template System**: Templates can be listed in the sidebar

## Implementation Considerations

1. **Performance**: 
   - Optimize template loading for large collections
   - Use memoization for template previews
   - Implement efficient placeholder resolution

2. **User Experience**:
   - Make template creation intuitive
   - Provide clear visual cues for placeholders
   - Make drag-and-drop block ordering feel natural
   - Provide good defaults for common prompt frameworks

3. **Offline Support**:
   - Ensure templates work without internet connection
   - Implement robust local storage for templates
   - Provide export/import functionality for templates

4. **Flexibility vs. Simplicity**:
   - Balance flexibility (complex templates) with ease of use
   - Start with simple templates and add complexity as needed
   - Consider progressive disclosure for advanced features

5. **Error Handling**:
   - Handle missing blocks in templates gracefully
   - Provide clear error messages when templates fail to load
   - Implement auto-save for template edits