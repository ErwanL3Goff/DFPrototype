// =============================================
// main.js — point d'entrée : charge les personnages sélectionnés
// (localStorage), précharge leurs tilesets, puis lance le Game.
// =============================================
import { GAME_WIDTH, GAME_HEIGHT } from './js/gameConstants.js';
import { SpriteManager } from './js/SpriteManager.js';
import { InputManager } from './js/InputManager.js';
import { Game } from './js/Game.js';

const DEFAULT_P1 = {
    name: 'Ike', style: 'SHOTO/BALANCE',
    tileset: 'Char/Ike/sprites_generated/ike_tileset.png',
    specialMoves: [{ name: 'Hadouken', input: '↓↘→ + P', damage: 70, description: 'Onde d’énergie' }]
};
const DEFAULT_P2 = {
    name: 'Suzuki', style: 'MIX-UP',
    tileset: 'Char/Suzuki/sprites_generated/suzuki_tileset.png',
    specialMoves: [{ name: 'Shadow Strike', input: '↓↘→ + P', damage: 90, description: 'Frappe ombre' }]
};

// Les chemins de la sélection sont relatifs à la racine du site :
// on les résout depuis la page courante (Char/Test2/ -> racine).
function resolveAsset(path) {
    const clean = path.replace(/^(\.\.\/)+/, '');
    return new URL('../../' + clean, location.href).href;
}

function loadSelection(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const data = JSON.parse(raw);
        return (data && data.name && data.tileset) ? data : fallback;
    } catch {
        return fallback;
    }
}

async function boot() {
    const canvas = document.getElementById('gameCanvas');
    const announceEl = document.getElementById('announce');
    const overlayEl = document.getElementById('match-overlay');
    const resultEl = document.getElementById('match-result');
    const rematchBtn = document.getElementById('rematch-btn');
    const quitBtn = document.getElementById('quit-btn');

    const p1Data = loadSelection('p1Character', DEFAULT_P1);
    const p2Data = loadSelection('p2Character', DEFAULT_P2);

    // Préchargement des tilesets via SpriteManager (POO, promesses)
    const [sm1, sm2] = await Promise.all([
        new SpriteManager(resolveAsset(p1Data.tileset)).ready,
        new SpriteManager(resolveAsset(p2Data.tileset)).ready
    ]);

    const input = new InputManager();

    const game = new Game(
        canvas,
        { announceEl, overlayEl, resultEl, rematchBtn, quitBtn },
        { ...p1Data, sprites: sm1 },
        { ...p2Data, sprites: sm2 },
        input
    );

    // Redimensionnement responsive
    function resize() {
        const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
        const wrapper = document.getElementById('game-wrapper');
        wrapper.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', resize);
    resize();

    game.start();
    window.__game = game; // exposé pour debug et tests automatisés
}

boot().catch(err => {
    console.error('Erreur au lancement du jeu :', err);
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;inset:0;background:#100;color:#fff;padding:40px;font-family:monospace;z-index:99';
    div.innerHTML = `<h1>Erreur de lancement</h1><p>${err.message}</p><p style="color:#aaa">Vérifie que le jeu est servi via un serveur local (ex: python -m http.server) et non ouvert en double-cliquant sur index.html.</p>`;
    document.body.appendChild(div);
});
