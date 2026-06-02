/* js/dashboard.js — v4 */

let ALL_DATA = [];
let ACTIVE_IDX = 0;

async function init() {
  let data;
  try {
    const res = await fetch('exames_data.json');
    if (!res.ok) throw new Error();
    data = await res.json();
  } catch {
    document.getElementById('loading').innerHTML = `
      <div style="text-align:center;max-width:400px;padding:40px">
        <i class="ti ti-folder-open" style="font-size:48px;color:var(--text3)" aria-hidden="true"></i>
        <p style="font-weight:600;font-size:16px;margin:16px 0 8px">Nenhum dado encontrado</p>
        <p style="font-size:13px;color:var(--text2);line-height:1.7">
          Rode <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">python3 extrair_exames.py</code>
          e faça o upload do <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">exames_data.json</code> para o GitHub.
        </p>
      </div>`;
    return;
  }

  ALL_DATA = data;
  ACTIVE_IDX = data.length - 1;

  document.getElementById('loading').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';

  buildDateButtons();
  renderAll();
  buildAllCharts(data);
}

/* ── Botões de data ─────────────────────────────────────────────── */
function buildDateButtons() {
  const wrap = document.getElementById('date-buttons');
  ALL_DATA.forEach((entry, i) => {
    const btn = document.createElement('button');
    btn.className = 'date-btn' + (i === ACTIVE_IDX ? ' active' : '');
    btn.textContent = labelOf(entry);
    btn.title = entry.arquivo;
    btn.addEventListener('click', () => {
      ACTIVE_IDX = i;
      document.querySelectorAll('.date-btn').forEach((b, j) => b.classList.toggle('active', j === i));
      renderAll();
    });
    wrap.appendChild(btn);
  });
}

/* ── Render tudo com o exame ativo ─────────────────────────────── */
function renderAll() {
  const dados     = ALL_DATA[ACTIVE_IDX].dados;
  const prevDados = ACTIVE_IDX > 0 ? ALL_DATA[ACTIVE_IDX - 1].dados : null;
  const prevLabel = ACTIVE_IDX > 0 ? labelOf(ALL_DATA[ACTIVE_IDX - 1]) : null;

  buildHero(dados, prevDados);
  buildGlycemicCards(dados, prevDados, prevLabel);
  buildMarkersGrid('grid-lipids',   dados, prevDados, ['colesterol_total','hdl','ldl','triglicerideos','nao_hdl','vldl','lpa','apo_a1','apo_b']);
  buildMarkersGrid('grid-renal',    dados, prevDados, ['creatinina','ureia','etfg','albumina_creatinina']);
  buildMarkersGrid('grid-hepatic',  dados, prevDados, ['ast','alt','ggt','cpk']);
  buildMarkersGrid('grid-hemo',     dados, prevDados, ['hemoglobina','hematocrito','eritrocitos','leucocitos','plaquetas']);
  buildMarkersGrid('grid-vitamins', dados, prevDados, ['vitamina_d','vitamina_b12','acido_folico','ferro','ferritina','potassio','sodio','acido_urico']);
  buildMarkersGrid('grid-thyroid',  dados, prevDados, ['tsh','t4_livre','t3_livre']);
  buildMarkersGrid('grid-other',    dados, prevDados, ['pcr_ultrasensivel','psa_total','vhs']);
  buildEvoTable();
}

/* ── Hero ────────────────────────────────────────────────────────── */
function buildHero(dados, prev) {
  const hba1c = dados.hba1c;
  let title, desc, pillClass;

  if (!hba1c) {
    title = 'Sem dados de HbA1c neste exame';
    desc  = 'Adicione um exame com hemoglobina glicada para acompanhar o pré-diabetes.';
    pillClass = 'ok';
  } else if (hba1c >= 6.5) {
    title = 'Zona de diabetes — procure seu médico';
    desc  = `HbA1c de ${fmtVal('hba1c',hba1c)}% está acima de 6,5%. Consulte seu endocrinologista para iniciar tratamento.`;
    pillClass = 'danger';
  } else if (hba1c >= 5.7) {
    title = 'Pré-diabetes — controlável com hábitos';
    desc  = `HbA1c de ${fmtVal('hba1c',hba1c)}% está na zona de pré-diabetes (5,7–6,4%). Com alimentação e exercício é possível voltar ao normal. Acompanhe a evolução abaixo.`;
    pillClass = 'warn';
  } else {
    title = 'Glicemia dentro do normal!';
    desc  = `HbA1c de ${fmtVal('hba1c',hba1c)}% está abaixo de 5,7%. Continue com os bons hábitos para manter assim.`;
    pillClass = 'ok';
  }

  document.getElementById('hero-title').textContent = title;
  document.getElementById('hero-desc').textContent  = desc;

  const pill = document.getElementById('status-pill');
  pill.className = `status-badge ${pillClass}`;
  const labels = { ok: 'Glicemia normal', warn: 'Pré-diabético', danger: 'Zona de diabetes' };
  pill.innerHTML = `<span class="status-dot"></span><span>${labels[pillClass]}</span>`;

  if (hba1c) {
    const pct = Math.min(96, Math.max(4, (hba1c - 4.5) / (8.5 - 4.5) * 100));
    document.getElementById('needle').style.left = pct + '%';
    const color = hba1c >= 6.5 ? 'var(--red-text)' : hba1c >= 5.7 ? 'var(--amber-text)' : 'var(--green-text)';
    document.getElementById('hero-value').textContent = fmtVal('hba1c', hba1c) + '%';
    document.getElementById('hero-value').style.color = color;
  }
}

