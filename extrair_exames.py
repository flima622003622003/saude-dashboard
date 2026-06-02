#!/usr/bin/env python3
"""
extrair_exames.py
-----------------
Lê os PDFs da pasta ./exames/ e gera exames_data.json.
Aproveita o histórico embutido nos laudos evolutivos do laboratório —
um único PDF já carrega todas as medições anteriores com datas exatas.

Nomeie os PDFs como: mes_ano.pdf
Exemplos: agosto_2025.pdf, marco_2026.pdf, novembro_2022.pdf
"""

import json, re, zipfile
from pathlib import Path
from datetime import datetime

EXAMES_DIR  = Path("exames")
OUTPUT_FILE = Path("exames_data.json")

MESES = {
    'janeiro':1,'fevereiro':2,'marco':3,'março':3,'abril':4,'maio':5,'junho':6,
    'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12,
    'jan':1,'fev':2,'mar':3,'abr':4,'mai':5,'jun':6,
    'jul':7,'ago':8,'set':9,'out':10,'nov':11,'dez':12,
}

# ─── Leitura de texto ────────────────────────────────────────────────────────

def read_zip_pdf(path):
    txt = ""
    with zipfile.ZipFile(path) as z:
        files = sorted([f for f in z.namelist() if f.endswith('.txt')],
                       key=lambda x: int(x.replace('.txt','')) if x.replace('.txt','').isdigit() else 0)
        for f in files:
            with z.open(f) as fp:
                txt += fp.read().decode('utf-8', errors='replace') + "\n"
    return txt

def read_native_pdf(path):
    try:
        import fitz
        doc = fitz.open(str(path))
        txt = "".join(p.get_text() + "\n" for p in doc)
        doc.close()
        return txt
    except Exception as e:
        print(f"  Erro PDF nativo: {e}")
        return ""

def read_pdf(path):
    return read_zip_pdf(path) if zipfile.is_zipfile(path) else read_native_pdf(path)

# ─── Parse de data dd/mm/yyyy → (ano, mes) ──────────────────────────────────

def parse_date_str(s):
    """'11/03/2026' → (2026, 3)"""
    m = re.match(r'(\d{2})/(\d{2})/(\d{4})', s.strip())
    if m:
        return int(m.group(3)), int(m.group(2))
    return None, None

def date_label(ano, mes):
    meses = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
    return f"{meses[mes-1]}/{str(ano)[2:]}"

def date_key(ano, mes):
    return f"{ano}-{mes:02d}"

# ─── Extração do histórico embutido no laudo ─────────────────────────────────

