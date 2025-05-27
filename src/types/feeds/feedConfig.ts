
/**
 * Configuration for a feed.
 * 
 * @property {string} category - The category of the feed.
 * @property {string} distributionChannel - The channel through which the feed is distributed.
 * @property {string[]} intendedReaders - The intended readers of the feed.
 * @property {string[]} readerInterests - The interests of the intended readers.
 * @property {string} motivationForDistribution - The motivation for distributing the feed.
 * @property {number} relevanceThreshold - The threshold for relevance of the feed.
 */
export interface FeedConfig {
  category: string;
  distributionChannel: string;
  intendedReaders: string[];
  readerInterests: string[];
  motivationForDistribution: string;
  relevanceThreshold: number;
}