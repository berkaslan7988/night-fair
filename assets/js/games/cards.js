/* ============================================================
   Night Fair — CARDS & DICE pack (7 games)
   blackjack, hilo, war, videopoker, yahtzee, pig, golf
   ============================================================ */
'use strict';
(function () {

/* shared card helpers */
var SUITS = ['♠','♥','♦','♣'];
var RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function makeDeck() { var d = []; SUITS.forEach(function (s) { RANKS.forEach(function (r) { d.push({ r: r, s: s }); }); }); return shuffle(d); }
function cardVal(c) { if (c.r === 'A') return 11; if ('JQK'.indexOf(c.r) !== -1) return 10; return parseInt(c.r); }
function cardHTML(c, sel, back) {
  var red = c.s === '♥' || c.s === '♦';
  return '<div class="pcard' + (red ? ' red' : '') + (sel ? ' sel' : '') + (back ? ' back' : '') + '">' +
    (back ? '<div class="mid">?</div>' :
      '<div>' + c.r + c.s + '</div><div class="mid">' + c.s + '</div><div style="transform:rotate(180deg)">' + c.r + c.s + '</div>') +
    '</div>';
}
function smallCardHTML(c, sel, back) {
  var red = c.s === '♥' || c.s === '♦';
  return '<div class="pcard small' + (red ? ' red' : '') + (sel ? ' sel' : '') + (back ? ' back' : '') + '">' +
    (back ? '<div class="mid">?</div>' :
      '<div>' + c.r + c.s + '</div><div class="mid">' + c.s + '</div><div style="transform:rotate(180deg)">' + c.r + c.s + '</div>') +
    '</div>';
}
function handTotal(hand) {
  var t = 0, aces = 0;
  hand.forEach(function (c) { var v = cardVal(c); t += v; if (c.r === 'A') aces++; });
  while (t > 21 && aces > 0) { t -= 10; aces--; }
  return t;
}
function rankIndex(c) { return RANKS.indexOf(c.r); }

/* dice face characters */
var DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

/* ================= BLACKJACK ================= */
(function () {
  var STR = {
    en: { t: 'Blackjack', d: 'Classic 21 vs dealer. Hit, Stand, or Double Down.',
      hit: 'Hit', stand: 'Stand', dbl: 'Double', bet: 'Bet', dealer: 'Dealer', you: 'You',
      bust: 'Bust!', push: 'Push', bj: 'Blackjack!', chips: 'Chips', noTickets: 'Not enough tickets!' },
    tr: { t: 'Blackjack', d: 'Klasik 21. Kart çek, dur, veya ikiye katla.',
      hit: 'Çek', stand: 'Dur', dbl: 'İkiye Katla', bet: 'Bahis', dealer: 'Krupiye', you: 'Sen',
      bust: 'Battı!', push: 'Berabere', bj: 'Blackjack!', chips: 'Çip', noTickets: 'Yeterli bilet yok!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'blackjack', icon: '🃏', cat: 'cards', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['chips', W.chips], ['bet', W.bet], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var dealerRow = el('div', 'card-row'); dealerRow.id = 'bj-dealer';
    var dealerLabel = el('div', 'hint-line', W.dealer);
    var playerRow = el('div', 'card-row'); playerRow.id = 'bj-player';
    var playerLabel = el('div', 'hint-line', W.you);
    root.appendChild(dealerLabel); root.appendChild(dealerRow);
    root.appendChild(playerLabel); root.appendChild(playerRow);

    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var betRow = el('div', 'row');
    var btnBet10 = btn(W.bet + ' 10', function () { placeBet(10); });
    var btnBet25 = btn(W.bet + ' 25', function () { placeBet(25); });
    var btnBet50 = btn(W.bet + ' 50', function () { placeBet(50); });
    betRow.appendChild(btnBet10); betRow.appendChild(btnBet25); betRow.appendChild(btnBet50);
    root.appendChild(betRow);

    var actRow = el('div', 'row');
    var btnHit = btn(W.hit, doHit, true);
    var btnStand = btn(W.stand, doStand, true);
    var btnDbl = btn(W.dbl, doDouble, true);
    actRow.appendChild(btnHit); actRow.appendChild(btnStand); actRow.appendChild(btnDbl);
    root.appendChild(actRow);

    var chips, curBet, deck, pHand, dHand, phase; // phase: bet, play, done
    function reset() {
      chips = S.get('bj_chips', 500);
      phase = 'bet'; curBet = 0;
      pHand = []; dHand = []; deck = makeDeck();
      renderAll();
    }
    function renderAll() {
      st.set('chips', chips); st.set('bet', curBet); st.set('best', getBest('blackjack') || 0);
      dealerRow.innerHTML = ''; playerRow.innerHTML = '';
      dHand.forEach(function (c, i) {
        dealerRow.innerHTML += cardHTML(c, false, phase === 'play' && i === 1);
      });
      if (dHand.length && phase !== 'play') {
        dealerLabel.textContent = W.dealer + ' (' + handTotal(dHand) + ')';
      } else if (dHand.length && phase === 'play') {
        dealerLabel.textContent = W.dealer + ' (' + cardVal(dHand[0]) + '+?)';
      } else {
        dealerLabel.textContent = W.dealer;
      }
      pHand.forEach(function (c) { playerRow.innerHTML += cardHTML(c); });
      if (pHand.length) {
        playerLabel.textContent = W.you + ' (' + handTotal(pHand) + ')';
      } else {
        playerLabel.textContent = W.you;
      }
      betRow.style.display = phase === 'bet' ? 'flex' : 'none';
      actRow.style.display = phase === 'play' ? 'flex' : 'none';
      btnDbl.disabled = pHand.length !== 2 || tickets() < curBet;
    }
    function ensureDeck() { if (deck.length < 15) deck = makeDeck(); }
    function placeBet(amt) {
      if (phase !== 'bet') return;
      if (!spendTickets(amt)) { toast(W.noTickets); return; }
      curBet = amt; sfx('click');
      ensureDeck();
      pHand = [deck.pop(), deck.pop()];
      dHand = [deck.pop(), deck.pop()];
      msg.textContent = '';
      // Check natural blackjack
      if (handTotal(pHand) === 21) {
        phase = 'done'; endRound(); return;
      }
      phase = 'play';
      renderAll();
    }
    function doHit() {
      if (phase !== 'play') return;
      pHand.push(deck.pop()); sfx('tick');
      if (handTotal(pHand) >= 21) { phase = 'done'; endRound(); return; }
      renderAll();
    }
    function doStand() {
      if (phase !== 'play') return;
      phase = 'done'; sfx('click');
      dealerPlay();
    }
    function doDouble() {
      if (phase !== 'play' || pHand.length !== 2) return;
      if (!spendTickets(curBet)) { toast(W.noTickets); return; }
      curBet *= 2; sfx('click');
      pHand.push(deck.pop());
      phase = 'done';
      if (handTotal(pHand) > 21) { endRound(); return; }
      dealerPlay();
    }
    function dealerPlay() {
      while (handTotal(dHand) < 17) dHand.push(deck.pop());
      endRound();
    }
    function endRound() {
      var pt = handTotal(pHand), dt = handTotal(dHand);
      var pBJ = pHand.length === 2 && pt === 21;
      var dBJ = dHand.length === 2 && dt === 21;
      var winAmt = 0;
      if (pt > 21) {
        msg.textContent = W.bust; sfx('bad');
      } else if (pBJ && !dBJ) {
        winAmt = Math.floor(curBet * 2.5);
        msg.textContent = W.bj; sfx('win');
      } else if (dt > 21) {
        winAmt = curBet * 2;
        msg.textContent = t('core.youWin'); sfx('good');
      } else if (pt > dt) {
        winAmt = curBet * 2;
        msg.textContent = t('core.youWin'); sfx('good');
      } else if (pt === dt) {
        winAmt = curBet; // push, return bet
        msg.textContent = W.push; sfx('tick');
      } else {
        msg.textContent = t('core.youLose'); sfx('bad');
      }
      if (winAmt > 0) award(winAmt);
      chips = chips + winAmt - curBet; // track virtual chips
      if (chips < 0) chips = 0;
      S.set('bj_chips', chips);
      setBest('blackjack', chips);
      phase = 'bet'; curBet = 0;
      renderAll();
    }
    addKey(function (e) {
      if (phase === 'play') {
        if (e.key === 'h' || e.key === 'H') doHit();
        if (e.key === 's' || e.key === 'S') doStand();
        if (e.key === 'd' || e.key === 'D') doDouble();
      }
    });
    reset();
  } });
})();

/* ================= HIGH-LOW ================= */
(function () {
  var STR = {
    en: { t: 'High-Low', d: 'Guess if the next card is higher or lower. Build a streak!',
      hi: 'Higher', lo: 'Lower', right: 'Correct!', wrong: 'Wrong!' },
    tr: { t: 'Yüksek-Düşük', d: 'Sıradaki kart yüksek mi düşük mü? Seri yap!',
      hi: 'Yüksek', lo: 'Düşük', right: 'Doğru!', wrong: 'Yanlış!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'hilo', icon: '🔮', cat: 'cards', unit: 'streak', str: STR, init: function (root) {
    var st = stats([['streak', t('core.streak')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var row = el('div', 'card-row'); root.appendChild(row);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var actRow = el('div', 'row');
    var btnHi = btn('⬆ ' + W.hi, function () { guess('hi'); }, true);
    var btnLo = btn('⬇ ' + W.lo, function () { guess('lo'); }, true);
    actRow.appendChild(btnHi); actRow.appendChild(btnLo);
    root.appendChild(actRow);
    var newRow = el('div', 'row');
    newRow.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(newRow);

    var deck, current, streak, over;
    function reset() {
      deck = makeDeck(); current = deck.pop(); streak = 0; over = false;
      msg.textContent = '';
      render();
    }
    function render() {
      st.set('streak', streak); st.set('best', getBest('hilo') || 0);
      row.innerHTML = cardHTML(current);
      actRow.style.display = over ? 'none' : 'flex';
    }
    function guess(dir) {
      if (over || deck.length === 0) return;
      var next = deck.pop();
      var curRank = rankIndex(current), nextRank = rankIndex(next);
      var correct = (dir === 'hi' && nextRank >= curRank) || (dir === 'lo' && nextRank <= curRank);
      row.innerHTML = cardHTML(current) + ' → ' + cardHTML(next);
      if (correct) {
        streak++; sfx('good');
        msg.textContent = W.right + ' 🔥 ' + streak;
        current = next;
        after(function () { render(); }, 700);
      } else {
        over = true; sfx('lose');
        msg.textContent = W.wrong + ' ' + t('core.finalScore', { n: streak });
        setBest('hilo', streak);
        award(Math.floor(streak / 3));
        render();
      }
      st.set('streak', streak); st.set('best', getBest('hilo') || 0);
      if (deck.length === 0 && !over) {
        over = true; sfx('win');
        msg.textContent = t('core.youWin') + ' ' + t('core.finalScore', { n: streak });
        setBest('hilo', streak); award(streak);
      }
    }
    addKey(function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); guess('hi'); }
      if (e.key === 'ArrowDown') { e.preventDefault(); guess('lo'); }
      if (e.key === ' ' && over) { e.preventDefault(); reset(); }
    });
    reset();
  } });
})();

