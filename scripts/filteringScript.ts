import * as fs from 'fs';
import * as path from 'path';
import { FeedFilteringService } from '../src/core/filtering/feedFilteringService';
import { OpenAIProvider } from '../src/core/llm/openAIProvider';
import { ResearchStudyMetadata } from '../data/dataInterface';
import { FeedConfig } from '../src/types/feeds/feedConfig';
import { FilteredStudy } from '../src/types/filtering/filteredStudy';
import { jsonrepair } from 'jsonrepair';
import { ReportGenerationInput } from '../src/types/promptInputParams/reportGeneration';
import { ResearchSummary } from '../src/types/promptOutputParams/reportGeneration';
import { PromptLoader } from '../src/core/prompting/promptLoader';
import { z } from 'zod';

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
  feedConfig?: FeedConfig;
}

// Add Zod schema for parsing JSONL summaries
const ResearchSummarySchema = z.object({
  topic: z.string(),
  methodology: z.string(),
  findings: z.string(),
  implications: z.string()
});

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
      relevanceThreshold: 7
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
    }
/*     {
      category: "generative artificial intelligence (genAI)",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: GENAI_FEED_READERS,
      readerInterests: GENAI_FEED_INTERESTS,
      motivationForDistribution: DEMO_GENAI_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 6
    } */
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
 * Generates summaries for relevant studies using the report generation prompt
 */
async function generateSummariesForFeed(
  filteredStudies: FilteredStudy[],
  feedConfig: FeedConfig,
  llmProvider: OpenAIProvider
): Promise<ResearchSummary[]> {
  if (filteredStudies.length === 0) {
    return [];
  }

  console.log(`📝 Generating summaries for ${filteredStudies.length} relevant studies...`);

  const promptLoader = new PromptLoader();
  const template = promptLoader.loadTemplate('reportGeneration/demoReport.yaml');

  // Prepare abstracts
  const abstracts = filteredStudies.map(fs => fs.study.abstract);

  // Build the prompt
  const prompt = template
    .replace('{SUBSCRIPTION_CATEGORY}', feedConfig.category)
    .replace('{INTENDED_READERS}', feedConfig.intendedReaders.join(', '))
    .replace('{DISTRIBUTION_CHANNEL}', feedConfig.distributionChannel)
    .replace('{READER_INTERESTS}', feedConfig.readerInterests.join('\n'))
    .replace('{MOTIVATION_FOR_DISTRIBUTION}', feedConfig.motivationForDistribution)
    .replace('{WRITING_INSTRUCTIONS}', 'Focus on practical implications and actionable insights for the target audience.')
    .replace('{ABSTRACTS}', abstracts.map((abstract, i) => `${i + 1}. ${abstract}`).join('\n\n'));

  try {
    const response = await llmProvider.getResponse(prompt);
    return parseJSONLSummaries(response);
  } catch (error) {
    console.error('❌ Error generating summaries:', error);
    return [];
  }
}

/**
 * Parses JSONL response into ResearchSummary array
 */
function parseJSONLSummaries(response: string): ResearchSummary[] {
  const summaries: ResearchSummary[] = [];
  const lines = response.trim().split('\n');

  for (const line of lines) {
    if (line.trim()) {
      try {
        const jsonData = jsonrepair(line.trim());
        const parsedData = JSON.parse(jsonData);
        const result = ResearchSummarySchema.safeParse(parsedData);
        
        if (result.success) {
          summaries.push(result.data);
        } else {
          console.warn('⚠️ Invalid summary format:', result.error.issues);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse summary line:', line);
      }
    }
  }

  return summaries;
}

/**
 * Saves summaries for a specific feed to a JSON file
 */
function saveFeedSummaries(
  feedCategory: string,
  summaries: ResearchSummary[],
  timestamp: string
): void {
  const sanitizedCategory = feedCategory.replace(/[^a-zA-Z0-9]/g, '_');
  const outputPath = path.join(
    process.cwd(), 
    'results', 
    'summaries',
    `${sanitizedCategory}-summaries-${timestamp}.json`
  );
  
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(summaries, null, 2));
  console.log(`💾 Summaries saved to: ${outputPath}`);
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
        // Use parallel filtering with controlled concurrency
        const filteredStudies = await filteringService.filterStudiesForFeedParallel(
          studies, 
          feedConfig, 
          3 // Process 3 studies concurrently
        );
        
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

        // Generate and save summaries for the feed
        const summaries = await generateSummariesForFeed(filteredStudies, feedConfig, llmProvider);
        saveFeedSummaries(feedConfig.category, summaries, new Date().toISOString().replace(/[:.]/g, '-'));

      } catch (error) {
        console.error(`❌ Error processing feed "${feedConfig.category}":`, error);
        totalFailedStudies++;
      }
    }

    // Generate summaries for feeds with relevant studies
    console.log('\n📝 Generating summaries for relevant studies...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (const result of allResults) {
      if (result.relevantStudiesFound > 0) {
        console.log(`\n📄 Generating summaries for "${result.feed}" (${result.relevantStudiesFound} studies)`);
        
        try {
          const summaries = await generateSummariesForFeed(
            result.relevantStudies,
            result.feedConfig!,
            llmProvider
          );
          
          if (summaries.length > 0) {
            saveFeedSummaries(result.feed, summaries, timestamp);
            console.log(`✅ Generated ${summaries.length} summaries for "${result.feed}"`);
          } else {
            console.log(`⚠️ No summaries generated for "${result.feed}"`);
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 4000));
          
        } catch (error) {
          console.error(`❌ Error generating summaries for "${result.feed}":`, error);
        }
      } else {
        console.log(`⏭️ Skipping summary generation for "${result.feed}" (no relevant studies)`);
      }
    }

    // Save results
    console.log('\n💾 Saving filtering results...');
    const outputPath = path.join(process.cwd(), 'results', `filtering-results-${timestamp}.json`);
    saveResults(allResults, outputPath);

    // Print summary
    console.log('\n📈 SUMMARY:');
    console.log('=' .repeat(50));
    
    for (const result of allResults) {
      console.log(`✅ ${result.feed}: ${result.relevantStudiesFound}/${result.totalStudiesProcessed} studies (${Math.round((result.processingTimeMs ?? 0) / 1000)}s)`);
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