/**
 * Output structure for a single research summary
 * @property topic - Distilled idea or theme of the paper
 * @property methodology - Brief explanation of what was studied and how
 * @property findings - The core result or takeaway from the research
 * @property implications - Why this matters for the reader group
 */
export interface ResearchSummary {
  topic: string;
  methodology: string;
  findings: string;
  implications: string;
}

/**
 * Complete output from the report generation prompt
 * @property summaries - Array of research summaries (one per abstract)
 */
export interface ReportGenerationOutput {
  summaries: ResearchSummary[];
} 