/* js/dashboard.js — v7 */

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
        <div style="font-size:48px;margin-bottom:16px">📂</div>
        <p style="font-weight:600;font-size:16px;margin-bottom:8px">Nenhum dado encontrado</p>
        <p style="font-size:13px;color:var(--text2);line-height:1.7">
          Rode <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">python3 extrair_exames.py</code>
          e faça upload do <code style="background:var(--surface2);padding:2px 6px;border-radius:4px">exames_data.json</code> para o GitHub.
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
    const src = entry.arquivo === 'histórico' ? 'extraído do histórico do laudo' : entry.arquivo;
    btn.title = src;
    btn.addEventListener('click', () => {
      ACTIVE_IDX = i;
      document.querySelectorAll('.date-btn').forEach((b, j) => b.classList.toggle('active', j === i));
      updateSolicitante();
      renderAll();
    });
    wrap.appendChild(btn);
  });
  updateSolicitante();
}

function updateSolicitante() {
  const entry = ALL_DATA[ACTIVE_IDX];
  const el = document.getElementById('solicitante-nome');
  const wrapper = document.getElementById('solicitante-info');
  if (!el || !wrapper) return;
  const raw = entry.solicitante ? entry.solicitante.replace(/UNIDADE.*$/i, '').trim() : '';
  if (raw) {
    const nome = raw.charAt(0) + raw.slice(1).toLowerCase()
      .replace(/ de /g, ' de ').replace(/ da /g, ' da ').replace(/ do /g, ' do ');
    el.textContent = 'Dr. ' + nome;
    el.style.fontStyle = 'normal';
    wrapper.style.display = 'flex';
  } else if (entry.arquivo === 'histórico') {
    el.textContent = 'Extraído do histórico do laudo';
    el.style.fontStyle = 'italic';
    wrapper.style.display = 'flex';
  } else {
    wrapper.style.display = 'none';
  }
}

/* ── Render tudo com exame ativo ────────────────────────────────── */
function renderAll() {
  const entry     = ALL_DATA[ACTIVE_IDX];
  const prev      = ACTIVE_IDX > 0 ? ALL_DATA[ACTIVE_IDX - 1] : null;
  const dados     = entry.dados;
  const prevDados = prev ? prev.dados : null;
  const prevLabel = prev ? labelOf(prev) : null;

  buildHero(dados, prevDados);
  buildGlycemicCards(dados, prevDados, prevLabel);
  buildSectionCards('cards-lipids',   dados, prevDados, prevLabel, ['colesterol_total','hdl','ldl','triglicerideos','lpa']);
  buildSectionCards('cards-renal',    dados, prevDados, prevLabel, ['etfg','creatinina','albumina_creatinina']);
  buildSectionCards('cards-hepatic',  dados, prevDados, prevLabel, ['ast','alt','ggt','cpk']);
  buildSectionCards('cards-hemo',     dados, prevDados, prevLabel, ['hemoglobina','leucocitos','plaquetas']);
  buildSectionCards('cards-vitamins', dados, prevDados, prevLabel, ['vitamina_d','vitamina_b12']);
  buildSectionCards('cards-thyroid',  dados, prevDados, prevLabel, ['tsh']);
  buildSectionCards('cards-other',    dados, prevDados, prevLabel, ['pcr_ultrasensivel','psa_total']);
  buildMarkersGrid('grid-lipids',   dados, prevDados, prevLabel, ['nao_hdl','vldl','apo_a1','apo_b']);
  buildMarkersGrid('grid-renal',    dados, prevDados, prevLabel, ['ureia']);
  buildMarkersGrid('grid-hemo',     dados, prevDados, prevLabel, ['hematocrito','eritrocitos']);
  buildMarkersGrid('grid-vitamins', dados, prevDados, prevLabel, ['acido_folico','ferro','ferritina','potassio','sodio','acido_urico']);
  buildMarkersGrid('grid-thyroid',  dados, prevDados, prevLabel, ['t4_livre','t3_livre']);
  buildMarkersGrid('grid-other',    dados, prevDados, prevLabel, ['vhs']);
  buildEvoTable();
}

