import { AffinityScore } from "./affinityScore";
import { FeedConfig } from "../feeds/feedConfig";
import { ResearchStudyMetadata } from "../../../data/dataInterface";

/**
 * Filtered study.
 * 
 * @property {ResearchStudyMetadata} study - The study metadata.
 * @property {AffinityScore} relevanceScore - The relevance score.
 * @property {string} feedCategory - The category of the feed.
 * @property {FeedConfig} feedConfig - The configuration for the feed.
 */
export interface FilteredStudy {
  study: ResearchStudyMetadata;
  relevanceScore: AffinityScore;
  feedCategory: string;
  feedConfig: FeedConfig;
}