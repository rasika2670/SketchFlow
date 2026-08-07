// Deterministic color palette for users (cursors, avatars, highlights)
export const USER_COLORS = [
  '#38BDF8', // cyan
  '#34D399', // emerald
  '#FBBF24', // amber
  '#FB7185', // rose
  '#A78BFA', // violet
  '#F97316', // orange
  '#2DD4BF', // teal
  '#E879F9', // fuchsia
  '#60A5FA', // blue
  '#4ADE80', // green
];

/** 
 * Get a deterministic color from a user ID or Name.
 * Prefers ID for consistency, falls back to name.
 */
export const getUserColor = (userId, name = '') => {
  const seed = userId || name || 'unknown';
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};
