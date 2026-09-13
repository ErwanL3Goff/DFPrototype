import { chromium } from 'playwright';
const results = [], errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const mk = (slug, name) => ({ slug, name, tileset: `Char/${name}/sprites_generated/${slug}_tileset.png`, specialMoves: [] });
const G = () => page.evaluate(() => window.__game);

await page.goto('http://localhost:8080/Character%20Select/index.html');
await page.waitForTimeout(1000);
await page.evaluate(([a, b]) => {
    localStorage.setItem('p1Character', JSON.stringify(a));
    localStorage.setItem('p2Character', JSON.stringify(b));
}, [mk('forest', 'Forest'), mk('duke_nukem', 'Duke Nukem')]);
await page.goto('http://localhost:8080/Char/Test2/index.html');
await page.waitForTimeout(8500);

// --- T1 : Forest QCF = rafale avatar multi-coups ---
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 90; x.f2.facing = -1; });
await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(70);
await page.keyboard.press('1');
await page.keyboard.up('ArrowDown'); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(100);
let g = await G();
const t1special = g.f1.attack?.def?.name;
await page.waitForTimeout(900);
g = await G();
results.push(['Forest QCF rafale avatar (multi-coups)', t1special === 'Avatar : Rafale de Poings' && g.f2.hp <= 1000 - 80,
    `spécial=${t1special}, PV Duke=${g.f2.hp}`]);

// --- T2 : Forest QCB = grand poing à grande portée (de loin) ---
await page.waitForTimeout(600);
await page.evaluate(() => { const x = window.__game; x.f1.attack=null; x.f1.state='idle'; x.f1.motion.consume();
    x.f1.x = x.f2.x - 260; x.f2.hp = 1000; x.f2.hitstun=0; x.f2.blockstun=0; x.f2.state='idle'; });
await page.waitForTimeout(200);
await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
await page.keyboard.down('ArrowLeft');   await page.waitForTimeout(70);
await page.keyboard.press('2');
await page.keyboard.up('ArrowDown'); await page.keyboard.up('ArrowLeft');
await page.waitForTimeout(700);
g = await G();
results.push(['Forest QCB grand poing grande portée (260px)', g.f2.hp <= 1000 - 75, `PV Duke=${g.f2.hp}`]);

// --- T3 : Forest DP = rafale anti-air 3 coups ---
await page.waitForTimeout(600);
await page.evaluate(() => { const x = window.__game; x.f1.attack=null; x.f1.state='idle'; x.f1.motion.consume();
    x.f1.x = x.f2.x - 100; x.f2.hp = 1000; x.f2.hitstun=0; x.f2.state='idle'; });
await page.waitForTimeout(200);
await page.keyboard.down('ArrowRight');  await page.waitForTimeout(70);
await page.keyboard.up('ArrowRight');    await page.waitForTimeout(40);
await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
await page.keyboard.down('ArrowRight');  await page.waitForTimeout(70);
await page.keyboard.press('3');
await page.keyboard.up('ArrowDown'); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(800);
g = await G();
results.push(['Forest DP rafale anti-air', g.f2.hp <= 1000 - 85, `PV Duke=${g.f2.hp}`]);

// --- T4 : Duke QCF (P2) casse-distance : touche de loin, pression de garde ---
await page.waitForTimeout(600);
await page.evaluate(() => { const x = window.__game; x.f1.attack=null; x.f1.state='idle'; x.f1.hp=1000; x.f1.hitstun=0; x.f2.attack=null; x.f2.state='idle';
    x.f2.motion.consume(); x.f1.x = 80; x.f2.x = 330; x.f2.facing = -1; });   // Forest dos au mur
await page.waitForTimeout(200);
// Forest (P1) garde haute : arrière = ArrowLeft
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(150);
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('q'); await page.waitForTimeout(70);
await page.keyboard.press('k');
await page.keyboard.up('s'); await page.keyboard.up('q');
await page.waitForTimeout(900);
g = await G();
const chip4 = 1000 - g.f1.hp;
await page.keyboard.up('ArrowLeft');
results.push(['Duke QCF casse-distance : bloqué mais pression (chip ~18)', chip4 >= 15 && chip4 <= 25 && g.f1.blockstun >= 0,
    `chip=${chip4}, PV Forest=${g.f1.hp}`]);

// --- T5 : Duke QCB (P2) téléportation éclair : passe derrière et frappe ---
await page.waitForTimeout(600);
await page.evaluate(() => { const x = window.__game; x.f2.attack=null; x.f2.state='idle'; x.f2.motion.consume();
    x.f2.hp = 1000; x.f1.hp = 1000; x.f1.hitstun=0; x.f1.blockstun=0; x.f1.state='idle';
    x.f1.x = 500; x.f2.x = 600; });
await page.waitForTimeout(200);
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('d'); await page.waitForTimeout(70);
await page.keyboard.press('k');           // téléportation derrière Forest
await page.keyboard.up('s'); await page.keyboard.up('d');
await page.waitForTimeout(300);           // la téléportation (startup 5) est jouée
g = await G();
const behind = g.f2.x < g.f1.x;          // Duke est passé derrière
await page.waitForTimeout(600);
g = await G();
results.push(['Duke QCB téléportation : passe derrière et frappe', behind && g.f1.hp < 1000,
    `derrière=${behind}, PV Forest=${g.f1.hp}`]);

// --- T6 : Duke DP (P2) épée sautée anti-air ---
await page.waitForTimeout(600);
await page.evaluate(() => { const x = window.__game; x.f2.attack=null; x.f2.state='idle'; x.f2.motion.consume();
    x.f2.x = x.f1.x + 100; x.f2.facing = -1; x.f1.hp = 1000; x.f1.hitstun=0; x.f1.state='idle'; });
await page.waitForTimeout(200);
await page.keyboard.down('q'); await page.waitForTimeout(70);
await page.keyboard.up('q'); await page.waitForTimeout(40);
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('q'); await page.waitForTimeout(70);
await page.keyboard.press('k');
await page.keyboard.up('s'); await page.keyboard.up('q');
await page.waitForTimeout(800);
g = await G();
results.push(['Duke DP épée sautée anti-air', g.f1.hp <= 1000 - 90, `PV Forest=${g.f1.hp}`]);

await page.screenshot({ path: 'shot_forest_duke.png' });
await browser.close();
console.log('\n===== RÉSULTATS =====');
let fails = 0;
for (const [n, ok, i] of results) { console.log(`${ok ? '✓' : '✗'} ${n}  [${i}]`); if (!ok) fails++; }
console.log(`${results.length - fails}/${results.length} tests OK — ERREURS: ${errors.length ? errors : 'aucune'}`);
