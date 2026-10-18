import { mkdir, readFile, writeFile } from 'node:fs/promises';

const endpoint = (table) => `https://ws.cso.ie/public/api.restful/PxStat.Data.Cube_API.ReadDataset/${table}/JSON-stat/2.0/en`;

const requests = [
  {
    id: 'cpi', table: 'CPM20', title: 'Consumer price inflation', unit: '% annual change',
    selections: { STATISTIC: 'CPM20C08', C04624V05409: 'CP00' }, section: 'Macro'
  },
  {
    id: 'unemployment', table: 'MUM01', title: 'Unemployment rate', unit: '%',
    selections: { STATISTIC: 'MUM01C02', C02076V02508: '316', C02199V02655: '-' }, section: 'Macro'
  },
  {
    id: 'gdp-qoq', table: 'NAQ03', title: 'Real GDP', unit: '% quarterly change', transform: 'quarterlyChange',
    selections: { STATISTIC: 'NAQ03S04', C02196V02652: '-' }, section: 'Macro'
  },
  {
    id: 'mdd-qoq', table: 'NAQ05', title: 'Modified domestic demand', unit: '% quarterly change', transform: 'quarterlyChange',
    selections: { STATISTIC: 'NAQ05S02', C03331V04018: '0165' }, section: 'Macro'
  },
  {
    id: 'retail-sales', table: 'RSM08', title: 'Retail sales volume', unit: '% annual change',
    selections: { STATISTIC: 'RSM08C06', C02583V03135: 'V3970' }, section: 'Households and firms'
  },
  {
    id: 'property-prices', table: 'HPM09', title: 'Residential property price inflation', unit: '% annual change',
    selections: { STATISTIC: 'HPM09C04', C02803V03373: '-' }, section: 'Households and firms'
  }
];

function orderedCodes(category) {
  const index = category.index;
  return Array.isArray(index) ? index : Object.entries(index).sort((a, b) => a[1] - b[1]).map(([code]) => code);
}

function valueAt(dataset, positions) {
  const sizes = dataset.size;
  return positions.reduce((offset, position, i) => offset * sizes[i] + position, 0);
}

function extractSeries(dataset, request) {
  const dimensions = dataset.id;
  const timeId = dimensions.find((id) => id.startsWith('TLIST'));
  if (!timeId) throw new Error(`${request.table} has no time dimension`);
  const codes = Object.fromEntries(dimensions.map((id) => [id, orderedCodes(dataset.dimension[id].category)]));
  const timeCodes = codes[timeId];
  const observations = timeCodes.map((timeCode, timePosition) => {
    const positions = dimensions.map((id) => id === timeId ? timePosition : codes[id].indexOf(request.selections[id] ?? codes[id][0]));
    const value = dataset.value[valueAt(dataset, positions)];
    return { period: dataset.dimension[timeId].category.label[timeCode], value };
  }).filter(({ value }) => Number.isFinite(value));
  const transformed = request.transform === 'quarterlyChange'
    ? observations.map((point, index) => ({ ...point, value: index ? ((point.value / observations[index - 1].value) - 1) * 100 : null })).filter(({ value }) => Number.isFinite(value))
    : observations;
  return { ...request, observations: transformed.slice(-24) };
}

async function refresh() {
  const results = await Promise.all(requests.map(async (request) => {
    const response = await fetch(endpoint(request.table), { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`${request.table} returned ${response.status}`);
    return extractSeries(await response.json(), request);
  }));
  const current = JSON.parse(await readFile('data/dashboard.json', 'utf8'));
  const output = { ...current, generatedAt: new Date().toISOString(), status: 'refreshed', series: results };
  await mkdir('data', { recursive: true });
  await writeFile('data/dashboard.json', `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Refreshed ${results.length} official series`);
}

refresh().catch((error) => { console.error(error); process.exitCode = 1; });
