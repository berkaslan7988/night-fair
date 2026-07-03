/* ============================================================
   Night Fair — ARCADE pack (13 games)
   snake, tetris, breakout, pong, flappy, runner, shooter,
   whack, hopper, stacker, catcher, dodger, jumper
   ============================================================ */
'use strict';
(function () {

/* shared canvas palette + overlay */
var C_BG = '#150F28', C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_GRN = '#6FCF97',
    C_TXT = '#F5F0FF', C_DIM = '#B8AEDB', C_BLUE = '#6FA8DC', C_SURF = '#2E2454';
function overlay(ctx, w, h, text, sub) {
  ctx.fillStyle = 'rgba(21,15,40,0.78)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_TXT; ctx.font = '700 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2 - 6);
  if (sub) { ctx.font = '13px Inter, sans-serif'; ctx.fillStyle = C_DIM; ctx.fillText(sub, w / 2, h / 2 + 22); }
  ctx.textAlign = 'left';
}

/* ================= SNAKE ================= */
(function () {
  var STR = {
    en: { t: 'Snake', d: 'Three modes: classic, no walls, obstacles.', over: 'Crashed!', mClassic: 'Classic', mWrap: 'No walls', mObs: 'Obstacles' },
    tr: { t: 'Yılan', d: 'Üç mod: klasik, duvarsız, engelli.', over: 'Çarptın!', mClassic: 'Klasik', mWrap: 'Duvarsız', mObs: 'Engelli' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'snake', icon: '🐍', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var N = 20, CELL = 18, SZ = N * CELL;
    var c = makeCanvas(SZ, SZ), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var mode = 'classic', modeBtns = {};
    var modeRow = el('div', 'row');
    modeRow.style.marginTop = '0'; modeRow.style.marginBottom = '12px';
    [['classic', W.mClassic], ['wrap', W.mWrap], ['obs', W.mObs]].forEach(function (m) {
      var b = btn(m[1], function () { mode = m[0]; syncModes(); reset(); }, true);
      modeBtns[m[0]] = b; modeRow.appendChild(b);
    });
    function syncModes() {
      Object.keys(modeBtns).forEach(function (k) {
        modeBtns[k].style.borderColor = k === mode ? 'var(--accent)' : '';
        modeBtns[k].style.color = k === mode ? 'var(--accent)' : '';
      });
    }
    syncModes();
    root.appendChild(modeRow);
    root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys')));
    root.appendChild(dpad(turn));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var snake, dir, nextDir, food, score, dead, speed, acc, walls, eaten;
    function reset() {
      snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
      dir = { x: 1, y: 0 }; nextDir = dir; score = 0; dead = false; speed = 8; acc = 0;
      walls = []; eaten = 0;
      placeFood(); msg.textContent = '';
      st.set('score', 0); st.set('best', getBest('snake') || 0);
    }
    function placeFood() {
      do { food = { x: rnd(N), y: rnd(N) }; }
      while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }) ||
             walls.some(function (w2) { return w2.x === food.x && w2.y === food.y; }));
    }
    function addWall() {
      for (var tries = 0; tries < 40; tries++) {
        var wx = rnd(N), wy = rnd(N);
        if (Math.abs(wx - snake[0].x) + Math.abs(wy - snake[0].y) < 4) continue;
        if (food.x === wx && food.y === wy) continue;
        var occupied = snake.some(function (s) { return s.x === wx && s.y === wy; }) ||
                       walls.some(function (w2) { return w2.x === wx && w2.y === wy; });
        if (!occupied) { walls.push({ x: wx, y: wy }); return; }
      }
    }
    function turn(d) {
      var m = { left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 } }[d];
      if (!m) return;
      if (m.x === -dir.x && m.y === -dir.y) return;
      nextDir = m;
    }
    addKey(function (e) {
      var k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
      if (k) { e.preventDefault(); turn(k); }
      if (e.key === ' ' && dead) { e.preventDefault(); reset(); }
    });
    c.cv.addEventListener('pointerdown', function () { if (dead) reset(); });
    function step() {
      dir = nextDir;
      var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (mode === 'wrap') { h.x = (h.x + N) % N; h.y = (h.y + N) % N; }
      if ((mode !== 'wrap' && (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N)) ||
          walls.some(function (w2) { return w2.x === h.x && w2.y === h.y; }) ||
          snake.some(function (s) { return s.x === h.x && s.y === h.y; })) { die(); return; }
      snake.unshift(h);
      if (h.x === food.x && h.y === food.y) {
        score += 10; st.set('score', score); sfx('pop');
        speed = Math.min(17, 8 + score / 40);
        eaten++;
        if (mode === 'obs' && eaten % 2 === 0) addWall();
        placeFood();
      } else snake.pop();
    }
    function die() {
      dead = true; sfx('lose');
      msg.textContent = W.over + ' ' + t('core.finalScore', { n: score });
      setBest('snake', score); award(Math.floor(score / 30));
      st.set('best', getBest('snake'));
    }
    loop(function (dt) {
      if (!dead) { acc += dt; if (acc > 1 / speed) { acc = 0; step(); } }
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, SZ, SZ);
      ctx.fillStyle = '#4A3A80';
      walls.forEach(function (w2) { ctx.fillRect(w2.x * CELL + 1, w2.y * CELL + 1, CELL - 2, CELL - 2); });
      ctx.fillStyle = C_PINK;
      ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, 7); ctx.fill();
      snake.forEach(function (s, i) {
        ctx.fillStyle = i === 0 ? C_ACC : C_GRN;
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      });
      if (dead) overlay(ctx, SZ, SZ, t('core.gameOver'), t('core.tapOrSpace'));
    });
    reset();
  } });
})();

