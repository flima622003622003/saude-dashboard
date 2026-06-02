/* js/charts.js */

const GC = 'rgba(0,0,0,0.05)';
const TC = '#b0ada4';

function baseOpts(yMin, yMax) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { bodyFont: { family: 'Nunito Sans' }, titleFont: { family: 'Nunito' } } },
    scales: {
      x: { grid: { color: GC }, ticks: { color: TC, font: { size: 11, family: 'Nunito Sans' }, maxRotation: 0 } },
      y: { min: yMin, max: yMax, grid: { color: GC }, ticks: { color: TC, font: { size: 11, family: 'Nunito Sans' } } }
    }
  };
}

function refLine(labels, value, color) {
  return { data: labels.map(() => value), borderColor: color || '#1a7a4a', borderDash: [5,4], borderWidth: 1.5, pointRadius: 0, fill: false, type: 'line' };
}

function buildAllCharts(data) {
  const labels = data.map(labelOf);

  /* HbA1c */
  const hba1c = data.map(e => e.dados.hba1c ?? null);
  new Chart(document.getElementById('hba1cChart'), {
    type: 'line',
    data: { labels, datasets: [
      { data: hba1c, borderColor: '#b55d00', backgroundColor: 'rgba(181,93,0,.08)', fill: true, tension: 0.4, pointBackgroundColor: '#b55d00', pointRadius: 6, borderWidth: 2.5 },
      { ...refLine(labels, 5.69, '#1a7a4a'), label: 'Normal' },
      { ...refLine(labels, 6.5,  '#c0392b'), label: 'Diabetes' },
    ]},
    options: baseOpts(4.8, 7.0),
  });

  /* Glicemia jejum */
  const glic = data.map(e => e.dados.glicose ?? null);
  new Chart(document.getElementById('glicChart'), {
    type: 'line',
    data: { labels, datasets: [
      { data: glic, borderColor: '#c0392b', backgroundColor: 'rgba(192,57,43,.07)', fill: true, tension: 0.4,
        pointBackgroundColor: glic.map(v => v && v > 99 ? '#c0392b' : '#1a7a4a'), pointRadius: 6, borderWidth: 2.5 },
      { ...refLine(labels, 99, '#1a7a4a') },
    ]},
    options: baseOpts(80, Math.max(130, ...glic.filter(Boolean)) + 8),
  });

  /* TTGO */
  const latest = data[data.length - 1].dados;
  if (latest.ttgo_basal || latest.ttgo_60min) {
    document.getElementById('ttgo-section').style.display = '';
    const pts = [
      { x: 'Basal (jejum)', y: latest.ttgo_basal },
      { x: '1 hora',        y: latest.ttgo_60min  },
      { x: '2 horas',       y: latest.ttgo_120min },
    ].filter(p => p.y != null);

    new Chart(document.getElementById('ttgoChart'), {
      type: 'bar',
      data: { labels: pts.map(p => p.x), datasets: [
        { data: pts.map(p => p.y),
          backgroundColor: pts.map(p => p.y > 140 ? 'rgba(192,57,43,.75)' : 'rgba(26,122,74,.7)'),
          borderRadius: 8 },
        { ...refLine(pts.map(p => p.x), 140, '#b55d00') },
      ]},
      options: baseOpts(60, Math.max(180, ...pts.map(p => p.y)) + 10),
    });
  }

  /* Colesterol */
  const col = data.map(e => e.dados.colesterol_total ?? null);
  new Chart(document.getElementById('colChart'), {
    type: 'bar',
    data: { labels, datasets: [
      { data: col, backgroundColor: col.map(v => v && v > 190 ? 'rgba(192,57,43,.7)' : 'rgba(26,122,74,.7)'), borderRadius: 8 },
      { ...refLine(labels, 190, '#b55d00') },
    ]},
    options: baseOpts(60, Math.max(260, ...col.filter(Boolean)) + 20),
  });

  /* Hepático */
  const astD = data.map(e => e.dados.ast ?? null);
  const altD = data.map(e => e.dados.alt ?? null);
  const ggtD = data.map(e => e.dados.ggt ?? null);
  new Chart(document.getElementById('hepaticChart'), {
    type: 'line',
    data: { labels, datasets: [
      { label: 'AST', data: astD, borderColor: '#1a5fa8', pointRadius: 5, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#1a5fa8' },
      { label: 'ALT', data: altD, borderColor: '#7c3aed', pointRadius: 5, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#7c3aed' },
      { label: 'GGT', data: ggtD, borderColor: '#b55d00', pointRadius: 5, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#b55d00' },
    ]},
    options: {
      ...baseOpts(0, Math.max(90, ...astD.filter(Boolean), ...altD.filter(Boolean), ...ggtD.filter(Boolean)) + 10),
      plugins: { legend: { display: true, labels: { color: TC, font: { size: 11, family: 'Nunito Sans' }, boxWidth: 12, boxHeight: 8, borderRadius: 3 } } }
    },
  });
}