/* ── Hero ────────────────────────────────────────────────────────── */
function buildHero(dados, prev) {
  const hba1c = dados.hba1c;
  let title, desc, pillClass;

  if (!hba1c) {
    title = 'Sem dados de HbA1c neste exame'; desc = ''; pillClass = 'ok';
  } else if (hba1c >= 6.5) {
    title = 'Zona de diabetes — procure seu médico';
    desc  = 'HbA1c de ' + fmtVal('hba1c', hba1c) + '% está acima de 6,5%. Consulte seu endocrinologista para iniciar tratamento.';
    pillClass = 'danger';
  } else if (hba1c >= 5.7) {
    title = 'Pré-diabetes — controlável com hábitos';
    desc  = 'HbA1c de ' + fmtVal('hba1c', hba1c) + '% está na zona de pré-diabetes (5,7–6,4%). Com alimentação e exercício é possível voltar ao normal.';
    pillClass = 'warn';
  } else {
    title = 'Glicemia dentro do normal!';
    desc  = 'HbA1c de ' + fmtVal('hba1c', hba1c) + '% está abaixo de 5,7%. Continue com os bons hábitos.';
    pillClass = 'ok';
  }

  document.getElementById('hero-title').textContent = title;
  document.getElementById('hero-desc').textContent  = desc;

  const pill = document.getElementById('status-pill');
  pill.className = 'status-badge ' + pillClass;
  const labels = { ok: 'Glicemia normal', warn: 'Pré-diabético', danger: 'Zona de diabetes' };
  pill.innerHTML = '<span class="status-dot"></span><span>' + labels[pillClass] + '</span>';

  if (hba1c) {
    const pct   = Math.min(96, Math.max(4, (hba1c - 4.5) / (8.5 - 4.5) * 100));
    const color = hba1c >= 6.5 ? 'var(--red-text)' : hba1c >= 5.7 ? 'var(--amber-text)' : 'var(--green-text)';
    document.getElementById('needle').style.left = pct + '%';
    document.getElementById('hero-value').textContent = fmtVal('hba1c', hba1c) + '%';
    document.getElementById('hero-value').style.color = color;
  }
}

