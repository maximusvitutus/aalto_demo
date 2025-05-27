
/**
 * Input for the evaluation score.
 * @property abstract - The abstract of the research paper.
 * @property subscriptionCategory - The category of the subscription.
 * @property distributionChannel - The platform where this custom feed is distributed.
 * @property intendedReaders - The intended readers of the research summary.
 * @property readerInterests - The interests of the feed's intended readers.
 * @property motivationForDistribution - The motivation for the distribution.
 */
export interface EvaluationScoreInput {
  abstract: string;
  subscriptionCategory: string;
  distributionChannel: string;
  intendedReaders: string[];
  readerInterests: string[];
  motivationForDistribution: string;
}
