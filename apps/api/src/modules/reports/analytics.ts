export type ReportSummary = {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byDistrict: Record<string, number>;
  total: number;
};

export function aggregateSummary(
  reports: Array<{ status: string; category: string; districtId: string }>,
  districtId?: string,
): ReportSummary {
  const scoped = districtId ? reports.filter((r) => r.districtId === districtId) : reports;

  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byDistrict: Record<string, number> = {};

  for (const r of scoped) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    byDistrict[r.districtId] = (byDistrict[r.districtId] ?? 0) + 1;
  }

  return { byStatus, byCategory, byDistrict, total: scoped.length };
}