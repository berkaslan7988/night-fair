/* ============================================================
   Night Fair — PUZZLE pack (15 games)
   memory, g2048, slide15, lightsout, mines, sudoku, nonogram,
   sokoban, hanoi, pegsol, mastermind, simon, maze, match3, pipes
   ============================================================ */
'use strict';
(function () {

var C_BG = '#150F28', C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_GRN = '#6FCF97',
    C_TXT = '#F5F0FF', C_DIM = '#B8AEDB', C_BLUE = '#6FA8DC', C_SURF = '#2E2454';

/* ================= MEMORY ================= */
(function () {
  var STR = {
    en: { t: 'Memory Cards', d: 'Find the pairs in as few moves as you can.' },
    tr: { t: 'Hafıza Kartları', d: 'Eşleri olabildiğince az hamlede bul.' }
  };
  Games.register({ id: 'memory', icon: '🎴', cat: 'puzzle', unit: 'moves', lower: true, str: STR, init: function (root) {
    var st = stats([['moves', t('core.moves')], ['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 4);
    grid.style.setProperty('--gw', '420px');
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var SYM = ['🎪', '🎡', '🎨', '🎯', '🎲', '🃏', '🎭', '🎫'];
    var state;
    function start() {
      var deck = shuffle(SYM.concat(SYM).slice());
      state = { deck: deck, flipped: [], matched: 0, moves: 0, sec: 0, lock: false };
      msg.textContent = '';
      st.set('moves', 0); st.set('time', '0' + t('core.seconds'));
      st.set('best', getBest('memory') === null ? '-' : getBest('memory'));
      grid.innerHTML = '';
      deck.forEach(function (sym, idx) {
        var card = el('div', 'mem-card', '<span class="face">' + sym + '</span>');
        card.onclick = function () { flip(idx, card); };
        grid.appendChild(card);
      });
      every(function () {
        if (state.matched < 8) { state.sec++; st.set('time', state.sec + t('core.seconds')); }
      }, 1000);
    }
    function flip(idx, card) {
      if (state.lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped'); sfx('click');
      state.flipped.push({ idx: idx, card: card });
      if (state.flipped.length === 2) {
        state.moves++; st.set('moves', state.moves);
        var a = state.flipped[0], b = state.flipped[1];
        if (state.deck[a.idx] === state.deck[b.idx]) {
          a.card.classList.add('matched'); b.card.classList.add('matched');
          state.matched++; state.flipped = []; sfx('pop');
          if (state.matched === 8) {
            msg.textContent = t('core.youWin'); sfx('win');
            setBest('memory', state.moves, true); award(3);
            st.set('best', getBest('memory'));
          }
        } else {
          state.lock = true;
          after(function () {
            a.card.classList.remove('flipped'); b.card.classList.remove('flipped');
            state.flipped = []; state.lock = false;
          }, 650);
        }
      }
    }
    start();
  } });
})();

/* ================= 2048 ================= */
(function () {
  var STR = {
    en: { t: '2048', d: 'Merge the tiles, reach 2048. Swipe or arrow keys.' },
    tr: { t: '2048', d: 'Sayıları birleştir, 2048\'e ulaş. Kaydır ya da ok tuşları.' }
  };
  var TILE_COLORS = { 0: C_SURF, 2: '#3D3268', 4: '#4A3A80', 8: '#F2A93B', 16: '#F2914A', 32: '#FF6F91', 64: '#FF4D6D', 128: '#6FCF97', 256: '#4FCB8E', 512: '#3ABF7D', 1024: '#F2D93B', 2048: '#FFD700' };
  Games.register({ id: 'g2048', icon: '🔢', cat: 'puzzle', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var board = el('div'); board.id = 'g2048-board';
    root.appendChild(board);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys')));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var g, cp;
    var CPS = [500, 1000, 2000, 4000, 8000, 16000];
    function start() {
      g = { grid: [], score: 0, over: false };
      cp = 0;
      for (var r = 0; r < 4; r++) g.grid.push([0, 0, 0, 0]);
      addRandom(); addRandom(); render();
      msg.textContent = '';
      st.set('score', 0); st.set('best', getBest('g2048') || 0);
    }
    function addRandom() {
      var empty = [];
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (!g.grid[r][c]) empty.push([r, c]);
      if (!empty.length) return;
      var p = pick(empty);
      g.grid[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
    }
    function render() {
      board.innerHTML = '';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        var v = g.grid[r][c];
        var tile = el('div', 'tile2048', v || '');
        tile.style.background = TILE_COLORS[v] || '#FFD700';
        tile.style.color = v > 4 ? '#241505' : C_DIM;
        if (v >= 1024) tile.style.fontSize = '15px';
        board.appendChild(tile);
      }
      st.set('score', g.score);
    }
    function slideRow(row) {
      var arr = row.filter(function (v) { return v; });
      for (var i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) { arr[i] *= 2; g.score += arr[i]; arr[i + 1] = 0; }
      }
      arr = arr.filter(function (v) { return v; });
      while (arr.length < 4) arr.push(0);
      return arr;
    }
    function move(dir) {
      if (g.over) return;
      var before = JSON.stringify(g.grid);
      if (dir === 'left') g.grid = g.grid.map(function (r) { return slideRow(r); });
      else if (dir === 'right') g.grid = g.grid.map(function (r) { return slideRow(r.slice().reverse()).reverse(); });
      else if (dir === 'up' || dir === 'down') {
        for (var c = 0; c < 4; c++) {
          var col = [g.grid[0][c], g.grid[1][c], g.grid[2][c], g.grid[3][c]];
          if (dir === 'down') col.reverse();
          col = slideRow(col);
          if (dir === 'down') col.reverse();
          for (var r = 0; r < 4; r++) g.grid[r][c] = col[r];
        }
      }
      if (JSON.stringify(g.grid) !== before) {
        addRandom(); render(); sfx('tick');
        // best updates silently; tickets only at score checkpoints
        if (g.score > (getBest('g2048') || 0)) { S.set('best_g2048', g.score); st.set('best', g.score); }
        while (cp < CPS.length && g.score >= CPS[cp]) { award(3 + cp * 2); sfx('good'); cp++; }
        if (!canMove()) {
          g.over = true; sfx('lose');
          msg.textContent = t('core.gameOver') + ' ' + t('core.finalScore', { n: g.score });
          award(Math.floor(g.score / 500));
        }
      }
    }
    function canMove() {
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (!g.grid[r][c]) return true;
        if (c < 3 && g.grid[r][c] === g.grid[r][c + 1]) return true;
        if (r < 3 && g.grid[r][c] === g.grid[r + 1][c]) return true;
      }
      return false;
    }
    addKey(function (e) {
      var k = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key];
      if (k) { e.preventDefault(); move(k); }
    });
    var tx = 0, ty = 0;
    board.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; });
    board.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) < 25 && Math.abs(dy) < 25) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
    });
    root.appendChild(dpad(function (d) { if (d !== 'action') move(d); }));
    start();
  } });
})();

