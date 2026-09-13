// =============================================
// CONSTANTES DU JEU - gameConstants.js
// Tilesets 20 lignes x 8 frames de 50px :
// 16 lignes d'animations + projection + 3 coups spéciaux
// =============================================

// 1. CONSTANTES GÉNÉRALES
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 600;          // ligne du sol (pieds des personnages)
export const GRAVITY = 0.8;
export const MAX_FALL_SPEED = 16;

// 2. CONSTANTES DES PERSONNAGES
export const MAX_HP = 1000;
export const ROUND_TIME = 60;         // secondes par round
export const WINS_NEEDED = 2;         // best of 3

// 3. TILESETS : 20 lignes x 8 frames de 50px
export const FRAME_SIZE = 50;
export const FRAME_COUNT = 8;
export const SPRITE_ROWS = 20;
export const ANIM_ROWS = {
    IDLE: 0,          // 1  pose statique
    WALK: 1,          // 2  marche
    JUMP: 2,          // 3  saut
    CROUCH: 3,        // 4  accroupi
    LIGHT: 4,         // 5  attaque légère
    MEDIUM: 5,        // 6  attaque moyenne
    HEAVY: 6,         // 7  attaque lourde
    AIR_LIGHT: 7,     // 8  attaque aérienne légère
    AIR_MEDIUM: 8,    // 9  attaque aérienne moyenne
    AIR_HEAVY: 9,     // 10 attaque aérienne lourde
    CROUCH_LIGHT: 10, // 11 attaque accroupie légère
    CROUCH_MEDIUM: 11,// 12 attaque accroupie moyenne
    CROUCH_HEAVY: 12, // 13 attaque accroupie lourde
    GUARD_HIGH: 13,   // 14 garde haute
    GUARD_LOW: 14,    // 15 garde basse
    KO: 15,           // 16 K.O.
    THROW: 16,        // 17 projection (3 boutons d'attaque ensemble)
    SPECIAL_1: 17,    // 18 coup spécial n°1 (bas avant + attaque)
    SPECIAL_2: 18,    // 19 coup spécial n°2 (bas arrière + attaque)
    SPECIAL_3: 19     // 20 coup spécial n°3 (avant bas avant, 360°, charge...)
};
export const SPRITE_SCALE = 3;        // 50px -> 150px à l'écran

// 4. PHYSIQUE / COMBAT
export const MOVE_SPEED = 5.4;
export const JUMP_VELOCITY = -19;
export const AIR_DRIFT = 4.6;        // contrôle horizontal en l'air
export const DOUBLE_JUMP_VELOCITY = -17;   // second saut
export const MAX_JUMPS = 2;                 // saut + double saut
export const FIGHTER_WIDTH = 90;     // hitbox horizontale (collision corps)
export const FIGHTER_HEIGHT = 150;
export const CROUCH_HEIGHT = 105;    // hitbox accroupie

export const GUARD_CHIP = 0.15;       // dégâts traversés quand on bloque
export const GUARD_STUN = 12;         // frames de blockstun

// 5. PROJECTION (les 3 boutons d'attaque en même temps)
export const THROW = {
    damage: 110, range: 115, frames: 22, startup: 3,
    knockback: 7, hitstun: 34, whiffFrames: 18,
    backKnockback: 9, backHitstun: 38   // projection vers l'arrière : envol plus fort
};

// 6. COUPS SPÉCIAUX
export const SPECIAL = {
    bufferFrames: 40,     // fenêtre de reconnaissance des motions (frames)
    chargeFrames: 36,     // frames de maintien pour une charge
    cancelWindow: 8,      // frames après l'impact d'un coup normal -> cancel spécial
    maxFreeze: 300        // durée max de gel (Rosaline)
};

// Attaques : height = hauteur du coup (mid/high/low)
//   mid  : bloqué par garde haute OU basse
//   high : bloqué uniquement par garde haute (attaques aériennes)
//   low  : bloqué uniquement par garde basse (attaques accroupies)
export const ATTACKS = {
    light: {
        row: ANIM_ROWS.LIGHT, frames: 10, startup: 3, active: 3,
        damage: 40, range: 95, knockback: 6, hitstun: 14,
        height: 'mid', animationSpeed: 1
    },
    medium: {
        row: ANIM_ROWS.MEDIUM, frames: 14, startup: 5, active: 4,
        damage: 70, range: 110, knockback: 10, hitstun: 20,
        height: 'mid', animationSpeed: 0.8
    },
    heavy: {
        row: ANIM_ROWS.HEAVY, frames: 22, startup: 9, active: 5,
        damage: 100, range: 130, knockback: 16, hitstun: 28,
        height: 'mid', animationSpeed: 0.6
    },
    air_light: {
        row: ANIM_ROWS.AIR_LIGHT, frames: 9, startup: 3, active: 5,
        damage: 35, range: 95, knockback: 8, hitstun: 16,
        height: 'high', animationSpeed: 1.1
    },
    air_medium: {
        row: ANIM_ROWS.AIR_MEDIUM, frames: 11, startup: 4, active: 5,
        damage: 60, range: 105, knockback: 12, hitstun: 22,
        height: 'high', animationSpeed: 0.9
    },
    air_heavy: {
        row: ANIM_ROWS.AIR_HEAVY, frames: 13, startup: 5, active: 5,
        damage: 85, range: 120, knockback: 18, hitstun: 30,
        height: 'high', animationSpeed: 0.7
    },
    crouch_light: {
        row: ANIM_ROWS.CROUCH_LIGHT, frames: 8, startup: 3, active: 3,
        damage: 25, range: 90, knockback: 5, hitstun: 12,
        height: 'low', animationSpeed: 1
    },
    crouch_medium: {
        row: ANIM_ROWS.CROUCH_MEDIUM, frames: 12, startup: 5, active: 4,
        damage: 50, range: 105, knockback: 8, hitstun: 18,
        height: 'low', animationSpeed: 0.8
    },
    crouch_heavy: {
        row: ANIM_ROWS.CROUCH_HEAVY, frames: 16, startup: 7, active: 4,
        damage: 75, range: 130, knockback: 14, hitstun: 26,
        height: 'low', animationSpeed: 0.6
    }
};

// 7. TOUCHES (comparées sur e.key en minuscule -> compatible AZERTY/QWERTY)
export const CONTROLS = {
    p1: { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown',
          light: '1', medium: '2', special: '3' },
    p2: { left: 'q', right: 'd', up: 'z', down: 's',
          light: 'k', medium: 'l', special: 'm' }
};
