// =============================================
// CONSTANTES DU JEU - gameConstants.js
// =============================================

// 1. CONSTANTES GÉNÉRALES
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_LEVEL = 550; // Niveau du sol en pixels
export const GRAVITY = 0.5; // Force de gravité
export const MAX_FPS = 60; // Images par seconde

// 2. CONSTANTES DES PERSONNAGES
export const MAX_HP = 1000; // Points de vie maximum
export const MAX_V_TRIGGER = 600; // Jauge de V-Trigger max
export const MAX_CRITICAL_ART = 500; // Jauge de Critical Art max

// 3. ÉTATS D'ANIMATION
export const ANIMATION_STATES = {
    // Mouvements de base
    IDLE: 0,           // 7 sprites
    WALK: 1,           // 6 sprites
    JUMP: 2,           // 3 sprites (décollage, apex, atterrissage)
    CROUCH: 3,         // 2 sprites
    
    // Attaques au sol
    LIGHT_ATTACK: 4,    // 3 sprites
    MEDIUM_ATTACK: 5,    // 4 sprites
    HEAVY_ATTACK: 6,     // 5 sprites
    
    // Attaques aériennes
    AIR_LIGHT_ATTACK: 7,  // 3 sprites
    AIR_MEDIUM_ATTACK: 8, // 4 sprites
    AIR_HEAVY_ATTACK: 9,  // 5 sprites
    
    // Attaques accroupies
    CROUCH_LIGHT_ATTACK: 10,  // 3 sprites
    CROUCH_MEDIUM_ATTACK: 11, // 4 sprites
    CROUCH_HEAVY_ATTACK: 12,  // 5 sprites
    
    // Gardes
    STAND_GUARD: 13,    // 1 sprite
    CROUCH_GUARD: 14,   // 1 sprite
    
    // Dégâts
    HIT: 15,            // 3 sprites (dégâts normaux + aériens + KO)
    KO: 16,             // Alias pour HIT avec gestion spéciale
    
    // Coups spéciaux
    CLINT_EASTWOOD: 17, // 6 sprites (Hadouken)
    CASSANDRA_TORNADO: 18, // 8 sprites (Tatsumaki)
    HERCULEOPERCUT: 19, // 4 sprites (Shoryuken)
    
    // Mécaniques spéciales
    V_TRIGGER: 20,      // 2 sprites (power-up)
    CRITICAL_ART: 21,    // 7 sprites (super attaque)
    
    // Résultats
    VICTORY: 22         // 3 sprites (animation de victoire)
};

// 4. CONSTANTES DE CONTROLES
export const KEYS = {
    // Joueur 1 (Clavier)
    P1_LEFT: 'ArrowLeft',
    P1_RIGHT: 'ArrowRight',
    P1_UP: 'ArrowUp',
    P1_DOWN: 'ArrowDown',
    P1_LIGHT: '1',      // Attaque légère
    P1_MEDIUM: '2',     // Attaque moyenne
    P1_HEAVY: '3',      // Attaque lourde
    P1_VTRIGGER: '0',   // V-Trigger
    
    // Joueur 2 (Clavier AZERTY)
    P2_LEFT: 'q',
    P2_RIGHT: 'd',
    P2_UP: 'z',
    P2_DOWN: 's',
    P2_LIGHT: 'k',      // Attaque légère
    P2_MEDIUM: 'l',     // Attaque moyenne
    P2_HEAVY: 'm',      // Attaque lourde
    P2_VTRIGGER: 'o'    // V-Trigger
};

// 5. PARAMÈTRES DES ANIMATIONS
export const ANIMATION_CONFIG = {
    // Durée de chaque frame en ms
    FRAME_DURATIONS: {
        [ANIMATION_STATES.IDLE]: 150,
        [ANIMATION_STATES.WALK]: 100,
        [ANIMATION_STATES.JUMP]: [120, 80, 120], // Durées différentes par frame
        [ANIMATION_STATES.LIGHT_ATTACK]: 80,
        [ANIMATION_STATES.HEAVY_ATTACK]: 100,
        // ... configurer toutes les animations
    },
    
    // Quelles animations bouclent ?
    LOOPING_ANIMATIONS: [
        ANIMATION_STATES.IDLE,
        ANIMATION_STATES.WALK,
        ANIMATION_STATES.V_TRIGGER
    ],
    
    // Frames actives pour les attaques (frame qui touche)
    ATTACK_FRAMES: {
        [ANIMATION_STATES.LIGHT_ATTACK]: 2, // Dernière frame
        [ANIMATION_STATES.MEDIUM_ATTACK]: 3,
        [ANIMATION_STATES.HEAVY_ATTACK]: 4,
        // ... configurer toutes les attaques
    }
};

// 6. CONSTANTES DE COMBAT
export const COMBAT_VALUES = {
    // Dégâts de base
    DAMAGE: {
        LIGHT: 50,
        MEDIUM: 80,
        HEAVY: 120,
        COUNTER_MULTIPLIER: 1.5,   // Bonus dégâts en counter
        CRUSH_COUNTER_MULTIPLIER: 2 // Bonus dégâts en crush counter
    },
    
    // Délais de récupération (en frames)
    RECOVERY: {
        LIGHT: 15,
        MEDIUM: 25,
        HEAVY: 40,
        HIT_STUN: 30 // Délais quand on est touché
    },
    
    // Jauges
    METER_GAIN: {
        ON_HIT: 20,       // Jauge gagnée quand on touche
        ON_GUARD: 10,     // Jauge gagnée en gardant
        ON_DAMAGE: 15     // Jauge gagnée en subissant des dégâts
    }
};

// 7. PARAMÈTRES VISUELS
export const UI_SETTINGS = {
    HEALTH_BAR: {
        WIDTH: 400,
        HEIGHT: 20,
        COLOR: '#00FF00',
        LOW_HP_COLOR: '#FF0000' // Quand HP < 20%
    },
    
    V_TRIGGER_BAR: {
        WIDTH: 200,
        HEIGHT: 10,
        COLOR: '#00FFFF'
    },
    
    CRITICAL_ART_BAR: {
        WIDTH: 200,
        HEIGHT: 10,
        COLOR: '#FFFF00'
    }
};

// 8. EFFETS SPÉCIAUX
export const EFFECTS = {
    SCREEN_SHAKE: {
        LIGHT: { intensity: 5, duration: 0.3 },
        HEAVY: { intensity: 10, duration: 0.5 },
        CRITICAL: { intensity: 15, duration: 1.0 }
    },
    
    HIT_PAUSE: {
        // Durée en secondes
        LIGHT: 0.1,
        HEAVY: 0.2,
        SPECIAL: 0.3
    }
};

// 9. CONSTANTES DES COUPS SPÉCIAUX
export const SPECIAL_MOVES = {
    CLINT_EASTWOOD: {
        INPUT: ['down', 'forward', 'attack'], // Hadouken
        DAMAGE: 150,
        MIN_METER: 100
    },
    CASSANDRA_TORNADO: {
        INPUT: ['down', 'back', 'attack'], // Tatsumaki
        DAMAGE: 100,
        MIN_METER: 100
    },
    HERCULEOPERCUT: {
        INPUT: ['forward', 'down', 'forward', 'attack'], // Shoryuken
        DAMAGE: 200,
        MIN_METER: 150
    }
};