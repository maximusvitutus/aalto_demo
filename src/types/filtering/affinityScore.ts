/**
 * Affinity score for a feed.
 * 
 * @property {string} reasoning - The reasoning for the affinity score.
 * @property {number} affinityScore - The affinity score.
 * @property {string} affinityExplanation - The explanation for the affinity score.
 */
export interface AffinityScore {
  reasoning: string;
  affinityScore: number;
  affinityExplanation: string;
}