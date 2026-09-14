import { chromium } from 'playwright';

const results = [];
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

const mkChar = (slug, name) => ({ slug, name, tileset: `Char/${name}/sprites_generated/${slug}_tileset.png`, specialMoves: [] });

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
const G = () => page.evaluate(() => window.__game);

// quart de cercle avant P1 (le bouton part pendant que avant est tenu)
async function qcf(btn = '1') {
    await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
    await page.keyboard.down('ArrowRight');  await page.waitForTimeout(70);
    await page.keyboard.press(btn);
    await page.keyboard.up('ArrowDown');     await page.keyboard.up('ArrowRight');
}
async function qcb(btn = '1') {
    await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
    await page.keyboard.down('ArrowLeft');   await page.waitForTimeout(70);
    await page.keyboard.press(btn);
    await page.keyboard.up('ArrowDown');     await page.keyboard.up('ArrowLeft');
}
// dragon punch : 6,2,3 — le bouton part pendant que bas+avant est tenu
async function dp(btn = '3') {
    await page.keyboard.down('ArrowRight');  await page.waitForTimeout(70);
    await page.keyboard.up('ArrowRight');    await page.waitForTimeout(40);
    await page.keyboard.down('ArrowDown');   await page.waitForTimeout(70);
    await page.keyboard.down('ArrowRight');  await page.waitForTimeout(70);
    await page.keyboard.press(btn);
    await page.keyboard.up('ArrowDown');     await page.keyboard.up('ArrowRight');
}
const clear1 = () => page.evaluate(() => { const x = window.__game;
    x.f1.attack = null; x.f1.state = 'idle'; x.f1.hitstun = 0; x.f1.blockstun = 0; x.f1.motion.consume(); });

// ============ SESSION 1 : Ike vs Rosaline ============
await startMatch(mkChar('ike', 'Ike'), mkChar('rosaline', 'Rosaline'));

// --- T1 : Lance roquette ---
await qcf('1');
await page.waitForTimeout(350);
let g = await G();
results.push(['Ike QCF -> lance roquette', g.projectiles.length >= 1, `projectiles=${g.projectiles.length}`]);
await page.waitForTimeout(1800);
g = await G();
results.push(['Roquette touche P2', g.f2.hp < 1000, `PV P2=${g.f2.hp}`]);

// --- T2 : Dash mix-up lourd d'Ike = overhead -> bat la garde basse ---
await clear1();
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 110; x.f2.facing = -1; x.f2.hp = 1000; x.f2.state='idle'; x.f2.blockstun=0; });
await page.waitForTimeout(400);
await page.keyboard.down('s'); await page.keyboard.down('d');   // J2 garde basse
await page.waitForTimeout(150);
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 110; });
await qcb('3');
await page.waitForTimeout(900);
g = await G();
results.push(['Ike QCB lourd (overhead) bat la garde basse', g.f2.hp < 1000 - 5, `PV P2=${g.f2.hp}`]);
await page.keyboard.up('s'); await page.keyboard.up('d');

// --- T3 : Uppercut enflammé (DP) : invincible au démarrage ---
await clear1();
await page.evaluate(() => { const x = window.__game; x.f1.x = 400; x.f2.x = 510; x.f1.hp = 1000; x.f1.invincible = 0; });
await page.waitForTimeout(400);
await dp('3');
await page.waitForTimeout(60);
const inv = await page.evaluate(() => {
    const f1 = window.__game.f1;
    const res = f1.takeHit(40, { knockback: 5, hitstun: 10 });
    return { invFrames: f1.invincible, res: String(res), hp: f1.hp, atk: f1.attack?.def?.name };
});
results.push(['Ike DP invincible (takeHit ignoré)', inv.res === 'invincible' && inv.hp === 1000,
    `special=${inv.atk}, invincible=${inv.invFrames}, res=${inv.res}, PV=${inv.hp}`]);