/* ================= TETRIS ================= */
(function () {
  var STR = {
    en: { t: 'Block Rain', d: 'Tetromino stacking — clear lines, climb levels.', lines: 'Lines' },
    tr: { t: 'Blok Yağmuru', d: 'Tetromino istifle — satır temizle, seviye atla.', lines: 'Satır' }
  };
  var W = STR[NF.lang] || STR.en;
  var SHAPES = {
    I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[1, 1, 1], [0, 1, 0]],
    S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]],
    J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]]
  };
  var COLORS = { I: C_BLUE, O: C_ACC, T: '#B57EDC', S: C_GRN, Z: C_PINK, J: '#F2914A', L: '#FFD966' };
  Games.register({ id: 'tetris', icon: '🧱', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var COLS = 10, ROWS = 20, CELL = 22, BW = COLS * CELL, PANEL = 100, WI = BW + PANEL, HE = ROWS * CELL;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['lines', W.lines], ['level', t('core.level')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys') + ' · ⬆ = ↻ · ␣ = drop'));
    root.appendChild(dpad(function (d) {
      if (d === 'left') move(-1); else if (d === 'right') move(1);
      else if (d === 'down') soft(); else if (d === 'up') rotate();
      else if (d === 'action') hard();
    }, true, '⤓'));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var grid, cur, next, score, lines, level, over, acc, gravity;
    function newPiece() {
      var k = pick(Object.keys(SHAPES));
      return { k: k, m: SHAPES[k].map(function (r) { return r.slice(); }), x: 3, y: 0 };
    }
    function reset() {
      grid = []; for (var r = 0; r < ROWS; r++) grid.push(Array(COLS).fill(''));
      cur = newPiece(); next = newPiece();
      score = 0; lines = 0; level = 1; over = false; acc = 0; gravity = 0.8;
      msg.textContent = '';
      st.set('score', 0); st.set('lines', 0); st.set('level', 1);
      st.set('best', getBest('tetris') || 0);
    }
    function rot(m) {
      var out = [];
      for (var cIdx = 0; cIdx < m[0].length; cIdx++) {
        var rowArr = [];
        for (var r = m.length - 1; r >= 0; r--) rowArr.push(m[r][cIdx]);
        out.push(rowArr);
      }
      return out;
    }
    function fits(m, x, y) {
      for (var r = 0; r < m.length; r++) for (var cc = 0; cc < m[r].length; cc++) {
        if (!m[r][cc]) continue;
        var gx = x + cc, gy = y + r;
        if (gx < 0 || gx >= COLS || gy >= ROWS) return false;
        if (gy >= 0 && grid[gy][gx]) return false;
      }
      return true;
    }
    function move(dx) { if (!over && fits(cur.m, cur.x + dx, cur.y)) { cur.x += dx; } }
    function rotate() {
      if (over) return;
      var m = rot(cur.m);
      var kicks = [0, -1, 1, -2, 2];
      for (var i = 0; i < kicks.length; i++) {
        if (fits(m, cur.x + kicks[i], cur.y)) { cur.m = m; cur.x += kicks[i]; sfx('tick'); return; }
      }
    }
    function soft() { if (!over && fits(cur.m, cur.x, cur.y + 1)) { cur.y++; score++; st.set('score', score); } }
    function hard() {
      if (over) return;
      while (fits(cur.m, cur.x, cur.y + 1)) { cur.y++; score += 2; }
      st.set('score', score); lock();
    }
    function lock() {
      for (var r = 0; r < cur.m.length; r++) for (var cc = 0; cc < cur.m[r].length; cc++) {
        if (cur.m[r][cc]) {
          if (cur.y + r < 0) { end(); return; }
          grid[cur.y + r][cur.x + cc] = cur.k;
        }
      }
      var cleared = 0;
      for (var rr = ROWS - 1; rr >= 0; rr--) {
        if (grid[rr].every(function (v) { return v; })) {
          grid.splice(rr, 1); grid.unshift(Array(COLS).fill('')); cleared++; rr++;
        }
      }
      if (cleared) {
        score += [0, 100, 300, 500, 800][cleared] * level;
        lines += cleared;
        level = Math.floor(lines / 10) + 1;
        gravity = Math.max(0.08, 0.8 - (level - 1) * 0.07);
        sfx(cleared >= 4 ? 'win' : 'good');
        st.set('score', score); st.set('lines', lines); st.set('level', level);
      } else sfx('click');
      cur = next; next = newPiece();
      if (!fits(cur.m, cur.x, cur.y)) end();
    }
    function end() {
      over = true; sfx('lose');
      msg.textContent = t('core.gameOver') + ' ' + t('core.finalScore', { n: score });
      setBest('tetris', score); award(Math.floor(score / 400));
      st.set('best', getBest('tetris'));
    }
    addKey(function (e) {
      if (over && e.key === ' ') { e.preventDefault(); reset(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); soft(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); rotate(); }
      else if (e.key === ' ') { e.preventDefault(); hard(); }
    });
    c.cv.addEventListener('pointerdown', function () { if (over) reset(); });
    loop(function (dt) {
      if (!over) {
        acc += dt;
        if (acc > gravity) {
          acc = 0;
          if (fits(cur.m, cur.x, cur.y + 1)) cur.y++; else lock();
        }
      }
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      ctx.strokeStyle = C_SURF; ctx.strokeRect(BW + 0.5, 0, 0.5, HE);
      for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) {
        if (grid[r][cc]) { ctx.fillStyle = COLORS[grid[r][cc]]; ctx.fillRect(cc * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2); }
      }
      if (!over) {
        ctx.fillStyle = COLORS[cur.k];
        for (var r2 = 0; r2 < cur.m.length; r2++) for (var c2 = 0; c2 < cur.m[r2].length; c2++) {
          if (cur.m[r2][c2] && cur.y + r2 >= 0) ctx.fillRect((cur.x + c2) * CELL + 1, (cur.y + r2) * CELL + 1, CELL - 2, CELL - 2);
        }
      }
      ctx.fillStyle = C_DIM; ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('NEXT', BW + 18, 24);
      ctx.fillStyle = COLORS[next.k];
      for (var r3 = 0; r3 < next.m.length; r3++) for (var c3 = 0; c3 < next.m[r3].length; c3++) {
        if (next.m[r3][c3]) ctx.fillRect(BW + 18 + c3 * 18, 36 + r3 * 18, 16, 16);
      }
      if (over) overlay(ctx, WI, HE, t('core.gameOver'), t('core.tapOrSpace'));
    });
    reset();
  } });
})();

/* ================= BREAKOUT ================= */
(function () {
  var STR = {
    en: { t: 'Brick Breaker', d: 'Bricks drop power-ups: wide paddle, slow ball, lives…', lvl: 'Wave' },
    tr: { t: 'Tuğla Kıran', d: 'Tuğlalardan güçler düşer: geniş raket, yavaş top, can…', lvl: 'Dalga' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'breakout', icon: '🏓', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 360, HE = 460;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['lives', t('core.lives')], ['lvl', W.lvl], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var pad, ball, bricks, score, lives, lvl, running, over, pups, wideT;
    var PAD_W = 68, PAD_WIDE = 108;
    var BRC = [C_PINK, C_ACC, '#FFD966', C_GRN, C_BLUE, '#B57EDC'];
    var PUP_ICONS = { wide: '↔', slow: '🐢', life: '❤️', pts: '⭐' };
    function buildBricks() {
      bricks = [];
      for (var r = 0; r < 6; r++) for (var cc = 0; cc < 8; cc++)
        bricks.push({ x: 8 + cc * 43.5, y: 46 + r * 20, w: 39, h: 15, col: BRC[r] });
    }
    function reset() {
      pad = { x: WI / 2 - 34, w: PAD_W };
      score = 0; lives = 3; lvl = 1; over = false;
      pups = []; wideT = 0;
      buildBricks(); serve();
      msg.textContent = '';
      st.set('score', 0); st.set('lives', 3); st.set('lvl', 1);
      st.set('best', getBest('breakout') || 0);
    }
    function applyPup(type) {
      sfx('good');
      if (type === 'wide') wideT = 12;
      else if (type === 'slow') {
        ball.vx *= 0.72; ball.vy *= 0.72;
        if (Math.abs(ball.vy) < 120) ball.vy = (ball.vy < 0 ? -1 : 1) * 120;
      }
      else if (type === 'life') { lives++; st.set('lives', lives); }
      else if (type === 'pts') { score += 50; st.set('score', score); }
    }
    function serve() {
      ball = { x: WI / 2, y: HE - 60, vx: (Math.random() < 0.5 ? -1 : 1) * 150, vy: -210 * (1 + (lvl - 1) * 0.12) };
      running = false;
    }
    function setPad(x) { pad.x = clamp(x - pad.w / 2, 0, WI - pad.w); }
    c.cv.addEventListener('pointermove', function (e) { setPad(canvasPos(c.cv, WI, HE, e).x); });
    c.cv.addEventListener('pointerdown', function () {
      if (over) { reset(); return; }
      running = true;
    });
    addKey(function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setPad(pad.x + pad.w / 2 - 26); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setPad(pad.x + pad.w / 2 + 26); }
      if (e.key === ' ') { e.preventDefault(); if (over) reset(); else running = true; }
    });
    loop(function (dt) {
      if (running && !over) {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < 6) { ball.x = 6; ball.vx *= -1; }
        if (ball.x > WI - 6) { ball.x = WI - 6; ball.vx *= -1; }
        if (ball.y < 6) { ball.y = 6; ball.vy *= -1; }
        if (ball.y > HE + 10) {
          lives--; st.set('lives', lives); sfx('bad');
          if (lives <= 0) { end(); } else serve();
        }
        if (ball.vy > 0 && ball.y > HE - 26 && ball.y < HE - 12 && ball.x > pad.x - 6 && ball.x < pad.x + pad.w + 6) {
          ball.vy = -Math.abs(ball.vy);
          ball.vx = ((ball.x - (pad.x + pad.w / 2)) / (pad.w / 2)) * 230;
          sfx('tick');
        }
        for (var i = bricks.length - 1; i >= 0; i--) {
          var b = bricks[i];
          if (ball.x > b.x - 6 && ball.x < b.x + b.w + 6 && ball.y > b.y - 6 && ball.y < b.y + b.h + 6) {
            bricks.splice(i, 1);
            score += 10; st.set('score', score); sfx('pop');
            // some bricks drop a power-up
            if (Math.random() < 0.18) {
              pups.push({ x: b.x + b.w / 2, y: b.y + b.h, type: pick(['wide', 'wide', 'slow', 'slow', 'life', 'pts']) });
            }
            var fromSide = ball.x < b.x || ball.x > b.x + b.w;
            if (fromSide) ball.vx *= -1; else ball.vy *= -1;
            break;
          }
        }
        // falling power-ups
        if (wideT > 0) { wideT -= dt; }
        var targetW = wideT > 0 ? PAD_WIDE : PAD_W;
        if (pad.w !== targetW) {
          var center = pad.x + pad.w / 2;
          pad.w = targetW;
          pad.x = clamp(center - pad.w / 2, 0, WI - pad.w);
        }
        for (var pi = pups.length - 1; pi >= 0; pi--) {
          pups[pi].y += 120 * dt;
          if (pups[pi].y > HE - 28 && pups[pi].y < HE - 6 &&
              Math.abs(pups[pi].x - (pad.x + pad.w / 2)) < pad.w / 2 + 10) {
            applyPup(pups[pi].type);
            pups.splice(pi, 1);
            continue;
          }
          if (pups[pi].y > HE + 20) pups.splice(pi, 1);
        }
        if (!bricks.length) {
          lvl++; st.set('lvl', lvl); sfx('win'); award(3);
          pups = []; wideT = 0; pad.w = PAD_W;
          buildBricks(); serve();
        }
      }
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      bricks.forEach(function (b) { ctx.fillStyle = b.col; ctx.fillRect(b.x, b.y, b.w, b.h); });
      pups.forEach(function (p) {
        ctx.fillStyle = C_SURF;
        ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, 7); ctx.fill();
        ctx.font = '13px sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = C_TXT;
        ctx.fillText(PUP_ICONS[p.type], p.x, p.y + 5);
        ctx.textAlign = 'left';
      });
      ctx.fillStyle = wideT > 0 ? C_GRN : C_ACC; ctx.fillRect(pad.x, HE - 20, pad.w, 9);
      ctx.fillStyle = C_TXT; ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, 7); ctx.fill();
      if (!running && !over) overlay(ctx, WI, HE, '▶', t('core.tapOrSpace'));
      if (over) overlay(ctx, WI, HE, t('core.gameOver'), t('core.tapOrSpace'));
    });
    function end() {
      over = true; sfx('lose');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('breakout', score); award(Math.floor(score / 100));
      st.set('best', getBest('breakout'));
    }
    reset();
  } });
})();

