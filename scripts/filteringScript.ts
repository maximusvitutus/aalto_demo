import * as path from 'path';
import { FeedFilteringService } from '../src/core/filtering/feedFilteringService';
import { OpenAIProvider } from '../src/core/llm/openAIProvider';
import { StudyFilterResult } from '../src/types/filtering/filteredStudy';
import { loadStudiesFromDirectories, saveResults, saveFeedSummaries, generateSummariesForFeed, loadStudiesFromDirectory } from './helpers/methods';
import { createExampleFeedConfigs, createCustomFeedConfig } from './helpers/consts';

// Load environment variables
import { config } from 'dotenv';
import { FeedConfig } from '../src/types/feeds/feedConfig';
config(); // load environment variables from .env file

// Configuration
const WRITING_MODEL = 'gpt-4.1';
const FILTERING_MODEL = 'gpt-4o';

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
 * Emits a progress signal that the server can capture
 */
function emitProgress(step: string, message: string): void {
  console.log(`PROGRESS: ${step} | ${message}`);
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

    // Initialize services with separate models
    console.log('🔧 Initializing services...');
    const filteringLLMProvider = new OpenAIProvider(apiKey, FILTERING_MODEL);
    const writingLLMProvider = new OpenAIProvider(apiKey, WRITING_MODEL);
    const filteringService = new FeedFilteringService(filteringLLMProvider);

    console.log(`📋 Using filtering model: ${filteringLLMProvider.getModelName()}`);
    console.log(`✍️  Using writing model: ${writingLLMProvider.getModelName()}`);

    // Create timestamp format
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${month}-${date}-${hour}:${minutes}`;

    // Check for custom input arguments FIRST
    const customIndex = process.argv.indexOf('--custom');
    let feedConfigs: FeedConfig[] = [];
    let studies: any[] = [];

    if (customIndex !== -1 && process.argv[customIndex + 1] && process.argv[customIndex + 2]) {
      // Custom mode: use only the custom feed and load all studies
      const readers = process.argv[customIndex + 1];
      const interests = process.argv[customIndex + 2];
      
      console.log('\n⚙️  Creating CUSTOM feed configuration...');
      console.log(`👥 Readers: ${readers}`);
      console.log(`🔬 Interests: ${interests}`);
      
      feedConfigs = [createCustomFeedConfig(readers, interests)];
      
      // PROGRESS: User profile created (AFTER creation)
      emitProgress('profile', `Profile created successfully!`);
      
      // Load studies from all directories for custom mode
      console.log('\n📖 Loading studies from all directories...');
      studies = loadStudiesFromDirectories(); // No targetDir argument = load all
      
      // PROGRESS: Loading studies completed (AFTER loading)
      emitProgress('loading', `Loaded ${studies.length} studies from database`);
    } else {
      // Default mode: use predefined feeds and check for directory argument
      console.log('\n⚙️  Creating PREDEFINED feed configurations...');
      feedConfigs = createExampleFeedConfigs();
      
      // Load studies based on command line arguments
      console.log('\n📖 Loading studies...');
      const targetDir = process.argv[2]; // Get the directory argument if provided
      studies = loadStudiesFromDirectories(targetDir);
      
      // PROGRESS: Loading studies completed (AFTER loading)
      emitProgress('loading', `Succesfully loaded ${studies.length} studies from database`);
    }
    
    if (studies.length === 0) {
      throw new Error('No studies found to process');
    }

    console.log(`Created ${feedConfigs.length} feed configurations`);

    // Initialize a map to store the accepted studies for each feed
    const acceptedStudiesPerFeed: Map<string, FilteringResult> = new Map();
    let totalFailedStudies = 0;

    // Process each feed
    for (const feedConfig of feedConfigs) {
      console.log(`\n🔍 Processing feed: ${feedConfig.category}`);
      console.log(`   Target: Top 3 studies (no threshold filtering)`);
      console.log(`   Studies to evaluate: ${studies.length}`);
      
      const startTime = Date.now();
      
      try {
        // Create progress callback for filtering updates
        const progressCallback = (processed: number, total: number) => {
          emitProgress('filtering', `Finding relevant studies for you...`);
        };
        
        // Use parallel filtering with controlled concurrency and progress updates
        const acceptedStudies = await filteringService.filterTop3StudiesForFeedParallelWithProgress(
          studies, 
          feedConfig, 
          100,
          progressCallback
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
        
        // PROGRESS: Filtering completed (AFTER filtering is done)
        emitProgress('filtering', `Selected top ${acceptedStudies.length} studies for your feed!`);
        
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
        console.log(`\n📄 Generating summaries...`);
        
        try {
          const summaries = await generateSummariesForFeed(
            result.relevantStudies,
            writingLLMProvider // Use the writing model for summaries
          );
          
          if (summaries.length > 0) {
            saveFeedSummaries(feedName, summaries, timestamp, writingLLMProvider.getModelName());
            console.log(`✅ Generated ${summaries.length} summaries for "${feedName}"`);
            
            // PROGRESS: Summaries completed
            emitProgress('summaries', `Generated ${summaries.length} summaries for your feed`);
          } else {
            console.log(`⚠️ No summaries generated for your feed`);
            // PROGRESS: Summaries completed even if none generated
            emitProgress('summaries', 'No summaries generated');
          }
          
        } catch (error) {
          console.error(`❌ Error generating summaries:`, error);
        }
      } else {
        console.log(`⏭️ Skipping summary generation (no relevant studies)`);
        // PROGRESS: Summaries completed (no relevant studies)
        emitProgress('summaries', 'No relevant studies found :(');
      }
    }

    // Save results
    console.log('\n💾 Saving filtering results...');
    const outputPath = path.join(process.cwd(), 'results', `results-${filteringLLMProvider.getModelName()}-${timestamp}.json`);
    
    // Create simplified results structure
    const simplifiedResults = Array.from(acceptedStudiesPerFeed.values()).map(result => ({
      feed: result.feed,
      totalStudiesProcessed: result.totalStudiesProcessed,
      relevantStudiesFound: result.relevantStudiesFound,
      relevantStudies: result.relevantStudies.map(studyResult => ({
        study: {
          title: studyResult.study.title
        },
        relevanceScore: studyResult.relevanceScore
      }))
    }));
    
    saveResults(simplifiedResults, outputPath);

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

    // Emit the complete results for the UI (only for custom feeds)
    if (customIndex !== -1) {
      const uiResults = Array.from(acceptedStudiesPerFeed.values()).flatMap(result => 
        result.relevantStudies.map(studyResult => ({
          title: studyResult.study.title,
          year: studyResult.study.publicationYear,          
          affinityScore: studyResult.relevanceScore.affinityScore,
          summary: null // Will be populated if summaries exist
        }))
      );

      // Add summaries if they were generated
      for (const [feedName, result] of acceptedStudiesPerFeed) {
        if (result.relevantStudiesFound > 0) {
          try {
            // Try to read the summary file that was just created
            const summaryPath = path.join(process.cwd(), 'results', 'summaries', `${feedName.replace(/[^a-zA-Z0-9]/g, '_')}-${writingLLMProvider.getModelName()}-${timestamp}.json`);
            if (require('fs').existsSync(summaryPath)) {
              const summaries = JSON.parse(require('fs').readFileSync(summaryPath, 'utf8'));
              
              // Match summaries to studies (assuming same order as relevantStudies)
              result.relevantStudies.forEach((studyResult, index) => {
                const uiResult = uiResults.find(r => r.title === studyResult.study.title);
                if (uiResult && summaries[index]) {
                  uiResult.summary = summaries[index];
                }
              });
            }
          } catch (error) {
            console.error('Error reading summaries for UI:', error);
          }
        }
      }

      // Sort by affinity score (highest first)
      uiResults.sort((a, b) => b.affinityScore - a.affinityScore);

      // Emit results for the UI
      console.log(`UI_RESULTS: ${JSON.stringify(uiResults)}`);
    }

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

export { runFilteringScript, loadStudiesFromDirectories, createExampleFeedConfigs as createFeedConfigs };