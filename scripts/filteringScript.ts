import * as path from 'path';
import { FeedFilteringService } from '../src/core/filtering/feedFilteringService';
import { OpenAIProvider } from '../src/core/llm/openAIProvider';
import { StudyFilterResult } from '../src/types/filtering/filteredStudy';
import { loadStudiesFromDirectories, saveResults, saveFeedSummaries, generateSummariesForFeed, loadStudiesFromDirectory } from './helpers/methods';
import { createFeedConfigs } from './helpers/consts';

// Load environment variables
import { config } from 'dotenv';
config(); // load environment variables from .env file

// Configuration
const MODEL_TO_USE = 'gpt-4.1'; // Change this to use a different model

/**
 * Result of the filtering process for a feed.
 * 
 * @property {string} feed - The name of the feed.
 * @property {number} totalStudiesProcessed - The total number of studies processed.
 * @property {number} relevantStudiesFound - The number of relevant studies found.
 * @property {StudyFilterResult[]} relevantStudies - The relevant studies found.
 * @property {number} processingTimeMs - The processing time in milliseconds.
 * @property {number} totalFailedStudies - The total number of failed studies.
 * @property {FeedConfig} feedConfig - The configuration of the feed.
 */
interface FilteringResult {
  feed: string;
  totalStudiesProcessed: number;
  relevantStudiesFound: number;
  relevantStudies: StudyFilterResult[];
  processingTimeMs?: number;
  totalFailedStudies?: number;
}

/**
 * Main filtering script
 */
async function runFilteringScript(): Promise<void> {
  try {
    console.log('🚀 Starting filtering script...\n');

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    // Initialize services
    console.log('🔧 Initializing services...');
    const llmProvider = new OpenAIProvider(apiKey, MODEL_TO_USE);
    const filteringService = new FeedFilteringService(llmProvider);

    console.log(`📋 Using model: ${llmProvider.getModelName()}`);

    // Create timestamp format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${month}-${date}-${hour}:${minutes}`;

    // Load studies based on command line arguments
    console.log('\n📖 Loading studies...');
    const targetDir = process.argv[2]; // Get the directory argument if provided
    const studies = loadStudiesFromDirectories(targetDir);
    
    if (studies.length === 0) {
      throw new Error('No studies found to process');
    }

    // Create feed configurations
    console.log('\n⚙️  Creating feed configurations...');
    const feedConfigs = createFeedConfigs();
    console.log(`Created ${feedConfigs.length} feed configurations`);

    // Initialize a map to store the accepted studies for each feed
    const acceptedStudiesPerFeed: Map<string, FilteringResult> = new Map();
    let totalFailedStudies = 0;

    // Process each feed
    for (const feedConfig of feedConfigs) {
      console.log(`\n🔍 Processing feed: ${feedConfig.category}`);
      console.log(`   Threshold: ${feedConfig.relevanceThreshold}`);
      console.log(`   Studies to evaluate: ${studies.length}`);
      
      const startTime = Date.now();
      
      try {
        // Use parallel filtering with controlled concurrency
        const acceptedStudies = await filteringService.filterStudiesForFeedParallel(
          studies, 
          feedConfig, 
          3 // Process 3 studies concurrently
        );
        
        const processingTime = Date.now() - startTime;
        
        const result = {
          feed: feedConfig.category,
          totalStudiesProcessed: studies.length,
          relevantStudiesFound: acceptedStudies.length,
          relevantStudies: acceptedStudies,
          processingTimeMs: processingTime,
          totalFailedStudies: totalFailedStudies,
        };

        acceptedStudiesPerFeed.set(feedConfig.category, result);

        console.log(`✅ Feed "${feedConfig.category}" completed:`);
        console.log(`   📊 Found ${acceptedStudies.length}/${studies.length} relevant studies`);
        console.log(`   ⏱️  Processing time: ${Math.round(processingTime / 1000)}s`);
        
        if (acceptedStudies.length > 0) {
          console.log(`   🏆 Top study: "${acceptedStudies[0].study.title}" (score: ${acceptedStudies[0].relevanceScore.affinityScore})`);
        }
      } catch (error) {
        console.error(`❌ Error processing feed "${feedConfig.category}":`, error);
        totalFailedStudies++;
      }
    }

    // Generate summaries for feeds with relevant studies
    for (const [feedName, result] of acceptedStudiesPerFeed) {
      if (result.relevantStudiesFound > 0) {
        console.log(`\n📄 Generating summaries for "${feedName}" (${result.relevantStudiesFound} studies)`);
        
        try {
          const summaries = await generateSummariesForFeed(
            result.relevantStudies,
            llmProvider
          );
          
          if (summaries.length > 0) {
            saveFeedSummaries(feedName, summaries, timestamp, llmProvider.getModelName());
            console.log(`✅ Generated ${summaries.length} summaries for "${feedName}"`);
          } else {
            console.log(`⚠️ No summaries generated for "${feedName}"`);
          }
          
        } catch (error) {
          console.error(`❌ Error generating summaries for "${result.feed}":`, error);
        }
      } else {
        console.log(`⏭️ Skipping summary generation for "${result.feed}" (no relevant studies)`);
      }
    }

    // Save results
    console.log('\n💾 Saving filtering results...');
    const outputPath = path.join(process.cwd(), 'results', `results-${llmProvider.getModelName()}-${timestamp}.json`);
    saveResults(Array.from(acceptedStudiesPerFeed.values()), outputPath);

    // Print summary
    console.log('\n📈 SUMMARY:');
    console.log('=' .repeat(50));
    
    for (const [feedName, result] of acceptedStudiesPerFeed) {
      console.log(`✅ ${feedName}: ${result.relevantStudiesFound}/${result.totalStudiesProcessed} studies (${Math.round((result.processingTimeMs ?? 0) / 1000)}s)`);
    }

    const totalRelevant = Array.from(acceptedStudiesPerFeed.values()).reduce((sum, r) => sum + (r.relevantStudiesFound || 0), 0);
    const totalProcessed = Array.from(acceptedStudiesPerFeed.values()).reduce((sum, r) => sum + (r.totalStudiesProcessed || 0), 0);
    
    console.log('=' .repeat(50));
    console.log(`🎯 Overall: ${totalRelevant}/${totalProcessed} total relevant matches found`);
    console.log(`📁 Results saved to: ${outputPath}`);

  } catch (error) {
    console.error('💥 Script failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  runFilteringScript()
    .then(() => {
      console.log('\n🎉 Filtering script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Filtering script failed:', error);
      process.exit(1);
    });
}

export { runFilteringScript, loadStudiesFromDirectories, createFeedConfigs };