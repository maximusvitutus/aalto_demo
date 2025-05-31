import { AdHocDataSetter } from '../src/utils/adHocDataSetter';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Script to extract data from .txt files and convert to JSON using OpenAI
 */
async function main(): Promise<void> {
  console.log('🚀 Starting data extraction to JSON...\n');

  try {
    // Get API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables. Please check your .env file.');
    }

    // Create AdHocDataSetter instance
    const dataSetter = new AdHocDataSetter(apiKey);

    // Get folder name from command line arguments or use default
    const folderName = process.argv[2];
    
    console.log(`📁 Processing folder: data/studies/${folderName}/`);
    console.log('🤖 Using OpenAI GPT-4o-mini for extraction...\n');

    // Process the files
    await dataSetter.structureInputFiles(folderName);

    console.log('\n✨ Data extraction completed successfully!');

  } catch (error) {
    console.error('❌ Error during data extraction:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
