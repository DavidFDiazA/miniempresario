/* ============================================================
   MINI EMPRESARIO – Game Logic v3 (game.js) — User System
   ============================================================ */

const TOTAL_DAYS = 5;
const STARTING_MONEY = 50;
const DAILY_SALARY = 10;
const STORAGE_USERS = 'miniEmpresario_users';
const STORAGE_CURRENT = 'miniEmpresario_currentUser';
const MAX_HISTORY = 10;

let selectedAvatar = '👦';
let currentUser = null;

let state = {
  money: STARTING_MONEY,
  day: 1,
  decisions: [],
  lastDecision: null,
  bonusStars: 0,
  businessLevel: 1,
  dailyHistory: [],
  todayEvent: null,
  challengeAccepted: false,
  challengeResult: null,
};

// ── User Management (localStorage) ───────────────────────────
function getAllUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_USERS)) || {}; }
  catch { return {}; }
}
function saveAllUsers(users) { localStorage.setItem(STORAGE_USERS, JSON.stringify(users)); }
function getCurrentUsername() { return localStorage.getItem(STORAGE_CURRENT); }
function setCurrentUsername(name) { localStorage.setItem(STORAGE_CURRENT, name); }
function clearCurrentUsername() { localStorage.removeItem(STORAGE_CURRENT); }

function getUser(name) { return getAllUsers()[name] || null; }

function createUser(name, avatar) {
  const users = getAllUsers();
  users[name] = { avatar, createdAt: new Date().toISOString(), bestScore: 0, bestBadge: '', totalGames: 0, history: [] };
  saveAllUsers(users);
  setCurrentUsername(name);
  currentUser = users[name];
  currentUser._name = name;
}

function loginUser(name) {
  const user = getUser(name);
  if (!user) return false;
  setCurrentUsername(name);
  currentUser = user;
  currentUser._name = name;
  return true;
}

function logoutUser() {
  clearCurrentUsername();
  currentUser = null;
  populateLoginScreen();
  showScreen('screen-login');
}

function saveGameResult(finalMoney, bonusStars, decisions, badge) {
  const name = getCurrentUsername();
  if (!name) return;
  const users = getAllUsers();
  const user = users[name];
  if (!user) return;
  const entry = { date: new Date().toISOString(), finalMoney, bonusStars, decisions: [...decisions], badge };
  user.history.unshift(entry);
  if (user.history.length > MAX_HISTORY) user.history = user.history.slice(0, MAX_HISTORY);
  user.totalGames++;
  if (finalMoney > user.bestScore) { user.bestScore = finalMoney; user.bestBadge = badge; }
  saveAllUsers(users);
  currentUser = user;
  currentUser._name = name;
}

// ── Update Dynamic Avatars Across All Screens ─────────────────
function updateAllAvatars() {
  if (!currentUser) return;
  document.querySelectorAll('.dynamic-avatar').forEach(el => { el.textContent = currentUser.avatar; });
  const wa = document.getElementById('welcome-user-avatar');
  if (wa) wa.textContent = currentUser.avatar;
  const wn = document.getElementById('welcome-user-name');
  if (wn) wn.textContent = currentUser._name;
}

// ── Login Screen Logic ────────────────────────────────────────
function populateLoginScreen() {
  const users = getAllUsers();
  const names = Object.keys(users);
  const list = document.getElementById('existing-users-list');
  const noUsers = document.getElementById('login-no-users');
  const loginMode = document.getElementById('login-mode');
  const registerMode = document.getElementById('register-mode');

  list.innerHTML = '';
  registerMode.style.display = 'none';
  loginMode.style.display = 'block';

  if (names.length === 0) {
    list.style.display = 'none';
    document.querySelector('.login-divider').style.display = 'none';
    document.querySelector('#login-mode > .btn-secondary').style.display = 'none';
    noUsers.style.display = 'block';
  } else {
    list.style.display = 'flex';
    document.querySelector('.login-divider').style.display = 'flex';
    document.querySelector('#login-mode > .btn-secondary').style.display = 'block';
    noUsers.style.display = 'none';
    names.forEach(name => {
      const u = users[name];
      const item = document.createElement('div');
      item.className = 'user-list-item';
      item.onclick = () => { loginUser(name); enterWelcome(); };
      item.innerHTML = `
        <div class="user-list-avatar">${u.avatar}</div>
        <div class="user-list-info">
          <div class="user-list-name">${name}</div>
          <div class="user-list-stats">${u.totalGames} partida${u.totalGames !== 1 ? 's' : ''} · Mejor: $${u.bestScore}</div>
        </div>
        ${u.bestBadge ? `<div class="user-list-badge">${u.bestBadge}</div>` : ''}
      `;
      list.appendChild(item);
    });
  }
}

function showRegisterMode() {
  document.getElementById('login-mode').style.display = 'none';
  document.getElementById('register-mode').style.display = 'block';
  document.getElementById('input-username').value = '';
  document.getElementById('username-error').style.display = 'none';
  selectedAvatar = '👦';
  document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
  document.querySelector('.avatar-option[data-avatar="👦"]').classList.add('selected');
}

function showLoginMode() {
  document.getElementById('register-mode').style.display = 'none';
  document.getElementById('login-mode').style.display = 'block';
}

function selectAvatar(btn) {
  document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  selectedAvatar = btn.dataset.avatar;
}

