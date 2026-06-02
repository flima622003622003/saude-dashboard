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
  if (!el) return;
  const sol = entry.solicitante ? entry.solicitante.replace(/UNIDADE.*$/i,'').trim() : '';
  const wrapper = document.getElementById('solicitante-info');
  if (sol) {
    el.textContent = 'Dr. ' + sol.charAt(0) + sol.slice(1).toLowerCase().replace(/ De / g,' de ').replace(/ Da /g,' da ');
    if (wrapper) wrapper.style.display = 'flex';
  } else {
    if (wrapper) wrapper.style.display = 'none';
  }
}

/* ── Render tudo com o exame ativo ─────────────────────────────── */
function renderAll() {
  const dados     = ALL_DATA[ACTIVE_IDX].dados;
  const prevDados = ACTIVE_IDX > 0 ? ALL_DATA[ACTIVE_IDX - 1].dados : null;
  const prevLabel = ACTIVE_IDX > 0 ? labelOf(ALL_DATA[ACTIVE_IDX - 1]) : null;

  buildHero(dados, prevDados);
  buildGlycemicCards(dados, prevDados, prevLabel);
  // Cards com barra visual para marcadores principais de cada seção
  buildSectionCards('cards-lipids',   dados, prevDados, ['colesterol_total','hdl','ldl','triglicerideos','lpa']);
  buildSectionCards('cards-renal',    dados, prevDados, ['etfg','creatinina','albumina_creatinina']);
  buildSectionCards('cards-hepatic',  dados, prevDados, ['ast','alt','ggt','cpk']);
  buildSectionCards('cards-hemo',     dados, prevDados, ['hemoglobina','leucocitos','plaquetas']);
  buildSectionCards('cards-vitamins', dados, prevDados, ['vitamina_d','vitamina_b12']);
  buildSectionCards('cards-thyroid',  dados, prevDados, ['tsh']);
  buildSectionCards('cards-other',    dados, prevDados, ['pcr_ultrasensivel','psa_total']);

  // Grades de marcadores secundários (sem card visual)
  buildMarkersGrid('grid-lipids',   dados, prevDados, ['nao_hdl','vldl','apo_a1','apo_b']);
  buildMarkersGrid('grid-renal',    dados, prevDados, ['ureia']);
  buildMarkersGrid('grid-hepatic',  dados, prevDados, []);
  buildMarkersGrid('grid-hemo',     dados, prevDados, ['hematocrito','eritrocitos']);
  buildMarkersGrid('grid-vitamins', dados, prevDados, ['acido_folico','ferro','ferritina','potassio','sodio','acido_urico']);
  buildMarkersGrid('grid-thyroid',  dados, prevDados, ['t4_livre','t3_livre']);
  buildMarkersGrid('grid-other',    dados, prevDados, ['vhs']);
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

/* ══════════════════════════════════════════════════════════════
   CONFIG DE TODOS OS MARCADORES COM BARRA VISUAL
   ══════════════════════════════════════════════════════════════ */
const CARD_CONFIG = {

  /* ── GLICEMIA ──────────────────────────────────────────────── */
  hba1c:       { label:'HbA1c',               unit:'%',      footer:'Média da glicemia nos 3 últimos meses', footerIcon:'ti-calendar',
                 scaleMin:4,    scaleMax:8,    okMax:5.7,  warnMax:6.5,
                 labels:['4%','5,7%','6,5%','8%'],
                 zones:[{cls:'normal',name:'Normal',val:'< 5,7%'},{cls:'pre',name:'Pré-DM',val:'5,7–6,4%'},{cls:'dm',name:'Diabetes',val:'≥ 6,5%'}] },

  glicose:     { label:'Glicemia de jejum',   unit:'mg/dL',  footer:'Coleta após 8h em jejum', footerIcon:'ti-moon',
                 scaleMin:60,   scaleMax:200,  okMax:99,   warnMax:125,
                 labels:['60','99','126','200'],
                 zones:[{cls:'normal',name:'Normal',val:'60–99'},{cls:'pre',name:'Pré-DM',val:'100–125'},{cls:'dm',name:'Diabetes',val:'≥ 126'}] },

  ttgo_60min:  { label:'Curva glicêmica (1h)',unit:'mg/dL',  footer:'Após 75g de dextrosol oral', footerIcon:'ti-droplet',
                 scaleMin:60,   scaleMax:270,  okMax:140,  warnMax:199,
                 labels:['60','140','200','270'],
                 zones:[{cls:'normal',name:'Normal',val:'< 140'},{cls:'pre',name:'Pré-DM',val:'140–199'},{cls:'dm',name:'Diabetes',val:'≥ 200'}] },

  /* ── CORAÇÃO / LIPÍDIOS ─────────────────────────────────────── */
  colesterol_total:{ label:'Colesterol total',  unit:'mg/dL', footer:'Quanto menor, melhor', footerIcon:'ti-heart',
                 scaleMin:80,   scaleMax:300,  okMax:190,  warnMax:239,
                 labels:['80','190','239','300'],
                 zones:[{cls:'normal',name:'Ótimo',val:'< 190'},{cls:'pre',name:'Limítrofe',val:'190–239'},{cls:'dm',name:'Alto',val:'≥ 240'}] },

  hdl:         { label:'HDL — colesterol bom', unit:'mg/dL', footer:'Quanto maior, mais proteção', footerIcon:'ti-heart',
                 scaleMin:20,   scaleMax:100,  okMin:40,   warnMin:35,   invertida:true,
                 labels:['20','35','40','100'],
                 zones:[{cls:'dm',name:'Baixo',val:'< 35'},{cls:'pre',name:'Atenção',val:'35–39'},{cls:'normal',name:'Bom',val:'≥ 40'}] },

  ldl:         { label:'LDL — colesterol mau', unit:'mg/dL', footer:'Quanto menor, melhor', footerIcon:'ti-heart',
                 scaleMin:0,    scaleMax:200,  okMax:130,  warnMax:159,
                 labels:['0','130','160','200'],
                 zones:[{cls:'normal',name:'Ótimo',val:'< 130'},{cls:'pre',name:'Limítrofe',val:'130–159'},{cls:'dm',name:'Alto',val:'≥ 160'}] },

  triglicerideos:{ label:'Triglicerídeos',     unit:'mg/dL', footer:'Influenciado por dieta e exercício', footerIcon:'ti-salad',
                 scaleMin:0,    scaleMax:400,  okMax:150,  warnMax:199,
                 labels:['0','150','200','400'],
                 zones:[{cls:'normal',name:'Normal',val:'< 150'},{cls:'pre',name:'Limítrofe',val:'150–199'},{cls:'dm',name:'Alto',val:'≥ 200'}] },

  lpa:         { label:'Lipoproteína(a)',       unit:'nmol/L',footer:'Fator genético — não muda com dieta', footerIcon:'ti-dna',
                 scaleMin:0,    scaleMax:200,  okMax:75,   warnMax:124,
                 labels:['0','75','125','200'],
                 zones:[{cls:'normal',name:'Normal',val:'< 75'},{cls:'pre',name:'Elevado',val:'75–124'},{cls:'dm',name:'Muito alto',val:'≥ 125'}] },

  /* ── RINS ───────────────────────────────────────────────────── */
  etfg:        { label:'Taxa de filtração renal (eTFG)', unit:'mL/min', footer:'Mede a capacidade dos rins de filtrar o sangue', footerIcon:'ti-filter',
                 scaleMin:0,    scaleMax:120,  okMin:90,   warnMin:60,   invertida:true,
                 labels:['0','60','90','120'],
                 zones:[{cls:'dm',name:'Reduzida',val:'< 60'},{cls:'pre',name:'Leve',val:'60–89'},{cls:'normal',name:'Normal',val:'≥ 90'}] },

  creatinina:  { label:'Creatinina',            unit:'mg/dL', footer:'Resíduo do metabolismo muscular', footerIcon:'ti-filter',
                 scaleMin:0.4,  scaleMax:2.0,  okMax:1.3,  warnMax:1.5,
                 labels:['0,4','1,3','1,5','2,0'],
                 zones:[{cls:'normal',name:'Normal',val:'0,7–1,3'},{cls:'pre',name:'Atenção',val:'1,3–1,5'},{cls:'dm',name:'Elevada',val:'> 1,5'}] },

  albumina_creatinina:{ label:'Albumina na urina', unit:'mg/g', footer:'Detecta dano renal precoce', footerIcon:'ti-filter',
                 scaleMin:0,    scaleMax:300,  okMax:30,   warnMax:299,
                 labels:['0','30','300','300+'],
                 zones:[{cls:'normal',name:'Normal',val:'< 30'},{cls:'pre',name:'Atenção',val:'30–299'},{cls:'dm',name:'Elevada',val:'≥ 300'}] },

  /* ── FÍGADO ─────────────────────────────────────────────────── */
  ast:         { label:'AST (TGO)',             unit:'U/L',   footer:'Enzima hepática e muscular', footerIcon:'ti-activity',
                 scaleMin:0,    scaleMax:120,  okMax:59,   warnMax:80,
                 labels:['0','59','80','120'],
                 zones:[{cls:'normal',name:'Normal',val:'17–59'},{cls:'pre',name:'Atenção',val:'60–80'},{cls:'dm',name:'Elevada',val:'> 80'}] },

  alt:         { label:'ALT (TGP)',             unit:'U/L',   footer:'Enzima mais específica do fígado', footerIcon:'ti-activity',
                 scaleMin:0,    scaleMax:150,  okMax:72,   warnMax:100,
                 labels:['0','72','100','150'],
                 zones:[{cls:'normal',name:'Normal',val:'21–72'},{cls:'pre',name:'Atenção',val:'73–100'},{cls:'dm',name:'Elevada',val:'> 100'}] },

  ggt:         { label:'GGT',                  unit:'U/L',   footer:'Sensível a gordura no fígado e álcool', footerIcon:'ti-activity',
                 scaleMin:0,    scaleMax:150,  okMax:78,   warnMax:100,
                 labels:['0','78','100','150'],
                 zones:[{cls:'normal',name:'Normal',val:'10–78'},{cls:'pre',name:'Atenção',val:'79–100'},{cls:'dm',name:'Elevada',val:'> 100'}] },

  cpk:         { label:'CPK — músculo',         unit:'U/L',   footer:'Pode subir com exercício ou estatina', footerIcon:'ti-run',
                 scaleMin:0,    scaleMax:400,  okMax:171,  warnMax:300,
                 labels:['0','171','300','400'],
                 zones:[{cls:'normal',name:'Normal',val:'46–171'},{cls:'pre',name:'Elevado',val:'172–300'},{cls:'dm',name:'Muito alto',val:'> 300'}] },

  /* ── SANGUE ─────────────────────────────────────────────────── */
  hemoglobina: { label:'Hemoglobina',           unit:'g/dL',  footer:'Proteína que transporta oxigênio', footerIcon:'ti-droplet',
                 scaleMin:9,    scaleMax:18,   okMin:13.5, warnMin:11,   invertida:true,
                 labels:['9','11','13,5','18'],
                 zones:[{cls:'dm',name:'Anemia',val:'< 11'},{cls:'pre',name:'Atenção',val:'11–13,5'},{cls:'normal',name:'Normal',val:'≥ 13,5'}] },

  leucocitos:  { label:'Glóbulos brancos',      unit:'/mm³',  footer:'Células de defesa do organismo', footerIcon:'ti-shield',
                 scaleMin:2000, scaleMax:14000, okMin:3600, okMax:11000,
                 labels:['2k','3,6k','11k','14k'],
                 zones:[{cls:'pre',name:'Baixo',val:'< 3.600'},{cls:'normal',name:'Normal',val:'3.600–11.000'},{cls:'pre',name:'Elevado',val:'> 11.000'}] },

  plaquetas:   { label:'Plaquetas',             unit:'/mm³',  footer:'Responsáveis pela coagulação', footerIcon:'ti-droplet',
                 scaleMin:50000,scaleMax:500000,okMin:140000,okMax:400000,
                 labels:['50k','140k','400k','500k'],
                 zones:[{cls:'pre',name:'Baixa',val:'< 140k'},{cls:'normal',name:'Normal',val:'140k–400k'},{cls:'pre',name:'Elevada',val:'> 400k'}] },

  /* ── VITAMINAS ──────────────────────────────────────────────── */
  vitamina_d:  { label:'Vitamina D',            unit:'ng/mL', footer:'Baixa vitamina D piora resistência à insulina', footerIcon:'ti-sun',
                 scaleMin:0,    scaleMax:80,   okMin:30,   warnMin:20,   invertida:true,
                 labels:['0','20','30','80'],
                 zones:[{cls:'dm',name:'Deficiente',val:'< 20'},{cls:'pre',name:'Insuficiente',val:'20–29'},{cls:'normal',name:'Normal',val:'≥ 30'}] },

  vitamina_b12:{ label:'Vitamina B12',          unit:'pg/mL', footer:'Essencial para nervos e hemácias', footerIcon:'ti-pill',
                 scaleMin:100,  scaleMax:1000, okMin:211,  okMax:911,
                 labels:['100','211','911','1000'],
                 zones:[{cls:'pre',name:'Baixa',val:'< 211'},{cls:'normal',name:'Normal',val:'211–911'},{cls:'pre',name:'Elevada',val:'> 911'}] },

  /* ── TIREOIDE ───────────────────────────────────────────────── */
  tsh:         { label:'TSH — tireoide',        unit:'µIU/mL',footer:'Hipotireoidismo piora a resistência à insulina', footerIcon:'ti-wave-sine',
                 scaleMin:0,    scaleMax:8,    okMin:0.55, okMax:4.78,
                 labels:['0','0,55','4,78','8'],
                 zones:[{cls:'pre',name:'Baixo',val:'< 0,55'},{cls:'normal',name:'Normal',val:'0,55–4,78'},{cls:'pre',name:'Alto',val:'> 4,78'}] },

  /* ── OUTROS ─────────────────────────────────────────────────── */
  pcr_ultrasensivel:{ label:'Inflamação (PCR)', unit:'mg/dL', footer:'Marcador de inflamação e risco cardíaco', footerIcon:'ti-flame',
                 scaleMin:0,    scaleMax:1,    okMax:0.10, warnMax:0.30,
                 labels:['0','0,10','0,30','1,0'],
                 zones:[{cls:'normal',name:'Baixo risco',val:'< 0,10'},{cls:'pre',name:'Moderado',val:'0,10–0,30'},{cls:'dm',name:'Alto risco',val:'> 0,30'}] },

  psa_total:   { label:'PSA — próstata',        unit:'ng/mL', footer:'Monitorar anualmente', footerIcon:'ti-microscope',
                 scaleMin:0,    scaleMax:8,    okMax:4.0,  warnMax:6.0,
                 labels:['0','4,0','6,0','8'],
                 zones:[{cls:'normal',name:'Normal',val:'< 4,0'},{cls:'pre',name:'Atenção',val:'4,0–6,0'},{cls:'dm',name:'Elevado',val:'> 6,0'}] },
};

/* ── Funções de cálculo da barra ────────────────────────────────── */
function cardZone(key, val) {
  const c = CARD_CONFIG[key];
  if (!c) return 'normal';
  if (c.invertida) {
    if (c.warnMin && val <= c.warnMin) return 'dm';
    if (c.okMin   && val <= c.okMin)   return 'pre';
    // faixa dupla (leucocitos, plaquetas)
    if (c.okMax   && val >= c.okMax)   return 'pre';
    return 'normal';
  }
  if (c.warnMax && val >= c.warnMax) return 'dm';
  if (c.okMax   && val >= c.okMax)   return 'pre';
  return 'normal';
}

function cardNeedlePct(key, val) {
  const c = CARD_CONFIG[key];
  if (!c) return 50;
  const pct = (val - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
  return Math.min(96, Math.max(4, pct));
}

function cardOkBarPct(key) {
  const c = CARD_CONFIG[key];
  if (!c) return 40;
  if (c.invertida && c.okMin) {
    return (c.okMin - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
  }
  if (c.okMax) {
    return (c.okMax - c.scaleMin) / (c.scaleMax - c.scaleMin) * 100;
  }
  return 50;
}

/* ── Constrói um card visual genérico ──────────────────────────── */
function buildCard(key, val, prev, prevLabel) {
  const c  = CARD_CONFIG[key];
  const m  = MARKERS[key];
  const st = statusOf(key, val);
  const zone   = cardZone(key, val);
  const pct    = cardNeedlePct(key, val);
  const okPct  = cardOkBarPct(key);

  // Tendência
  let trendHtml = '';
  if (prev != null) {
    const diff = val - prev;
    const pctD = Math.abs(diff / prev * 100).toFixed(1);
    if (Math.abs(diff) > 0.005) {
      const dir   = diff > 0 ? 'worsening' : 'improving';
      const arrow = diff > 0 ? '↑' : '↓';
      trendHtml = `<span class="gc-trend ${dir}" title="vs ${prevLabel}">${arrow} ${pctD}%</span>`;
    }
  } else {
    trendHtml = `<span class="gc-trend" style="color:var(--text3);font-size:10px">1º registro</span>`;
  }

  const badgeMap = { ok:['ok','✓ Normal'], warn:['warn','⚠ Atenção'], danger:['danger','↑ Alterado'] };
  const [bCls, bTxt] = badgeMap[st] || ['ok','—'];

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
  return card;
}

/* ── Constrói grade de cards para uma seção ─────────────────────── */
function buildSectionCards(containerId, dados, prev, keys) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  let any = false;

  keys.forEach(key => {
    const val = dados[key];
    if (val == null || !CARD_CONFIG[key]) return;
    any = true;
    const prevVal = prev ? prev[key] : null;
    container.appendChild(buildCard(key, val, prevVal, prev ? '—' : null));
  });

  const section = container.closest('.dyn-section');
  if (section) section.style.display = any ? '' : 'none';
}

/* ── Glicemia (mantém função própria para compatibilidade) ──────── */
function buildGlycemicCards(dados, prev, prevLabel) {
  const container = document.getElementById('glycemic-cards');
  container.innerHTML = '';
  const keys = ['hba1c','glicose'];
  if (dados.ttgo_60min != null) keys.push('ttgo_60min');
  keys.forEach(key => {
    const val = dados[key];
    if (val == null) return;
    container.appendChild(buildCard(key, val, prev ? prev[key] : null, prevLabel));
  });
}

/* ── Markers grid (marcadores sem card visual) ──────────────────── */
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

/* ── Idade dinâmica ─────────────────────────────────────────────── */
(function() {
  const nasc = new Date(1962, 9, 15); // 15/10/1962 — mês é base 0
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniver =
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniver) idade--;
  const el = document.getElementById('idade');
  if (el) el.textContent = idade + ' anos';
})();
