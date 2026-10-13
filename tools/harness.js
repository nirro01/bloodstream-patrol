// Headless test harness: stubs the DOM and canvas, runs the game script from index.html,
// and plays every level of every world with a simple bot.
// Usage: node tools/harness.js [index.html] [seconds-per-level]
const fs = require('fs');
const path = require('path');
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const SECS = +(process.argv[3] || 100);
const html = fs.readFileSync(file, 'utf8');
const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));

const stubCtx = () => new Proxy({}, {
  get(t, k) {
    if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'canvas') return { width: 960, height: 540 };
    return () => ({ addColorStop() {} });
  },
  set(t, k, v) { t[k] = v; return true; },
});
const els = {};
function el(id) {
  if (els[id]) return els[id];
  const e = {
    id, hidden: false, textContent: '', innerHTML: '', disabled: false, className: '', style: {}, dataset: {}, children: [],
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, focus() {},
    appendChild(c) { this.children.push(c); return c; }, append() {}, remove() {}, insertAdjacentHTML() {},
    querySelector() { return el('_q' + Math.random()); }, querySelectorAll() { return []; },
    getContext() { return stubCtx(); }, getBoundingClientRect() { return { left: 0, top: 0, width: 960, height: 540 }; },
    setPointerCapture() {}, toDataURL() { return 'data:,'; },
    width: 960, height: 540,
  };
  els[id] = e; return e;
}
global.document = {
  getElementById: el, createElement: () => el('_c' + Math.random()), querySelectorAll: () => [], querySelector: () => el('_qs'),
  addEventListener() {}, hidden: false, createElementNS: () => el('_ns' + Math.random()),
};
global.window = global;
global.addEventListener = () => {};
global.devicePixelRatio = 1;
global.localStorage = { _s: {}, getItem(k) { return this._s[k] ?? null; }, setItem(k, v) { this._s[k] = String(v); } };
global.requestAnimationFrame = () => 0;
global.Image = class { set src(v) { setTimeout(() => { this.naturalWidth = 2048; this.naturalHeight = 256; this.onload && this.onload(); }); } };
if (!global.performance) global.performance = { now: () => Date.now() };

let failures = 0;
try { eval(script); } catch (e) { console.error('BOOT FAILED', e); process.exit(1); }
const bp = window.__bp;

function botStep() {
  const g = bp.g, p = g.p;
  const tgt = bp.botTarget ? bp.botTarget() : null;
  if (tgt) bp.setPointer(tgt.x, tgt.y); else bp.setPointer(p.x, p.y);
  if (Math.random() < 0.02) bp.useAbility();
}

setTimeout(() => {
  const worlds = bp.WORLDS;
  for (let w = 0; w < worlds.length; w++) {
    const heroes = w === 0 ? ['neut', 'macro', 'bcell', 'nk'] : [null];
    for (const h of heroes) {
      for (let l = 0; l < worlds[w].levels.length; l++) {
        const name = `${worlds[w].id}/${l + 1}${h ? '/' + h : ''}`;
        try {
          bp.run.world = w; bp.run.level = l; if (h) bp.run.type = h; bp.run.up = {}; bp.run.diff = 'normal';
          bp.startLevel();
          let t = 0, minBlood = 1e9, bossSeen = false;
          while (t < SECS && bp.state === 'play') {
            botStep(); bp.update(1 / 30); if (Math.floor(t * 30) % 5 === 0) bp.draw(); t += 1 / 30;
            if (bp.state !== 'play') break;
            minBlood = Math.min(minBlood, bp.g.blood); if (bp.g.boss) bossSeen = true;
            bp.g.blood = Math.max(bp.g.blood, 30); // keep the run alive so every phase is exercised
          }
          const phase = bp.g.phase, ents = bp.g.en.length;
          // force boss → exit → finish
          if (bp.state === 'play' && !bp.g.boss && bp.g.phase === 'waves') bp.spawnBoss();
          for (let i = 0; i < 5 && bp.state === 'play'; i++) { bp.update(1 / 30); bp.draw(); }
          if (bp.state === 'play' && bp.g.boss) bp.damageBoss(9999);
          for (let i = 0; i < 30 && bp.state === 'play'; i++) { bp.update(1 / 30); bp.draw(); }
          if (bp.state === 'play') bp.finishLevel();
          bp.startQuiz(); bp.showUpgrades();
          console.log(`ok  ${name.padEnd(18)} phase@${SECS}s=${phase.padEnd(5)} boss=${bossSeen ? 'y' : 'n'} minMeter=${Math.round(minBlood)} score=${bp.g.score} ents=${ents} state=${bp.state}`);
        } catch (e) { failures++; console.log(`FAIL ${name}`, e && e.stack); }
      }
    }
  }
  // menu screens
  try { bp.renderMap && bp.renderMap(); bp.renderSelect && bp.renderSelect(); } catch (e) { failures++; console.log('FAIL menus', e.stack); }
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
}, 20);
