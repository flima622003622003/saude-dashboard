#!/usr/bin/env python3
"""
extrair_exames.py
-----------------
Lê os arquivos PDF (que são na verdade ZIPs com .txt e .jpeg) da pasta ./exames/
e gera o arquivo exames_data.json usado pelo dashboard.

Uso:
  python3 extrair_exames.py

Cada PDF deve ser nomeado como: MES_ANO.pdf
Exemplos: agosto_2025.pdf, marco_2026.pdf, janeiro_2026.pdf
"""

import os
import json
import re
import zipfile
import io
from pathlib import Path

EXAMES_DIR = Path("exames")
OUTPUT_FILE = Path("exames_data.json")

# ─── Extratores de valores ────────────────────────────────────────────────────

def extract_float(text, pattern, group=1):
    m = re.search(pattern, text, re.IGNORECASE)
    if m:
        try:
            return float(m.group(group).replace(",", "."))
        except:
            return None
    return None

def extract_text_from_zip_pdf(pdf_path):
    """Abre o arquivo PDF (que é um ZIP) e concatena todos os .txt internos."""
    full_text = ""
    try:
        with zipfile.ZipFile(pdf_path, 'r') as z:
            txt_files = sorted([f for f in z.namelist() if f.endswith('.txt')],
                               key=lambda x: int(x.replace('.txt','')) if x.replace('.txt','').isdigit() else 0)
            for fname in txt_files:
                with z.open(fname) as f:
                    full_text += f.read().decode('utf-8', errors='replace') + "\n"
    except Exception as e:
        print(f"  Erro ao ler {pdf_path}: {e}")
    return full_text

