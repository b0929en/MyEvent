export function getPointsForLevel(level?: string): number {
  if (!level) return 1; // Default lowest
  const l = level.toLowerCase().trim();

  if (l === 'antarabangsa') return 8;
  if (l === 'kebangsaan / antara university') return 6;
  if (l === 'negeri / universiti') return 4;
  if (l === 'p.pengajian / desasiswa / persatuan / kelab') return 1;

  return 1;
}