function registerUser() {
  const input = document.getElementById('input-username');
  const error = document.getElementById('username-error');
  const name = input.value.trim();
  if (name.length < 3) { error.textContent = '⚠️ El nombre debe tener al menos 3 letras'; error.style.display = 'block'; return; }
  if (name.length > 15) { error.textContent = '⚠️ El nombre es demasiado largo'; error.style.display = 'block'; return; }
  const users = getAllUsers();
  if (users[name]) { error.textContent = '⚠️ Ese nombre ya está en uso. Prueba otro.'; error.style.display = 'block'; return; }
  error.style.display = 'none';
  createUser(name, selectedAvatar);
  enterWelcome();
}

function enterWelcome() {
  updateAllAvatars();
  const greeting = document.getElementById('welcome-greeting');
  if (greeting && currentUser) greeting.textContent = `¡Hola, ${currentUser._name}! 💼`;
  const bestPill = document.getElementById('welcome-best-score');
  const bestVal = document.getElementById('welcome-best-value');
  if (currentUser && currentUser.totalGames > 0) {
    bestPill.style.display = 'inline-flex';
    bestVal.textContent = `$${currentUser.bestScore}`;
  } else {
    bestPill.style.display = 'none';
  }
  showScreen('screen-welcome');
}

// ── Ranking Screen ────────────────────────────────────────────
function showRankingScreen() {
  const users = getAllUsers();
  const entries = Object.keys(users).map(n => ({ name: n, ...users[n] })).filter(u => u.totalGames > 0);
  entries.sort((a, b) => b.bestScore - a.bestScore);
  const list = document.getElementById('ranking-list');
  const empty = document.getElementById('ranking-empty');
  list.innerHTML = '';
  if (entries.length === 0) { empty.style.display = 'block'; list.style.display = 'none'; }
  else {
    empty.style.display = 'none'; list.style.display = 'flex';
    entries.forEach((u, i) => {
      const medals = ['🥇', '🥈', '🥉'];
      const item = document.createElement('div');
      item.className = 'ranking-item';
      item.style.animationDelay = `${i * 0.1}s`;
      item.innerHTML = `
        <div class="ranking-position">${medals[i] || (i + 1)}</div>
        <div class="ranking-avatar">${u.avatar}</div>
        <div class="ranking-info">
          <div class="ranking-name">${u.name}</div>
          <div class="ranking-games">${u.totalGames} partida${u.totalGames !== 1 ? 's' : ''}</div>
        </div>
        <div style="text-align:right">
          <div class="ranking-score">$${u.bestScore}</div>
          <div class="ranking-badge-text">${u.bestBadge || ''}</div>
        </div>
      `;
      list.appendChild(item);
    });
  }
  showScreen('screen-ranking');
}

