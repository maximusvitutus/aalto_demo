import { StudyFilterResult } from "./filteredStudy";
import { FeedConfig } from "../feeds/feedConfig";

/**
 * Interface for filtering results
 * @interface FilteringResult
 * @property {string} feed - The category of the feed
 * @property {number} totalStudiesProcessed - The total number of studies processed
 * @property {number} relevantStudiesFound - The number of relevant studies found
 * @property {FilteredStudy[]} relevantStudies - The relevant studies found
 * @property {number} processingTimeMs - The processing time in milliseconds
 * @property {number} totalFailedStudies - The total number of failed studies
 */
export interface FilteringResult {
  feed: string;
  totalStudiesProcessed: number;
  relevantStudiesFound: number;
  relevantStudies: StudyFilterResult[];
  feedConfig: FeedConfig;
  processingTimeMs?: number;
  totalFailedStudies?: number;
}