/* ================= WAR ================= */
(function () {
  var STR = {
    en: { t: 'Card War', d: 'Flip cards — higher wins. Ties go to war!',
      flip: 'Flip', war: '⚔ WAR!', you: 'You', bot: 'Bot', won: 'You win the battle!', lost: 'Bot wins the battle!' },
    tr: { t: 'Kart Savaşı', d: 'Kart çevir — büyük kazanır. Berabere = savaş!',
      flip: 'Çevir', war: '⚔ SAVAŞ!', you: 'Sen', bot: 'Bot', won: 'Savaşı kazandın!', lost: 'Bot savaşı kazandı!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'war', icon: '⚔️', cat: 'cards', unit: 'wins', str: STR, init: function (root) {
    var st = stats([['you', W.you], ['bot', W.bot], ['wins', t('core.wins')]]);
    root.appendChild(st.el);

    var area = el('div', 'center'); root.appendChild(area);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var actRow = el('div', 'row');
    var btnFlip = btn('🃏 ' + W.flip, doFlip, true);
    actRow.appendChild(btnFlip);
    actRow.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(actRow);

    var pDeck, bDeck, pScore, bScore, playing, totalWins;
    function reset() {
      var full = makeDeck();
      pDeck = full.slice(0, 26); bDeck = full.slice(26);
      pScore = 0; bScore = 0; playing = true;
      totalWins = getBest('war') || 0;
      msg.textContent = '';
      area.innerHTML = '<div class="card-row">' + cardHTML({ r: '?', s: '' }, false, true) +
        ' vs ' + cardHTML({ r: '?', s: '' }, false, true) + '</div>';
      updateStats();
    }
    function updateStats() {
      st.set('you', pScore); st.set('bot', bScore); st.set('wins', totalWins);
    }
    function doFlip() {
      if (!playing) return;
      if (pDeck.length === 0 || bDeck.length === 0) { endGame(); return; }
      battle([], []);
    }
    function battle(pPot, bPot) {
      if (pDeck.length === 0 || bDeck.length === 0) { endGame(); return; }
      var pc = pDeck.pop(), bc = bDeck.pop();
      pPot.push(pc); bPot.push(bc);
      var pv = rankIndex(pc), bv = rankIndex(bc);
      var html = '<div class="card-row">' + cardHTML(pc) + ' vs ' + cardHTML(bc) + '</div>';
      area.innerHTML = html;
      if (pv > bv) {
        pScore += pPot.length + bPot.length;
        msg.textContent = W.won; sfx('good');
      } else if (bv > pv) {
        bScore += pPot.length + bPot.length;
        msg.textContent = W.lost; sfx('bad');
      } else {
        // WAR! Place 3 face-down + 1 face-up
        msg.textContent = W.war; sfx('pop');
        var warCount = Math.min(3, pDeck.length, bDeck.length);
        for (var i = 0; i < warCount; i++) {
          pPot.push(pDeck.pop()); bPot.push(bDeck.pop());
        }
        after(function () { battle(pPot, bPot); }, 800);
        updateStats(); return;
      }
      updateStats();
      if (pDeck.length === 0 && bDeck.length === 0) endGame();
    }
    function endGame() {
      playing = false;
      if (pScore > bScore) {
        msg.textContent = t('core.youWin') + ' (' + pScore + '-' + bScore + ')';
        sfx('win');
        totalWins++;
        S.set('best_war', totalWins);
        award(5);
      } else if (bScore > pScore) {
        msg.textContent = t('core.botWins') + ' (' + bScore + '-' + pScore + ')';
        sfx('lose');
      } else {
        msg.textContent = t('core.draw'); sfx('tick');
      }
      updateStats();
    }
    addKey(function (e) {
      if (e.key === ' ') { e.preventDefault(); if (playing) doFlip(); else reset(); }
    });
    reset();
  } });
})();

