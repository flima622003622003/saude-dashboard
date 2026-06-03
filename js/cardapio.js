/* js/cardapio.js — Guia de alimentos + calendário semanal */

const DAYS = [
  { id: 'seg', label: 'Segunda-feira' },
  { id: 'ter', label: 'Terça-feira'   },
  { id: 'qua', label: 'Quarta-feira'  },
  { id: 'qui', label: 'Quinta-feira'  },
  { id: 'sex', label: 'Sexta-feira'   },
  { id: 'sab', label: 'Sábado'        },
  { id: 'dom', label: 'Domingo'       },
];

const MEALS = [
  { id: 'cafe',   label: '☕ Café da manhã' },
  { id: 'almoco', label: '🍽 Almoço'        },
  { id: 'lanche', label: '🍎 Lanche'        },
  { id: 'jantar', label: '🌙 Jantar'        },
];

// menu[day][meal] = [{name, group}, ...]
let menu = {};

/* ── Tab switching ──────────────────────────────────────────────── */
function switchTab(tab) {
  const isDash = tab === 'dashboard';
  document.getElementById('tab-dashboard').classList.toggle('active', isDash);
  document.getElementById('tab-cardapio').classList.toggle('active', !isDash);

  const mainEl = document.querySelector('main.main');
  const cardapioEl = document.getElementById('page-cardapio');

  if (mainEl)     mainEl.style.display     = isDash ? '' : 'none';
  if (cardapioEl) cardapioEl.style.display = isDash ? 'none' : '';

  if (!isDash && !menu._built) {
    buildFoodItems();
    buildCalendar();
    loadMenu();
    menu._built = true;
  }
}

/* ── Render food items from .food-items divs ────────────────────── */
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

/* ── Search / filter ────────────────────────────────────────────── */
function filterFoods(query) {
  const q = query.toLowerCase().trim();
  document.querySelectorAll('.food-item').forEach(function(chip) {
    const match = !q || chip.getAttribute('data-name').toLowerCase().includes(q);
    chip.classList.toggle('hidden', !match);
  });
}

/* ── Calendar ───────────────────────────────────────────────────── */
function buildCalendar() {
  const cal = document.getElementById('week-calendar');
  cal.innerHTML = '';

  DAYS.forEach(function(day) {
    if (!menu[day.id]) menu[day.id] = {};

    const block = document.createElement('div');
    block.className = 'day-block';
    block.id = 'day-' + day.id;

    const hdr = document.createElement('div');
    hdr.className = 'day-header';
    hdr.innerHTML = '<span>' + day.label + '</span>' +
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
  body.style.display = body.style.display === 'none' ? '' : 'none';
}

/* ── Add food to selected day/meal ──────────────────────────────── */
function addFood(name, group) {
  const dayId  = document.getElementById('selected-day').value;
  const mealId = document.getElementById('selected-meal').value;

  if (!menu[dayId]) menu[dayId] = {};
  if (!menu[dayId][mealId]) menu[dayId][mealId] = [];

  // Evita duplicata
  if (menu[dayId][mealId].some(function(i) { return i.name === name; })) return;

  menu[dayId][mealId].push({ name: name, group: group });
  renderSlot(dayId, mealId);
  updateDayCount(dayId);
  saveMenu();

  // Feedback visual no chip da tabela
  const chip = document.querySelector('.food-item[data-name="' + CSS.escape(name) + '"]');
  if (chip) {
    chip.classList.add('selected');
    setTimeout(function() { chip.classList.remove('selected'); }, 800);
  }
}

/* ── Remove food ────────────────────────────────────────────────── */
function removeFood(dayId, mealId, name) {
  if (!menu[dayId] || !menu[dayId][mealId]) return;
  menu[dayId][mealId] = menu[dayId][mealId].filter(function(i) { return i.name !== name; });
  renderSlot(dayId, mealId);
  updateDayCount(dayId);
  saveMenu();
}

/* ── Render slot ────────────────────────────────────────────────── */
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
    chip.innerHTML = item.name +
      '<span class="meal-chip-remove" title="Remover" onclick="removeFood(\'' +
      dayId + '\',\'' + mealId + '\',\'' + item.name.replace(/'/g, "\\'") + '\')">×</span>';
    el.appendChild(chip);
  });
}

function renderAllSlots() {
  DAYS.forEach(function(day) {
    MEALS.forEach(function(meal) {
      renderSlot(day.id, meal.id);
    });
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

/* ── Persist to localStorage ────────────────────────────────────── */
function saveMenu() {
  try {
    const toSave = {};
    DAYS.forEach(function(d) { toSave[d.id] = menu[d.id] || {}; });
    localStorage.setItem('saude_menu', JSON.stringify(toSave));
  } catch(e) {}
}

function loadMenu() {
  try {
    const saved = localStorage.getItem('saude_menu');
    if (saved) {
      const parsed = JSON.parse(saved);
      DAYS.forEach(function(d) {
        if (parsed[d.id]) {
          menu[d.id] = parsed[d.id];
          MEALS.forEach(function(m) {
            if (!menu[d.id][m.id]) menu[d.id][m.id] = [];
          });
        }
      });
      renderAllSlots();
    }
  } catch(e) {}
}

/* ── Clear all ──────────────────────────────────────────────────── */
function clearMenu() {
  if (!confirm('Limpar o cardápio inteiro da semana?')) return;
  DAYS.forEach(function(d) {
    MEALS.forEach(function(m) {
      if (menu[d.id]) menu[d.id][m.id] = [];
    });
  });
  renderAllSlots();
  saveMenu();
}

/* ── Print ──────────────────────────────────────────────────────── */
function printMenu() { window.print(); }
