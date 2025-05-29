import { jsonrepair } from "jsonrepair";
import { ResearchStudyMetadata } from "../../data/dataInterface";
import * as fs from 'fs';
import * as path from 'path';
import { ResearchSummary } from '../../src/types/promptOutputParams/reportGeneration';
import { PromptLoader } from '../../src/core/prompting/promptLoader';
import { z } from 'zod';

// Add these imports at the top with the other imports
import * as readline from 'readline';

/**
 * Prompts the user for input using the CLI
 */
export async function getUserInput(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter the relevant identifier for the task: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Loads all JSON study files from the the specified directory path
 */
export function loadStudiesFromDirectory(directoryPath: string): ResearchStudyMetadata[] {
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


import { FeedConfig } from "../../src/types/feeds/feedConfig";
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
} from '../../src/core/feeds/demoInputs';

/**
 * Creates feed configurations from the demo inputs
 */
export function createFeedConfigs(): FeedConfig[] {
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
export function saveResults(results: any[], outputPath: string): void {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${outputPath}`);
}

import { StudyFilterResult } from '../../src/types/filtering/filteredStudy';
import { OpenAIProvider } from '../../src/core/llm/openAIProvider';

/**
 * Generates summaries for relevant studies using the report generation prompt
 */
export async function generateSummariesForFeed(
  filteredStudies: StudyFilterResult[],
  llmProvider: OpenAIProvider
): Promise<ResearchSummary[]> {
  if (filteredStudies.length === 0) {
    return [];
  }

  const promptLoader = new PromptLoader();
  const template = promptLoader.loadTemplate('reportGeneration/demoReport.yaml');

  // Prepare abstracts
  const abstracts = filteredStudies.map(fs => fs.study.abstract);

  // Build the prompt
  const prompt = template
    .replace('{ABSTRACTS}', abstracts.map((abstract, i) => `${i + 1}. ${abstract}`).join('\n\n'));

  try {
    const response = await llmProvider.getResponse(prompt);
    return parseJSONLSummaries(response);
  } catch (error) {
    console.error('❌ Error generating summaries:', error);
    return [];
  }
}

// Add Zod schema for parsing JSONL summaries
const ResearchSummarySchema = z.object({
  topic: z.string(),
  methodology: z.string(),
  findings: z.string(),
  implications: z.string()
});


/**
 * Parses JSONL response into ResearchSummary array
 */
export function parseJSONLSummaries(response: string): ResearchSummary[] {
  const summaries: ResearchSummary[] = [];
  
  // Remove markdown code blocks if present
  let cleanedResponse = response.trim();
  if (cleanedResponse.startsWith('```json')) {
    cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedResponse.startsWith('```')) {
    cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Try to parse as a single JSON object first (multi-line)
  try {
    const jsonData = jsonrepair(cleanedResponse);
    const parsedData = JSON.parse(jsonData);
    
    // If it's an array, process each item
    if (Array.isArray(parsedData)) {
      for (const item of parsedData) {
        const result = ResearchSummarySchema.safeParse(item);
        if (result.success) {
          summaries.push(result.data);
        }
      }
      return summaries;
    }
    
    // If it's a single object, validate and add it
    const result = ResearchSummarySchema.safeParse(parsedData);
    if (result.success) {
      summaries.push(result.data);
      return summaries;
    }
  } catch (error) {
    // If single JSON parsing fails, try JSONL format
  }
  
  // Fall back to JSONL parsing (one JSON per line)
  const lines = cleanedResponse.trim().split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('```')) {
      try {
        const jsonData = jsonrepair(trimmedLine);
        const parsedData = JSON.parse(jsonData);
        const result = ResearchSummarySchema.safeParse(parsedData);
        
        if (result.success) {
          summaries.push(result.data);
        } else {
          console.warn('⚠️ Invalid summary format:', result.error.issues);
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse summary line:', trimmedLine);
      }
    }
  }

  return summaries;
}

/**
 * Saves summaries for a specific feed to a JSON file
 */
export function saveFeedSummaries(
  feedCategory: string,
  summaries: ResearchSummary[],
  timestamp: string,
  model: string
): void {
  const sanitizedCategory = feedCategory.replace(/[^a-zA-Z0-9]/g, '_');
  const outputPath = path.join(
    process.cwd(), 
    'results', 
    'summaries',
    `${sanitizedCategory}-${model}-${timestamp}.json`
  );
  
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(summaries, null, 2));
  console.log(`💾 Summaries saved to: ${outputPath}`);
}