def extract_history(text):
    """
    Retorna dict: { '2026-03': {'glicose': 101.52, 'hba1c': 5.70, ...}, ... }
    Aproveita as tabelas evolutivas e linhas 'Resultados anteriores' do laudo.
    """
    history = {}  # date_key -> {marker -> value}

    def add(dk, marker, val):
        if dk not in history:
            history[dk] = {}
        if marker not in history[dk]:   # primeiro valor encontrado vence
            history[dk][marker] = val

    def flt(s):
        try:
            return float(s.replace(',','.').replace(' ',''))
        except:
            return None

    lines = text.split('\n')

    # ── 1. Tabelas com cabeçalho de datas ────────────────────────────────────
    # Ex: "HEMOGRAMA 11/03/2026 13/08/2025 11/03/2024 ..."
    # seguidas de linhas como "GLICOSE 101,52 98,56 88,30 ..."

    TABLE_HEADERS = {}  # nome_secao -> [date_keys ordenados]
    current_dates = []

    DATE_HEADER_RE = re.compile(
        r'^(HEMOGRAMA|LIPIDOGRAMA|Exames|BIOQUÍMICA|URINA)\s+'
        r'((?:\d{2}/\d{2}/\d{4}\s*)+)', re.IGNORECASE)

    MARKER_MAP = {
        'GLICOSE':               'glicose',
        'HEMOGLOBINA GLICADA':   'hba1c',
        'ERITRÓCITOS':           'eritrocitos',
        'HEMOGLOBINA':           'hemoglobina',
        'HEMATÓCRITO':           'hematocrito',
        'LEUCÓCITOS':            'leucocitos',
        'PLAQUETAS':             'plaquetas',
        'TRIGLICERÍDEOS':        'triglicerideos',
        'COLESTEROL TOTAL':      'colesterol_total',
        'COLESTEROL HDL':        'hdl',
        'HDL COLESTEROL':        'hdl',
        'LDL COLESTEROL':        'ldl',
        'VLDL COLESTEROL':       'vldl',
        'COLESTEROL NÃO-HDL':    'nao_hdl',
        'AST (TGO)':             'ast',
        'ALT (TGP)':             'alt',
        'GAMA GLUTAMIL':         'ggt',
        'CPK':                   'cpk',
        'CREATININA':            'creatinina',
        'UREIA':                 'ureia',
        'VITAMINA D':            'vitamina_d',
        'VITAMINA B12':          'vitamina_b12',
        'TSH':                   'tsh',
        'PSA TOTAL':             'psa_total',
        'ÁCIDO ÚRICO':           'acido_urico',
        'FERRITINA':             'ferritina',
        'POTÁSSIO':              'potassio',
        'SÓDIO':                 'sodio',
    }

    i = 0
    while i < len(lines):
        line = lines[i].strip()

        # Detecta cabeçalho de tabela
        m = DATE_HEADER_RE.match(line)
        if m:
            current_dates = []
            for ds in re.findall(r'\d{2}/\d{2}/\d{4}', m.group(2)):
                ano, mes = parse_date_str(ds)
                if ano:
                    current_dates.append(date_key(ano, mes))
            i += 1
            continue

        # Lê linha de marcador quando temos datas no contexto
        if current_dates:
            for raw, marker in MARKER_MAP.items():
                if line.upper().startswith(raw.upper()):
                    nums = re.findall(r'[\d]+[,\.][\d]+', line)
                    for j, dk in enumerate(current_dates):
                        if j < len(nums):
                            v = flt(nums[j])
                            if v is not None:
                                add(dk, marker, v)
                    break

        i += 1

    # ── 2. Linhas "Resultados anteriores: dd/mm/yyyy - val | ..." ────────────
    PREV_RE = re.compile(
        r'(?:Resultados anteriores|anteriores)\s*:\s*'
        r'((?:\d{2}/\d{2}/\d{4}\s*-\s*[\d,\.]+\s*\|?\s*)+)',
        re.IGNORECASE)

    INLINE_RE = re.compile(
        r'(\d{2}/\d{2}/\d{4})\s*-\s*([\d,\.]+)')

    # Detecta qual marcador está associado a cada bloco "Resultados anteriores"
    PREV_CONTEXT = {
        'HbA1c':                 'hba1c',
        'Glicemia Média':        'glicemia_media_estimada',
        'AST':                   'ast',
        'ALT':                   'alt',
        'GGT':                   'ggt',
        'Vitamina D':            'vitamina_d',
        'Vitamina B12':          'vitamina_b12',
        'Ferro':                 'ferro',
        'Ferritina':             'ferritina',
        'CPK':                   'cpk',
        'TSH':                   'tsh',
        'PSA':                   'psa_total',
        'Ácido Úrico':           'acido_urico',
        'Creatinina':            'creatinina',
        'eTFG':                  'etfg',
        'Albumina':              'albumina_creatinina',
    }

    for i, line in enumerate(lines):
        m = PREV_RE.search(line)
        if not m:
            continue
        # Tenta identificar o marcador pelas linhas próximas
        context_window = '\n'.join(lines[max(0,i-5):i+2])
        marker = None
        for ctx, mk in PREV_CONTEXT.items():
            if ctx.lower() in context_window.lower():
                marker = mk
                break
        if not marker:
            continue
        for ds, vs in INLINE_RE.findall(m.group(1)):
            ano, mes = parse_date_str(ds)
            if ano:
                v = flt(vs)
                if v is not None:
                    add(date_key(ano, mes), marker, v)

    # ── 3. Linhas inline HbA1c/Glicemia: "dd/mm/yyyy - val | ..." ───────────
    # Ex: "20/02/2026 - 5,80 | 13/08/2025 - 5,90 | ..."
    PURE_INLINE_RE = re.compile(
        r'^(?:(\d{2}/\d{2}/\d{4})\s*-\s*([\d,\.]+)\s*\|?\s*){2,}')

    for i, line in enumerate(lines):
        line = line.strip()
        if not PURE_INLINE_RE.match(line):
            continue
        pairs = INLINE_RE.findall(line)
        if len(pairs) < 2:
            continue
        # Determina marcador pelo contexto
        context_window = '\n'.join(lines[max(0,i-8):i+2])
        marker = None
        for ctx, mk in PREV_CONTEXT.items():
            if ctx.lower() in context_window.lower():
                marker = mk
                break
        if not marker:
            continue
        for ds, vs in pairs:
            ano, mes = parse_date_str(ds)
            if ano:
                v = flt(vs)
                if v is not None:
                    add(date_key(ano, mes), marker, v)

    # ── 4. Valores pontuais do exame atual (laudo individual) ────────────────
    SINGLE_RE = {
        'glicose':               [r'GLICEMIA EM JEJUM\s+([\d,\.]+)', r'GLICOSE\s+([\d,\.]+)(?:\s|$)'],
        'hba1c':                 [r'HEMOGLOBINA GLICADA \(A1C\)\s+([\d,\.]+)', r'HEMOGLOBINA GLICADA\s+([\d,\.]+)'],
        'glicemia_media_estimada':[r'Glicemia M[eé]dia Estimada\s+([\d,\.]+)'],
        'ttgo_basal':            [r'Glicemia Basal\s*[:\s]+([\d,\.]+)'],
        'ttgo_60min':            [r'Glicemia 60 minutos[^:]*:\s*([\d,\.]+)', r'TTGO.*?60.*?:\s*([\d,\.]+)'],
        'ttgo_120min':           [r'Glicemia 120 minutos[^:]*:\s*([\d,\.]+)'],
        'lpa':                   [r'LIPOPROTE[IÍ]NA \(a\)\s+([\d,\.]+)'],
        'apo_a1':                [r'APOLIPOPROTE[IÍ]NA A.1\s+([\d,\.]+)'],
        'apo_b':                 [r'APOLIPOPROTE[IÍ]NA B\s+([\d,\.]+)'],
        'etfg':                  [r'eTFG.*?([\d,\.]+)\s*mL'],
        'albumina_creatinina':   [r'Rela[çc][ãa]o Albumina/Creatinina\s+([\d,\.]+)'],
        'acido_folico':          [r'[AÁ]CIDO F[OÓ]LICO\s+([\d,\.]+)'],
        't4_livre':              [r'T4 LIVRE.*?([\d,\.]+)\s*ng'],
        't3_livre':              [r'T3 L.*?TRIIODOTIRONINA.*?([\d,\.]+)\s*pg'],
        'pcr_ultrasensivel':     [r'PCR ULTRA SENS[IÍ]VEL\s+(?:Menor que\s+)?([\d,\.]+)'],
        'vhs':                   [r'Velocidade de Hemossedimenta[çc][ãa]o\s+([\d,\.]+)'],
        'ferro':                 [r'FERRO\s+S[EÉ]RICO\s+([\d,\.]+)', r'\bFERRO\b\s+([\d,\.]+)'],
    }

    def exflt(t, pats):
        for p in pats:
            m = re.search(p, t, re.IGNORECASE)
            if m:
                try: return float(m.group(1).replace(',','.'))
                except: pass
        return None

    # Detecta data principal do exame
    main_date = None
    m = re.search(r'Data/Hora da [Cc]oleta:\s*(\d{2}/\d{2}/\d{4})', text)
    if m:
        ano, mes = parse_date_str(m.group(1))
        if ano:
            main_date = date_key(ano, mes)

    if main_date:
        for marker, pats in SINGLE_RE.items():
            v = exflt(text, pats)
            if v is not None:
                add(main_date, marker, v)

    # ── 5. Médico solicitante ─────────────────────────────────────────────────
    sol = re.search(r'SOLICITANTE:\s*([^\r\n]+)', text)
    solicitante = sol.group(1).split('UNIDADE')[0].strip() if sol else None

    return history, solicitante

