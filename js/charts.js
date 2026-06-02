/* ═══════════════════════════════════════════════
   js/charts.js
   Construção de todos os gráficos Chart.js
   ═══════════════════════════════════════════════ */

const GRID_COLOR = 'rgba(0,0,0,0.05)';
const TICK_COLOR = '#9e9d99';

function baseChartOpts(yMin, yMax) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { family: 'DM Mono' } }
    },
    scales: {
      x: {
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { size: 10, family: 'DM Mono' }, maxRotation: 30 }
      },
      y: {
        min: yMin,
        max: yMax,
        grid: { color: GRID_COLOR },
        ticks: { color: TICK_COLOR, font: { size: 10, family: 'DM Mono' } }
      }
    }
  };
}

function refLine(labels, value) {
  return {
    data: labels.map(() => value),
    borderColor: '#15803d',
    borderDash: [4, 3],
    borderWidth: 1.5,
    pointRadius: 0,
    fill: false,
    type: 'line',
  };
}

function buildAllCharts(data) {
  const labels = data.map(labelOf);

  // ── HbA1c ──────────────────────────────────────────────────────────
  const hba1c = data.map(e => e.dados.hba1c ?? null);
  new Chart(document.getElementById('hba1cChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: hba1c,
          borderColor: '#b45309',
          backgroundColor: 'rgba(180,83,9,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#b45309',
          pointRadius: 5,
          borderWidth: 2,
        },
        { ...refLine(labels, 5.69), borderColor: '#15803d' },
        { ...refLine(labels, 6.5),  borderColor: '#b91c1c' },
      ]
    },
    options: baseChartOpts(4.8, 7.0),
  });

  // ── Glicemia de jejum ───────────────────────────────────────────────
  const glic = data.map(e => e.dados.glicose ?? null);
  new Chart(document.getElementById('glicemiaChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: glic,
          borderColor: '#b91c1c',
          backgroundColor: 'rgba(185,28,28,0.08)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: glic.map(v => (v && v > 99) ? '#b91c1c' : '#15803d'),
          pointRadius: 5,
          borderWidth: 2,
        },
        { ...refLine(labels, 99) },
      ]
    },
    options: baseChartOpts(80, Math.max(130, ...glic.filter(Boolean)) + 10),
  });

  // ── TTGO (se disponível) ────────────────────────────────────────────
  const latest = data[data.length - 1].dados;
  if (latest.ttgo_basal || latest.ttgo_60min) {
    document.getElementById('ttgo-section').style.display = '';
    const pts = [
      { x: 'Basal',   y: latest.ttgo_basal   },
      { x: '60 min',  y: latest.ttgo_60min   },
      { x: '120 min', y: latest.ttgo_120min  },
    ].filter(p => p.y != null);

    new Chart(document.getElementById('ttgoChart'), {
      type: 'bar',
      data: {
        labels: pts.map(p => p.x),
        datasets: [
          {
            data: pts.map(p => p.y),
            backgroundColor: pts.map(p => p.y > 140 ? 'rgba(185,28,28,0.7)' : 'rgba(45,106,79,0.7)'),
            borderRadius: 6,
          },
          { ...refLine(pts.map(p => p.x), 140), borderColor: '#b45309' },
        ]
      },
      options: baseChartOpts(60, Math.max(170, ...pts.map(p => p.y)) + 10),
    });
  }

  // ── Colesterol total ────────────────────────────────────────────────
  const col = data.map(e => e.dados.colesterol_total ?? null);
  new Chart(document.getElementById('colChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: col,
          backgroundColor: col.map(v => (v && v > 190) ? 'rgba(185,28,28,0.7)' : 'rgba(45,106,79,0.7)'),
          borderRadius: 6,
        },
        { ...refLine(labels, 190), borderColor: '#b45309' },
      ]
    },
    options: baseChartOpts(60, Math.max(260, ...col.filter(Boolean)) + 20),
  });

  // ── Transaminases e GGT ─────────────────────────────────────────────
  const astD = data.map(e => e.dados.ast ?? null);
  const altD = data.map(e => e.dados.alt ?? null);
  const ggtD = data.map(e => e.dados.ggt ?? null);

  new Chart(document.getElementById('hepaticChart'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'AST', data: astD, borderColor: '#1d4ed8', pointRadius: 4, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#1d4ed8' },
        { label: 'ALT', data: altD, borderColor: '#7c3aed', pointRadius: 4, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#7c3aed' },
        { label: 'GGT', data: ggtD, borderColor: '#b45309', pointRadius: 4, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#b45309' },
      ]
    },
    options: {
      ...baseChartOpts(0, Math.max(90, ...astD.filter(Boolean), ...altD.filter(Boolean), ...ggtD.filter(Boolean)) + 10),
      plugins: {
        legend: {
          display: true,
          labels: { color: TICK_COLOR, font: { size: 11, family: 'DM Sans' }, boxWidth: 12, boxHeight: 12 }
        }
      }
    },
  });
}
