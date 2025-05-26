import { LLMProvider } from './llmProvider';

/**
 * Class for interacting with OpenAI
 * @class OpenAIProvider
 * @extends LLMProvider
 */
export class OpenAIProvider extends LLMProvider {
  private apiKey: string;
  private fallbackModel: string = 'gpt-4o-mini';

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

      return textContent.text;
    } catch (error) {
      throw new Error(`Failed to get response from OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