/* ── Glycemic cards (shadcn style) ─────────────────────────────── */

const GC_CONFIG = {
  hba1c: {
    label:   'HbA1c — hemoglobina glicada',
    footer:  'Média da glicemia nos últimos 3 meses',
    footerIcon: 'ti-calendar',
    scaleMin: 4,   scaleMax: 8,
    okMax:  5.7,   preMax: 6.5,
    labels: ['4%','5,7%','6,5%','8%'],
    zones: [
      { cls:'normal', name:'Normal',   val:'< 5,7%'   },
      { cls:'pre',    name:'Pré-DM',   val:'5,7–6,4%' },
      { cls:'dm',     name:'Diabetes', val:'≥ 6,5%'   },
    ],
  },
  glicose: {
    label:   'Glicemia de jejum',
    footer:  'Coleta após 8h em jejum',
    footerIcon: 'ti-moon',
    scaleMin: 60,  scaleMax: 200,
    okMax:  99,    preMax: 125,
    labels: ['60','99','126','200'],
    zones: [
      { cls:'normal', name:'Normal',   val:'60–99'    },
      { cls:'pre',    name:'Pré-DM',   val:'100–125'  },
      { cls:'dm',     name:'Diabetes', val:'≥ 126'    },
    ],
  },
  ttgo_60min: {
    label:   'Curva glicêmica (1h)',
    footer:  'Após 75g de dextrosol oral',
    footerIcon: 'ti-droplet',
    scaleMin: 60,  scaleMax: 270,
    okMax:  140,   preMax: 199,
    labels: ['60','140','200','270'],
    zones: [
      { cls:'normal', name:'Normal',   val:'< 140'    },
      { cls:'pre',    name:'Pré-DM',   val:'140–199'  },
      { cls:'dm',     name:'Diabetes', val:'≥ 200'    },
    ],
  },
};

function whichZone(key, val) {
  const c = GC_CONFIG[key];
  if (!c) return 'normal';
  if (val >= c.preMax) return 'dm';
  if (val >= c.okMax)  return 'pre';
  return 'normal';
}

