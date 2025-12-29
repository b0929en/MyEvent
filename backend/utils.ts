export function getPointsForLevel(level?: string): number {
  if (!level) return 1; // Default lowest
  const l = level.toLowerCase().trim();

  if (l === 'antarabangsa' || l.includes('antarabangsa')) return 8;
  if (l === 'kebangsaan / antara university' || l.includes('kebangsaan')) return 6;
  if (l === 'negeri / universiti' || l.includes('negeri') || l.includes('universiti')) return 4;

  return 1;
}