/* ================= PONG ================= */
(function () {
  var STR = {
    en: { t: 'Pong', d: 'First to 7 against the bot. Curve your shots.', you: 'You', bot: 'Bot' },
    tr: { t: 'Pong', d: 'Bota karşı 7 sayıya ilk ulaşan kazanır.', you: 'Sen', bot: 'Bot' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'pong', icon: '🏸', cat: 'arcade', unit: 'wins', str: STR, init: function (root) {
    var WI = 480, HE = 300, PW = 9, PH = 64, TARGET = 7;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['you', W.you], ['bot', W.bot], ['wins', t('core.wins')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var py, by, ball, sy, sb, over, running;
    function reset() {
      py = HE / 2 - PH / 2; by = py; sy = 0; sb = 0; over = false;
      msg.textContent = '';
      st.set('you', 0); st.set('bot', 0); st.set('wins', getBest('pong') || 0);
      serve(1);
    }
    function serve(dirX) {
      ball = { x: WI / 2, y: HE / 2, vx: dirX * 230, vy: (Math.random() - 0.5) * 220 };
      running = false;
    }
    c.cv.addEventListener('pointermove', function (e) { py = clamp(canvasPos(c.cv, WI, HE, e).y - PH / 2, 0, HE - PH); });
    c.cv.addEventListener('pointerdown', function () { if (over) reset(); else running = true; });
    addKey(function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); py = clamp(py - 26, 0, HE - PH); }
      if (e.key === 'ArrowDown') { e.preventDefault(); py = clamp(py + 26, 0, HE - PH); }
      if (e.key === ' ') { e.preventDefault(); if (over) reset(); else running = true; }
    });
    function point(who) {
      if (who === 'you') { sy++; st.set('you', sy); sfx('good'); } else { sb++; st.set('bot', sb); sfx('bad'); }
      if (sy >= TARGET || sb >= TARGET) {
        over = true;
        if (sy > sb) {
          msg.textContent = t('core.youWin'); sfx('win');
          var wins = (getBest('pong') || 0) + 1;
          S.set('best_pong', wins); st.set('wins', wins); award(8);
        } else { msg.textContent = t('core.botWins'); sfx('lose'); }
      } else serve(who === 'you' ? -1 : 1);
    }
    loop(function (dt) {
      if (running && !over) {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.y < 6) { ball.y = 6; ball.vy *= -1; }
        if (ball.y > HE - 6) { ball.y = HE - 6; ball.vy *= -1; }
        var target = ball.y - PH / 2 + (Math.sin(ball.x / 40) * 12);
        var maxSpd = 170 * dt;
        by += clamp(target - by, -maxSpd, maxSpd);
        by = clamp(by, 0, HE - PH);
        if (ball.vx < 0 && ball.x < 18 + PW && ball.x > 12 && ball.y > py - 6 && ball.y < py + PH + 6) {
          ball.vx = Math.abs(ball.vx) * 1.04;
          ball.vy += ((ball.y - (py + PH / 2)) / (PH / 2)) * 160;
          sfx('tick');
        }
        if (ball.vx > 0 && ball.x > WI - 18 - PW && ball.x < WI - 12 && ball.y > by - 6 && ball.y < by + PH + 6) {
          ball.vx = -Math.abs(ball.vx) * 1.04;
          ball.vy += ((ball.y - (by + PH / 2)) / (PH / 2)) * 160;
          sfx('tick');
        }
        if (ball.x < -10) point('bot');
        if (ball.x > WI + 10) point('you');
      }
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      ctx.strokeStyle = C_SURF; ctx.setLineDash([6, 8]);
      ctx.beginPath(); ctx.moveTo(WI / 2, 0); ctx.lineTo(WI / 2, HE); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C_ACC; ctx.fillRect(14, py, PW, PH);
      ctx.fillStyle = C_PINK; ctx.fillRect(WI - 14 - PW, by, PW, PH);
      ctx.fillStyle = C_TXT; ctx.beginPath(); ctx.arc(ball.x, ball.y, 6, 0, 7); ctx.fill();
      ctx.font = '700 26px "JetBrains Mono", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = C_DIM;
      ctx.fillText(sy, WI / 2 - 40, 34); ctx.fillText(sb, WI / 2 + 40, 34); ctx.textAlign = 'left';
      if (!running && !over) overlay(ctx, WI, HE, '▶', t('core.tapOrSpace'));
    });
    reset();
  } });
})();

