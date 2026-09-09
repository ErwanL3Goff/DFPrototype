import { Personnage } from './personnage.js';
import { controlsJ1, controlsJ2 } from './controls.js';
import { animations, FRAME_COLS } from './animations.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const keys = {};

document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

let player1, player2;
let lastTime = 0;

// Données d'attaque par défaut pour tous les personnages
const defaultAttackData = {
  attack_light: { frames: 3, startup: 1, active: 1, recovery: 1 },
  attack_medium: { frames: 4, startup: 1, active: 2, recovery: 1 },
  attack_heavy: { frames: 5, startup: 2, active: 2, recovery: 1 },
  air_attack_light: { frames: 3, startup: 1, active: 1, recovery: 1 },
  air_attack_medium: { frames: 4, startup: 1, active: 2, recovery: 1 },
  air_attack_heavy: { frames: 5, startup: 2, active: 2, recovery: 1 },
  crouch_attack_light: { frames: 3, startup: 1, active: 1, recovery: 1 },
  crouch_attack_medium: { frames: 4, startup: 1, active: 2, recovery: 1 },
  crouch_attack_heavy: { frames: 5, startup: 2, active: 2, recovery: 1 }
};

// Fonction pour charger un personnage depuis localStorage
function loadCharacterFromStorage(playerNum) {
  const stored = localStorage.getItem(`p${playerNum}Character`);
  if (stored) {
    return JSON.parse(stored);
  }
  // Valeurs par défaut si rien n'est stocké
  return playerNum === 1 
    ? { name: 'JAYTOKI', tileset: './assets/GrandeTileset.png', specialMoves: ['Clint Eastwood', 'Cassandra Tornado'] }
    : { name: 'SUZUKI', tileset: './assets/GrandeTileset2.png', specialMoves: ['Shadow Strike', 'Wind Blade'] };
}

// Fonction pour créer un personnage avec son tileset
function createPersonnage(x, controls, tilesetPath, name, specialMoves) {
  const tileset = new Image();
  const tilesetFlip = new Image();
  tileset.src = tilesetPath;
  tilesetFlip.src = tilesetPath;
  
  return new Promise((resolve) => {
    let loaded = 0;
    const onImageLoad = () => {
      loaded++;
      if (loaded === 2) {
        const perso = new Personnage(x, controls, tileset, tilesetFlip, defaultAttackData);
        perso.nom = name;
        perso.coupsSpeciaux = specialMoves || [];
        resolve(perso);
      }
    };
    tileset.onload = onImageLoad;
    tilesetFlip.onload = onImageLoad;
    
    // Gestion des erreurs
    tileset.onerror = () => {
      console.error(`Erreur chargement tileset: ${tilesetPath}`);
      loaded++;
      if (loaded === 2) resolve(null);
    };
    tilesetFlip.onerror = () => {
      console.error(`Erreur chargement tileset flip: ${tilesetPath}`);
      loaded++;
      if (loaded === 2) resolve(null);
    };
  });
}

async function startGame() {
  // Récupérer les personnages sélectionnés
  const p1Data = loadCharacterFromStorage(1);
  const p2Data = loadCharacterFromStorage(2);
  
  console.log(`Joueur 1: ${p1Data.name} - Tileset: ${p1Data.tileset}`);
  console.log(`Joueur 2: ${p2Data.name} - Tileset: ${p2Data.tileset}`);
  console.log(`Coups spéciaux P1: ${p1Data.specialMoves.join(', ')}`);
  console.log(`Coups spéciaux P2: ${p2Data.specialMoves.join(', ')}`);
  
  // Créer les personnages
  player1 = await createPersonnage(100, controlsJ1, p1Data.tileset, p1Data.name, p1Data.specialMoves);
  player2 = await createPersonnage(600, controlsJ2, p2Data.tileset, p2Data.name, p2Data.specialMoves);
  
  if (player1 && player2) {
    requestAnimationFrame(loop);
  } else {
    console.error("Erreur: Impossible de charger les personnages");
  }
}

function update(delta) {
  if (!player1 || !player2) return;
  player1.update(player2, keys, delta);
  player2.update(player1, keys, delta);
}

function draw() {
  if (!player1 || !player2) return;
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

// Démarrer le jeu
startGame();
