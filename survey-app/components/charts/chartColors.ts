// Colorblind-friendly palette based on Wong's color palette
// These colors are distinguishable for most forms of color blindness
export const ACCESSIBLE_COLORS = [
  '#6366f1', // Indigo (brand primary)
  '#f97316', // Orange
  '#0891b2', // Cyan
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f59e0b', // Amber
  '#06b6d4', // Light Cyan
  '#10b981', // Emerald
];

// Sequential colors for rating scales (red to green)
export const RATING_COLORS = {
  low: '#ef4444',      // Red - poor ratings
  medium: '#eab308',   // Yellow - average ratings
  high: '#22c55e',     // Green - good ratings
};

// Get rating color based on normalized value (0-5 scale)
export function getRatingColor(value: number, max: number = 5): string {
  const normalized = (value / max) * 5;
  if (normalized >= 4) return RATING_COLORS.high;
  if (normalized >= 3) return RATING_COLORS.medium;
  return RATING_COLORS.low;
}

// Brand colors
export const BRAND_COLORS = {
  primary: '#f97316',    // Orange (brand)
  secondary: '#fb923c',  // Orange-400
  success: '#22c55e',    // Green
  warning: '#eab308',    // Yellow
  error: '#ef4444',      // Red
  info: '#0891b2',       // Cyan
};

// Chart-specific colors
export const CHART_COLORS = {
  grid: '#e5e7eb',
  axis: '#9ca3af',
  text: '#374151',
  textMuted: '#6b7280',
  background: '#f9fafb',
  tooltip: {
    background: '#ffffff',
    border: '#e5e7eb',
  },
};

// Completion chart colors
export const COMPLETION_COLORS = {
  complete: '#f97316',   // Orange (brand)
  incomplete: '#e5e5e5',
};