/* ================= VIDEO POKER ================= */
(function () {
  var STR = {
    en: { t: 'Video Poker', d: 'Jacks or Better. Hold cards, draw once, win big.',
      deal: 'Deal', draw: 'Draw', hold: 'HOLD', bet: 'Bet',
      noTickets: 'Not enough tickets!',
      hands: {
        royalFlush: 'Royal Flush!', straightFlush: 'Straight Flush!', fourKind: 'Four of a Kind!',
        fullHouse: 'Full House!', flush: 'Flush!', straight: 'Straight!',
        threeKind: 'Three of a Kind!', twoPair: 'Two Pair!', jacksBetter: 'Jacks or Better!', nothing: 'No Win'
      }
    },
    tr: { t: 'Video Poker', d: 'Vale veya Üstü. Kartları tut, bir kez çek, büyük kazan.',
      deal: 'Dağıt', draw: 'Çek', hold: 'TUT', bet: 'Bahis',
      noTickets: 'Yeterli bilet yok!',
      hands: {
        royalFlush: 'Royal Flush!', straightFlush: 'Düz Renk!', fourKind: 'Dörtlü!',
        fullHouse: 'Full!', flush: 'Renk!', straight: 'Kent!',
        threeKind: 'Üçlü!', twoPair: 'İki Çift!', jacksBetter: 'Vale veya Üstü!', nothing: 'Kazanç Yok'
      }
    }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'videopoker', icon: '🎰', cat: 'cards', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['score', t('core.score')], ['best', t('core.best')]]);
    root.appendChild(st.el);

    // Payout table
    var payDiv = el('div', 'center');
    payDiv.innerHTML = '<table class="score-table" style="margin-bottom:14px;font-size:11px;">' +
      '<tr><td>Royal Flush</td><td class="num">250x</td></tr>' +
      '<tr><td>Straight Flush</td><td class="num">50x</td></tr>' +
      '<tr><td>Four of a Kind</td><td class="num">25x</td></tr>' +
      '<tr><td>Full House</td><td class="num">9x</td></tr>' +
      '<tr><td>Flush</td><td class="num">6x</td></tr>' +
      '<tr><td>Straight</td><td class="num">4x</td></tr>' +
      '<tr><td>Three of a Kind</td><td class="num">3x</td></tr>' +
      '<tr><td>Two Pair</td><td class="num">2x</td></tr>' +
      '<tr><td>Jacks or Better</td><td class="num">1x</td></tr>' +
      '</table>';
    root.appendChild(payDiv);

    var cardRow = el('div', 'card-row'); root.appendChild(cardRow);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var betRow = el('div', 'row');
    betRow.appendChild(btn(W.bet + ' 10', function () { startDeal(10); }));
    betRow.appendChild(btn(W.bet + ' 25', function () { startDeal(25); }));
    betRow.appendChild(btn(W.bet + ' 50', function () { startDeal(50); }));
    root.appendChild(betRow);

    var drawRow = el('div', 'row');
    var btnDraw = btn('🃏 ' + W.draw, doDraw, true);
    drawRow.appendChild(btnDraw);
    root.appendChild(drawRow);

    root.appendChild(el('div', 'hint-line', 'Click cards to hold/unhold'));

    var deck, hand, held, curBet, phase, score;
    function resetState() {
      phase = 'bet'; hand = []; held = [false, false, false, false, false]; curBet = 0;
      score = S.get('vp_score', 0);
      render();
    }
    function render() {
      st.set('score', score); st.set('best', getBest('videopoker') || 0);
      cardRow.innerHTML = '';
      hand.forEach(function (c, i) {
        var wrap = el('div', 'center');
        wrap.style.display = 'inline-block'; wrap.style.cursor = 'pointer';
        wrap.innerHTML = cardHTML(c, held[i]) + (held[i] ? '<div style="font-size:11px;color:var(--accent);font-weight:700;margin-top:2px;">' + W.hold + '</div>' : '');
        wrap.onclick = function () { toggleHold(i); };
        cardRow.appendChild(wrap);
      });
      betRow.style.display = phase === 'bet' ? 'flex' : 'none';
      drawRow.style.display = phase === 'hold' ? 'flex' : 'none';
    }
    function toggleHold(i) {
      if (phase !== 'hold') return;
      held[i] = !held[i]; sfx('click');
      render();
    }
    function startDeal(amt) {
      if (!spendTickets(amt)) { toast(W.noTickets); return; }
      curBet = amt; deck = makeDeck();
      hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
      held = [false, false, false, false, false];
      phase = 'hold'; msg.textContent = '';
      sfx('tick'); render();
    }
    function doDraw() {
      if (phase !== 'hold') return;
      for (var i = 0; i < 5; i++) {
        if (!held[i]) hand[i] = deck.pop();
      }
      phase = 'bet'; sfx('pop');
      var result = evalHand(hand);
      var winnings = result.mult * curBet;
      msg.textContent = result.name + (winnings > 0 ? ' +' + winnings : '');
      if (winnings > 0) {
        award(winnings); sfx('win');
        score += winnings;
      } else {
        sfx('bad');
      }
      S.set('vp_score', score);
      setBest('videopoker', score);
      held = [false, false, false, false, false];
      render();
    }
    function evalHand(h) {
      var ranks = h.map(function (c) { return RANKS.indexOf(c.r); }).sort(function (a, b) { return a - b; });
      var suits = h.map(function (c) { return c.s; });
      var isFlush = suits.every(function (s) { return s === suits[0]; });
      // Check straight
      var isStraight = false;
      var unique = ranks.filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (unique.length === 5) {
        if (unique[4] - unique[0] === 4) isStraight = true;
        // Ace-low straight: A 2 3 4 5 → indices 0,1,2,3,12
        if (unique[0] === 0 && unique[1] === 1 && unique[2] === 2 && unique[3] === 3 && unique[4] === 12) isStraight = true;
      }
      // Count ranks
      var counts = {};
      ranks.forEach(function (r) { counts[r] = (counts[r] || 0) + 1; });
      var vals = Object.keys(counts).map(function (k) { return counts[k]; }).sort(function (a, b) { return b - a; });

      // Royal flush
      if (isFlush && isStraight && ranks[0] === 8) return { name: W.hands.royalFlush, mult: 250 };
      if (isFlush && isStraight) return { name: W.hands.straightFlush, mult: 50 };
      if (vals[0] === 4) return { name: W.hands.fourKind, mult: 25 };
      if (vals[0] === 3 && vals[1] === 2) return { name: W.hands.fullHouse, mult: 9 };
      if (isFlush) return { name: W.hands.flush, mult: 6 };
      if (isStraight) return { name: W.hands.straight, mult: 4 };
      if (vals[0] === 3) return { name: W.hands.threeKind, mult: 3 };
      if (vals[0] === 2 && vals[1] === 2) return { name: W.hands.twoPair, mult: 2 };
      if (vals[0] === 2) {
        // Jacks or better — pair rank must be J(9), Q(10), K(11), A(12)
        var pairRank = parseInt(Object.keys(counts).filter(function (k) { return counts[k] === 2; })[0]);
        if (pairRank >= 9 || pairRank === 0) return { name: W.hands.jacksBetter, mult: 1 };
        // Note: A is index 0, which counts as high
      }
      return { name: W.hands.nothing, mult: 0 };
    }
    addKey(function (e) {
      if (phase === 'hold') {
        var n = parseInt(e.key);
        if (n >= 1 && n <= 5) { toggleHold(n - 1); e.preventDefault(); }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doDraw(); }
      }
    });
    resetState();
  } });
})();

