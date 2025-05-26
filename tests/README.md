# OpenAI Provider Tests

## Setup

1. Create a `.env` file in the project root with your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

2. Make sure you have a valid OpenAI API key with sufficient credits.

## Running Tests

### Using Node.js directly:
```bash
npx tsx tests/openAIProvider.test.ts
```

### Using ts-node:
```bash
npx ts-node tests/openAIProvider.test.ts
```

## Test Coverage

The test suite includes:

1. **Constructor Test** - Verifies the provider can be instantiated
2. **Custom Model Test** - Tests constructor with custom model parameter
3. **API Call Test** - Makes an actual API call to verify functionality
4. **Error Handling Test** - Tests behavior with invalid API key

## Notes

- Test 3 makes a real API call and will consume OpenAI credits
- The test uses a simple prompt to minimize token usage
- Error handling is tested with an invalid API key 