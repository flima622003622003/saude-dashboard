/* ═══════════════════════════════════════════════
   js/dashboard.js
   Lógica principal do dashboard:
   carregamento do JSON, construção de UI,
   alertas, cards de métricas e tabela.
   ═══════════════════════════════════════════════ */

async function init() {
  let data;
  try {
    const res = await fetch('exames_data.json');
    if (!res.ok) throw new Error('not found');
    data = await res.json();
  } catch (e) {
    document.getElementById('loading').innerHTML = `
      <div style="text-align:center; padding:40px; max-width:460px; line-height:1.8;">
        <p style="font-size:32px; margin-bottom:16px;">📂</p>
        <p style="font-weight:600; color:var(--text); margin-bottom:8px;">
          Arquivo exames_data.json não encontrado
        </p>
        <p style="font-size:13px; color:var(--text2);">
          Rode <code style="font-family:DM Mono,monospace; background:var(--surface2); padding:2px 6px; border-radius:4px;">python3 extrair_exames.py</code>
          na pasta do projeto para gerá-lo,
          depois faça commit e push para o GitHub.
        </p>
      </div>`;
    return;
  }

  if (!data || !data.length) {
    document.getElementById('loading').innerHTML =
      '<p style="color:var(--text2);">Nenhum exame encontrado no JSON.</p>';
    return;
  }

  document.getElementById('loading').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';

  buildDateTabs(data);
  buildAlerts(data);
  buildMetrics(data);
  buildAllCharts(data);   // definido em charts.js
  buildTable(data);
  updateStatusPill(data);
}

/* ── Status pill ──────────────────────────────────────────────────── */

function updateStatusPill(data) {
  const latest = data[data.length - 1].dados;
  const pill = document.getElementById('status-pill');
  if (latest.hba1c >= 6.5 || latest.glicose >= 126) {
    pill.className = 'status-pill danger';
    pill.querySelector('.status-dot').style.background = 'currentColor';
    pill.lastChild.textContent = ' Diabetes — monitorar';
  } else if (latest.hba1c >= 5.7 || latest.glicose > 99) {
    pill.className = 'status-pill warn';
    pill.lastChild.textContent = ' Pré-diabético';
  } else {
    pill.className = 'status-pill ok';
    pill.lastChild.textContent = ' Glicemia normal';
  }
}

/* ── Date tabs ────────────────────────────────────────────────────── */

function buildDateTabs(data) {
  const bar = document.getElementById('compare-bar');
  data.forEach((entry, i) => {
    const btn = document.createElement('button');
    btn.className = 'date-tab' + (i === data.length - 1 ? ' active' : '');
    btn.textContent = labelOf(entry);
    btn.title = entry.arquivo;
    bar.appendChild(btn);
  });
}

/* ── Alert banners ────────────────────────────────────────────────── */

