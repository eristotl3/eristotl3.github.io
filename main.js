/* ============================================================
   岩田真幸 — portfolio
   1. 縫合：各パッチが画面に入ったとき一度だけ縫い合わされる
   2. ハムスター：歩いて登場し、以降はスクロール中だけ歩く
   ============================================================ */

document.documentElement.dataset.sewInit = '1';   // head 側の保険を解除

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. 縫合 ---------- */

const patches = document.querySelectorAll('.patch');

if (!('IntersectionObserver' in window)) {
  patches.forEach(p => p.classList.add('sewn'));
} else {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('sewn');
      io.unobserve(entry.target);   // 縫い終わったら二度と動かさない
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  patches.forEach(p => io.observe(p));

  // 保険：2.5秒経っても一枚も縫えていなければ、監視をあきらめて全部見せる。
  // 正常時は初回の交差が即座に届くので、この分岐には入らない。
  setTimeout(() => {
    if (!document.querySelector('.patch.sewn')) {
      io.disconnect();
      patches.forEach(p => p.classList.add('sewn'));
    }
  }, 2500);
}

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- 1b. 3×3 の継ぎ接ぎの印 ---------- */
/* 布片が散らばった状態から一度だけ組み上がる。組み上がったら動かない。 */

const MARK_COLORS = [
  'var(--field)', 'var(--surface-2)', 'var(--vermilion)',
  'var(--border)', 'var(--field)',    'var(--border)',
  'var(--vermilion)', 'var(--surface-2)', 'var(--field)',
];
const mark = document.getElementById('mark');
if (mark) {
  const rand = (n) => (Math.random() * 2 - 1) * n;
  MARK_COLORS.forEach((c, i) => {
    const cell = document.createElement('i');
    cell.style.setProperty('--c', c);
    cell.style.setProperty('--dx', rand(34).toFixed(1) + 'px');
    cell.style.setProperty('--dy', rand(34).toFixed(1) + 'px');
    cell.style.setProperty('--r', rand(24).toFixed(1) + 'deg');
    cell.style.setProperty('--d', (0.2 + i * 0.045).toFixed(3) + 's');
    mark.appendChild(cell);
  });
}

/* ---------- 2. ハムスター ---------- */

const SCALE = 2;                 // 20x14 のドット絵を 40x28 に拡大
const PALETTE = {
  D: '#8b5e37',   // 輪郭・影
  B: '#dcb37e',   // body
  L: '#f0dcbc',   // 腹・頬
  E: '#241a12',   // 目
  P: '#d98a8a',   // 鼻・耳
};

// 共通の胴体。最終行だけ足の形で差し替える
const TORSO = [
  '....................',
  '............DD......',
  '....DDDDDDDDDDDDD...',
  '..DDBBBBBBBBBBBBBBD.',
  '.DBBBBBBBBBBBBBBBBBD',
  '.DBBBBBBBBBBBBEBBBBD',
  '.DBBBBBBBBBBBBBBBBPD',
  '.DBBLLLLLLLLLLLLLLBD',
  '.DLLLLLLLLLLLLLLLLLD',
  '..DLLLLLLLLLLLLLLLD.',
  '...DDLLLLLLLLLLLLDD.',
];
const FEET = {
  stand: '.....DDDD...DDDD....',
  stepA: '....DDDD.....DDDD...',
  stepB: '......DDD...DDD.....',
};

const EYE_ROW = 5, EYE_X = 14;

function frame(feet, { asleep = false, paw = 0 } = {}) {
  const rows = TORSO.slice();
  if (asleep) {
    // 目を閉じる：黒目を輪郭色の横線にする
    const r = rows[EYE_ROW].split('');
    r[EYE_X - 1] = 'D'; r[EYE_X] = 'D'; r[EYE_X + 1] = 'D';
    rows[EYE_ROW] = r.join('');
  }
  if (paw) {
    // 毛づくろい：顔の横に前足を出す
    const y = paw === 1 ? 6 : 5;
    const r = rows[y].split('');
    r[17] = 'L'; r[18] = 'L';
    rows[y] = r.join('');
  }
  rows.push(feet, '....................', '....................');
  return rows;
}

const canvas = document.getElementById('hamster-canvas');
const ctx = canvas.getContext('2d');

function draw(rows, bob) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const c = PALETTE[row[x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x * SCALE, (y + bob) * SCALE, SCALE, SCALE);
    }
  }
}

const el = document.getElementById('hamster');
const WIDTH = 48;
const MARGIN = 8;