// ── History Modal ─────────────────────────────────────────────
function showMyHistory() {
  const existing = document.querySelector('.history-modal-overlay');
  if (existing) existing.remove();
  if (!currentUser) return;
  const overlay = document.createElement('div');
  overlay.className = 'history-modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  const modal = document.createElement('div');
  modal.className = 'history-modal';
  modal.innerHTML = `<h2>📊 Historial de ${currentUser._name}</h2>`;
  if (!currentUser.history || currentUser.history.length === 0) {
    modal.innerHTML += `<div class="history-modal-empty"><div class="history-modal-empty-emoji">🎮</div><p>Aún no has jugado ninguna partida.</p></div>`;
  } else {
    currentUser.history.forEach(h => {
      const d = new Date(h.date);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      const item = document.createElement('div');
      item.className = 'end-history-item';
      item.innerHTML = `<span class="end-history-date">${dateStr}</span><span class="end-history-money">$${h.finalMoney}</span><span class="end-history-badge">${h.badge}</span>`;
      modal.appendChild(item);
    });
  }
  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-secondary btn-squish';
  closeBtn.style.marginTop = '16px';
  closeBtn.textContent = '✕ Cerrar';
  closeBtn.onclick = () => overlay.remove();
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function goToWelcome() { enterWelcome(); }

// ── Business Locations ────────────────────────────────────────
const businessLocations = [
  { id:'home',   emoji:'🏠', name:'En Casa',            rent:0,  successMod:-0.15, gainMod:-5, traffic:'Bajo',    trafficColor:'#EA4335', desc:'Sin costo de arriendo, pero muy pocos clientes te ven. Ideal para empezar con poco riesgo.' },
  { id:'barrio', emoji:'🏘️', name:'Barrio Residencial',  rent:3,  successMod:0,     gainMod:0,  traffic:'Medio',   trafficColor:'#F9AB00', desc:'Zona tranquila con clientes moderados. Buen balance entre costo y visibilidad.' },
  { id:'calle',  emoji:'🛍️', name:'Calle Comercial',     rent:6,  successMod:+0.12, gainMod:+5, traffic:'Alto',    trafficColor:'#34A853', desc:'Mucho tráfico peatonal. Los clientes pasan constantemente frente a tu negocio.' },
  { id:'centro', emoji:'🏙️', name:'Centro Comercial',    rent:10, successMod:+0.20, gainMod:+8, traffic:'Muy Alto', trafficColor:'#1a73e8', desc:'La mejor ubicación de la ciudad. Máxima visibilidad pero arriendo elevado.' },
  { id:'playa',  emoji:'🏖️', name:'Playa Turística',     rent:8,  successMod:+0.15, gainMod:+5, traffic:'Variable', trafficColor:'#E65100', desc:'Turistas con ganas de gastar. Gran potencial pero depende de la temporada.' },
];

function selectLocation(locId) {
  const loc = businessLocations.find(l => l.id === locId);
  if (!loc) return;
  state.location = loc;
  // Highlight selected card
  document.querySelectorAll('.location-card').forEach(c => c.classList.remove('loc-selected'));
  const card = document.querySelector(`.location-card[data-loc="${locId}"]`);
  if (card) card.classList.add('loc-selected');
  // Enable start button
  const btn = document.getElementById('btn-location-go');
  btn.disabled = false;
  btn.textContent = `¡Abrir en ${loc.name}! 🚀`;
}

function confirmLocation() {
  if (!state.location) return;
  startDay();
}

function showLocationScreen() {
  const container = document.getElementById('location-cards');
  container.innerHTML = '';
  businessLocations.forEach(loc => {
    const card = document.createElement('div');
    card.className = 'location-card sticker-mat';
    card.dataset.loc = loc.id;
    card.onclick = () => selectLocation(loc.id);
    card.innerHTML = `
      <div class="loc-emoji">${loc.emoji}</div>
      <div class="loc-info">
        <div class="loc-name">${loc.name}</div>
        <div class="loc-desc">${loc.desc}</div>
        <div class="loc-stats">
          <span class="loc-stat"><span class="loc-stat-icon">💸</span> Arriendo: <strong>$${loc.rent}/día</strong></span>
          <span class="loc-stat"><span class="loc-stat-icon">👥</span> Tráfico: <strong style="color:${loc.trafficColor}">${loc.traffic}</strong></span>
          ${loc.gainMod > 0 ? `<span class="loc-stat"><span class="loc-stat-icon">📈</span> Ganancia: <strong style="color:#34A853">+$${loc.gainMod}</strong></span>` : ''}
          ${loc.gainMod < 0 ? `<span class="loc-stat"><span class="loc-stat-icon">📉</span> Ganancia: <strong style="color:#EA4335">$${loc.gainMod}</strong></span>` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  document.getElementById('btn-location-go').disabled = true;
  document.getElementById('btn-location-go').textContent = 'Elige una ubicación...';
  showScreen('screen-location');
}

// ── Market Events ─────────────────────────────────────────────
const marketEvents = [
  { id:'fair',    emoji:'🎪', title:'¡Hay feria en el parque!',      desc:'Más clientes hoy. Tu negocio tiene mayor probabilidad de éxito.',  successBonus:+0.15, costMod:0,   gainMod:0   },
  { id:'rain',    emoji:'🌧️', title:'Lluvia toda la tarde',           desc:'Pocos clientes saldrán. Tu negocio tiene más riesgo hoy.',          successBonus:-0.20, costMod:0,   gainMod:0   },
  { id:'trend',   emoji:'📱', title:'¡Tu producto es tendencia!',     desc:'Las redes lo viralizaron. Posibles ganancias extra hoy.',           successBonus:+0.10, costMod:0,   gainMod:+10 },
  { id:'supply',  emoji:'📦', title:'Escasez de materiales',          desc:'El costo de producción subió un poco hoy.',                        successBonus:0,     costMod:+5,  gainMod:0   },
  { id:'holiday', emoji:'🎉', title:'¡Día festivo!',                  desc:'La gente está de fiesta. Mucha demanda de productos.',              successBonus:+0.20, costMod:0,   gainMod:+5  },
  { id:'comp',    emoji:'🏪', title:'Competencia nueva en el barrio', desc:'Abrió otra tienda cerca. Puede quitarte clientes hoy.',             successBonus:-0.15, costMod:0,   gainMod:-5  },
  { id:'sun',     emoji:'☀️', title:'Día soleado perfecto',           desc:'¡El clima invita a salir! Más personas en la calle.',              successBonus:+0.10, costMod:0,   gainMod:0   },
  { id:'promo',   emoji:'📣', title:'¡Publicidad gratis!',            desc:'Alguien recomendó tu negocio. Más clientes esperados.',             successBonus:+0.15, costMod:0,   gainMod:+5  },
];

// ── Daily Challenges ──────────────────────────────────────────
const dailyChallenges = [
  { question:'¿Apostamos $10 extra al negocio de hoy?', betAmount:10, winGain:18, loseAmount:10, winProb:0.55 },
  { question:'¿Invertimos $15 en una campaña de publicidad?', betAmount:15, winGain:25, loseAmount:15, winProb:0.50 },
  { question:'¿Compramos más stock por $12 para vender más?', betAmount:12, winGain:22, loseAmount:12, winProb:0.60 },
  { question:'¿Hacemos un descuento especial para atraer clientes? (cuesta $8)', betAmount:8, winGain:15, loseAmount:8, winProb:0.65 },
  { question:'¿Renovamos el puesto por $20 para atraer más clientes?', betAmount:20, winGain:35, loseAmount:20, winProb:0.50 },
];

// ── Round Configurations ──────────────────────────────────────
const rounds = [
  {
    day:1, question:'¿Qué quieres hacer con tu dinero?',
    investCost:30, investReturn:50, investLabel:'Comprar Jugos para Vender', investEmoji:'🧃',
    spendCost:50,  spendLabel:'Comprar un Juguete', spendEmoji:'🤖',
    saveTip:'Guardar dinero',
    tip:'Invertir en algo que puedes vender te ayudará a ganar más dinero.',
    invest:{ full:{ emoji:'🧃🎉', title:'¡Gran inversión!', desc:'Compraste jugos por $30 y los vendiste todos. ¡Ganaste $20 extra!' },
             partial:{ emoji:'🧃😅', title:'Venta parcial', desc:'Vendiste algunos jugos, pero no todos. Ganaste menos de lo esperado.' },
             fail:{ emoji:'🧃😢', title:'No hubo ventas', desc:'Hoy no había clientes. Perdiste parte de lo invertido en materiales.' } },
    spend:{ emoji:'🤖😅', title:'¡Compra impulsiva!', change:-50, desc:'El juguete fue divertido, pero gastaste todo tu dinero en algo que no genera ingresos.' },
    save:{ emoji:'🐷✨', title:'¡Ahorraste bien!', change:0, desc:'Guardaste tu dinero. No ganaste más, pero tampoco perdiste. ¡La seguridad también importa!' },
  },
  {
    day:2, question:'¡Tienes algo de dinero! ¿Qué harás hoy?',
    investCost:20, investReturn:35, investLabel:'Vender Limonadas', investEmoji:'🍋',
    spendCost:25,  spendLabel:'Comprar Helado para ti', spendEmoji:'🍦',
    saveTip:'Guardar dinero',
    tip:'Un pequeño negocio bien manejado puede crecer con el tiempo.',
    invest:{ full:{ emoji:'🍋💰', title:'¡Negocio exitoso!', desc:'Vendiste limonadas y ganaste $15. ¡Eres un gran empresario!' },
             partial:{ emoji:'🍋😐', title:'Ventas lentas', desc:'Vendiste algunas limonadas. Ganaste menos de lo esperado.' },
             fail:{ emoji:'🍋😢', title:'Día difícil', desc:'La competencia tuvo más clientes hoy. Perdiste algo de tu inversión.' } },
    spend:{ emoji:'🍦😬', title:'¡Algo de gusto está bien…', change:-25, desc:'El helado estaba rico, pero recuerda que los gastos frecuentes reducen tus ahorros.' },
    save:{ emoji:'🏦💚', title:'¡Ahorro inteligente!', change:0, desc:'Guardaste tu dinero. Los ahorros son una red de seguridad muy importante.' },
  },
  {
    day:3, question:'Día 3: ¡Una oportunidad especial!',
    investCost:40, investReturn:70, investLabel:'Vender Artesanías', investEmoji:'🎨',
    spendCost:30,  spendLabel:'Ir al Parque de Diversiones', spendEmoji:'🎡',
    saveTip:'Mantener ahorro',
    tip:'Las inversiones más grandes pueden traer mayores ganancias, ¡pero también más riesgo!',
    invest:{ full:{ emoji:'🎨🤩', title:'¡Artista empresario!', desc:'Hiciste artesanías por $40 y las vendiste en $70. ¡Ganaste $30!' },
             partial:{ emoji:'🎨😊', title:'Ventas aceptables', desc:'Vendiste algunas artesanías. Buena inversión pero no perfecta.' },
             fail:{ emoji:'🎨😢', title:'Poca demanda', desc:'Hoy la gente no compró artesanías. El mercado es impredecible.' } },
    spend:{ emoji:'🎡😊', title:'¡Diversión costosa!', change:-30, desc:'El parque fue genial, pero recuerda: el dinero gastado en diversión no regresa.' },
    save:{ emoji:'🔐💛', title:'¡Guardando para el futuro!', change:0, desc:'Elegiste no arriesgarte. Ahorrar también es una decisión válida y sabia.' },
  },
  {
    day:4, question:'¡Ya casi terminas! ¿Cuál es tu estrategia?',
    investCost:25, investReturn:45, investLabel:'Vender Galletas Caseras', investEmoji:'🍪',
    spendCost:20,  spendLabel:'Comprar Videojuego', spendEmoji:'🎮',
    saveTip:'Conservar dinero',
    tip:'Las ganancias acumuladas te ayudarán a tener un gran resultado al final.',
    invest:{ full:{ emoji:'🍪🏅', title:'¡Pastelero exitoso!', desc:'¡Tus galletas volaron! Vendiste por $45 habiendo invertido $25. ¡Ganancia de $20!' },
             partial:{ emoji:'🍪😅', title:'Ventas moderadas', desc:'Se vendieron algunas galletas. No fue tu mejor día, pero algo es algo.' },
             fail:{ emoji:'🍪😢', title:'Galletas sin vender', desc:'Hoy nadie compró. A veces el negocio no sale como esperamos.' } },
    spend:{ emoji:'🎮😅', title:'¡Buen juego, pero…', change:-20, desc:'El videojuego estuvo genial, pero recuerda que las compras impulsivas reducen tu capital.' },
    save:{ emoji:'💰🙌', title:'¡Disciplina financiera!', change:0, desc:'Guardaste de nuevo. La disciplina de ahorrar es la base de la salud financiera.' },
  },
  {
    day:5, question:'¡Último día! ¿Cómo terminarás tu aventura?',
    investCost:35, investReturn:65, investLabel:'Gran Venta Final', investEmoji:'🏆',
    spendCost:40,  spendLabel:'Fiesta de Celebración', spendEmoji:'🎉',
    saveTip:'Guardar todo',
    tip:'¡Esta es tu última oportunidad para maximizar tus ganancias!',
    invest:{ full:{ emoji:'🏆🎊', title:'¡Empresario del año!', desc:'¡Lo diste todo! Tu inversión de $35 te generó $65. ¡Ganaste $30 en el último día!' },
             partial:{ emoji:'🏆😊', title:'¡Buen cierre!', desc:'No fue el mejor resultado, pero terminaste con ganancia. ¡Bien hecho!' },
             fail:{ emoji:'🏆😢', title:'Último día difícil', desc:'El negocio no salió bien hoy. Pero aprendiste mucho en esta aventura.' } },
    spend:{ emoji:'🎉😬', title:'¡Celebración cara!', change:-40, desc:'La fiesta estuvo increíble, pero gastaste $40 en diversión que no genera retorno.' },
    save:{ emoji:'🦺💎', title:'¡Conservador inteligente!', change:0, desc:'Terminaste conservando tu dinero. La estabilidad tiene su propio valor.' },
  },
];

// ── Invest Outcome Calculator (with event + location modifier) ─
function calculateInvestOutcome(round, event) {
  const loc = state.location;
  const baseProb = 0.50;
  const eventBonus = event ? event.successBonus : 0;
  const locBonus = loc ? loc.successMod : 0;
  let probFull = Math.min(0.85, Math.max(0.10, baseProb + eventBonus + locBonus));
  let probPartial = 0.25;
  let probFail = Math.max(0.05, 1 - probFull - probPartial);

  const roll = Math.random();
  let type;
  if (roll < probFull) type = 'full';
  else if (roll < probFull + probPartial) type = 'partial';
  else type = 'fail';

  let cost = round.investCost + (event ? event.costMod : 0);
  let locGainMod = loc ? loc.gainMod : 0;
  let fullGain = (round.investReturn - round.investCost) + (event ? event.gainMod : 0) + locGainMod;
  let change;
  if (type === 'full') change = fullGain;
  else if (type === 'partial') change = Math.floor(fullGain * 0.4);
  else change = -Math.floor(cost * 0.5);

  // Generate customers count for feedback
  let customers;
  if (type === 'full') customers = Math.floor(Math.random() * 8) + 12;
  else if (type === 'partial') customers = Math.floor(Math.random() * 5) + 4;
  else customers = Math.floor(Math.random() * 3);

  // Save details for feedback
  state.lastInvestDetails = {
    baseProb: Math.round(baseProb * 100),
    eventBonus: Math.round(eventBonus * 100),
    locBonus: Math.round(locBonus * 100),
    totalProb: Math.round(probFull * 100),
    customers,
    locName: loc ? loc.name : 'Sin ubicación',
    locEmoji: loc ? loc.emoji : '',
    eventName: event ? event.title : '',
    eventEmoji: event ? event.emoji : '',
    rent: loc ? loc.rent : 0,
  };

  return { type, result: round.invest[type], change, cost };
}

// ── Screen Manager ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const target = document.getElementById(id);
  target.style.display = 'flex';
  requestAnimationFrame(() => target.classList.add('active'));
}

// ── Start Game ────────────────────────────────────────────────
function startGame() {
  state = {
    money: STARTING_MONEY, day: 1, decisions: [],
    lastDecision: null, bonusStars: 0, businessLevel: 1,
    dailyHistory: [], todayEvent: null,
    challengeAccepted: false, challengeResult: null,
    location: null, lastInvestDetails: null,
  };
  updateAllAvatars();
  showLocationScreen();
}

// ── Start Day: salary + news ──────────────────────────────────
function startDay() {
  // Daily salary
  state.money += DAILY_SALARY;
  // Deduct rent
  if (state.location && state.location.rent > 0) {
    state.money = Math.max(0, state.money - state.location.rent);
  }
  state.todayEvent = marketEvents[Math.floor(Math.random() * marketEvents.length)];
  showNewsScreen();
}

// ── News Screen ───────────────────────────────────────────────
function showNewsScreen() {
  const ev = state.todayEvent;
  document.getElementById('news-day').textContent = state.day;
  document.getElementById('news-emoji').textContent = ev.emoji;
  document.getElementById('news-title').textContent = ev.title;
  document.getElementById('news-desc').textContent = ev.desc;

  let effectText = '';
  if (ev.successBonus > 0) effectText = `✅ +${Math.round(ev.successBonus*100)}% probabilidad de éxito`;
  else if (ev.successBonus < 0) effectText = `⚠️ ${Math.round(ev.successBonus*100)}% probabilidad de éxito`;
  if (ev.costMod > 0) effectText += (effectText ? ' · ' : '') + `📦 Costo +$${ev.costMod}`;
  if (ev.gainMod > 0) effectText += (effectText ? ' · ' : '') + `💰 Ganancia +$${ev.gainMod}`;
  if (ev.gainMod < 0) effectText += (effectText ? ' · ' : '') + `💰 Ganancia -$${Math.abs(ev.gainMod)}`;
  if (!effectText) effectText = '📊 Sin efecto especial hoy';
  document.getElementById('news-effect').textContent = effectText;

  document.getElementById('news-money').textContent = `$${state.money}`;

  // Setup challenge
  const ch = dailyChallenges[state.day - 1];
  document.getElementById('challenge-question').textContent = ch.question;
  document.getElementById('challenge-win').textContent = `+$${ch.winGain} y ⭐ bono`;
  document.getElementById('challenge-lose').textContent = `-$${ch.loseAmount}`;
  document.getElementById('challenge-canafford').style.display = state.money >= ch.betAmount ? 'none' : 'block';
  document.getElementById('btn-challenge-yes').disabled = state.money < ch.betAmount;

  showScreen('screen-news');
}

// ── Challenge Decision ─────────────────────────────────────────
function decideChallenge(accepted) {
  if (accepted) {
    const ch = dailyChallenges[state.day - 1];
    const won = Math.random() < ch.winProb;
    state.challengeAccepted = true;
    if (won) {
      state.money += ch.winGain;
      state.bonusStars += 1;
      state.challengeResult = { won:true, msg:`🎉 ¡Ganaste! +$${ch.winGain} y una ⭐ estrella bonus.` };
    } else {
      state.money = Math.max(0, state.money - ch.loseAmount);
      state.challengeResult = { won:false, msg:`😅 No salió bien. Perdiste $${ch.loseAmount}. ¡El riesgo existe!` };
    }
  } else {
    state.challengeAccepted = false;
    state.challengeResult = null;
  }
  renderGameScreen();
  showScreen('screen-game');
}

// ── Render Game Screen ─────────────────────────────────────────
function renderGameScreen() {
  const round = rounds[state.day - 1];

  document.getElementById('money-display').textContent = `$${state.money}`;
  document.getElementById('day-display').textContent = state.day;
  document.getElementById('question-text').textContent = round.question;
  document.getElementById('tip-text').textContent = round.tip;
  document.getElementById('stars-display').textContent = '⭐'.repeat(state.bonusStars) || '—';

  // Event badge
  const ev = state.todayEvent;
  const badge = document.getElementById('event-badge');
  badge.textContent = `${ev.emoji} ${ev.title}`;
  badge.style.display = 'inline-flex';

  // Location badge
  const locBadge = document.getElementById('location-badge');
  if (locBadge && state.location) {
    locBadge.textContent = `${state.location.emoji} ${state.location.name} · Arriendo: $${state.location.rent}/día`;
    locBadge.style.display = 'inline-flex';
  }

  // Challenge result notification
  const notif = document.getElementById('challenge-notif');
  if (state.challengeResult) {
    notif.textContent = state.challengeResult.msg;
    notif.style.display = 'block';
    notif.className = 'challenge-notif ' + (state.challengeResult.won ? 'notif-win' : 'notif-lose');
  } else {
    notif.style.display = 'none';
  }

  // Invest card — show adjusted values with location modifier
  const loc = state.location;
  const locGainMod = loc ? loc.gainMod : 0;
  const adjCost = round.investCost + (ev.costMod || 0);
  const adjGain = (round.investReturn - round.investCost) + (ev.gainMod || 0) + locGainMod;
  document.getElementById('invest-price').textContent = `Costo: $${adjCost} → Gana hasta $${adjGain}`;
  document.getElementById('invest-emoji').textContent = round.investEmoji;
  const investCard = document.getElementById('card-invest');
  investCard.querySelector('.card-title').textContent = round.investLabel;

  document.getElementById('spend-price').textContent = `Costo: $${round.spendCost}`;
  document.getElementById('spend-emoji').textContent = round.spendEmoji;
  const spendCard = document.getElementById('card-spend');
  spendCard.querySelector('.card-title').textContent = round.spendLabel;

  document.getElementById('save-action').textContent = `${round.saveTip} ▶`;

  document.querySelectorAll('.decision-card').forEach(c => c.classList.remove('disabled'));
  document.getElementById('btn-continue').style.display = 'none';

  if (state.money < adjCost) investCard.classList.add('disabled');
  if (state.money < round.spendCost) spendCard.classList.add('disabled');
}

// ── Make Decision ─────────────────────────────────────────────
function makeDecision(type) {
  const round = rounds[state.day - 1];
  let result, moneyChange = 0, outcomeType = '';

  if (type === 'invest') {
    const outcome = calculateInvestOutcome(round, state.todayEvent);
    moneyChange = outcome.change;
    result = outcome.result;
    outcomeType = outcome.type;
    // Update business level
    if (outcomeType === 'full') state.businessLevel = Math.min(5, state.businessLevel + 1);
    else if (outcomeType === 'fail') state.businessLevel = Math.max(1, state.businessLevel - 1);
  } else if (type === 'spend') {
    moneyChange = round.spend.change;
    result = { ...round.spend };
  } else {
    moneyChange = round.save.change;
    result = { ...round.save };
  }

  state.money = Math.max(0, state.money + moneyChange);
  state.lastDecision = { type, result, moneyChange, outcomeType };
  state.decisions.push(type);
  state.dailyHistory.push({ day: state.day, type, change: moneyChange, total: state.money });

  showResultScreen(result, moneyChange, outcomeType, type);
}

// ── Show Result Screen ─────────────────────────────────────────
function showResultScreen(result, moneyChange, outcomeType, decType) {
  document.getElementById('result-emoji').textContent = result.emoji;
  document.getElementById('result-title').textContent = result.title;
  document.getElementById('result-description').textContent = result.desc;

  const changeEl = document.getElementById('result-money-change-text');
  if (moneyChange > 0) {
    changeEl.textContent = `+$${moneyChange}`;
    changeEl.className = 'money-gained';
  } else if (moneyChange < 0) {
    changeEl.textContent = `-$${Math.abs(moneyChange)}`;
    changeEl.className = 'money-lost';
  } else {
    changeEl.textContent = `$0 (sin cambio)`;
    changeEl.className = 'money-neutral';
  }

  document.getElementById('result-total-money').textContent = `$${state.money}`;

  // Show invest outcome badge
  const outcomeBadge = document.getElementById('result-outcome-badge');
  const feedbackSection = document.getElementById('result-feedback');

  if (decType === 'invest') {
    outcomeBadge.style.display = 'inline-block';
    if (outcomeType === 'full') {
      outcomeBadge.textContent = '🎲 Éxito Total';
      outcomeBadge.className = 'outcome-badge outcome-full';
    } else if (outcomeType === 'partial') {
      outcomeBadge.textContent = '🎲 Éxito Parcial';
      outcomeBadge.className = 'outcome-badge outcome-partial';
    } else {
      outcomeBadge.textContent = '🎲 Fracaso del Negocio';
      outcomeBadge.className = 'outcome-badge outcome-fail';
    }

    // Detailed feedback
    if (feedbackSection && state.lastInvestDetails) {
      feedbackSection.style.display = 'block';
      const d = state.lastInvestDetails;
      feedbackSection.innerHTML = `
        <div class="feedback-customers">
          <div class="feedback-label">👥 Clientes del día</div>
          <div class="customers-row">${'👤'.repeat(Math.min(d.customers, 20))}</div>
          <div class="customers-count">${d.customers} cliente${d.customers !== 1 ? 's' : ''} visitaron tu negocio</div>
        </div>
        <div class="feedback-probability">
          <div class="feedback-label">🎯 Probabilidad de éxito</div>
          <div class="prob-bar-track">
            <div class="prob-bar-fill ${outcomeType === 'full' ? 'prob-success' : outcomeType === 'partial' ? 'prob-partial' : 'prob-fail'}" style="width:${d.totalProb}%"></div>
            <span class="prob-bar-text">${d.totalProb}%</span>
          </div>
        </div>
        <div class="feedback-factors">
          <div class="feedback-label">📊 Factores que influyeron</div>
          <div class="factor-item"><span class="factor-icon">🎲</span><span>Base del negocio</span><span class="factor-val">${d.baseProb}%</span></div>
          <div class="factor-item"><span class="factor-icon">${d.locEmoji}</span><span>${d.locName}</span><span class="factor-val ${d.locBonus >= 0 ? 'factor-pos' : 'factor-neg'}">${d.locBonus >= 0 ? '+' : ''}${d.locBonus}%</span></div>
          <div class="factor-item"><span class="factor-icon">${d.eventEmoji}</span><span>${d.eventName}</span><span class="factor-val ${d.eventBonus >= 0 ? 'factor-pos' : 'factor-neg'}">${d.eventBonus >= 0 ? '+' : ''}${d.eventBonus}%</span></div>
          ${d.rent > 0 ? `<div class="factor-item factor-rent"><span class="factor-icon">🏠</span><span>Arriendo del día</span><span class="factor-val factor-neg">-$${d.rent}</span></div>` : ''}
        </div>
      `;
    }
  } else {
    outcomeBadge.style.display = 'none';
    if (feedbackSection) feedbackSection.style.display = 'none';
  }

  showScreen('screen-result');
}

// ── Continue From Result → Shop Screen ────────────────────────
function continueFromResult() {
  updateShopScreen();
  showScreen('screen-shop');
}

// ── Shop Screen ───────────────────────────────────────────────
function updateShopScreen() {
  document.getElementById('shop-day').textContent = state.day;
  document.getElementById('shop-money').textContent = `$${state.money}`;
  document.getElementById('shop-stars-bonus').textContent = state.bonusStars;

  // Business level stars
  const starsEl = document.getElementById('shop-level-stars');
  starsEl.textContent = '⭐'.repeat(state.businessLevel) + '☆'.repeat(5 - state.businessLevel);

  // Business mood
  const moodEl = document.getElementById('shop-mood');
  const lastD = state.lastDecision;
  if (lastD) {
    if (lastD.moneyChange > 10) moodEl.textContent = '😄 ¡Tu negocio está prosperando!';
    else if (lastD.moneyChange > 0) moodEl.textContent = '🙂 Tu negocio va bien.';
    else if (lastD.moneyChange === 0) moodEl.textContent = '😐 Tu negocio está estable.';
    else moodEl.textContent = '😟 Tu negocio tuvo un mal día.';
  }

  // History bars
  const histEl = document.getElementById('shop-history');
  histEl.innerHTML = '';
  state.dailyHistory.forEach(h => {
    const bar = document.createElement('div');
    bar.className = 'history-bar-wrap';
    const isPos = h.change >= 0;
    bar.innerHTML = `
      <div class="history-day-label">Día ${h.day}</div>
      <div class="history-bar ${isPos ? 'bar-pos' : 'bar-neg'}" style="height:${Math.min(60, Math.abs(h.change) * 2 + 8)}px">
        ${h.change >= 0 ? '+' : ''}$${h.change}
      </div>
    `;
    histEl.appendChild(bar);
  });

  // Shop character
  const char = document.getElementById('shop-char');
  if (state.businessLevel >= 4) char.textContent = '🧑‍💼';
  else if (state.businessLevel >= 2) char.textContent = '🧑‍🍳';
  else char.textContent = '😓';

  // Next button text
  const nextBtn = document.getElementById('btn-shop-next');
  nextBtn.textContent = state.day >= TOTAL_DAYS ? '📊 Ver resultados finales' : `Ir al Día ${state.day + 1} →`;
}

// ── From Shop → Next Day or End ───────────────────────────────
function shopContinue() {
  if (state.day >= TOTAL_DAYS) {
    showEndScreen();
  } else {
    state.day++;
    startDay();
  }
}

// ── Show End Screen ────────────────────────────────────────────
function showEndScreen() {
  const finalMoney = state.money;
  let emoji, title, badge, message;

  if (finalMoney >= 130) {
    emoji='🏆'; title='¡Súper Empresario!'; badge='🥇 Oro – Maestro del Dinero';
    message='¡Tomaste excelentes decisiones! Eres un verdadero experto en finanzas.';
  } else if (finalMoney >= 90) {
    emoji='🌟'; title='¡Empresario Inteligente!'; badge='🥈 Plata – Inversor Hábil';
    message='¡Muy bien! Supiste hacer crecer tu dinero con decisiones inteligentes.';
  } else if (finalMoney >= 60) {
    emoji='👍'; title='¡Buen trabajo!'; badge='🥉 Bronce – Ahorrador Seguro';
    message='Mantuviste tu capital. ¡Sigue practicando para hacerlo crecer aún más!';
  } else {
    emoji='📚'; title='¡Sigue aprendiendo!'; badge='💡 Aprendiz – ¡No te rindas!';
    message='Esta vez el dinero no alcanzó, ¡pero aprendiste lecciones muy valiosas!';
  }

  // Save result to user profile
  saveGameResult(finalMoney, state.bonusStars, state.decisions, badge);

  document.getElementById('end-money').textContent = `$${finalMoney}`;
  document.getElementById('end-emoji').textContent = emoji;
  document.getElementById('end-title').textContent = title;
  document.getElementById('end-badge').textContent = badge;
  document.getElementById('end-message').textContent = message;
  document.getElementById('end-subtitle').textContent =
    `¡Terminaste los 5 días! Empezaste con $${STARTING_MONEY} y terminaste con $${finalMoney}.`;
  document.getElementById('end-bonus-stars').textContent = `⭐ Estrellas bonus ganadas: ${state.bonusStars}`;

  const lessonsList = document.getElementById('lessons-list');
  lessonsList.innerHTML = buildLessons(state.decisions).map(l => `<li>${l}</li>`).join('');

  // Show user history on end screen
  const histSection = document.getElementById('end-history');
  const histList = document.getElementById('end-history-list');
  if (currentUser && currentUser.history && currentUser.history.length > 1) {
    histSection.style.display = 'block';
    histList.innerHTML = '';
    currentUser.history.slice(0, 5).forEach(h => {
      const d = new Date(h.date);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      const item = document.createElement('div');
      item.className = 'end-history-item';
      item.innerHTML = `<span class="end-history-date">${dateStr}</span><span class="end-history-money">$${h.finalMoney}</span><span class="end-history-badge">${h.badge}</span>`;
      histList.appendChild(item);
    });
  } else {
    histSection.style.display = 'none';
  }

  showScreen('screen-end');
}

// ── Build Lessons ─────────────────────────────────────────────
function buildLessons(decisions) {
  const lessons = [];
  const ic = decisions.filter(d => d==='invest').length;
  const sc = decisions.filter(d => d==='spend').length;
  const sv = decisions.filter(d => d==='save').length;
  if (ic > 0) lessons.push(`💹 Invertiste ${ic} veces — ¡la inversión genera ganancias pero tiene riesgos!`);
  if (sv > 0) lessons.push(`🐷 Ahorraste ${sv} veces — el ahorro da seguridad financiera.`);
  if (sc > 0) lessons.push(`🛍️ Gastaste ${sc} veces — cada gasto reduce tu capital disponible.`);
  if (ic >= 3) lessons.push(`⭐ ¡Eres un excelente inversor! Aprendiste a manejar el riesgo.`);
  if (sc === 0) lessons.push(`🌈 ¡Nunca caíste en compras impulsivas! Eso es disciplina financiera.`);
  if (state.bonusStars >= 3) lessons.push(`🎯 ¡Aceptaste ${state.bonusStars} retos! Entiendes el riesgo calculado.`);
  if (lessons.length === 0)
    lessons.push('🧠 Aprender sobre finanzas es el primer paso hacia la independencia económica.');
  return lessons;
}

function resetGame() { startGame(); }

window.addEventListener('DOMContentLoaded', () => {
  const savedName = getCurrentUsername();
  if (savedName) {
    const success = loginUser(savedName);
    if (success) {
      enterWelcome();
      return;
    }
  }
  populateLoginScreen();
  showScreen('screen-login');
});
