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

/* ---------- 1a. 日本語と英語の切り替え ---------- */
/* 日本語を正本とし、英語は各要素の data-en に HTML で持たせている。
   ファイルを分けないのは、構造を直したときに片方だけ古くなるのを避けるため。 */

const I18N = document.querySelectorAll('[data-en]');
const JA = new Map();
I18N.forEach(el => JA.set(el, el.innerHTML));

const TITLE = { ja: document.title, en: 'Masayuki Iwata' };
const NAV = document.querySelector('.masthead__nav');
const NAV_LABEL = { ja: NAV ? NAV.getAttribute('aria-label') : '', en: NAV ? NAV.dataset.enLabel : '' };

function setLang(lang, remember) {
  const en = lang === 'en';
  I18N.forEach(el => { el.innerHTML = en ? el.dataset.en : JA.get(el); });
  document.documentElement.lang = en ? 'en' : 'ja';
  document.title = en ? TITLE.en : TITLE.ja;
  if (NAV) NAV.setAttribute('aria-label', en ? NAV_LABEL.en : NAV_LABEL.ja);
  document.querySelectorAll('.langtoggle__btn').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
  });
  if (remember) { try { localStorage.setItem('lang', lang); } catch (e) {} }
}

// URL の ?lang=en を最優先。英語話者にその場で英語版を渡せるようにするため
const urlLang = new URLSearchParams(location.search).get('lang');
let saved = null;
try { saved = localStorage.getItem('lang'); } catch (e) {}
setLang(urlLang === 'en' || urlLang === 'ja' ? urlLang : (saved === 'en' ? 'en' : 'ja'), false);

document.querySelectorAll('.langtoggle__btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang, true));
});

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

function frame(feet, { asleep = false, paw = 0, blink = false } = {}) {
  const rows = TORSO.slice();
  if (asleep || blink) {
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

/* ハムスターはマスコットとして定位置に立つ。左右には動かない。
   スクロールしている間だけその場で走り、止まれば毛づくろい、やがて眠る。 */

let state = 'idle';       // idle | running | grooming | sleeping | hop
let step = 0;             // 歩数。足の左右を切り替える
let acc = 0, last = 0;    // 歩調を実時間で刻む
let raf = null;
let idleTick = null;      // 待機中のまばたきと寝息（rAF は使わない）
let groomTimer = null, sleepTimer = null;

const STRIDE_MS = 95;     // 走っているときの一歩

function lift(px) { el.style.transform = px ? `translateY(${-px}px)` : ''; }

function stopLoop() { if (raf) { cancelAnimationFrame(raf); raf = null; } last = 0; acc = 0; }
function stopTick() { if (idleTick) { clearInterval(idleTick); idleTick = null; } }
function clearTimers() { clearTimeout(groomTimer); clearTimeout(sleepTimer); }

/* --- 待機。たまにまばたきするだけ --- */
function idle() {
  state = 'idle';
  stopLoop(); stopTick(); clearTimers();
  draw(frame(FEET.stand), 0);
  lift(0);
  idleTick = setInterval(() => {
    if (state !== 'idle') return;
    if (Math.random() < 0.28) {                    // ときどき瞬きする
      draw(frame(FEET.stand, { blink: true }), 0);
      setTimeout(() => { if (state === 'idle') draw(frame(FEET.stand), 0); }, 130);
    }
  }, 1600);
  groomTimer = setTimeout(groom, 4200);
  sleepTimer = setTimeout(sleep, 14000);
}

/* --- 毛づくろい --- */
function groom() {
  if (state !== 'idle') return;
  state = 'grooming';
  stopTick();
  let n = 0;
  const id = setInterval(() => {
    if (state !== 'grooming') { clearInterval(id); return; }
    draw(frame(FEET.stand, { paw: (n % 2) + 1 }), n % 2);
    if (++n > 9) { clearInterval(id); idle(); }
  }, 150);
}

/* --- 就寝。rAF は止めたまま、寝息だけ --- */
function sleep() {
  state = 'sleeping';
  stopLoop(); stopTick(); clearTimers();
  let n = 0;
  const render = () => draw(frame(FEET.stand, { asleep: true }), n++ % 2);
  render();
  idleTick = setInterval(render, 1500);
}

/* --- スクロール中はその場で走る --- */
function run() {
  state = 'running';
  stopTick(); clearTimers();
  if (!raf) raf = requestAnimationFrame(loop);
}

function loop(now) {
  raf = requestAnimationFrame(loop);
  if (!last) last = now;
  acc += Math.max(0, Math.min(now - last, 100));
  last = now;
  if (acc < STRIDE_MS) return;
  acc = 0;
  step++;
  draw(frame(step % 2 ? FEET.stepA : FEET.stepB), step % 2);
  lift(step % 2 ? 1 : 0);
}

/* --- 入力 --- */

let settle = null;
addEventListener('scroll', () => {
  if (REDUCED) return;
  run();
  clearTimeout(settle);
  settle = setTimeout(() => { if (state === 'running') idle(); }, 260);
}, { passive: true });

el.addEventListener('click', () => {
  if (REDUCED) return;
  clearTimers(); stopLoop(); stopTick();
  state = 'hop';
  let n = 0;
  const id = setInterval(() => {
    const up = n < 3;
    draw(frame(FEET.stepA, { blink: up }), up ? 2 : 0);
    lift(up ? 5 : 0);
    if (++n > 5) { clearInterval(id); idle(); }
  }, 70);
});

/* --- 起動 --- */

if (REDUCED) {
  draw(frame(FEET.stand), 0);
} else {
  idle();
}

/* ---------- 3. 数値のカウントアップ ---------- */
/* 実際に数えた行数なので、増えていく表示に意味がある */

const counters = document.querySelectorAll('.metrics dd[data-count]');
if (counters.length && !REDUCED && 'IntersectionObserver' in window) {
  const fmt = new Intl.NumberFormat('ja-JP');
  const io2 = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io2.unobserve(e.target);
      const node = [...e.target.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
      if (!node) continue;
      const target = Number(e.target.dataset.count);
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 900);
        const eased = 1 - Math.pow(1 - p, 3);      // 減速して着地する
        node.nodeValue = fmt.format(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  counters.forEach(c => io2.observe(c));
}
