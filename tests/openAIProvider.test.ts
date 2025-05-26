import { OpenAIProvider } from '../src/core/llm/openAIProvider';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

/**
 * Test suite for OpenAI Provider
 */
async function runTests(): Promise<void> {
  console.log('🧪 Running OpenAI Provider Tests...\n');

  try {
    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in .env file');
    }

    // Test 1: Constructor
    console.log('✅ Test 1: Constructor');
    const provider = new OpenAIProvider(apiKey);
    console.log('   Provider created successfully\n');

    // Test 2: Constructor with custom model
    console.log('✅ Test 2: Constructor with custom model');
    const customProvider = new OpenAIProvider(apiKey, 'gpt-4o');
    console.log('   Provider with custom model created successfully\n');

    // Test 3: Basic response (this will make an actual API call)
    console.log('🔄 Test 3: Basic response (API call)');
    try {
      const response = await provider.getResponse('Say "Hello, test!" and nothing else.');
      console.log(`   Response received: "${response}"`);
      
      if (response && typeof response === 'string' && response.length > 0) {
        console.log('✅ Test 3: PASSED - Valid response received\n');
      } else {
        console.log('❌ Test 3: FAILED - Invalid response format\n');
      }
    } catch (error) {
      console.log(`❌ Test 3: FAILED - API call error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    // Test 4: Error handling with invalid API key
    console.log('✅ Test 4: Error handling');
    try {
      const invalidProvider = new OpenAIProvider('invalid-key');
      await invalidProvider.getResponse('Test');
      console.log('❌ Test 4: FAILED - Should have thrown an error\n');
    } catch (error) {
      console.log('   Error correctly thrown for invalid API key');
      console.log('✅ Test 4: PASSED - Error handling works\n');
    }

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test setup failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);

export { runTests }; 