/* ================= FLAPPY (Balloon Flight) ================= */
(function () {
  var STR = {
    en: { t: 'Balloon Flight', d: 'Tap to lift the fair balloon through the gaps.' },
    tr: { t: 'Balon Uçuşu', d: 'Panayır balonunu boşluklardan geçirmek için dokun.' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'flappy', icon: '🎈', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 320, HE = 460;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    root.appendChild(el('div', 'hint-line', t('core.tapOrSpace')));

    var y, vy, pipes, score, dead, started, timer;
    var GAP = 130, PW2 = 52;
    function reset() {
      y = HE / 2; vy = 0; pipes = []; score = 0; dead = false; started = false; timer = 0;
      st.set('score', 0); st.set('best', getBest('flappy') || 0);
    }
    function flap() {
      if (dead) { reset(); return; }
      started = true; vy = -260; sfx('tick');
    }
    c.cv.addEventListener('pointerdown', function (e) { e.preventDefault(); flap(); });
    addKey(function (e) { if (e.key === ' ') { e.preventDefault(); flap(); } });
    loop(function (dt) {
      if (started && !dead) {
        vy += 760 * dt; y += vy * dt;
        timer += dt;
        if (timer > 1.5) { timer = 0; pipes.push({ x: WI + 30, gy: 70 + rnd(HE - 240), passed: false }); }
        pipes.forEach(function (p) { p.x -= 130 * dt; });
        pipes = pipes.filter(function (p) { return p.x > -60; });
        pipes.forEach(function (p) {
          if (!p.passed && p.x + PW2 < 60) { p.passed = true; score++; st.set('score', score); sfx('pop'); }
          if (60 + 12 > p.x && 60 - 12 < p.x + PW2 && (y - 12 < p.gy || y + 12 > p.gy + GAP)) die();
        });
        if (y > HE - 12 || y < -30) die();
      }
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      ctx.fillStyle = C_GRN;
      pipes.forEach(function (p) {
        ctx.fillRect(p.x, 0, PW2, p.gy);
        ctx.fillRect(p.x, p.gy + GAP, PW2, HE - p.gy - GAP);
      });
      ctx.font = '26px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🎈', 60, y + 10); ctx.textAlign = 'left';
      if (!started && !dead) overlay(ctx, WI, HE, '🎈', t('core.tapOrSpace'));
      if (dead) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });
    function die() {
      if (dead) return;
      dead = true; sfx('lose');
      setBest('flappy', score); award(Math.floor(score / 5));
      st.set('best', getBest('flappy'));
    }
    reset();
  } });
})();

/* ================= RUNNER (Night Run) ================= */
(function () {
  var STR = {
    en: { t: 'Night Run', d: 'Jump over obstacles in this endless night run.' },
    tr: { t: 'Gece Koşusu', d: 'Bu sonsuz gece koşusunda engellerin üzerinden atla.' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'runner', icon: '🏃', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 400, HE = 200, GROUND = HE - 30;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    root.appendChild(el('div', 'hint-line', t('core.tapOrSpace')));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var py, vy, obs, score, dead, started, speed, dist;
    var PW = 20, PH = 30, GRAV = 1000, JUMP = -440;

    function reset() {
      py = GROUND; vy = 0; obs = []; score = 0; dead = false; started = false;
      speed = 170; dist = 0;
      st.set('score', 0); st.set('best', getBest('runner') || 0);
    }
    function jump() {
      if (dead) { reset(); return; }
      if (!started) { started = true; }
      if (py >= GROUND - 1) { vy = JUMP; sfx('tick'); }
    }
    c.cv.addEventListener('pointerdown', function (e) { e.preventDefault(); jump(); });
    addKey(function (e) {
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); }
    });

    loop(function (dt) {
      if (started && !dead) {
        vy += GRAV * dt;
        py += vy * dt;
        if (py >= GROUND) { py = GROUND; vy = 0; }

        dist += speed * dt;
        score = Math.floor(dist / 10);
        st.set('score', score);

        speed = Math.min(320, 170 + score * 0.25);

        // spawn obstacles (generous gaps)
        if (obs.length === 0 || obs[obs.length - 1].x < WI - 180 - rnd(140)) {
          var oh = 16 + rnd(14);
          obs.push({ x: WI + 10, w: 12 + rnd(8), h: oh, y: GROUND - oh });
        }
        for (var i = obs.length - 1; i >= 0; i--) {
          obs[i].x -= speed * dt;
          if (obs[i].x < -40) { obs.splice(i, 1); continue; }
          // collision
          var o = obs[i];
          var px = 40, ptop = py - PH;
          if (px + PW > o.x && px < o.x + o.w && py > o.y && ptop < o.y + o.h) {
            die(); break;
          }
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      ctx.fillStyle = C_SURF; ctx.fillRect(0, GROUND, WI, HE - GROUND);

      // ground dots
      ctx.fillStyle = C_DIM;
      for (var d = 0; d < 20; d++) {
        var gx = ((d * 25) - (dist * 0.5) % 500 + 500) % 500;
        ctx.fillRect(gx, GROUND + 4, 12, 2);
      }

      // stars
      ctx.fillStyle = '#FFD96640';
      for (var s = 0; s < 8; s++) {
        var sx = ((s * 53 + 17) - (dist * 0.15) % WI + WI) % WI;
        var sy2 = 10 + (s * 19) % 60;
        ctx.fillRect(sx, sy2, 2, 2);
      }

      // player
      ctx.fillStyle = C_ACC;
      ctx.fillRect(40, py - PH, PW, PH);
      ctx.fillStyle = C_TXT;
      ctx.fillRect(40 + 4, py - PH + 4, 5, 5);

      // obstacles
      ctx.fillStyle = C_PINK;
      obs.forEach(function (o) { ctx.fillRect(o.x, o.y, o.w, o.h); });

      if (!started && !dead) overlay(ctx, WI, HE, '🏃', t('core.tapOrSpace'));
      if (dead) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });

    function die() {
      if (dead) return;
      dead = true; sfx('lose');
      setBest('runner', score); award(Math.floor(score / 50));
      st.set('best', getBest('runner'));
    }
    reset();
  } });
})();

