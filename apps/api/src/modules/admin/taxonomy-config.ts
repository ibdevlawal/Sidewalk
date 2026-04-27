export type TaxonomyConfig = {
  enabledCategories: string[];
  integrityThreshold: number;
  maxReportsPerUser: number;
};

const DEFAULT_CONFIG: TaxonomyConfig = {
  enabledCategories: ["road_damage", "flooding", "illegal_dumping", "broken_lighting"],
  integrityThreshold: 0.7,
  maxReportsPerUser: 50,
};

let activeConfig: TaxonomyConfig = { ...DEFAULT_CONFIG };

export function getConfig(): TaxonomyConfig {
  return { ...activeConfig };
}

export function updateConfig(patch: Partial<TaxonomyConfig>): TaxonomyConfig {
  activeConfig = { ...activeConfig, ...patch };
  return getConfig();
}

export function resetConfig(): void {
  activeConfig = { ...DEFAULT_CONFIG };
}