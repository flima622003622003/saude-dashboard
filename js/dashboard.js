/* js/dashboard.js */

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
      <div style="text-align:center;max-width:420px;padding:40px">
        <div style="font-size:48px;margin-bottom:16px">📂</div>
        <p style="font-family:Nunito,sans-serif;font-weight:800;font-size:17px;margin-bottom:8px">Nenhum dado encontrado</p>
        <p style="font-size:13px;color:var(--text2);line-height:1.7">
          O arquivo <code style="background:var(--surface2);padding:2px 6px;border-radius:4px;font-size:12px">exames_data.json</code>
          não foi encontrado.<br>Rode <code style="background:var(--surface2);padding:2px 6px;border-radius:4px;font-size:12px">python3 extrair_exames.py</code>
          e faça upload para o GitHub.
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
  buildAllCharts(data); // gráficos usam série completa
}

/* ── Botões de data ──────────────────────────────────────────────── */

function buildDateButtons() {
  const wrap = document.getElementById('date-buttons');
  ALL_DATA.forEach((entry, i) => {
    const btn = document.createElement('button');
    btn.className = 'date-btn' + (i === ACTIVE_IDX ? ' active' : '');
    btn.innerHTML = `<span class="dot"></span>${labelOf(entry)}`;
    btn.title = `Exame de ${labelOf(entry)} — ${entry.arquivo}`;
    btn.addEventListener('click', () => {
      ACTIVE_IDX = i;
      document.querySelectorAll('.date-btn').forEach((b, j) => b.classList.toggle('active', j === i));
      renderAll();
    });
    wrap.appendChild(btn);
  });
}

/* ── Renderiza tudo com base no exame ativo ──────────────────────── */

function renderAll() {
  const entry   = ALL_DATA[ACTIVE_IDX];
  const prev    = ACTIVE_IDX > 0 ? ALL_DATA[ACTIVE_IDX - 1] : null;
  const dados   = entry.dados;
  const dadosPrev = prev ? prev.dados : null;

  buildHero(dados, dadosPrev);
  buildFocusCards(dados, dadosPrev);
  buildMarkersGrid('grid-lipids',    dados, dadosPrev, ['colesterol_total','hdl','ldl','triglicerideos','nao_hdl','vldl','lpa','apo_a1','apo_b']);
  buildMarkersGrid('grid-renal',     dados, dadosPrev, ['creatinina','ureia','etfg','albumina_creatinina']);
  buildMarkersGrid('grid-hepatic',   dados, dadosPrev, ['ast','alt','ggt','cpk']);
  buildMarkersGrid('grid-hemo',      dados, dadosPrev, ['hemoglobina','hematocrito','eritrocitos','leucocitos','plaquetas']);
  buildMarkersGrid('grid-vitamins',  dados, dadosPrev, ['vitamina_d','vitamina_b12','acido_folico','ferro','ferritina','potassio','sodio','acido_urico']);
  buildMarkersGrid('grid-thyroid',   dados, dadosPrev, ['tsh','t4_livre','t3_livre']);
  buildMarkersGrid('grid-other',     dados, dadosPrev, ['pcr_ultrasensivel','psa_total','vhs']);
  buildEvoTable(dados, dadosPrev);
}

/* ── Hero: HbA1c + medidor ──────────────────────────────────────── */

function buildHero(dados, prev) {
  const hba1c = dados.hba1c;
  const prevHba1c = prev ? prev.hba1c : null;

  // Status geral
  let title, desc, color;
  if (!hba1c) { title = 'Sem dados de HbA1c'; desc = ''; color = 'var(--text3)'; }
  else if (hba1c >= 6.5) {
    title = 'Atenção: zona de diabetes';
    desc  = `Sua HbA1c de ${fmtVal('hba1c', hba1c)}% indica diabetes. Consulte seu médico imediatamente para iniciar tratamento.`;
    color = 'var(--red)';
  } else if (hba1c >= 5.7) {
    title = 'Pré-diabetes — controlável com mudanças de hábito';
    desc  = `Sua HbA1c de ${fmtVal('hba1c', hba1c)}% está na zona de pré-diabetes (5,7–6,4%). Com alimentação adequada e exercícios regulares, é totalmente possível voltar ao normal. Continue acompanhando!`;
    color = 'var(--amber)';
  } else {
    title = 'Glicemia sob controle!';
    desc  = `Sua HbA1c de ${fmtVal('hba1c', hba1c)}% está dentro da faixa normal. Continue com os bons hábitos para manter assim.`;
    color = 'var(--green)';
  }

  document.getElementById('hero-title').textContent = title;
  document.getElementById('hero-desc').textContent  = desc;

  // Medidor
  if (hba1c) {
    const pct = Math.min(100, Math.max(0, (hba1c - 4.5) / (8 - 4.5) * 100));
    document.getElementById('needle').style.left = pct + '%';
    document.getElementById('meter-val').textContent = fmtVal('hba1c', hba1c) + '%';
    document.getElementById('meter-val').style.color = color;
  }

  // Status pill
  const pill = document.getElementById('status-pill');
  if (hba1c >= 6.5) {
    pill.className = 'status-badge danger';
    pill.querySelector('span:last-child').textContent = 'Zona de diabetes';
  } else if (hba1c >= 5.7 || (dados.glicose && dados.glicose > 99)) {
    pill.className = 'status-badge warn';
    pill.querySelector('span:last-child').textContent = 'Pré-diabético';
  } else {
    pill.className = 'status-badge ok';
    pill.querySelector('span:last-child').textContent = 'Glicemia normal';
  }
}