function buildAlerts(data) {
  const latest = data[data.length - 1].dados;
  const container = document.getElementById('alerts-container');

  const alerts = [];

  if (latest.hba1c >= 5.7)
    alerts.push({
      level: 'warn',
      text: `<strong>HbA1c ${fmtVal('hba1c', latest.hba1c)}% — zona de pré-diabetes</strong> (5,7–6,4%).
             Meta: voltar abaixo de 5,70%. Controle alimentar e exercícios são a primeira linha de tratamento.`
    });

  if (latest.glicose > 99)
    alerts.push({
      level: 'warn',
      text: `<strong>Glicemia de jejum ${fmtVal('glicose', latest.glicose)} mg/dL</strong> — acima do limite normal (99 mg/dL).
             Indica que o fígado libera glicose em excesso durante a madrugada.`
    });

  if (latest.ttgo_60min >= 140)
    alerts.push({
      level: 'warn',
      text: `<strong>Curva glicêmica 1h: ${fmtVal('ttgo_60min', latest.ttgo_60min)} mg/dL</strong> — acima de 140 mg/dL.
             Resistência à insulina confirmada. Exercício 20–30 min após refeições reduz diretamente esse pico.`
    });

  if (latest.lpa > 75)
    alerts.push({
      level: 'danger',
      text: `<strong>🚨 Lipoproteína(a): ${Math.round(latest.lpa)} nmol/L</strong> — ${(latest.lpa / 75).toFixed(1)}× acima do limite (75 nmol/L).
             Fator de risco cardiovascular genético. Não é controlável por dieta. Requer avaliação cardiológica específica.`
    });

  if (latest.etfg && latest.etfg < 60)
    alerts.push({
      level: 'warn',
      text: `<strong>eTFG: ${Math.round(latest.etfg)} mL/min</strong> — função renal reduzida.
             Hidratação adequada e controle glicêmico são essenciais para proteger os rins.`
    });

  if (latest.cpk > 171)
    alerts.push({
      level: 'warn',
      text: `<strong>CPK: ${Math.round(latest.cpk)} U/L</strong> — acima do normal (171 U/L).
             Pode indicar esforço muscular intenso recente, uso de estatina ou lesão muscular. Investigar com médico.`
    });

  alerts.forEach(a => {
    const div = document.createElement('div');
    div.className = `alert-banner${a.level === 'danger' ? ' danger' : ''}`;
    div.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="${a.level === 'danger' ? '#b91c1c' : '#b45309'}"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <p>${a.text}</p>`;
    container.appendChild(div);
  });
}

/* ── Metric cards ─────────────────────────────────────────────────── */

const GLYCEMIC_KEYS = ['glicose', 'hba1c', 'ttgo_basal', 'ttgo_60min', 'glicemia_media_estimada'];
const LIPIDS_KEYS   = ['colesterol_total', 'hdl', 'ldl', 'triglicerideos', 'lpa'];
const RENAL_KEYS    = ['creatinina', 'etfg', 'albumina_creatinina', 'ureia'];
const HEPATIC_KEYS  = ['ast', 'alt', 'ggt', 'cpk'];
const HEMO_KEYS     = ['hemoglobina', 'hematocrito', 'eritrocitos', 'leucocitos', 'plaquetas'];

function buildMetricCard(key, data) {
  const latest  = data[data.length - 1].dados;
  const prev    = data.length > 1 ? data[data.length - 2].dados : null;
  const val     = latest[key];
  if (val == null) return null;

  const m       = MARKERS[key];
  const st      = statusOf(key, val);
  const prevVal = prev ? prev[key] : null;
  const color   = st === 'danger' ? 'var(--danger)' : st === 'warn' ? 'var(--warn)' : 'var(--accent)';

  let trendHtml = '';
  if (prevVal != null) {
    const diff = val - prevVal;
    const pct  = Math.abs(diff / prevVal * 100).toFixed(1);
    if (Math.abs(diff) > 0.01) {
      const dir   = diff > 0 ? 'up' : 'down';
      const arrow = diff > 0 ? '↑' : '↓';
      trendHtml = `<span class="trend ${dir}">${arrow} ${pct}%</span>`;
    }
  }

  const card = document.createElement('div');
  card.className = `metric-card ${st}-card`;
  card.title = m.info || '';
  card.innerHTML = `
    <div class="label">${m.label}</div>
    <div class="value" style="color:${color}">${fmtVal(key, val)}</div>
    <div class="unit">${m.unit}${trendHtml}</div>
    <span class="badge ${st}">
      ${st === 'ok' ? '✓ Normal' : st === 'warn' ? '⚠ Atenção' : '🔴 Alterado'}
    </span>`;
  return card;
}

function buildMetrics(data) {
  const sections = [
    ['metrics-glycemic', GLYCEMIC_KEYS],
    ['metrics-lipids',   LIPIDS_KEYS],
    ['metrics-renal',    RENAL_KEYS],
    ['metrics-hepatic',  HEPATIC_KEYS],
    ['metrics-hemo',     HEMO_KEYS],
  ];

  sections.forEach(([id, keys]) => {
    const grid = document.getElementById(id);
    if (!grid) return;
    keys.forEach(key => {
      const card = buildMetricCard(key, data);
      if (card) grid.appendChild(card);
    });
  });

  // Mostrar seção TTGO apenas se houver dados
  const latest = data[data.length - 1].dados;
  if (latest.ttgo_basal || latest.ttgo_60min) {
    document.getElementById('ttgo-section').style.display = '';
  }
}

/* ── Tabela comparativa ───────────────────────────────────────────── */

function buildTable(data) {
  const labels = data.map(labelOf);

  // Cabeçalho
  const headerRow = document.getElementById('table-header-row');
  headerRow.innerHTML =
    '<th>Marcador</th>' +
    labels.map(l => `<th>${l}</th>`).join('') +
    '<th>Referência</th>';

  // Corpo
  const tbody = document.getElementById('table-body');

  Object.keys(MARKERS).forEach(key => {
    const hasData = data.some(e => e.dados[key] != null);
    if (!hasData) return;

    const m  = MARKERS[key];
    const tr = document.createElement('tr');

    let cells = `<td class="name">${m.label}</td>`;

    data.forEach(e => {
      const val = e.dados[key];
      const st  = statusOf(key, val);
      const color =
        st === 'danger' ? 'var(--danger)' :
        st === 'warn'   ? 'var(--warn)'   : '';
      const style = color ? `style="color:${color}; font-weight:600"` : '';
      cells += `<td class="num" ${style}>${fmtVal(key, val)}</td>`;
    });

    // Referência resumida
    const refs = [];
    if (m.warn_lo  || m.danger_lo)  refs.push(`≥ ${m.warn_lo  || m.danger_lo}`);
    if (m.warn_hi  || m.danger_hi)  refs.push(`< ${m.warn_hi  || m.danger_hi}`);
    cells += `<td class="ref">${refs.join(' / ')} ${m.unit}</td>`;

    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
}

/* ── Inicializar ──────────────────────────────────────────────────── */
init();
