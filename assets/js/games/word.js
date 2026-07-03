/* ============================================================
   Night Fair — WORD pack (7 games)
   wordle, hangman, anagram, wordsearch, typing, vowels, verbal
   Word pools live here, per language.
   ============================================================ */
'use strict';
(function () {

var C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_GRN = '#6FCF97', C_DIM = '#B8AEDB';
var LOC = NF.lang === 'tr' ? 'tr' : 'en';
function up(s) { return s.toLocaleUpperCase(LOC === 'tr' ? 'tr-TR' : 'en-US'); }

var ALPHABET = LOC === 'tr'
  ? 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('')
  : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

var KB_ROWS = LOC === 'tr'
  ? [['E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Ğ', 'Ü'],
     ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'İ'],
     ['ENTER', 'Z', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ç', 'DEL']]
  : [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
     ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
     ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL']];

var WORDS5 = LOC === 'tr'
  ? ['KALEM', 'MASAL', 'ELMAS', 'KAPAK', 'SEPET', 'ÇORAP', 'ÖRDEK', 'TAVAN', 'KAZAN', 'ARABA',
     'KUTUP', 'YUMAK', 'ÇANTA', 'BALON', 'TAVUK', 'KEMER', 'YASAK', 'DAMAR', 'SAMAN', 'KAVUN',
     'ÇAKAL', 'ORMAN', 'KIRAZ', 'LİMON', 'BIÇAK', 'TABAK', 'HALAT', 'KUMAŞ', 'PERDE', 'YAZAR',
     'DENİZ', 'BAHÇE', 'SOKAK', 'YILAN', 'HAVUÇ', 'BİBER', 'ŞEKER', 'PASTA', 'HAMUR', 'SALON',
     'DUVAR', 'TOPUK', 'KİTAP', 'RADYO', 'KUMRU', 'MARUL', 'VİŞNE', 'ÇİLEK']
  : ['APPLE', 'HOUSE', 'PLANT', 'STONE', 'WATER', 'LIGHT', 'MUSIC', 'DREAM', 'BREAD', 'CHAIR',
     'TRAIN', 'CLOUD', 'GRAPE', 'LEMON', 'TIGER', 'HORSE', 'SNAKE', 'MOUSE', 'BEACH', 'RIVER',
     'NIGHT', 'CANDY', 'SUGAR', 'HEART', 'SMILE', 'DANCE', 'PAINT', 'PIANO', 'OCEAN', 'EARTH',
     'FLAME', 'STORM', 'WHEAT', 'HONEY', 'PEACH', 'BERRY', 'CROWN', 'CLOCK', 'GHOST', 'MAGIC',
     'FAIRY', 'JOKER', 'ROBOT', 'SPICE', 'TOAST', 'WHALE', 'ZEBRA', 'QUILT'];

var WORDS_LONG = LOC === 'tr'
  ? ['PANAYIR', 'GECEYARISI', 'LUNAPARK', 'PAMUKŞEKER', 'DÖNMEDOLAP', 'KUKLA', 'SİHİRBAZ', 'PALYAÇO',
     'BALONCU', 'ATLIKARINCA', 'GÖSTERİ', 'KOSTÜM', 'MASKELİ', 'AKROBAT', 'JONGLÖR', 'KARAVAN',
     'FENER', 'YILDIZ', 'MEHTAP', 'KUYRUKLU', 'ŞENLİK', 'PATLAMIŞ', 'MISIR', 'GAZOZ', 'MACUN',
     'HORON', 'ZEYBEK', 'DAVUL', 'ZURNA', 'KEMENÇE']
  : ['CARNIVAL', 'MIDNIGHT', 'FUNFAIR', 'CANDYFLOSS', 'FERRISWHEEL', 'PUPPET', 'MAGICIAN', 'CLOWN',
     'BALLOON', 'CAROUSEL', 'SHOWTIME', 'COSTUME', 'MASKED', 'ACROBAT', 'JUGGLER', 'CARAVAN',
     'LANTERN', 'STARLIGHT', 'MOONBEAM', 'COMET', 'FESTIVAL', 'POPCORN', 'LEMONADE', 'TOFFEE',
     'FIREWORK', 'PARADE', 'DRUMMER', 'TRUMPET', 'FIDDLE', 'BANJO'];

/* ================= WORDLE (Daily Word) ================= */
(function () {
  var STR = {
    en: { t: 'Daily Word', d: '5 letters, 6 tries. Same word for everyone, every day.', won: 'You got today\'s word! 🎉', lost: 'Out of tries. The word was: {w}', short: 'Not enough letters', played: 'Played' },
    tr: { t: 'Günün Kelimesi', d: '5 harf, 6 hak. Her gün herkese aynı kelime.', won: 'Bugünkü kelimeyi bildin! 🎉', lost: 'Hakların bitti. Kelime: {w}', short: 'Harf eksik', played: 'Oynanan' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'wordle', icon: '🔤', cat: 'word', unit: 'streak', str: STR, init: function (root) {
    var st = stats([['streak', t('core.streak')], ['played', W.played]]);
    root.appendChild(st.el);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var gridEl = el('div', 'word-grid');
    gridEl.style.gridTemplateRows = 'repeat(6,1fr)';
    root.appendChild(gridEl);
    var kb = el('div', 'kb'); root.appendChild(kb);

    var stKey = 'wordle_stats_' + LOC;
    var progKey = 'wordle_' + LOC + '_' + todayKey();
    var state;

    function load() {
      var answer = WORDS5[((dayNumber() % WORDS5.length) + WORDS5.length) % WORDS5.length];
      state = { answer: answer, guesses: [], current: '', over: false, won: false, letters: {} };
      var saved = S.get(progKey, null);
      if (saved) {
        state.guesses = saved.guesses;
        state.over = saved.over;
        state.won = saved.won;
        state.guesses.forEach(function (g) { applyLetters(g.word, g.result); });
        if (state.over) msg.textContent = state.won ? W.won : W.lost.split('{w}').join(answer);
      }
      var stats2 = S.get(stKey, { streak: 0, played: 0 });
      st.set('streak', stats2.streak);
      st.set('played', stats2.played);
      render();
    }
    function applyLetters(word, result) {
      var rank = { absent: 0, present: 1, correct: 2 };
      word.split('').forEach(function (ch, i) {
        if (!state.letters[ch] || rank[result[i]] > rank[state.letters[ch]]) state.letters[ch] = result[i];
      });
    }
    function evalGuess(guess, answer) {
      var result = [], aArr = answer.split(''), gArr = guess.split('');
      for (var i = 0; i < 5; i++) result.push('absent');
      for (var j = 0; j < 5; j++) {
        if (gArr[j] === aArr[j]) { result[j] = 'correct'; aArr[j] = null; gArr[j] = null; }
      }
      for (var k = 0; k < 5; k++) {
        if (gArr[k] && aArr.indexOf(gArr[k]) !== -1) {
          result[k] = 'present';
          aArr[aArr.indexOf(gArr[k])] = null;
        }
      }
      return result;
    }
    function key(k) {
      if (state.over) return;
      if (k === 'DEL') state.current = state.current.slice(0, -1);
      else if (k === 'ENTER') {
        if (state.current.length !== 5) { msg.textContent = W.short; after(function () { msg.textContent = ''; }, 1200); return; }
        submit();
        return;
      } else if (state.current.length < 5) state.current += k;
      sfx('click');
      render();
    }
    function submit() {
      var guess = state.current;
      var result = evalGuess(guess, state.answer);
      state.guesses.push({ word: guess, result: result });
      applyLetters(guess, result);
      state.current = '';
      var won = guess === state.answer;
      if (won || state.guesses.length >= 6) {
        state.over = true; state.won = won;
        var stats2 = S.get(stKey, { streak: 0, played: 0 });
        stats2.played++;
        stats2.streak = won ? stats2.streak + 1 : 0;
        S.set(stKey, stats2);
        st.set('streak', stats2.streak);
        st.set('played', stats2.played);
        msg.textContent = won ? W.won : W.lost.split('{w}').join(state.answer);
        if (won) { sfx('win'); setBest('wordle', stats2.streak); award(6); }
        else sfx('lose');
      } else sfx('tick');
      S.set(progKey, { guesses: state.guesses, over: state.over, won: state.won });
      render();
    }
    addKey(function (e) {
      if (e.key === 'Enter') { key('ENTER'); return; }
      if (e.key === 'Backspace') { key('DEL'); return; }
      var ch = up(e.key);
      if (ch.length === 1 && ALPHABET.indexOf(ch) !== -1) key(ch);
    });
    function render() {
      gridEl.innerHTML = '';
      for (var r = 0; r < 6; r++) {
        var rowEl = el('div', 'word-row');
        var guess = state.guesses[r];
        var letters = r === state.guesses.length && !state.over
          ? state.current
          : (guess ? guess.word : '');
        for (var c = 0; c < 5; c++) {
          var cell = el('div', 'word-cell', letters[c] || '');
          if (guess) cell.classList.add(guess.result[c]);
          rowEl.appendChild(cell);
        }
        gridEl.appendChild(rowEl);
      }
      kb.innerHTML = '';
      KB_ROWS.forEach(function (krow) {
        var rowEl = el('div', 'kb-row');
        krow.forEach(function (k) {
          var b = el('div', 'kb-key' + (k.length > 1 ? ' wide' : '') + (state.letters[k] ? ' ' + state.letters[k] : ''), k === 'DEL' ? '⌫' : k);
          b.onclick = function () { key(k); };
          rowEl.appendChild(b);
        });
        kb.appendChild(rowEl);
      });
    }
    load();
  } });
})();

/* ================= HANGMAN ================= */
(function () {
  var STR = {
    en: { t: 'Hangman', d: 'Guess the word letter by letter. 6 mistakes allowed.', lost: 'The word was: {w}' },
    tr: { t: 'Adam Asmaca', d: 'Kelimeyi harf harf tahmin et. 6 hata hakkın var.', lost: 'Kelime şuydu: {w}' }
  };
  var W = STR[NF.lang] || STR.en;
  var STAGES = ['😀', '🙂', '😐', '😕', '😟', '😰', '💀'];
  Games.register({ id: 'hangman', icon: '🪢', cat: 'word', unit: 'streak', str: STR, init: function (root) {
    var st = stats([['wrong', '✖'], ['streak', t('core.streak')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var face = el('div', 'center'); face.style.fontSize = '52px'; face.style.margin = '8px 0';
    root.appendChild(face);
    var wordEl = el('div', 'hang-word'); root.appendChild(wordEl);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var bank = el('div', 'letter-bank'); root.appendChild(bank);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var word, found, wrong, over, streak;
    function start() {
      word = pick(WORDS_LONG.filter(function (w) { return w.length <= 10; }));
      found = {}; wrong = 0; over = false;
      streak = S.get('hangman_streak', 0);
      msg.textContent = '';
      st.set('wrong', '0/6');
      st.set('streak', streak);
      st.set('best', getBest('hangman') || 0);
      render();
    }
    function guess(ch) {
      if (over || found[ch] !== undefined) return;
      var hit = word.indexOf(ch) !== -1;
      found[ch] = hit;
      if (!hit) {
        wrong++;
        st.set('wrong', wrong + '/6');
        sfx('bad');
        if (wrong >= 6) {
          over = true; sfx('lose');
          streak = 0; S.set('hangman_streak', 0);
          st.set('streak', 0);
          msg.textContent = W.lost.split('{w}').join(word);
        }
      } else {
        sfx('pop');
        var done = word.split('').every(function (c) { return found[c]; });
        if (done) {
          over = true; sfx('win');
          streak++; S.set('hangman_streak', streak);
          st.set('streak', streak);
          msg.textContent = t('core.youWin');
          setBest('hangman', streak); award(4);
          st.set('best', getBest('hangman'));
        }
      }
      render();
    }
    addKey(function (e) {
      var ch = up(e.key);
      if (ch.length === 1 && ALPHABET.indexOf(ch) !== -1) guess(ch);
    });
    function render() {
      face.textContent = STAGES[wrong];
      wordEl.textContent = word.split('').map(function (c) {
        return over || found[c] ? c : '_';
      }).join(' ');
      bank.innerHTML = '';
      ALPHABET.forEach(function (ch) {
        var b = el('button', null, ch);
        if (found[ch] !== undefined || over) {
          b.disabled = true;
          if (found[ch] === true) b.style.color = C_GRN;
          if (found[ch] === false) b.style.color = C_PINK;
        }
        b.onclick = function () { guess(ch); };
        bank.appendChild(b);
      });
    }
    start();
  } });
})();

/* ================= ANAGRAM ================= */
(function () {
  var STR = {
    en: { t: 'Anagram Rush', d: 'Unscramble as many words as you can in 60 seconds.', skip: 'Skip', ph: 'Type the word…' },
    tr: { t: 'Anagram', d: '60 saniyede olabildiğince çok kelimeyi çöz.', skip: 'Geç', ph: 'Kelimeyi yaz…' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'anagram', icon: '🔀', cat: 'word', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['score', t('core.score')], ['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var scrambleEl = el('div', 'big-readout'); root.appendChild(scrambleEl);
    var input = el('input', 'text-input');
    input.placeholder = W.ph;
    input.style.maxWidth = '300px';
    input.style.display = 'block';
    input.style.margin = '0 auto';
    input.autocomplete = 'off';
    root.appendChild(input);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row');
    row.appendChild(btn(W.skip, next, true));
    row.appendChild(btn(t('core.newGame'), start, true));
    root.appendChild(row);

    var pool, word, score, timeLeft, over;
    function scramble(w) {
      var a = w.split(''), out = w, guard = 0;
      while (out === w && guard++ < 20) out = shuffle(a.slice()).join('');
      return out;
    }
    function start() {
      pool = shuffle(WORDS5.concat(WORDS_LONG.filter(function (w) { return w.length <= 7; })).slice());
      score = 0; timeLeft = 60; over = false;
      msg.textContent = '';
      st.set('score', 0); st.set('time', 60); st.set('best', getBest('anagram') || 0);
      input.value = ''; input.disabled = false; input.focus();
      next();
    }
    function next() {
      if (over) return;
      if (!pool.length) pool = shuffle(WORDS5.slice());
      word = pool.pop();
      scrambleEl.textContent = scramble(word);
      input.value = '';
    }
    every(function () {
      if (over || timeLeft <= 0) return;
      timeLeft--;
      st.set('time', timeLeft);
      if (timeLeft <= 0) end();
    }, 1000);
    input.addEventListener('input', function () {
      if (over) return;
      if (up(input.value.trim()) === word) {
        score += word.length;
        st.set('score', score); sfx('good');
        msg.textContent = t('core.correct');
        after(function () { msg.textContent = ''; }, 700);
        next();
      }
    });
    function end() {
      over = true;
      input.disabled = true;
      sfx('win');
      msg.textContent = t('core.finalScore', { n: score });
      setBest('anagram', score); award(Math.floor(score / 15));
      st.set('best', getBest('anagram'));
    }
    start();
  } });
})();

/* ================= WORD SEARCH ================= */
(function () {
  var STR = {
    en: { t: 'Word Search', d: 'Find the 6 hidden words in the letter grid.', found: 'Found' },
    tr: { t: 'Kelime Avı', d: 'Harf ızgarasında saklı 6 kelimeyi bul.', found: 'Bulunan' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'wordsearch', icon: '🔍', cat: 'word', unit: 'ms', lower: true, str: STR, init: function (root) {
    var N = 10;
    var st = stats([['found', W.found], ['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var grid = el('div', 'cellgrid');
    grid.style.setProperty('--cols', N);
    grid.style.setProperty('--gw', '420px');
    grid.style.gap = '3px';
    root.appendChild(grid);
    var listEl = el('div', 'center'); listEl.style.margin = '14px 0';
    root.appendChild(listEl);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var letters, words, foundWords, foundCells, sel, sec, done;
    function start() {
      var tries = 0;
      while (tries++ < 50 && !build()) {}
      sel = null; foundWords = {}; foundCells = {}; sec = 0; done = false;
      msg.textContent = '';
      st.set('found', '0/' + words.length);
      st.set('time', '0:00');
      var b = getBest('wordsearch');
      st.set('best', b === null ? '-' : fmtTime(Math.round(b / 1000)));
      render();
    }
    function build() {
      letters = [];
      for (var i = 0; i < N * N; i++) letters.push('');
      words = shuffle(WORDS5.slice()).slice(0, 6).map(up);
      var DIRS = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0]];
      for (var w = 0; w < words.length; w++) {
        var placed = false;
        for (var attempt = 0; attempt < 80 && !placed; attempt++) {
          var d = pick(DIRS), word = words[w];
          var r0 = rnd(N), c0 = rnd(N);
          var r1 = r0 + d[0] * (word.length - 1), c1 = c0 + d[1] * (word.length - 1);
          if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
          var ok = true;
          for (var k = 0; k < word.length; k++) {
            var cellCh = letters[(r0 + d[0] * k) * N + (c0 + d[1] * k)];
            if (cellCh && cellCh !== word[k]) { ok = false; break; }
          }
          if (!ok) continue;
          for (var k2 = 0; k2 < word.length; k2++) {
            letters[(r0 + d[0] * k2) * N + (c0 + d[1] * k2)] = word[k2];
          }
          placed = true;
        }
        if (!placed) return false;
      }
      for (var j = 0; j < N * N; j++) if (!letters[j]) letters[j] = pick(ALPHABET);
      return true;
    }
    every(function () { if (!done && letters) { sec++; st.set('time', fmtTime(sec)); } }, 1000);
    function lineCells(a, b) {
      var r0 = Math.floor(a / N), c0 = a % N, r1 = Math.floor(b / N), c1 = b % N;
      var dr = r1 - r0, dc = c1 - c0;
      var len = Math.max(Math.abs(dr), Math.abs(dc));
      if (len === 0) return [a];
      if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
      var sr = dr === 0 ? 0 : dr / Math.abs(dr), sc = dc === 0 ? 0 : dc / Math.abs(dc);
      var out = [];
      for (var k = 0; k <= len; k++) out.push((r0 + sr * k) * N + (c0 + sc * k));
      return out;
    }
    function tap(idx) {
      if (done) return;
      if (sel === null) { sel = idx; sfx('click'); render(); return; }
      var cells = lineCells(sel, idx);
      sel = null;
      if (cells) {
        var str = cells.map(function (i) { return letters[i]; }).join('');
        var rev = str.split('').reverse().join('');
        var hit = null;
        if (words.indexOf(str) !== -1 && !foundWords[str]) hit = str;
        else if (words.indexOf(rev) !== -1 && !foundWords[rev]) hit = rev;
        if (hit) {
          foundWords[hit] = true;
          cells.forEach(function (i) { foundCells[i] = true; });
          sfx('good');
          var n = Object.keys(foundWords).length;
          st.set('found', n + '/' + words.length);
          if (n === words.length) {
            done = true;
            msg.textContent = t('core.youWin'); sfx('win');
            setBest('wordsearch', sec * 1000, true); award(6);
            st.set('best', fmtTime(sec));
          }
        } else sfx('bad');
      }
      render();
    }
    function render() {
      grid.innerHTML = '';
      letters.forEach(function (ch, idx) {
        var cell = el('button', 'cell', ch);
        cell.style.fontSize = '14px';
        if (foundCells[idx]) cell.classList.add('good');
        if (idx === sel) cell.classList.add('lit');
        cell.onclick = function () { tap(idx); };
        grid.appendChild(cell);
      });
      listEl.innerHTML = words.map(function (w) {
        return '<span class="tag-pill" style="' + (foundWords[w] ? 'text-decoration:line-through;opacity:.5;' : '') + '">' + w + '</span>';
      }).join('');
    }
    start();
  } });
})();

/* ================= TYPING TEST ================= */
(function () {
  var STR = {
    en: {
      t: 'Speed Typer', d: '30 seconds — how many words per minute?', wpm: 'WPM', acc: 'Accuracy',
      hint: 'Start typing to begin the 30s timer',
      sents: [
        'the night fair never turns off its lights',
        'a paper lantern floats over the carousel',
        'cotton candy melts faster than promises',
        'the juggler drops nothing but his hat',
        'every ticket hides a tiny adventure',
        'the ferris wheel hums an old melody',
        'popcorn crackles like distant fireworks',
        'a fortune teller shuffles her worn cards',
        'the ring toss booth is rigged and we know it',
        'moonlight paints the tents in silver'
      ]
    },
    tr: {
      t: 'Hız Yazarı', d: '30 saniye — dakikada kaç kelime yazarsın?', wpm: 'KDS', acc: 'Doğruluk',
      hint: 'Yazmaya başlayınca 30 saniyelik sayaç başlar',
      sents: [
        'gece panayırında ışıklar hiç sönmez',
        'atlıkarıncanın üstünde kağıt fener süzülür',
        'pamuk şeker sözlerden hızlı erir',
        'jonglör şapkasından başka bir şey düşürmez',
        'her biletin içinde küçük bir macera saklıdır',
        'dönme dolap eski bir melodi mırıldanır',
        'patlamış mısır uzak havai fişekler gibi çıtırdar',
        'falcı yıpranmış kartlarını karıştırır',
        'halka atma standı hileli ve bunu biliyoruz',
        'ay ışığı çadırları gümüşe boyar'
      ]
    }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'typing', icon: '⌨️', cat: 'word', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['wpm', W.wpm], ['acc', W.acc], ['time', t('core.time')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var target = el('div', 'type-target'); root.appendChild(target);
    var input = el('input', 'text-input');
    input.autocomplete = 'off';
    input.style.maxWidth = '420px'; input.style.display = 'block'; input.style.margin = '0 auto';
    root.appendChild(input);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', W.hint));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row);

    var sents, sentIdx, typed, correctChars, totalChars, timeLeft, started, over;
    function start() {
      sents = shuffle(W.sents.slice());
      sentIdx = 0; typed = ''; correctChars = 0; totalChars = 0;
      timeLeft = 30; started = false; over = false;
      msg.textContent = '';
      input.value = ''; input.disabled = false; input.focus();
      st.set('wpm', 0); st.set('acc', '100%'); st.set('time', 30);
      st.set('best', getBest('typing') || 0);
      render();
    }
    every(function () {
      if (!started || over) return;
      timeLeft--;
      st.set('time', timeLeft);
      updateLive();
      if (timeLeft <= 0) end();
    }, 1000);
    input.addEventListener('input', function () {
      if (over) return;
      started = true;
      var sent = sents[sentIdx % sents.length];
      typed = input.value;
      if (typed === sent) {
        // count sentence
        for (var i = 0; i < sent.length; i++) { correctChars++; totalChars++; }
        correctChars++; totalChars++; // implicit space
        sentIdx++;
        typed = '';
        input.value = '';
        sfx('good');
      }
      render();
      updateLive();
    });
    function liveCounts() {
      var sent = sents[sentIdx % sents.length];
      var c = correctChars, tot = totalChars;
      for (var i = 0; i < typed.length; i++) {
        tot++;
        if (typed[i] === sent[i]) c++;
      }
      return { c: c, tot: tot };
    }
    function updateLive() {
      var lc = liveCounts();
      var elapsed = 30 - timeLeft;
      if (elapsed > 0) st.set('wpm', Math.round((lc.c / 5) / (elapsed / 60)));
      st.set('acc', (lc.tot ? Math.round(lc.c / lc.tot * 100) : 100) + '%');
    }
    function end() {
      over = true;
      input.disabled = true;
      var lc = liveCounts();
      var wpm = Math.round((lc.c / 5) / 0.5);
      st.set('wpm', wpm);
      msg.textContent = wpm + ' ' + W.wpm + ' · ' + (lc.tot ? Math.round(lc.c / lc.tot * 100) : 100) + '%';
      sfx('win');
      setBest('typing', wpm); award(Math.floor(wpm / 10));
      st.set('best', getBest('typing'));
    }
    function render() {
      var sent = sents[sentIdx % sents.length];
      var html = '';
      for (var i = 0; i < sent.length; i++) {
        var ch = sent[i] === ' ' ? '&nbsp;' : esc(sent[i]);
        if (i < typed.length) html += '<span class="' + (typed[i] === sent[i] ? 'ok' : 'err') + '">' + ch + '</span>';
        else if (i === typed.length) html += '<span class="cur">' + ch + '</span>';
        else html += '<span class="todo">' + ch + '</span>';
      }
      target.innerHTML = html;
    }
    start();
  } });
})();

/* ================= MISSING VOWELS ================= */
(function () {
  var STR = {
    en: { t: 'Missing Vowels', d: 'The vowels are gone — can you name the word?', roundOf: 'Round', was: 'It was: {w}', ph: 'Full word…' },
    tr: { t: 'Eksik Sesliler', d: 'Sesli harfler kayıp — kelimeyi bulabilir misin?', roundOf: 'Tur', was: 'Doğrusu: {w}', ph: 'Kelimenin tamamı…' }
  };
  var W = STR[NF.lang] || STR.en;
  var VOWELS = LOC === 'tr' ? 'AEIİOÖUÜ' : 'AEIOU';
  Games.register({ id: 'vowels', icon: '🅰️', cat: 'word', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['round', W.roundOf], ['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var puzzleEl = el('div', 'big-readout'); root.appendChild(puzzleEl);
    var input = el('input', 'text-input');
    input.placeholder = W.ph;
    input.autocomplete = 'off';
    input.style.maxWidth = '300px'; input.style.display = 'block'; input.style.margin = '0 auto';
    root.appendChild(input);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row');
    var okBtn = btn('✔', submit);
    row.appendChild(okBtn);
    row.appendChild(btn(t('core.newGame'), start, true));
    root.appendChild(row);

    var pool, word, round, score, over;
    var TOTAL = 10;
    function start() {
      pool = shuffle(WORDS_LONG.concat(WORDS5).filter(function (w) { return w.length >= 5; }));
      round = 0; score = 0; over = false;
      msg.textContent = '';
      input.disabled = false;
      st.set('score', 0);
      st.set('best', getBest('vowels') || 0);
      next();
    }
    function masked(w) {
      return w.split('').map(function (c) { return VOWELS.indexOf(c) !== -1 ? '·' : c; }).join(' ');
    }
    function next() {
      round++;
      if (round > TOTAL) { end(); return; }
      word = pool.pop() || pick(WORDS_LONG);
      st.set('round', round + '/' + TOTAL);
      puzzleEl.textContent = masked(word);
      input.value = '';
      input.focus();
    }
    function submit() {
      if (over) return;
      if (up(input.value.trim()) === word) {
        score += 10; st.set('score', score);
        msg.textContent = t('core.correct'); sfx('good');
      } else {
        msg.textContent = W.was.split('{w}').join(word); sfx('bad');
      }
      after(function () { if (!over) msg.textContent = ''; }, 1100);
      next();
    }
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
    function end() {
      over = true;
      input.disabled = true;
      msg.textContent = t('core.finalScore', { n: score });
      sfx(score >= 60 ? 'win' : 'lose');
      setBest('vowels', score); award(Math.floor(score / 20));
      st.set('best', getBest('vowels'));
    }
    start();
  } });
})();

/* ================= VERBAL MEMORY ================= */
(function () {
  var STR = {
    en: { t: 'Verbal Memory', d: 'Seen it before or brand new? Keep the streak alive.', seen: 'SEEN', newW: 'NEW' },
    tr: { t: 'Sözel Hafıza', d: 'Daha önce gördün mü, yeni mi? Seriyi koru.', seen: 'GÖRDÜM', newW: 'YENİ' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'verbal', icon: '🧾', cat: 'word', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['score', t('core.score')], ['lives', t('core.lives')], ['best', t('core.best')]]);
    root.appendChild(st.el);
    var wordEl = el('div', 'big-readout'); root.appendChild(wordEl);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var row = el('div', 'row');
    var seenBtn = btn(W.seen, function () { answer(true); });
    var newBtn = btn(W.newW, function () { answer(false); }, true);
    row.appendChild(seenBtn); row.appendChild(newBtn);
    root.appendChild(row);
    var row2 = el('div', 'row'); row2.appendChild(btn(t('core.newGame'), start, true)); root.appendChild(row2);

    var all, seen, fresh, current, isSeen, score, lives, over;
    function start() {
      all = shuffle(WORDS5.concat(WORDS_LONG).slice());
      seen = []; fresh = all.slice();
      score = 0; lives = 3; over = false;
      msg.textContent = '';
      st.set('score', 0); st.set('lives', 3); st.set('best', getBest('verbal') || 0);
      next();
    }
    function next() {
      if (seen.length > 2 && (Math.random() < 0.5 || !fresh.length)) {
        current = pick(seen); isSeen = true;
      } else {
        current = fresh.pop(); isSeen = false;
        seen.push(current);
      }
      wordEl.textContent = current;
    }
    function answer(saidSeen) {
      if (over) return;
      if (saidSeen === isSeen) {
        score++; st.set('score', score); sfx('pop');
      } else {
        lives--; st.set('lives', lives); sfx('bad');
        if (lives <= 0) { end(); return; }
      }
      next();
    }
    function end() {
      over = true;
      msg.textContent = t('core.finalScore', { n: score });
      sfx('lose');
      setBest('verbal', score); award(Math.floor(score / 10));
      st.set('best', getBest('verbal'));
    }
    start();
  } });
})();

})();