let x = -WIDTH;          // 画面外から
let dir = 1;             // 1 = 右向き, -1 = 左向き
let state = 'entering';
let step = 0;            // 歩数（足の左右の切り替えに使う）
let acc = 0, last = 0;   // 歩調を実時間で刻む（画面のリフレッシュレートに依存させない）
let raf = null;
let breathe = null;
let idleTimer = null, sleepTimer = null, groomTimer = null;

// 右端は床の表示（URL）の手前まで。ハムスターは文字の上に乗らない
const floorLabel = document.querySelector('.floor__label');

const limit = () => {
  const wall = floorLabel ? floorLabel.getBoundingClientRect().left : window.innerWidth;
  return Math.max(MARGIN, wall - WIDTH - 10);
};

function place(bob = 0) {
  el.style.transform = `translateX(${x}px) scaleX(${dir}) translateY(${-bob}px)`;
}


function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = null; } last = 0; acc = 0; }
function stopBreathing() { if (breathe) { clearInterval(breathe); breathe = null; } }
function clearTimers() {
  clearTimeout(idleTimer); clearTimeout(sleepTimer); clearTimeout(groomTimer);
}

/* --- 各状態 --- */

function sit() {
  state = 'idle';
  stopLoop(); stopBreathing();
  draw(frame(FEET.stand), 0);
  place();
  clearTimers();
  groomTimer = setTimeout(groom, 2600);
  sleepTimer = setTimeout(sleep, 9000);
}

function groom() {
  if (state !== 'idle') return;
  state = 'grooming';
  let n = 0;
  const id = setInterval(() => {
    draw(frame(FEET.stand, { paw: (n % 2) + 1 }), 0);
    if (++n > 7) { clearInterval(id); if (state === 'grooming') { state = 'idle'; draw(frame(FEET.stand), 0); } }
  }, 160);
}

function sleep() {
  state = 'sleeping';
  stopLoop(); clearTimers();
  let n = 0;
  const render = () => draw(frame(FEET.stand, { asleep: true }), n++ % 2 === 0 ? 0 : 1);
  render();
  stopBreathing();
  breathe = setInterval(render, 1400);   // 寝息。rAF は回さない
}

function walk() {
  if (state !== 'entering') state = 'walking';
  clearTimers();
  stopBreathing();
  if (!raf) raf = requestAnimationFrame(loop);
}

const STRIDE_MS = 110;   // 一歩あたりの時間
const STRIDE_PX = 5;     // 一歩で進む距離

function loop(now) {
  raf = requestAnimationFrame(loop);
  if (!last) last = now;
  acc += Math.max(0, Math.min(now - last, 100)); // タブ復帰時に飛ばない上限
  last = now;
  if (acc < STRIDE_MS) return;
  acc = 0;

  step++;
  const foot = step % 2 ? FEET.stepA : FEET.stepB;
  const bob  = step % 2 ? 1 : 0;
  draw(frame(foot), bob);

  x += dir * STRIDE_PX;
  if (state === 'entering') {
    if (x >= MARGIN + 24) { x = MARGIN + 24; sit(); return; }
  } else {
    if (x >= limit()) { x = limit(); dir = -1; }
    if (x <= MARGIN)   { x = MARGIN;  dir = 1;  }
  }
  place(bob);
}

/* --- 入力 --- */

let settle = null;
let lastY = 0;
addEventListener('scroll', () => {
  if (REDUCED) return;
  if (state === 'sleeping') stopBreathing();      // スクロールで目を覚ます
  dir = scrollY > lastY ? 1 : -1;
  lastY = scrollY;
  walk();
  clearTimeout(settle);
  settle = setTimeout(() => { if (state === 'walking') sit(); }, 320);
}, { passive: true });

el.addEventListener('click', () => {
  if (REDUCED) return;
  if (state === 'sleeping') { stopBreathing(); sit(); return; }
  // 起きているときは小さく跳ねる
  clearTimers(); stopLoop();
  state = 'hop';
  let n = 0;
  const id = setInterval(() => {
    draw(frame(FEET.stepA), n < 3 ? 2 : 0);
    place(n < 3 ? 3 : 0);
    if (++n > 5) { clearInterval(id); sit(); }
  }, 70);
});

addEventListener('resize', () => { if (x > limit()) { x = limit(); place(); } }, { passive: true });

/* --- 起動 --- */

if (REDUCED) {
  x = MARGIN + 24;
  draw(frame(FEET.stand), 0);
  place();
  state = 'idle';
} else {
  place();
  walk();
}
