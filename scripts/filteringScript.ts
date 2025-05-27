import * as fs from 'fs';
import * as path from 'path';
import { FeedFilteringService } from '../src/core/filtering/feedFilteringService';
import { OpenAIProvider } from '../src/core/llm/openAIProvider';
import { ResearchStudyMetadata } from '../data/dataInterface';
import { FeedConfig } from '../src/types/feeds/feedConfig';
import { FilteredStudy } from '../src/types/filtering/filteredStudy';
import { jsonrepair } from 'jsonrepair';

// Load environment variables
import { config } from 'dotenv';
config(); // load environment variables from .env file

// Load demo constants for feed configurations
import {
  DEMO_DISTRIBUTION_CHANNEL,
  DEMO_SOCIAL_MEDIA_DISTRIBUTION_MOTIVE,
  DEMO_FUTURE_OF_SOCIETY_DISTRIBUTION_MOTIVE,
  DEMO_SPACE_EXPLORATION_DISTRIBUTION_MOTIVE,
  DEMO_GENAI_DISTRIBUTION_MOTIVE,
  SOCIAL_MEDIA_FEED_READERS,
  SOCIAL_MEDIA_FEED_INTERESTS,
  FUTURE_OF_SOCIETY_FEED_READERS,
  FUTURE_OF_SOCIETY_FEED_INTERESTS,
  SPACE_EXPLORATION_FEED_READERS,
  SPACE_EXPLORATION_FEED_INTERESTS,
  GENAI_FEED_READERS,
  GENAI_FEED_INTERESTS
} from '../src/core/feeds/demoInputs';

interface FilteringResult {
  feed: string;
  totalStudiesProcessed: number;
  relevantStudiesFound: number;
  relevantStudies: FilteredStudy[];
  processingTimeMs?: number;
  totalFailedStudies?: number;
}

/**
 * Loads all JSON study files from the socialNetworks directory
 */
function loadStudiesFromDirectory(directoryPath: string): ResearchStudyMetadata[] {
  const studies: ResearchStudyMetadata[] = [];
  
  if (!fs.existsSync(directoryPath)) {
    throw new Error(`Directory not found: ${directoryPath}`);
  }

  const files = fs.readdirSync(directoryPath);
  const jsonFiles = files.filter(file => file.endsWith('.json'));

  console.log(`📚 Loading ${jsonFiles.length} studies from ${directoryPath}`);

  for (const jsonFile of jsonFiles) {
    try {
      const filePath = path.join(directoryPath, jsonFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const repairedJson = jsonrepair(fileContent);
      const study = JSON.parse(repairedJson) as ResearchStudyMetadata;
      
      // Validate that the study has required fields
      if (study.title && study.abstract && study.authors && study.publicationYear) {
        studies.push(study);
        console.log(`✅ Loaded: ${study.title}`);
      } else {
        console.warn(`⚠️  Skipping ${jsonFile}: Missing required fields`);
      }
    } catch (error) {
      console.error(`❌ Error loading ${jsonFile}:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return studies;
}

/**
 * Creates feed configurations from the demo inputs
 */
function createFeedConfigs(): FeedConfig[] {
  return [
    {
      category: "social media & human behaviour",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: SOCIAL_MEDIA_FEED_READERS,
      readerInterests: SOCIAL_MEDIA_FEED_INTERESTS,
      motivationForDistribution: DEMO_SOCIAL_MEDIA_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 6
    },
    {
      category: "future of society",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: FUTURE_OF_SOCIETY_FEED_READERS,
      readerInterests: FUTURE_OF_SOCIETY_FEED_INTERESTS,
      motivationForDistribution: DEMO_FUTURE_OF_SOCIETY_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 6
    },
    {
      category: "space exploration",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: SPACE_EXPLORATION_FEED_READERS,
      readerInterests: SPACE_EXPLORATION_FEED_INTERESTS,
      motivationForDistribution: DEMO_SPACE_EXPLORATION_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 6
    },
    {
      category: "generative artificial intelligence (genAI)",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: GENAI_FEED_READERS,
      readerInterests: GENAI_FEED_INTERESTS,
      motivationForDistribution: DEMO_GENAI_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 6
    }
  ];
}

/**
 * Saves filtering results to a JSON file
 */
function saveResults(results: any[], outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${outputPath}`);
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
    const llmProvider = new OpenAIProvider(apiKey);
    const filteringService = new FeedFilteringService(llmProvider);

    // Load studies
    console.log('\n📖 Loading studies...');
    const studiesPath = path.join(process.cwd(), 'data', 'socialNetworks');
    const studies = loadStudiesFromDirectory(studiesPath);
    
    if (studies.length === 0) {
      throw new Error('No studies found to process');
    }

    // Create feed configurations
    console.log('\n⚙️  Creating feed configurations...');
    const feedConfigs = createFeedConfigs();
    console.log(`Created ${feedConfigs.length} feed configurations`);

    // Process each feed
    const allResults: FilteringResult[] = [];
    let totalFailedStudies = 0;

    for (const feedConfig of feedConfigs) {
      console.log(`\n🔍 Processing feed: ${feedConfig.category}`);
      console.log(`   Threshold: ${feedConfig.relevanceThreshold}`);
      console.log(`   Studies to evaluate: ${studies.length}`);
      
      const startTime = Date.now();
      
      try {
        const filteredStudies = await filteringService.filterStudiesForFeed(studies, feedConfig);
        const processingTime = Date.now() - startTime;
        
        const result = {
          feed: feedConfig.category,
          feedConfig,
          totalStudiesProcessed: studies.length,
          relevantStudiesFound: filteredStudies.length,
          relevantStudies: filteredStudies,
          processingTimeMs: processingTime,
          totalFailedStudies: totalFailedStudies,
        };

        allResults.push(result);

        console.log(`✅ Feed "${feedConfig.category}" completed:`);
        console.log(`   📊 Found ${filteredStudies.length}/${studies.length} relevant studies`);
        console.log(`   ⏱️  Processing time: ${Math.round(processingTime / 1000)}s`);
        
        if (filteredStudies.length > 0) {
          console.log(`   🏆 Top study: "${filteredStudies[0].study.title}" (score: ${filteredStudies[0].relevanceScore.affinityScore})`);
        }

      } catch (error) {
        console.error(`❌ Error processing feed "${feedConfig.category}":`, error);
        totalFailedStudies++;
      }
    }

    // Save results
    console.log('\n💾 Saving results...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(process.cwd(), 'results', `filtering-results-${timestamp}.json`);
    saveResults(allResults, outputPath);

    // Print summary
    console.log('\n📈 SUMMARY:');
    console.log('=' .repeat(50));
    
    for (const result of allResults) {
      console.log(`✅ ${result.feed}: ${result.relevantStudiesFound}/${result.totalStudiesProcessed} studies (${Math.round(result.processingTimeMs ?? -1 / 1000)}s)`);
    }

    const totalRelevant = allResults.reduce((sum, r) => sum + (r.relevantStudiesFound || 0), 0);
    const totalProcessed = allResults.reduce((sum, r) => sum + (r.totalStudiesProcessed || 0), 0);
    
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

export { runFilteringScript, loadStudiesFromDirectory, createFeedConfigs };
