const number = new Intl.NumberFormat('en-IE', { maximumFractionDigits: 1 });

function latest(series) { return series.observations.at(-1); }
function points(series, width, height) {
  const values = series.observations.map(({ value }) => value); const min = Math.min(...values); const max = Math.max(...values); const span = max - min || 1;
  return values.map((value, index) => `${(index / Math.max(1, values.length - 1)) * width},${height - ((value - min) / span) * height}`).join(' ');
}
function sparkline(series) { return `<svg class="spark" viewBox="0 0 160 42" aria-label="Recent trend"><polyline fill="none" stroke="#135f87" stroke-width="2.5" points="${points(series, 160, 38)}"/></svg>`; }
function chart(series) { const pointString = points(series, 500, 140); const latestPoint = latest(series); return `<article class="card chart-card"><span class="metric-label">${series.title}</span><div class="metric-value">${number.format(latestPoint.value)} <small>${series.unit}</small></div><span class="metric-period">${latestPoint.period}</span><div class="chart-wrap"><svg viewBox="0 0 500 165" role="img" aria-label="${series.title} over recent observations"><line x1="0" x2="500" y1="142" y2="142" stroke="#d8e0e5"/><polyline class="chart-line" points="${pointString}"/><text class="chart-axis" x="0" y="160">${series.observations[0].period}</text><text class="chart-axis" text-anchor="end" x="500" y="160">${latestPoint.period}</text></svg></div></article>`; }

async function render() {
  const response = await fetch('data/dashboard.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Could not load dashboard data');
  const dashboard = await response.json();
  const refreshed = new Date(dashboard.generatedAt).toLocaleString('en-IE', { dateStyle:'medium', timeStyle:'short', timeZone:'Europe/Dublin' });
  document.querySelector('#freshness').textContent = `Snapshot refreshed ${refreshed} Irish time`;
  const metrics = document.querySelector('#metrics');
  const charts = document.querySelector('#macro-charts');
  const householdCharts = document.querySelector('#household-charts');
  if (dashboard.series.length) {
    metrics.innerHTML = dashboard.series.map((series) => { const item = latest(series); return `<article class="card"><span class="metric-label">${series.title}</span><div class="metric-value">${number.format(item.value)} <small>${series.unit}</small></div><span class="metric-period">${item.period}</span>${sparkline(series)}</article>`; }).join('');
    charts.innerHTML = dashboard.series.filter((series) => series.section === 'Macro').map(chart).join('');
    householdCharts.innerHTML = dashboard.series.filter((series) => series.section === 'Households and firms').map(chart).join('');
  } else metrics.innerHTML = '<div class="empty-state">The initial workflow has not yet completed a data refresh.</div>';
  document.querySelector('#sources-list').innerHTML = dashboard.sources.map((source) => `<article class="source"><div><a href="${source.url}" target="_blank" rel="noreferrer">${source.name}</a><p>${source.coverage}</p></div><p>${source.refresh}</p></article>`).join('');
  document.querySelector('#limitations').innerHTML = `<ul>${dashboard.limitations.map((item) => `<li>${item}</li>`).join('')}</ul>`;
}

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.tab,.panel').forEach((element) => element.classList.remove('is-active')); button.classList.add('is-active'); document.querySelector(`#${button.dataset.tab}`).classList.add('is-active'); }));
render().catch((error) => { document.querySelector('#freshness').textContent = error.message; });