def parse_exame(text, label):
    """Extrai todos os marcadores laboratoriais de interesse do texto completo."""
    data = {}

    # ── GLICOSE / GLICEMIA ──────────────────────────────────────────────
    # Formato laudo único: "GLICEMIA EM JEJUM 88,30 mg/dL"
    v = extract_float(text, r'GLICEMIA EM JEJUM\s+([\d,\.]+)\s*mg')
    # Formato laudo evolutivo (tabela): "GLICOSE 88,30 95,53 ..."
    if not v: v = extract_float(text, r'GLICOSE\s+([\d,\.]+)')
    if v: data['glicose'] = v

    # ── HBA1C ───────────────────────────────────────────────────────────
    # Formato laudo único: "HEMOGLOBINA GLICADA (A1C) 5,90 %"
    v = extract_float(text, r'HEMOGLOBINA GLICADA \(A1C\)\s+([\d,\.]+)\s*%')
    # Formato evolutivo: "HEMOGLOBINA GLICADA 5,90 5,60 ..."
    if not v: v = extract_float(text, r'HEMOGLOBINA GLICADA\s+([\d,\.]+)')
    if v: data['hba1c'] = v

    # Glicemia média estimada
    v = extract_float(text, r'Glicemia M[eé]dia Estimada\s+([\d,\.]+)')
    if v: data['glicemia_media_estimada'] = v

    # ── CURVA GLICÊMICA (TTGO) ──────────────────────────────────────────
    v = extract_float(text, r'Glicemia Basal\s*[\.:\s]+([\d,\.]+)\s*mg')
    if v: data['ttgo_basal'] = v
    v = extract_float(text, r'Glicemia 60 minutos.*?:\s*([\d,\.]+)\s*mg')
    if v: data['ttgo_60min'] = v
    v = extract_float(text, r'Glicemia 120 minutos.*?:\s*([\d,\.]+)\s*mg')
    if v: data['ttgo_120min'] = v

    # ── LIPIDOGRAMA ──────────────────────────────────────────────────────
    v = extract_float(text, r'TRIGLICER[IÍ]DEOS\s+([\d,\.]+)\s*mg')
    if v: data['triglicerideos'] = v

    v = extract_float(text, r'COLESTEROL TOTAL\s+([\d,\.]+)\s*mg')
    if v: data['colesterol_total'] = v

    v = extract_float(text, r'(?:HDL COLESTEROL|COLESTEROL HDL)\s+([\d,\.]+)\s*mg')
    if v: data['hdl'] = v

    v = extract_float(text, r'LDL COLESTEROL\s+([\d,\.]+)\s*mg')
    if v: data['ldl'] = v

    v = extract_float(text, r'VLDL COLESTEROL\s+([\d,\.]+)\s*mg')
    if v: data['vldl'] = v

    v = extract_float(text, r'COLESTEROL N[ÃA]O.HDL\s+([\d,\.]+)\s*mg')
    if v: data['nao_hdl'] = v

    v = extract_float(text, r'LIPOPROTE[IÍ]NA \(a\)\s+([\d,\.]+)\s*nmol')
    if v: data['lpa'] = v

    v = extract_float(text, r'APOLIPOPROTE[IÍ]NA A.1\s+([\d,\.]+)\s*mg')
    if v: data['apo_a1'] = v

    v = extract_float(text, r'APOLIPOPROTE[IÍ]NA B\s+([\d,\.]+)\s*mg')
    if v: data['apo_b'] = v

    # ── FUNÇÃO HEPÁTICA ──────────────────────────────────────────────────
    v = extract_float(text, r'AST \(TGO\)\s+([\d,\.]+)\s*U')
    if v: data['ast'] = v

    v = extract_float(text, r'ALT \(TGP\)\s+([\d,\.]+)\s*U')
    if v: data['alt'] = v

    v = extract_float(text, r'GAMA GLUTAMIL TRANSFERASE\s+([\d,\.]+)\s*U')
    if v: data['ggt'] = v

    # ── FUNÇÃO RENAL ──────────────────────────────────────────────────────
    v = extract_float(text, r'CREATININA\s+([\d,\.]+)\s*mg')
    if v: data['creatinina'] = v

    v = extract_float(text, r'UREIA\s+([\d,\.]+)\s*mg')
    if v: data['ureia'] = v

    v = extract_float(text, r'eTFG.*?([\d,\.]+)\s*mL')
    if v: data['etfg'] = v

    v = extract_float(text, r'Rela[çc][ãa]o Albumina/Creatinina\s+([\d,\.]+)\s*mg')
    if v: data['albumina_creatinina'] = v

    # ── HEMOGRAMA ────────────────────────────────────────────────────────
    v = extract_float(text, r'ERITR[OÓ]CITOS\s+([\d,\.]+)\s*milh')
    if not v: v = extract_float(text, r'ERITR[OÓ]CITOS\s+([\d,\.]+)')
    if v: data['eritrocitos'] = v

    v = extract_float(text, r'HEMOGLOBINA\s*:\s*([\d,\.]+)\s*g/dL')
    if not v: v = extract_float(text, r'HEMOGLOBINA\s+([\d,\.]+)\s*g/dL')
    if not v: v = extract_float(text, r'HEMOGLOBINA\s+([\d,\.]+)\s+\d')
    if v: data['hemoglobina'] = v

    v = extract_float(text, r'HEMAT[OÓ]CRITO\s*:\s*([\d,\.]+)\s*%')
    if not v: v = extract_float(text, r'HEMAT[OÓ]CRITO\s+([\d,\.]+)\s*%')
    if not v: v = extract_float(text, r'HEMAT[OÓ]CRITO\s+([\d,\.]+)')
    if v: data['hematocrito'] = v

    v = extract_float(text, r'LEUCÓCITOS\s+([\d\.]+)[,\s]')
    if v: data['leucocitos'] = v

    v = extract_float(text, r'PLAQUETAS\s+([\d\.]+)\s')
    if v: data['plaquetas'] = v

    # ── VITAMINAS / MINERAIS ─────────────────────────────────────────────
    v = extract_float(text, r'VITAMINA D TOTAL.*?([\d,\.]+)\s*ng')
    if v: data['vitamina_d'] = v

    v = extract_float(text, r'VITAMINA B12\s+([\d,\.]+)\s*pg')
    if v: data['vitamina_b12'] = v

    v = extract_float(text, r'[AÁ]CIDO F[OÓ]LICO\s+([\d,\.]+)\s*ng')
    if v: data['acido_folico'] = v

    # ── TIREÓIDE ──────────────────────────────────────────────────────────
    v = extract_float(text, r'TSH.*?([\d,\.]+)\s*[µu]IU')
    if v: data['tsh'] = v

    v = extract_float(text, r'T4 LIVRE.*?([\d,\.]+)\s*ng')
    if v: data['t4_livre'] = v

    v = extract_float(text, r'T3 L.*?TRIIODOTIRONINA.*?([\d,\.]+)\s*pg')
    if v: data['t3_livre'] = v

    # ── OUTROS ────────────────────────────────────────────────────────────
    v = extract_float(text, r'CPK\s+([\d,\.]+)\s*U')
    if not v: v = extract_float(text, r'\bCPK\s+([\d,\.]+)')
    if v: data['cpk'] = v

    v = extract_float(text, r'GGT\s+([\d,\.]+)\s*U')
    if not data.get('ggt') and v: data['ggt'] = v

    v = extract_float(text, r'[AÁ]CIDO [ÚU]RICO\s+([\d,\.]+)\s*mg')
    if v: data['acido_urico'] = v

    v = extract_float(text, r'FERRITINA\s+([\d,\.]+)\s*ng')
    if v: data['ferritina'] = v

    v = extract_float(text, r'FERRO\s+S[EÉ]RICO\s+([\d,\.]+)\s*[µu]g')
    if not v: v = extract_float(text, r'FERRO\s+([\d,\.]+)\s*[µu]g')
    if v: data['ferro'] = v

    v = extract_float(text, r'POTÁSSIO\s+([\d,\.]+)\s*mEq')
    if v: data['potassio'] = v

    v = extract_float(text, r'SÓDIO\s+([\d,\.]+)\s*mEq')
    if v: data['sodio'] = v

    v = extract_float(text, r'PCR ULTRA SENS[IÍ]VEL\s+(?:Menor que\s+)?([\d,\.]+)')
    if v: data['pcr_ultrasensivel'] = v
    else:
        m = re.search(r'PCR ULTRA SENS[IÍ]VEL\s+Menor que\s+([\d,\.]+)', text, re.IGNORECASE)
        if m: data['pcr_ultrasensivel_menor_que'] = float(m.group(1).replace(',','.'))

    v = extract_float(text, r'PSA TOTAL.*?([\d,\.]+)\s*ng')
    if v: data['psa_total'] = v

    v = extract_float(text, r'Velocidade de Hemossedimenta[çc][ãa]o\s+([\d,\.]+)\s*mm')
    if v: data['vhs'] = v

    return data

