import { FeedConfig } from "../../src/types/feeds/feedConfig";

// Load demo constants for feed configurations
import {
  DEMO_DISTRIBUTION_CHANNEL,
  DEMO_SOCIAL_MEDIA_DISTRIBUTION_MOTIVE,
  DEMO_FUTURE_OF_SOCIETY_DISTRIBUTION_MOTIVE,
  DEMO_SPACE_EXPLORATION_DISTRIBUTION_MOTIVE,
  DEMO_GENAI_DISTRIBUTION_MOTIVE,
  DEMO_NOKIA_DISTRIBUTION_MOTIVE,
  SOCIAL_MEDIA_FEED_READERS,
  SOCIAL_MEDIA_FEED_INTERESTS,
  FUTURE_OF_SOCIETY_FEED_READERS,
  FUTURE_OF_SOCIETY_FEED_INTERESTS,
  SPACE_EXPLORATION_FEED_READERS,
  SPACE_EXPLORATION_FEED_INTERESTS,
  GENAI_FEED_READERS,
  GENAI_FEED_INTERESTS,
  NOKIA_FEED_READERS,
  NOKIA_FEED_INTERESTS
} from '../../src/core/feeds/demoInputs';

/**
 * Creates a custom feed configuration
 * @param readers - The readers for the custom feed
 * @param interests - The interests for the custom feed
 * @returns A custom feed configuration
 */
export function createCustomFeedConfig(readers: string, interests: string): FeedConfig {
  return {
    category: "Custom User Feed",
    distributionChannel: "Weekly email and social media posts",
    intendedReaders: [readers],
    readerInterests: interests.split(',').map(i => i.trim()),
    motivationForDistribution: "Personalized research feed based on user interests",
    relevanceThreshold: 8
  };
}

/**
 * Creates feed configurations from the demo inputs
 */
export function createExampleFeedConfigs(): FeedConfig[] {
  return [
    {
      category: "social media & human behaviour",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: SOCIAL_MEDIA_FEED_READERS,
      readerInterests: SOCIAL_MEDIA_FEED_INTERESTS,
      motivationForDistribution: DEMO_SOCIAL_MEDIA_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 8
    },
    {
      category: "future of society",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: FUTURE_OF_SOCIETY_FEED_READERS,
      readerInterests: FUTURE_OF_SOCIETY_FEED_INTERESTS,
      motivationForDistribution: DEMO_FUTURE_OF_SOCIETY_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 8
    },
    {
      category: "Nokia",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: NOKIA_FEED_READERS,
      readerInterests: NOKIA_FEED_INTERESTS,
      motivationForDistribution: DEMO_NOKIA_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 8
    }
/*     {
      category: "space exploration",
      distributionChannel: DEMO_DISTRIBUTION_CHANNEL,
      intendedReaders: SPACE_EXPLORATION_FEED_READERS,
      readerInterests: SPACE_EXPLORATION_FEED_INTERESTS,
      motivationForDistribution: DEMO_SPACE_EXPLORATION_DISTRIBUTION_MOTIVE,
      relevanceThreshold: 6
    } */
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