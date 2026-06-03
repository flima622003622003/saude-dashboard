/* js/cardapio.js — Guia de alimentos + calendário semanal persistente via GitHub */

const DAYS = [
  { id:'seg', label:'Segunda-feira' },
  { id:'ter', label:'Terça-feira'   },
  { id:'qua', label:'Quarta-feira'  },
  { id:'qui', label:'Quinta-feira'  },
  { id:'sex', label:'Sexta-feira'   },
  { id:'sab', label:'Sábado'        },
  { id:'dom', label:'Domingo'       },
];

const MEALS = [
  { id:'cafe',   label:'☕ Café da manhã' },
  { id:'almoco', label:'🍽 Almoço'        },
  { id:'lanche', label:'🍎 Lanche'        },
  { id:'jantar', label:'🌙 Jantar'        },
];

let menu = {};
let ghToken = '';
let ghRepo  = '';  // ex: "flima622003622003/saude-dashboard"
let fileSha = ''; // SHA atual do cardapio.json no GitHub
let saveTimeout = null;
let saveStatus = 'idle'; // idle | saving | saved | error | no-token

/* ══════════════════════════════════════════════════════════════════
   TAB SWITCHING
══════════════════════════════════════════════════════════════════ */
function switchTab(tab) {
  const isDash = tab === 'dashboard';
  document.getElementById('tab-dashboard').classList.toggle('active', isDash);
  document.getElementById('tab-cardapio').classList.toggle('active', !isDash);

  const mainEl     = document.querySelector('main.main');
  const cardapioEl = document.getElementById('page-cardapio');
  if (mainEl)     mainEl.style.display     = isDash ? '' : 'none';
  if (cardapioEl) cardapioEl.style.display = isDash ? 'none' : '';

  if (!isDash && !menu._built) {
    loadGhConfig();
    buildFoodItems();
    buildCalendar();
    loadMenuFromGitHub();
    menu._built = true;
  }
}

/* ══════════════════════════════════════════════════════════════════
   GITHUB CONFIG
══════════════════════════════════════════════════════════════════ */
function loadGhConfig() {
  ghToken = localStorage.getItem('gh_token') || '';
  // Detecta repositório automaticamente a partir da URL do GitHub Pages
  // ex: flima622003622003.github.io/saude-dashboard → flima622003622003/saude-dashboard
  const host = window.location.hostname; // flima622003622003.github.io
  const path = window.location.pathname.split('/').filter(Boolean)[0] || 'saude-dashboard';
  if (host.endsWith('.github.io')) {
    const user = host.replace('.github.io', '');
    ghRepo = user + '/' + path;
  } else {
    // Desenvolvimento local — pega do localStorage
    ghRepo = localStorage.getItem('gh_repo') || '';
  }
  updateTokenStatus();
}

function updateTokenStatus() {
  const el = document.getElementById('token-status');
  if (!el) return;
  if (ghToken) {
    el.innerHTML = '<span style="color:var(--green-text)"><i class="ti ti-check" aria-hidden="true"></i> Token configurado — cardápio sincronizado com GitHub</span>';
  } else {
    el.innerHTML = '<span style="color:var(--amber-text)"><i class="ti ti-alert-triangle" aria-hidden="true"></i> Sem token — cardápio salvo só neste navegador</span>';
  }
}

function saveToken() {
  const input = document.getElementById('token-input');
  const val = input ? input.value.trim() : '';
  if (!val) return;
  ghToken = val;
  localStorage.setItem('gh_token', val);
  input.value = '';
  document.getElementById('token-setup').style.display = 'none';
  updateTokenStatus();
  // Tenta carregar imediatamente com o novo token
  loadMenuFromGitHub();
}

