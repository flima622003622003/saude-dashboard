# 🩺 Painel de Saúde — Monitoramento Pré-Diabetes

Dashboard pessoal de acompanhamento de exames laboratoriais, com foco no controle glicêmico e pré-diabetes.

## 🚀 Configuração no GitHub (uma vez só)

### 1. Criar o repositório

```bash
# Crie um repositório no GitHub chamado, por exemplo: saude-dashboard
# Depois clone localmente:
git clone https://github.com/SEU_USUARIO/saude-dashboard.git
cd saude-dashboard
```

### 2. Copiar os arquivos do projeto

Coloque neste repositório:
```
saude-dashboard/
├── index.html          ← o dashboard
├── extrair_exames.py   ← script de extração
├── exames/             ← pasta para seus PDFs
│   ├── agosto_2025.pdf
│   └── marco_2026.pdf
└── exames_data.json    ← gerado automaticamente
```

### 3. Ativar o GitHub Pages

1. Vá em **Settings** → **Pages** no seu repositório
2. Em **Source**, selecione **Deploy from a branch**
3. Selecione a branch `main` e pasta `/ (root)`
4. Clique em **Save**

Após ~1 minuto, seu dashboard estará disponível em:
```
https://SEU_USUARIO.github.io/saude-dashboard/
```

---

## 📄 Como adicionar novos exames

### Passo 1 — Nomear o PDF

Use o formato `mes_ano.pdf`. Exemplos aceitos:

| Nome do arquivo | Interpretado como |
|---|---|
| `junho_2026.pdf` | jun/26 |
| `setembro_2026.pdf` | set/26 |
| `ago_2026.pdf` | ago/26 |
| `12_2026.pdf` | dez/26 |
| `2026_09.pdf` | set/26 |

### Passo 2 — Rodar o extrator

```bash
# Certifique-se de ter Python 3 instalado
pip install pymupdf --break-system-packages

# Coloque o PDF na pasta /exames/ e rode:
python3 extrair_exames.py
```

O script vai:
- Ler todos os PDFs da pasta `/exames/`
- Extrair automaticamente todos os marcadores laboratoriais
- Gerar o arquivo `exames_data.json` atualizado

### Passo 3 — Publicar no GitHub

```bash
git add exames/ exames_data.json
git commit -m "Adiciona exame junho/2026"
git push
```

O dashboard atualiza automaticamente em ~1 minuto.

---

## 🔬 Marcadores monitorados

| Categoria | Exames |
|---|---|
| **Glicemia** | Glicemia jejum, HbA1c, TTGO (curva glicêmica), Glicemia média estimada |
| **Lipídios** | Colesterol total, HDL, LDL, VLDL, Triglicerídeos, Não-HDL, Lp(a), Apo A-1, Apo B |
| **Renal** | Creatinina, Ureia, eTFG, Albumina/Creatinina |
| **Hepático** | AST (TGO), ALT (TGP), GGT, CPK |
| **Hemograma** | Eritrócitos, Hemoglobina, Hematócrito, Leucócitos, Plaquetas |
| **Vitaminas** | Vitamina D, Vitamina B12, Ácido fólico |
| **Tireoide** | TSH, T4 livre, T3 livre |
| **Outros** | PCR ultra-sensível, PSA total, VHS, Ácido úrico, Ferritina, Ferro, Potássio, Sódio |

---

## 🔒 Privacidade

- Todos os dados ficam **no seu próprio repositório GitHub**
- Nenhum dado é enviado a terceiros — o JSON é lido localmente pelo navegador
- Se preferir privacidade total, configure o repositório como **privado** (o GitHub Pages ainda funciona com plano gratuito para repos privados)

---

## 🛠 Requisitos técnicos

- Python 3.8+ (apenas para rodar o extrator localmente)
- Biblioteca: `pymupdf` (para PDFs nativos) ou `zipfile` (para o formato específico do seu laboratório)
- Nenhum servidor necessário — o dashboard é HTML/CSS/JS puro

---

## 📌 Formato esperado dos PDFs

O extrator foi desenvolvido e testado com os laudos do **laboratório Leme/Fleury** no formato utilizado pelo convênio CASSI. Funciona com:

- PDFs nativos com camada de texto
- PDFs exportados como arquivo comprimido (ZIP interno com `.txt` e `.jpeg`)

Se seu laboratório usar outro formato, o extrator pode precisar de ajustes. Abra uma issue ou edite as regex em `extrair_exames.py`.
