/* js/markers.js — definição dos marcadores */

const MARKERS = {
  glicose:               { label:'Glicemia em jejum',      unit:'mg/dL',  warn_hi:99,   danger_hi:126,            ref:'60–99',   section:'glycemic' },
  hba1c:                 { label:'Hemoglobina Glicada (HbA1c)', unit:'%', warn_hi:5.7,  danger_hi:6.5,            ref:'< 5,7',   section:'glycemic' },
  glicemia_media_estimada:{ label:'Glicemia média estimada', unit:'mg/dL', warn_hi:114, danger_hi:154,             ref:'< 114',   section:'glycemic' },
  ttgo_basal:            { label:'Curva glicêmica — basal', unit:'mg/dL', warn_hi:99,   danger_hi:126,            ref:'< 99',    section:'glycemic' },
  ttgo_60min:            { label:'Curva glicêmica — 1h',   unit:'mg/dL', warn_hi:140,  danger_hi:209,            ref:'< 140',   section:'glycemic' },
  ttgo_120min:           { label:'Curva glicêmica — 2h',   unit:'mg/dL', warn_hi:140,  danger_hi:200,            ref:'< 140',   section:'glycemic' },
  colesterol_total:      { label:'Colesterol total',        unit:'mg/dL', warn_hi:190,  danger_hi:240,            ref:'< 190',   section:'lipids'   },
  hdl:                   { label:'HDL — colesterol bom',   unit:'mg/dL', warn_lo:40,   danger_lo:35,             ref:'> 40',    section:'lipids'   },
  ldl:                   { label:'LDL — colesterol mau',   unit:'mg/dL', warn_hi:130,  danger_hi:160,            ref:'< 130',   section:'lipids'   },
  triglicerideos:        { label:'Triglicerídeos',          unit:'mg/dL', warn_hi:150,  danger_hi:200,            ref:'< 150',   section:'lipids'   },
  nao_hdl:               { label:'Colesterol não-HDL',      unit:'mg/dL', warn_hi:130,  danger_hi:160,            ref:'< 130',   section:'lipids'   },
  lpa:                   { label:'Lipoproteína(a)',          unit:'nmol/L',warn_hi:75,   danger_hi:125,            ref:'< 75',    section:'lipids'   },
  vldl:                  { label:'VLDL',                    unit:'mg/dL', warn_hi:20,                             ref:'< 20',    section:'lipids'   },
  apo_a1:                { label:'Apolipoproteína A-1',     unit:'mg/dL', warn_lo:110,                            ref:'110–170', section:'lipids'   },
  apo_b:                 { label:'Apolipoproteína B',       unit:'mg/dL', warn_hi:80,   danger_hi:100,            ref:'< 80',    section:'lipids'   },
  creatinina:            { label:'Creatinina',              unit:'mg/dL', warn_lo:0.7,  warn_hi:1.3, danger_hi:1.5,ref:'0,7–1,3',section:'renal'    },
  ureia:                 { label:'Ureia',                   unit:'mg/dL', warn_lo:15,   warn_hi:45,               ref:'15–45',   section:'renal'    },
  etfg:                  { label:'Taxa de filtração renal', unit:'mL/min',warn_lo:60,   danger_lo:45,             ref:'> 90',    section:'renal'    },
  albumina_creatinina:   { label:'Albumina na urina',       unit:'mg/g',  warn_hi:30,   danger_hi:300,            ref:'< 30',    section:'renal'    },
  ast:                   { label:'AST (TGO) — fígado',      unit:'U/L',   warn_lo:17,   warn_hi:59,               ref:'17–59',   section:'hepatic'  },
  alt:                   { label:'ALT (TGP) — fígado',      unit:'U/L',   warn_lo:21,   warn_hi:72,               ref:'21–72',   section:'hepatic'  },
  ggt:                   { label:'GGT — fígado',            unit:'U/L',   warn_hi:78,   danger_hi:100,            ref:'10–78',   section:'hepatic'  },
  cpk:                   { label:'CPK — músculo',           unit:'U/L',   warn_hi:171,  danger_hi:300,            ref:'46–171',  section:'hepatic'  },
  hemoglobina:           { label:'Hemoglobina',             unit:'g/dL',  warn_lo:13.5, danger_lo:11,             ref:'13,5–17,8',section:'hemo'    },
  hematocrito:           { label:'Hematócrito',             unit:'%',     warn_lo:41,                             ref:'41–54',   section:'hemo'     },
  eritrocitos:           { label:'Glóbulos vermelhos',      unit:'M/mm³', warn_lo:4.3,  warn_hi:6.0,              ref:'4,3–6,0', section:'hemo'     },
  leucocitos:            { label:'Glóbulos brancos',        unit:'/mm³',  warn_lo:3600, warn_hi:11000,            ref:'3.600–11.000',section:'hemo' },
  plaquetas:             { label:'Plaquetas',               unit:'/mm³',  warn_lo:140000,warn_hi:400000,          ref:'140k–400k',section:'hemo'    },
  vitamina_d:            { label:'Vitamina D',              unit:'ng/mL', warn_lo:20,                             ref:'> 30',    section:'vitamins' },
  vitamina_b12:          { label:'Vitamina B12',            unit:'pg/mL', warn_lo:211,  warn_hi:911,              ref:'211–911', section:'vitamins' },
  acido_folico:          { label:'Ácido fólico',            unit:'ng/mL', warn_lo:5,                              ref:'> 5',     section:'vitamins' },
  ferro:                 { label:'Ferro sérico',            unit:'µg/dL', warn_lo:65,   warn_hi:175,              ref:'65–175',  section:'vitamins' },
  ferritina:             { label:'Ferritina',               unit:'ng/mL', warn_lo:22,   warn_hi:322,              ref:'22–322',  section:'vitamins' },
  potassio:              { label:'Potássio',                unit:'mEq/L', warn_lo:3.5,  warn_hi:5.5,              ref:'3,5–5,5', section:'vitamins' },
  sodio:                 { label:'Sódio',                   unit:'mEq/L', warn_lo:132,  warn_hi:148,              ref:'132–148', section:'vitamins' },
  acido_urico:           { label:'Ácido úrico',             unit:'mg/dL', warn_hi:9.2,                            ref:'< 9,2',   section:'vitamins' },
  tsh:                   { label:'TSH — tireoide',          unit:'µIU/mL',warn_lo:0.55, warn_hi:4.78,             ref:'0,55–4,78',section:'thyroid' },
  t4_livre:              { label:'T4 livre — tireoide',     unit:'ng/dL', warn_lo:0.89, warn_hi:1.76,             ref:'0,89–1,76',section:'thyroid' },
  t3_livre:              { label:'T3 livre — tireoide',     unit:'pg/mL', warn_lo:2.3,  warn_hi:4.2,              ref:'2,3–4,2', section:'thyroid' },
  pcr_ultrasensivel:     { label:'Inflamação (PCR)',        unit:'mg/dL', warn_hi:0.10, danger_hi:0.30,           ref:'< 0,10',  section:'other'    },
  psa_total:             { label:'PSA — próstata',          unit:'ng/mL', warn_hi:4.0,                            ref:'< 4,0',   section:'other'    },
  vhs:                   { label:'VHS — inflamação',        unit:'mm/h',  warn_hi:20,                             ref:'< 20',    section:'other'    },

  /* ── PÂNCREAS E DIGESTIVO ──────────────────────────────────────────── */
  amilase:               { label:'Amilase',                  unit:'U/L',   warn_lo:30,  warn_hi:118,               ref:'30–118',  section:'pancreas' },
  lipase:                { label:'Lipase',                   unit:'U/L',   warn_lo:12,  warn_hi:53,                ref:'12–53',   section:'pancreas' },
  lactose_basal:         { label:'Lactose — basal',          unit:'mg/dL', warn_hi:99,  danger_hi:126,             ref:'60–99',   section:'pancreas' },
  lactose_30min:         { label:'Lactose — 30 min',         unit:'mg/dL', warn_hi:125,                            ref:'< 125',   section:'pancreas' },
  lactose_60min:         { label:'Lactose — 60 min',         unit:'mg/dL', warn_hi:125,                            ref:'< 125',   section:'pancreas' },
  anti_transglutaminase_iga: { label:'Anti Transglutaminase IgA', unit:'U/mL', warn_hi:7.0, danger_hi:10.0,        ref:'< 7,0',   section:'pancreas' },
  anti_endomisio_iga:    { label:'Anti Endomísio IgA',       unit:'',      warn_hi:0.5,                            ref:'Não Reagente', section:'pancreas' },
};

/* ── Utilitários ───────────────────────────────────────────────── */

function statusOf(key, val) {
  if (val == null) return 'neutral';
  const m = MARKERS[key];
  if (!m) return 'neutral';
  if ((m.danger_hi && val >= m.danger_hi) || (m.danger_lo && val <= m.danger_lo)) return 'danger';
  if ((m.warn_hi   && val >= m.warn_hi)   || (m.warn_lo   && val <= m.warn_lo))   return 'warn';
  return 'ok';
}

function fmtVal(key, val) {
  if (val == null) return '—';
  if (key === 'leucocitos' || key === 'plaquetas') return val.toLocaleString('pt-BR');
  if (Math.abs(val) >= 100) return Math.round(val).toString();
  return parseFloat(val.toFixed(2)).toString().replace('.', ',');
}

const MONTH_LABELS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
function labelOf(entry) {
  return MONTH_LABELS[entry.mes - 1] + '/' + String(entry.ano).slice(2);
}

/* Status em português para paciente */
function statusLabel(st) {
  if (st === 'ok')     return '✓ Normal';
  if (st === 'warn')   return '⚠ Atenção';
  if (st === 'danger') return '↑ Alterado';
  return '—';
}