function toggleTokenSetup() {
  const el = document.getElementById('token-setup');
  if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

function clearToken() {
  ghToken = '';
  localStorage.removeItem('gh_token');
  updateTokenStatus();
}

/* ══════════════════════════════════════════════════════════════════
   GITHUB API — LER e SALVAR cardapio.json
══════════════════════════════════════════════════════════════════ */
async function loadMenuFromGitHub() {
  setStatusBar('loading');
  try {
    // Lê sempre o arquivo do repo (funciona mesmo sem token, repo público)
    const url = 'https://api.github.com/repos/' + ghRepo + '/contents/cardapio.json';
    const headers = { 'Accept': 'application/vnd.github+json' };
    if (ghToken) headers['Authorization'] = 'Bearer ' + ghToken;

    const res = await fetch(url, { headers: headers });
    if (res.ok) {
      const data = await res.json();
      fileSha = data.sha;
      const decoded = JSON.parse(atob(data.content.replace(/\n/g, '')));
      DAYS.forEach(function(d) {
        menu[d.id] = decoded[d.id] || {};
        MEALS.forEach(function(m) {
          if (!menu[d.id][m.id]) menu[d.id][m.id] = [];
        });
      });
      renderAllSlots();
      setStatusBar('saved');
      return;
    }
  } catch(e) {}

  // Fallback: localStorage
  loadFromLocalStorage();
  setStatusBar(ghToken ? 'error' : 'no-token');
}

async function saveMenuToGitHub() {
  // Sempre salva no localStorage como backup
  saveToLocalStorage();

  if (!ghToken || !ghRepo) {
    setStatusBar('no-token');
    return;
  }

  setStatusBar('saving');
  try {
    const toSave = {};
    DAYS.forEach(function(d) { toSave[d.id] = menu[d.id] || {}; });

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(toSave, null, 2))));
    const url = 'https://api.github.com/repos/' + ghRepo + '/contents/cardapio.json';

    const body = {
      message: 'Atualiza cardápio semanal',
      content: content,
    };
    if (fileSha) body.sha = fileSha;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + ghToken,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      fileSha = data.content.sha;
      setStatusBar('saved');
    } else {
      const err = await res.json();
      console.warn('GitHub save error:', err.message);
      setStatusBar('error');
    }
  } catch(e) {
    console.warn('Save error:', e);
    setStatusBar('error');
  }
}

function scheduleSave() {
  clearTimeout(saveTimeout);
  setStatusBar('saving');
  saveTimeout = setTimeout(saveMenuToGitHub, 1500);
}

/* ── Status bar ─────────────────────────────────────────────────── */
function setStatusBar(status) {
  saveStatus = status;
  const el = document.getElementById('save-status');
  if (!el) return;
  const map = {
    loading: '<i class="ti ti-loader-2 ti-spin" aria-hidden="true"></i> Carregando...',
    saving:  '<i class="ti ti-loader-2 ti-spin" aria-hidden="true"></i> Salvando...',
    saved:   '<i class="ti ti-cloud-check" aria-hidden="true"></i> Salvo no GitHub',
    'no-token': '<i class="ti ti-device-floppy" aria-hidden="true"></i> Salvo neste navegador',
    error:   '<i class="ti ti-alert-triangle" aria-hidden="true"></i> Erro ao salvar — verifique o token',
  };
  el.innerHTML = map[status] || '';
  el.className = 'save-status-bar ' + status;
}

/* ── LocalStorage fallback ──────────────────────────────────────── */
function saveToLocalStorage() {
  try {
    const toSave = {};
    DAYS.forEach(function(d) { toSave[d.id] = menu[d.id] || {}; });
    localStorage.setItem('saude_menu', JSON.stringify(toSave));
  } catch(e) {}
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('saude_menu');
    if (!saved) return;
    const parsed = JSON.parse(saved);
    DAYS.forEach(function(d) {
      menu[d.id] = parsed[d.id] || {};
      MEALS.forEach(function(m) {
        if (!menu[d.id][m.id]) menu[d.id][m.id] = [];
      });
    });
    renderAllSlots();
  } catch(e) {}
}

/* ══════════════════════════════════════════════════════════════════
   FOOD ITEMS
══════════════════════════════════════════════════════════════════ */
function buildFoodItems() {
  document.querySelectorAll('.food-items').forEach(function(div) {
    const group = div.getAttribute('data-group');
    const names = div.textContent.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    div.innerHTML = '';
    names.forEach(function(name) {
      const chip = document.createElement('span');
      chip.className = 'food-item';
      chip.textContent = name;
      chip.setAttribute('data-name', name);
      chip.setAttribute('data-group', group);
      chip.title = 'Clique para adicionar ao cardápio';
      chip.addEventListener('click', function() { addFood(name, group); });
      div.appendChild(chip);
    });
  });
}

function filterFoods(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.food-item').forEach(function(chip) {
    chip.classList.toggle('hidden', !(!q || chip.getAttribute('data-name').toLowerCase().includes(q)));
  });
}

