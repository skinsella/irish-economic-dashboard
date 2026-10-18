import { readFile } from 'node:fs/promises';

const dashboard = JSON.parse(await readFile('data/dashboard.json', 'utf8'));
if (!dashboard.generatedAt || !Array.isArray(dashboard.series) || !Array.isArray(dashboard.sources)) throw new Error('Dashboard data schema is invalid');
for (const series of dashboard.series) {
  if (!series.id || !series.title || !Array.isArray(series.observations) || !series.observations.length) throw new Error(`Invalid series ${series.id ?? 'unknown'}`);
  if (series.observations.some((point) => !Number.isFinite(point.value) || !point.period)) throw new Error(`Invalid observation in ${series.id}`);
  if (series.id === 'unemployment' && series.observations.some((point) => point.value < 0 || point.value > 100)) throw new Error('Unemployment rate is outside its valid range');
}
if (!dashboard.heatmap || !Array.isArray(dashboard.heatmap.periods) || !Array.isArray(dashboard.heatmap.rows)) throw new Error('Heatmap is missing or invalid');
for (const row of dashboard.heatmap.rows) {
  if (!row.label || !row.unit || row.values.length !== dashboard.heatmap.periods.length) throw new Error(`Invalid heatmap row ${row.label ?? 'unknown'}`);
  if (row.values.some((value) => value !== null && !Number.isFinite(value))) throw new Error(`Invalid heatmap value in ${row.label}`);
}
console.log(`Validated ${dashboard.series.length} series, ${dashboard.heatmap.rows.length} heatmap rows and ${dashboard.sources.length} sources`);
