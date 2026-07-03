/* ============================================================
   Night Fair / Gece Panayırı — core engine
   Registry, hub, router, storage, audio, tickets, helpers.
   No dependencies. Games register via Games.register({...}).
   ============================================================ */
'use strict';

/* ---------- locale ---------- */
var NF = { lang: document.documentElement.lang || 'en' };
var L = window.I18N;

function t(path, vars) {
  var cur = L;
  path.split('.').forEach(function (p) { cur = cur ? cur[p] : undefined; });
  var s = (cur === undefined || cur === null) ? path : cur;
  if (typeof s === 'string' && vars) {
    Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
  }
  return s;
}

/* ---------- storage (localStorage, nf_ prefix) ---------- */
var S = {
  get: function (k, fb) {
    try {
      var v = localStorage.getItem('nf_' + k);
      return v === null ? fb : JSON.parse(v);
    } catch (e) { return fb; }
  },
  set: function (k, v) {
    try { localStorage.setItem('nf_' + k, JSON.stringify(v)); } catch (e) {}
  }
};

/* ---------- tiny DOM / math helpers ---------- */
function el(tag, cls, html) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}
function btn(label, fn, secondary) {
  var b = el('button', 'action' + (secondary ? ' secondary' : ''), label);
  b.onclick = function () { sfx('click'); fn(); };
  return b;
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
function rnd(n) { return Math.floor(Math.random() * n); }
function pick(a) { return a[rnd(a.length)]; }
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function fmtTime(sec) { return Math.floor(sec / 60) + ':' + pad2(sec % 60); }
function todayKey() {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}
function dayNumber() {
  var now = new Date();
  return Math.floor((now - new Date(2026, 0, 1)) / 86400000);
}

/* ---------- audio (synth beeps, mutable) ---------- */
var _ac = null;
function sfx(kind) {
  if (S.get('mute', false)) return;
  try {
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === 'suspended') _ac.resume();
    var now = _ac.currentTime;
    var notes = {
      click: [[520, 0, 0.05]],
      tick:  [[1100, 0, 0.03]],
      pop:   [[780, 0, 0.07]],
      good:  [[660, 0, 0.08], [880, 0.08, 0.10]],
      bad:   [[220, 0, 0.12], [160, 0.10, 0.16]],
      win:   [[523, 0, 0.10], [659, 0.10, 0.10], [784, 0.20, 0.10], [1047, 0.30, 0.22]],
      lose:  [[330, 0, 0.14], [262, 0.13, 0.14], [196, 0.26, 0.26]]
    }[kind] || [[520, 0, 0.05]];
    notes.forEach(function (n) {
      var o = _ac.createOscillator(), g = _ac.createGain();
      o.type = 'triangle';
      o.frequency.value = n[0];
      g.gain.setValueAtTime(0.0001, now + n[1]);
      g.gain.exponentialRampToValueAtTime(0.12, now + n[1] + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
      o.connect(g); g.connect(_ac.destination);
      o.start(now + n[1]); o.stop(now + n[1] + n[2] + 0.02);
    });
  } catch (e) {}
}
/* iOS Safari: AudioContext can only be unlocked inside a real, synchronous
   user gesture. Some sounds in-game are triggered later (timers, animation
   frames, swipe/drag logic) which iOS does NOT count as a gesture, so the
   context can stay "suspended" forever if it was never opened directly
   inside a tap/click. This grabs the very first touch/click anywhere on
   the page and uses it to create + resume the context immediately. */
document.addEventListener('pointerdown', function unlockAudio() {
  try {
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    if (_ac.state === 'suspended') _ac.resume();
  } catch (e) {}
}, { once: true });

/* ---------- toast ---------- */
var _toastBox = null;
function toast(msg) {
  if (!_toastBox) { _toastBox = el('div', 'toast-box'); document.body.appendChild(_toastBox); }
  var m = el('div', 'toast', msg);
  _toastBox.appendChild(m);
  setTimeout(function () { m.classList.add('out'); }, 1800);
  setTimeout(function () { m.remove(); }, 2300);
}

/* ---------- tickets ---------- */
function tickets() { return S.get('tickets', 0); }
function award(n) {
  if (!n) return;
  S.set('tickets', Math.max(0, tickets() + n));
  var elc = document.getElementById('nf-tickets');
  if (elc) elc.textContent = '🎟 ' + tickets();
  if (n > 0) toast(t('core.ticketGain', { n: n }));
}
function spendTickets(n) {
  if (tickets() < n) return false;
  S.set('tickets', tickets() - n);
  var elc = document.getElementById('nf-tickets');
  if (elc) elc.textContent = '🎟 ' + tickets();
  return true;
}

/* ---------- best scores ---------- */
function getBest(id) { return S.get('best_' + id, null); }
function setBest(id, val, lower) {
  var cur = getBest(id);
  var better = cur === null || (lower ? val < cur : val > cur);
  if (better) {
    S.set('best_' + id, val);
    toast(t('core.newBest'));
    award(5);
  }
  return better;
}

/* ---------- game registry ---------- */
var Games = {
  list: [],
  byId: {},
  register: function (def) {
    def.W = (def.str && (def.str[NF.lang] || def.str.en)) || {};
    Games.list.push(def);
    Games.byId[def.id] = def;
  }
};
var CATS = ['arcade', 'puzzle', 'word', 'brain', 'cards', 'board', 'carnival'];

/* ---------- active-game lifecycle ---------- */
var _active = null; // { id, cleanups: [] }
function onCleanup(fn) { if (_active) _active.cleanups.push(fn); }
function addKey(handler) {
  var h = function (e) { handler(e); };
  document.addEventListener('keydown', h);
  onCleanup(function () { document.removeEventListener('keydown', h); });
}
function loop(fn) {
  var run = true, last = performance.now();
  function frame(ts) {
    if (!run) return;
    fn(Math.min((ts - last) / 1000, 0.05));
    last = ts;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  onCleanup(function () { run = false; });
  return function () { run = false; };
}
function every(fn, ms) {
  var id = setInterval(fn, ms);
  onCleanup(function () { clearInterval(id); });
  return id;
}
function after(fn, ms) {
  var id = setTimeout(fn, ms);
  onCleanup(function () { clearTimeout(id); });
  return id;
}

/* ---------- canvas helper (DPR-aware, responsive) ---------- */
function makeCanvas(w, h) {
  var cv = document.createElement('canvas');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = w * dpr;
  cv.height = h * dpr;
  cv.style.width = '100%';
  cv.style.maxWidth = w + 'px';
  cv.style.aspectRatio = w + '/' + h;
  cv.className = 'game-canvas';
  var ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  return { cv: cv, ctx: ctx, w: w, h: h };
}
/* pointer position in canvas logical coords */
function canvasPos(cv, w, h, ev) {
  var r = cv.getBoundingClientRect();
  var cx = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
  var cy = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
  return { x: cx * w / r.width, y: cy * h / r.height };
}

/* ---------- stat bar ---------- */
function stats(defs) {
  var bar = el('div', 'stat-bar'), map = {};
  defs.forEach(function (d) {
    var s = el('div', 'stat');
    s.innerHTML = '<span class="label">' + esc(d[1]) + '</span><span class="value">-</span>';
    map[d[0]] = s.lastChild;
    bar.appendChild(s);
  });
  return {
    el: bar,
    set: function (k, v) { if (map[k]) map[k].textContent = v; }
  };
}

/* ---------- mobile d-pad ---------- */
function dpad(onDir, withAction, actionLabel) {
  var wrapEl = el('div', 'dpad');
  var mk = function (label, dir) {
    var b = el('button', 'dpad-btn', label);
    var fire = function (e) { e.preventDefault(); onDir(dir); };
    b.addEventListener('pointerdown', fire);
    return b;
  };
  wrapEl.appendChild(mk('◀', 'left'));
  var mid = el('div', 'dpad-mid');
  mid.appendChild(mk('▲', 'up'));
  if (withAction) mid.appendChild(mk(actionLabel || '●', 'action'));
  mid.appendChild(mk('▼', 'down'));
  wrapEl.appendChild(mid);
  wrapEl.appendChild(mk('▶', 'right'));
  return wrapEl;
}

/* ---------- hub ---------- */
var _filter = { cat: 'all', q: '' };

function buildShell() {
  var app = document.getElementById('app');
  app.innerHTML = '';

  var top = el('div', 'topbar');
  var brand = el('div', 'brand');
  brand.appendChild(el('div', 'bulbs', '<span></span><span></span><span></span><span></span><span></span><span></span><span></span>'));
  var h1 = el('h1', null, t('core.title'));
  h1.style.cursor = 'pointer';
  h1.onclick = function () { location.hash = ''; };
  brand.appendChild(h1);
  brand.appendChild(el('p', 'tagline', t('core.tagline')));
  top.appendChild(brand);

  var ctrls = el('div', 'top-ctrls');
  var tick = el('span', 'ticket-pill');
  tick.id = 'nf-tickets';
  tick.textContent = '🎟 ' + tickets();
  ctrls.appendChild(tick);

  var mute = el('button', 'icon-btn');
  mute.title = t('core.muteTitle');
  mute.textContent = S.get('mute', false) ? '🔇' : '🔊';
  mute.onclick = function () {
    S.set('mute', !S.get('mute', false));
    mute.textContent = S.get('mute', false) ? '🔇' : '🔊';
    sfx('click');
  };
  ctrls.appendChild(mute);

  var lang = el('a', 'icon-btn lang-btn', t('core.langOther'));
  lang.href = t('core.langOtherHref');
  lang.onclick = function () { S.set('lang', NF.lang === 'en' ? 'tr' : 'en'); };
  ctrls.appendChild(lang);
  top.appendChild(ctrls);
  app.appendChild(top);

  var hub = el('div', 'hub-view'); hub.id = 'hubView';

  var filters = el('div', 'filters');
  var search = el('input', 'search');
  search.type = 'search';
  search.placeholder = t('core.searchPh');
  search.oninput = function () { _filter.q = search.value.toLowerCase(); renderGrid(); };
  filters.appendChild(search);

  var chips = el('div', 'chips');
  var mkChip = function (key, label) {
    var c = el('button', 'chip' + (_filter.cat === key ? ' on' : ''), label);
    c.dataset.cat = key;
    c.onclick = function () {
      _filter.cat = key;
      chips.querySelectorAll('.chip').forEach(function (x) { x.classList.toggle('on', x.dataset.cat === key); });
      renderGrid();
      sfx('click');
    };
    chips.appendChild(c);
  };
  mkChip('all', t('core.catAll'));
  mkChip('fav', t('core.catFav'));
  CATS.forEach(function (c) { mkChip(c, t('core.cats.' + c)); });
  filters.appendChild(chips);
  hub.appendChild(filters);

  var recent = el('div', 'recent-strip'); recent.id = 'recentStrip';
  hub.appendChild(recent);

  var grid = el('div', 'hub'); grid.id = 'hubGrid';
  hub.appendChild(grid);
  app.appendChild(hub);

  var gv = el('div', 'game-view'); gv.id = 'gameView';
  app.appendChild(gv);

  app.appendChild(el('p', 'footer-note', t('core.footer')));
}

function bestLabel(g) {
  var b = getBest(g.id);
  if (b === null || g.unit === null) return g.unit === null ? '·' : t('core.notPlayed');
  return t('core.best') + ': ' + b + t('core.units.' + g.unit);
}

function renderGrid() {
  var grid = document.getElementById('hubGrid');
  grid.innerHTML = '';
  var favs = S.get('favs', []);
  Games.list.forEach(function (g) {
    if (_filter.cat === 'fav' && favs.indexOf(g.id) === -1) return;
    if (_filter.cat !== 'all' && _filter.cat !== 'fav' && g.cat !== _filter.cat) return;
    if (_filter.q && (g.W.t + ' ' + g.W.d).toLowerCase().indexOf(_filter.q) === -1) return;

    var card = el('div', 'cabinet');
    card.innerHTML =
      '<button class="fav-star' + (favs.indexOf(g.id) !== -1 ? ' on' : '') + '">★</button>' +
      '<span class="icon">' + g.icon + '</span>' +
      '<h3>' + esc(g.W.t) + '</h3>' +
      '<p class="desc">' + esc(g.W.d) + '</p>' +
      '<div class="score-row"><span>' + esc(bestLabel(g)) + '</span><span class="play-tag">' + t('core.play') + '</span></div>';
    card.onclick = function () { location.hash = 'g/' + g.id; };
    var star = card.querySelector('.fav-star');
    star.onclick = function (e) {
      e.stopPropagation();
      var f = S.get('favs', []);
      var i = f.indexOf(g.id);
      if (i === -1) f.push(g.id); else f.splice(i, 1);
      S.set('favs', f);
      star.classList.toggle('on', i === -1);
      sfx('pop');
      if (_filter.cat === 'fav') renderGrid();
    };
    grid.appendChild(card);
  });
  renderRecent();
}

function renderRecent() {
  var strip = document.getElementById('recentStrip');
  var rec = S.get('recent', []).filter(function (id) { return Games.byId[id]; });
  if (!rec.length || _filter.cat !== 'all' || _filter.q) { strip.style.display = 'none'; return; }
  strip.style.display = 'flex';
  strip.innerHTML = '<span class="recent-label">' + t('core.recent') + ':</span>';
  rec.slice(0, 8).forEach(function (id) {
    var g = Games.byId[id];
    var b = el('button', 'recent-chip', g.icon + ' ' + esc(g.W.t));
    b.onclick = function () { location.hash = 'g/' + id; };
    strip.appendChild(b);
  });
}

/* ---------- open / close games ---------- */
function closeActive() {
  if (!_active) return;
  _active.cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
  _active = null;
  var gv = document.getElementById('gameView');
  gv.classList.remove('active');
  gv.innerHTML = '';
}

function showHub() {
  closeActive();
  document.getElementById('hubView').style.display = 'block';
  renderGrid();
}

function openGame(id) {
  var g = Games.byId[id];
  if (!g) { location.hash = ''; return; }
  closeActive();
  document.getElementById('hubView').style.display = 'none';

  var rec = S.get('recent', []).filter(function (x) { return x !== id; });
  rec.unshift(id);
  S.set('recent', rec.slice(0, 8));

  var gv = document.getElementById('gameView');
  gv.classList.add('active');
  gv.innerHTML = '';
  var head = el('div', 'game-header');
  var backB = el('button', 'back-btn', t('core.back'));
  backB.onclick = function () { location.hash = ''; };
  head.appendChild(backB);
  head.appendChild(el('h2', null, g.icon + ' ' + esc(g.W.t)));
  gv.appendChild(head);
  var panel = el('div', 'game-panel');
  gv.appendChild(panel);

  _active = { id: id, cleanups: [] };
  try { g.init(panel); } catch (e) {
    panel.innerHTML = '<p style="color:var(--accent-2)">⚠ ' + esc(e.message) + '</p>';
    if (window.console) console.error(e);
  }
  window.scrollTo(0, 0);
}

/* ---------- hash router ---------- */
function route() {
  var h = location.hash;
  if (h.indexOf('#g/') === 0) openGame(h.slice(3));
  else showHub();
}

/* ---------- boot ---------- */
NF.boot = function () {
  buildShell();
  window.addEventListener('hashchange', route);
  route();
};
