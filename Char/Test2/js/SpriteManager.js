import { ANIMATION_STATES } from './gameConstants.js';

export class SpriteManager {
    constructor(imagePath) {
        // Configuration de base
        this.spritesheet = new Image();
        this.spritesheet.src = imagePath;
        this.flippedSpritesheet = null;
        this.isLoaded = false;
        
        // Dimensions des sprites (calculées après chargement)
        this.spriteWidth = 0;
        this.spriteHeight = 0;
        this.columns = 0;
        
        // Cache des sprites pour optimisation
        this.spriteCache = {};
        this.flippedSpriteCache = {};
        
        // Chargement de l'image
        this.spritesheet.onload = () => {
            this.calculateSpriteDimensions();
            this.createFlippedSpritesheet();
            this.preloadCommonSprites();
            this.isLoaded = true;
            console.log('Spritesheet chargé avec succès');
        };
        
        this.spritesheet.onerror = () => {
            console.error("Erreur de chargement du spritesheet");
        };
    }


    
    // =================================
    // MÉTHODES DE CALCUL DES DIMENSIONS
    // =================================

    calculateSpriteDimensions() {
        // Votre tileset a 22 lignes avec différentes largeurs de sprites
        // Nous devons calculer la largeur pour chaque ligne
        
        // Largeur totale de la tileset
        const totalWidth = this.spritesheet.width;
        
        // Hauteur par sprite (chaque ligne a la même hauteur)
        this.spriteHeight = Math.floor(this.spritesheet.height / 22);
        
        // Configuration spécifique pour chaque ligne d'animation
this.animationConfig = {
    // Ligne 0: Position statique (7 sprites)
    [ANIMATION_STATES.IDLE]: {
        frames: 7,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 7), // ~488px
        hitbox: { width: 60, height: 120, yOffset: 0 }
    },

    // Ligne 1: Marche (6 sprites)
    [ANIMATION_STATES.WALK]: {
        frames: 6,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 6), // ~570px
        hitbox: { width: 65, height: 120, yOffset: 0 }
    },