// --- T4 : Projection (3 boutons ensemble) passe la garde ---
await page.waitForTimeout(1500);
await clear1();
await page.evaluate(() => { const x = window.__game; x.f2.hp = 1000; x.f2.state='idle'; x.f2.blockstun=0; });
await page.keyboard.down('d');            // J2 garde (haute)
await page.waitForTimeout(150);
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 95; x.f2.facing = -1; });
await page.keyboard.down('1');
await page.keyboard.down('2');
await page.keyboard.down('3');
await page.waitForTimeout(120);
await page.keyboard.up('1'); await page.keyboard.up('2'); await page.keyboard.up('3');
await page.keyboard.up('d');
await page.waitForTimeout(900);
g = await G();
results.push(['Projection (1+2+3) traverse la garde', g.f2.hp <= 1000 - 100, `PV P2=${g.f2.hp}`]);

// --- T5 : Combo cancel : coup léger -> cancel en roquette ---
await page.waitForTimeout(800);
await clear1();
await page.evaluate(() => { const x = window.__game; x.f1.x = 300; x.f2.x = 800; x.f1.hp = 1000; x.f2.hp = 1000; });
await page.waitForTimeout(300);
// jusqu'à 3 tentatives : la livraison des événements clavier par Playwright
// peut être retardée de >200ms dans une session longue, ce qui fait sortir
// de la fenêtre de cancel (frames 3..15 du coup léger)
let t5ok = false, t5tries = 0, t5detail = '';
for (let attempt = 0; attempt < 3 && !t5ok; attempt++) {
    t5tries++;
    await page.evaluate(() => { const x = window.__game;
        x.f1.attack = null; x.f1.state = 'idle'; x.f1.hitstun = 0; x.f1.blockstun = 0;
        x.f1.motion.consume(); x.projectiles.length = 0; });
    await page.waitForTimeout(200);
    await page.keyboard.press('1');           // coup léger
    // attendre le début de la fenêtre de cancel (frame >= 3), synchronisé
    // sur les frames de jeu (la latence clavier peut dépasser 100ms)
    let fr = -1;
    for (let i = 0; i < 40; i++) {
        fr = await page.evaluate(() => window.__game.f1.attack?.frame ?? -1);
        if (fr >= 3) break;
        await page.waitForTimeout(20);
    }
    if (fr < 3) { t5detail = 'attaque jamais vue'; continue; }
    await page.keyboard.down('ArrowDown');   await page.waitForTimeout(30);
    await page.keyboard.down('ArrowRight');  await page.waitForTimeout(30);
    await page.keyboard.press('2');            // cancel en lance roquette
    await page.keyboard.up('ArrowDown');     await page.keyboard.up('ArrowRight');
    for (let i = 0; i < 20 && !t5ok; i++) {
        const st = await page.evaluate(() => ({ p: window.__game.projectiles.length,
            s: window.__game.f1.attack?.type }));
        if (st.p >= 1 || st.s === 'special') t5ok = true;
        else await page.waitForTimeout(20);
    }
    if (!t5ok) t5detail = 'fenêtre manquée (frame=' + fr + ')';
}
g = await G();
results.push(['Combo cancel : coup léger -> lance roquette', t5ok,
    `${t5ok ? 'OK en ' + t5tries + ' tentative(s)' : t5detail}, projectiles=${g.projectiles.length}, atk=${g.f1.attack?.type}`]);
await page.waitForTimeout(1000);

// --- T6 : Gel de Rosaline (QCF P2, face à gauche : avant = q) ---
await clear1();
await page.waitForTimeout(600);   // laisser la roquette de T5 finir sa course
await page.evaluate(() => { const x = window.__game; x.f1.hp = 1000; x.f1.x = 200; x.f2.x = 600;
    x.f2.state='idle'; x.f2.blockstun=0; x.f2.hitstun=0; x.f2.attack=null;
    x.projectiles.length = 0; });
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('q'); await page.waitForTimeout(70);
await page.keyboard.press('k');           // projectile glace
await page.keyboard.up('s'); await page.keyboard.up('q');
let frozenSeen = false;
for (let i = 0; i < 40; i++) {
    g = await G();
    if (g.f1.frozen > 0) { frozenSeen = true; break; }
    await page.waitForTimeout(100);
}
results.push(['Rosaline QCF gèle P1 (sans garde)', frozenSeen, `frozen=${(await G()).f1.frozen}`]);
if (frozenSeen) {
    g = await G();
    const frozenHp = g.f1.hp;
    await page.evaluate(() => { const x = window.__game; x.f2.x = x.f1.x + 90; x.f1.frozen = 200; x.f2.attack = null; x.f2.state = 'idle'; });
    await page.keyboard.press('k');   // Rosaline frappe P1 gelé
    await page.waitForTimeout(800);
    g = await G();
    results.push(['Un coup brise le gel', g.f1.frozen === 0 && g.f1.hp < frozenHp,
        `frozen=${g.f1.frozen}, PV P1=${g.f1.hp} (avant ${frozenHp})`]);
}

