/**
 * Input parameters for the report generation prompt
 * @property subscriptionCategory - The category of the subscription feed
 * @property intendedReaders - List of intended reader profiles
 * @property distributionChannel - The platform where reports will be distributed
 * @property readerInterests - List of specific interests of the target readers
 * @property motivationForDistribution - The motivation behind distributing research to this audience
 * @property writingInstructions - Specific instructions for customizing the report style
 * @property abstracts - List of research paper abstracts to summarize
 */
export interface ReportGenerationInput {
  subscriptionCategory: string;
  intendedReaders: string[];
  distributionChannel: string;
  readerInterests: string[];
  motivationForDistribution: string;
  writingInstructions: string;
  abstracts: string[];
} 