/* ================= YAHTZEE ================= */
(function () {
  var STR = {
    en: { t: 'Yahtzee', d: '5 dice, 3 rolls, 13 rounds. Pick your categories wisely.',
      roll: 'Roll', rollsLeft: 'Rolls left', total: 'Total',
      cats: {
        ones: 'Ones', twos: 'Twos', threes: 'Threes', fours: 'Fours', fives: 'Fives', sixes: 'Sixes',
        threeKind: '3 of a Kind', fourKind: '4 of a Kind', fullHouse: 'Full House',
        smStraight: 'Sm Straight', lgStraight: 'Lg Straight', yahtzee: 'Yahtzee', chance: 'Chance',
        upperBonus: 'Upper Bonus (63+)'
      }
    },
    tr: { t: 'Yahtzee', d: '5 zar, 3 atış, 13 tur. Kategorileri akıllıca seç.',
      roll: 'At', rollsLeft: 'Kalan atış', total: 'Toplam',
      cats: {
        ones: 'Birler', twos: 'İkiler', threes: 'Üçler', fours: 'Dörtler', fives: 'Beşler', sixes: 'Altılar',
        threeKind: '3lü', fourKind: '4lü', fullHouse: 'Full',
        smStraight: 'K. Kent', lgStraight: 'B. Kent', yahtzee: 'Yahtzee', chance: 'Şans',
        upperBonus: 'Üst Bonus (63+)'
      }
    }
  };
  var W = STR[NF.lang] || STR.en;
  var CAT_KEYS = ['ones','twos','threes','fours','fives','sixes',
                  'threeKind','fourKind','fullHouse','smStraight','lgStraight','yahtzee','chance'];
  Games.register({ id: 'yahtzee', icon: '🎲', cat: 'cards', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['round', t('core.round')], ['total', W.total], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var diceRow = el('div', 'row'); root.appendChild(diceRow);
    var rollInfo = el('div', 'hint-line'); root.appendChild(rollInfo);
    var rollRow = el('div', 'row');
    var btnRoll = btn('🎲 ' + W.roll, doRoll, true);
    rollRow.appendChild(btnRoll);
    root.appendChild(rollRow);

    var tableWrap = el('div', 'center');
    var table = el('table', 'score-table');
    tableWrap.appendChild(table);
    root.appendChild(tableWrap);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var newRow = el('div', 'row');
    newRow.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(newRow);

    var dice, held, rollsLeft, scores, roundNum, over;

    function reset() {
      dice = [0, 0, 0, 0, 0]; held = [false, false, false, false, false];
      rollsLeft = 3; scores = {}; roundNum = 0; over = false;
      msg.textContent = '';
      render();
    }
    function doRoll() {
      if (over || rollsLeft <= 0) return;
      if (roundNum === 0 || rollsLeft === 3) {
        roundNum++;
        held = [false, false, false, false, false];
      }
      for (var i = 0; i < 5; i++) {
        if (!held[i]) dice[i] = rnd(6) + 1;
      }
      rollsLeft--; sfx('tick');
      render();
    }
    function toggleDie(i) {
      if (rollsLeft === 3 || rollsLeft <= 0 || dice[i] === 0) return;
      held[i] = !held[i]; sfx('click');
      render();
    }
    function calcScore(cat, d) {
      var sum = d.reduce(function (a, b) { return a + b; }, 0);
      var counts = [0, 0, 0, 0, 0, 0, 0]; // index 1-6
      d.forEach(function (v) { counts[v]++; });
      var maxC = Math.max.apply(null, counts.slice(1));
      var vals = d.slice().sort();

      switch (cat) {
        case 'ones': return counts[1] * 1;
        case 'twos': return counts[2] * 2;
        case 'threes': return counts[3] * 3;
        case 'fours': return counts[4] * 4;
        case 'fives': return counts[5] * 5;
        case 'sixes': return counts[6] * 6;
        case 'threeKind': return maxC >= 3 ? sum : 0;
        case 'fourKind': return maxC >= 4 ? sum : 0;
        case 'fullHouse':
          var has3 = counts.indexOf(3, 1) !== -1;
          var has2 = counts.indexOf(2, 1) !== -1;
          return (has3 && has2) ? 25 : 0;
        case 'smStraight':
          var s = vals.filter(function (v, i, a) { return a.indexOf(v) === i; }).join('');
          return (s.indexOf('1234') !== -1 || s.indexOf('2345') !== -1 || s.indexOf('3456') !== -1) ? 30 : 0;
        case 'lgStraight':
          var u = vals.filter(function (v, i, a) { return a.indexOf(v) === i; });
          return (u.length === 5 && u[4] - u[0] === 4) ? 40 : 0;
        case 'yahtzee': return maxC === 5 ? 50 : 0;
        case 'chance': return sum;
        default: return 0;
      }
    }
    function pickCategory(cat) {
      if (over || scores[cat] !== undefined || dice[0] === 0) return;
      scores[cat] = calcScore(cat, dice);
      sfx('good');
      rollsLeft = 3; held = [false, false, false, false, false]; dice = [0, 0, 0, 0, 0];
      if (Object.keys(scores).length >= 13) {
        endGame();
      }
      render();
    }
    function totalScore() {
      var t = 0;
      CAT_KEYS.forEach(function (k) { if (scores[k] !== undefined) t += scores[k]; });
      // Upper bonus
      var upper = 0;
      ['ones','twos','threes','fours','fives','sixes'].forEach(function (k) {
        if (scores[k] !== undefined) upper += scores[k];
      });
      if (upper >= 63) t += 35;
      return t;
    }
    function endGame() {
      over = true;
      var total = totalScore();
      msg.textContent = t('core.gameOver') + ' ' + t('core.finalScore', { n: total });
      setBest('yahtzee', total); award(Math.floor(total / 50));
      sfx(total >= 200 ? 'win' : 'lose');
    }
    function render() {
      st.set('round', Math.min(roundNum, 13) + '/13');
      st.set('total', totalScore()); st.set('best', getBest('yahtzee') || 0);

      diceRow.innerHTML = '';
      for (var i = 0; i < 5; i++) {
        var d = el('div', 'die' + (held[i] ? ' held' : ''));
        d.textContent = dice[i] > 0 ? DICE_FACES[dice[i]] : '·';
        d.dataset.idx = i;
        d.onclick = (function (idx) { return function () { toggleDie(idx); }; })(i);
        diceRow.appendChild(d);
      }
      rollInfo.textContent = W.rollsLeft + ': ' + rollsLeft;
      btnRoll.disabled = rollsLeft <= 0 || over;

      // Build scorecard table
      table.innerHTML = '';
      var upperTotal = 0;
      CAT_KEYS.forEach(function (cat, ci) {
        var tr = document.createElement('tr');
        var used = scores[cat] !== undefined;
        var potential = dice[0] > 0 && !used ? calcScore(cat, dice) : '';
        tr.className = used ? 'used' : (dice[0] > 0 && rollsLeft < 3 ? 'pick' : '');
        tr.innerHTML = '<td>' + W.cats[cat] + '</td><td class="num">' +
          (used ? scores[cat] : (potential !== '' ? '<span style="opacity:.5">' + potential + '</span>' : '—')) + '</td>';
        if (!used && dice[0] > 0 && rollsLeft < 3) {
          tr.onclick = (function (c) { return function () { pickCategory(c); }; })(cat);
          tr.style.cursor = 'pointer';
        }
        table.appendChild(tr);
        if (ci <= 5 && used) upperTotal += scores[cat];
        if (ci === 5) {
          // Upper bonus row
          var btr = document.createElement('tr');
          btr.className = 'used';
          btr.innerHTML = '<td>' + W.cats.upperBonus + '</td><td class="num">' + (upperTotal >= 63 ? '+35' : upperTotal + '/63') + '</td>';
          table.appendChild(btr);
        }
      });
      // Total row
      var totalTr = document.createElement('tr');
      totalTr.innerHTML = '<td><strong>' + W.total + '</strong></td><td class="num"><strong>' + totalScore() + '</strong></td>';
      table.appendChild(totalTr);
    }
    addKey(function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (over) reset(); else doRoll(); }
      var n = parseInt(e.key);
      if (n >= 1 && n <= 5) { e.preventDefault(); toggleDie(n - 1); }
    });
    reset();
  } });
})();