/* ══════════════════════════════════════════════════════════════════
   CONFIG DOS CARDS VISUAIS — todas as seções
══════════════════════════════════════════════════════════════════ */
const CARD_CONFIG = {

  /* GLICEMIA */
  hba1c:        { label:'HbA1c', unit:'%', footer:'Média da glicemia nos 3 últimos meses', footerIcon:'ti-calendar',
                  scaleMin:4, scaleMax:8, okMax:5.7, warnMax:6.5,
                  labels:['4%','5,7%','6,5%','8%'],
                  zones:[{cls:'normal',name:'Normal',val:'< 5,7%'},{cls:'pre',name:'Pré-DM',val:'5,7–6,4%'},{cls:'dm',name:'Diabetes',val:'≥ 6,5%'}] },

  glicose:      { label:'Glicemia de jejum', unit:'mg/dL', footer:'Coleta após 8h em jejum', footerIcon:'ti-moon',
                  scaleMin:60, scaleMax:200, okMax:99, warnMax:125,
                  labels:['60','99','126','200'],
                  zones:[{cls:'normal',name:'Normal',val:'60–99'},{cls:'pre',name:'Pré-DM',val:'100–125'},{cls:'dm',name:'Diabetes',val:'≥ 126'}] },

  ttgo_60min:   { label:'Curva glicêmica (1h)', unit:'mg/dL', footer:'Após 75g de dextrosol oral', footerIcon:'ti-droplet',
                  scaleMin:60, scaleMax:270, okMax:140, warnMax:199,
                  labels:['60','140','200','270'],
                  zones:[{cls:'normal',name:'Normal',val:'< 140'},{cls:'pre',name:'Pré-DM',val:'140–199'},{cls:'dm',name:'Diabetes',val:'≥ 200'}] },

  /* CORAÇÃO */
  colesterol_total: { label:'Colesterol total', unit:'mg/dL', footer:'Quanto menor, melhor', footerIcon:'ti-heart',
                  scaleMin:80, scaleMax:300, okMax:190, warnMax:239,
                  labels:['80','190','239','300'],
                  zones:[{cls:'normal',name:'Ótimo',val:'< 190'},{cls:'pre',name:'Limítrofe',val:'190–239'},{cls:'dm',name:'Alto',val:'≥ 240'}] },

  hdl:          { label:'HDL — colesterol bom', unit:'mg/dL', footer:'Quanto maior, mais proteção', footerIcon:'ti-heart',
                  scaleMin:20, scaleMax:100, invertida:true, okMin:40, warnMin:35,
                  labels:['20','35','40','100'],
                  zones:[{cls:'dm',name:'Baixo',val:'< 35'},{cls:'pre',name:'Atenção',val:'35–39'},{cls:'normal',name:'Bom',val:'≥ 40'}] },

  ldl:          { label:'LDL — colesterol mau', unit:'mg/dL', footer:'Quanto menor, melhor', footerIcon:'ti-heart',
                  scaleMin:0, scaleMax:200, okMax:130, warnMax:159,
                  labels:['0','130','160','200'],
                  zones:[{cls:'normal',name:'Ótimo',val:'< 130'},{cls:'pre',name:'Limítrofe',val:'130–159'},{cls:'dm',name:'Alto',val:'≥ 160'}] },

  triglicerideos: { label:'Triglicerídeos', unit:'mg/dL', footer:'Influenciado por dieta e exercício', footerIcon:'ti-salad',
                  scaleMin:0, scaleMax:400, okMax:150, warnMax:199,
                  labels:['0','150','200','400'],
                  zones:[{cls:'normal',name:'Normal',val:'< 150'},{cls:'pre',name:'Limítrofe',val:'150–199'},{cls:'dm',name:'Alto',val:'≥ 200'}] },

  lpa:          { label:'Lipoproteína(a)', unit:'nmol/L', footer:'Fator genético — não muda com dieta', footerIcon:'ti-dna',
                  scaleMin:0, scaleMax:200, okMax:75, warnMax:124,
                  labels:['0','75','125','200'],
                  zones:[{cls:'normal',name:'Normal',val:'< 75'},{cls:'pre',name:'Elevado',val:'75–124'},{cls:'dm',name:'Muito alto',val:'≥ 125'}] },

  /* RINS */
  etfg:         { label:'Taxa de filtração renal', unit:'mL/min', footer:'Capacidade dos rins de filtrar o sangue', footerIcon:'ti-filter',
                  scaleMin:0, scaleMax:120, invertida:true, okMin:90, warnMin:60,
                  labels:['0','60','90','120'],
                  zones:[{cls:'dm',name:'Reduzida',val:'< 60'},{cls:'pre',name:'Leve',val:'60–89'},{cls:'normal',name:'Normal',val:'≥ 90'}] },

  creatinina:   { label:'Creatinina', unit:'mg/dL', footer:'Resíduo do metabolismo muscular', footerIcon:'ti-filter',
                  scaleMin:0.4, scaleMax:2.0, okMax:1.3, warnMax:1.5,
                  labels:['0,4','1,3','1,5','2,0'],
                  zones:[{cls:'normal',name:'Normal',val:'0,7–1,3'},{cls:'pre',name:'Atenção',val:'1,3–1,5'},{cls:'dm',name:'Elevada',val:'> 1,5'}] },

  albumina_creatinina: { label:'Albumina na urina', unit:'mg/g', footer:'Detecta dano renal precoce', footerIcon:'ti-filter',
                  scaleMin:0, scaleMax:300, okMax:30, warnMax:299,
                  labels:['0','30','300','300+'],
                  zones:[{cls:'normal',name:'Normal',val:'< 30'},{cls:'pre',name:'Atenção',val:'30–299'},{cls:'dm',name:'Elevada',val:'≥ 300'}] },

  /* FÍGADO */
  ast:          { label:'AST (TGO)', unit:'U/L', footer:'Enzima hepática e muscular', footerIcon:'ti-activity',
                  scaleMin:0, scaleMax:120, okMax:59, warnMax:80,
                  labels:['0','59','80','120'],
                  zones:[{cls:'normal',name:'Normal',val:'17–59'},{cls:'pre',name:'Atenção',val:'60–80'},{cls:'dm',name:'Elevada',val:'> 80'}] },

  alt:          { label:'ALT (TGP)', unit:'U/L', footer:'Enzima mais específica do fígado', footerIcon:'ti-activity',
                  scaleMin:0, scaleMax:150, okMax:72, warnMax:100,
                  labels:['0','72','100','150'],
                  zones:[{cls:'normal',name:'Normal',val:'21–72'},{cls:'pre',name:'Atenção',val:'73–100'},{cls:'dm',name:'Elevada',val:'> 100'}] },

  ggt:          { label:'GGT', unit:'U/L', footer:'Sensível a gordura no fígado e álcool', footerIcon:'ti-activity',
                  scaleMin:0, scaleMax:150, okMax:78, warnMax:100,
                  labels:['0','78','100','150'],
                  zones:[{cls:'normal',name:'Normal',val:'10–78'},{cls:'pre',name:'Atenção',val:'79–100'},{cls:'dm',name:'Elevada',val:'> 100'}] },

  cpk:          { label:'CPK — músculo', unit:'U/L', footer:'Pode subir com exercício intenso ou estatina', footerIcon:'ti-run',
                  scaleMin:0, scaleMax:400, okMax:171, warnMax:300,
                  labels:['0','171','300','400'],
                  zones:[{cls:'normal',name:'Normal',val:'46–171'},{cls:'pre',name:'Elevado',val:'172–300'},{cls:'dm',name:'Muito alto',val:'> 300'}] },

  /* SANGUE */
  hemoglobina:  { label:'Hemoglobina', unit:'g/dL', footer:'Proteína que transporta oxigênio', footerIcon:'ti-droplet',
                  scaleMin:9, scaleMax:18, invertida:true, okMin:13.5, warnMin:11,
                  labels:['9','11','13,5','18'],
                  zones:[{cls:'dm',name:'Anemia',val:'< 11'},{cls:'pre',name:'Atenção',val:'11–13,5'},{cls:'normal',name:'Normal',val:'≥ 13,5'}] },

  leucocitos:   { label:'Glóbulos brancos', unit:'/mm³', footer:'Células de defesa do organismo', footerIcon:'ti-shield',
                  scaleMin:2000, scaleMax:14000, okMin:3600, okMax:11000, dupla:true,
                  labels:['2k','3,6k','11k','14k'],
                  zones:[{cls:'pre',name:'Baixo',val:'< 3.600'},{cls:'normal',name:'Normal',val:'3.600–11.000'},{cls:'pre',name:'Elevado',val:'> 11.000'}] },

  plaquetas:    { label:'Plaquetas', unit:'/mm³', footer:'Responsáveis pela coagulação', footerIcon:'ti-droplet',
                  scaleMin:50000, scaleMax:500000, okMin:140000, okMax:400000, dupla:true,
                  labels:['50k','140k','400k','500k'],
                  zones:[{cls:'pre',name:'Baixa',val:'< 140k'},{cls:'normal',name:'Normal',val:'140k–400k'},{cls:'pre',name:'Elevada',val:'> 400k'}] },

  /* VITAMINAS */
  vitamina_d:   { label:'Vitamina D', unit:'ng/mL', footer:'Baixa vitamina D piora resistência à insulina', footerIcon:'ti-sun',
                  scaleMin:0, scaleMax:80, invertida:true, okMin:30, warnMin:20,
                  labels:['0','20','30','80'],
                  zones:[{cls:'dm',name:'Deficiente',val:'< 20'},{cls:'pre',name:'Insuficiente',val:'20–29'},{cls:'normal',name:'Normal',val:'≥ 30'}] },

  vitamina_b12: { label:'Vitamina B12', unit:'pg/mL', footer:'Essencial para nervos e hemácias', footerIcon:'ti-pill',
                  scaleMin:100, scaleMax:1000, okMin:211, okMax:911, dupla:true,
                  labels:['100','211','911','1000'],
                  zones:[{cls:'pre',name:'Baixa',val:'< 211'},{cls:'normal',name:'Normal',val:'211–911'},{cls:'pre',name:'Elevada',val:'> 911'}] },

  /* TIREOIDE */
  tsh:          { label:'TSH — tireoide', unit:'µIU/mL', footer:'Hipotireoidismo piora resistência à insulina', footerIcon:'ti-wave-sine',
                  scaleMin:0, scaleMax:8, okMin:0.55, okMax:4.78, dupla:true,
                  labels:['0','0,55','4,78','8'],
                  zones:[{cls:'pre',name:'Baixo',val:'< 0,55'},{cls:'normal',name:'Normal',val:'0,55–4,78'},{cls:'pre',name:'Alto',val:'> 4,78'}] },

  /* OUTROS */
  pcr_ultrasensivel: { label:'Inflamação (PCR)', unit:'mg/dL', footer:'Marcador de inflamação e risco cardíaco', footerIcon:'ti-flame',
                  scaleMin:0, scaleMax:1, okMax:0.10, warnMax:0.30,
                  labels:['0','0,10','0,30','1,0'],
                  zones:[{cls:'normal',name:'Baixo risco',val:'< 0,10'},{cls:'pre',name:'Moderado',val:'0,10–0,30'},{cls:'dm',name:'Alto risco',val:'> 0,30'}] },

  psa_total:    { label:'PSA — próstata', unit:'ng/mL', footer:'Monitorar anualmente', footerIcon:'ti-microscope',
                  scaleMin:0, scaleMax:8, okMax:4.0, warnMax:6.0,
                  labels:['0','4,0','6,0','8'],
                  zones:[{cls:'normal',name:'Normal',val:'< 4,0'},{cls:'pre',name:'Atenção',val:'4,0–6,0'},{cls:'dm',name:'Elevado',val:'> 6,0'}] },
};

