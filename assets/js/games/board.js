/* ============================================================
   Night Fair — BOARD vs Bot pack (6 games)
   ttt, connect4, dotsboxes, nim, battleship, reversi
   (v1.1 — feedback fixes)
   ============================================================ */
'use strict';
(function () {

/* ================= TIC-TAC-TOE ================= */
(function () {
  var STR = {
    en: { t: 'Tic-Tac-Toe', d: 'Classic 3×3 — the bot is sharp, but not flawless.', draw: 'Draw!' },
    tr: { t: 'XOX', d: 'Klasik 3×3 — bot keskin ama kusursuz değil.', draw: 'Berabere!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'ttt', icon: '❌', cat: 'board', unit: 'wins', str: STR, init: function (root) {
    var st = stats([['wins', t('core.wins')], ['draws', t('core.draws')], ['losses', t('core.losses')]]);
    root.appendChild(st.el);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 3);
    grid.style.setProperty('--gw', '240px');
    var cells = [];
    var board, turn, over;

    for (var i = 0; i < 9; i++) (function (idx) {
      var c = el('button', 'ttt-cell');
      c.onclick = function () { if (!over && turn === 'X' && !board[idx]) play(idx); };
      cells.push(c);
      grid.appendChild(c);
    })(i);
    root.appendChild(grid);
    var row = el('div', 'row');
    row.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(row);

    var WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

    function check(b) {
      for (var i = 0; i < WINS.length; i++) {
        var w = WINS[i];
        if (b[w[0]] && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return b[w[0]];
      }
      return b.indexOf('') === -1 ? 'draw' : null;
    }

    function minimax(b, isMax, alpha, beta) {
      var res = check(b);
      if (res === 'O') return 10;
      if (res === 'X') return -10;
      if (res === 'draw') return 0;

      if (isMax) {
        var best = -Infinity;
        for (var i = 0; i < 9; i++) {
          if (b[i] !== '') continue;
          b[i] = 'O';
          var val = minimax(b, false, alpha, beta);
          b[i] = '';
          best = Math.max(best, val);
          alpha = Math.max(alpha, val);
          if (beta <= alpha) break;
        }
        return best;
      } else {
        var best2 = Infinity;
        for (var j = 0; j < 9; j++) {
          if (b[j] !== '') continue;
          b[j] = 'X';
          var val2 = minimax(b, true, alpha, beta);
          b[j] = '';
          best2 = Math.min(best2, val2);
          beta = Math.min(beta, val2);
          if (beta <= alpha) break;
        }
        return best2;
      }
    }

    function botMove() {
      // the bot slips ~15% of the time so it can actually be beaten
      var empt = [];
      for (var e2 = 0; e2 < 9; e2++) if (board[e2] === '') empt.push(e2);
      if (empt.length > 1 && Math.random() < 0.15) { play(pick(empt)); return; }
      var bestScore = -Infinity, bestIdx = -1;
      for (var i = 0; i < 9; i++) {
        if (board[i] !== '') continue;
        board[i] = 'O';
        var sc = minimax(board, false, -Infinity, Infinity);
        board[i] = '';
        if (sc > bestScore) { bestScore = sc; bestIdx = i; }
      }
      if (bestIdx >= 0) play(bestIdx);
    }

    function play(idx) {
      board[idx] = turn;
      cells[idx].textContent = turn;
      cells[idx].className = 'ttt-cell ' + (turn === 'X' ? 'x' : 'o');
      sfx('click');

      var res = check(board);
      if (res) {
        over = true;
        if (res === 'X') {
          msg.textContent = t('core.youWin'); sfx('win');
          var w = (getBest('ttt') || 0) + 1;
          setBest('ttt', w); award(5);
          st.set('wins', w);
        } else if (res === 'O') {
          msg.textContent = t('core.botWins'); sfx('lose');
          st.set('losses', S.get('ttt_losses', 0) + 1);
          S.set('ttt_losses', S.get('ttt_losses', 0) + 1);
        } else {
          msg.textContent = W.draw; sfx('tick');
          st.set('draws', S.get('ttt_draws', 0) + 1);
          S.set('ttt_draws', S.get('ttt_draws', 0) + 1);
        }
        return;
      }

      turn = turn === 'X' ? 'O' : 'X';
      if (turn === 'O') {
        msg.textContent = t('core.botTurn');
        after(botMove, 400);
      } else {
        msg.textContent = t('core.yourTurn');
      }
    }

    function reset() {
      board = ['','','','','','','','',''];
      turn = 'X'; over = false;
      msg.textContent = t('core.yourTurn');
      cells.forEach(function (c) { c.textContent = ''; c.className = 'ttt-cell'; });
      st.set('wins', getBest('ttt') || 0);
      st.set('draws', S.get('ttt_draws', 0));
      st.set('losses', S.get('ttt_losses', 0));
    }
    reset();
  } });
})();

/* ================= CONNECT 4 ================= */
(function () {
  var STR = {
    en: { t: 'Connect 4', d: 'Drop discs — connect four in a row to win!', col: 'Column' },
    tr: { t: 'Dörtlü Bağla', d: 'Jeton bırak — dört aynıyı sıralayan kazanır!', col: 'Sütun' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'connect4', icon: '🔴', cat: 'board', unit: 'wins', str: STR, init: function (root) {
    var COLS = 7, ROWS = 6;
    var C_BG = '#150F28', C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_TXT = '#F5F0FF',
        C_DIM = '#B8AEDB', C_SURF = '#2E2454', C_BLUE = '#6FA8DC';
    var CELL = 48, PAD = 8;
    var WI = COLS * CELL + PAD * 2, HE = (ROWS + 1) * CELL + PAD * 2;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['wins', t('core.wins')], ['losses', t('core.losses')], ['draws', t('core.draws')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var rowEl = el('div', 'row'); rowEl.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(rowEl);

    var board, turn, over, hoverCol, animating;

    function reset() {
      board = [];
      for (var r = 0; r < ROWS; r++) {
        board.push([]);
        for (var cc = 0; cc < COLS; cc++) board[r].push(0);
      }
      turn = 1; over = false; hoverCol = -1; animating = false;
      msg.textContent = t('core.yourTurn');
      st.set('wins', getBest('connect4') || 0);
      st.set('losses', S.get('c4_losses', 0));
      st.set('draws', S.get('c4_draws', 0));
    }

    function drop(col) {
      for (var r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === 0) { board[r][col] = turn; return r; }
      }
      return -1;
    }

    function undrop(col) {
      for (var r = 0; r < ROWS; r++) {
        if (board[r][col] !== 0) { board[r][col] = 0; return; }
      }
    }

    function checkWin(b, p) {
      for (var r = 0; r < ROWS; r++) for (var c2 = 0; c2 < COLS; c2++) {
        if (c2 + 3 < COLS && b[r][c2] === p && b[r][c2+1] === p && b[r][c2+2] === p && b[r][c2+3] === p) return true;
        if (r + 3 < ROWS && b[r][c2] === p && b[r+1][c2] === p && b[r+2][c2] === p && b[r+3][c2] === p) return true;
        if (r + 3 < ROWS && c2 + 3 < COLS && b[r][c2] === p && b[r+1][c2+1] === p && b[r+2][c2+2] === p && b[r+3][c2+3] === p) return true;
        if (r + 3 < ROWS && c2 - 3 >= 0 && b[r][c2] === p && b[r+1][c2-1] === p && b[r+2][c2-2] === p && b[r+3][c2-3] === p) return true;
      }
      return false;
    }

    function isFull() {
      for (var c2 = 0; c2 < COLS; c2++) if (board[0][c2] === 0) return false;
      return true;
    }

    function evaluate(b) {
      if (checkWin(b, 2)) return 10000;
      if (checkWin(b, 1)) return -10000;
      var score = 0;
      // Prefer center column
      for (var r = 0; r < ROWS; r++) {
        if (b[r][3] === 2) score += 3;
        else if (b[r][3] === 1) score -= 3;
      }
      return score;
    }

    function alphaBeta(depth, alpha, beta, maximizing) {
      if (checkWin(board, 2)) return 10000 + depth;
      if (checkWin(board, 1)) return -10000 - depth;
      if (isFull() || depth === 0) return evaluate(board);

      var validCols = [];
      for (var c2 = 0; c2 < COLS; c2++) if (board[0][c2] === 0) validCols.push(c2);
      // Search center first
      validCols.sort(function (a, b2) { return Math.abs(3 - a) - Math.abs(3 - b2); });

      if (maximizing) {
        var val = -Infinity;
        for (var i = 0; i < validCols.length; i++) {
          var col = validCols[i];
          drop(col); turn = 2;
          var child = alphaBeta(depth - 1, alpha, beta, false);
          undrop(col); turn = 2;
          val = Math.max(val, child);
          alpha = Math.max(alpha, val);
          if (alpha >= beta) break;
        }
        return val;
      } else {
        var val2 = Infinity;
        for (var j = 0; j < validCols.length; j++) {
          var col2 = validCols[j];
          drop(col2); turn = 1;
          var child2 = alphaBeta(depth - 1, alpha, beta, true);
          undrop(col2); turn = 1;
          val2 = Math.min(val2, child2);
          beta = Math.min(beta, val2);
          if (alpha >= beta) break;
        }
        return val2;
      }
    }

    function botMove() {
      var bestScore = -Infinity, bestCol = 3;
      var validCols = [];
      for (var c2 = 0; c2 < COLS; c2++) if (board[0][c2] === 0) validCols.push(c2);
      validCols.sort(function (a, b2) { return Math.abs(3 - a) - Math.abs(3 - b2); });

      for (var i = 0; i < validCols.length; i++) {
        var col = validCols[i];
        turn = 2;
        drop(col);
        var sc = alphaBeta(5, -Infinity, Infinity, false);
        undrop(col);
        if (sc > bestScore) { bestScore = sc; bestCol = col; }
      }
      turn = 2;
      doPlay(bestCol);
    }

    function doPlay(col) {
      var row2 = drop(col);
      if (row2 < 0) return;
      sfx('click');
      animating = false;

      if (checkWin(board, turn)) {
        over = true;
        if (turn === 1) {
          msg.textContent = t('core.youWin'); sfx('win');
          var w = (getBest('connect4') || 0) + 1;
          setBest('connect4', w); award(8);
          st.set('wins', w);
        } else {
          msg.textContent = t('core.botWins'); sfx('lose');
          S.set('c4_losses', S.get('c4_losses', 0) + 1);
          st.set('losses', S.get('c4_losses', 0));
        }
        return;
      }
      if (isFull()) {
        over = true;
        msg.textContent = t('core.draw'); sfx('tick');
        S.set('c4_draws', S.get('c4_draws', 0) + 1);
        st.set('draws', S.get('c4_draws', 0));
        return;
      }
      turn = turn === 1 ? 2 : 1;
      if (turn === 2) {
        msg.textContent = t('core.botTurn');
        animating = true;
        after(function () { botMove(); }, 400);
      } else {
        msg.textContent = t('core.yourTurn');
      }
    }

    c.cv.addEventListener('pointermove', function (e) {
      var pos = canvasPos(c.cv, WI, HE, e);
      hoverCol = Math.floor((pos.x - PAD) / CELL);
      if (hoverCol < 0 || hoverCol >= COLS) hoverCol = -1;
    });
    c.cv.addEventListener('pointerdown', function (e) {
      if (over) { reset(); return; }
      if (turn !== 1 || animating) return;
      var pos = canvasPos(c.cv, WI, HE, e);
      var col = Math.floor((pos.x - PAD) / CELL);
      if (col < 0 || col >= COLS || board[0][col] !== 0) return;
      doPlay(col);
    });

    loop(function () {
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);
      // Board background
      ctx.fillStyle = C_SURF;
      ctx.beginPath();
      ctx.roundRect(PAD - 4, CELL + PAD - 4, COLS * CELL + 8, ROWS * CELL + 8, 10);
      ctx.fill();

      // Hover preview
      if (!over && turn === 1 && hoverCol >= 0 && hoverCol < COLS && board[0][hoverCol] === 0) {
        ctx.fillStyle = 'rgba(242,169,59,0.4)';
        ctx.beginPath();
        ctx.arc(PAD + hoverCol * CELL + CELL / 2, CELL / 2 + PAD / 2, CELL / 2 - 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cells
      for (var r = 0; r < ROWS; r++) for (var cc = 0; cc < COLS; cc++) {
        var cx = PAD + cc * CELL + CELL / 2;
        var cy = CELL + PAD + r * CELL + CELL / 2;
        ctx.fillStyle = C_BG;
        ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 4, 0, Math.PI * 2); ctx.fill();
        if (board[r][cc] === 1) {
          ctx.fillStyle = C_ACC;
          ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 6, 0, Math.PI * 2); ctx.fill();
        } else if (board[r][cc] === 2) {
          ctx.fillStyle = C_PINK;
          ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
    reset();
  } });
})();

/* ================= DOTS AND BOXES ================= */
(function () {
  var STR = {
    en: { t: 'Dots & Boxes', d: 'Draw lines, close boxes. Most boxes wins!', you: 'You', bot: 'Bot' },
    tr: { t: 'Nokta ve Kutu', d: 'Çizgiler çiz, kutuları kapat. Çok kutu alan kazanır!', you: 'Sen', bot: 'Bot' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'dotsboxes', icon: '🔲', cat: 'board', unit: 'wins', str: STR, init: function (root) {
    var N = 5; // 5x5 dots = 4x4 boxes
    var BOXES = N - 1;
    var C_BG = '#150F28', C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_TXT = '#F5F0FF',
        C_DIM = '#B8AEDB', C_SURF = '#2E2454', C_GRN = '#6FCF97';
    var DOT = 8, GAP = 50, PAD = 24;
    var SZ = PAD * 2 + (N - 1) * GAP;
    var c = makeCanvas(SZ, SZ), ctx = c.ctx;
    var st = stats([['you', W.you], ['bot', W.bot], ['wins', t('core.wins')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var rowEl = el('div', 'row'); rowEl.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(rowEl);

    // hLines[r][c] = drawn? (r: 0..N-1, c: 0..N-2)
    // vLines[r][c] = drawn? (r: 0..N-2, c: 0..N-1)
    var hLines, vLines, boxOwner, scores, turn, over, thinking;

    function reset() {
      hLines = []; vLines = []; boxOwner = [];
      for (var r = 0; r < N; r++) {
        hLines.push([]);
        for (var cc = 0; cc < N - 1; cc++) hLines[r].push(false);
      }
      for (var r2 = 0; r2 < N - 1; r2++) {
        vLines.push([]);
        boxOwner.push([]);
        for (var cc2 = 0; cc2 < N; cc2++) vLines[r2].push(false);
        for (var cc3 = 0; cc3 < N - 1; cc3++) boxOwner[r2].push(0);
      }
      scores = [0, 0]; turn = 1; over = false; thinking = false;
      msg.textContent = t('core.yourTurn');
      st.set('you', 0); st.set('bot', 0);
      st.set('wins', getBest('dotsboxes') || 0);
    }

    function dotPos(r2, cc2) {
      return { x: PAD + cc2 * GAP, y: PAD + r2 * GAP };
    }

    function countSides(r2, cc2) {
      var cnt = 0;
      if (hLines[r2][cc2]) cnt++;         // top
      if (hLines[r2 + 1][cc2]) cnt++;     // bottom
      if (vLines[r2][cc2]) cnt++;         // left
      if (vLines[r2][cc2 + 1]) cnt++;     // right
      return cnt;
    }

    function tryComplete(player) {
      var completed = 0;
      for (var r2 = 0; r2 < BOXES; r2++) for (var cc2 = 0; cc2 < BOXES; cc2++) {
        if (boxOwner[r2][cc2] === 0 && countSides(r2, cc2) === 4) {
          boxOwner[r2][cc2] = player;
          scores[player - 1]++;
          completed++;
        }
      }
      return completed;
    }

    function drawLine(type, r2, cc2, player) {
      if (type === 'h') {
        if (hLines[r2][cc2]) return false;
        hLines[r2][cc2] = true;
      } else {
        if (vLines[r2][cc2]) return false;
        vLines[r2][cc2] = true;
      }
      sfx('click');
      var completed = tryComplete(player);
      st.set('you', scores[0]);
      st.set('bot', scores[1]);

      // Check game over
      var totalBoxes = BOXES * BOXES;
      var claimed = scores[0] + scores[1];
      if (claimed === totalBoxes) {
        over = true;
        if (scores[0] > scores[1]) {
          msg.textContent = t('core.youWin'); sfx('win');
          var w = (getBest('dotsboxes') || 0) + 1;
          setBest('dotsboxes', w); award(6);
          st.set('wins', w);
        } else if (scores[1] > scores[0]) {
          msg.textContent = t('core.botWins'); sfx('lose');
        } else {
          msg.textContent = t('core.draw'); sfx('tick');
        }
        return true;
      }

      if (completed > 0) return true; // same player goes again
      return false; // switch turn
    }

    function getAllMoves() {
      var moves = [];
      for (var r2 = 0; r2 < N; r2++) for (var cc2 = 0; cc2 < N - 1; cc2++) {
        if (!hLines[r2][cc2]) moves.push({ type: 'h', r: r2, c: cc2 });
      }
      for (var r3 = 0; r3 < N - 1; r3++) for (var cc3 = 0; cc3 < N; cc3++) {
        if (!vLines[r3][cc3]) moves.push({ type: 'v', r: r3, c: cc3 });
      }
      return moves;
    }

    function moveSideCount(m) {
      // For each box this line touches, how many sides does it already have?
      var results = [];
      if (m.type === 'h') {
        // Top of box (m.r, m.c) if m.r < BOXES
        if (m.r < BOXES && m.c < BOXES && boxOwner[m.r][m.c] === 0) results.push(countSides(m.r, m.c));
        // Bottom of box (m.r-1, m.c) if m.r > 0
        if (m.r > 0 && m.c < BOXES && boxOwner[m.r - 1][m.c] === 0) results.push(countSides(m.r - 1, m.c));
      } else {
        // Left of box (m.r, m.c) if m.c < BOXES
        if (m.r < BOXES && m.c < BOXES && boxOwner[m.r][m.c] === 0) results.push(countSides(m.r, m.c));
        // Right of box (m.r, m.c-1) if m.c > 0
        if (m.r < BOXES && m.c > 0 && boxOwner[m.r][m.c - 1] === 0) results.push(countSides(m.r, m.c - 1));
      }
      return results;
    }

    function botMove() {
      thinking = false;
      if (over) return;
      var moves = getAllMoves();
      if (moves.length === 0) return;

      // 1. Complete any box with 3 sides
      var completing = [];
      var safe = [];       // moves that don't give opponent a 3-side
      var risky = [];      // moves that create a 3-side box

      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        var sides = moveSideCount(m);
        var completes = false, creates3 = false;
        for (var j = 0; j < sides.length; j++) {
          if (sides[j] === 3) completes = true;
          if (sides[j] === 2) creates3 = true;
        }
        if (completes) completing.push(m);
        else if (!creates3) safe.push(m);
        else risky.push(m);
      }

      var chosen;
      if (completing.length > 0) chosen = completing[0];
      else if (safe.length > 0) chosen = pick(safe);
      else chosen = risky[0]; // least bad

      var sameTurn = drawLine(chosen.type, chosen.r, chosen.c, 2);
      if (!over) {
        if (sameTurn) {
          thinking = true;
          after(botMove, 350);
        } else {
          turn = 1;
          msg.textContent = t('core.yourTurn');
        }
      }
    }

    // Hit detection
    function findLine(px, py) {
      // Check horizontal lines
      for (var r2 = 0; r2 < N; r2++) for (var cc2 = 0; cc2 < N - 1; cc2++) {
        if (hLines[r2][cc2]) continue;
        var d1 = dotPos(r2, cc2), d2 = dotPos(r2, cc2 + 1);
        var mx = (d1.x + d2.x) / 2, my = d1.y;
        if (Math.abs(px - mx) < GAP / 2 - 4 && Math.abs(py - my) < 12) return { type: 'h', r: r2, c: cc2 };
      }
      // Check vertical lines
      for (var r3 = 0; r3 < N - 1; r3++) for (var cc3 = 0; cc3 < N; cc3++) {
        if (vLines[r3][cc3]) continue;
        var d3 = dotPos(r3, cc3), d4 = dotPos(r3 + 1, cc3);
        var mx2 = d3.x, my2 = (d3.y + d4.y) / 2;
        if (Math.abs(px - mx2) < 12 && Math.abs(py - my2) < GAP / 2 - 4) return { type: 'v', r: r3, c: cc3 };
      }
      return null;
    }

    c.cv.addEventListener('pointerdown', function (e) {
      if (over) { reset(); return; }
      if (turn !== 1 || thinking) return;
      var pos = canvasPos(c.cv, SZ, SZ, e);
      var line = findLine(pos.x, pos.y);
      if (!line) return;
      var sameTurn = drawLine(line.type, line.r, line.c, 1);
      if (!over && !sameTurn) {
        turn = 2;
        msg.textContent = t('core.botTurn');
        thinking = true;
        after(botMove, 500);
      } else if (!over && sameTurn) {
        msg.textContent = t('core.yourTurn');
      }
    });

    loop(function () {
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, SZ, SZ);

      // Draw boxes
      for (var r2 = 0; r2 < BOXES; r2++) for (var cc2 = 0; cc2 < BOXES; cc2++) {
        if (boxOwner[r2][cc2] !== 0) {
          var dp = dotPos(r2, cc2);
          ctx.fillStyle = boxOwner[r2][cc2] === 1 ? 'rgba(111,207,151,0.25)' : 'rgba(255,111,145,0.25)';
          ctx.fillRect(dp.x + 2, dp.y + 2, GAP - 4, GAP - 4);
          ctx.fillStyle = boxOwner[r2][cc2] === 1 ? C_GRN : C_PINK;
          ctx.font = '700 14px "Baloo 2", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(boxOwner[r2][cc2] === 1 ? W.you : W.bot, dp.x + GAP / 2, dp.y + GAP / 2 + 5);
          ctx.textAlign = 'left';
        }
      }

      // Draw horizontal lines
      for (var r3 = 0; r3 < N; r3++) for (var cc3 = 0; cc3 < N - 1; cc3++) {
        var a = dotPos(r3, cc3), b = dotPos(r3, cc3 + 1);
        ctx.strokeStyle = hLines[r3][cc3] ? C_ACC : 'rgba(184,174,219,0.18)';
        ctx.lineWidth = hLines[r3][cc3] ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // Draw vertical lines
      for (var r4 = 0; r4 < N - 1; r4++) for (var cc4 = 0; cc4 < N; cc4++) {
        var a2 = dotPos(r4, cc4), b2 = dotPos(r4 + 1, cc4);
        ctx.strokeStyle = vLines[r4][cc4] ? C_ACC : 'rgba(184,174,219,0.18)';
        ctx.lineWidth = vLines[r4][cc4] ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(a2.x, a2.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
      }

      // Draw dots
      for (var r5 = 0; r5 < N; r5++) for (var cc5 = 0; cc5 < N; cc5++) {
        var dp2 = dotPos(r5, cc5);
        ctx.fillStyle = C_TXT;
        ctx.beginPath(); ctx.arc(dp2.x, dp2.y, DOT / 2, 0, Math.PI * 2); ctx.fill();
      }
    });
    reset();
  } });
})();

/* ================= NIM ================= */
(function () {
  var STR = {
    en: { t: 'Nim', d: 'Take 1–3 from a pile. Don\'t take the last one!', pile: 'Pile', take: 'Take' },
    tr: { t: 'Nim', d: '1–3 obje al, son objeyi alan kaybeder!', pile: 'Yığın', take: 'Al' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'nim', icon: '🪨', cat: 'board', unit: 'wins', str: STR, init: function (root) {
    var st = stats([['wins', t('core.wins')], ['losses', t('core.losses')]]);
    root.appendChild(st.el);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var piles, turn, over, selectedPile;

    var boardEl = el('div', '');
    boardEl.style.cssText = 'display:flex;flex-direction:column;gap:16px;align-items:center;margin:16px 0;';
    root.appendChild(boardEl);

    var controlsEl = el('div', 'row');
    root.appendChild(controlsEl);

    var rowEl = el('div', 'row');
    rowEl.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(rowEl);

    function reset() {
      piles = [3, 5, 7];
      turn = 1; over = false; selectedPile = -1;
      msg.textContent = t('core.yourTurn');
      st.set('wins', getBest('nim') || 0);
      st.set('losses', S.get('nim_losses', 0));
      render();
    }

    function render() {
      boardEl.innerHTML = '';
      controlsEl.innerHTML = '';

      for (var p = 0; p < piles.length; p++) (function (pi) {
        var pileRow = el('div', '');
        pileRow.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;';
        var label = el('span', '');
        label.style.cssText = 'font-family:var(--font-mono);font-size:12px;color:var(--text-dim);width:50px;text-align:right;margin-right:6px;';
        label.textContent = W.pile + ' ' + (pi + 1) + ':';
        pileRow.appendChild(label);
        for (var j = 0; j < piles[pi]; j++) {
          var stone = el('span', '');
          stone.style.cssText = 'display:inline-block;width:28px;height:28px;border-radius:50%;' +
            'background:' + ['#F2A93B', '#FF6F91', '#6FA8DC'][pi] + ';' +
            'border:2px solid rgba(255,255,255,0.15);cursor:pointer;';
          if (selectedPile === pi) stone.style.boxShadow = '0 0 8px rgba(242,169,59,0.7)';
          stone.onclick = (function () {
            if (over || turn !== 1) return;
            selectedPile = pi;
            render();
          });
          pileRow.appendChild(stone);
        }
        if (piles[pi] === 0) {
          var empty = el('span', '');
          empty.style.cssText = 'color:var(--text-dim);font-size:13px;font-style:italic;';
          empty.textContent = '—';
          pileRow.appendChild(empty);
        }
        boardEl.appendChild(pileRow);
      })(p);

      // Take buttons
      if (!over && turn === 1 && selectedPile >= 0) {
        var maxTake = Math.min(3, piles[selectedPile]);
        for (var n = 1; n <= maxTake; n++) (function (amt) {
          controlsEl.appendChild(btn(W.take + ' ' + amt, function () {
            playerTake(selectedPile, amt);
          }));
        })(n);
      }
    }

    function checkLoss(player) {
      // If all piles are 0, the player who just took the last one loses
      var total = 0;
      for (var i = 0; i < piles.length; i++) total += piles[i];
      return total === 0;
    }

    function playerTake(pile, amt) {
      piles[pile] -= amt;
      sfx('click');
      selectedPile = -1;

      if (checkLoss()) {
        // Player took the last = player loses
        over = true;
        msg.textContent = t('core.youLose'); sfx('lose');
        S.set('nim_losses', S.get('nim_losses', 0) + 1);
        st.set('losses', S.get('nim_losses', 0));
        render();
        return;
      }

      turn = 2;
      msg.textContent = t('core.botTurn');
      render();
      after(botMove, 500);
    }

    function botMove() {
      if (over) return;
      // Nim optimal strategy: XOR of all piles
      var nimSum = 0;
      for (var i = 0; i < piles.length; i++) nimSum ^= piles[i];

      var moved = false;
      if (nimSum !== 0) {
        // Find a pile where we can make nimSum become 0
        for (var i2 = 0; i2 < piles.length; i2++) {
          var target = piles[i2] ^ nimSum;
          if (target < piles[i2]) {
            var take = piles[i2] - target;
            // Avoid taking the very last stone if possible
            // Check if this would leave all piles at 0
            if (take <= 3) {
              // Check if leaving 1 total is possible when losing position
              var totalAfter = 0;
              for (var k = 0; k < piles.length; k++) totalAfter += (k === i2 ? target : piles[k]);
              if (totalAfter === 0) {
                // We'd take the last — try to leave at least 1
                if (take > 1) { take--; piles[i2] -= take; moved = true; break; }
                // Must take 1, but that's the last stone — we lose, but have no choice
              }
              piles[i2] -= take;
              moved = true;
              break;
            }
          }
        }
      }

      if (!moved) {
        // Random safe move: take 1 from the largest pile
        var largest = 0;
        for (var j = 1; j < piles.length; j++) {
          if (piles[j] > piles[largest]) largest = j;
        }
        if (piles[largest] > 0) {
          piles[largest] -= 1;
        }
      }

      sfx('click');

      if (checkLoss()) {
        // Bot took the last = bot loses
        over = true;
        msg.textContent = t('core.youWin'); sfx('win');
        var w = (getBest('nim') || 0) + 1;
        setBest('nim', w); award(5);
        st.set('wins', w);
        render();
        return;
      }

      turn = 1;
      msg.textContent = t('core.yourTurn');
      render();
    }

    reset();
  } });
})();

/* ================= BATTLESHIP ================= */
(function () {
  var STR = {
    en: {
      t: 'Battleship', d: 'Place ships, then hunt the enemy fleet. 8×8.',
      place: 'Click to place ships. R = rotate.',
      fire: 'Click enemy grid to fire!',
      hit: 'Hit!', miss: 'Miss.', sunk: 'Sunk!',
      horizontal: '↔ Rotate', allPlaced: 'All ships placed!',
      yourFleet: 'Your Fleet', enemy: 'Enemy Waters'
    },
    tr: {
      t: 'Amiral Battı', d: 'Gemileri yerleştir, düşman filosunu bul. 8×8.',
      place: 'Gemi yerleştirmek için tıkla. R = döndür.',
      fire: 'Ateş etmek için düşman ızgarasına tıkla!',
      hit: 'İsabet!', miss: 'Iska.', sunk: 'Battı!',
      horizontal: '↔ Döndür', allPlaced: 'Tüm gemiler yerleşti!',
      yourFleet: 'Filonuz', enemy: 'Düşman Suları'
    }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'battleship', icon: '🚢', cat: 'board', unit: 'wins', str: STR, init: function (root) {
    var GS = 8, SHIPS = [4, 3, 3, 2];
    var C_BG = '#150F28', C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_TXT = '#F5F0FF',
        C_DIM = '#B8AEDB', C_SURF = '#2E2454', C_GRN = '#6FCF97', C_BLUE = '#6FA8DC';
    var CELL = 32, PAD = 28, GAP = 24;
    var BOARD_SZ = GS * CELL;
    var WI = PAD + BOARD_SZ + GAP + BOARD_SZ + PAD;
    var HE = PAD + 20 + BOARD_SZ + PAD;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['wins', t('core.wins')], ['losses', t('core.losses')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var controlRow = el('div', 'row');
    var rotateBtn = btn(W.horizontal, function () { placeHoriz = !placeHoriz; });
    controlRow.appendChild(rotateBtn);
    controlRow.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(controlRow);
    root.appendChild(el('div', 'hint-line', 'R = ' + W.horizontal));

    // State
    var playerBoard, enemyBoard, playerShots, enemyShots;
    var playerShips, enemyShips;
    var phase, placeHoriz, placeIdx, over, thinking;
    var botHits, botMode, botDir, botOrigin, botDirIdx;
    var DIRS = [[0,1],[0,-1],[1,0],[-1,0]];

    function makeBoard() {
      var b = [];
      for (var r = 0; r < GS; r++) { b.push([]); for (var cc = 0; cc < GS; cc++) b[r].push(0); }
      return b;
    }

    function canPlace(board, r2, cc2, len, horiz) {
      for (var i = 0; i < len; i++) {
        var rr = horiz ? r2 : r2 + i;
        var ccc = horiz ? cc2 + i : cc2;
        if (rr < 0 || rr >= GS || ccc < 0 || ccc >= GS) return false;
        if (board[rr][ccc] !== 0) return false;
      }
      return true;
    }

    function placeShip(board, r2, cc2, len, horiz, id) {
      var cells = [];
      for (var i = 0; i < len; i++) {
        var rr = horiz ? r2 : r2 + i;
        var ccc = horiz ? cc2 + i : cc2;
        board[rr][ccc] = id;
        cells.push([rr, ccc]);
      }
      return cells;
    }

    function autoPlace(board) {
      var ships = [];
      for (var s = 0; s < SHIPS.length; s++) {
        var placed = false;
        for (var tries = 0; tries < 200; tries++) {
          var horiz = Math.random() < 0.5;
          var r2 = rnd(GS), cc2 = rnd(GS);
          if (canPlace(board, r2, cc2, SHIPS[s], horiz)) {
            ships.push(placeShip(board, r2, cc2, SHIPS[s], horiz, s + 1));
            placed = true;
            break;
          }
        }
        if (!placed) { /* extremely unlikely, just ignore */ }
      }
      return ships;
    }

    function reset() {
      playerBoard = makeBoard();
      enemyBoard = makeBoard();
      playerShots = makeBoard(); // 0=unknown, 1=miss, 2=hit
      enemyShots = makeBoard();
      playerShips = [];
      enemyShips = autoPlace(enemyBoard);
      phase = 'place'; placeHoriz = true; placeIdx = 0;
      over = false; thinking = false;
      botHits = []; botMode = 'hunt'; botDir = null; botOrigin = null; botDirIdx = 0;
      msg.textContent = W.place;
      st.set('wins', getBest('battleship') || 0);
      st.set('losses', S.get('bs_losses', 0));
    }

    function isShipSunk(board, shots, shipId) {
      for (var r2 = 0; r2 < GS; r2++) for (var cc2 = 0; cc2 < GS; cc2++) {
        if (board[r2][cc2] === shipId && shots[r2][cc2] !== 2) return false;
      }
      return true;
    }

    function allSunk(board, shots) {
      for (var r2 = 0; r2 < GS; r2++) for (var cc2 = 0; cc2 < GS; cc2++) {
        if (board[r2][cc2] !== 0 && shots[r2][cc2] !== 2) return false;
      }
      return true;
    }

    function playerFire(r2, cc2) {
      if (playerShots[r2][cc2] !== 0) return;
      if (enemyBoard[r2][cc2] !== 0) {
        playerShots[r2][cc2] = 2; sfx('pop');
        var sid = enemyBoard[r2][cc2];
        if (isShipSunk(enemyBoard, playerShots, sid)) {
          msg.textContent = W.sunk;
        } else {
          msg.textContent = W.hit;
        }
      } else {
        playerShots[r2][cc2] = 1; sfx('tick');
        msg.textContent = W.miss;
      }

      if (allSunk(enemyBoard, playerShots)) {
        over = true;
        msg.textContent = t('core.youWin'); sfx('win');
        var w = (getBest('battleship') || 0) + 1;
        setBest('battleship', w); award(8);
        st.set('wins', w);
        return;
      }

      // Bot's turn
      thinking = true;
      after(botFire, 600);
    }

    function botFire() {
      thinking = false;
      if (over) return;
      var r2, cc2;

      if (botMode === 'target' && botHits.length > 0) {
        var found = false;
        while (botDirIdx < DIRS.length && !found) {
          var d = DIRS[botDirIdx];
          var last = botOrigin;
          r2 = last[0] + d[0]; cc2 = last[1] + d[1];
          if (r2 >= 0 && r2 < GS && cc2 >= 0 && cc2 < GS && enemyShots[r2][cc2] === 0) {
            found = true;
          } else {
            botDirIdx++;
          }
        }
        if (!found) {
          botMode = 'hunt';
          botHits = [];
        }
      }

      if (botMode === 'hunt') {
        var choices = [];
        for (var i = 0; i < GS; i++) for (var j = 0; j < GS; j++) {
          if (enemyShots[i][j] === 0) choices.push([i, j]);
        }
        // Checkerboard pattern for efficiency
        var checker = choices.filter(function (p) { return (p[0] + p[1]) % 2 === 0; });
        if (checker.length > 0) choices = checker;
        var ch = pick(choices);
        r2 = ch[0]; cc2 = ch[1];
      }

      if (playerBoard[r2][cc2] !== 0) {
        enemyShots[r2][cc2] = 2;
        botHits.push([r2, cc2]);
        if (botMode === 'hunt') {
          botMode = 'target';
          botOrigin = [r2, cc2];
          botDirIdx = 0;
        }
        // Check if sunk, then go back to hunt
        var sid = playerBoard[r2][cc2];
        if (isShipSunk(playerBoard, enemyShots, sid)) {
          botMode = 'hunt';
          botHits = [];
        }
      } else {
        enemyShots[r2][cc2] = 1;
        if (botMode === 'target') {
          botDirIdx++;
          if (botDirIdx >= DIRS.length) {
            botMode = 'hunt';
            botHits = [];
          }
        }
      }

      if (allSunk(playerBoard, enemyShots)) {
        over = true;
        msg.textContent = t('core.botWins'); sfx('lose');
        S.set('bs_losses', S.get('bs_losses', 0) + 1);
        st.set('losses', S.get('bs_losses', 0));
        return;
      }

      msg.textContent = W.fire;
    }

    addKey(function (e) {
      if (e.key === 'r' || e.key === 'R') { placeHoriz = !placeHoriz; }
    });

    c.cv.addEventListener('pointerdown', function (e) {
      if (over) { reset(); return; }
      var pos = canvasPos(c.cv, WI, HE, e);

      if (phase === 'place') {
        // Player board area
        var bx = pos.x - PAD, by = pos.y - (PAD + 20);
        if (bx < 0 || bx >= BOARD_SZ || by < 0 || by >= BOARD_SZ) return;
        var rr = Math.floor(by / CELL), ccc = Math.floor(bx / CELL);
        var len = SHIPS[placeIdx];
        if (!canPlace(playerBoard, rr, ccc, len, placeHoriz)) return;
        playerShips.push(placeShip(playerBoard, rr, ccc, len, placeHoriz, placeIdx + 1));
        sfx('click');
        placeIdx++;
        if (placeIdx >= SHIPS.length) {
          phase = 'play';
          msg.textContent = W.fire;
        } else {
          msg.textContent = W.place + ' (' + SHIPS[placeIdx] + ')';
        }
        return;
      }

      if (phase === 'play' && !thinking) {
        // Enemy board area
        var ex = pos.x - (PAD + BOARD_SZ + GAP), ey = pos.y - (PAD + 20);
        if (ex < 0 || ex >= BOARD_SZ || ey < 0 || ey >= BOARD_SZ) return;
        var er = Math.floor(ey / CELL), ec = Math.floor(ex / CELL);
        playerFire(er, ec);
      }
    });

    loop(function () {
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // Labels
      ctx.fillStyle = C_DIM; ctx.font = '11px "JetBrains Mono", monospace'; ctx.textAlign = 'center';
      ctx.fillText(W.yourFleet, PAD + BOARD_SZ / 2, PAD + 12);
      ctx.fillText(W.enemy, PAD + BOARD_SZ + GAP + BOARD_SZ / 2, PAD + 12);
      ctx.textAlign = 'left';

      var yOff = PAD + 20;

      // Player board
      for (var r2 = 0; r2 < GS; r2++) for (var cc2 = 0; cc2 < GS; cc2++) {
        var px = PAD + cc2 * CELL, py = yOff + r2 * CELL;
        ctx.fillStyle = C_SURF;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
        if (playerBoard[r2][cc2] !== 0) {
          ctx.fillStyle = C_BLUE;
          ctx.fillRect(px + 3, py + 3, CELL - 6, CELL - 6);
        }
        if (enemyShots[r2][cc2] === 2) {
          ctx.fillStyle = C_PINK;
          ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, 6, 0, Math.PI * 2); ctx.fill();
        } else if (enemyShots[r2][cc2] === 1) {
          ctx.fillStyle = C_DIM;
          ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Enemy board
      var eOff = PAD + BOARD_SZ + GAP;
      for (var r3 = 0; r3 < GS; r3++) for (var cc3 = 0; cc3 < GS; cc3++) {
        var px2 = eOff + cc3 * CELL, py2 = yOff + r3 * CELL;
        ctx.fillStyle = C_SURF;
        ctx.fillRect(px2 + 1, py2 + 1, CELL - 2, CELL - 2);
        if (playerShots[r3][cc3] === 2) {
          ctx.fillStyle = C_PINK;
          ctx.beginPath(); ctx.arc(px2 + CELL / 2, py2 + CELL / 2, 6, 0, Math.PI * 2); ctx.fill();
          // Show sunk ship
          if (over || isShipSunk(enemyBoard, playerShots, enemyBoard[r3][cc3])) {
            ctx.fillStyle = 'rgba(255,111,145,0.3)';
            ctx.fillRect(px2 + 3, py2 + 3, CELL - 6, CELL - 6);
          }
        } else if (playerShots[r3][cc3] === 1) {
          ctx.fillStyle = C_DIM;
          ctx.beginPath(); ctx.arc(px2 + CELL / 2, py2 + CELL / 2, 3, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Show enemy ships when game over
      if (over) {
        for (var r4 = 0; r4 < GS; r4++) for (var cc4 = 0; cc4 < GS; cc4++) {
          if (enemyBoard[r4][cc4] !== 0 && playerShots[r4][cc4] === 0) {
            var px3 = eOff + cc4 * CELL, py3 = yOff + r4 * CELL;
            ctx.fillStyle = 'rgba(111,168,220,0.4)';
            ctx.fillRect(px3 + 3, py3 + 3, CELL - 6, CELL - 6);
          }
        }
      }

      // Placement preview
      if (phase === 'place' && placeIdx < SHIPS.length) {
        ctx.fillStyle = C_DIM; ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        var info = W.place + ' [' + SHIPS[placeIdx] + ']';
        ctx.fillText(info, PAD + BOARD_SZ / 2, yOff + BOARD_SZ + 16);
        ctx.textAlign = 'left';
      }
    });
    reset();
  } });
})();

/* ================= REVERSI ================= */
(function () {
  var STR = {
    en: { t: 'Reversi', d: 'Flip your way to domination on the 8×8 board.', black: 'You (⚫)', white: 'Bot (⚪)', pass: 'No moves — passing' },
    tr: { t: 'Reversi', d: '8×8 tahtada taşları çevirerek domine et.', black: 'Sen (⚫)', white: 'Bot (⚪)', pass: 'Hamle yok — pas geçiliyor' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'reversi', icon: '⚫', cat: 'board', unit: 'wins', str: STR, init: function (root) {
    var GS = 8;
    var C_BG = '#150F28', C_ACC = '#F2A93B', C_TXT = '#F5F0FF',
        C_DIM = '#B8AEDB', C_GRN = '#6FCF97';
    var CELL = 42, PAD = 8;
    var SZ = PAD * 2 + GS * CELL;
    var c = makeCanvas(SZ, SZ), ctx = c.ctx;
    var st = stats([['black', W.black], ['white', W.white], ['wins', t('core.wins')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var rowEl = el('div', 'row'); rowEl.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(rowEl);

    var board, turn, over, thinking;
    var DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    // Positional weights for AI
    var WEIGHTS = [
      [120,-20, 20,  5,  5, 20,-20,120],
      [-20,-40, -5, -5, -5, -5,-40,-20],
      [ 20, -5, 15,  3,  3, 15, -5, 20],
      [  5, -5,  3,  3,  3,  3, -5,  5],
      [  5, -5,  3,  3,  3,  3, -5,  5],
      [ 20, -5, 15,  3,  3, 15, -5, 20],
      [-20,-40, -5, -5, -5, -5,-40,-20],
      [120,-20, 20,  5,  5, 20,-20,120]
    ];

    function reset() {
      board = [];
      for (var r = 0; r < GS; r++) { board.push([]); for (var cc = 0; cc < GS; cc++) board[r].push(0); }
      board[3][3] = 2; board[3][4] = 1; board[4][3] = 1; board[4][4] = 2;
      turn = 1; over = false; thinking = false;
      msg.textContent = t('core.yourTurn');
      st.set('wins', getBest('reversi') || 0);
      updateCount();
    }

    function updateCount() {
      var b = 0, w = 0;
      for (var r = 0; r < GS; r++) for (var cc = 0; cc < GS; cc++) {
        if (board[r][cc] === 1) b++;
        else if (board[r][cc] === 2) w++;
      }
      st.set('black', b);
      st.set('white', w);
    }

    function getFlips(b, r2, cc2, p) {
      if (b[r2][cc2] !== 0) return [];
      var opp = p === 1 ? 2 : 1;
      var allFlips = [];
      for (var d = 0; d < DIRS.length; d++) {
        var dr = DIRS[d][0], dc = DIRS[d][1];
        var flips = [];
        var rr = r2 + dr, ccc = cc2 + dc;
        while (rr >= 0 && rr < GS && ccc >= 0 && ccc < GS && b[rr][ccc] === opp) {
          flips.push([rr, ccc]);
          rr += dr; ccc += dc;
        }
        if (flips.length > 0 && rr >= 0 && rr < GS && ccc >= 0 && ccc < GS && b[rr][ccc] === p) {
          allFlips = allFlips.concat(flips);
        }
      }
      return allFlips;
    }

    function getValidMoves(b, p) {
      var moves = [];
      for (var r = 0; r < GS; r++) for (var cc = 0; cc < GS; cc++) {
        if (getFlips(b, r, cc, p).length > 0) moves.push([r, cc]);
      }
      return moves;
    }

    function makeMove(b, r2, cc2, p) {
      var flips = getFlips(b, r2, cc2, p);
      b[r2][cc2] = p;
      for (var i = 0; i < flips.length; i++) b[flips[i][0]][flips[i][1]] = p;
      return flips.length;
    }

    function checkEnd() {
      var m1 = getValidMoves(board, 1);
      var m2 = getValidMoves(board, 2);
      if (m1.length === 0 && m2.length === 0) {
        over = true;
        var b = 0, w = 0;
        for (var r = 0; r < GS; r++) for (var cc = 0; cc < GS; cc++) {
          if (board[r][cc] === 1) b++;
          else if (board[r][cc] === 2) w++;
        }
        if (b > w) {
          msg.textContent = t('core.youWin'); sfx('win');
          var wins = (getBest('reversi') || 0) + 1;
          setBest('reversi', wins); award(8);
          st.set('wins', wins);
        } else if (w > b) {
          msg.textContent = t('core.botWins'); sfx('lose');
        } else {
          msg.textContent = t('core.draw'); sfx('tick');
        }
        return true;
      }
      return false;
    }

    function botMove() {
      thinking = false;
      if (over) return;
      var moves = getValidMoves(board, 2);
      if (moves.length === 0) {
        msg.textContent = W.pass;
        turn = 1;
        after(function () {
          if (!over) {
            var pm = getValidMoves(board, 1);
            if (pm.length > 0) msg.textContent = t('core.yourTurn');
            else checkEnd();
          }
        }, 600);
        return;
      }

      // Evaluate moves using positional weights + mobility
      var bestScore = -Infinity, bestMove = moves[0];
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        // Clone board
        var clone = [];
        for (var r = 0; r < GS; r++) clone.push(board[r].slice());
        makeMove(clone, m[0], m[1], 2);

        var score = WEIGHTS[m[0]][m[1]];
        // Count pieces
        var myCount = 0, oppCount = 0;
        for (var r2 = 0; r2 < GS; r2++) for (var cc2 = 0; cc2 < GS; cc2++) {
          if (clone[r2][cc2] === 2) myCount++;
          else if (clone[r2][cc2] === 1) oppCount++;
        }
        // Mobility: reduce opponent's options
        var oppMoves = getValidMoves(clone, 1);
        score -= oppMoves.length * 3;
        // Disc difference late-game
        var total = myCount + oppCount;
        if (total > 48) score += (myCount - oppCount) * 2;

        if (score > bestScore) { bestScore = score; bestMove = m; }
      }

      makeMove(board, bestMove[0], bestMove[1], 2);
      sfx('click');
      updateCount();

      if (checkEnd()) return;
      turn = 1;
      var pm = getValidMoves(board, 1);
      if (pm.length === 0) {
        msg.textContent = W.pass;
        turn = 2;
        thinking = true;
        after(botMove, 500);
      } else {
        msg.textContent = t('core.yourTurn');
      }
    }

    c.cv.addEventListener('pointerdown', function (e) {
      if (over) { reset(); return; }
      if (turn !== 1 || thinking) return;
      var pos = canvasPos(c.cv, SZ, SZ, e);
      var rr = Math.floor((pos.y - PAD) / CELL);
      var ccc = Math.floor((pos.x - PAD) / CELL);
      if (rr < 0 || rr >= GS || ccc < 0 || ccc >= GS) return;
      var flips = getFlips(board, rr, ccc, 1);
      if (flips.length === 0) return;

      makeMove(board, rr, ccc, 1);
      sfx('click');
      updateCount();

      if (checkEnd()) return;
      turn = 2;
      msg.textContent = t('core.botTurn');
      thinking = true;
      after(botMove, 500);
    });

    loop(function () {
      ctx.fillStyle = '#1A4D2E'; ctx.fillRect(0, 0, SZ, SZ);

      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      for (var i = 0; i <= GS; i++) {
        var p = PAD + i * CELL;
        ctx.beginPath(); ctx.moveTo(PAD, p); ctx.lineTo(PAD + GS * CELL, p); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p, PAD); ctx.lineTo(p, PAD + GS * CELL); ctx.stroke();
      }

      // Pieces
      for (var r = 0; r < GS; r++) for (var cc = 0; cc < GS; cc++) {
        var cx = PAD + cc * CELL + CELL / 2;
        var cy = PAD + r * CELL + CELL / 2;
        if (board[r][cc] === 1) {
          ctx.fillStyle = '#1B1533';
          ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 4, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#444';
          ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 4, 0, Math.PI * 2); ctx.stroke();
        } else if (board[r][cc] === 2) {
          ctx.fillStyle = '#F5F0FF';
          ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 4, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#ccc';
          ctx.beginPath(); ctx.arc(cx, cy, CELL / 2 - 4, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // Valid move indicators
      if (!over && turn === 1 && !thinking) {
        var vm = getValidMoves(board, 1);
        for (var v = 0; v < vm.length; v++) {
          var vx = PAD + vm[v][1] * CELL + CELL / 2;
          var vy = PAD + vm[v][0] * CELL + CELL / 2;
          ctx.fillStyle = 'rgba(242,169,59,0.35)';
          ctx.beginPath(); ctx.arc(vx, vy, 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    });
    reset();
  } });
})();

})();
/* end of board pack */
