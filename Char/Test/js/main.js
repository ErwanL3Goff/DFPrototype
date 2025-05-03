import { Personnage } from './personnage.js';
import { controlsJ1, controlsJ2 } from './controls.js';
import { tilesetJ1, tilesetJ1Flip, attackDataJ1 } from './personnages/joueur1.js';
import { tilesetJ2, tilesetJ2Flip, attackDataJ2 } from './personnages/joueur2.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

let player1, player2;
let lastTime = 0;

function startGame() {
  player1 = new Personnage(100, controlsJ1, tilesetJ1, tilesetJ1Flip, attackDataJ1);
  player2 = new Personnage(600, controlsJ2, tilesetJ2, tilesetJ2Flip, attackDataJ2);
  requestAnimationFrame(loop);
}

function update(delta) {
  player1.update(player2, keys, delta);
  player2.update(player1, keys, delta);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  player1.draw(ctx);
  player2.draw(ctx);
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

// Lancer une fois que toutes les images sont chargées
let imagesLoaded = 0;
[tilesetJ1, tilesetJ1Flip, tilesetJ2, tilesetJ2Flip].forEach(img => {
  img.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 4) startGame();
  };
});
