const number = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 });

function latest(series) { return series.observations.at(-1); }
function points(series, width, height) {
  const values = series.observations.map(({ value }) => value); const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
  return values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - ((value - min) / span) * height}`).join(' ');
}
function sparkline(series) { return `<svg class="spark" viewBox="0 0 160 42" aria-label="Recent trend"><polyline fill="none" stroke="#135f87" stroke-width="2.5" points="${points(series, 160, 38)}"/></svg>`; }
function chart(series) { const pointString = points(series, 500, 140); const latestPoint = latest(series); return `<article class="card chart-card"><span class="metric-label">${series.title}</span><div class="metric-value">${number.format(latestPoint.value)} <small>${series.unit}</small></div><span class="metric-period">${latestPoint.period}</span><div class="chart-wrap"><svg viewBox="0 0 500 165" role="img" aria-label="${series.title} over recent observations"><line x1="0" x2="500" y1="142" y2="142" stroke="#d8e0e5"/><polyline class="chart-line" points="${pointString}"/><text class="chart-axis" x="0" y="160">${series.observations[0].period}</text><text class="chart-axis" text-anchor="end" x="500" y="160">${latestPoint.period}</text></svg></div></article>`; }
function heatColour(value, values) { const finite = values.filter(Number.isFinite); const low = Math.min(...finite); const high = Math.max(...finite); const position = high === low ? .5 : (value - low) / (high - low); return `hsl(194 ${20 + position * 48}% ${97 - position * 53}%)`; }
function formatHeatmapValue(value, row) { if (!Number.isFinite(value)) return 'Not available'; if (Math.abs(value) >= 1000) return number.format(value); if (row.unit === 'pounds' || row.unit === 'percentage points' || (row.unit === 'US dollars' && Math.abs(value) < 2)) return value.toFixed(3); return number.format(value); }
function renderHeatmap(heatmap) { return `<table class="heatmap"><caption>${heatmap.title} as at ${heatmap.asOf}</caption><thead><tr><th scope="col">Indicator</th>${heatmap.periods.map((period) => `<th scope="col">${period}</th>`).join('')}</tr></thead><tbody>${heatmap.rows.map((row) => `<tr><th scope="row"><span class="metric-name">${row.label}</span><span class="metric-unit">${row.unit}</span></th>${row.values.map((value) => Number.isFinite(value) ? `<td style="background:${heatColour(value, row.values)}">${formatHeatmapValue(value, row)}</td>` : '<td class="is-empty">N/A</td>').join('')}</tr>`).join('')}</tbody></table><p class="heatmap-note"><strong>Source</strong> ${heatmap.source}<br>${heatmap.note}</p>`; }
function renderConnectedHubs(data) {
  const facts = data.context.map((item) => `<article class="card context-card"><span class="metric-label">Verified programme context</span><div class="metric-value">${item.value}</div><h3>${item.label}</h3><p>${item.detail}</p></article>`).join('');
  const principles = data.principles.map((item, index) => `<li><strong>${index + 1}. ${item.title}</strong><span>${item.description}</span></li>`).join('');
  const stages = data.pilot.stages.map((stage) => `<li><strong>${stage.period}</strong><span>${stage.activity}</span></li>`).join('');
  const allocation = data.pilot.allocation.map((item) => `<tr><th scope="row">${item.item}</th><td>€${number.format(item.euro)}</td><td>${item.share}%</td></tr>`).join('');
  const measures = data.measures.map((item) => `<tr><th scope="row">${item.measure}</th><td>${item.definition}</td></tr>`).join('');
  return `<div class="context-grid">${facts}</div><div class="connected-grid"><article class="card"><p class="eyebrow">The proposed system logic</p><h3>Connections create possibilities</h3><div class="system-loop" aria-label="Connect and combine, create, learn, then diffuse and repeat"><span>Connect and combine</span><span>Create activity</span><span>Learn</span><span>Diffuse and repeat</span></div><p class="subtle">The shared chat applies Arthur's complexity economics as a design lens. The loop is an interpretation, not a measured causal model.</p></article><article class="card"><p class="eyebrow">Design principles</p><h3>From a network of places to a generative network</h3><ol class="framework-list">${principles}</ol></article></div><div class="connected-grid"><article class="card"><p class="eyebrow">Proposed 12 month pilot</p><h3>Phased programme design</h3><ol class="timeline">${stages}</ol></article><article class="card"><p class="eyebrow">Illustrative proposal</p><h3>€${number.format(data.pilot.totalEuro)} allocation</h3><p class="subtle">This is a proposed allocation in the shared chat. It is not official funding, expenditure or a budget commitment.</p><table class="detail-table"><thead><tr><th scope="col">Activity</th><th scope="col">Amount</th><th scope="col">Share</th></tr></thead><tbody>${allocation}</tbody></table></article></div><div class="connected-grid"><article class="card"><p class="eyebrow">Proposed measurement framework</p><h3>What the network would measure</h3><table class="detail-table"><thead><tr><th scope="col">Measure</th><th scope="col">Working definition</th></tr></thead><tbody>${measures}</tbody></table></article><article class="card"><p class="eyebrow">Practical actions</p><h3>Operating implications in the shared chat</h3><ol class="framework-list">${data.actions.map((item) => `<li><strong>${item.title}</strong><span>${item.description}</span></li>`).join('')}</ol></article></div><p class="framework-note"><strong>Central question</strong> ${data.centralQuestion}</p>`;
}

async function render() {
  const response = await fetch('data/dashboard.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load dashboard data');
  const dashboard = await response.json();
  const refreshed = new Date(dashboard.generatedAt).toLocaleString('en-IE', { dateStyle:'medium', timeStyle:'short', timeZone:'Europe/Dublin' });
  document.querySelector('#freshness').textContent = `Snapshot refreshed ${refreshed} Irish time`;
  const heatmap = document.querySelector('#heatmap');
  const charts = document.querySelector('#macro-charts');
  const householdCharts = document.querySelector('#household-charts');
  const connectedHubs = document.querySelector('#connected-hubs-content');
  if (!heatmap) throw new Error('The page and script versions do not match. Reload the dashboard to receive the current release.');
  if (dashboard.series.length) {
    heatmap.innerHTML = renderHeatmap(dashboard.heatmap);
    charts.innerHTML = dashboard.series.filter((series) => series.section === 'Macro').map(chart).join('');
    householdCharts.innerHTML = dashboard.series.filter((series) => series.section === 'Households and firms').map(chart).join('');
  } else heatmap.innerHTML = '<div class="empty-state">The initial workflow has not yet completed a data refresh.</div>';
  if (dashboard.connectedHubs) connectedHubs.innerHTML = renderConnectedHubs(dashboard.connectedHubs);
  document.querySelector('#sources-list').innerHTML = dashboard.sources.map((source) => `<article class="source"><div><a href="${source.url}" target="_blank" rel="noreferrer">${source.name}</a><p>${source.coverage}</p></div><p>${source.refresh}</p></article>`).join('');
  document.querySelector('#limitations').innerHTML = `<ul>${dashboard.limitations.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.tab,.panel').forEach((element) => element.classList.remove('is-active')); button.classList.add('is-active'); document.querySelector(`#${button.dataset.tab}`).classList.add('is-active'); }));
render().catch((error) => { document.querySelector('#freshness').textContent = error.message; });
