import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { DataInterface } from '../../data/dataInterface';
import { OpenAIProvider } from '../core/llm/openAIProvider';
import * as yaml from 'js-yaml';

// Zod schema for validating OpenAI response
const DataInterfaceSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  abstract: z.string().min(10, "Abstract must be at least 10 characters"),
  authors: z.array(z.string().min(1, "Author name cannot be empty")).min(1, "Must have at least one author"),
  publicationYear: z.number().int().min(1900).max(new Date().getFullYear() + 5, "Publication year must be reasonable")
});

/**
 * Parses and validates OpenAI response using Zod
 * @param response - Raw response from OpenAI
 * @returns Validated DataInterface object
 */
function parseOpenAIResponse(response: string): DataInterface {
  try {
    // Try to parse as JSON
    const jsonResponse = JSON.parse(response);
    
    // Validate with Zod schema
    const result = DataInterfaceSchema.safeParse(jsonResponse);
    
    if (result.success) {
      return result.data;
    } else {
      console.error('❌ Zod validation failed:', result.error.issues);
      throw new Error(`Validation failed: ${result.error.issues.map(issue => issue.message).join(', ')}`);
    }
  } catch (parseError) {
    console.error('❌ JSON parsing failed:', parseError instanceof Error ? parseError.message : 'Unknown error');
    throw new Error('Failed to parse OpenAI response as JSON');
  }
}

/**
 * Class for processing and structuring input files
 */
export class AdHocDataSetter {
  private openAIProvider: OpenAIProvider;

  constructor(apiKey: string) {
    this.openAIProvider = new OpenAIProvider(apiKey, 'gpt-4o-mini');
  }
  
  /**
   * Processes all .txt files in the specified folder and creates corresponding JSON files
   * @param folderName - The folder name within the data directory to process
   */
  public async structureInputFiles(folderName: string): Promise<void> {
    const dataDir = path.join(process.cwd(), 'data', folderName);
    
    // Check if directory exists
    if (!fs.existsSync(dataDir)) {
      throw new Error(`[method: structureInputFiles] Directory not found: ${dataDir}`);
    }

    // Get all .txt files in the directory
    const files = fs.readdirSync(dataDir);
    const txtFiles = files.filter(file => file.endsWith('.txt'));

    console.log(`Found ${txtFiles.length} .txt files to process in ${folderName}/`);

    // Process each .txt file
    for (const txtFile of txtFiles) {
      try {
        const txtFilePath = path.join(dataDir, txtFile);
        const jsonFileName = txtFile.replace('.txt', '.json');
        const jsonFilePath = path.join(dataDir, jsonFileName);

        // Parse the .txt file using OpenAI
        const structuredData = await this.parseTxtFile(txtFilePath);
        
        // Save as JSON
        fs.writeFileSync(jsonFilePath, JSON.stringify(structuredData, null, 2));
        
        console.log(`✅ Created: ${jsonFilePath}`);
      } catch (error) {
        console.error(`❌ Error processing ${txtFile}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Parses a .txt file and extracts structured data using OpenAI
   * @param filePath - Path to the .txt file
   * @returns Structured data object
   */
  private async parseTxtFile(filePath: string): Promise<DataInterface> {
    const rawText = fs.readFileSync(filePath, 'utf8');
    
    // Load the prompt template
    const promptTemplate = this.loadPromptTemplate();
    
    // Create the prompt with the raw text
    const prompt = promptTemplate.replace('${rawText}', rawText);
    
    // Get response from OpenAI
    const response = await this.openAIProvider.getResponse(prompt);
    
    // Use Zod's robust parsing
    const extractedData = parseOpenAIResponse(response);
    
    console.log('✅ Successfully parsed and validated with Zod');
    return extractedData;
  }

  /**
   * Loads the YAML prompt template
   * @returns The formatted prompt string
   */
  private loadPromptTemplate(): string {
    const templatePath = path.join(process.cwd(), 'src', 'core', 'prompts', 'misc', 'extractStudyMetadata.yaml');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Prompt template not found: ${templatePath}`);
    }
    
    const yamlContent = fs.readFileSync(templatePath, 'utf8');
    const parsed = yaml.load(yamlContent) as { system_message: string; user_message: string };
    
    return `${parsed.system_message}\n\n${parsed.user_message}`;
  }
}