import { FilteredStudy } from "./filteredStudy";

/**
 * Batch filtering result.
 * 
 * @property {string} feedCategory - The category of the feed.
 * @property {number} totalStudiesProcessed - The total number of studies processed.
 * @property {number} relevantStudiesFound - The number of relevant studies found.
 * @property {FilteredStudy[]} filteredStudies - The filtered studies.
 * @property {number} processingTimeMs - The processing time in milliseconds.
 */
export interface BatchFilteringResult {
  feedCategory: string;
  totalStudiesProcessed: number;
  relevantStudiesFound: number;
  filteredStudies: FilteredStudy[];
  processingTimeMs?: number;
}