/* ================= PIG DICE ================= */
(function () {
  var STR = {
    en: { t: 'Pig', d: 'Roll to score, but roll a 1 and lose your turn. First to 100 wins!',
      roll: 'Roll', bank: 'Bank', turnScore: 'Turn', pigged: 'Rolled a 1! Turn lost!',
      you: 'You', bot: 'Bot', botBanks: 'Bot banks {n}!' },
    tr: { t: 'Domuz', d: 'At ve puan topla, ama 1 gelirse tur puanın yanar. 100\'e ilk ulaşan kazanır!',
      roll: 'At', bank: 'Kaydet', turnScore: 'Tur', pigged: '1 geldi! Tur kaybedildi!',
      you: 'Sen', bot: 'Bot', botBanks: 'Bot {n} kaydetti!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'pig', icon: '🐷', cat: 'cards', unit: 'wins', str: STR, init: function (root) {
    var st = stats([['you', W.you], ['bot', W.bot], ['turn', W.turnScore], ['wins', t('core.wins')]]);
    root.appendChild(st.el);

    var dieEl = el('div', 'center');
    dieEl.style.margin = '18px 0';
    root.appendChild(dieEl);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var actRow = el('div', 'row');
    var btnRollPig = btn('🎲 ' + W.roll, doRoll, true);
    var btnBank = btn('💰 ' + W.bank, doBank, true);
    actRow.appendChild(btnRollPig); actRow.appendChild(btnBank);
    root.appendChild(actRow);
    var newRow = el('div', 'row');
    newRow.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(newRow);

    var pTotal, bTotal, turnScore, myTurn, over, totalWins, curDie;
    function reset() {
      pTotal = 0; bTotal = 0; turnScore = 0; myTurn = true; over = false; curDie = 0;
      totalWins = getBest('pig') || 0;
      msg.textContent = '';
      render();
    }
    function render() {
      st.set('you', pTotal); st.set('bot', bTotal);
      st.set('turn', myTurn ? turnScore : '—');
      st.set('wins', totalWins);
      dieEl.innerHTML = curDie > 0 ? '<div class="die" style="font-size:44px;width:72px;height:72px;">' + DICE_FACES[curDie] + '</div>' : '';
      btnRollPig.disabled = !myTurn || over;
      btnBank.disabled = !myTurn || over || turnScore === 0;
    }
    function doRoll() {
      if (!myTurn || over) return;
      curDie = rnd(6) + 1; sfx('tick');
      if (curDie === 1) {
        turnScore = 0;
        msg.textContent = W.pigged; sfx('bad');
        render();
        myTurn = false;
        after(function () { botTurn(); }, 1000);
      } else {
        turnScore += curDie;
        msg.textContent = '';
        if (pTotal + turnScore >= 100) { doBank(); return; }
        render();
      }
    }
    function doBank() {
      if (!myTurn || over) return;
      pTotal += turnScore; turnScore = 0; sfx('good');
      msg.textContent = '';
      if (pTotal >= 100) {
        over = true;
        msg.textContent = t('core.youWin');
        sfx('win');
        totalWins++;
        S.set('best_pig', totalWins);
        award(8);
        render(); return;
      }
      myTurn = false;
      render();
      after(function () { botTurn(); }, 600);
    }
    function botTurn() {
      if (over) return;
      msg.textContent = t('core.botTurn');
      var botTurnScore = 0;
      function botStep() {
        if (over) return;
        curDie = rnd(6) + 1; sfx('tick');
        if (curDie === 1) {
          botTurnScore = 0;
          msg.textContent = W.pigged; sfx('pop');
          myTurn = true;
          render();
          return;
        }
        botTurnScore += curDie;
        render();
        if (bTotal + botTurnScore >= 100) {
          bTotal += botTurnScore;
          over = true;
          msg.textContent = t('core.botWins');
          sfx('lose');
          render(); return;
        }
        // Bot strategy: bank if turnScore >= 20 or close to winning
        if (botTurnScore >= 20 || bTotal + botTurnScore >= 100) {
          bTotal += botTurnScore;
          msg.textContent = W.botBanks.replace('{n}', botTurnScore);
          sfx('click');
          myTurn = true;
          render();
          return;
        }
        after(botStep, 600);
      }
      after(botStep, 600);
    }
    addKey(function (e) {
      if (e.key === ' ' || e.key === 'r' || e.key === 'R') { e.preventDefault(); doRoll(); }
      if (e.key === 'b' || e.key === 'B' || e.key === 'Enter') { e.preventDefault(); doBank(); }
    });
    reset();
  } });
})();