/* ================= SHOOTER (Star Hunter) ================= */
(function () {
  var STR = {
    en: { t: 'Star Hunter', d: 'Shoot down enemy waves. Pick your difficulty.', kills: 'Kills', easy: 'Easy', normal: 'Normal', hard: 'Hard' },
    tr: { t: 'Yıldız Avcısı', d: 'Düşman dalgalarını vur. Zorluğunu seç.', kills: 'Vuruş', easy: 'Kolay', normal: 'Normal', hard: 'Zor' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'shooter', icon: '🚀', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 360, HE = 480;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['lives', t('core.lives')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var DIFF = {
      easy:   { sb: 1.7,  sm: 0.85, eb: 55, em: 140, r1: 0.010, r2: 1.0 },
      normal: { sb: 1.35, sm: 0.55, eb: 75, em: 190, r1: 0.014, r2: 1.5 },
      hard:   { sb: 1.0,  sm: 0.30, eb: 95, em: 260, r1: 0.020, r2: 2.2 }
    };
    var diff = 'normal';
    function P() { return DIFF[diff]; }
    var diffRow = el('div', 'row'), diffBtns = {};
    diffRow.style.marginTop = '0'; diffRow.style.marginBottom = '12px';
    ['easy', 'normal', 'hard'].forEach(function (d) {
      var b = btn(W[d], function () { diff = d; syncDiff(); reset(); }, true);
      diffBtns[d] = b; diffRow.appendChild(b);
    });
    function syncDiff() {
      Object.keys(diffBtns).forEach(function (k) {
        diffBtns[k].style.borderColor = k === diff ? 'var(--accent)' : '';
        diffBtns[k].style.color = k === diff ? 'var(--accent)' : '';
      });
    }
    syncDiff();
    root.appendChild(diffRow);
    root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys') + ' · ␣ = 🔫'));
    root.appendChild(dpad(function (d) {
      if (d === 'left') ship.x -= 24;
      else if (d === 'right') ship.x += 24;
      else if (d === 'action') shoot();
    }, true, '🔫'));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var ship, bullets, enemies, score, lives, over, spawnTimer, spawnRate, enemySpeed;
    var SW = 24, SH = 20;

    function reset() {
      ship = { x: WI / 2 };
      bullets = []; enemies = []; score = 0; lives = 3; over = false;
      spawnTimer = 0; spawnRate = P().sb; enemySpeed = P().eb;
      msg.textContent = '';
      st.set('score', 0); st.set('lives', 3); st.set('best', getBest('shooter') || 0);
    }
    function shoot() {
      if (over) return;
      bullets.push({ x: ship.x, y: HE - 50 });
      sfx('click');
    }
    var keys = {};
    addKey(function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); keys.left = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); keys.right = true; }
      if (e.key === ' ') { e.preventDefault(); if (over) reset(); else shoot(); }
    });
    var kup = function (e) {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    };
    document.addEventListener('keyup', kup);
    onCleanup(function () { document.removeEventListener('keyup', kup); });
    c.cv.addEventListener('pointermove', function (e) {
      if (!over) ship.x = canvasPos(c.cv, WI, HE, e).x;
    });
    c.cv.addEventListener('pointerdown', function (e) {
      if (over) { reset(); return; }
      ship.x = canvasPos(c.cv, WI, HE, e).x;
      shoot();
    });

    loop(function (dt) {
      if (!over) {
        if (keys.left) ship.x -= 220 * dt;
        if (keys.right) ship.x += 220 * dt;
        ship.x = clamp(ship.x, SW / 2, WI - SW / 2);

        // spawn enemies
        spawnTimer += dt;
        if (spawnTimer > spawnRate) {
          spawnTimer = 0;
          enemies.push({ x: 20 + rnd(WI - 40), y: -20, w: 18 + rnd(8), h: 16 });
          spawnRate = Math.max(P().sm, P().sb - score * P().r1);
          enemySpeed = Math.min(P().em, P().eb + score * P().r2);
        }

        // update bullets
        for (var b = bullets.length - 1; b >= 0; b--) {
          bullets[b].y -= 400 * dt;
          if (bullets[b].y < -10) { bullets.splice(b, 1); continue; }
          // hit test
          for (var e = enemies.length - 1; e >= 0; e--) {
            var en = enemies[e], bu = bullets[b];
            if (bu && bu.x > en.x - en.w / 2 && bu.x < en.x + en.w / 2 &&
                bu.y > en.y - en.h / 2 && bu.y < en.y + en.h / 2) {
              enemies.splice(e, 1);
              bullets.splice(b, 1);
              score += 10; st.set('score', score);
              sfx('pop');
              break;
            }
          }
        }

        // update enemies
        for (var i = enemies.length - 1; i >= 0; i--) {
          enemies[i].y += enemySpeed * dt;
          // hit ship
          var en2 = enemies[i];
          if (en2.y > HE - 48 && en2.y < HE - 18 &&
              Math.abs(en2.x - ship.x) < (en2.w / 2 + SW / 2)) {
            enemies.splice(i, 1);
            lives--; st.set('lives', lives); sfx('bad');
            if (lives <= 0) { end(); break; }
            continue;
          }
          if (en2.y > HE + 20) { enemies.splice(i, 1); }
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // starfield
      ctx.fillStyle = C_DIM;
      for (var s = 0; s < 30; s++) {
        var sx = (s * 47 + 11) % WI, sy = (s * 79 + 23) % HE;
        ctx.fillRect(sx, sy, 1, 1);
      }

      // ship
      ctx.fillStyle = C_ACC;
      ctx.beginPath();
      ctx.moveTo(ship.x, HE - 48);
      ctx.lineTo(ship.x - SW / 2, HE - 28);
      ctx.lineTo(ship.x + SW / 2, HE - 28);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = C_BLUE;
      ctx.fillRect(ship.x - 2, HE - 28, 4, 6);

      // bullets
      ctx.fillStyle = C_TXT;
      bullets.forEach(function (b) { ctx.fillRect(b.x - 2, b.y, 4, 10); });

      // enemies
      enemies.forEach(function (en) {
        ctx.fillStyle = C_PINK;
        ctx.fillRect(en.x - en.w / 2, en.y - en.h / 2, en.w, en.h);
        ctx.fillStyle = C_TXT;
        ctx.fillRect(en.x - 3, en.y - 2, 3, 3);
        ctx.fillRect(en.x + 2, en.y - 2, 3, 3);
      });

      if (over) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });

    function end() {
      over = true; sfx('lose');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('shooter', score); award(Math.floor(score / 60));
      st.set('best', getBest('shooter'));
    }
    reset();
  } });
})();

/* ================= WHACK (Whack-a-Mole) ================= */
(function () {
  var STR = {
    en: { t: 'Whack-a-Mole', d: 'Whack 30 seconds of popping moles! Tap fast.', time: 'Time' },
    tr: { t: 'Köstebek Vur', d: '30 saniye boyunca köstebekleri vur! Hızlı dokun.', time: 'Süre' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'whack', icon: '🔨', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['score', t('core.score')], ['time', W.time], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 3);
    grid.style.maxWidth = '280px';
    grid.style.margin = '0 auto';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var cells = [], moles = [], score, timeLeft, over, popInterval, popDur;
    var TOTAL = 30;

    for (var i = 0; i < 9; i++) {
      (function (idx) {
        var cell = el('div', 'cell');
        cell.style.width = '76px'; cell.style.height = '76px';
        cell.style.fontSize = '40px'; cell.style.lineHeight = '76px';
        cell.style.textAlign = 'center'; cell.style.cursor = 'pointer';
        cell.style.borderRadius = '50%';
        cell.style.background = C_SURF;
        cell.style.transition = 'transform 0.1s';
        cell.style.userSelect = 'none';
        cell.textContent = '🕳️';
        cell.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          whack(idx);
        });
        grid.appendChild(cell);
        cells.push(cell);
      })(i);
    }

    var timerId = null, popTimerId = null;

    function reset() {
      score = 0; timeLeft = TOTAL; over = false;
      popDur = 1200; popInterval = 900;
      moles = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      msg.textContent = '';
      st.set('score', 0); st.set('time', TOTAL); st.set('best', getBest('whack') || 0);
      for (var i = 0; i < 9; i++) { cells[i].textContent = '🕳️'; cells[i].style.transform = ''; }
      if (timerId) clearInterval(timerId);
      if (popTimerId) clearInterval(popTimerId);

      timerId = setInterval(function () {
        if (over) return;
        timeLeft--;
        st.set('time', Math.max(0, timeLeft));
        if (timeLeft <= 0) end();
      }, 1000);
      onCleanup(function () { clearInterval(timerId); clearInterval(popTimerId); });

      schedulePop();
      popMole();
    }

    function schedulePop() {
      popTimerId = setTimeout(function () {
        if (over) return;
        popMole();
        popDur = Math.max(400, popDur - 15);
        popInterval = Math.max(350, popInterval - 12);
        schedulePop();
      }, popInterval);
    }
    function popMole() {
      if (over) return;
      var avail = [];
      for (var i = 0; i < 9; i++) { if (!moles[i]) avail.push(i); }
      if (!avail.length) return;
      var idx = pick(avail);
      moles[idx] = 1;
      cells[idx].textContent = '🐹';
      cells[idx].style.background = '#3E2F6A';
      after(function () {
        if (moles[idx] === 1) {
          moles[idx] = 0;
          cells[idx].textContent = '🕳️';
          cells[idx].style.background = C_SURF;
        }
      }, popDur);
    }

    function whack(idx) {
      if (over) return;
      if (moles[idx]) {
        moles[idx] = 0;
        score += 10; st.set('score', score);
        cells[idx].textContent = '💥';
        cells[idx].style.transform = 'scale(1.15)';
        sfx('pop');
        after(function () {
          cells[idx].textContent = '🕳️';
          cells[idx].style.background = C_SURF;
          cells[idx].style.transform = '';
        }, 250);
      } else {
        sfx('click');
      }
    }

    function end() {
      over = true;
      clearInterval(timerId);
      clearInterval(popTimerId);
      sfx(score > 60 ? 'win' : 'lose');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('whack', score); award(Math.floor(score / 30));
      st.set('best', getBest('whack'));
    }
    reset();
  } });
})();

