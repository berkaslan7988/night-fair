/* ============================================================
   Night Fair — CARNIVAL pack (6 games)
   wheel, slots, plinko, striker, ducks, horserace
   All carnival games use the ticket economy.
   ============================================================ */
'use strict';
(function () {

var C_BG = '#150F28', C_ACC = '#F2A93B', C_PINK = '#FF6F91', C_GRN = '#6FCF97',
    C_TXT = '#F5F0FF', C_DIM = '#B8AEDB', C_BLUE = '#6FA8DC', C_SURF = '#2E2454';
function overlay(ctx, w, h, text, sub) {
  ctx.fillStyle = 'rgba(21,15,40,0.78)'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = C_TXT; ctx.font = '700 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(text, w / 2, h / 2 - 6);
  if (sub) { ctx.font = '13px Inter, sans-serif'; ctx.fillStyle = C_DIM; ctx.fillText(sub, w / 2, h / 2 + 22); }
  ctx.textAlign = 'left';
}

var COST = 5;

function ticketGate(msg) {
  var tk = tickets();
  if (tk >= COST) return true;
  msg.textContent = '🎟 ' + (NF.lang === 'tr'
    ? 'Bilet yetersiz! Diğer oyunları oynayarak bilet kazan.'
    : 'Not enough tickets! Play other games to earn some.');
  sfx('bad');
  return false;
}

/* ================= WHEEL ================= */
(function () {
  var STR = {
    en: { t: 'Spinning Wheel', d: 'Spend 5 tickets to spin the wheel for prizes!', spin: 'Spin! (5🎟)', won: 'You won {n} tickets!' },
    tr: { t: 'Çark-ı Felek', d: '5 bilet harca, çarkı çevir, ödül kazan!', spin: 'Çevir! (5🎟)', won: '{n} bilet kazandın!' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'wheel', icon: '🎡', cat: 'carnival', unit: 'pts', str: STR, init: function (root) {
    var SZ = 320, HALF = SZ / 2, SLICES = 8;
    var PRIZES = [0, 5, 10, 15, 20, 25, 50, 100];
    var COLORS = [C_SURF, C_BLUE, C_GRN, C_ACC, C_PINK, '#B57EDC', '#FFD966', '#F2914A'];
    var ARC = Math.PI * 2 / SLICES;

    var st = stats([['won', t('core.score')], ['best', t('core.best')], ['tk', '🎟']]);
    root.appendChild(st.el);

    var wrap = el('div', 'wheel-wrap');
    var pointer = el('div', 'wheel-pointer', '▼');
    wrap.appendChild(pointer);
    var c = makeCanvas(SZ, SZ);
    wrap.appendChild(c.cv);
    root.appendChild(wrap);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var spinBtn;
    var row = el('div', 'row');
    spinBtn = btn(W.spin, doSpin, false);
    row.appendChild(spinBtn);
    root.appendChild(row);

    var angle = 0, spinning = false, spinVel = 0, totalWon = 0;

    function updateStats() {
      st.set('won', totalWon);
      st.set('best', getBest('wheel') || 0);
      st.set('tk', tickets());
    }

    function doSpin() {
      if (spinning) return;
      if (!ticketGate(msg)) return;
      spendTickets(COST);
      msg.textContent = '';
      spinning = true;
      spinBtn.disabled = true;
      spinVel = 14 + Math.random() * 10;
      sfx('click');
      updateStats();
    }

    function drawWheel() {
      var ctx = c.ctx;
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, SZ, SZ);
      ctx.save();
      ctx.translate(HALF, HALF);
      ctx.rotate(angle);
      for (var i = 0; i < SLICES; i++) {
        var a0 = i * ARC - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, HALF - 8, a0, a0 + ARC);
        ctx.closePath();
        ctx.fillStyle = COLORS[i];
        ctx.fill();
        ctx.strokeStyle = C_BG; ctx.lineWidth = 2; ctx.stroke();
        // label
        ctx.save();
        ctx.rotate(a0 + ARC / 2);
        ctx.fillStyle = C_TXT; ctx.font = '700 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(PRIZES[i] === 0 ? '💨' : PRIZES[i] + '🎟', HALF * 0.6, 5);
        ctx.restore();
      }
      // center
      ctx.beginPath(); ctx.arc(0, 0, 18, 0, 7);
      ctx.fillStyle = C_BG; ctx.fill();
      ctx.strokeStyle = C_ACC; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    }

    loop(function (dt) {
      if (spinning) {
        angle += spinVel * dt;
        spinVel *= Math.pow(0.97, dt * 60);
        if (spinVel > 2) { sfx('tick'); }
        if (spinVel < 0.15) {
          spinning = false;
          spinBtn.disabled = false;
          // determine winning slice: pointer at top (angle measured from -PI/2)
          var norm = (((-angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
          var idx = Math.floor(norm / ARC) % SLICES;
          var prize = PRIZES[idx];
          if (prize > 0) {
            award(prize);
            totalWon += prize;
            msg.textContent = W.won.replace('{n}', prize);
            sfx(prize >= 50 ? 'win' : 'good');
          } else {
            msg.textContent = NF.lang === 'tr' ? 'Boş çıktı! Tekrar dene.' : 'No prize! Try again.';
            sfx('bad');
          }
          setBest('wheel', totalWon);
          updateStats();
        }
      }
      drawWheel();
    });
    updateStats();
  } });
})();

/* ================= SLOTS ================= */
(function () {
  var STR = {
    en: { t: 'Slot Machine', d: 'Spend 5 tickets to pull the lever. Match symbols!', pull: 'Pull! (5🎟)', jackpot: '💎 JACKPOT! +{n}🎟', triple: '🎉 Triple match! +{n}🎟', double: 'Double! +{n}🎟', nope: 'No match. Try again!' },
    tr: { t: 'Slot Makinesi', d: '5 bilet harca, kolu çek, sembolleri eşleştir!', pull: 'Çek! (5🎟)', jackpot: '💎 BÜYÜK ÖDÜL! +{n}🎟', triple: '🎉 Üçlü eşleşme! +{n}🎟', double: 'İkili! +{n}🎟', nope: 'Eşleşme yok. Tekrar dene!' }
  };
  var W = STR[NF.lang] || STR.en;
  var SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎'];
  Games.register({ id: 'slots', icon: '🎰', cat: 'carnival', unit: 'pts', str: STR, init: function (root) {
    var st = stats([['won', t('core.score')], ['best', t('core.best')], ['tk', '🎟']]);
    root.appendChild(st.el);

    var sw = el('div', 'slot-window');
    var reels = [];
    for (var i = 0; i < 3; i++) {
      var r = el('div', 'slot-reel');
      r.textContent = SYMBOLS[rnd(SYMBOLS.length)];
      sw.appendChild(r);
      reels.push(r);
    }
    root.appendChild(sw);

    var msg = el('div', 'game-msg'); root.appendChild(msg);
    var pullBtn;
    var row = el('div', 'row');
    pullBtn = btn(W.pull, doPull, false);
    row.appendChild(pullBtn);
    root.appendChild(row);

    var totalWon = 0, spinning = false;
    var spinTimers = [];
    var finalSymbols = [];

    function updateStats() {
      st.set('won', totalWon);
      st.set('best', getBest('slots') || 0);
      st.set('tk', tickets());
    }

    function doPull() {
      if (spinning) return;
      if (!ticketGate(msg)) return;
      spendTickets(COST);
      msg.textContent = '';
      spinning = true;
      pullBtn.disabled = true;
      sfx('click');
      updateStats();

      // pre-decide results
      for (var i = 0; i < 3; i++) {
        finalSymbols[i] = pick(SYMBOLS);
      }

      // spin each reel with staggered stops
      for (var j = 0; j < 3; j++) {
        (function (idx) {
          reels[idx].classList.add('spin');
          var flickId = every(function () {
            reels[idx].textContent = pick(SYMBOLS);
          }, 80);
          spinTimers.push(flickId);
          after(function () {
            clearInterval(flickId);
            reels[idx].classList.remove('spin');
            reels[idx].textContent = finalSymbols[idx];
            sfx('tick');
            if (idx === 2) resolveResult();
          }, 600 + idx * 500);
        })(j);
      }
    }

    function resolveResult() {
      spinning = false;
      pullBtn.disabled = false;
      var a = finalSymbols[0], b = finalSymbols[1], c = finalSymbols[2];
      var prize = 0;
      if (a === b && b === c) {
        if (a === '💎') {
          prize = 200;
          msg.textContent = W.jackpot.replace('{n}', prize);
          sfx('win');
        } else {
          prize = 50;
          msg.textContent = W.triple.replace('{n}', prize);
          sfx('win');
        }
      } else if (a === b || b === c || a === c) {
        prize = 10;
        msg.textContent = W.double.replace('{n}', prize);
        sfx('good');
      } else {
        msg.textContent = W.nope;
        sfx('bad');
      }
      if (prize > 0) {
        award(prize);
        totalWon += prize;
      }
      setBest('slots', totalWon);
      updateStats();
    }

    updateStats();
  } });
})();

/* ================= PLINKO ================= */
(function () {
  var STR = {
    en: { t: 'Plinko', d: 'Drop the ball and watch it bounce! Spend 5 tickets.', drop: 'Drop! (5🎟)' },
    tr: { t: 'Plinko', d: 'Topu bırak, sektir, ödül kazan! 5 bilet harcanır.', drop: 'Bırak! (5🎟)' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'plinko', icon: '📌', cat: 'carnival', unit: 'pts', str: STR, init: function (root) {
    var WI = 360, HE = 480;
    var ROWS = 10, COLS = 11;
    var PEG_R = 4, BALL_R = 8;
    var SPACING_X = WI / (COLS + 1);
    var SPACING_Y = (HE - 100) / (ROWS + 1);
    var TOP_Y = 50;
    var BUCKETS = [10, 3, 2, 1, 0.5, 0.5, 0.5, 1, 2, 3, 10];
    var BUCKET_COLORS = [C_PINK, C_ACC, '#FFD966', C_GRN, C_BLUE, C_SURF, C_BLUE, C_GRN, '#FFD966', C_ACC, C_PINK];

    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['won', t('core.score')], ['best', t('core.best')], ['tk', '🎟']]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    // Position chooser
    var hint = el('div', 'hint-line', NF.lang === 'tr' ? '← → ile konum seç' : '← → to choose position');
    root.appendChild(hint);

    var dropBtn;
    var row = el('div', 'row');
    dropBtn = btn(W.drop, doDrop, false);
    row.appendChild(dropBtn);
    root.appendChild(row);

    var pegs = [];
    for (var r = 0; r < ROWS; r++) {
      var cols = r % 2 === 0 ? COLS : COLS - 1;
      var offsetX = r % 2 === 0 ? SPACING_X : SPACING_X * 1.5;
      for (var cc = 0; cc < cols; cc++) {
        pegs.push({ x: offsetX + cc * SPACING_X, y: TOP_Y + (r + 1) * SPACING_Y });
      }
    }

    var ball = null, totalWon = 0, dropX = WI / 2;

    function updateStats() {
      st.set('won', totalWon);
      st.set('best', getBest('plinko') || 0);
      st.set('tk', tickets());
    }

    addKey(function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); dropX = clamp(dropX - 15, SPACING_X, WI - SPACING_X); }
      if (e.key === 'ArrowRight') { e.preventDefault(); dropX = clamp(dropX + 15, SPACING_X, WI - SPACING_X); }
      if (e.key === ' ' && !ball) { e.preventDefault(); doDrop(); }
    });
    c.cv.addEventListener('pointermove', function (e) {
      if (!ball) { dropX = clamp(canvasPos(c.cv, WI, HE, e).x, SPACING_X, WI - SPACING_X); }
    });
    c.cv.addEventListener('pointerdown', function (e) {
      if (!ball) {
        dropX = clamp(canvasPos(c.cv, WI, HE, e).x, SPACING_X, WI - SPACING_X);
        doDrop();
      }
    });

    function doDrop() {
      if (ball) return;
      if (!ticketGate(msg)) return;
      spendTickets(COST);
      msg.textContent = '';
      sfx('click');
      ball = { x: dropX, y: 16, vx: 0, vy: 0 };
      dropBtn.disabled = true;
      updateStats();
    }

    var GRAVITY = 580;
    var DAMPING = 0.55;
    var BUCKET_Y = TOP_Y + (ROWS + 1) * SPACING_Y + 20;

    loop(function (dt) {
      // physics
      if (ball) {
        ball.vy += GRAVITY * dt;
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;

        // bounce off pegs
        for (var p = 0; p < pegs.length; p++) {
          var peg = pegs[p];
          var dx = ball.x - peg.x, dy = ball.y - peg.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var minD = PEG_R + BALL_R;
          if (dist < minD && dist > 0) {
            var nx = dx / dist, ny = dy / dist;
            ball.x = peg.x + nx * minD;
            ball.y = peg.y + ny * minD;
            var dot = ball.vx * nx + ball.vy * ny;
            ball.vx -= 2 * dot * nx;
            ball.vy -= 2 * dot * ny;
            ball.vx *= DAMPING;
            ball.vy *= DAMPING;
            // add random nudge
            ball.vx += (Math.random() - 0.5) * 60;
            sfx('tick');
          }
        }

        // walls
        if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx) * 0.5; }
        if (ball.x > WI - BALL_R) { ball.x = WI - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.5; }

        // reached bottom
        if (ball.y >= BUCKET_Y) {
          var bucketW = WI / BUCKETS.length;
          var bi = clamp(Math.floor(ball.x / bucketW), 0, BUCKETS.length - 1);
          var mult = BUCKETS[bi];
          var prize = Math.round(COST * mult);
          if (prize > 0) {
            award(prize);
            totalWon += prize;
            msg.textContent = mult + 'x → +' + prize + ' 🎟';
            sfx(mult >= 5 ? 'win' : mult >= 2 ? 'good' : 'pop');
          } else {
            msg.textContent = mult + 'x → 0 🎟';
            sfx('bad');
          }
          setBest('plinko', totalWon);
          ball = null;
          dropBtn.disabled = false;
          updateStats();
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // drop position indicator
      if (!ball) {
        ctx.fillStyle = C_ACC; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.arc(dropX, 16, BALL_R, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        // draw arrow
        ctx.fillStyle = C_ACC;
        ctx.beginPath();
        ctx.moveTo(dropX, 28);
        ctx.lineTo(dropX - 5, 22);
        ctx.lineTo(dropX + 5, 22);
        ctx.closePath();
        ctx.fill();
      }

      // pegs
      ctx.fillStyle = C_DIM;
      for (var p2 = 0; p2 < pegs.length; p2++) {
        ctx.beginPath(); ctx.arc(pegs[p2].x, pegs[p2].y, PEG_R, 0, 7); ctx.fill();
      }

      // buckets
      var bw = WI / BUCKETS.length;
      for (var b = 0; b < BUCKETS.length; b++) {
        ctx.fillStyle = BUCKET_COLORS[b];
        ctx.fillRect(b * bw + 1, BUCKET_Y + 4, bw - 2, 30);
        ctx.fillStyle = C_TXT; ctx.font = '700 11px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(BUCKETS[b] + 'x', b * bw + bw / 2, BUCKET_Y + 24);
      }
      ctx.textAlign = 'left';

      // ball
      if (ball) {
        ctx.fillStyle = C_ACC;
        ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, 7); ctx.fill();
        ctx.strokeStyle = '#FFF'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(ball.x - 2, ball.y - 2, 3, 0, 7); ctx.stroke();
      }
    });
    updateStats();
  } });
})();