/* ── Focus cards (glicemia) ─────────────────────────────────────── */

function buildFocusCards(dados, prev) {
  const container = document.getElementById('focus-cards');
  container.innerHTML = '';

  const KEYS = ['glicose','hba1c','ttgo_60min'];

  const GOALS = {
    glicose:    { max: 126, target: 99,  label: 'Meta: abaixo de 99' },
    hba1c:      { max: 7.5, target: 5.7, label: 'Meta: abaixo de 5,7%' },
    ttgo_60min: { max: 209, target: 140, label: 'Meta: abaixo de 140' },
  };

  KEYS.forEach(key => {
    const val = dados[key];
    if (val == null) return;

    const m     = MARKERS[key];
    const st    = statusOf(key, val);
    const g     = GOALS[key];
    const pct   = g ? Math.min(100, Math.round(val / g.max * 100)) : 50;

    let trendHtml = '';
    if (prev && prev[key] != null) {
      const diff = val - prev[key];
      const pctDiff = Math.abs(diff / prev[key] * 100).toFixed(1);
      if (Math.abs(diff) > 0.01) {
        const dir = diff > 0 ? 'worsening' : 'improving';
        const arrow = diff > 0 ? '↑' : '↓';
        const vs = labelOf(ALL_DATA[ACTIVE_IDX - 1]);
        trendHtml = `<div class="fc-trend ${dir}">${arrow} ${pctDiff}% em relação a ${vs}</div>`;
      }
    }

    const card = document.createElement('div');
    card.className = `focus-card ${st}`;
    card.innerHTML = `
      <div class="fc-label">${m.label}</div>
      <div class="fc-value">${fmtVal(key, val)}</div>
      <div class="fc-unit">${m.unit} ${g ? '· ' + g.label : ''}</div>
      <div class="fc-bar-track"><div class="fc-bar-fill" style="width:${pct}%"></div></div>
      <div class="fc-status">${statusLabel(st)}</div>
      ${trendHtml}`;
    container.appendChild(card);
  });
}

/* ── Grade de marcadores ─────────────────────────────────────────── */

function buildMarkersGrid(containerId, dados, prev, keys) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  let anyData = false;
  keys.forEach(key => {
    const val = dados[key];
    if (val == null) return;
    anyData = true;

    const m    = MARKERS[key];
    const st   = statusOf(key, val);
    const prevVal = prev ? prev[key] : null;

    let trendHtml = '';
    if (prevVal != null) {
      const diff  = val - prevVal;
      const pctD  = Math.abs(diff / prevVal * 100).toFixed(0);
      if (Math.abs(diff) > 0.005) {
        const dir   = diff > 0 ? 'up' : 'down';
        const arrow = diff > 0 ? '↑' : '↓';
        trendHtml = `<span class="td-trend ${dir}" style="font-size:11px; margin-left:4px">${arrow}${pctD}%</span>`;
      }
    }

    const row = document.createElement('div');
    row.className = `marker-row ${st}`;
    row.innerHTML = `
      <div class="mr-left">
        <div class="mr-name">${m.label}</div>
        <div class="mr-ref">Ref: ${m.ref} ${m.unit}</div>
      </div>
      <div class="mr-right">
        <div class="mr-value">${fmtVal(key, val)}${trendHtml}</div>
        <div class="mr-unit">${m.unit}</div>
      </div>`;
    container.appendChild(row);
  });

  // Esconde seção pai se sem dados
  const section = container.closest('.dyn-section');
  if (section) section.style.display = anyData ? '' : 'none';
}

/* ── Tabela de evolução ──────────────────────────────────────────── */

function buildEvoTable(dados, prev) {
  const wrap = document.getElementById('evo-table-body');
  if (!wrap) return;
  wrap.innerHTML = '';

  const allKeys = Object.keys(MARKERS);
  const dates = ALL_DATA.map(labelOf);

  // Cabeçalho dinâmico
  const thead = document.getElementById('evo-table-head');
  if (thead) {
    thead.innerHTML = '<th>Exame</th>' + dates.map(d => `<th>${d}</th>`).join('') + '<th>Meta</th>';
  }

  allKeys.forEach(key => {
    const hasAny = ALL_DATA.some(e => e.dados[key] != null);
    if (!hasAny) return;

    const m  = MARKERS[key];
    const tr = document.createElement('tr');

    let cells = `<td class="td-name">${m.label}</td>`;

    ALL_DATA.forEach((e, i) => {
      const val = e.dados[key];
      const st  = statusOf(key, val);
      const isCurrent = i === ACTIVE_IDX;
      cells += `<td class="td-num ${st}" style="${isCurrent ? 'background:var(--bg);' : ''}">${fmtVal(key, val)}</td>`;
    });

    cells += `<td class="td-ref">${m.ref} ${m.unit}</td>`;
    tr.innerHTML = cells;
    wrap.appendChild(tr);
  });
}

init();
