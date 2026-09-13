import { chromium } from 'playwright';
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto('http://localhost:8080/Character%20Select/index.html');
await page.waitForTimeout(1200);
await page.evaluate(() => {
  const cells = [...document.querySelectorAll('.character-cell')];
  const mk = (i) => JSON.stringify({ name: cells[i].dataset.name, tileset: cells[i].dataset.tileset,
    specialMoves: JSON.parse(cells[i].dataset.specialmoves || '[]') });
  localStorage.setItem('p1Character', mk(0));
  localStorage.setItem('p2Character', mk(1));
});
await page.goto('http://localhost:8080/Char/Test2/index.html');
await page.waitForTimeout(8500);   // attendre la fin de l'intro
const st = await page.evaluate(() => window.__game.state);
console.log('état:', st);

// rapprocher les combattants
await page.evaluate(() => { const g = window.__game; g.f1.x = g.f2.x - 110; });

// 1) attaque légère NON bloquée
await page.keyboard.press('1');
await page.waitForTimeout(500);
let hp = await page.evaluate(() => [window.__game.f1.hp, window.__game.f2.hp]);
console.log('coup léger non bloqué  ->', hp, hp[1] < 1000 ? 'OK' : 'ECHEC');

// 2) J2 maintient "arrière" (garde haute) puis J1 attaque légère (mid -> bloqué)
await page.evaluate(() => { const g = window.__game; g.f1.x = g.f2.x - 100; g.f2.facing = -1; });
await page.keyboard.down('d');   // droite = arrière pour J2 (facing -1)
await page.waitForTimeout(200);
await page.evaluate(() => { const g = window.__game; g.f1.x = g.f2.x - 60; });  // coller avant la frappe
await page.keyboard.press('1');
await page.waitForTimeout(180);
hp = await page.evaluate(() => [window.__game.f1.hp, window.__game.f2.hp, window.__game.f2.state, window.__game.f2.guardType, window.__game.f2.animRow]);
console.log('mid bloqué garde haute ->', hp);
await page.keyboard.up('d');

// 3) J2 accroupi + arrière (garde basse) puis J1 attaque accroupie (low -> bloqué)
await page.evaluate(() => { const g = window.__game; g.f1.x = g.f2.x - 100; g.f1.hp = 1000; g.f2.hp = 1000; });
await page.keyboard.down('s');    // J2 s'accroupit
await page.keyboard.down('d');    // arrière -> garde basse
await page.waitForTimeout(300);
await page.keyboard.down('ArrowDown');  // J1 s'accroupit
await page.waitForTimeout(200);
await page.keyboard.press('1');   // attaque accroupie légère (low)
await page.waitForTimeout(500);
hp = await page.evaluate(() => [window.__game.f1.hp, window.__game.f2.hp, window.__game.f2.state]);
console.log('low bloqué garde basse ->', hp);
await page.keyboard.up('s'); await page.keyboard.up('d'); await page.keyboard.up('ArrowDown');

// 4) attaque aérienne : J1 saute et frappe
await page.waitForTimeout(400);
await page.keyboard.press('ArrowUp');
await page.waitForTimeout(450);   // en pleine ascension
await page.keyboard.press('2');   // attaque aérienne moyenne
await page.waitForTimeout(120);
hp = await page.evaluate(() => [window.__game.f1.state, window.__game.f1.attack ? window.__game.f1.attack.type : null, window.__game.f1.attack ? window.__game.f1.attack.def.height : null]);
console.log('attaque aérienne J1 ->', hp);

// 5) K.O. : on met J2 à 30 PV puis coup lourd (à bout portant)
await page.waitForTimeout(800);   // laisser J1 retomber et revenir au sol
await page.evaluate(() => { const g = window.__game; g.f1.x = g.f2.x - 80; g.f2.hp = 30; });
await page.waitForTimeout(300);
await page.keyboard.press('3');   // lourd (spécial)
await page.waitForTimeout(1200);
const ko = await page.evaluate(() => [window.__game.state, window.__game.f2.state, window.__game.f2.animRow]);
console.log('K.O. ->', ko);

await page.screenshot({ path: '/tmp/shot_new_engine.png' });
await browser.close();
console.log('ERREURS:', errors.length ? errors : 'aucune');