/* ── Cálculos da barra ──────────────────────────────────────────── */
function cardZone(key, val) {
  const c = CARD_CONFIG[key];
  if (!c) return 'normal';
  if (c.dupla) {
    if ((c.okMin && val < c.okMin) || (c.okMax && val > c.okMax)) return 'pre';
    return 'normal';
  }
  if (c.invertida) {
    if (c.warnMin && val <= c.warnMin) return 'dm';
    if (c.okMin   && val <= c.okMin)   return 'pre';
    return 'normal';
  }
  if (c.warnMax && val >= c.warnMax) return 'dm';
  if (c.okMax   && val >= c.okMax)   return 'pre';
  return 'normal';
}

function cardNeedlePct(key, val) {
  const c = CARD_CONFIG[key];
  if (!c) return 50;
  return Math.min(96, Math.max(4, (val - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100));
}

function cardOkBarPct(key) {
  const c = CARD_CONFIG[key];
  if (!c) return 40;
  if (c.invertida && c.okMin) return (c.okMin - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
  if (c.okMax) return (c.okMax - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
  return 50;
}

/* ── Constrói um card visual ────────────────────────────────────── */
function buildCard(key, val, prevVal, prevLabel) {
  const c    = CARD_CONFIG[key];
  const m    = MARKERS[key];
  const st   = statusOf(key, val);
  const zone = cardZone(key, val);
  const pct  = cardNeedlePct(key, val);
  const okPct = cardOkBarPct(key);

  let trendHtml = '';
  if (prevVal != null) {
    const diff = val - prevVal;
    const pctD = Math.abs(diff / prevVal * 100).toFixed(1);
    if (Math.abs(diff) > 0.005) {
      const dir   = diff > 0 ? 'worsening' : 'improving';
      const arrow = diff > 0 ? '↑' : '↓';
      trendHtml = '<span class="gc-trend ' + dir + '" title="vs ' + prevLabel + '">' + arrow + ' ' + pctD + '%</span>';
    }
  } else {
    trendHtml = '<span class="gc-trend" style="color:var(--text3);font-size:10px">1º registro</span>';
  }

  const badgeMap = { ok:['ok','✓ Normal'], warn:['warn','⚠ Atenção'], danger:['danger','↑ Alterado'] };
  const bArr = badgeMap[st] || ['ok','—'];
  const bCls = bArr[0], bTxt = bArr[1];

  const zonesHtml = c.zones.map(function(z) {
    return '<div class="gc-zone ' + z.cls + (zone === z.cls ? ' active' : '') + '">' +
      '<span class="gc-zone-name">' + z.name + '</span>' +
      '<span class="gc-zone-val">' + z.val + '</span>' +
      '</div>';
  }).join('');

  const card = document.createElement('div');
  card.className = 'gc-card ' + st;
  card.innerHTML =
    '<div class="gc-header">' +
      '<span class="gc-label">' + c.label + '</span>' +
      '<span class="gc-badge ' + bCls + '">' +
        '<i class="ti ' + (bCls === 'ok' ? 'ti-check' : 'ti-alert-triangle') + '" aria-hidden="true" style="font-size:10px"></i> ' +
        bTxt +
      '</span>' +
    '</div>' +
    '<div class="gc-value-row">' +
      '<span class="gc-value">' + fmtVal(key, val) + '</span>' +
      '<span class="gc-unit">' + m.unit + '</span>' +
      trendHtml +
    '</div>' +
    '<div class="gc-range">' +
      '<div class="gc-bar-track">' +
        '<div class="gc-bar-ok" style="width:' + okPct + '%"></div>' +
        '<div class="gc-needle" style="left:' + pct + '%"></div>' +
      '</div>' +
      '<div class="gc-range-labels">' +
        c.labels.map(function(l) { return '<span class="gc-range-label">' + l + '</span>'; }).join('') +
      '</div>' +
    '</div>' +
    '<div class="gc-zones">' + zonesHtml + '</div>' +
    '<div class="gc-sep"></div>' +
    '<div class="gc-footer">' +
      '<i class="ti ' + c.footerIcon + '" aria-hidden="true"></i> ' +
      c.footer +
    '</div>';

  return card;
}

/* ── Grade de cards para uma seção ─────────────────────────────── */
function buildSectionCards(containerId, dados, prev, prevLabel, keys) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  let any = false;
  keys.forEach(function(key) {
    const val = dados[key];
    if (val == null || !CARD_CONFIG[key]) return;
    any = true;
    const prevVal = prev ? prev[key] : null;
    container.appendChild(buildCard(key, val, prevVal, prevLabel));
  });
  const section = container.closest('.dyn-section');
  if (section) section.style.display = any ? '' : 'none';
}

/* ── Glicemia ───────────────────────────────────────────────────── */
function buildGlycemicCards(dados, prev, prevLabel) {
  const container = document.getElementById('glycemic-cards');
  container.innerHTML = '';
  const keys = ['hba1c', 'glicose'];
  if (dados.ttgo_60min != null) keys.push('ttgo_60min');
  keys.forEach(function(key) {
    const val = dados[key];
    if (val == null) return;
    const prevVal = prev ? prev[key] : null;
    container.appendChild(buildCard(key, val, prevVal, prevLabel));
  });
}

/* ── Markers grid (secundários) ─────────────────────────────────── */
function buildMarkersGrid(id, dados, prev, prevLabel, keys) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = '';
  let any = false;
  keys.forEach(function(key) {
    const val = dados[key];
    if (val == null) return;
    any = true;
    const m   = MARKERS[key];
    const st  = statusOf(key, val);
    const prevVal = prev ? prev[key] : null;
    let trendHtml = '';
    if (prevVal != null) {
      const diff = val - prevVal;
      const pctD = Math.abs(diff / prevVal * 100).toFixed(0);
      if (Math.abs(diff) > 0.005) {
        const dir   = diff > 0 ? 'worsening' : 'improving';
        const arrow = diff > 0 ? '↑' : '↓';
        const color = dir === 'improving' ? 'var(--green-text)' : 'var(--red-text)';
        trendHtml = '<div class="mr-trend" style="color:' + color + '">' + arrow + ' ' + pctD + '%</div>';
      }
    }
    const row = document.createElement('div');
    row.className = 'marker-row ' + st;
    row.innerHTML =
      '<div><div class="mr-name">' + m.label + '</div><div class="mr-ref">Ref: ' + m.ref + ' ' + m.unit + '</div></div>' +
      '<div><div class="mr-val">' + fmtVal(key, val) + '</div><div class="mr-unit">' + m.unit + '</div>' + trendHtml + '</div>';
    container.appendChild(row);
  });
  const section = container.closest('.dyn-section');
  if (section) section.style.display = any ? '' : 'none';
}

/* ── Dropdowns das seções secundárias ───────────────────────────── */
function toggleSection(id) {
  const panel   = document.getElementById(id + '-panel');
  const chevron = document.getElementById(id + '-chevron');
  const hint    = document.getElementById(id + '-hint');
  const btn     = document.getElementById(id + '-toggle');
  const open    = panel.style.display === 'none';
  panel.style.display     = open ? '' : 'none';
  chevron.style.transform = open ? 'rotate(180deg)' : '';
  hint.textContent        = open ? 'Recolher' : 'Expandir';
  btn.setAttribute('aria-expanded', open);
}

/* ── Tabela de evolução ─────────────────────────────────────────── */
function buildEvoTable() {
  const dates = ALL_DATA.map(labelOf);
  const thead = document.getElementById('evo-table-head');
  thead.innerHTML = '<th>Exame</th>' + dates.map(function(d) { return '<th>' + d + '</th>'; }).join('') + '<th>Meta</th>';
  const tbody = document.getElementById('evo-table-body');
  tbody.innerHTML = '';
  Object.keys(MARKERS).forEach(function(key) {
    if (!ALL_DATA.some(function(e) { return e.dados[key] != null; })) return;
    const m  = MARKERS[key];
    const tr = document.createElement('tr');
    let cells = '<td class="td-name">' + m.label + '</td>';
    ALL_DATA.forEach(function(e, i) {
      const val = e.dados[key];
      const st  = statusOf(key, val);
      const cur = i === ACTIVE_IDX ? ' current' : '';
      cells += '<td class="td-num ' + st + cur + '">' + fmtVal(key, val) + '</td>';
    });
    cells += '<td class="td-ref">' + m.ref + ' ' + m.unit + '</td>';
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
  panel.style.display     = open ? '' : 'none';
  chevron.style.transform = open ? 'rotate(180deg)' : '';
  hint.textContent        = open ? 'Recolher' : 'Expandir';
  btn.setAttribute('aria-expanded', open);
}

/* ── Idade dinâmica ─────────────────────────────────────────────── */
(function() {
  const nasc = new Date(1962, 9, 15);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const antes = hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (antes) idade--;
  const el = document.getElementById('idade');
  if (el) el.textContent = idade + ' anos';
})();

// init() é chamado pelo auth.js após login autorizado
window.startDashboard = init;
