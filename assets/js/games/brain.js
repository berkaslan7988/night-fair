/* ============================================================
   Night Fair — BRAIN pack (10 games)
   reaction, mathsprint, chimp, visualmem, stroop,
   schulte, digitspan, estimate, missingop, guessnum
   (v1.1 — feedback fixes)
   ============================================================ */
'use strict';
(function () {

/* ================= REACTION ================= */
(function () {
  var STR = {
    en: { t: 'Reaction Time', d: 'Wait for green, then click as fast as you can! 5 rounds.', wait: 'Wait for green…', click: 'Click NOW!', early: 'Too early! Click to retry.', avg: 'Average', round: 'Round', ms: 'ms' },
    tr: { t: 'Tepki Süresi', d: 'Yeşili bekle, sonra hızlıca tıkla! 5 tur.', wait: 'Yeşili bekle…', click: 'Şimdi TIKLA!', early: 'Erken tıkladın! Tekrar dene.', avg: 'Ortalama', round: 'Tur', ms: 'ms' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'reaction', icon: '⚡', cat: 'brain', unit: 'ms', str: STR, init: function (root) {
    var ROUNDS = 5;
    var st = stats([['round', W.round], ['avg', W.avg], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var box = el('div', 'reaction-box');
    root.appendChild(box);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var round, times, phase, greenAt, timerId;
    // phase: 'wait' = red, 'go' = green, 'early' = clicked too early, 'done' = finished

    function reset() {
      round = 0; times = []; phase = 'idle';
      msg.textContent = '';
      st.set('round', '0/' + ROUNDS);
      st.set('avg', '-');
      st.set('best', getBest('reaction') || '-');
      startRound();
    }

    function startRound() {
      phase = 'wait';
      box.style.background = '#C0392B';
      box.textContent = W.wait;
      box.style.color = '#fff';
      var delay = 1500 + Math.random() * 3000;
      timerId = after(function () {
        phase = 'go';
        greenAt = performance.now();
        box.style.background = '#27AE60';
        box.textContent = W.click;
        sfx('pop');
      }, delay);
    }

    box.addEventListener('pointerdown', function () {
      if (phase === 'wait') {
        // clicked too early
        clearTimeout(timerId);
        phase = 'early';
        box.style.background = '#E67E22';
        box.textContent = W.early;
        sfx('bad');
      } else if (phase === 'go') {
        var ms = Math.round(performance.now() - greenAt);
        times.push(ms);
        round++;
        sfx('good');
        box.style.background = '#2980B9';
        box.textContent = ms + ' ' + W.ms;
        st.set('round', round + '/' + ROUNDS);
        var avg = Math.round(times.reduce(function (a, b) { return a + b; }, 0) / times.length);
        st.set('avg', avg + ' ' + W.ms);

        if (round >= ROUNDS) {
          phase = 'done';
          msg.textContent = W.avg + ': ' + avg + ' ' + W.ms;
          sfx('win');
          setBest('reaction', avg, true);
          award(avg < 300 ? 5 : avg < 400 ? 3 : 1);
          st.set('best', getBest('reaction') || '-');
        } else {
          after(startRound, 1000);
        }
      } else if (phase === 'early') {
        startRound();
      } else if (phase === 'done') {
        reset();
      }
    });

    reset();
  } });
})();

/* ================= MATHSPRINT ================= */
(function () {
  var STR = {
    en: { t: 'Math Sprint', d: '60 seconds of mental math. How many can you solve?', time: 'Time', correct: 'Correct' },
    tr: { t: 'Matematik Koşusu', d: '60 saniyede kaç soru çözersin?', time: 'Süre', correct: 'Doğru' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'mathsprint', icon: '🧮', cat: 'brain', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['time', W.time], ['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var questionEl = el('div', 'game-msg');
    questionEl.style.fontSize = '2em';
    questionEl.style.margin = '18px 0 8px';
    root.appendChild(questionEl);

    var choicesEl = el('div', 'row');
    choicesEl.style.flexWrap = 'wrap';
    choicesEl.style.gap = '8px';
    choicesEl.style.justifyContent = 'center';
    root.appendChild(choicesEl);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var score, timeLeft, running, answer, difficulty, intervalId;

    function genProblem() {
      var ops = ['+', '-', '×'];
      var op = ops[rnd(ops.length)];
      var maxN = Math.min(5 + difficulty * 3, 50);
      var a, b, result;
      if (op === '+') {
        a = 1 + rnd(maxN); b = 1 + rnd(maxN);
        result = a + b;
      } else if (op === '-') {
        a = 2 + rnd(maxN); b = 1 + rnd(a);
        result = a - b;
      } else {
        a = 2 + rnd(Math.min(maxN, 15)); b = 2 + rnd(Math.min(maxN, 12));
        result = a * b;
      }
      return { text: a + ' ' + op + ' ' + b + ' = ?', answer: result };
    }

    function showProblem() {
      var prob = genProblem();
      answer = prob.answer;
      questionEl.textContent = prob.text;

      var choices = [answer];
      while (choices.length < 4) {
        var off = (rnd(2) === 0 ? -1 : 1) * (1 + rnd(Math.max(10, Math.abs(answer))));
        var wrong = answer + off;
        if (wrong !== answer && choices.indexOf(wrong) === -1) choices.push(wrong);
      }
      shuffle(choices);

      choicesEl.innerHTML = '';
      choices.forEach(function (c) {
        var b = btn(String(c), function () { pick(c); });
        b.style.minWidth = '70px';
        choicesEl.appendChild(b);
      });
    }

    function pick(val) {
      if (!running) return;
      if (val === answer) {
        score++;
        difficulty = Math.floor(score / 5);
        st.set('score', score);
        sfx('good');
      } else {
        sfx('bad');
      }
      showProblem();
    }

    function tick() {
      timeLeft--;
      st.set('time', timeLeft + 's');
      if (timeLeft <= 0) {
        running = false;
        clearInterval(intervalId);
        sfx('win');
        msg.textContent = t('core.finalScore', { n: score });
        questionEl.textContent = '';
        choicesEl.innerHTML = '';
        setBest('mathsprint', score);
        award(Math.floor(score / 5));
        st.set('best', getBest('mathsprint') || 0);
      }
    }

    function reset() {
      if (intervalId) clearInterval(intervalId);
      score = 0; timeLeft = 60; running = true; difficulty = 0;
      msg.textContent = '';
      st.set('score', 0); st.set('time', '60s');
      st.set('best', getBest('mathsprint') || 0);
      showProblem();
      intervalId = every(tick, 1000);
    }

    reset();
  } });
})();

/* ================= CHIMP ================= */
(function () {
  var STR = {
    en: { t: 'Chimp Test', d: 'Memorize the numbers, then click them in order.', level: 'Level', strike: 'Strike' },
    tr: { t: 'Şempanze Testi', d: 'Sayıları ezberle, sonra sırayla tıkla.', level: 'Seviye', strike: 'Vuruş' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'chimp', icon: '🐵', cat: 'brain', unit: 'level', str: STR, init: function (root) {
    var st = stats([['level', t('core.level')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var GRID_COLS = 8, GRID_ROWS = 5, TOTAL = GRID_COLS * GRID_ROWS;
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', GRID_COLS);
    root.appendChild(grid);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var level, nextClick, cells, numberCells, revealed, strikes, maxStrikes;

    function reset() {
      level = 4; strikes = 0; maxStrikes = 3;
      msg.textContent = '';
      st.set('best', getBest('chimp') || 0);
      startLevel();
    }

    function startLevel() {
      st.set('level', level);
      nextClick = 1;
      revealed = true;

      // pick positions for numbers
      var positions = [];
      for (var i = 0; i < TOTAL; i++) positions.push(i);
      shuffle(positions);
      var chosen = positions.slice(0, level);

      // assign numbers 1..level to chosen positions
      numberCells = {};
      for (var j = 0; j < level; j++) {
        numberCells[chosen[j]] = j + 1;
      }

      buildGrid();
    }

    function buildGrid() {
      grid.innerHTML = '';
      cells = [];
      for (var i = 0; i < TOTAL; i++) {
        var cell = el('div', 'cell');
        cell.dataset.idx = i;
        if (numberCells[i] !== undefined) {
          cell.textContent = numberCells[i];
          cell.classList.add('on');
        }
        (function (idx) {
          cell.addEventListener('pointerdown', function () { clickCell(idx); });
        })(i);
        cells.push(cell);
        grid.appendChild(cell);
      }
    }

    function clickCell(idx) {
      if (numberCells[idx] === undefined) return;

      // On first click, hide all numbers
      if (revealed && nextClick === 1) {
        revealed = false;
        cells.forEach(function (c, i) {
          if (numberCells[i] !== undefined && numberCells[i] !== 1) {
            c.textContent = '';
          }
        });
      }

      if (numberCells[idx] === nextClick) {
        // correct
        sfx('pop');
        cells[idx].classList.remove('on');
        cells[idx].classList.add('done');
        cells[idx].textContent = numberCells[idx];
        nextClick++;
        if (nextClick > level) {
          // level complete
          sfx('win');
          level++;
          st.set('level', level - 1);
          after(startLevel, 600);
        }
      } else {
        // wrong
        sfx('bad');
        strikes++;
        if (strikes >= maxStrikes) {
          var finalLevel = level - 1;
          msg.textContent = t('core.gameOver') + ' — ' + t('core.level') + ': ' + finalLevel;
          sfx('lose');
          setBest('chimp', finalLevel);
          award(Math.floor(finalLevel / 2));
          st.set('level', finalLevel);
          st.set('best', getBest('chimp') || 0);
          // show all remaining
          cells.forEach(function (c, i) {
            if (numberCells[i] !== undefined) {
              c.textContent = numberCells[i];
              c.classList.add('on');
            }
          });
        } else {
          msg.textContent = W.strike + ' ' + strikes + '/' + maxStrikes;
          // restart same level
          after(startLevel, 800);
        }
      }
    }

    reset();
  } });
})();

/* ================= VISUAL MEMORY ================= */
(function () {
  var STR = {
    en: { t: 'Visual Memory', d: 'Memorize the pattern, then reproduce it.', level: 'Level', lives: 'Lives' },
    tr: { t: 'Görsel Hafıza', d: 'Deseni ezberle, sonra tekrarla.', level: 'Seviye', lives: 'Can' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'visualmem', icon: '🧠', cat: 'brain', unit: 'level', str: STR, init: function (root) {
    var st = stats([['level', t('core.level')], ['lives', W.lives], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var grid = el('div', 'cellgrid');
    root.appendChild(grid);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var level, lives, gridSize, litCount, pattern, clicked, phase, cells;

    function reset() {
      level = 1; lives = 3;
      msg.textContent = '';
      st.set('best', getBest('visualmem') || 0);
      startLevel();
    }

    function startLevel() {
      gridSize = Math.min(3 + Math.floor((level - 1) / 3), 7);
      litCount = Math.min(2 + level, Math.floor(gridSize * gridSize * 0.6));
      var total = gridSize * gridSize;

      // pick lit positions
      var positions = [];
      for (var i = 0; i < total; i++) positions.push(i);
      shuffle(positions);
      pattern = {};
      for (var j = 0; j < litCount; j++) pattern[positions[j]] = true;

      clicked = {};
      phase = 'show';

      st.set('level', level);
      st.set('lives', lives);

      buildGrid(true);

      // hide after delay
      after(function () {
        if (phase === 'show') {
          phase = 'play';
          buildGrid(false);
        }
      }, 1200 + litCount * 120);
    }

    function buildGrid(showPattern) {
      grid.innerHTML = '';
      grid.style.setProperty('--cols', gridSize);
      cells = [];
      var total = gridSize * gridSize;
      for (var i = 0; i < total; i++) {
        var cell = el('div', 'cell');
        cell.dataset.idx = i;
        if (showPattern && pattern[i]) {
          cell.classList.add('lit');
        }
        if (clicked[i]) {
          cell.classList.add(pattern[i] ? 'good' : 'bad');
        }
        (function (idx) {
          cell.addEventListener('pointerdown', function () { clickCell(idx); });
        })(i);
        cells.push(cell);
        grid.appendChild(cell);
      }
    }

    function clickCell(idx) {
      if (phase !== 'play') return;
      if (clicked[idx]) return;

      clicked[idx] = true;

      if (pattern[idx]) {
        sfx('pop');
        cells[idx].classList.add('good');
        // check if all found
        var foundAll = Object.keys(pattern).every(function (k) { return clicked[k]; });
        if (foundAll) {
          sfx('win');
          level++;
          after(startLevel, 600);
        }
      } else {
        sfx('bad');
        cells[idx].classList.add('bad');
        lives--;
        st.set('lives', lives);
        if (lives <= 0) {
          phase = 'over';
          var finalLevel = level;
          msg.textContent = t('core.gameOver') + ' — ' + t('core.level') + ': ' + finalLevel;
          sfx('lose');
          setBest('visualmem', finalLevel);
          award(Math.floor(finalLevel / 2));
          st.set('best', getBest('visualmem') || 0);
          // reveal pattern
          buildGrid(true);
        }
      }
    }

    reset();
  } });
})();

/* ================= STROOP ================= */
(function () {
  var STR = {
    en: { t: 'Stroop Test', d: 'Pick the INK color, not the word! 45 seconds.', time: 'Time', word: 'What color is this text?' },
    tr: { t: 'Stroop Testi', d: 'Kelimenin değil, MÜREKKEBİN rengini seç! 45 saniye.', time: 'Süre', word: 'Bu yazının rengi ne?' }
  };
  var W = STR[NF.lang] || STR.en;

  var COLORS = [
    { en: 'Red', tr: 'Kırmızı', hex: '#E74C3C' },
    { en: 'Blue', tr: 'Mavi', hex: '#3498DB' },
    { en: 'Green', tr: 'Yeşil', hex: '#2ECC71' },
    { en: 'Yellow', tr: 'Sarı', hex: '#F1C40F' },
    { en: 'Purple', tr: 'Mor', hex: '#9B59B6' },
    { en: 'Orange', tr: 'Turuncu', hex: '#E67E22' }
  ];

  Games.register({ id: 'stroop', icon: '🎨', cat: 'brain', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['time', W.time], ['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var prompt = el('div', 'game-msg');
    prompt.style.fontSize = '0.9em';
    prompt.style.margin = '8px 0';
    prompt.textContent = W.word;
    root.appendChild(prompt);

    var wordEl = el('div', 'game-msg');
    wordEl.style.fontSize = '2.5em';
    wordEl.style.fontWeight = '700';
    wordEl.style.margin = '12px 0';
    root.appendChild(wordEl);

    var choicesEl = el('div', 'row');
    choicesEl.style.flexWrap = 'wrap';
    choicesEl.style.gap = '8px';
    choicesEl.style.justifyContent = 'center';
    root.appendChild(choicesEl);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var score, timeLeft, running, inkIdx, intervalId;
    var lang = NF.lang === 'tr' ? 'tr' : 'en';

    function showWord() {
      // pick word (text) and ink (color) — must differ
      var wordIdx = rnd(COLORS.length);
      do { inkIdx = rnd(COLORS.length); } while (inkIdx === wordIdx);

      wordEl.textContent = COLORS[wordIdx][lang];
      wordEl.style.color = COLORS[inkIdx].hex;

      // choices: all color buttons
      choicesEl.innerHTML = '';
      COLORS.forEach(function (c, i) {
        var b = el('button', 'action', c[lang]);
        b.style.background = c.hex;
        b.style.color = '#fff';
        b.style.border = 'none';
        b.style.minWidth = '80px';
        b.style.fontWeight = '700';
        b.addEventListener('pointerdown', function () { pickColor(i); });
        choicesEl.appendChild(b);
      });
    }

    function pickColor(idx) {
      if (!running) return;
      if (idx === inkIdx) {
        score++;
        st.set('score', score);
        sfx('good');
      } else {
        sfx('bad');
      }
      showWord();
    }

    function tick() {
      timeLeft--;
      st.set('time', timeLeft + 's');
      if (timeLeft <= 0) {
        running = false;
        clearInterval(intervalId);
        sfx('win');
        msg.textContent = t('core.finalScore', { n: score });
        wordEl.textContent = '';
        choicesEl.innerHTML = '';
        setBest('stroop', score);
        award(Math.floor(score / 5));
        st.set('best', getBest('stroop') || 0);
      }
    }

    function reset() {
      if (intervalId) clearInterval(intervalId);
      score = 0; timeLeft = 45; running = true;
      msg.textContent = '';
      st.set('score', 0); st.set('time', '45s');
      st.set('best', getBest('stroop') || 0);
      showWord();
      intervalId = every(tick, 1000);
    }

    reset();
  } });
})();

/* ================= SCHULTE TABLE ================= */
(function () {
  var STR = {
    en: { t: 'Schulte Table', d: 'Click 1 through 25 in order, as fast as you can!', next: 'Next', time: 'Time' },
    tr: { t: 'Schulte Tablosu', d: '1\'den 25\'e sırayla tıkla, olabildiğince hızlı!', next: 'Sıradaki', time: 'Süre' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'schulte', icon: '🔢', cat: 'brain', unit: 'ms', str: STR, init: function (root) {
    var st = stats([['next', W.next], ['time', W.time], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', 5);
    root.appendChild(grid);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var nextNum, startTime, running, cells, timerId;

    function reset() {
      nextNum = 1; running = false; startTime = 0;
      msg.textContent = '';
      st.set('next', '1');
      st.set('time', '0.0s');
      st.set('best', getBest('schulte') || '-');

      var nums = [];
      for (var i = 1; i <= 25; i++) nums.push(i);
      shuffle(nums);

      grid.innerHTML = '';
      cells = [];
      nums.forEach(function (n) {
        var cell = el('div', 'cell');
        cell.textContent = n;
        cell.classList.add('on');
        cell.dataset.num = n;
        cell.addEventListener('pointerdown', function () { clickNum(n, cell); });
        cells.push(cell);
        grid.appendChild(cell);
      });

      if (timerId) clearInterval(timerId);
      timerId = every(function () {
        if (running) {
          var elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
          st.set('time', elapsed + 's');
        }
      }, 100);
    }

    function clickNum(n, cell) {
      if (n !== nextNum) {
        sfx('bad');
        return;
      }

      if (!running) {
        running = true;
        startTime = performance.now();
      }

      sfx('pop');
      cell.classList.remove('on');
      cell.classList.add('done');
      nextNum++;
      st.set('next', nextNum <= 25 ? String(nextNum) : '✓');

      if (nextNum > 25) {
        // done
        running = false;
        var elapsed = Math.round(performance.now() - startTime);
        var sec = (elapsed / 1000).toFixed(2);
        msg.textContent = W.time + ': ' + sec + 's (' + elapsed + ' ' + (STR[NF.lang] || STR.en).time + ')';
        sfx('win');
        setBest('schulte', elapsed, true);
        award(elapsed < 30000 ? 5 : elapsed < 45000 ? 3 : 1);
        st.set('best', getBest('schulte') || '-');
        st.set('time', sec + 's');
        clearInterval(timerId);
      }
    }

    reset();
  } });
})();

/* ================= DIGIT SPAN ================= */
(function () {
  var STR = {
    en: { t: 'Digit Span', d: 'Memorize the digit sequence, then type it back.', level: 'Length', show: 'Watch…', recall: 'Type the digits!' },
    tr: { t: 'Rakam Hafızası', d: 'Rakam dizisini ezberle, sonra geri yaz.', level: 'Uzunluk', show: 'İzle…', recall: 'Rakamları yaz!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'digitspan', icon: '🔑', cat: 'brain', unit: 'level', str: STR, init: function (root) {
    var st = stats([['level', W.level], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var displayEl = el('div', 'game-msg');
    displayEl.style.fontSize = '3em';
    displayEl.style.fontFamily = '"JetBrains Mono", monospace';
    displayEl.style.letterSpacing = '0.2em';
    displayEl.style.margin = '24px 0 12px';
    displayEl.style.minHeight = '60px';
    root.appendChild(displayEl);

    var hintEl = el('div', 'game-msg');
    hintEl.style.margin = '0 0 12px';
    root.appendChild(hintEl);

    var inputRow = el('div', 'row');
    inputRow.style.flexWrap = 'wrap';
    inputRow.style.gap = '6px';
    inputRow.style.justifyContent = 'center';
    root.appendChild(inputRow);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var rowBtns = el('div', 'row'); rowBtns.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(rowBtns);

    var level, sequence, userInput, phase, showIdx;

    function reset() {
      level = 4;
      msg.textContent = '';
      st.set('best', getBest('digitspan') || 0);
      startLevel();
    }

    function startLevel() {
      st.set('level', level);
      sequence = [];
      for (var i = 0; i < level; i++) sequence.push(rnd(10));
      userInput = '';
      phase = 'show';
      showIdx = 0;
      inputRow.innerHTML = '';
      displayEl.textContent = '';
      hintEl.textContent = W.show;

      // show digits one at a time
      showNext();
    }

    function showNext() {
      if (showIdx < sequence.length) {
        displayEl.textContent = sequence[showIdx];
        sfx('tick');
        showIdx++;
        after(function () {
          displayEl.textContent = '';
          after(showNext, 200);
        }, 700);
      } else {
        // switch to recall phase
        phase = 'recall';
        displayEl.textContent = '';
        hintEl.textContent = W.recall;
        buildNumpad();
      }
    }

    function buildNumpad() {
      inputRow.innerHTML = '';
      for (var d = 0; d <= 9; d++) {
        (function (digit) {
          var b = btn(String(digit), function () { enterDigit(digit); });
          b.style.minWidth = '44px';
          b.style.fontSize = '1.2em';
          inputRow.appendChild(b);
        })(d);
      }
    }

    function enterDigit(d) {
      if (phase !== 'recall') return;
      userInput += d;
      displayEl.textContent = userInput;
      sfx('click');

      if (userInput.length === sequence.length) {
        phase = 'result';
        var correct = userInput === sequence.join('');
        if (correct) {
          sfx('win');
          level++;
          hintEl.textContent = '✓';
          after(startLevel, 800);
        } else {
          sfx('lose');
          var finalLevel = level - 1;
          hintEl.textContent = '✗ → ' + sequence.join('');
          msg.textContent = t('core.gameOver') + ' — ' + W.level + ': ' + finalLevel;
          inputRow.innerHTML = '';
          setBest('digitspan', finalLevel);
          award(Math.floor(finalLevel / 2));
          st.set('level', finalLevel);
          st.set('best', getBest('digitspan') || 0);
        }
      }
    }

    addKey(function (e) {
      if (phase === 'recall' && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        enterDigit(parseInt(e.key));
      }
    });

    reset();
  } });
})();

/* ================= DOT ESTIMATION ================= */
(function () {
  var STR = {
    en: { t: 'Dot Estimate', d: 'How many dots? Guess the count! 10 rounds.', round: 'Round', guess: 'Your Guess', actual: 'Actual', pts: 'Points' },
    tr: { t: 'Nokta Tahmini', d: 'Kaç nokta var? Sayıyı tahmin et! 10 tur.', round: 'Tur', guess: 'Tahminin', actual: 'Gerçek', pts: 'Puan' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'estimate', icon: '🔴', cat: 'brain', unit: 'pts', str: STR, init: function (root) {
    var ROUNDS = 10;
    var st = stats([['round', W.round], ['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var WI = 300, HE = 300;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    root.appendChild(c.cv);

    var guessRow = el('div', 'row');
    guessRow.style.gap = '8px';
    guessRow.style.justifyContent = 'center';
    guessRow.style.margin = '12px 0';
    var inputEl = el('input', 'search');
    inputEl.type = 'number';
    inputEl.min = '1';
    inputEl.max = '200';
    inputEl.placeholder = W.guess;
    inputEl.style.width = '120px';
    inputEl.style.textAlign = 'center';
    guessRow.appendChild(inputEl);
    var submitBtn = btn('→', submitGuess);
    guessRow.appendChild(submitBtn);
    root.appendChild(guessRow);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var rowBtns = el('div', 'row'); rowBtns.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(rowBtns);

    var round, score, dotCount, dots, phase;

    function reset() {
      round = 0; score = 0; phase = 'idle';
      msg.textContent = '';
      st.set('score', 0);
      st.set('best', getBest('estimate') || 0);
      nextRound();
    }

    function nextRound() {
      round++;
      if (round > ROUNDS) {
        endGame();
        return;
      }
      st.set('round', round + '/' + ROUNDS);
      phase = 'show';

      // generate dots
      dotCount = 5 + rnd(Math.min(15 + round * 8, 120));
      dots = [];
      for (var i = 0; i < dotCount; i++) {
        dots.push({ x: 12 + Math.random() * (WI - 24), y: 12 + Math.random() * (HE - 24) });
      }

      drawDots(true);
      inputEl.value = '';
      inputEl.disabled = false;
      msg.textContent = '';

      // hide after delay
      after(function () {
        if (phase === 'show') {
          phase = 'guess';
          drawDots(false);
          inputEl.focus();
        }
      }, 1200 + dotCount * 12);
    }

    function drawDots(show) {
      ctx.fillStyle = '#150F28';
      ctx.fillRect(0, 0, WI, HE);
      if (show) {
        ctx.fillStyle = '#F2A93B';
        dots.forEach(function (d) {
          ctx.beginPath();
          ctx.arc(d.x, d.y, 4, 0, 7);
          ctx.fill();
        });
      } else {
        ctx.fillStyle = '#B8AEDB';
        ctx.font = '700 22px "Baloo 2", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', WI / 2, HE / 2 + 8);
        ctx.textAlign = 'left';
      }
    }

    function submitGuess() {
      if (phase !== 'guess') return;
      var val = parseInt(inputEl.value);
      if (isNaN(val) || val < 0) return;

      phase = 'result';
      inputEl.disabled = true;

      var diff = Math.abs(val - dotCount);
      var pts = Math.max(0, 10 - diff);
      score += pts;
      st.set('score', score);

      // show the dots again with count
      drawDots(true);
      ctx.fillStyle = '#F5F0FF';
      ctx.font = '700 18px "Baloo 2", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(W.actual + ': ' + dotCount, WI / 2, HE - 12);
      ctx.textAlign = 'left';

      msg.textContent = W.guess + ': ' + val + '  |  ' + W.actual + ': ' + dotCount + '  |  +' + pts + ' ' + W.pts;

      if (diff === 0) sfx('win');
      else if (diff <= 3) sfx('good');
      else sfx('bad');

      after(nextRound, 1800);
    }

    function endGame() {
      phase = 'over';
      inputEl.disabled = true;
      st.set('round', ROUNDS + '/' + ROUNDS);
      msg.textContent = t('core.finalScore', { n: score });
      sfx(score >= 60 ? 'win' : 'lose');
      setBest('estimate', score);
      award(Math.floor(score / 20));
      st.set('best', getBest('estimate') || 0);
    }

    addKey(function (e) {
      if (e.key === 'Enter' && phase === 'guess') {
        e.preventDefault();
        submitGuess();
      }
    });

    reset();
  } });
})();

/* ================= MISSING OPERATOR ================= */
(function () {
  var STR = {
    en: { t: 'Missing Operator', d: 'Find the missing operator: +, -, ×, ÷. 60 seconds.', time: 'Time' },
    tr: { t: 'Kayıp İşlem', d: 'Eksik işlemi bul: +, -, ×, ÷. 60 saniye.', time: 'Süre' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'missingop', icon: '❓', cat: 'brain', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['time', W.time], ['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var questionEl = el('div', 'game-msg');
    questionEl.style.fontSize = '2em';
    questionEl.style.fontFamily = '"JetBrains Mono", monospace';
    questionEl.style.margin = '18px 0 12px';
    root.appendChild(questionEl);

    var choicesEl = el('div', 'row');
    choicesEl.style.gap = '10px';
    choicesEl.style.justifyContent = 'center';
    root.appendChild(choicesEl);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var score, timeLeft, running, correctOp, intervalId;

    function genProblem() {
      var ops = ['+', '-', '×', '÷'];
      var op = pick(ops);
      var a, b, result;

      if (op === '+') {
        a = 1 + rnd(50); b = 1 + rnd(50);
        result = a + b;
      } else if (op === '-') {
        a = 2 + rnd(50); b = 1 + rnd(a);
        result = a - b;
      } else if (op === '×') {
        a = 2 + rnd(12); b = 2 + rnd(12);
        result = a * b;
      } else {
        // division: pick b and result, then a = b * result
        b = 2 + rnd(12);
        result = 1 + rnd(20);
        a = b * result;
      }

      return { a: a, b: b, result: result, op: op };
    }

    function showProblem() {
      var prob = genProblem();
      correctOp = prob.op;
      questionEl.textContent = prob.a + '  ?  ' + prob.b + '  =  ' + prob.result;

      choicesEl.innerHTML = '';
      ['+', '-', '×', '÷'].forEach(function (op) {
        var b = btn(op, function () { pickOp(op); });
        b.style.minWidth = '60px';
        b.style.fontSize = '1.5em';
        choicesEl.appendChild(b);
      });
    }

    function pickOp(op) {
      if (!running) return;
      if (op === correctOp) {
        score++;
        st.set('score', score);
        sfx('good');
      } else {
        sfx('bad');
      }
      showProblem();
    }

    function tick() {
      timeLeft--;
      st.set('time', timeLeft + 's');
      if (timeLeft <= 0) {
        running = false;
        clearInterval(intervalId);
        sfx('win');
        msg.textContent = t('core.finalScore', { n: score });
        questionEl.textContent = '';
        choicesEl.innerHTML = '';
        setBest('missingop', score);
        award(Math.floor(score / 5));
        st.set('best', getBest('missingop') || 0);
      }
    }

    function reset() {
      if (intervalId) clearInterval(intervalId);
      score = 0; timeLeft = 60; running = true;
      msg.textContent = '';
      st.set('score', 0); st.set('time', '60s');
      st.set('best', getBest('missingop') || 0);
      showProblem();
      intervalId = every(tick, 1000);
    }

    reset();
  } });
})();

/* ================= NUMBER GUESSING ================= */
(function () {
  var STR = {
    en: { t: 'Guess the Number', d: 'I picked 1-1000. Guess it in fewest moves!', higher: '📈 Higher!', lower: '📉 Lower!', guesses: 'Guesses', range: 'Range', correct: '🎯 Correct!' },
    tr: { t: 'Sayıyı Bul', d: '1-1000 arası bir sayı tuttum. En az denemede bul!', higher: '📈 Daha yüksek!', lower: '📉 Daha düşük!', guesses: 'Deneme', range: 'Aralık', correct: '🎯 Doğru!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'guessnum', icon: '🎯', cat: 'brain', unit: 'moves', str: STR, init: function (root) {
    var st = stats([['guesses', W.guesses], ['range', W.range], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var hintEl = el('div', 'game-msg');
    hintEl.style.fontSize = '1.5em';
    hintEl.style.margin = '18px 0 8px';
    hintEl.style.minHeight = '40px';
    root.appendChild(hintEl);

    var guessRow = el('div', 'row');
    guessRow.style.gap = '8px';
    guessRow.style.justifyContent = 'center';
    guessRow.style.margin = '12px 0';
    var inputEl = el('input', 'search');
    inputEl.type = 'number';
    inputEl.min = '1';
    inputEl.max = '1000';
    inputEl.placeholder = '1 – 1000';
    inputEl.style.width = '140px';
    inputEl.style.textAlign = 'center';
    guessRow.appendChild(inputEl);
    var submitBtn = btn('→', submitGuess);
    guessRow.appendChild(submitBtn);
    root.appendChild(guessRow);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var rowBtns = el('div', 'row'); rowBtns.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(rowBtns);

    var target, guesses, lo, hi, done;

    function reset() {
      target = 1 + rnd(1000);
      guesses = 0; lo = 1; hi = 1000; done = false;
      msg.textContent = '';
      hintEl.textContent = '';
      inputEl.disabled = false;
      inputEl.value = '';
      st.set('guesses', 0);
      st.set('range', '1 – 1000');
      st.set('best', getBest('guessnum') || '-');
      inputEl.focus();
    }

    function submitGuess() {
      if (done) return;
      var val = parseInt(inputEl.value);
      if (isNaN(val) || val < 1 || val > 1000) return;

      guesses++;
      st.set('guesses', guesses);
      inputEl.value = '';

      if (val === target) {
        done = true;
        inputEl.disabled = true;
        hintEl.textContent = W.correct;
        hintEl.style.color = '#6FCF97';
        msg.textContent = W.guesses + ': ' + guesses;
        sfx('win');
        setBest('guessnum', guesses, true);
        award(guesses <= 10 ? 5 : guesses <= 15 ? 3 : 1);
        st.set('best', getBest('guessnum') || '-');
      } else if (val < target) {
        lo = Math.max(lo, val + 1);
        hintEl.textContent = W.higher;
        hintEl.style.color = '#F2A93B';
        sfx('tick');
      } else {
        hi = Math.min(hi, val - 1);
        hintEl.textContent = W.lower;
        hintEl.style.color = '#FF6F91';
        sfx('tick');
      }
      st.set('range', lo + ' – ' + hi);
      if (!done) inputEl.focus();
    }

    addKey(function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitGuess();
      }
    });

    reset();
  } });
})();

})();
/* end of brain pack */