/* ================= HOPPER (Road Crossing) ================= */
(function () {
  var STR = {
    en: { t: 'Road Crossing', d: 'Cross traffic and river like a frog. Don\'t get hit!' },
    tr: { t: 'Yol Geçidi', d: 'Trafik ve nehri kurbağa gibi geç. Çarpılma!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'hopper', icon: '🐸', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 360, HE = 420, ROWS = 14, RH = HE / ROWS;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys')));
    root.appendChild(dpad(hop));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var px, py, score, best_row, dead, lanes, crossings;
    var PS = 14;

    function makeLanes() {
      lanes = [];
      // difficulty grows gently with completed crossings, hard-capped
      var bonus = Math.min(45, crossings * 7);
      for (var r = 0; r < ROWS; r++) {
        if (r === 0) { lanes.push({ type: 'safe', items: [] }); continue; }           // start
        if (r === ROWS - 1) { lanes.push({ type: 'goal', items: [] }); continue; }     // goal
        if (r >= 1 && r <= 5) {
          // road lanes
          var dir = r % 2 === 0 ? 1 : -1;
          var spd = 40 + rnd(50) + bonus;
          var items = [];
          var count = 2 + rnd(2);
          for (var j = 0; j < count; j++) items.push({ x: rnd(WI), w: 30 + rnd(20) });
          lanes.push({ type: 'road', dir: dir, speed: spd, items: items });
        } else if (r === 6) {
          lanes.push({ type: 'safe', items: [] }); // middle safe
        } else {
          // river lanes (logs)
          var dir2 = r % 2 === 0 ? 1 : -1;
          var spd2 = 30 + rnd(35) + Math.floor(bonus * 0.8);
          var logs = [];
          var lc = 2 + rnd(2);
          for (var k = 0; k < lc; k++) logs.push({ x: rnd(WI), w: 50 + rnd(30) });
          lanes.push({ type: 'river', dir: dir2, speed: spd2, items: logs });
        }
      }
    }
    function reset() {
      px = WI / 2; py = 0; score = 0; best_row = 0; dead = false; crossings = 0;
      makeLanes();
      msg.textContent = '';
      st.set('score', 0); st.set('best', getBest('hopper') || 0);
    }
    function hop(d) {
      if (dead) { reset(); return; }
      if (d === 'up') py = Math.min(py + 1, ROWS - 1);
      else if (d === 'down') py = Math.max(py - 1, 0);
      else if (d === 'left') px = Math.max(px - RH, PS);
      else if (d === 'right') px = Math.min(px + RH, WI - PS);
      sfx('tick');
      if (py > best_row) {
        best_row = py;
        score += 10;
        st.set('score', score);
      }
      if (py >= ROWS - 1) {
        // reached goal!
        score += 50; st.set('score', score);
        sfx('win'); award(2);
        py = 0; best_row = 0; crossings++;
        makeLanes();
      }
    }
    addKey(function (e) {
      var k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (k) { e.preventDefault(); hop(k); }
      if (e.key === ' ' && dead) { e.preventDefault(); reset(); }
    });
    c.cv.addEventListener('pointerdown', function () { if (dead) reset(); });

    loop(function (dt) {
      if (!dead) {
        var lane = lanes[py];
        // move items
        for (var r = 0; r < ROWS; r++) {
          var ln = lanes[r];
          if (ln.type === 'road' || ln.type === 'river') {
            ln.items.forEach(function (it) {
              it.x += ln.dir * ln.speed * dt;
              if (it.x > WI + 40) it.x = -it.w;
              if (it.x < -it.w - 40) it.x = WI;
            });
          }
        }

        // collision check
        var screenY = HE - (py + 1) * RH;
        if (lane.type === 'road') {
          lane.items.forEach(function (car) {
            if (px + PS > car.x && px - PS < car.x + car.w) { die(); }
          });
        }
        if (lane.type === 'river') {
          var onLog = false;
          lane.items.forEach(function (log) {
            if (px + PS > log.x && px - PS < log.x + log.w) {
              onLog = true;
              px += lane.dir * lane.speed * dt;
            }
          });
          if (!onLog) die();
          px = clamp(px, PS, WI - PS);
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      for (var r2 = 0; r2 < ROWS; r2++) {
        var ry = HE - (r2 + 1) * RH;
        var ln2 = lanes[r2];
        if (ln2.type === 'safe' || ln2.type === 'goal') {
          ctx.fillStyle = r2 === ROWS - 1 ? '#2A5C3A' : C_SURF;
          ctx.fillRect(0, ry, WI, RH);
        } else if (ln2.type === 'road') {
          ctx.fillStyle = '#1E1636';
          ctx.fillRect(0, ry, WI, RH);
          ctx.fillStyle = C_PINK;
          ln2.items.forEach(function (car) { ctx.fillRect(car.x, ry + 4, car.w, RH - 8); });
        } else if (ln2.type === 'river') {
          ctx.fillStyle = '#153060';
          ctx.fillRect(0, ry, WI, RH);
          ctx.fillStyle = '#5A3E1B';
          ln2.items.forEach(function (log) { ctx.fillRect(log.x, ry + 4, log.w, RH - 8); });
        }
      }
      // player
      if (!dead) {
        var playerScreenY = HE - (py + 1) * RH;
        ctx.fillStyle = C_GRN;
        ctx.beginPath();
        ctx.arc(px, playerScreenY + RH / 2, PS, 0, 7);
        ctx.fill();
        ctx.fillStyle = C_TXT;
        ctx.font = '16px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('🐸', px, playerScreenY + RH / 2 + 6);
        ctx.textAlign = 'left';
      }

      if (dead) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });

    function die() {
      if (dead) return;
      dead = true; sfx('lose');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('hopper', score); award(Math.floor(score / 40));
      st.set('best', getBest('hopper'));
    }
    reset();
  } });
})();

