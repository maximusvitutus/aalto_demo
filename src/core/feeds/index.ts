import { NESTE_PRESET } from './neste';
import { AALTO_AI_RESEARCHER_PRESET } from './aaltoAIResearcher';
import { HELSINGIN_SANOMAT_PRESET } from './helsinginSanomat';

export interface PresetData {
  readers: string;
  interests: string;
  cannedResults: Array<{
    title: string;
    year: number;
    affinityScore: number;
    summary: {
      topic: string;
      methodology: string;
      findings: string;
      implications: string;
    };
  }>;
}

export const PRESETS = {
  company: NESTE_PRESET,
  researcher: AALTO_AI_RESEARCHER_PRESET,
  journalist: HELSINGIN_SANOMAT_PRESET
} as const;

export type PresetType = keyof typeof PRESETS;

/**
 * Get preset data by type
 */
export function getPreset(type: PresetType): PresetData {
  return PRESETS[type];
}

/**
 * Check if input matches any preset (for smart result generation)
 */
export function matchInputToPreset(readers: string, interests: string): PresetType | null {
  const normalizeText = (text: string) => 
    text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

  const inputReaders = normalizeText(readers);
  const inputInterests = normalizeText(interests);

  for (const [type, preset] of Object.entries(PRESETS)) {
    const presetReaders = normalizeText(preset.readers);
    const presetInterests = normalizeText(preset.interests);

    // Check for exact or very close matches
    if (inputReaders === presetReaders && inputInterests === presetInterests) {
      return type as PresetType;
    }

    // Check for substantial overlap (at least 80% similarity in key terms)
    const readersMatch = calculateSimilarity(inputReaders, presetReaders) > 0.8;
    const interestsMatch = calculateSimilarity(inputInterests, presetInterests) > 0.7;

    if (readersMatch && interestsMatch) {
      return type as PresetType;
    }
  }

  return null;
}

/**
 * Simple text similarity calculation based on word overlap
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(' ').filter(word => word.length > 3));
  const words2 = new Set(text2.split(' ').filter(word => word.length > 3));
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Get canned results for a preset
 */
export function getCannedResults(type: PresetType) {
  return PRESETS[type].cannedResults;
}

// Export individual presets for direct access
export { NESTE_PRESET, AALTO_AI_RESEARCHER_PRESET, HELSINGIN_SANOMAT_PRESET }; 