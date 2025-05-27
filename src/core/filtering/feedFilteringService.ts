import { z } from 'zod';
import { ResearchStudyMetadata } from '../../../data/dataInterface';
import { OpenAIProvider } from '../llm/openAIProvider';
import { FilteredStudy } from '../../types/filtering/filteredStudy';
import { FeedConfig } from '../../types/feeds/feedConfig';
import { AffinityScore } from '../../types/filtering/affinityScore';
import { PromptLoader } from '../prompting/promptLoader';
import { jsonrepair } from 'jsonrepair';

// Zod schema for LLM response validation
const AffinityScoreSchema = z.object({
  reasoning: z.string().min(10, "Reasoning must be detailed"),
  affinityScore: z.number().min(0).max(10),
  affinityExplanation: z.string().min(10, "Explanation must be detailed")
});

/**
 * Service for filtering studies based on relevance to a specific feed configuration
 */
export class FeedFilteringService {
  private llmProvider: OpenAIProvider;
  private promptLoader: PromptLoader;
  private defaultThreshold: number = 7;

  constructor(llmProvider: OpenAIProvider) {
    this.llmProvider = llmProvider;
    this.promptLoader = new PromptLoader();
  }

  /**
   * Filters studies based on relevance to a specific feed configuration
   */
  async filterStudiesForFeed(
    studies: ResearchStudyMetadata[], 
    feedConfig: FeedConfig
  ): Promise<FilteredStudy[]> {
    const threshold = feedConfig.relevanceThreshold ?? this.defaultThreshold;
    const filteredStudies: FilteredStudy[] = [];

    console.log(`🔍 Filtering ${studies.length} studies for feed: ${feedConfig.category}`);

    for (const study of studies) {
      try {
        const relevanceScore = await this.scoreStudyRelevance(study, feedConfig);
        
        if (relevanceScore.affinityScore >= threshold) {
          filteredStudies.push({
            study,
            relevanceScore,
            feedCategory: feedConfig.category,
            feedConfig
          });
        }

        // Add small delay to avoid rate limiting
        await this.delay(100);
      } catch (error) {
        console.error(`❌ Error scoring study "${study.title}":`, error);
      }
    }

    // Sort by relevance score (highest first)
    filteredStudies.sort((a, b) => b.relevanceScore.affinityScore - a.relevanceScore.affinityScore);

    console.log(`✅ Found ${filteredStudies.length} relevant studies (threshold: ${threshold})`);
    return filteredStudies;
  }

  /**
   * Scores a single study's relevance to a feed configuration
   */
  private async scoreStudyRelevance(
    study: ResearchStudyMetadata, 
    feedConfig: FeedConfig
  ): Promise<AffinityScore> {
    const prompt = this.buildScoringPrompt(study, feedConfig);
    const response = await this.llmProvider.getResponse(prompt);
    
    return this.parseAffinityScore(response);
  }

  /**
   * Builds the scoring prompt using the template
   */
  private buildScoringPrompt(study: ResearchStudyMetadata, feedConfig: FeedConfig): string {
    const template = this.promptLoader.loadTemplate('scoring/subscriptionBased.yaml');
    
    return template
      .replace('{ABSTRACT}', study.abstract)
      .replace('{SUBSCRIPTION_CATEGORY}', feedConfig.category)
      .replace('{DISTRIBUTION_CHANNEL}', feedConfig.distributionChannel)
      .replace('{INTENDED_READERS}', feedConfig.intendedReaders.join('\n'))
      .replace('{READER_INTERESTS}', feedConfig.readerInterests.join('\n'))
      .replace('{MOTIVATION_FOR_DISTRIBUTION}', feedConfig.motivationForDistribution);
  }

  /**
   * Parses and validates LLM response using Zod
   */
  private parseAffinityScore(response: string): AffinityScore {
    try {
      const jsonResponse = jsonrepair(response);
      const parsedResponse = JSON.parse(jsonResponse);
      const result = AffinityScoreSchema.safeParse(parsedResponse);
      
      if (result.success) {
        return result.data;
      } else {
        console.error('❌ Relevance score validation failed:', result.error.issues);
        throw new Error(`Validation failed: ${result.error.issues.map(issue => issue.message).join(', ')}`);
      }
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      throw new Error('Failed to parse relevance score response');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}