/* ================= STRIKER ================= */
(function () {
  var STR = {
    en: { t: 'High Striker', d: 'Time it right! Hit the button when the power bar is at max.', hit: 'HIT!', bell: '🔔 DING! Perfect strike!', result: 'Power: {n}/100' },
    tr: { t: 'Güç Ölçer', d: 'Zamanlama her şey! Güç çubuğu zirvede iken bas.', hit: 'VUR!', bell: '🔔 DING! Mükemmel vuruş!', result: 'Güç: {n}/100' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'striker', icon: '🔨', cat: 'carnival', unit: 'pts', str: STR, init: function (root) {
    var WI = 200, HE = 440;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['power', NF.lang === 'tr' ? 'Güç' : 'Power'], ['best', t('core.best')], ['tk', '🎟']]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    var hitBtn;
    var row = el('div', 'row');
    hitBtn = btn('🔨 ' + W.hit, doHit, false);
    row.appendChild(hitBtn);
    root.appendChild(row);

    var barVal = 0, barDir = 1, barSpeed = 2.5, phase = 'idle';
    // phases: idle (waiting to pay), charging (bar bouncing), hit (showing result), rising (puck going up)
    var puckY = 0, puckTarget = 0, bellTimer = 0;

    function updateStats() {
      st.set('power', phase === 'idle' ? '-' : Math.round(puckTarget));
      st.set('best', getBest('striker') || 0);
      st.set('tk', tickets());
    }

    function startCharge() {
      if (phase !== 'idle') return;
      if (!ticketGate(msg)) return;
      spendTickets(COST);
      msg.textContent = NF.lang === 'tr' ? 'Tam zamanında bas!' : 'Hit at the right moment!';
      phase = 'charging';
      barVal = 0; barDir = 1;
      barSpeed = 2.0 + Math.random() * 1.5;
      puckY = 0; puckTarget = 0;
      hitBtn.textContent = '🔨 ' + W.hit;
      sfx('click');
      updateStats();
    }

    function doHit() {
      if (phase === 'idle') {
        startCharge();
        return;
      }
      if (phase !== 'charging') return;
      phase = 'hit';
      // barVal is 0..1, convert to power
      // Make it so top is best: use sin to make 1.0 = 100
      puckTarget = Math.round(barVal * 100);
      sfx('pop');
      // animate puck rising
      phase = 'rising';
      updateStats();
    }

    c.cv.addEventListener('pointerdown', function () { doHit(); });
    addKey(function (e) {
      if (e.key === ' ') { e.preventDefault(); doHit(); }
    });

    var METER_X = 70, METER_W = 60, METER_TOP = 30, METER_BOT = HE - 60;
    var METER_H = METER_BOT - METER_TOP;
    var BELL_Y = METER_TOP - 10;

    loop(function (dt) {
      // update
      if (phase === 'charging') {
        barVal += barDir * barSpeed * dt;
        if (barVal >= 1) { barVal = 1; barDir = -1; }
        if (barVal <= 0) { barVal = 0; barDir = 1; }
      }
      if (phase === 'rising') {
        var target = puckTarget / 100;
        puckY += (target - puckY) * dt * 5;
        if (Math.abs(puckY - target) < 0.01) {
          puckY = target;
          phase = 'result';
          // rewards
          var power = puckTarget;
          var prize = 0;
          if (power >= 95) {
            prize = 25;
            msg.textContent = W.bell;
            sfx('win');
            bellTimer = 1.5;
          } else if (power >= 70) {
            prize = 10;
            msg.textContent = W.result.replace('{n}', power) + ' → +' + prize + '🎟';
            sfx('good');
          } else if (power >= 40) {
            prize = 5;
            msg.textContent = W.result.replace('{n}', power) + ' → +' + prize + '🎟';
            sfx('pop');
          } else {
            msg.textContent = W.result.replace('{n}', power) + ' → 0🎟';
            sfx('bad');
          }
          if (prize > 0) {
            award(prize);
          }
          setBest('striker', power);
          updateStats();
          after(function () {
            phase = 'idle';
            hitBtn.textContent = '🎟 ' + (NF.lang === 'tr' ? 'Oyna (5🎟)' : 'Play (5🎟)');
            updateStats();
          }, 2000);
        }
      }
      if (bellTimer > 0) bellTimer -= dt;

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // meter track
      ctx.fillStyle = C_SURF;
      ctx.fillRect(METER_X, METER_TOP, METER_W, METER_H);
      ctx.strokeStyle = C_DIM; ctx.lineWidth = 1;
      ctx.strokeRect(METER_X, METER_TOP, METER_W, METER_H);

      // color gradient zones
      var zones = [
        { pct: 0.4, col: C_BLUE },
        { pct: 0.3, col: C_GRN },
        { pct: 0.2, col: C_ACC },
        { pct: 0.1, col: C_PINK }
      ];
      var zy = METER_BOT;
      for (var z = 0; z < zones.length; z++) {
        var zh = METER_H * zones[z].pct;
        ctx.fillStyle = zones[z].col; ctx.globalAlpha = 0.3;
        ctx.fillRect(METER_X + 1, zy - zh, METER_W - 2, zh);
        zy -= zh;
      }
      ctx.globalAlpha = 1;

      // tick marks
      ctx.fillStyle = C_DIM; ctx.font = '10px "JetBrains Mono", monospace'; ctx.textAlign = 'right';
      for (var m = 0; m <= 100; m += 20) {
        var my = METER_BOT - (m / 100) * METER_H;
        ctx.fillRect(METER_X - 8, my - 0.5, 8, 1);
        ctx.fillText(m, METER_X - 12, my + 3);
      }
      ctx.textAlign = 'left';

      // bouncing indicator (during charging)
      if (phase === 'charging') {
        var iy = METER_BOT - barVal * METER_H;
        ctx.fillStyle = C_ACC;
        ctx.fillRect(METER_X + 2, iy - 4, METER_W - 4, 8);
        // glow
        ctx.shadowColor = C_ACC; ctx.shadowBlur = 12;
        ctx.fillRect(METER_X + 2, iy - 4, METER_W - 4, 8);
        ctx.shadowBlur = 0;
      }

      // puck (result)
      if (phase === 'rising' || phase === 'result') {
        var py = METER_BOT - puckY * METER_H;
        ctx.fillStyle = C_PINK;
        ctx.beginPath();
        ctx.arc(METER_X + METER_W / 2, py, 14, 0, 7);
        ctx.fill();
        ctx.fillStyle = C_TXT; ctx.font = '700 11px "Baloo 2", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(puckTarget, METER_X + METER_W / 2, py + 4);
        ctx.textAlign = 'left';
      }

      // bell at top
      ctx.font = bellTimer > 0 ? '32px sans-serif' : '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔔', METER_X + METER_W / 2, BELL_Y);
      ctx.textAlign = 'left';
      if (bellTimer > 0) {
        ctx.fillStyle = C_ACC; ctx.globalAlpha = bellTimer / 1.5 * 0.5;
        ctx.beginPath(); ctx.arc(METER_X + METER_W / 2, BELL_Y - 8, 30, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // hammer at bottom
      ctx.font = '32px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🔨', METER_X + METER_W / 2, HE - 18);
      ctx.textAlign = 'left';

      if (phase === 'idle') {
        overlay(ctx, WI, HE, '🔨', NF.lang === 'tr' ? '5🎟 ile oyna' : '5🎟 to play');
      }
    });
    phase = 'idle';
    updateStats();
  } });
})();