# ─── Parse nome do arquivo → data ────────────────────────────────────────────

def parse_filename_date(filename):
    stem = Path(filename).stem.lower().replace('-','_')
    parts = stem.split('_')
    for part in parts:
        if part in MESES:
            mes = MESES[part]
            for other in parts:
                if other != part and other.isdigit() and len(other) == 4:
                    return date_key(int(other), mes), mes, int(other)
    nums = [p for p in parts if p.isdigit()]
    if len(nums) == 2:
        a, b = int(nums[0]), int(nums[1])
        year, month = (a, b) if a > 12 else (b, a)
        return date_key(year, month), month, year
    return None, None, None

# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    if not EXAMES_DIR.exists():
        print(f"Pasta '{EXAMES_DIR}' não encontrada.")
        return

    pdf_files = sorted(EXAMES_DIR.glob("*.pdf"))
    if not pdf_files:
        print("Nenhum PDF encontrado em ./exames/")
        return

    # Acumula todos os dados históricos de todos os PDFs
    all_data   = {}   # date_key -> dados
    solicitantes = {} # date_key -> nome médico
    file_dates = {}   # date_key -> nome do arquivo que o originou

    for pdf_path in pdf_files:
        dk, mes, ano = parse_filename_date(pdf_path.name)
        print(f"📄 Lendo {pdf_path.name}", end="")

        text = read_pdf(pdf_path)
        if not text.strip():
            print(f" → ⚠ Formato não suportado.")
            continue

        history, solicitante = extract_history(text)

        # Marca o arquivo de origem para cada data
        if dk and dk not in file_dates:
            file_dates[dk] = pdf_path.name

        for date_k, dados in history.items():
            if date_k not in all_data:
                all_data[date_k] = {}
            for marker, val in dados.items():
                if marker not in all_data[date_k]:
                    all_data[date_k][marker] = val

        if solicitante:
            # Propaga o médico para TODAS as datas extraídas deste PDF
            for date_k in history.keys():
                if date_k not in solicitantes:
                    solicitantes[date_k] = solicitante

        print(f" → {len(history)} datas extraídas: {', '.join(sorted(history.keys()))}")

    if not all_data:
        print("Nenhum dado extraído.")
        return

    # Monta lista ordenada cronologicamente
    results = []
    for dk in sorted(all_data.keys()):
        ano  = int(dk[:4])
        mes  = int(dk[5:])
        results.append({
            "label":       dk,
            "mes":         mes,
            "ano":         ano,
            "arquivo":     file_dates.get(dk, "histórico"),
            "solicitante": solicitantes.get(dk, ""),
            "dados":       all_data[dk],
        })

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Gerado: {OUTPUT_FILE} ({len(results)} datas: {', '.join(e['label'] for e in results)})")

if __name__ == "__main__":
    main()
