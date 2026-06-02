/* ═══════════════════════════════════════════════
   js/markers.js
   Definição de todos os marcadores laboratoriais:
   nome, unidade, limites de referência e seção.
   ═══════════════════════════════════════════════ */

const MARKERS = {
  /* ── GLICEMIA ─────────────────────────────────────────────────────── */
  glicose: {
    label: 'Glicemia jejum', unit: 'mg/dL',
    warn_hi: 99, danger_hi: 126,
    section: 'glycemic',
    info: 'Meta: abaixo de 99 mg/dL. Acima disso indica que o fígado produz glicose em excesso durante a madrugada (fenômeno do amanhecer).'
  },
  hba1c: {
    label: 'HbA1c', unit: '%',
    warn_hi: 5.7, danger_hi: 6.5,
    section: 'glycemic',
    info: 'Reflete a média glicêmica dos últimos 3 meses. Normal: <5,7%. Pré-diabetes: 5,7–6,4%. Diabetes: ≥6,5%.'
  },
  glicemia_media_estimada: {
    label: 'Glic. média estimada', unit: 'mg/dL',
    warn_hi: 114, danger_hi: 154,
    section: 'glycemic',
    info: 'Calculada a partir da HbA1c. Representa a glicemia média dos últimos 3 meses.'
  },
  ttgo_basal: {
    label: 'TTGO — basal',   unit: 'mg/dL', warn_hi: 99,  danger_hi: 126, section: 'glycemic',
    info: 'Glicemia antes da ingestão de dextrosol. Deve estar abaixo de 99 mg/dL.'
  },
  ttgo_60min: {
    label: 'TTGO — 60 min',  unit: 'mg/dL', warn_hi: 140, danger_hi: 209, section: 'glycemic',
    info: 'Glicemia 1 hora após 75g de dextrosol. Acima de 140 indica resistência à insulina.'
  },
  ttgo_120min: {
    label: 'TTGO — 120 min', unit: 'mg/dL', warn_hi: 140, danger_hi: 200, section: 'glycemic',
    info: 'Glicemia 2 horas após 75g de dextrosol. Acima de 200 confirma diabetes.'
  },

  /* ── LIPÍDIOS ─────────────────────────────────────────────────────── */
  colesterol_total: {
    label: 'Colesterol total', unit: 'mg/dL',
    warn_hi: 190, danger_hi: 240,
    section: 'lipids',
    info: 'Meta geral: <190 mg/dL. Queda de 238 → 121 mg/dL indica provável uso de estatina.'
  },
  hdl: {
    label: 'HDL (bom)', unit: 'mg/dL',
    warn_lo: 40, danger_lo: 35,
    section: 'lipids',
    info: 'Quanto maior, melhor. HDL alto protege contra doenças cardiovasculares.'
  },
  ldl: {
    label: 'LDL (mau)', unit: 'mg/dL',
    warn_hi: 130, danger_hi: 160,
    section: 'lipids',
    info: 'Quanto menor, melhor. Meta varia conforme risco cardiovascular individual.'
  },
  triglicerideos: {
    label: 'Triglicerídeos', unit: 'mg/dL',
    warn_hi: 150, danger_hi: 200,
    section: 'lipids',
    info: 'Muito influenciado por dieta e exercício. Meta: <150 mg/dL com jejum.'
  },
  vldl: {
    label: 'VLDL', unit: 'mg/dL',
    warn_hi: 20,
    section: 'lipids',
    info: 'Transporta triglicerídeos. Meta: <20 mg/dL.'
  },
  nao_hdl: {
    label: 'Não-HDL', unit: 'mg/dL',
    warn_hi: 130, danger_hi: 160,
    section: 'lipids',
    info: 'Soma de todas as lipoproteínas aterogênicas. Meta: <130 mg/dL.'
  },
  lpa: {
    label: 'Lipoproteína(a)', unit: 'nmol/L',
    warn_hi: 75, danger_hi: 125,
    section: 'lipids',
    info: '⚠ FATOR GENÉTICO: não é controlável por dieta. Acima de 75 nmol/L aumenta risco cardiovascular. Requer avaliação cardiológica.'
  },
  apo_a1: {
    label: 'Apolipoproteína A-1', unit: 'mg/dL',
    warn_lo: 110,
    section: 'lipids',
    info: 'Componente estrutural do HDL. Valores normais: 110–170 mg/dL.'
  },
  apo_b: {
    label: 'Apolipoproteína B', unit: 'mg/dL',
    warn_hi: 80, danger_hi: 100,
    section: 'lipids',
    info: 'Marcador de partículas aterogênicas. Meta: <80 mg/dL.'
  },

  /* ── FUNÇÃO RENAL ─────────────────────────────────────────────────── */
  creatinina: {
    label: 'Creatinina', unit: 'mg/dL',
    warn_lo: 0.7, warn_hi: 1.3, danger_hi: 1.5,
    section: 'renal',
    info: 'Produto do metabolismo muscular. Acima de 1,3 mg/dL pode indicar redução da filtração renal.'
  },
  ureia: {
    label: 'Ureia', unit: 'mg/dL',
    warn_lo: 15, warn_hi: 45,
    section: 'renal',
    info: 'Produto do metabolismo proteico. Valores normais: 15–45 mg/dL.'
  },
  etfg: {
    label: 'eTFG (rim)', unit: 'mL/min',
    warn_lo: 60, danger_lo: 45,
    section: 'renal',
    info: 'Estimativa da filtração glomerular. Meta: >90. 60–89 = G2 (levemente reduzida). <60 = investigar.'
  },
  albumina_creatinina: {
    label: 'Albumina/Creatinina', unit: 'mg/g',
    warn_hi: 30, danger_hi: 300,
    section: 'renal',
    info: 'Detecta dano renal precoce. <30 mg/g é normal. Acima disso indica início de lesão renal.'
  },

  /* ── FUNÇÃO HEPÁTICA ──────────────────────────────────────────────── */
  ast: {
    label: 'AST (TGO)', unit: 'U/L',
    warn_lo: 17, warn_hi: 59,
    section: 'hepatic',
    info: 'Enzima hepática e muscular. Valores normais: 17–59 U/L.'
  },
  alt: {
    label: 'ALT (TGP)', unit: 'U/L',
    warn_lo: 21, warn_hi: 72,
    section: 'hepatic',
    info: 'Enzima mais específica do fígado. Elevação persistente merece investigação de esteatose.'
  },
  ggt: {
    label: 'GGT', unit: 'U/L',
    warn_hi: 78, danger_hi: 100,
    section: 'hepatic',
    info: 'Sensível a álcool, gordura hepática e alguns medicamentos. Subindo progressivamente — acompanhar.'
  },
  cpk: {
    label: 'CPK', unit: 'U/L',
    warn_hi: 171, danger_hi: 300,
    section: 'hepatic',
    info: 'Enzima muscular. Elevação pode ser por exercício intenso, estatina ou lesão muscular.'
  },

  /* ── HEMOGRAMA ────────────────────────────────────────────────────── */
  hemoglobina: {
    label: 'Hemoglobina', unit: 'g/dL',
    warn_lo: 13.5, danger_lo: 11,
    section: 'hemo',
    info: 'Abaixo de 13,5 g/dL em homens indica anemia. Vem subindo — boa tendência.'
  },
  hematocrito: {
    label: 'Hematócrito', unit: '%',
    warn_lo: 41,
    section: 'hemo',
    info: 'Porcentagem de glóbulos vermelhos no sangue. Meta: 41–54% em homens.'
  },
  eritrocitos: {
    label: 'Eritrócitos', unit: 'M/mm³',
    warn_lo: 4.3, warn_hi: 6.0,
    section: 'hemo',
    info: 'Contagem de glóbulos vermelhos. Normal: 4,3–6,0 milhões/mm³.'
  },
  leucocitos: {
    label: 'Leucócitos', unit: '/mm³',
    warn_lo: 3600, warn_hi: 11000,
    section: 'hemo',
    info: 'Células de defesa. Normal: 3.600–11.000/mm³.'
  },
  plaquetas: {
    label: 'Plaquetas', unit: '/mm³',
    warn_lo: 140000, warn_hi: 400000,
    section: 'hemo',
    info: 'Responsáveis pela coagulação. Normal: 140.000–400.000/mm³.'
  },

  /* ── VITAMINAS E MINERAIS ─────────────────────────────────────────── */
  vitamina_d: {
    label: 'Vitamina D', unit: 'ng/mL',
    warn_lo: 20,
    section: 'vitamins',
    info: 'Deficiência de vitamina D está associada a maior resistência à insulina. Meta: 30–60 ng/mL.'
  },
  vitamina_b12: {
    label: 'Vitamina B12', unit: 'pg/mL',
    warn_lo: 211, warn_hi: 911,
    section: 'vitamins',
    info: 'Importante para sistema nervoso e produção de hemácias. Normal: 211–911 pg/mL.'
  },
  acido_folico: {
    label: 'Ácido fólico', unit: 'ng/mL',
    warn_lo: 5,
    section: 'vitamins',
    info: 'Essencial para produção celular. Meta: >5 ng/mL.'
  },
  ferro: {
    label: 'Ferro sérico', unit: 'µg/dL',
    warn_lo: 65, warn_hi: 175,
    section: 'vitamins',
    info: 'Normal: 65–175 µg/dL. Melhorou em relação ao exame anterior.'
  },
  ferritina: {
    label: 'Ferritina', unit: 'ng/mL',
    warn_lo: 22, warn_hi: 322,
    section: 'vitamins',
    info: 'Estoque de ferro do organismo. Normal: 22–322 ng/mL.'
  },
  potassio: {
    label: 'Potássio', unit: 'mEq/L',
    warn_lo: 3.5, warn_hi: 5.5,
    section: 'vitamins',
    info: 'Eletrólito essencial para função muscular e cardíaca. Normal: 3,5–5,5 mEq/L.'
  },
  sodio: {
    label: 'Sódio', unit: 'mEq/L',
    warn_lo: 132, warn_hi: 148,
    section: 'vitamins',
    info: 'Eletrólito essencial. Normal: 132–148 mEq/L.'
  },
  acido_urico: {
    label: 'Ácido úrico', unit: 'mg/dL',
    warn_hi: 9.2,
    section: 'vitamins',
    info: 'Acima de 9,2 pode causar gota. Normal: 3,7–9,2 mg/dL.'
  },

  /* ── TIREOIDE ─────────────────────────────────────────────────────── */
  tsh: {
    label: 'TSH', unit: 'µIU/mL',
    warn_lo: 0.55, warn_hi: 4.78,
    section: 'thyroid',
    info: 'Hormônio que regula a tireoide. Hipotireoidismo pode piorar resistência à insulina.'
  },
  t4_livre: {
    label: 'T4 livre', unit: 'ng/dL',
    warn_lo: 0.89, warn_hi: 1.76,
    section: 'thyroid',
    info: 'Hormônio tireoideano ativo. Normal: 0,89–1,76 ng/dL.'
  },
  t3_livre: {
    label: 'T3 livre', unit: 'pg/mL',
    warn_lo: 2.3, warn_hi: 4.2,
    section: 'thyroid',
    info: 'Forma mais ativa dos hormônios tireoideos. Normal: 2,3–4,2 pg/mL.'
  },

  /* ── INFLAMAÇÃO / OUTROS ──────────────────────────────────────────── */
  pcr_ultrasensivel: {
    label: 'PCR ultra-sensível', unit: 'mg/dL',
    warn_hi: 0.10, danger_hi: 0.30,
    section: 'other',
    info: 'Marcador de inflamação sistêmica e risco cardiovascular. <0,10 = baixo risco. Seu resultado é excelente.'
  },
  psa_total: {
    label: 'PSA total', unit: 'ng/mL',
    warn_hi: 4.0,
    section: 'other',
    info: 'Marcador prostático. Estável e dentro do normal. Monitorar anualmente.'
  },
  vhs: {
    label: 'VHS', unit: 'mm/h',
    warn_hi: 20,
    section: 'other',
    info: 'Velocidade de hemossedimentação. Marcador inespecífico de inflamação. Normal: até 20 mm/h.'
  },
};

/* ── Funções utilitárias ──────────────────────────────────────────── */

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
  if (Math.abs(val) >= 100) return Math.round(val).toLocaleString('pt-BR');
  return val.toFixed(2).replace('.', ',');
}

const LABEL_MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function labelOf(entry) {
  return LABEL_MONTHS[entry.mes - 1] + '/' + String(entry.ano).slice(2);
}
