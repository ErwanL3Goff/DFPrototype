// =============================================
// CONSTANTES DU JEU - gameConstants.js
// =============================================

// 1. CONSTANTES GÉNÉRALES
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 600;          // ligne du sol (pieds des personnages)
export const GRAVITY = 0.9;
export const MAX_FALL_SPEED = 18;

// 2. CONSTANTES DES PERSONNAGES
export const MAX_HP = 1000;
export const ROUND_TIME = 60;         // secondes par round
export const WINS_NEEDED = 2;         // best of 3

// 3. TILESETS GÉNÉRÉS : 4 lignes x 8 frames de 50px
export const FRAME_SIZE = 50;
export const FRAME_COUNT = 8;
export const ANIM_ROWS = { IDLE: 0, WALK: 1, ATTACK: 2, SPECIAL: 3 };
export const SPRITE_SCALE = 3;        // 50px -> 150px à l'écran

// 4. PHYSIQUE / COMBAT
export const MOVE_SPEED = 5.2;
export const JUMP_VELOCITY = -16;
export const FIGHTER_WIDTH = 90;      // hitbox horizontale (collision corps)
export const FIGHTER_HEIGHT = 150;

// Attaques : frames = nb de frames d'animation (60fps logique),
// startup = frames avant impact, active = frames où le coup peut toucher
export const ATTACKS = {
    light: {
        row: ANIM_ROWS.ATTACK, frames: 12, startup: 4, active: 3,
        damage: 40, range: 95, knockback: 6, hitstun: 14, animationSpeed: 1
    },
    medium: {
        row: ANIM_ROWS.ATTACK, frames: 18, startup: 6, active: 4,
        damage: 70, range: 110, knockback: 10, hitstun: 20, animationSpeed: 0.7
    },
    special: {
        row: ANIM_ROWS.SPECIAL, frames: 26, startup: 8, active: 5,
        damage: 100, range: 130, knockback: 16, hitstun: 28, animationSpeed: 0.5
    }
};

// 5. TOUCHES (comparées sur e.key en minuscule -> compatible AZERTY/QWERTY)
export const CONTROLS = {
    p1: { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown',
          light: '1', medium: '2', special: '3' },
    p2: { left: 'q', right: 'd', up: 'z', down: 's',
          light: 'k', medium: 'l', special: 'm' }
};