/* ================= STACKER (Tower Stack) ================= */
(function () {
  var STR = {
    en: { t: 'Tower Stack', d: 'Stack moving blocks to build the tallest tower.', floors: 'Floors' },
    tr: { t: 'Kule İstifi', d: 'Hareket eden blokları istifle, en yüksek kuleyi yap.', floors: 'Kat' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'stacker', icon: '🏗️', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 300, HE = 450, BH = 22;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    root.appendChild(el('div', 'hint-line', t('core.tapOrSpace')));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var stack, current, score, over, speed, dir;
    var COLORS = [C_ACC, C_PINK, C_GRN, C_BLUE, '#B57EDC', '#FFD966', '#F2914A'];

    function reset() {
      stack = [{ x: WI / 2 - 60, w: 120 }];
      speed = 100; dir = 1; score = 0; over = false;
      current = { x: 0, w: 120 };
      st.set('score', 0); st.set('best', getBest('stacker') || 0);
    }
    function drop() {
      if (over) { reset(); return; }
      var top = stack[stack.length - 1];
      var leftEdge = Math.max(current.x, top.x);
      var rightEdge = Math.min(current.x + current.w, top.x + top.w);
      var overlap = rightEdge - leftEdge;

      if (overlap <= 0) {
        // missed entirely
        over = true; sfx('lose');
        setBest('stacker', score); award(Math.floor(score / 5));
        st.set('best', getBest('stacker'));
        return;
      }
      sfx(overlap >= current.w - 2 ? 'good' : 'tick');
      stack.push({ x: leftEdge, w: overlap });
      score++; st.set('score', score);
      speed = Math.min(350, 100 + score * 8);
      current = { x: 0, w: overlap };
      dir = 1;
    }
    c.cv.addEventListener('pointerdown', function (e) { e.preventDefault(); drop(); });
    addKey(function (e) {
      if (e.key === ' ') { e.preventDefault(); drop(); }
    });

    loop(function (dt) {
      if (!over) {
        current.x += dir * speed * dt;
        if (current.x + current.w > WI) { current.x = WI - current.w; dir = -1; }
        if (current.x < 0) { current.x = 0; dir = 1; }
      }

      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // camera offset so tower stays visible
      var camY = Math.max(0, (stack.length - 15) * BH);

      // draw stack
      for (var i = 0; i < stack.length; i++) {
        var bl = stack[i];
        var by = HE - (i + 1) * BH + camY;
        if (by > HE + BH || by < -BH) continue;
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fillRect(bl.x, by, bl.w, BH - 2);
      }

      // draw current moving block
      if (!over) {
        var cy = HE - (stack.length + 1) * BH + camY;
        ctx.fillStyle = COLORS[stack.length % COLORS.length];
        ctx.fillRect(current.x, cy, current.w, BH - 2);
      }

      // floor line
      ctx.fillStyle = C_SURF;
      ctx.fillRect(0, HE - BH + camY, WI, BH);

      if (over) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });
    reset();
  } });
})();

/* ================= CATCHER (Candy Catch) ================= */
(function () {
  var STR = {
    en: { t: 'Candy Catch', d: 'Catch falling candies, avoid bombs! 3 lives.' },
    tr: { t: 'Şeker Yakala', d: 'Düşen şekerleri yakala, bombalardan kaç! 3 can.' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'catcher', icon: '🧺', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 360, HE = 460;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['lives', t('core.lives')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(dpad(function (d) {
      if (d === 'left') basket.x -= 28;
      if (d === 'right') basket.x += 28;
      basket.x = clamp(basket.x, BW / 2, WI - BW / 2);
    }));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var basket, items, score, lives, over, spawnTimer, fallSpeed;
    var BW = 50, BHT = 20;
    var CANDY_ICONS = ['🍬', '🍭', '🍫', '🍩', '⭐'];

    function reset() {
      basket = { x: WI / 2 };
      items = []; score = 0; lives = 3; over = false;
      spawnTimer = 0; fallSpeed = 120;
      msg.textContent = '';
      st.set('score', 0); st.set('lives', 3); st.set('best', getBest('catcher') || 0);
    }
    addKey(function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); basket.x = clamp(basket.x - 28, BW / 2, WI - BW / 2); }
      if (e.key === 'ArrowRight') { e.preventDefault(); basket.x = clamp(basket.x + 28, BW / 2, WI - BW / 2); }
      if (e.key === ' ' && over) { e.preventDefault(); reset(); }
    });
    c.cv.addEventListener('pointermove', function (e) {
      if (!over) basket.x = clamp(canvasPos(c.cv, WI, HE, e).x, BW / 2, WI - BW / 2);
    });
    c.cv.addEventListener('pointerdown', function () { if (over) reset(); });

    loop(function (dt) {
      if (!over) {
        spawnTimer += dt;
        var rate = Math.max(0.35, 1.0 - score * 0.012);
        if (spawnTimer > rate) {
          spawnTimer = 0;
          var isBomb = Math.random() < 0.2;
          items.push({
            x: 15 + rnd(WI - 30),
            y: -20,
            bomb: isBomb,
            icon: isBomb ? '💣' : pick(CANDY_ICONS)
          });
        }
        fallSpeed = Math.min(320, 120 + score * 2.5);

        for (var i = items.length - 1; i >= 0; i--) {
          items[i].y += fallSpeed * dt;
          // catch check
          if (items[i].y > HE - 40 && items[i].y < HE - 10 &&
              Math.abs(items[i].x - basket.x) < BW / 2 + 10) {
            if (items[i].bomb) {
              lives--; st.set('lives', lives); sfx('bad');
              items.splice(i, 1);
              if (lives <= 0) { end(); break; }
            } else {
              score += 10; st.set('score', score); sfx('pop');
              items.splice(i, 1);
            }
            continue;
          }
          if (items[i].y > HE + 20) { items.splice(i, 1); }
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // basket
      ctx.fillStyle = C_ACC;
      ctx.fillRect(basket.x - BW / 2, HE - 30, BW, BHT);
      ctx.fillStyle = '#D4881F';
      ctx.fillRect(basket.x - BW / 2 + 3, HE - 30, BW - 6, 4);

      // items
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
      items.forEach(function (it) {
        ctx.fillText(it.icon, it.x, it.y + 8);
      });
      ctx.textAlign = 'left';

      if (over) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });

    function end() {
      over = true; sfx('lose');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('catcher', score); award(Math.floor(score / 40));
      st.set('best', getBest('catcher'));
    }
    reset();
  } });
})();

/* ================= DODGER (Meteor Dodge) ================= */
(function () {
  var STR = {
    en: { t: 'Meteor Dodge', d: 'Dodge falling meteors as long as you can!', surv: 'Survived' },
    tr: { t: 'Meteor Kaçışı', d: 'Düşen meteorlardan olabildiğince uzun kaç!', surv: 'Hayatta' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'dodger', icon: '☄️', cat: 'arcade', unit: 'ms', str: STR, init: function (root) {
    var WI = 360, HE = 460;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['time', W.surv], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    root.appendChild(el('div', 'hint-line', t('core.tapOrSpace')));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var px, meteors, elapsed, dead, started, spawnTimer;
    var PR = 12;

    function reset() {
      px = WI / 2; meteors = []; elapsed = 0; dead = false; started = false;
      spawnTimer = 0;
      st.set('time', '0.0s'); st.set('best', fmtMs(getBest('dodger') || 0));
    }
    function fmtMs(ms) { return (ms / 1000).toFixed(1) + 's'; }

    c.cv.addEventListener('pointermove', function (e) {
      if (!dead) { px = clamp(canvasPos(c.cv, WI, HE, e).x, PR, WI - PR); started = true; }
    });
    c.cv.addEventListener('pointerdown', function (e) {
      if (dead) { reset(); return; }
      px = clamp(canvasPos(c.cv, WI, HE, e).x, PR, WI - PR);
      started = true;
    });
    addKey(function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); px = clamp(px - 20, PR, WI - PR); started = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); px = clamp(px + 20, PR, WI - PR); started = true; }
      if (e.key === ' ') { e.preventDefault(); if (dead) reset(); else started = true; }
    });

    loop(function (dt) {
      if (started && !dead) {
        elapsed += dt;
        st.set('time', (elapsed).toFixed(1) + 's');

        // spawn meteors
        spawnTimer += dt;
        var rate = Math.max(0.08, 0.5 - elapsed * 0.012);
        if (spawnTimer > rate) {
          spawnTimer = 0;
          var mr = 6 + rnd(10);
          meteors.push({ x: 10 + rnd(WI - 20), y: -mr, r: mr, speed: 150 + rnd(100) + elapsed * 8 });
        }

        for (var i = meteors.length - 1; i >= 0; i--) {
          meteors[i].y += meteors[i].speed * dt;
          if (meteors[i].y > HE + 20) { meteors.splice(i, 1); continue; }
          // collision
          var m = meteors[i];
          var dx = m.x - px, dy = m.y - (HE - 30);
          if (Math.sqrt(dx * dx + dy * dy) < m.r + PR) { die(); break; }
        }
      }

      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // starfield
      ctx.fillStyle = C_DIM;
      for (var s = 0; s < 25; s++) {
        var sx = (s * 43 + 7) % WI, sy = (s * 67 + 13) % HE;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // player spaceship
      ctx.fillStyle = C_ACC;
      ctx.beginPath();
      ctx.moveTo(px, HE - 44);
      ctx.lineTo(px - 11, HE - 20);
      ctx.lineTo(px, HE - 26);
      ctx.lineTo(px + 11, HE - 20);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = C_BLUE;
      ctx.beginPath(); ctx.arc(px, HE - 33, 3.5, 0, 7); ctx.fill();
      if (started && !dead) {
        ctx.fillStyle = C_PINK;
        ctx.fillRect(px - 2, HE - 22, 4, 5 + Math.random() * 4);
      }

      // meteors
      meteors.forEach(function (m) {
        ctx.fillStyle = C_PINK;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 7); ctx.fill();
        ctx.fillStyle = C_ACC;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r * 0.4, 0, 7); ctx.fill();
      });

      if (!started && !dead) overlay(ctx, WI, HE, '☄️', t('core.tapOrSpace'));
      if (dead) overlay(ctx, WI, HE, t('core.gameOver'), (elapsed).toFixed(1) + 's');
    });

    function die() {
      if (dead) return;
      dead = true; sfx('lose');
      var ms = Math.round(elapsed * 1000);
      setBest('dodger', ms);
      award(Math.floor(elapsed / 5));
      st.set('best', fmtMs(getBest('dodger')));
    }
    reset();
  } });
})();

