import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface PromptTemplate {
  system_message: string;
  user_message: string;
}

/**
 * Loads prompt templates from the prompts directory.
 */
export class PromptLoader {
  private templateCache: Map<string, string> = new Map();
  private promptsBasePath: string;

  constructor() {
    this.promptsBasePath = path.join(process.cwd(), 'src', 'core', 'prompting', 'prompts');
  }

  /**
   * Loads a YAML prompt template and returns the combined system + user message
   * @param templatePath - Relative path to the template (e.g., 'scoring/subscriptionBased.yaml')
   * @returns The formatted prompt string ready for LLM consumption
   */
  loadTemplate(templatePath: string): string {
    // Check cache first
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const fullPath = path.join(this.promptsBasePath, templatePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Prompt template not found: ${fullPath}`);
    }

    try {
      const yamlContent = fs.readFileSync(fullPath, 'utf8');
      const parsed = yaml.load(yamlContent) as PromptTemplate;
      
      if (!parsed.system_message || !parsed.user_message) {
        throw new Error(`Invalid template format in ${templatePath}. Expected 'system_message' and 'user_message' fields.`);
      }

      // Combine system and user messages
      const combinedPrompt = `${parsed.system_message}\n\n${parsed.user_message}`;
      
      // Cache the result
      this.templateCache.set(templatePath, combinedPrompt);
      
      return combinedPrompt;
    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        throw new Error(`Failed to parse YAML template ${templatePath}: ${error.message}`);
      }
      throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Loads a template and returns the parsed YAML object (for more complex use cases)
   * @param templatePath - Relative path to the template
   * @returns The parsed YAML object
   */
  loadTemplateObject(templatePath: string): PromptTemplate {
    const fullPath = path.join(this.promptsBasePath, templatePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Prompt template not found: ${fullPath}`);
    }

    try {
      const yamlContent = fs.readFileSync(fullPath, 'utf8');
      const parsed = yaml.load(yamlContent) as PromptTemplate;
      
      if (!parsed.system_message || !parsed.user_message) {
        throw new Error(`Invalid template format in ${templatePath}. Expected 'system_message' and 'user_message' fields.`);
      }

      return parsed;
    } catch (error) {
      if (error instanceof yaml.YAMLException) {
        throw new Error(`Failed to parse YAML template ${templatePath}: ${error.message}`);
      }
      throw new Error(`Failed to load template ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clears the template cache (useful for development/testing)
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Lists all available templates in the prompts directory
   * @returns Array of template paths
   */
  listAvailableTemplates(): string[] {
    const templates: string[] = [];
    
    const scanDirectory = (dirPath: string, relativePath: string = ''): void => {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const fullItemPath = path.join(dirPath, item);
        const relativeItemPath = path.join(relativePath, item);
        
        if (fs.statSync(fullItemPath).isDirectory()) {
          scanDirectory(fullItemPath, relativeItemPath);
        } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
          templates.push(relativeItemPath);
        }
      }
    };

    scanDirectory(this.promptsBasePath);
    return templates;
  }

  /**
   * Validates that a template has the required structure
   * @param templatePath - Path to the template to validate
   * @returns True if valid, throws error if invalid
   */
  validateTemplate(templatePath: string): boolean {
    try {
      const template = this.loadTemplateObject(templatePath);
      
      // Check required fields
      if (!template.system_message || typeof template.system_message !== 'string') {
        throw new Error('Missing or invalid system_message field');
      }
      
      if (!template.user_message || typeof template.user_message !== 'string') {
        throw new Error('Missing or invalid user_message field');
      }

      // Check for placeholder variables in user_message
      const placeholders = template.user_message.match(/\{[A-Z_]+\}/g);
      if (placeholders) {
        console.log(`Template ${templatePath} contains placeholders:`, placeholders);
      }

      return true;
    } catch (error) {
      throw new Error(`Template validation failed for ${templatePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}