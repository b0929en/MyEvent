export function getPointsForLevel(level?: string): number {
  if (!level) return 2;
  const l = level.toLowerCase().trim(); // Add .trim() to be safe
  
  if (l.includes('antarab') || l.includes('antarabangsa')) return 8;
  if (l.includes('universit') || l.includes('negeri')) return 4;
  
  return 2;
}