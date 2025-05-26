/**
 * Abstract base class for LLM providers
 * Defines the interface that all LLM providers must implement
 */
export abstract class LLMProvider {
  /**
   * Get a response from the LLM provider
   * @param prompt - The input prompt to send to the LLM
   * @returns A promise that resolves to the LLM's response as a string
   */
  abstract getResponse(prompt: string): Promise<string>;
}