/* ================= GOLF SOLITAIRE ================= */
(function () {
  var STR = {
    en: { t: 'Golf Solitaire', d: '7 columns, 5 cards each. Play ±1 from the waste pile. Clear the board!',
      stock: 'Stock', cleared: 'Cleared', remaining: 'Left', draw: 'Draw' },
    tr: { t: 'Golf Solitaire', d: '7 sütun, 5 kart. Çöp yığınından ±1 oyna. Tahtayı temizle!',
      stock: 'Stok', cleared: 'Temizlenen', remaining: 'Kalan', draw: 'Çek' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'golf', icon: '⛳', cat: 'cards', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['cleared', W.cleared], ['remaining', W.remaining], ['stock', W.stock], ['best', t('core.best')]]);
    root.appendChild(st.el);

    var tableArea = el('div', 'center'); root.appendChild(tableArea);
    var wasteArea = el('div', 'card-row'); wasteArea.style.marginTop = '14px'; root.appendChild(wasteArea);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var actRow = el('div', 'row');
    var btnDrawGolf = btn('🃏 ' + W.draw, drawFromStock, true);
    actRow.appendChild(btnDrawGolf);
    actRow.appendChild(btn(t('core.newGame'), reset, true));
    root.appendChild(actRow);

    var columns, stock, waste, over, cleared;
    function reset() {
      var deck = makeDeck();
      columns = [];
      for (var i = 0; i < 7; i++) {
        var col = [];
        for (var j = 0; j < 5; j++) col.push(deck.pop());
        columns.push(col);
      }
      stock = deck; // remaining cards
      waste = [stock.pop()]; // flip first to waste
      over = false; cleared = 0;
      msg.textContent = '';
      render();
    }
    function canPlay(card) {
      if (!waste.length) return false;
      var topRank = rankIndex(waste[waste.length - 1]);
      var cardRank = rankIndex(card);
      // ±1 with wrap (K-A allowed)
      var diff = Math.abs(topRank - cardRank);
      return diff === 1 || diff === 12;
    }
    function playCard(colIdx) {
      if (over) return;
      var col = columns[colIdx];
      if (col.length === 0) return;
      var card = col[col.length - 1];
      if (!canPlay(card)) { sfx('bad'); return; }
      waste.push(col.pop());
      cleared++; sfx('pop');
      checkWin();
      render();
    }
    function drawFromStock() {
      if (over || stock.length === 0) return;
      waste.push(stock.pop()); sfx('tick');
      checkWin();
      render();
    }
    function checkWin() {
      var remaining = 0;
      columns.forEach(function (col) { remaining += col.length; });
      if (remaining === 0) {
        over = true;
        msg.textContent = t('core.youWin') + ' 🎉';
        sfx('win');
        setBest('golf', cleared);
        award(15);
        return;
      }
      // Check if any moves left
      if (stock.length === 0) {
        var anyPlay = false;
        columns.forEach(function (col) {
          if (col.length > 0 && canPlay(col[col.length - 1])) anyPlay = true;
        });
        if (!anyPlay) {
          over = true;
          msg.textContent = t('core.gameOver') + ' ' + t('core.finalScore', { n: cleared });
          sfx('lose');
          setBest('golf', cleared);
          award(Math.floor(cleared / 5));
        }
      }
    }
    function render() {
      var remaining = 0;
      columns.forEach(function (col) { remaining += col.length; });
      st.set('cleared', cleared); st.set('remaining', remaining);
      st.set('stock', stock.length); st.set('best', getBest('golf') || 0);

      // Build tableau
      tableArea.innerHTML = '';
      var grid = el('div', '');
      grid.style.display = 'flex';
      grid.style.gap = '6px';
      grid.style.justifyContent = 'center';
      grid.style.flexWrap = 'wrap';
      columns.forEach(function (col, ci) {
        var colDiv = el('div', '');
        colDiv.style.display = 'flex';
        colDiv.style.flexDirection = 'column';
        colDiv.style.alignItems = 'center';
        colDiv.style.gap = '0';
        if (col.length === 0) {
          colDiv.innerHTML = '<div class="pcard small back" style="opacity:.15"><div class="mid">·</div></div>';
        } else {
          col.forEach(function (card, ri) {
            var isTop = ri === col.length - 1;
            var wrapper = el('div', '');
            if (ri > 0) wrapper.style.marginTop = '-42px';
            if (isTop) {
              var playable = canPlay(card);
              wrapper.innerHTML = smallCardHTML(card, playable);
              wrapper.style.cursor = playable ? 'pointer' : 'default';
              if (playable) {
                wrapper.onclick = (function (idx) { return function () { playCard(idx); }; })(ci);
              }
            } else {
              wrapper.innerHTML = smallCardHTML(card, false);
              wrapper.style.opacity = '0.6';
            }
            colDiv.appendChild(wrapper);
          });
        }
        grid.appendChild(colDiv);
      });
      tableArea.appendChild(grid);

      // Waste pile
      wasteArea.innerHTML = '';
      if (waste.length > 0) {
        wasteArea.innerHTML = '<span style="color:var(--text-dim);font-size:12px;margin-right:6px;">Waste:</span>' +
          cardHTML(waste[waste.length - 1]);
      }
      btnDrawGolf.disabled = stock.length === 0 || over;
    }
    addKey(function (e) {
      if (e.key === ' ' || e.key === 'd' || e.key === 'D') { e.preventDefault(); drawFromStock(); }
      var n = parseInt(e.key);
      if (n >= 1 && n <= 7) { e.preventDefault(); playCard(n - 1); }
    });
    reset();
  } });
})();

})();