// ============ SESSION 2 : Robert vs Suzuki ============
await startMatch(mkChar('robert', 'Robert'), mkChar('suzuki', 'Suzuki'));

// --- T7 : Charge de Robert (arrière maintenu, avant + attaque) ---
await page.evaluate(() => { const x = window.__game; x.f2.x = 220; x.f1.x = 80; x.f2.facing = -1; });
await page.keyboard.down('ArrowLeft');     // charge arrière (dos au mur)
await page.waitForTimeout(900);
await page.keyboard.up('ArrowLeft');
await page.keyboard.down('ArrowRight');
await page.waitForTimeout(50);
await page.keyboard.press('1');
await page.waitForTimeout(900);            // le dash fonce et touche
g = await G();
results.push(['Robert charge -> coup puissant fonce et touche', g.f2.hp < 1000 - 5,
    `PV P2=${g.f2.hp}, P1 x=${Math.round(g.f1.x)}`]);
await page.keyboard.up('ArrowRight');

// --- T8 : Contre de Suzuki (QCB P2) absorbe et riposte ---
await page.waitForTimeout(900);
await page.evaluate(() => { const x = window.__game; x.f1.hp = 1000; x.f2.hp = 1000;
    x.f1.attack = null; x.f1.state = 'idle'; x.f1.x = x.f2.x - 100; x.f2.facing = -1; x.f2.attack=null; x.f2.state='idle'; });
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('d'); await page.waitForTimeout(70);
await page.keyboard.press('k');           // Suzuki lance le contre
await page.keyboard.up('s'); await page.keyboard.up('d');
await page.waitForTimeout(100);           // dans la fenêtre de contre
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 100; });   // Robert à portée
await page.keyboard.press('1');           // Robert attaque -> contré
await page.waitForTimeout(900);
g = await G();
results.push(['Suzuki contre : absorbe et riposte', g.f1.hp < 1000 - 50 && g.f2.hp >= 1000 - 5,
    `PV Robert=${g.f1.hp}, PV Suzuki=${g.f2.hp}`]);

// ============ SESSION 3 : Eva vs Tim ============
await startMatch(mkChar('eva', 'Eva'), mkChar('tim', 'Tim'));

// --- T9 : Command grab 360° d'Eva ---
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 95; x.f2.facing = -1; });
for (const k of ['ArrowRight', 'ArrowDown', 'ArrowLeft']) {
    await page.keyboard.down(k); await page.waitForTimeout(60); await page.keyboard.up(k);
}
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(25);
await page.keyboard.press('1');            // pendant que up est maintenu
await page.keyboard.up('ArrowUp');
await page.waitForTimeout(900);
g = await G();
results.push(['Eva 360° command grab traverse la garde', g.f2.hp <= 1000 - 95, `PV Tim=${g.f2.hp}`]);

// --- T10 : Boule de feu de Tim (QCF P2, face à gauche : avant = q) ---
await page.evaluate(() => { const x = window.__game; x.f1.x = x.f2.x - 400; x.f2.facing = 1; x.f1.hp=1000; x.f2.hp=1000; x.f1.state='idle'; x.f1.attack=null; });
await page.keyboard.down('s'); await page.waitForTimeout(70);
await page.keyboard.down('q'); await page.waitForTimeout(70);
await page.keyboard.press('k');
await page.keyboard.up('s'); await page.keyboard.up('q');
await page.waitForTimeout(350);
g = await G();
results.push(['Tim QCF -> boule de feu', g.projectiles.length >= 1, `projectiles=${g.projectiles.length}`]);

await page.screenshot({ path: 'shot_specials.png' });
await browser.close();
console.log('\n===== RÉSULTATS =====');
let fails = 0;
for (const [name, ok, info] of results) {
    console.log(`${ok ? '✓' : '✗'} ${name}  [${info}]`);
    if (!ok) fails++;
}
console.log(`${results.length - fails}/${results.length} tests OK — ERREURS: ${errors.length ? errors : 'aucune'}`);
