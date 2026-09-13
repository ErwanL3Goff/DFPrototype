import { chromium } from 'playwright';
const results = [], errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
const mk = (slug, name) => ({ slug, name, tileset: `Char/${name}/sprites_generated/${slug}_tileset.png`, specialMoves: [] });
const G = () => page.evaluate(() => window.__game);

async function startMatch(c1, c2) {
    await page.goto('http://localhost:8080/Character%20Select/index.html');
    await page.waitForTimeout(1000);
    await page.evaluate(([a, b]) => {
        localStorage.setItem('p1Character', JSON.stringify(a));
        localStorage.setItem('p2Character', JSON.stringify(b));
    }, [c1, c2]);
    await page.goto('http://localhost:8080/Char/Test2/index.html');
    await page.waitForTimeout(8500);
}

// ============ SESSION 1 : Ike vs Rosaline ============
await startMatch(mk('ike', 'Ike'), mk('rosaline', 'Rosaline'));

// --- T1 : saut plus haut ---
await page.evaluate(() => { const x = window.__game; x.f1.x = 300; });
await page.keyboard.press('ArrowUp');
let minY = 600;
for (let i = 0; i < 30; i++) {
    const g = await G();
    if (g.f1.y < minY) minY = g.f1.y;
    await page.waitForTimeout(50);
}
results.push(['Saut plus haut (apex < 400px, avant ~458)', minY < 400, `apex y=${Math.round(minY)}`]);
await page.waitForTimeout(600);

// --- T2 : double saut ---
await page.evaluate(() => { const x = window.__game; x.f1.x = 400; x.f1.y = 600; x.f1.grounded = true; x.f1.state = 'idle'; x.f1.jumpsUsed = 0; x.f1.vy = 0; });
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(430);            // proche de l'apex du premier saut
await page.keyboard.press('ArrowUp');      // double saut en plein vol
minY = 600;
let jumps = 0;
for (let i = 0; i < 34; i++) {
    const g = await G();
    if (g.f1.y < minY) minY = g.f1.y;
    if (g.f1.jumpsUsed > jumps) jumps = g.f1.jumpsUsed;   // max vu EN VOL
    await page.waitForTimeout(50);
}
results.push(['Double saut (apex < 320px, jumpsUsed=2)', minY < 320 && jumps === 2,
    `apex y=${Math.round(minY)}, jumpsUsed=${jumps}`]);
await page.waitForTimeout(800);

// --- T3 : projection vers l'avant ---
await page.evaluate(() => { const x = window.__game; x.f1.attack=null; x.f1.state='idle'; x.f1.hitstun=0; x.f1.motion.consume();
    x.f1.x = 500; x.f1.hp = 1000; x.f2.hp = 1000; x.f2.hitstun=0; x.f2.state='idle'; x.f2.x = 595; x.f2.facing = -1; });
await page.waitForTimeout(200);
await page.keyboard.down('1'); await page.keyboard.down('2'); await page.keyboard.down('3');
await page.waitForTimeout(100);
await page.keyboard.up('1'); await page.keyboard.up('2'); await page.keyboard.up('3');
await page.waitForTimeout(200);
let x2Grab = (await G()).f2.x;
await page.waitForTimeout(400);
let g = await G();
results.push(['Projection avant : la victime vole devant (vers la droite)', g.f2.hp <= 1000 - 100 && g.f2.x > x2Grab - 5,
    `PV=${g.f2.hp}, x victime ${Math.round(x2Grab)} -> ${Math.round(g.f2.x)}`]);
await page.waitForTimeout(1200);

// --- T4 : projection vers l'arrière (arrière tenu) ---
await page.evaluate(() => { const x = window.__game; x.f1.attack=null; x.f1.state='idle'; x.f1.hitstun=0; x.f1.motion.consume();
    x.f1.x = 500; x.f1.hp = 1000; x.f2.hp = 1000; x.f2.hitstun=0; x.f2.state='idle'; x.f2.x = 595; x.f2.facing = -1; });