    // Ligne 2: Saut (3 sprites)
    [ANIMATION_STATES.JUMP]: {
        frames: 3,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 3), // ~1139px
        hitbox: [
            { width: 60, height: 120, yOffset: 0 },   // Frame 1 (décollage)
            { width: 70, height: 110, yOffset: -10 }, // Frame 2 (apex)
            { width: 65, height: 115, yOffset: 5 }   // Frame 3 (atterrissage)
        ]
    },

    // Ligne 3: Accroupi (2 sprites)
    [ANIMATION_STATES.CROUCH]: {
        frames: 2,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 2), // ~1709px
        hitbox: { width: 70, height: 60, yOffset: 60 }
    },

    // Ligne 4: Attaque rapide (3 sprites)
    [ANIMATION_STATES.LIGHT_ATTACK]: {
        frames: 3,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 3), // ~1139px
        hitFrame: 2, // Dernière frame active
        hitbox: [
            { width: 60, height: 120, yOffset: 0 },
            { width: 70, height: 120, yOffset: 0 },
            { width: 100, height: 100, yOffset: 20, attackBox: { x: 30, width: 70 } }
        ]
    },

    // Ligne 5: Attaque moyenne (4 sprites)
    [ANIMATION_STATES.MEDIUM_ATTACK]: {
        frames: 4,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 4), // ~854px
        hitFrame: 3,
        hitbox: [
            // ... config similaire avec une hitbox d'attaque plus large
        ]
    },

    // Ligne 6: Attaque lourde (5 sprites)
    [ANIMATION_STATES.HEAVY_ATTACK]: {
        frames: 5,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 5), // ~683px
        hitFrame: 4,
        hitbox: [
            // ... config avec hitbox d'attaque très large
        ]
    },

    // Ligne 7: Attaque rapide aérienne (3 sprites)
    [ANIMATION_STATES.AIR_LIGHT_ATTACK]: {
        frames: 3,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 3),
        hitFrame: 2,
        hitbox: [
            // ... config adaptée pour les attaques aériennes
        ]
    },

    // Ligne 8: Attaque moyenne aérienne (4 sprites)
    [ANIMATION_STATES.AIR_MEDIUM_ATTACK]: {
        frames: 4,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 4),
        hitFrame: 3,
        // ... etc.
    },

    // Ligne 9: Attaque lourde aérienne (5 sprites)
    [ANIMATION_STATES.AIR_HEAVY_ATTACK]: {
        frames: 5,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 5),
        hitFrame: 4,
        // ... etc.
    },

    // Ligne 10: Attaque rapide accroupie (3 sprites)
    [ANIMATION_STATES.CROUCH_LIGHT_ATTACK]: {
        frames: 3,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 3),
        hitFrame: 2,
        hitbox: { width: 70, height: 60, yOffset: 60 }
    },

    // Ligne 11: Attaque moyenne accroupie (4 sprites)
    [ANIMATION_STATES.CROUCH_MEDIUM_ATTACK]: {
        frames: 4,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 4),
        hitFrame: 3,
        // ... etc.
    },

    // Ligne 12: Attaque lourde accroupie (5 sprites)
    [ANIMATION_STATES.CROUCH_HEAVY_ATTACK]: {
        frames: 5,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 5),
        hitFrame: 4,
        // ... etc.
    },

    // Ligne 13: Garde debout (1 sprite)
    [ANIMATION_STATES.STAND_GUARD]: {
        frames: 1,
        xOffset: 0,
        frameWidth: 3418,
        hitbox: { width: 60, height: 120, yOffset: 0, guard: true }
    },

    // Ligne 14: Garde accroupie (1 sprite)
    [ANIMATION_STATES.CROUCH_GUARD]: {
        frames: 1,
        xOffset: 0,
        frameWidth: 3418,
        hitbox: { width: 70, height: 60, yOffset: 60, guard: true }
    },

    // Ligne 15: Dégâts (3 sprites - normal, aérien, KO)
    [ANIMATION_STATES.HIT]: {
        frames: 3,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 3),
        hitbox: [
            { width: 70, height: 120, yOffset: 0 }, // Dégâts normaux
            { width: 80, height: 100, yOffset: 20 }, // Dégâts aériens
            { width: 90, height: 90, yOffset: 30 }   // KO
        ]
    },

    // Ligne 16: Clint Eastwood (6 sprites)
    [ANIMATION_STATES.CLINT_EASTWOOD]: {
        frames: 6,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 6),
        hitFrame: 2, // Frame de lancement du projectile
        recoveryFrame: 3, // Frame de récupération
        hitbox: [
            // ... configuration détaillée pour chaque frame
        ],
        projectile: {
            frame: 2, // Frame où le projectile apparaît
            speed: 12,
            damage: 150
        }
    },

    // Ligne 17: Cassandra Tornado (8 sprites)
    [ANIMATION_STATES.CASSANDRA_TORNADO]: {
        frames: 8,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 8),
        movement: {
            frames: [1, 2, 3, 4, 5], // Frames avec déplacement
            distance: 50 // Pixels de déplacement par frame
        },
        hitFrames: [2, 3, 4, 5], // Frames actives
        // ... etc.
    },

    // Ligne 18: Herculeopercut (4 sprites)
    [ANIMATION_STATES.HERCULEOPERCUT]: {
        frames: 4,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 4),
        hitFrames: [1, 2], // Frames actives
        jump: {
            height: 200, // Hauteur du saut
            frames: [1, 2] // Frames ascendantes
        },
        // ... etc.
    },

    // Ligne 19: V-Trigger (2 sprites)
    [ANIMATION_STATES.V_TRIGGER]: {
        frames: 2,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 2),
        loop: true,
        effect: {
            frame: 1, // Frame où l'effet visuel apparaît
            duration: 10000 // 10 secondes
        }
    },

    // Ligne 20: Critical Art (7 sprites)
    [ANIMATION_STATES.CRITICAL_ART]: {
        frames: 7,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 7),
        hitFrames: [2, 3, 4, 5], // Frames actives
        movement: {
            advance: 20, // Pixels de déplacement avant par frame
            frames: [2, 3, 4]
        },
        // ... etc.
    },

    // Ligne 21: Victoire (3 sprites)
    [ANIMATION_STATES.VICTORY]: {
        frames: 3,
        xOffset: 0,
        frameWidth: Math.floor(3418 / 3),
        loop: false,
        hitbox: { width: 80, height: 120, yOffset: 0 }
    }
};
    }

    // =================================
    // MÉTHODES DE PRÉPARATION DES SPRITES
    // =================================

    createFlippedSpritesheet() {
        const canvas = document.createElement('canvas');
        canvas.width = this.spritesheet.width;
        canvas.height = this.spritesheet.height;
        const ctx = canvas.getContext('2d');
        
        // Applique une transformation miroir horizontale
        ctx.translate(this.spritesheet.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.spritesheet, 0, 0);
        
        // Convertit le canvas en image
        this.flippedSpritesheet = new Image();
        this.flippedSpritesheet.src = canvas.toDataURL();
    }

    preloadCommonSprites() {
        // Précharge les sprites fréquemment utilisés
        this.getSprite(ANIMATION_STATES.IDLE, 0, true);
        this.getSprite(ANIMATION_STATES.WALK, 0, true);
        this.getSprite(ANIMATION_STATES.IDLE, 0, false);
    }

    // =================================
    // MÉTHODES D'OBTENTION DES SPRITES
    // =================================

    getSprite(animationState, frameIndex, isFacingRight) {
        // Vérifie le cache d'abord
        const cacheKey = `${animationState}_${frameIndex}_${isFacingRight}`;
        if (isFacingRight && this.spriteCache[cacheKey]) {
            return this.spriteCache[cacheKey];
        } else if (!isFacingRight && this.flippedSpriteCache[cacheKey]) {
            return this.flippedSpriteCache[cacheKey];
        }
        
        // Crée un nouveau sprite si pas dans le cache
        const sprite = this.createSprite(animationState, frameIndex, isFacingRight);
        
        // Met en cache
        if (isFacingRight) {
            this.spriteCache[cacheKey] = sprite;
        } else {
            this.flippedSpriteCache[cacheKey] = sprite;
        }
        
        return sprite;
    }

    createSprite(animationState, frameIndex, isFacingRight) {
        const config = this.animationConfig[animationState];
        if (!config) {
            console.error(`Configuration manquante pour l'état d'animation: ${animationState}`);
            return this.createErrorSprite();
        }
        
        // Calcule la position dans la tileset
        const lineIndex = this.getAnimationLine(animationState);
        const frameWidth = Math.floor(this.spritesheet.width / config.frames);
        const sourceX = config.xOffset + (frameIndex * frameWidth);
        const sourceY = lineIndex * this.spriteHeight;
        
        // Crée un canvas pour le sprite
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = this.spriteHeight;
        const ctx = canvas.getContext('2d');
        
        // Dessine le sprite (normal ou miroir)
        const sourceImage = isFacingRight ? this.spritesheet : this.flippedSpritesheet;
        
        ctx.drawImage(
            sourceImage,
            sourceX, sourceY, frameWidth, this.spriteHeight,
            0, 0, frameWidth, this.spriteHeight
        );
        
        // Optimisation: convertit en Image si ce sprite est fréquemment utilisé
        if (animationState === ANIMATION_STATES.IDLE || animationState === ANIMATION_STATES.WALK) {
            return this.canvasToImage(canvas);
        }
        
        return canvas;
    }

    canvasToImage(canvas) {
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    createErrorSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'magenta';
        ctx.fillRect(0, 0, 50, 100);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, 50, 100);
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText('SPRITE', 5, 20);
        ctx.fillText('MANQUANT', 5, 35);
        
        return canvas;
    }

    // =================================
    // MÉTHODES UTILITAIRES
    // =================================

    getAnimationLine(animationState) {
        // Mappage des états d'animation aux lignes de la tileset
        switch(animationState) {
            case ANIMATION_STATES.IDLE: return 0;
            case ANIMATION_STATES.WALK: return 1;
            case ANIMATION_STATES.JUMP: return 2;
            // ... mappage complet pour tous les états
            default: return 0;
        }
    }

    getFrameCount(animationState) {
        // Retourne le nombre de frames pour chaque animation
        const config = this.animationConfig[animationState];
        return config ? config.frames : 1;
    }

    getSpriteDimensions(animationState) {
        // Retourne les dimensions spécifiques pour une animation
        const config = this.animationConfig[animationState];
        const frameWidth = config ? Math.floor(this.spritesheet.width / config.frames) : this.spriteWidth;
        return {
            width: frameWidth,
            height: this.spriteHeight
        };
    }
}