/* ================= JUMPER (Jump Tower) ================= */
(function () {
  var STR = {
    en: { t: 'Jump Tower', d: 'Bounce up the platforms — how high can you go?', height: 'Height' },
    tr: { t: 'Zıplama Kulesi', d: 'Platformlarda zıpla — ne kadar yükseğe çıkabilirsin?', height: 'Yükseklik' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'jumper', icon: '🦘', cat: 'arcade', unit: 'pts', str: STR, init: function (root) {
    var WI = 320, HE = 480;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys')));
    root.appendChild(dpad(function (d) {
      if (d === 'left') moveDir = -1;
      else if (d === 'right') moveDir = 1;
      else moveDir = 0;
    }));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var px, py, vx, vy, platforms, camY, score, dead, moveDir;
    var PW = 14, PH = 20, PLAT_W = 56, PLAT_H = 10;
    var GRAV = 600, JUMP_VEL = -420, MOVE_SPD = 220;

    function genPlatforms(startY, count) {
      var arr = [];
      for (var i = 0; i < count; i++) {
        arr.push({
          x: 10 + rnd(WI - 10 - PLAT_W),
          y: startY - i * 55 - rnd(20),
          w: PLAT_W - rnd(12),
          moving: Math.random() < 0.15 && i > 3,
          dir: Math.random() < 0.5 ? 1 : -1,
          breaking: Math.random() < 0.1 && i > 5,
          broken: false
        });
      }
      return arr;
    }
    function reset() {
      px = WI / 2; py = HE - 40; vx = 0; vy = 0;
      camY = 0; score = 0; dead = false; moveDir = 0;
      platforms = genPlatforms(HE - 20, 30);
      // ensure a platform under player
      platforms[0].x = px - PLAT_W / 2; platforms[0].y = HE - 20;
      platforms[0].moving = false; platforms[0].breaking = false;
      st.set('score', 0); st.set('best', getBest('jumper') || 0);
    }
    var keys = {};
    addKey(function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); keys.left = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); keys.right = true; }
      if (e.key === ' ' && dead) { e.preventDefault(); reset(); }
    });
    var kup2 = function (e) {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    };
    document.addEventListener('keyup', kup2);
    onCleanup(function () { document.removeEventListener('keyup', kup2); });
    c.cv.addEventListener('pointermove', function (e) {
      if (!dead) {
        var pos = canvasPos(c.cv, WI, HE, e);
        if (pos.x < WI / 3) moveDir = -1;
        else if (pos.x > WI * 2 / 3) moveDir = 1;
        else moveDir = 0;
      }
    });
    c.cv.addEventListener('pointerdown', function () { if (dead) reset(); });

    loop(function (dt) {
      if (!dead) {
        // horizontal movement
        var mx = 0;
        if (keys.left || moveDir < 0) mx = -MOVE_SPD;
        if (keys.right || moveDir > 0) mx = MOVE_SPD;
        px += mx * dt;
        // wrap around
        if (px < -PW) px = WI + PW;
        if (px > WI + PW) px = -PW;

        // gravity
        vy += GRAV * dt;
        py += vy * dt;

        // platform collision (only when falling)
        if (vy > 0) {
          for (var i = 0; i < platforms.length; i++) {
            var p = platforms[i];
            if (p.broken) continue;
            var screenPY = p.y - camY;
            var playerBottom = py;
            var playerPrevBottom = py - vy * dt;
            if (px + PW / 2 > p.x && px - PW / 2 < p.x + p.w &&
                playerBottom >= p.y && playerPrevBottom <= p.y + PLAT_H) {
              if (p.breaking) {
                p.broken = true;
                sfx('bad');
              } else {
                vy = JUMP_VEL;
                py = p.y;
                sfx('tick');
              }
              break;
            }
          }
        }

        // move camera up
        var targetCam = py - HE * 0.4;
        if (targetCam < camY) {
          camY = targetCam;
          var height = Math.floor(-camY / 10);
          if (height > score) { score = height; st.set('score', score); }
        }

        // generate more platforms above
        var highest = platforms[platforms.length - 1].y;
        if (highest > camY - HE) {
          var newPlats = genPlatforms(highest - 55, 10);
          platforms = platforms.concat(newPlats);
        }
        // remove platforms far below
        platforms = platforms.filter(function (p) { return p.y < camY + HE + 100; });

        // move moving platforms
        platforms.forEach(function (p) {
          if (p.moving && !p.broken) {
            p.x += p.dir * 60 * dt;
            if (p.x <= 0) p.dir = 1;
            if (p.x + p.w >= WI) p.dir = -1;
          }
        });

        // fell off screen
        if (py - camY > HE + 50) {
          die();
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // stars
      ctx.fillStyle = '#FFD96630';
      for (var s = 0; s < 15; s++) {
        var sx = (s * 41 + 5) % WI;
        var sy = ((s * 71 + 19) - camY * 0.1) % HE;
        if (sy < 0) sy += HE;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // platforms
      platforms.forEach(function (p) {
        if (p.broken) return;
        var sy = p.y - camY;
        if (sy < -20 || sy > HE + 20) return;
        ctx.fillStyle = p.breaking ? C_PINK : (p.moving ? C_BLUE : C_GRN);
        ctx.fillRect(p.x, sy, p.w, PLAT_H);
      });

      // player
      if (!dead) {
        var psy = py - camY;
        ctx.fillStyle = C_ACC;
        ctx.fillRect(px - PW / 2, psy - PH, PW, PH);
        // eyes
        ctx.fillStyle = C_TXT;
        ctx.fillRect(px - 4, psy - PH + 5, 3, 3);
        ctx.fillRect(px + 2, psy - PH + 5, 3, 3);
      }

      if (dead) overlay(ctx, WI, HE, t('core.gameOver'), t('core.finalScore', { n: score }));
    });

    function die() {
      if (dead) return;
      dead = true; sfx('lose');
      setBest('jumper', score); award(Math.floor(score / 30));
      st.set('best', getBest('jumper'));
    }
    reset();
  } });
})();

})();