# ─── Mapeamento de nomes de meses ─────────────────────────────────────────────

MESES = {
    'janeiro': 1, 'fevereiro': 2, 'marco': 3, 'março': 3,
    'abril': 4, 'maio': 5, 'junho': 6, 'julho': 7,
    'agosto': 8, 'setembro': 9, 'outubro': 10,
    'novembro': 11, 'dezembro': 12,
    'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5,
    'jun': 6, 'jul': 7, 'ago': 8, 'set': 9, 'out': 10,
    'nov': 11, 'dez': 12,
}

def parse_filename_date(filename):
    """
    Aceita formatos:
      agosto_2025.pdf  →  2025-08
      marco_2026.pdf   →  2026-03
      08_2025.pdf      →  2025-08
      2025_08.pdf      →  2025-08
    """
    stem = Path(filename).stem.lower().replace('-', '_')
    parts = stem.split('_')

    # Tenta nome de mês
    for part in parts:
        if part in MESES:
            mes = MESES[part]
            for other in parts:
                if other != part and other.isdigit() and len(other) == 4:
                    return f"{other}-{mes:02d}", mes, int(other)

    # Tenta numérico
    nums = [p for p in parts if p.isdigit()]
    if len(nums) == 2:
        a, b = int(nums[0]), int(nums[1])
        if a > 12: year, month = a, b
        else: year, month = b, a
        return f"{year}-{month:02d}", month, year

    return None, None, None

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    if not EXAMES_DIR.exists():
        print(f"Pasta '{EXAMES_DIR}' não encontrada. Crie-a e coloque os PDFs.")
        return

    pdf_files = sorted(EXAMES_DIR.glob("*.pdf"))
    if not pdf_files:
        print("Nenhum PDF encontrado em ./exames/")
        return

    results = []

    for pdf_path in pdf_files:
        date_key, mes, ano = parse_filename_date(pdf_path.name)
        if not date_key:
            print(f"  ⚠ Não consegui interpretar a data de '{pdf_path.name}' — pulando.")
            continue

        print(f"📄 Processando {pdf_path.name} → {date_key}")
        text = extract_text_from_zip_pdf(pdf_path)
        if not text.strip():
            print(f"  ⚠ Arquivo vazio ou formato não suportado.")
            continue

        dados = parse_exame(text, date_key)
        entry = {
            "label": date_key,
            "mes": mes,
            "ano": ano,
            "arquivo": pdf_path.name,
            "dados": dados
        }
        results.append(entry)
        print(f"  ✓ {len(dados)} marcadores extraídos: {', '.join(dados.keys())}")

    # Ordena cronologicamente
    results.sort(key=lambda x: (x['ano'], x['mes']))

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Gerado: {OUTPUT_FILE} ({len(results)} exames)")

if __name__ == "__main__":
    main()