/* ══════════════════════════════════════════════════════════════════
   CALENDAR
══════════════════════════════════════════════════════════════════ */
function buildCalendar() {
  const cal = document.getElementById('week-calendar');
  cal.innerHTML = '';
  DAYS.forEach(function(day) {
    if (!menu[day.id]) menu[day.id] = {};

    const block = document.createElement('div');
    block.className = 'day-block';

    const hdr = document.createElement('div');
    hdr.className = 'day-header';
    hdr.innerHTML =
      '<span>' + day.label + '</span>' +
      '<span style="font-size:11px;color:var(--text3);font-weight:400" id="count-' + day.id + '"></span>';
    hdr.addEventListener('click', function() { toggleDay(day.id); });
    block.appendChild(hdr);

    const body = document.createElement('div');
    body.className = 'day-meals';
    body.id = 'meals-' + day.id;

    MEALS.forEach(function(meal) {
      if (!menu[day.id][meal.id]) menu[day.id][meal.id] = [];
      const slot = document.createElement('div');
      slot.className = 'meal-slot';
      const lbl = document.createElement('div');
      lbl.className = 'meal-slot-label';
      lbl.textContent = meal.label;
      slot.appendChild(lbl);
      const items = document.createElement('div');
      items.className = 'meal-items';
      items.id = 'slot-' + day.id + '-' + meal.id;
      slot.appendChild(items);
      body.appendChild(slot);
    });

    block.appendChild(body);
    cal.appendChild(block);
  });
  renderAllSlots();
}

function toggleDay(dayId) {
  const body = document.getElementById('meals-' + dayId);
  if (body) body.style.display = body.style.display === 'none' ? '' : 'none';
}

function addFood(name, group) {
  const dayId  = document.getElementById('selected-day').value;
  const mealId = document.getElementById('selected-meal').value;
  if (!menu[dayId]) menu[dayId] = {};
  if (!menu[dayId][mealId]) menu[dayId][mealId] = [];
  if (menu[dayId][mealId].some(function(i) { return i.name === name; })) return;
  menu[dayId][mealId].push({ name: name, group: group });
  renderSlot(dayId, mealId);
  updateDayCount(dayId);
  scheduleSave();

  const chip = document.querySelector('.food-item[data-name="' + CSS.escape(name) + '"]');
  if (chip) {
    chip.classList.add('selected');
    setTimeout(function() { chip.classList.remove('selected'); }, 800);
  }
}

function removeFood(dayId, mealId, name) {
  if (!menu[dayId] || !menu[dayId][mealId]) return;
  menu[dayId][mealId] = menu[dayId][mealId].filter(function(i) { return i.name !== name; });
  renderSlot(dayId, mealId);
  updateDayCount(dayId);
  scheduleSave();
}

function renderSlot(dayId, mealId) {
  const el = document.getElementById('slot-' + dayId + '-' + mealId);
  if (!el) return;
  const items = (menu[dayId] && menu[dayId][mealId]) ? menu[dayId][mealId] : [];
  if (!items.length) {
    el.innerHTML = '<span class="meal-empty">Nenhum alimento</span>';
    return;
  }
  el.innerHTML = '';
  items.forEach(function(item) {
    const chip = document.createElement('span');
    chip.className = 'meal-chip ' + item.group;
    const safeName = item.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    chip.innerHTML = item.name +
      ' <span class="meal-chip-remove" title="Remover" onclick="removeFood(\'' +
      dayId + '\',\'' + mealId + '\',\'' + safeName + '\')">×</span>';
    el.appendChild(chip);
  });
}

function renderAllSlots() {
  DAYS.forEach(function(day) {
    MEALS.forEach(function(meal) { renderSlot(day.id, meal.id); });
    updateDayCount(day.id);
  });
}

function updateDayCount(dayId) {
  const el = document.getElementById('count-' + dayId);
  if (!el) return;
  let total = 0;
  MEALS.forEach(function(meal) {
    total += (menu[dayId] && menu[dayId][meal.id]) ? menu[dayId][meal.id].length : 0;
  });
  el.textContent = total ? total + ' item' + (total > 1 ? 'ns' : '') : '';
}

function clearMenu() {
  if (!confirm('Limpar o cardápio inteiro da semana?')) return;
  DAYS.forEach(function(d) {
    MEALS.forEach(function(m) {
      if (menu[d.id]) menu[d.id][m.id] = [];
    });
  });
  renderAllSlots();
  scheduleSave();
}

function printMenu() { window.print(); }