/* ================= SLIDE15 ================= */
(function () {
  var STR = {
    en: { t: '15 Puzzle', d: 'Slide the tiles back into 1–15 order.' },
    tr: { t: '15 Taş', d: 'Taşları kaydırarak 1–15 sırasına diz.' }
  };
  Games.register({ id: 'slide15', icon: '🔀', cat: 'puzzle', unit: 'moves', lower: true, str: STR, init: function (root) {
    var st = stats([['moves', t('core.moves')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 4);
    grid.style.setProperty('--gw', '320px');
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var tiles, moves, solvedFlag;
    function start() {
      tiles = [];
      for (var i = 1; i < 16; i++) tiles.push(i);
      tiles.push(0);
      // scramble with random valid moves => always solvable
      var blank = 15;
      for (var s = 0; s < 300; s++) {
        var opts = neighbors(blank);
        var pickIdx = pick(opts);
        tiles[blank] = tiles[pickIdx]; tiles[pickIdx] = 0; blank = pickIdx;
      }
      moves = 0; solvedFlag = false;
      msg.textContent = '';
      st.set('moves', 0);
      st.set('best', getBest('slide15') === null ? '-' : getBest('slide15'));
      render();
    }
    function neighbors(idx) {
      var r = Math.floor(idx / 4), c = idx % 4, out = [];
      if (r > 0) out.push(idx - 4);
      if (r < 3) out.push(idx + 4);
      if (c > 0) out.push(idx - 1);
      if (c < 3) out.push(idx + 1);
      return out;
    }
    function render() {
      grid.innerHTML = '';
      tiles.forEach(function (v, idx) {
        var cell = el('button', 'cell' + (v === 0 ? ' flat' : ''), v || '');
        cell.style.fontSize = '20px';
        if (v) cell.onclick = function () { tryMove(idx); };
        grid.appendChild(cell);
      });
    }
    function tryMove(idx) {
      if (solvedFlag) return;
      var blank = tiles.indexOf(0);
      if (neighbors(idx).indexOf(blank) === -1) return;
      tiles[blank] = tiles[idx]; tiles[idx] = 0;
      moves++; st.set('moves', moves); sfx('tick');
      render();
      var done = true;
      for (var i = 0; i < 15; i++) if (tiles[i] !== i + 1) { done = false; break; }
      if (done) {
        solvedFlag = true;
        msg.textContent = t('core.youWin'); sfx('win');
        setBest('slide15', moves, true); award(4);
        st.set('best', getBest('slide15'));
      }
    }
    start();
  } });
})();

/* ================= LIGHTS OUT ================= */
(function () {
  var STR = {
    en: { t: 'Lights Out', d: 'Turn off every light. Each tap flips a cross.' },
    tr: { t: 'Işıkları Söndür', d: 'Tüm ışıkları söndür. Her dokunuş bir artıyı çevirir.' }
  };
  Games.register({ id: 'lightsout', icon: '💡', cat: 'puzzle', unit: 'moves', lower: true, str: STR, init: function (root) {
    var N = 5;
    var st = stats([['moves', t('core.moves')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', N);
    grid.style.setProperty('--gw', '320px');
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var lights, moves, won;
    function start() {
      lights = [];
      for (var i = 0; i < N * N; i++) lights.push(false);
      // apply random presses => always solvable
      for (var s = 0; s < 8 + rnd(8); s++) press(rnd(N * N), true);
      if (lights.every(function (v) { return !v; })) press(rnd(N * N), true);
      moves = 0; won = false;
      msg.textContent = '';
      st.set('moves', 0);
      st.set('best', getBest('lightsout') === null ? '-' : getBest('lightsout'));
      render();
    }
    function press(idx, silent) {
      var r = Math.floor(idx / N), c = idx % N;
      [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
        var nr = r + d[0], nc = c + d[1];
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) lights[nr * N + nc] = !lights[nr * N + nc];
      });
      if (!silent) {
        moves++; st.set('moves', moves); sfx('tick');
        render();
        if (lights.every(function (v) { return !v; })) {
          won = true;
          msg.textContent = t('core.youWin'); sfx('win');
          setBest('lightsout', moves, true); award(3);
          st.set('best', getBest('lightsout'));
        }
      }
    }
    function render() {
      grid.innerHTML = '';
      lights.forEach(function (on, idx) {
        var cell = el('button', 'cell' + (on ? ' lit' : ''), on ? '💡' : '');
        cell.onclick = function () { if (!won) press(idx); };
        grid.appendChild(cell);
      });
    }
    start();
  } });
})();

/* ================= MINESWEEPER ================= */
(function () {
  var STR = {
    en: { t: 'Minesweeper', d: '9×9, 12 mines. First click is always safe.', flagMode: '🚩 Flag mode', mines: 'Mines', boom: 'BOOM! 💥' },
    tr: { t: 'Mayın Tarlası', d: '9×9, 12 mayın. İlk tıklama her zaman güvenli.', flagMode: '🚩 Bayrak modu', mines: 'Mayın', boom: 'BOOM! 💥' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'mines', icon: '💣', cat: 'puzzle', unit: 'ms', lower: true, str: STR, init: function (root) {
    var N = 9, MINES = 12;
    var st = stats([['mines', W.mines], ['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', N);
    grid.style.setProperty('--gw', '400px');
    grid.style.gap = '3px';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var flagBtn;
    var row = el('div', 'row');
    flagBtn = btn(W.flagMode, function () {
      flagMode = !flagMode;
      flagBtn.classList.toggle('secondary', !flagMode);
    }, true);
    row.appendChild(flagBtn);
    row.appendChild(btn(t('core.newGame'), start, true));
    root.appendChild(row);

    var board, revealed, flagged, placed, over, sec, flagMode, cellsLeft;
    var NUMC = ['', C_BLUE, C_GRN, C_PINK, '#B57EDC', C_ACC, '#4FCBCB', C_TXT, C_DIM];

    function start() {
      board = []; revealed = []; flagged = [];
      for (var i = 0; i < N * N; i++) { board.push(0); revealed.push(false); flagged.push(false); }
      placed = false; over = false; sec = 0; flagMode = false; cellsLeft = N * N - MINES;
      flagBtn.classList.add('secondary');
      msg.textContent = '';
      st.set('mines', MINES); st.set('time', '0');
      var b = getBest('mines');
      st.set('best', b === null ? '-' : (b / 1000).toFixed(0) + t('core.seconds'));
      render();
    }
    every(function () { if (placed && !over) { sec++; st.set('time', sec); } }, 1000);

    function placeMines(safeIdx) {
      var safe = neigh(safeIdx).concat([safeIdx]);
      var spots = [];
      for (var i = 0; i < N * N; i++) if (safe.indexOf(i) === -1) spots.push(i);
      shuffle(spots).slice(0, MINES).forEach(function (i) { board[i] = -1; });
      for (var j = 0; j < N * N; j++) {
        if (board[j] === -1) continue;
        board[j] = neigh(j).filter(function (n) { return board[n] === -1; }).length;
      }
      placed = true;
    }
    function neigh(idx) {
      var r = Math.floor(idx / N), c = idx % N, out = [];
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        var nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < N && nc >= 0 && nc < N) out.push(nr * N + nc);
      }
      return out;
    }
    function reveal(idx) {
      if (revealed[idx] || flagged[idx] || over) return;
      if (!placed) placeMines(idx);
      revealed[idx] = true;
      if (board[idx] === -1) { lose(idx); return; }
      cellsLeft--;
      if (board[idx] === 0) neigh(idx).forEach(reveal);
      if (cellsLeft === 0) win();
    }
    function toggleFlag(idx) {
      if (revealed[idx] || over) return;
      flagged[idx] = !flagged[idx];
      st.set('mines', MINES - flagged.filter(Boolean).length);
      sfx('click');
    }
    function lose(hitIdx) {
      over = true; sfx('lose');
      for (var i = 0; i < N * N; i++) if (board[i] === -1) revealed[i] = true;
      msg.textContent = W.boom;
    }
    function win() {
      over = true; sfx('win');
      msg.textContent = t('core.youWin');
      setBest('mines', sec * 1000, true); award(6);
      st.set('best', sec + t('core.seconds'));
    }
    function render() {
      grid.innerHTML = '';
      for (var i = 0; i < N * N; i++) {
        (function (idx) {
          var cell = el('button', 'cell');
          cell.style.fontSize = '15px';
          if (revealed[idx]) {
            cell.classList.add('flat');
            if (board[idx] === -1) { cell.textContent = '💣'; cell.classList.add('bad'); }
            else if (board[idx] > 0) { cell.textContent = board[idx]; cell.style.color = NUMC[board[idx]]; }
          } else if (flagged[idx]) cell.textContent = '🚩';
          cell.onclick = function () {
            if (flagMode) toggleFlag(idx); else { reveal(idx); if (!over) sfx('tick'); }
            render();
          };
          cell.oncontextmenu = function (e) { e.preventDefault(); toggleFlag(idx); render(); };
          grid.appendChild(cell);
        })(i);
      }
    }
    start();
  } });
})();

/* ================= SUDOKU ================= */
(function () {
  var STR = {
    en: { t: 'Sudoku', d: 'Real generator with a unique solution. Three difficulties.', easy: 'Easy', med: 'Medium', hard: 'Hard', erase: 'Erase' },
    tr: { t: 'Sudoku', d: 'Tek çözüm garantili gerçek üreteç. Üç zorluk.', easy: 'Kolay', med: 'Orta', hard: 'Zor', erase: 'Sil' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'sudoku', icon: '9️⃣', cat: 'puzzle', unit: 'ms', lower: true, str: STR, init: function (root) {
    var st = stats([['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var diffRow = el('div', 'row'); diffRow.style.marginTop = '0';
    root.appendChild(diffRow);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 9);
    grid.style.setProperty('--gw', '420px');
    grid.style.gap = '2px';
    grid.style.marginTop = '12px';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var padRow = el('div', 'row');
    root.appendChild(padRow);

    var puzzle, solution, given, user, sel, sec, done, diff = 'easy';
    var GIVENS = { easy: 40, med: 32, hard: 26 };

    ['easy', 'med', 'hard'].forEach(function (d) {
      var b = btn(W[d], function () { diff = d; start(); }, true);
      diffRow.appendChild(b);
    });
    for (var n = 1; n <= 9; n++) {
      (function (num) {
        padRow.appendChild(btn(String(num), function () { place(num); }, true));
      })(n);
    }
    padRow.appendChild(btn(W.erase, function () { place(0); }, true));

    function findEmpty(g) {
      for (var i = 0; i < 81; i++) if (!g[i]) return i;
      return -1;
    }
    function okAt(g, idx, v) {
      var r = Math.floor(idx / 9), c = idx % 9;
      for (var i = 0; i < 9; i++) {
        if (g[r * 9 + i] === v || g[i * 9 + c] === v) return false;
      }
      var br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
      for (var rr = br; rr < br + 3; rr++) for (var cc = bc; cc < bc + 3; cc++) {
        if (g[rr * 9 + cc] === v) return false;
      }
      return true;
    }
    function fill(g) {
      var idx = findEmpty(g);
      if (idx === -1) return true;
      var cand = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      for (var i = 0; i < 9; i++) {
        if (okAt(g, idx, cand[i])) {
          g[idx] = cand[i];
          if (fill(g)) return true;
          g[idx] = 0;
        }
      }
      return false;
    }
    function countSolutions(g, cap) {
      var idx = findEmpty(g);
      if (idx === -1) return 1;
      var total = 0;
      for (var v = 1; v <= 9; v++) {
        if (okAt(g, idx, v)) {
          g[idx] = v;
          total += countSolutions(g, cap - total);
          g[idx] = 0;
          if (total >= cap) return total;
        }
      }
      return total;
    }
    function generate() {
      solution = [];
      for (var i = 0; i < 81; i++) solution.push(0);
      fill(solution);
      puzzle = solution.slice();
      var order = shuffle(Array.apply(null, Array(81)).map(function (_, i) { return i; }));
      var keep = GIVENS[diff];
      var removed = 0, target = 81 - keep;
      for (var j = 0; j < order.length && removed < target; j++) {
        var idx2 = order[j], backup = puzzle[idx2];
        puzzle[idx2] = 0;
        if (countSolutions(puzzle.slice(), 2) !== 1) puzzle[idx2] = backup;
        else removed++;
      }
    }
    function start() {
      msg.textContent = '…';
      after(function () {
        generate();
        given = puzzle.map(function (v) { return v !== 0; });
        user = puzzle.slice();
        sel = -1; sec = 0; done = false;
        msg.textContent = '';
        st.set('time', '0:00');
        var b = getBest('sudoku');
        st.set('best', b === null ? '-' : fmtTime(Math.round(b / 1000)));
        render();
      }, 30);
    }
    every(function () { if (!done && user) { sec++; st.set('time', fmtTime(sec)); } }, 1000);

    function conflicts(idx) {
      var v = user[idx];
      if (!v) return false;
      var save = user[idx];
      user[idx] = 0;
      var bad = !okAt(user, idx, v);
      user[idx] = save;
      return bad;
    }
    function place(num) {
      if (done || sel < 0 || given[sel]) return;
      user[sel] = num;
      sfx('tick');
      render();
      if (user.every(function (v) { return v !== 0; })) {
        var allOk = true;
        for (var i = 0; i < 81; i++) if (conflicts(i)) { allOk = false; break; }
        if (allOk) {
          done = true;
          msg.textContent = t('core.youWin'); sfx('win');
          setBest('sudoku', sec * 1000, true); award(10);
          st.set('best', fmtTime(sec));
        }
      }
    }
    addKey(function (e) {
      if (e.key >= '1' && e.key <= '9') place(parseInt(e.key, 10));
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') place(0);
    });
    function render() {
      grid.innerHTML = '';
      for (var i = 0; i < 81; i++) {
        (function (idx) {
          var cell = el('button', 'cell', user[idx] || '');
          cell.style.fontSize = '16px';
          cell.style.borderRadius = '4px';
          var r = Math.floor(idx / 9), c = idx % 9;
          if (c === 2 || c === 5) cell.style.borderRight = '2px solid ' + C_ACC + '55';
          if (r === 2 || r === 5) cell.style.borderBottom = '2px solid ' + C_ACC + '55';
          if (given[idx]) { cell.classList.add('flat'); cell.style.color = C_TXT; }
          else cell.style.color = C_BLUE;
          if (conflicts(idx)) cell.style.color = C_PINK;
          if (idx === sel) cell.classList.add('lit');
          cell.onclick = function () { if (!given[idx]) { sel = idx; render(); } };
          grid.appendChild(cell);
        })(i);
      }
    }
    start();
  } });
})();

/* ================= NONOGRAM ================= */
(function () {
  var STR = {
    en: { t: 'Nonogram', d: 'Paint by numbers — match every row and column clue.', markMode: '✖ Mark mode', size: 'Size' },
    tr: { t: 'Nonogram', d: 'Sayılarla boyama — her satır ve sütun ipucunu tuttur.', markMode: '✖ İşaret modu', size: 'Boyut' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'nonogram', icon: '🖌️', cat: 'puzzle', unit: 'ms', lower: true, str: STR, init: function (root) {
    var st = stats([['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var sizeRow = el('div', 'row'); sizeRow.style.marginTop = '0';
    root.appendChild(sizeRow);
    var wrapDiv = el('div'); wrapDiv.style.overflowX = 'auto';
    root.appendChild(wrapDiv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var markBtn;
    var row = el('div', 'row');
    markBtn = btn(W.markMode, function () {
      markMode = !markMode;
      markBtn.classList.toggle('secondary', !markMode);
    }, true);
    row.appendChild(markBtn);
    row.appendChild(btn(t('core.newGame'), start, true));
    root.appendChild(row);

    var N = 5, target, cells, sec, done, markMode;
    [5, 8, 10].forEach(function (s) {
      sizeRow.appendChild(btn(s + '×' + s, function () { N = s; start(); }, true));
    });

    function clues(line) {
      var out = [], run = 0;
      line.forEach(function (v) {
        if (v) run++;
        else if (run) { out.push(run); run = 0; }
      });
      if (run) out.push(run);
      return out.length ? out : [0];
    }
    function rowOf(g, r) { return g.slice(r * N, r * N + N); }
    function colOf(g, c) {
      var out = [];
      for (var r = 0; r < N; r++) out.push(g[r * N + c]);
      return out;
    }
    function start() {
      target = [];
      for (var i = 0; i < N * N; i++) target.push(Math.random() < 0.55 ? 1 : 0);
      cells = [];
      for (var j = 0; j < N * N; j++) cells.push(0); // 0 empty, 1 filled, 2 marked
      sec = 0; done = false; markMode = false;
      markBtn.classList.add('secondary');
      msg.textContent = '';
      st.set('time', '0:00');
      var b = getBest('nonogram');
      st.set('best', b === null ? '-' : fmtTime(Math.round(b / 1000)));
      render();
    }
    every(function () { if (!done && cells) { sec++; st.set('time', fmtTime(sec)); } }, 1000);

    function check() {
      for (var r = 0; r < N; r++) {
        if (JSON.stringify(clues(rowOf(cells, r).map(function (v) { return v === 1 ? 1 : 0; }))) !==
            JSON.stringify(clues(rowOf(target, r)))) return false;
      }
      for (var c = 0; c < N; c++) {
        if (JSON.stringify(clues(colOf(cells, c).map(function (v) { return v === 1 ? 1 : 0; }))) !==
            JSON.stringify(clues(colOf(target, c)))) return false;
      }
      return true;
    }
    function tap(idx) {
      if (done) return;
      if (markMode) cells[idx] = cells[idx] === 2 ? 0 : 2;
      else cells[idx] = cells[idx] === 1 ? 0 : 1;
      sfx('tick');
      render();
      if (check()) {
        done = true;
        msg.textContent = t('core.youWin'); sfx('win');
        setBest('nonogram', sec * 1000, true); award(N);
        st.set('best', fmtTime(sec));
      }
    }
    function render() {
      wrapDiv.innerHTML = '';
      var table = el('div');
      table.style.display = 'grid';
      table.style.gridTemplateColumns = 'auto repeat(' + N + ', 1fr)';
      table.style.gap = '3px';
      table.style.maxWidth = (N * 38 + 80) + 'px';
      table.style.margin = '0 auto';
      // corner
      table.appendChild(el('div'));
      // column clues
      for (var c = 0; c < N; c++) {
        var cc = el('div', null, clues(colOf(target, c)).join('<br>'));
        cc.style.cssText = 'text-align:center;font-family:var(--font-mono);font-size:11px;color:' + C_DIM + ';align-self:end;line-height:1.3;';
        table.appendChild(cc);
      }
      for (var r = 0; r < N; r++) {
        var rc = el('div', null, clues(rowOf(target, r)).join(' '));
        rc.style.cssText = 'text-align:right;font-family:var(--font-mono);font-size:11px;color:' + C_DIM + ';align-self:center;padding-right:6px;white-space:nowrap;';
        table.appendChild(rc);
        for (var c2 = 0; c2 < N; c2++) {
          (function (idx) {
            var cell = el('button', 'cell');
            cell.style.minWidth = '26px';
            cell.style.fontSize = '13px';
            if (cells[idx] === 1) cell.classList.add('good');
            if (cells[idx] === 2) { cell.textContent = '✕'; cell.style.color = C_DIM; }
            cell.onclick = function () { tap(idx); };
            cell.oncontextmenu = function (e) {
              e.preventDefault();
              cells[idx] = cells[idx] === 2 ? 0 : 2;
              render();
            };
            table.appendChild(cell);
          })(r * N + c2);
        }
      }
      wrapDiv.appendChild(table);
    }
    start();
  } });
})();

/* ================= SOKOBAN ================= */
(function () {
  var STR = {
    en: { t: 'Sokoban', d: 'Push every crate onto a target. 8 levels.', undo: 'Undo', lvl: 'Level' },
    tr: { t: 'Sokoban', d: 'Her kasayı hedefine it. 8 seviye.', undo: 'Geri al', lvl: 'Seviye' }
  };
  var W = STR[NF.lang] || STR.en;
  var LEVELS = [
    ['#####',
     '#@$.#',
     '#####'],
    ['######',
     '#@ $.#',
     '######'],
    ['#######',
     '#.$@$.#',
     '#######'],
    ['#####',
     '#.  #',
     '# $ #',
     '# @ #',
     '#####'],
    ['######',
     '#    #',
     '# $$ #',
     '# .. #',
     '#@   #',
     '######'],
    ['########',
     '#      #',
     '# $ $  #',
     '# #.#. #',
     '#   @  #',
     '########'],
    ['#######',
     '#     #',
     '# .$@ #',
     '# $   #',
     '# .   #',
     '#######'],
    ['######',
     '# @$.#',
     '#.$  #',
     '# $  #',
     '# .  #',
     '######']
  ];
  Games.register({ id: 'sokoban', icon: '📦', cat: 'puzzle', unit: 'level', str: STR, init: function (root) {
    var st = stats([['lvl', W.lvl], ['moves', t('core.moves')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div');
    grid.style.cssText = 'display:grid;gap:2px;margin:0 auto;justify-content:center;';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys')));
    root.appendChild(dpad(move));
    var row = el('div', 'row');
    row.appendChild(btn(W.undo, undo, true));
    row.appendChild(btn(t('core.restart'), loadLevel, true));
    root.appendChild(row);

    var lvl, walls, goals, boxes, player, moves, history, WD, HT, doneLvl;

    function loadLevel() {
      lvl = clamp(S.get('sokoban_lvl', 0), 0, LEVELS.length - 1);
      var rows = LEVELS[lvl];
      HT = rows.length; WD = Math.max.apply(null, rows.map(function (r) { return r.length; }));
      walls = {}; goals = {}; boxes = {}; history = []; moves = 0; doneLvl = false;
      rows.forEach(function (rowStr, r) {
        for (var c = 0; c < rowStr.length; c++) {
          var ch = rowStr[c], key = r + ',' + c;
          if (ch === '#') walls[key] = 1;
          if (ch === '.' || ch === '*' || ch === '+') goals[key] = 1;
          if (ch === '$' || ch === '*') boxes[key] = 1;
          if (ch === '@' || ch === '+') player = { r: r, c: c };
        }
      });
      msg.textContent = '';
      st.set('lvl', (lvl + 1) + '/' + LEVELS.length);
      st.set('moves', 0);
      st.set('best', getBest('sokoban') === null ? '-' : getBest('sokoban'));
      render();
    }
    function move(d) {
      if (doneLvl) return;
      var dd = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[d];
      if (!dd) return;
      var nr = player.r + dd[0], nc = player.c + dd[1];
      var nk = nr + ',' + nc;
      if (walls[nk]) return;
      var snapshot = { player: { r: player.r, c: player.c }, boxes: Object.assign({}, boxes) };
      if (boxes[nk]) {
        var br = nr + dd[0], bc = nc + dd[1], bk = br + ',' + bc;
        if (walls[bk] || boxes[bk]) return;
        delete boxes[nk];
        boxes[bk] = 1;
      }
      history.push(snapshot);
      player = { r: nr, c: nc };
      moves++; st.set('moves', moves); sfx('tick');
      render();
      // win check: all boxes on goals
      var win = Object.keys(boxes).every(function (k) { return goals[k]; });
      if (win) {
        doneLvl = true;
        msg.textContent = t('core.youWin'); sfx('win'); award(3);
        var completed = lvl + 1;
        setBest('sokoban', completed);
        if (lvl < LEVELS.length - 1) {
          S.set('sokoban_lvl', lvl + 1);
          after(loadLevel, 1200);
        }
      }
    }
    function undo() {
      var snap = history.pop();
      if (!snap) return;
      player = snap.player; boxes = snap.boxes;
      moves++; st.set('moves', moves);
      render();
    }
    addKey(function (e) {
      var k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (k) { e.preventDefault(); move(k); }
      if (e.key === 'z' || e.key === 'Z') undo();
    });
    function render() {
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = 'repeat(' + WD + ', 36px)';
      for (var r = 0; r < HT; r++) for (var c = 0; c < WD; c++) {
        var key = r + ',' + c;
        var cell = el('div');
        cell.style.cssText = 'width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:22px;border-radius:5px;';
        if (walls[key]) { cell.style.background = C_SURF; cell.textContent = ''; }
        else {
          cell.style.background = C_BG;
          if (goals[key]) cell.style.boxShadow = 'inset 0 0 0 2px ' + C_ACC + '66';
          if (boxes[key]) cell.textContent = goals[key] ? '🎁' : '📦';
          if (player.r === r && player.c === c) cell.textContent = '🧑‍🔧';
        }
        grid.appendChild(cell);
      }
    }
    loadLevel();
  } });
})();

/* ================= HANOI ================= */
(function () {
  var STR = {
    en: { t: 'Tower of Hanoi', d: 'Move the tower one disk at a time. Big can\'t sit on small.', disks: 'Disks', minMoves: 'Min' },
    tr: { t: 'Hanoi Kulesi', d: 'Kuleyi disk disk taşı. Büyük küçüğün üstüne oturamaz.', disks: 'Disk', minMoves: 'Min' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'hanoi', icon: '🗼', cat: 'puzzle', unit: 'level', str: STR, init: function (root) {
    var st = stats([['moves', t('core.moves')], ['min', W.minMoves], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var diskRow = el('div', 'row'); diskRow.style.marginTop = '0';
    root.appendChild(diskRow);
    var board = el('div');
    board.style.cssText = 'display:flex;gap:10px;justify-content:center;align-items:flex-end;margin:20px auto;max-width:480px;';
    root.appendChild(board);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var N = 4, pegs, sel, moves, done;
    [3, 4, 5, 6, 7].forEach(function (n) {
      diskRow.appendChild(btn(String(n), function () { N = n; start(); }, true));
    });
    var COLORS = [C_PINK, C_ACC, C_GRN, C_BLUE, '#B57EDC', '#FFD966', '#F2914A'];

    function start() {
      pegs = [[], [], []];
      for (var i = N; i >= 1; i--) pegs[0].push(i);
      sel = -1; moves = 0; done = false;
      msg.textContent = '';
      st.set('moves', 0);
      st.set('min', Math.pow(2, N) - 1);
      st.set('best', getBest('hanoi') === null ? '-' : getBest('hanoi'));
      render();
    }
    function tapPeg(p) {
      if (done) return;
      if (sel === -1) {
        if (pegs[p].length) { sel = p; sfx('click'); render(); }
        return;
      }
      if (sel === p) { sel = -1; render(); return; }
      var disk = pegs[sel][pegs[sel].length - 1];
      var top = pegs[p][pegs[p].length - 1];
      if (top !== undefined && top < disk) { sfx('bad'); sel = -1; render(); return; }
      pegs[p].push(pegs[sel].pop());
      sel = -1;
      moves++; st.set('moves', moves); sfx('tick');
      render();
      if (pegs[2].length === N) {
        done = true;
        msg.textContent = t('core.youWin') + ' (' + moves + '/' + (Math.pow(2, N) - 1) + ')';
        sfx('win'); award(N);
        setBest('hanoi', N);
        st.set('best', getBest('hanoi'));
      }
    }
    function render() {
      board.innerHTML = '';
      for (var p = 0; p < 3; p++) {
        (function (pi) {
          var peg = el('div');
          peg.style.cssText = 'flex:1;min-height:' + (N * 24 + 40) + 'px;display:flex;flex-direction:column-reverse;align-items:center;gap:3px;padding:8px 4px;border-radius:10px;cursor:pointer;background:' +
            (sel === pi ? C_SURF : 'transparent') + ';border:1px dashed ' + (sel === pi ? C_ACC : '#3D3268') + ';';
          pegs[pi].forEach(function (d, di) {
            var disk = el('div');
            var isTop = di === pegs[pi].length - 1;
            disk.style.cssText = 'height:20px;border-radius:6px;width:' + (30 + d * 12) + 'px;background:' +
              COLORS[(d - 1) % COLORS.length] + ';' +
              (sel === pi && isTop ? 'outline:2px solid ' + C_TXT + ';' : '');
            peg.appendChild(disk);
          });
          peg.onclick = function () { tapPeg(pi); };
          board.appendChild(peg);
        })(p);
      }
    }
    start();
  } });
})();

/* ================= PEG SOLITAIRE ================= */
(function () {
  var STR = {
    en: { t: 'Peg Solitaire', d: 'Jump pegs to remove them. Aim for one survivor.', left: 'Pegs left', noMoves: 'No moves left!' },
    tr: { t: 'Tek Kalan', d: 'Taşları atlatarak topla. Hedef: tek taş bırakmak.', left: 'Kalan taş', noMoves: 'Hamle kalmadı!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'pegsol', icon: '🟡', cat: 'puzzle', unit: 'pts', lower: true, str: STR, init: function (root) {
    var st = stats([['left', W.left], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 7);
    grid.style.setProperty('--gw', '350px');
    grid.style.gap = '4px';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var board, sel, over;
    function valid(r, c) {
      if (r < 0 || r > 6 || c < 0 || c > 6) return false;
      return !((r < 2 || r > 4) && (c < 2 || c > 4));
    }
    function start() {
      board = {};
      for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) {
        if (valid(r, c)) board[r + ',' + c] = 1;
      }
      board['3,3'] = 0;
      sel = null; over = false;
      msg.textContent = '';
      st.set('left', 32);
      st.set('best', getBest('pegsol') === null ? '-' : getBest('pegsol'));
      render();
    }
    function pegCount() {
      return Object.keys(board).filter(function (k) { return board[k] === 1; }).length;
    }
    function canJump(r, c) {
      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var i = 0; i < 4; i++) {
        var mr = r + dirs[i][0], mc = c + dirs[i][1];
        var tr = r + dirs[i][0] * 2, tc = c + dirs[i][1] * 2;
        if (valid(tr, tc) && board[mr + ',' + mc] === 1 && board[tr + ',' + tc] === 0) return true;
      }
      return false;
    }
    function anyMoves() {
      for (var k in board) {
        if (board[k] === 1) {
          var p = k.split(',');
          if (canJump(+p[0], +p[1])) return true;
        }
      }
      return false;
    }
    function tap(r, c) {
      if (over) return;
      var key = r + ',' + c;
      if (board[key] === 1) { sel = key; sfx('click'); render(); return; }
      if (board[key] === 0 && sel) {
        var p = sel.split(','), sr = +p[0], sc = +p[1];
        var dr = r - sr, dc = c - sc;
        if ((Math.abs(dr) === 2 && dc === 0) || (Math.abs(dc) === 2 && dr === 0)) {
          var mk = (sr + dr / 2) + ',' + (sc + dc / 2);
          if (board[mk] === 1) {
            board[sel] = 0; board[mk] = 0; board[key] = 1;
            sel = null; sfx('pop');
            var left = pegCount();
            st.set('left', left);
            render();
            if (!anyMoves()) {
              over = true;
              msg.textContent = (left === 1 ? t('core.youWin') : W.noMoves) + ' (' + left + ')';
              sfx(left <= 3 ? 'win' : 'lose');
              setBest('pegsol', left, true);
              award(left === 1 ? 15 : (left <= 4 ? 5 : 1));
              st.set('best', getBest('pegsol'));
            }
            return;
          }
        }
        sel = null; render();
      }
    }
    function render() {
      grid.innerHTML = '';
      for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) {
        (function (rr, cc) {
          var cell = el('button', 'cell');
          var key = rr + ',' + cc;
          if (!valid(rr, cc)) {
            cell.style.visibility = 'hidden';
          } else {
            cell.style.borderRadius = '50%';
            if (board[key] === 1) {
              cell.textContent = '🟡';
              if (sel === key) cell.classList.add('lit');
            }
            cell.onclick = function () { tap(rr, cc); };
          }
          grid.appendChild(cell);
        })(r, c);
      }
    }
    start();
  } });
})();

/* ================= MASTERMIND ================= */
(function () {
  var STR = {
    en: { t: 'Code Breaker', d: 'Crack the 4-color secret code in 10 tries.', submit: 'Guess', secretWas: 'The code was:' },
    tr: { t: 'Şifre Kırıcı', d: '4 renkli gizli şifreyi 10 denemede kır.', submit: 'Tahmin et', secretWas: 'Şifre şuydu:' }
  };
  var W = STR[NF.lang] || STR.en;
  var PALETTE = ['🔴', '🟡', '🟢', '🔵', '🟣', '🟠'];
  Games.register({ id: 'mastermind', icon: '🕵️', cat: 'puzzle', unit: 'moves', lower: true, str: STR, init: function (root) {
    var st = stats([['tries', t('core.moves')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var history = el('div');
    history.style.cssText = 'max-width:340px;margin:0 auto;display:flex;flex-direction:column;gap:6px;';
    root.appendChild(history);
    var current = el('div', 'row'); current.style.fontSize = '26px'; current.style.minHeight = '40px';
    root.appendChild(current);
    var palRow = el('div', 'row');
    root.appendChild(palRow);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var actRow = el('div', 'row');
    root.appendChild(actRow);

    var secret, guess, tries, over;
    PALETTE.forEach(function (col) {
      var b = el('button', 'action secondary', col);
      b.style.fontSize = '20px'; b.style.padding = '8px 12px';
      b.onclick = function () {
        if (over || guess.length >= 4) return;
        guess.push(col); sfx('click'); renderCur();
      };
      palRow.appendChild(b);
    });
    actRow.appendChild(btn('⌫', function () { guess.pop(); renderCur(); }, true));
    actRow.appendChild(btn(W.submit, submit));
    actRow.appendChild(btn(t('core.newGame'), start, true));

    function start() {
      secret = [];
      for (var i = 0; i < 4; i++) secret.push(pick(PALETTE));
      guess = []; tries = 0; over = false;
      history.innerHTML = ''; msg.textContent = '';
      st.set('tries', '0/10');
      st.set('best', getBest('mastermind') === null ? '-' : getBest('mastermind'));
      renderCur();
    }
    function renderCur() {
      current.innerHTML = '';
      for (var i = 0; i < 4; i++) {
        var slot = el('span', null, guess[i] || '⚪');
        slot.style.opacity = guess[i] ? 1 : 0.25;
        current.appendChild(slot);
      }
    }
    function submit() {
      if (over || guess.length < 4) return;
      tries++;
      var black = 0, white = 0;
      var s = secret.slice(), gg = guess.slice();
      for (var i = 0; i < 4; i++) {
        if (gg[i] === s[i]) { black++; s[i] = null; gg[i] = null; }
      }
      for (var j = 0; j < 4; j++) {
        if (gg[j] && s.indexOf(gg[j]) !== -1) { white++; s[s.indexOf(gg[j])] = null; }
      }
      var line = el('div', null,
        '<span style="font-size:20px">' + guess.join('') + '</span>' +
        '<span style="font-family:var(--font-mono);margin-left:12px;color:' + C_GRN + '">●'.repeat(black) + '</span>' +
        '<span style="font-family:var(--font-mono);color:' + C_DIM + '">○'.repeat(white) + '</span>');
      line.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:4px;';
      history.appendChild(line);
      st.set('tries', tries + '/10');
      if (black === 4) {
        over = true;
        msg.textContent = t('core.youWin'); sfx('win');
        setBest('mastermind', tries, true); award(6);
        st.set('best', getBest('mastermind'));
      } else if (tries >= 10) {
        over = true; sfx('lose');
        msg.textContent = W.secretWas + ' ' + secret.join('');
      } else sfx('tick');
      guess = [];
      renderCur();
    }
    start();
  } });
})();

/* ================= SIMON ================= */
(function () {
  var STR = {
    en: { t: 'Simon', d: 'Watch the sequence, repeat it. It grows every round.', watch: 'Watch…', go: 'Your turn!' },
    tr: { t: 'Simon', d: 'Diziyi izle, tekrarla. Her turda uzar.', watch: 'İzle…', go: 'Sıra sende!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'simon', icon: '🎛️', cat: 'puzzle', unit: 'level', str: STR, init: function (root) {
    var st = stats([['level', t('core.level')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 2);
    grid.style.setProperty('--gw', '260px');
    grid.style.gap = '10px';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var COLORS = ['#FF6F91', '#6FCF97', '#F2A93B', '#6FA8DC'];
    var SOUNDS = ['pop', 'good', 'tick', 'click'];
    var pads = [], seq, inputIdx, accepting, level;

    for (var i = 0; i < 4; i++) {
      (function (idx) {
        var pad = el('button', 'cell');
        pad.style.background = COLORS[idx] + '44';
        pad.style.borderColor = COLORS[idx];
        pad.style.minHeight = '100px';
        pad.onclick = function () { tap(idx); };
        pads.push(pad);
        grid.appendChild(pad);
      })(i);
    }
    function flash(idx, done) {
      pads[idx].style.background = COLORS[idx];
      sfx(SOUNDS[idx]);
      after(function () {
        pads[idx].style.background = COLORS[idx] + '44';
        if (done) done();
      }, 320);
    }
    function playback(i) {
      if (i >= seq.length) {
        accepting = true; inputIdx = 0;
        msg.textContent = W.go;
        return;
      }
      flash(seq[i], function () { after(function () { playback(i + 1); }, 180); });
    }
    function start() {
      seq = []; level = 0; accepting = false;
      msg.textContent = '';
      st.set('level', 0);
      st.set('best', getBest('simon') || 0);
      nextRound();
    }
    function nextRound() {
      accepting = false;
      seq.push(rnd(4));
      level = seq.length;
      st.set('level', level);
      msg.textContent = W.watch;
      after(function () { playback(0); }, 600);
    }
    function tap(idx) {
      if (!accepting) return;
      flash(idx);
      if (seq[inputIdx] === idx) {
        inputIdx++;
        if (inputIdx >= seq.length) {
          accepting = false;
          sfx('good');
          after(nextRound, 700);
        }
      } else {
        accepting = false; sfx('lose');
        var reached = seq.length - 1;
        msg.textContent = t('core.gameOver') + ' ' + t('core.finalScore', { n: reached });
        setBest('simon', reached); award(Math.floor(reached / 3));
        st.set('best', getBest('simon'));
      }
    }
    start();
  } });
})();

/* ================= MAZE ================= */
(function () {
  var STR = {
    en: { t: 'Maze Escape', d: 'Find the exit of a fresh random maze.', exit: 'Reach the flag!' },
    tr: { t: 'Labirent', d: 'Her seferinde yeni üretilen labirentten çık.', exit: 'Bayrağa ulaş!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'maze', icon: '🌀', cat: 'puzzle', unit: 'ms', lower: true, str: STR, init: function (root) {
    var N = 15, CELL = 22, SZ = N * CELL;
    var c = makeCanvas(SZ, SZ), ctx = c.ctx;
    var st = stats([['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', t('core.pressKeys')));
    root.appendChild(dpad(move));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var walls, px, py, sec, done;
    function start() {
      // recursive backtracker
      walls = [];
      for (var i = 0; i < N * N; i++) walls.push(15); // U1 R2 D4 L8
      var visited = [], stack = [0];
      for (var j = 0; j < N * N; j++) visited.push(false);
      visited[0] = true;
      while (stack.length) {
        var cur = stack[stack.length - 1];
        var r = Math.floor(cur / N), cc = cur % N;
        var opts = [];
        if (r > 0 && !visited[cur - N]) opts.push([cur - N, 1, 4]);
        if (cc < N - 1 && !visited[cur + 1]) opts.push([cur + 1, 2, 8]);
        if (r < N - 1 && !visited[cur + N]) opts.push([cur + N, 4, 1]);
        if (cc > 0 && !visited[cur - 1]) opts.push([cur - 1, 8, 2]);
        if (!opts.length) { stack.pop(); continue; }
        var o = pick(opts);
        walls[cur] &= ~o[1];
        walls[o[0]] &= ~o[2];
        visited[o[0]] = true;
        stack.push(o[0]);
      }
      px = 0; py = 0; sec = 0; done = false;
      msg.textContent = W.exit;
      st.set('time', '0:00');
      var b = getBest('maze');
      st.set('best', b === null ? '-' : fmtTime(Math.round(b / 1000)));
      draw();
    }
    every(function () { if (!done && walls) { sec++; st.set('time', fmtTime(sec)); } }, 1000);
    function move(d) {
      if (done) return;
      var idx = py * N + px;
      if (d === 'up' && !(walls[idx] & 1)) py--;
      else if (d === 'right' && !(walls[idx] & 2)) px++;
      else if (d === 'down' && !(walls[idx] & 4)) py++;
      else if (d === 'left' && !(walls[idx] & 8)) px--;
      else return;
      sfx('tick');
      draw();
      if (px === N - 1 && py === N - 1) {
        done = true;
        msg.textContent = t('core.youWin'); sfx('win');
        setBest('maze', sec * 1000, true); award(5);
        st.set('best', fmtTime(sec));
      }
    }
    addKey(function (e) {
      var k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
      if (k) { e.preventDefault(); move(k); }
    });
    function draw() {
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, SZ, SZ);
      ctx.strokeStyle = C_DIM; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var r = 0; r < N; r++) for (var cc = 0; cc < N; cc++) {
        var w = walls[r * N + cc], x = cc * CELL, y = r * CELL;
        if (w & 1) { ctx.moveTo(x, y); ctx.lineTo(x + CELL, y); }
        if (w & 2) { ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); }
        if (w & 4) { ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); }
        if (w & 8) { ctx.moveTo(x, y); ctx.lineTo(x, y + CELL); }
      }
      ctx.stroke();
      ctx.font = '15px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🚩', (N - 1) * CELL + CELL / 2, (N - 1) * CELL + CELL / 2 + 5);
      ctx.fillStyle = C_ACC;
      ctx.beginPath(); ctx.arc(px * CELL + CELL / 2, py * CELL + CELL / 2, CELL / 3, 0, 7); ctx.fill();
      ctx.textAlign = 'left';
    }
    start();
  } });
})();

/* ================= MATCH-3 ================= */
(function () {
  var STR = {
    en: { t: 'Triple Pop', d: 'Swap neighbors to line up three. 60 seconds!' },
    tr: { t: 'Üçlü Patlat', d: 'Komşuları değiştir, üçlü diz. 60 saniye!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'match3', icon: '🍇', cat: 'puzzle', unit: 'pts', str: STR, init: function (root) {
    var N = 8, GEMS = ['🍇', '🍒', '🍋', '🫐', '🍏', '⭐'];
    var st = stats([['score', t('core.score')], ['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', N);
    grid.style.setProperty('--gw', '400px');
    grid.style.gap = '3px';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var cells, sel, score, timeLeft, over, busy;
    function randomGem() { return rnd(GEMS.length); }
    function start() {
      cells = [];
      for (var i = 0; i < N * N; i++) cells.push(randomGem());
      // remove initial matches
      var guard = 0;
      while (findMatches().length && guard++ < 200) {
        findMatches().forEach(function (i) { cells[i] = randomGem(); });
      }
      sel = -1; score = 0; timeLeft = 60; over = false; busy = false;
      msg.textContent = '';
      st.set('score', 0); st.set('time', 60); st.set('best', getBest('match3') || 0);
      render();
    }
    every(function () {
      if (over || timeLeft <= 0) return;
      timeLeft--;
      st.set('time', timeLeft);
      if (timeLeft <= 0) end();
    }, 1000);

    function findMatches() {
      var out = {};
      for (var r = 0; r < N; r++) for (var c = 0; c < N - 2; c++) {
        var i = r * N + c;
        if (cells[i] !== -1 && cells[i] === cells[i + 1] && cells[i] === cells[i + 2]) {
          out[i] = 1; out[i + 1] = 1; out[i + 2] = 1;
        }
      }
      for (var c2 = 0; c2 < N; c2++) for (var r2 = 0; r2 < N - 2; r2++) {
        var j = r2 * N + c2;
        if (cells[j] !== -1 && cells[j] === cells[j + N] && cells[j] === cells[j + 2 * N]) {
          out[j] = 1; out[j + N] = 1; out[j + 2 * N] = 1;
        }
      }
      return Object.keys(out).map(Number);
    }
    function resolve(mult) {
      var m = findMatches();
      if (!m.length) { busy = false; return; }
      score += m.length * 10 * mult;
      st.set('score', score);
      sfx(mult > 1 ? 'good' : 'pop');
      m.forEach(function (i) { cells[i] = -1; });
      // gravity
      for (var c = 0; c < N; c++) {
        var stack2 = [];
        for (var r = N - 1; r >= 0; r--) {
          if (cells[r * N + c] !== -1) stack2.push(cells[r * N + c]);
        }
        for (var r2 = N - 1; r2 >= 0; r2--) {
          cells[r2 * N + c] = stack2.length ? stack2.shift() : randomGem();
        }
      }
      render();
      after(function () { resolve(mult + 1); }, 260);
    }
    function trySwap(a, b) {
      var tmp = cells[a]; cells[a] = cells[b]; cells[b] = tmp;
      if (!findMatches().length) {
        tmp = cells[a]; cells[a] = cells[b]; cells[b] = tmp;
        sfx('bad');
        render();
        return;
      }
      busy = true;
      render();
      after(function () { resolve(1); }, 150);
    }
    function tap(idx) {
      if (over || busy) return;
      if (sel === -1) { sel = idx; sfx('click'); render(); return; }
      if (sel === idx) { sel = -1; render(); return; }
      var r1 = Math.floor(sel / N), c1 = sel % N, r2 = Math.floor(idx / N), c2 = idx % N;
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1) {
        var a = sel; sel = -1;
        trySwap(a, idx);
      } else { sel = idx; render(); }
    }
    function end() {
      over = true; sfx('win');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('match3', score); award(Math.floor(score / 200));
      st.set('best', getBest('match3'));
    }
    function render() {
      grid.innerHTML = '';
      cells.forEach(function (g, idx) {
        var cell = el('button', 'cell', g === -1 ? '' : GEMS[g]);
        cell.style.fontSize = '20px';
        if (idx === sel) cell.classList.add('lit');
        cell.onclick = function () { tap(idx); };
        grid.appendChild(cell);
      });
    }
    start();
  } });
})();

/* ================= PIPES ================= */
(function () {
  var STR = {
    en: { t: 'Pipe Network', d: 'Rotate tiles until every pipe connects.', connected: 'Connected' },
    tr: { t: 'Boru Hattı', d: 'Tüm borular bağlanana dek parçaları döndür.', connected: 'Bağlı' }
  };
  var W = STR[NF.lang] || STR.en;
  // bit: 1=up 2=right 4=down 8=left
  var CHARS = { 1: '╵', 2: '╶', 4: '╷', 8: '╴', 3: '└', 6: '┌', 12: '┐', 9: '┘', 5: '│', 10: '─', 7: '├', 14: '┬', 13: '┤', 11: '┴', 15: '┼' };
  Games.register({ id: 'pipes', icon: '🔧', cat: 'puzzle', unit: 'moves', lower: true, str: STR, init: function (root) {
    var N = 5;
    var st = stats([['moves', t('core.moves')], ['conn', W.connected], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', N);
    grid.style.setProperty('--gw', '320px');
    grid.style.gap = '4px';
    root.appendChild(grid);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var conns, moves, done;
    function rotCW(m) { return ((m << 1) & 15) | ((m & 8) ? 1 : 0); }
    function start() {
      // spanning tree via randomized DFS
      conns = [];
      for (var i = 0; i < N * N; i++) conns.push(0);
      var visited = [], stack = [rnd(N * N)];
      for (var j = 0; j < N * N; j++) visited.push(false);
      visited[stack[0]] = true;
      while (stack.length) {
        var cur = stack[stack.length - 1];
        var r = Math.floor(cur / N), c = cur % N;
        var opts = [];
        if (r > 0 && !visited[cur - N]) opts.push([cur - N, 1, 4]);
        if (c < N - 1 && !visited[cur + 1]) opts.push([cur + 1, 2, 8]);
        if (r < N - 1 && !visited[cur + N]) opts.push([cur + N, 4, 1]);
        if (c > 0 && !visited[cur - 1]) opts.push([cur - 1, 8, 2]);
        if (!opts.length) { stack.pop(); continue; }
        var o = pick(opts);
        conns[cur] |= o[1];
        conns[o[0]] |= o[2];
        visited[o[0]] = true;
        stack.push(o[0]);
      }
      // scramble
      var scrambled = false;
      conns = conns.map(function (m) {
        var k = rnd(4);
        if (k) scrambled = true;
        for (var s = 0; s < k; s++) m = rotCW(m);
        return m;
      });
      if (!scrambled) conns[0] = rotCW(conns[0]);
      moves = 0; done = false;
      msg.textContent = '';
      st.set('moves', 0);
      st.set('best', getBest('pipes') === null ? '-' : getBest('pipes'));
      render();
    }
    function connectedCount() {
      // check mutual consistency + BFS reachability
      for (var i = 0; i < N * N; i++) {
        var r = Math.floor(i / N), c = i % N, m = conns[i];
        if ((m & 1) && (r === 0 || !(conns[i - N] & 4))) return -1;
        if ((m & 2) && (c === N - 1 || !(conns[i + 1] & 8))) return -1;
        if ((m & 4) && (r === N - 1 || !(conns[i + N] & 1))) return -1;
        if ((m & 8) && (c === 0 || !(conns[i - 1] & 2))) return -1;
      }
      var seen = [0], vis = {}; vis[0] = 1;
      while (seen.length) {
        var cur = seen.pop();
        var r2 = Math.floor(cur / N), c2 = cur % N, mm = conns[cur];
        if ((mm & 1) && !vis[cur - N]) { vis[cur - N] = 1; seen.push(cur - N); }
        if ((mm & 2) && !vis[cur + 1]) { vis[cur + 1] = 1; seen.push(cur + 1); }
        if ((mm & 4) && !vis[cur + N]) { vis[cur + N] = 1; seen.push(cur + N); }
        if ((mm & 8) && !vis[cur - 1]) { vis[cur - 1] = 1; seen.push(cur - 1); }
      }
      return Object.keys(vis).length;
    }
    function tap(idx) {
      if (done) return;
      conns[idx] = rotCW(conns[idx]);
      moves++; st.set('moves', moves); sfx('tick');
      render();
      var cc = connectedCount();
      st.set('conn', (cc === -1 ? '…' : cc) + '/' + (N * N));
      if (cc === N * N) {
        done = true;
        msg.textContent = t('core.youWin'); sfx('win');
        setBest('pipes', moves, true); award(5);
        st.set('best', getBest('pipes'));
        render();
      }
    }
    function render() {
      grid.innerHTML = '';
      conns.forEach(function (m, idx) {
        var cell = el('button', 'cell', CHARS[m] || '·');
        cell.style.fontSize = '30px';
        cell.style.fontFamily = 'var(--font-mono)';
        if (done) cell.classList.add('good');
        cell.onclick = function () { tap(idx); };
        grid.appendChild(cell);
      });
    }
    start();
  } });
})();

})();
