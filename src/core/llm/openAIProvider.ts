import { LLMProvider } from './llmProvider';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Class for interacting with OpenAI
 * @class OpenAIProvider
 * @extends LLMProvider
 */
export class OpenAIProvider extends LLMProvider {
  private apiKey: string;
  private fallbackModel: string = 'gpt-4o-mini';
  private logFilePath: string;

  /**
   * Constructor for OpenAI provider
   * @param apiKey - The OpenAI API key
   * @param model - Optional model to use (defaults to gpt-4o-mini)
   */
  constructor(apiKey: string, model?: string) {
    super();
    this.apiKey = apiKey;
    if (model) {
      this.fallbackModel = model;
    }
    
    // Create log file path with simple timestamp format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${month}-${date}-${hour}:${minutes}`;
    
    this.logFilePath = path.join(process.cwd(), 'logs', `openai-${timestamp}.log`);
    
    // Ensure logs directory exists
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Logs prompt and response to file
   * @param prompt - The input prompt
   * @param response - The response from OpenAI
   */
  private logInteraction(prompt: string, response: string): void {
    try {
      const logEntry = `prompt: ${prompt}\n\nresponse (${this.fallbackModel}): ${response}\n\n`;
      fs.appendFileSync(this.logFilePath, logEntry, 'utf8');
    } catch (error) {
      console.warn('⚠️ Failed to write to log file:', error);
    }
  }

  /**
   * Get a response from OpenAI using the Responses API
   * @param prompt - The input prompt to send to OpenAI
   * @returns A promise that resolves to OpenAI's response as a string
   */
  async getResponse(prompt: string): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.fallbackModel,
          input: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      
      const message = data.output?.find((item: any) => item.type === 'message');
      const textContent = message?.content?.find((content: any) => content.type === 'output_text');
      
      if (!textContent?.text) {
        throw new Error('No text response from OpenAI');
      }

      const responseText = textContent.text;
      
      // Log the interaction
      this.logInteraction(prompt, responseText);
      
      return responseText;
    } catch (error) {
      throw new Error(`Failed to get response from OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the current model name
   * @returns The model name being used
   */
  getModelName(): string {
    return this.fallbackModel;
  }
}
