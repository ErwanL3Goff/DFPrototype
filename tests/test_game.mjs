import { chromium } from 'playwright';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

// 1) écran de sélection
await page.goto('http://localhost:8080/Character%20Select/index.html');
await page.waitForTimeout(1500);
const cellCount = await page.locator('.character-cell').count();
console.log('Cellules de sélection:', cellCount);

// 2) sélection des 2 joueurs via clavier (P1: 1, P2: k) puis lancement
await page.keyboard.press('1');
await page.keyboard.press('k');
await page.waitForTimeout(300);
const startVisible = await page.locator('#start-button').isVisible();
console.log('Bouton commencer visible:', startVisible);

// au lieu de rediriger, on simule le localStorage comme le ferait startFight()
await page.evaluate(() => {
  const cells = [...document.querySelectorAll('.character-cell')];
  const c1 = JSON.parse(cells[0].dataset.specialmoves || '[]');
  const c2 = JSON.parse(cells[1].dataset.specialmoves || '[]');
  localStorage.setItem('p1Character', JSON.stringify({ name: cells[0].dataset.name, tileset: cells[0].dataset.tileset, specialMoves: c1 }));
  localStorage.setItem('p2Character', JSON.stringify({ name: cells[1].dataset.name, tileset: cells[1].dataset.tileset, specialMoves: c2 }));
});

// 3) moteur de combat POO
await page.goto('http://localhost:8080/Char/Test2/index.html');
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/shot_intro.png' });

// attendre la fin des annonces (FIGHT!) et vérifier que le combat tourne
await page.waitForTimeout(6000);
const state = await page.evaluate(() => window.__game ? window.__game.state : 'inconnu');
console.log('État du jeu après intro:', state);
const announce = await page.locator('#announce').textContent();
console.log('Annonce affichée:', announce || '(aucune)');

// rapprocher P1 de P2 pour tester la détection de coup
await page.evaluate(() => { window.__game.f1.x = window.__game.f2.x - 120; });
await page.keyboard.press('1');   // attaque légère P1
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shot_fight.png' });

let hp = await page.evaluate(() => window.__game ? [window.__game.f1.hp, window.__game.f2.hp] : null);
console.log('PV après attaque légère:', hp);

// test du coup spécial (deuxième touche du J1)
await page.keyboard.press('3');
await page.waitForTimeout(800);
hp = await page.evaluate(() => window.__game ? [window.__game.f1.hp, window.__game.f2.hp] : null);
console.log('PV après spécial:', hp);

// J2 attaque aussi (touche K)
await page.keyboard.press('k');
await page.waitForTimeout(600);
hp = await page.evaluate(() => window.__game ? [window.__game.f1.hp, window.__game.f2.hp] : null);
console.log('PV après attaque J2:', hp);

await browser.close();
console.log('ERREURS:', errors.length ? errors : 'aucune');