function needlePct(key, val) {
  const c = GC_CONFIG[key];
  if (!c) return 50;
  const pct = (val - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
  return Math.min(96, Math.max(4, pct));
}

function okBarPct(key) {
  const c = GC_CONFIG[key];
  if (!c) return 40;
  return (c.okMax - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
}

function buildGlycemicCards(dados, prev, prevLabel) {
  const container = document.getElementById('glycemic-cards');
  container.innerHTML = '';

  // Mostrar TTGO só se tiver dados
  const keys = ['hba1c','glicose'];
  if (dados.ttgo_60min != null) keys.push('ttgo_60min');

  keys.forEach(key => {
    const val = dados[key];
    if (val == null) return;

    const c   = GC_CONFIG[key];
    const m   = MARKERS[key];
    const st  = statusOf(key, val);
    const zone = whichZone(key, val);
    const pct  = needlePct(key, val);
    const okPct = okBarPct(key);

    // Tendência
    let trendHtml = '';
    if (prev && prev[key] != null) {
      const diff = val - prev[key];
      const pctD = Math.abs(diff / prev[key] * 100).toFixed(1);
      if (Math.abs(diff) > 0.005) {
        const dir   = diff > 0 ? 'worsening' : 'improving';
        const arrow = diff > 0 ? '↑' : '↓';
        trendHtml = `<span class="gc-trend ${dir}" title="vs ${prevLabel}">${arrow} ${pctD}%</span>`;
      }
    } else {
      trendHtml = `<span class="gc-trend" style="color:var(--text3);font-size:10px">1º exame</span>`;
    }

    // Badge
    const badgeMap = { ok: ['ok','✓ Normal'], warn: ['warn','⚠ Atenção'], danger: ['danger','↑ Alterado'] };
    const [bCls, bTxt] = badgeMap[st];

    // Zonas com destaque na zona ativa
    const zonesHtml = c.zones.map(z =>
      `<div class="gc-zone ${z.cls}${zone === z.cls ? ' active' : ''}">
        <span class="gc-zone-name">${z.name}</span>
        <span class="gc-zone-val">${z.val}</span>
      </div>`
    ).join('');

    const card = document.createElement('div');
    card.className = `gc-card ${st}`;
    card.innerHTML = `
      <div class="gc-header">
        <span class="gc-label">${c.label}</span>
        <span class="gc-badge ${bCls}">
          <i class="ti ${bCls === 'ok' ? 'ti-check' : 'ti-alert-triangle'}" aria-hidden="true" style="font-size:10px"></i>
          ${bTxt}
        </span>
      </div>

      <div class="gc-value-row">
        <span class="gc-value">${fmtVal(key, val)}</span>
        <span class="gc-unit">${m.unit}</span>
        ${trendHtml}
      </div>

      <div class="gc-range">
        <div class="gc-bar-track">
          <div class="gc-bar-ok" style="width:${okPct}%"></div>
          <div class="gc-needle" style="left:${pct}%"></div>
        </div>
        <div class="gc-range-labels">
          ${c.labels.map(l => `<span class="gc-range-label">${l}</span>`).join('')}
        </div>
      </div>

      <div class="gc-zones">${zonesHtml}</div>

      <div class="gc-sep"></div>

      <div class="gc-footer">
        <i class="ti ${c.footerIcon}" aria-hidden="true"></i>
        ${c.footer}
      </div>`;

    container.appendChild(card);
  });
}

/* ── Markers grid ───────────────────────────────────────────────── */
function buildMarkersGrid(id, dados, prev, keys) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';
  let any = false;

  keys.forEach(key => {
    const val = dados[key];
    if (val == null) return;
    any = true;

    const m   = MARKERS[key];
    const st  = statusOf(key, val);
    let trendHtml = '';

    if (prev && prev[key] != null) {
      const diff = val - prev[key];
      const pctD = Math.abs(diff / prev[key] * 100).toFixed(0);
      if (Math.abs(diff) > 0.005) {
        const dir = diff > 0 ? 'worsening' : 'improving';
        const arrow = diff > 0 ? '↑' : '↓';
        const color = dir === 'improving' ? 'var(--green-text)' : 'var(--red-text)';
        trendHtml = `<div class="mr-trend" style="color:${color}">${arrow} ${pctD}%</div>`;
      }
    }

    const row = document.createElement('div');
    row.className = `marker-row ${st}`;
    row.innerHTML = `
      <div>
        <div class="mr-name">${m.label}</div>
        <div class="mr-ref">Ref: ${m.ref} ${m.unit}</div>
      </div>
      <div>
        <div class="mr-val">${fmtVal(key, val)}</div>
        <div class="mr-unit">${m.unit}</div>
        ${trendHtml}
      </div>`;
    container.appendChild(row);
  });

  const section = container.closest('.dyn-section');
  if (section) section.style.display = any ? '' : 'none';
}

/* ── Tabela de evolução ─────────────────────────────────────────── */
function buildEvoTable() {
  const dates = ALL_DATA.map(labelOf);

  const thead = document.getElementById('evo-table-head');
  thead.innerHTML = '<th>Exame</th>' + dates.map(d => `<th>${d}</th>`).join('') + '<th>Meta</th>';

  const tbody = document.getElementById('evo-table-body');
  tbody.innerHTML = '';

  Object.keys(MARKERS).forEach(key => {
    if (!ALL_DATA.some(e => e.dados[key] != null)) return;
    const m = MARKERS[key];
    const tr = document.createElement('tr');
    let cells = `<td class="td-name">${m.label}</td>`;
    ALL_DATA.forEach((e, i) => {
      const val = e.dados[key];
      const st  = statusOf(key, val);
      const isCur = i === ACTIVE_IDX;
      cells += `<td class="td-num ${st}${isCur ? ' current' : ''}">${fmtVal(key, val)}</td>`;
    });
    cells += `<td class="td-ref">${m.ref} ${m.unit}</td>`;
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });
}

/* ── Dropdown evolução ──────────────────────────────────────────── */
function toggleEvo() {
  const panel   = document.getElementById('evo-panel');
  const chevron = document.getElementById('evo-chevron');
  const hint    = document.getElementById('evo-toggle-hint');
  const btn     = document.getElementById('evo-toggle');
  const open    = panel.style.display === 'none';

  panel.style.display    = open ? '' : 'none';
  chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  hint.textContent        = open ? 'Clique para recolher' : 'Clique para expandir';
  btn.style.borderBottomColor = open ? 'var(--border)' : 'transparent';
  btn.setAttribute('aria-expanded', open);
}

init();