await page.waitForTimeout(200);
await page.keyboard.down('ArrowLeft');     // arrière tenu : projection vers l'arrière
await page.waitForTimeout(120);
await page.keyboard.down('1'); await page.keyboard.down('2'); await page.keyboard.down('3');
await page.waitForTimeout(100);
await page.keyboard.up('1'); await page.keyboard.up('2'); await page.keyboard.up('3');
await page.keyboard.up('ArrowLeft');
await page.waitForTimeout(200);
x2Grab = (await G()).f2.x;
await page.waitForTimeout(400);
g = await G();
results.push(['Projection arrière : la victime vole derrière (vers la gauche)', g.f2.hp <= 1000 - 100 && g.f2.x < x2Grab + 5,
    `PV=${g.f2.hp}, x victime ${Math.round(x2Grab)} -> ${Math.round(g.f2.x)}`]);

// ============ SESSION 2 : Tim vs Suzuki ============
await startMatch(mk('tim', 'Tim'), mk('suzuki', 'Suzuki'));

// --- T5 : riposte fonceuse : Suzuki contre la boule de feu et fonce sur Tim ---
await page.evaluate(() => { const x = window.__game; x.f1.x = 300; x.f2.x = 480; x.f2.facing = -1;
    x.f1.hp = 1000; x.f2.hp = 1000; });
await page.waitForTimeout(200);
const xSuzuki0 = 480;
// Tim tire sa boule de feu depuis 180px
await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
await page.keyboard.down('ArrowRight');  await page.waitForTimeout(70);
await page.keyboard.press('1');
await page.keyboard.up('ArrowDown'); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(60);          // la boule de feu est partie
// Suzuki (P2) lance son contre pendant qu'elle arrive (bas arrière : s puis s+d, léger : k)
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('d'); await page.waitForTimeout(70);
await page.keyboard.press('k');
await page.keyboard.up('s'); await page.keyboard.up('d');
await page.waitForTimeout(1500);
g = await G();
const riposteDash = Math.abs(g.f2.x - g.f1.x) < 150 && g.f2.x < xSuzuki0 - 30;
results.push(['Riposte fonceuse : Suzuki absorbe et fonce sur Tim', g.f1.hp < 1000 && riposteDash,
    `PV Tim=${g.f1.hp}, Suzuki x ${Math.round(xSuzuki0)} -> ${Math.round(g.f2.x)}`]);

// ============ SESSION 3 : Jaytoki vs Suzuki ============
await startMatch(mk('jaytoki', 'Jaytoki'), mk('suzuki', 'Suzuki'));

// --- T6 : dash de Jaytoki : fonce et s'arrête à portée ---
await page.evaluate(() => { const x = window.__game; x.f1.x = 300; x.f2.x = 620; x.f2.facing = -1;
    x.f1.hp = 1000; x.f2.hp = 1000; });
await page.waitForTimeout(200);
const dist0 = 320;
await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(70);
await page.keyboard.press('1');
await page.keyboard.up('ArrowDown'); await page.keyboard.up('ArrowRight');
await page.waitForTimeout(900);
g = await G();
const distF = Math.abs(g.f2.x - g.f1.x);
results.push(['Jaytoki : la grande épée fonce vers Suzuki et touche', g.f2.hp < 1000 - 70,
    `PV Suzuki=${g.f2.hp}, distance ${Math.round(dist0)} -> ${Math.round(distF)}`]);

await page.screenshot({ path: 'shot_physics.png' });
await browser.close();
console.log('\n===== RÉSULTATS =====');
let fails = 0;
for (const [n, ok, i] of results) { console.log(`${ok ? '✓' : '✗'} ${n}  [${i}]`); if (!ok) fails++; }
console.log(`${results.length - fails}/${results.length} tests OK — ERREURS: ${errors.length ? errors : 'aucune'}`);