/* ================= DUCKS ================= */
(function () {
  var STR = {
    en: { t: 'Duck Shoot', d: 'Shoot ducks crossing the screen! 30 seconds, free play.', time: 'Time' },
    tr: { t: 'Ördek Vurma', d: 'Ekrandan geçen ördekleri vur! 30 saniye, ücretsiz.', time: 'Süre' }
  };
  var W = STR[NF.lang] || STR.en;
  Games.register({ id: 'ducks', icon: '🦆', cat: 'carnival', unit: 'pts', str: STR, init: function (root) {
    var WI = 420, HE = 320;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['score', t('core.score')], ['time', W.time], ['best', t('core.best')]]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);
    root.appendChild(el('div', 'hint-line', NF.lang === 'tr' ? 'Ördeklere dokun / tıkla!' : 'Tap / click the ducks!'));
    var row = el('div', 'row'); row.appendChild(btn(t('core.newGame'), reset, true)); root.appendChild(row);

    var ducks, score, timeLeft, over, spawnAcc, splashes;
    var LANES = [80, 140, 200, 250];
    var DUCK_W = 36, DUCK_H = 28;
    var DURATION = 30;

    function makeDuck() {
      var lane = pick(LANES);
      var fromLeft = Math.random() < 0.5;
      var speed = 60 + Math.random() * 120;
      return {
        x: fromLeft ? -DUCK_W : WI + DUCK_W,
        y: lane + (Math.random() - 0.5) * 20,
        vx: fromLeft ? speed : -speed,
        w: DUCK_W, h: DUCK_H,
        alive: true
      };
    }

    function reset() {
      ducks = []; score = 0; timeLeft = DURATION; over = false; spawnAcc = 0; splashes = [];
      msg.textContent = '';
      for (var i = 0; i < 3; i++) ducks.push(makeDuck());
      st.set('score', 0); st.set('time', DURATION);
      st.set('best', getBest('ducks') || 0);
    }

    c.cv.addEventListener('pointerdown', function (e) {
      if (over) { reset(); return; }
      var pos = canvasPos(c.cv, WI, HE, e);
      var hit = false;
      for (var i = ducks.length - 1; i >= 0; i--) {
        var d = ducks[i];
        if (!d.alive) continue;
        if (pos.x > d.x - d.w / 2 && pos.x < d.x + d.w / 2 &&
            pos.y > d.y - d.h / 2 && pos.y < d.y + d.h / 2) {
          d.alive = false;
          score++;
          st.set('score', score);
          sfx('pop');
          splashes.push({ x: d.x, y: d.y, t: 0.6 });
          hit = true;
          break;
        }
      }
      if (!hit) {
        splashes.push({ x: pos.x, y: pos.y, t: 0.3 });
        sfx('tick');
      }
    });

    addKey(function (e) {
      if (e.key === ' ' && over) { e.preventDefault(); reset(); }
    });

    loop(function (dt) {
      if (!over) {
        timeLeft -= dt;
        st.set('time', Math.max(0, Math.ceil(timeLeft)));
        if (timeLeft <= 0) {
          over = true;
          sfx(score >= 15 ? 'win' : 'lose');
          msg.textContent = t('core.finalScore', { n: score });
          var tix = Math.floor(score / 3);
          if (tix > 0) award(tix);
          setBest('ducks', score);
          st.set('best', getBest('ducks'));
        }

        spawnAcc += dt;
        var spawnRate = timeLeft > 15 ? 1.0 : 0.5;
        if (spawnAcc > spawnRate) {
          spawnAcc = 0;
          ducks.push(makeDuck());
        }

        // move ducks
        for (var i = ducks.length - 1; i >= 0; i--) {
          var d = ducks[i];
          d.x += d.vx * dt;
          if ((d.vx > 0 && d.x > WI + DUCK_W + 10) || (d.vx < 0 && d.x < -DUCK_W - 10)) {
            ducks.splice(i, 1);
          }
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // sky gradient
      var grad = ctx.createLinearGradient(0, 0, 0, HE);
      grad.addColorStop(0, '#1a1040');
      grad.addColorStop(1, '#2E2454');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, WI, HE);

      // lane lines
      ctx.strokeStyle = C_SURF; ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
      for (var l = 0; l < LANES.length; l++) {
        ctx.beginPath(); ctx.moveTo(0, LANES[l]); ctx.lineTo(WI, LANES[l]); ctx.stroke();
      }
      ctx.setLineDash([]);

      // water at bottom
      ctx.fillStyle = 'rgba(111,168,220,0.15)';
      ctx.fillRect(0, 270, WI, 50);

      // ducks
      for (var j = 0; j < ducks.length; j++) {
        var dk = ducks[j];
        if (!dk.alive) continue;
        ctx.save();
        ctx.translate(dk.x, dk.y);
        if (dk.vx < 0) { ctx.scale(-1, 1); }
        // body
        ctx.fillStyle = C_ACC;
        ctx.beginPath();
        ctx.ellipse(0, 0, DUCK_W / 2, DUCK_H / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // head
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(DUCK_W / 3, -DUCK_H / 3, 9, 0, 7);
        ctx.fill();
        // beak
        ctx.fillStyle = '#FF9800';
        ctx.beginPath();
        ctx.moveTo(DUCK_W / 3 + 8, -DUCK_H / 3 - 2);
        ctx.lineTo(DUCK_W / 3 + 16, -DUCK_H / 3 + 1);
        ctx.lineTo(DUCK_W / 3 + 8, -DUCK_H / 3 + 4);
        ctx.closePath();
        ctx.fill();
        // eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(DUCK_W / 3 + 2, -DUCK_H / 3 - 3, 2, 0, 7);
        ctx.fill();
        ctx.restore();
      }

      // splashes
      for (var s = splashes.length - 1; s >= 0; s--) {
        var sp = splashes[s];
        sp.t -= dt;
        if (sp.t <= 0) { splashes.splice(s, 1); continue; }
        ctx.strokeStyle = C_ACC; ctx.lineWidth = 2; ctx.globalAlpha = sp.t;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, (0.6 - sp.t) * 30, 0, 7);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // crosshair
      ctx.strokeStyle = C_PINK; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(WI / 2, HE / 2, 16, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(WI / 2 - 22, HE / 2); ctx.lineTo(WI / 2 + 22, HE / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(WI / 2, HE / 2 - 22); ctx.lineTo(WI / 2, HE / 2 + 22); ctx.stroke();
      ctx.globalAlpha = 1;

      if (over) overlay(ctx, WI, HE, t('core.gameOver'), t('core.tapOrSpace'));
    });
    reset();
  } });
})();

/* ================= HORSE RACE ================= */
(function () {
  var STR = {
    en: { t: 'Horse Race', d: 'Pick a horse and bet tickets! Win = bet × 3.', bet: 'Bet', go: 'Race! (5🎟)', pick: 'Pick your horse!', won: '🏆 {h} wins! You get {n}🎟!', lost: '{h} wins. You bet on {b}. Better luck next time!' },
    tr: { t: 'At Yarışı', d: 'Bir at seç, bilet bahis koy! Kazanç = bahis × 3.', bet: 'Bahis', go: 'Koş! (5🎟)', pick: 'Atını seç!', won: '🏆 {h} kazandı! {n}🎟 kazandın!', lost: '{h} kazandı. Sen {b} seçtin. Bir dahaki sefere!' }
  };
  var W = STR[NF.lang] || STR.en;
  var HORSES = [
    { name: NF.lang === 'tr' ? 'Alev' : 'Blaze', color: C_PINK, emoji: '🐎' },
    { name: NF.lang === 'tr' ? 'Yıldırım' : 'Thunder', color: C_ACC, emoji: '🏇' },
    { name: NF.lang === 'tr' ? 'Rüzgar' : 'Storm', color: C_GRN, emoji: '🐴' },
    { name: NF.lang === 'tr' ? 'Gölge' : 'Shadow', color: C_BLUE, emoji: '🎠' }
  ];
  Games.register({ id: 'horserace', icon: '🏇', cat: 'carnival', unit: 'pts', str: STR, init: function (root) {
    var WI = 440, HE = 260;
    var c = makeCanvas(WI, HE), ctx = c.ctx;
    var st = stats([['won', t('core.score')], ['best', t('core.best')], ['tk', '🎟']]);
    root.appendChild(st.el); root.appendChild(c.cv);
    var msg = el('div', 'game-msg'); root.appendChild(msg);

    // horse pick buttons
    var pickRow = el('div', 'row');
    var horseButtons = [];
    HORSES.forEach(function (h, i) {
      var b = btn(h.emoji + ' ' + h.name, function () { selectHorse(i); }, true);
      b.style.borderColor = h.color;
      horseButtons.push(b);
      pickRow.appendChild(b);
    });
    root.appendChild(pickRow);

    var goBtn;
    var goRow = el('div', 'row');
    goBtn = btn(W.go, startRace, false);
    goBtn.disabled = true;
    goRow.appendChild(goBtn);
    root.appendChild(goRow);

    var selected = -1, racing = false, over = false, totalWon = 0;
    var positions = [0, 0, 0, 0];
    var speeds = [0, 0, 0, 0];
    var FINISH = WI - 70;
    var LANE_H = HE / 4;

    function updateStats() {
      st.set('won', totalWon);
      st.set('best', getBest('horserace') || 0);
      st.set('tk', tickets());
    }

    function selectHorse(i) {
      if (racing) return;
      selected = i;
      horseButtons.forEach(function (b, idx) {
        b.style.background = idx === i ? HORSES[i].color : '';
        b.style.color = idx === i ? '#241505' : '';
      });
      goBtn.disabled = false;
      msg.textContent = HORSES[i].emoji + ' ' + HORSES[i].name + ' ' + (NF.lang === 'tr' ? 'seçildi!' : 'selected!');
      sfx('click');
    }

    function startRace() {
      if (racing || selected < 0) return;
      if (!ticketGate(msg)) return;
      spendTickets(COST);
      racing = true; over = false;
      goBtn.disabled = true;
      horseButtons.forEach(function (b) { b.disabled = true; });
      positions = [0, 0, 0, 0];
      speeds = [0, 0, 0, 0];
      msg.textContent = NF.lang === 'tr' ? '🏁 Yarış başladı!' : '🏁 They\'re off!';
      sfx('good');
      updateStats();
    }

    loop(function (dt) {
      if (racing && !over) {
        for (var i = 0; i < 4; i++) {
          // random speed bursts
          speeds[i] += (Math.random() * 300 - 130) * dt;
          speeds[i] = clamp(speeds[i], 40, 250);
          positions[i] += speeds[i] * dt;
          if (positions[i] >= FINISH) {
            over = true;
            racing = false;
            goBtn.disabled = false;
            horseButtons.forEach(function (b) { b.disabled = false; });

            if (i === selected) {
              var prize = COST * 3;
              award(prize);
              totalWon += prize;
              msg.textContent = W.won.replace('{h}', HORSES[i].name).replace('{n}', prize);
              sfx('win');
            } else {
              msg.textContent = W.lost.replace('{h}', HORSES[i].name).replace('{b}', HORSES[selected].name);
              sfx('lose');
            }
            setBest('horserace', totalWon);
            updateStats();
            break;
          }
        }
      }

      // draw
      ctx.fillStyle = C_BG; ctx.fillRect(0, 0, WI, HE);

      // lanes
      for (var j = 0; j < 4; j++) {
        var ly = j * LANE_H;
        ctx.fillStyle = j % 2 === 0 ? '#1e1640' : '#221a48';
        ctx.fillRect(0, ly, WI, LANE_H);

        // lane border
        ctx.strokeStyle = C_SURF; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, ly + LANE_H); ctx.lineTo(WI, ly + LANE_H); ctx.stroke();

        // horse name on left
        ctx.fillStyle = HORSES[j].color; ctx.font = '600 11px Inter, sans-serif';
        ctx.fillText(HORSES[j].name, 6, ly + LANE_H / 2 + 4);

        // horse position
        var hx = 50 + positions[j];
        var hy = ly + LANE_H / 2;
        // highlight selected
        if (j === selected) {
          ctx.fillStyle = HORSES[j].color; ctx.globalAlpha = 0.15;
          ctx.fillRect(0, ly, WI, LANE_H);
          ctx.globalAlpha = 1;
        }
        // horse emoji
        ctx.font = '28px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(HORSES[j].emoji, hx, hy + 10);
        ctx.textAlign = 'left';

        // dust particles while racing
        if (racing && !over) {
          ctx.fillStyle = C_DIM; ctx.globalAlpha = 0.4;
          for (var p = 0; p < 3; p++) {
            var px = hx - 15 - Math.random() * 20;
            var py2 = hy + (Math.random() - 0.5) * 12;
            ctx.beginPath(); ctx.arc(px, py2, 2 + Math.random() * 2, 0, 7); ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      }

      // finish line
      ctx.strokeStyle = C_ACC; ctx.lineWidth = 3; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(FINISH + 50, 0); ctx.lineTo(FINISH + 50, HE); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C_ACC; ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText('🏁', FINISH + 44, 16);

      if (!racing && !over && selected < 0) {
        overlay(ctx, WI, HE, W.pick, '');
      }
    });

    selected = -1;
    updateStats();
  } });
})();

})();
