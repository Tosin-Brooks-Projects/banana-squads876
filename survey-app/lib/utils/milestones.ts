import { AdventureType } from '@/lib/types';

export const MILESTONES = [25, 50, 75] as const;

export interface MilestoneInfo {
  currentPercent: number;
  reachedMilestone: number | null;
  nextMilestone: number | null;
  shouldSave: boolean;
}

export function calculateMilestone(
  currentStage: number,
  totalStages: number,
  lastSavedMilestone: number = 0
): MilestoneInfo {
  // Exclude completion stage from percentage calculation
  const effectiveTotalStages = Math.max(totalStages - 1, 1);
  const percentComplete = Math.floor((currentStage / effectiveTotalStages) * 100);

  // Find which milestone we've reached
  let reachedMilestone: number | null = null;
  for (const milestone of MILESTONES) {
    if (percentComplete >= milestone) {
      reachedMilestone = milestone;
    }
  }

  // Find next milestone
  let nextMilestone: number | null = null;
  for (const milestone of MILESTONES) {
    if (percentComplete < milestone) {
      nextMilestone = milestone;
      break;
    }
  }

  // Should save if we've crossed a milestone we haven't saved yet
  const shouldSave = reachedMilestone !== null && reachedMilestone > lastSavedMilestone;

  return {
    currentPercent: percentComplete,
    reachedMilestone,
    nextMilestone,
    shouldSave,
  };
}

// Map adventure types to their total stage counts
// Note: 'classic' uses dynamic stages based on question count, default to 6
const ADVENTURE_STAGE_COUNTS: Record<AdventureType, number> = {
  'classic': 6,
  'ice-cream-sundae': 6,
  'pizza-builder': 6,
  'garden-grower': 6,
  'dream-home': 6,
  'coffee-brewer': 6,
};

export function getAdventureTotalStages(adventureType: AdventureType): number {
  return ADVENTURE_STAGE_COUNTS[adventureType] || 6;
}
