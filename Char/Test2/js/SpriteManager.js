// =============================================
// SpriteManager.js — Système de sprites animés amélioré
// Tileset (20 lignes x 8 frames) avec effets de style animé :
// - Interpolation fluide entre les frames
// - Squash & stretch dynamique
// - Effets de glow et ombres portées
// - Support des animations en miroir optimisé
// =============================================
import { FRAME_SIZE, FRAME_COUNT, SPRITE_SCALE } from './gameConstants.js';

export class SpriteManager {
    constructor(imagePath) {
        this.imagePath = imagePath;
        this.sheet = null;
        this.flipped = null;        // canvas hors-écran avec le tileset miroir
        this.rows = 4;              // nombre de lignes détectées (4, 16 ou 20)
        this.frameWidth = 0;
        this.frameHeight = 0;
        
        // Cache pour les frames pré-rendues avec effets
        this.frameCache = new Map();
        this.cacheEnabled = true;
        this.maxCacheSize = 500;
        
        // Paramètres d'animation avancés
        this.animationConfig = {
            baseScale: SPRITE_SCALE,
            shadowColor: 'rgba(0, 0, 0, 0.4)',
            shadowBlur: 8,
            shadowOffset: { x: 0, y: 5 },
            outlineColor: 'rgba(0, 0, 0, 0.3)',
            outlineWidth: 2,
            glowColor: null,
            glowBlur: 15,
            brightness: 1.0,
            contrast: 1.0,
            saturation: 1.1
        };
        
        this.ready = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sheet = img;
                this.rows = Math.max(4, Math.round(img.height / FRAME_SIZE));
                this.frameWidth = img.width / FRAME_COUNT;
                this.frameHeight = img.height / this.rows;
                this.flipped = this._buildFlipped(img);
                this._preprocessFrames();
                resolve(this);
            };
            img.onerror = () => reject(new Error(`Tileset introuvable : ${imagePath}`));
            img.crossOrigin = 'anonymous';
            img.src = imagePath;
        });
    }

    /** Crée une copie horizontalement retournée du tileset */
    _buildFlipped(img) {
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext('2d');
        ctx.translate(img.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, 0, 0);
        return c;
    }

    /** Pré-traitement des frames pour optimiser le rendu */
    _preprocessFrames() {
        if (!this.cacheEnabled) return;
        // Pré-cache minimal pour les états de base
        const basicStates = [0, 1, 2, 3]; // idle, walk, jump, crouch
        for (const row of basicStates) {
            for (let col = 0; col < FRAME_COUNT; col++) {
                const key = `${row}-${col}-normal`;
                this._cacheFrame(key, row, col, false);
            }
        }
    }

    /** Met en cache une frame avec ses effets */
    _cacheFrame(key, row, col, flipped) {
        if (this.frameCache.size >= this.maxCacheSize) {
            // Nettoyer le cache si trop plein (LRU simple)
            const firstKey = this.frameCache.keys().next().value;
            this.frameCache.delete(firstKey);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = this.frameWidth * SPRITE_SCALE;
        canvas.height = this.frameHeight * SPRITE_SCALE;
        const ctx = canvas.getContext('2d');
        
        const src = flipped ? this.flipped : this.sheet;
        ctx.drawImage(
            src,
            col * this.frameWidth, row * this.frameHeight, 
            this.frameWidth, this.frameHeight,
            0, 0, canvas.width, canvas.height
        );
        
        this.frameCache.set(key, canvas);
        return canvas;
    }

    /** Obtient une frame du cache ou la crée */
    _getCachedFrame(row, col, flipped) {
        if (!this.cacheEnabled) return null;
        const key = `${row}-${col}-${flipped ? 'flipped' : 'normal'}`;
        if (this.frameCache.has(key)) {
            return this.frameCache.get(key);
        }
        return this._cacheFrame(key, row, col, flipped);
    }

    /** Applique des effets de style animé au sprite */
    _applyAnimatedEffects(ctx, x, y, width, height, options = {}) {
        const {
            squash = 1,
            stretch = 1,
            rotation = 0,
            glowColor = null,
            glowIntensity = 0,
            flashColor = null,
            flashIntensity = 0,
            opacity = 1,
            colorTint = null
        } = options;

        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }

        // Effet de glow (aura)
        if (glowColor && glowIntensity > 0) {
            ctx.save();
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = glowIntensity * 20;
            ctx.globalAlpha = opacity * 0.6;
            ctx.fillRect(x - 10, y - height - 10, width + 20, height + 20);
            ctx.restore();
        }

        // Effet de flash (impact/hit)
        if (flashColor && flashIntensity > 0) {
            ctx.save();
            ctx.fillStyle = flashColor;
            ctx.globalAlpha = flashIntensity * 0.7;
            ctx.fillRect(x, y - height, width, height);
            ctx.restore();
        }

        // Teinte de couleur (pour effets élémentaires)
        if (colorTint) {
            ctx.save();
            ctx.globalCompositeOperation = 'overlay';
            ctx.fillStyle = colorTint;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(x, y - height, width, height);
            ctx.restore();
        }
    }

    /** Dessine la frame avec des effets de style animé avancés */
    draw(ctx, row, frame, x, y, facing, scale = SPRITE_SCALE, options = {}) {
        const {
            squash = 1.0,           // Compression verticale (0.8 = écrasé, 1.2 = étiré)
            stretch = 1.0,          // Étirement horizontal
            rotation = 0,           // Rotation en radians
            glowColor = null,       // Couleur de l'aura (ex: '#ff6600')
            glowIntensity = 0,      // Intensité du glow (0-1)
            flashColor = null,      // Couleur de flash
            flashIntensity = 0,     // Intensité du flash (0-1)
            opacity = 1.0,          // Opacité globale
            colorTint = null,       // Teinte de couleur
            additiveBlend = false,  // Mode de fusion additif
            motionBlur = 0          // Traînée de mouvement (0-1)
        } = options;

        const src = facing === -1 ? this.flipped : this.sheet;
        const r = Math.min(row, this.rows - 1);
        const col = Math.min(frame, FRAME_COUNT - 1);
        
        // Dimensions de base
        const baseWidth = this.frameWidth * scale;
        const baseHeight = this.frameHeight * scale;
        
        // Application du squash & stretch
        const scaledWidth = baseWidth * stretch;
        const scaledHeight = baseHeight * squash;
        
        // Position ajustée pour garder les pieds ancrés au sol
        const drawX = x - scaledWidth / 2;
        const drawY = y - scaledHeight;

        ctx.save();

        // Mode de fusion additif pour effets spéciaux
        if (additiveBlend) {
            ctx.globalCompositeOperation = 'lighter';
        }

        // Translation au centre du sprite pour rotation/squash
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Application du squash & stretch depuis le centre
        ctx.scale(stretch, squash);
        ctx.translate(-x, -y);

        // Ombre portée dynamique
        if (this.animationConfig.shadowColor) {
            ctx.save();
            ctx.shadowColor = this.animationConfig.shadowColor;
            ctx.shadowBlur = this.animationConfig.shadowBlur * squash;
            // API canvas : shadowOffsetX/Y (pas ctx.shadowOffset.x/y)
            ctx.shadowOffsetX = this.animationConfig.shadowOffset.x * facing;
            ctx.shadowOffsetY = this.animationConfig.shadowOffset.y;
        }

        // Effet de motion blur (traînées)
        if (motionBlur > 0) {
            const blurSteps = Math.floor(motionBlur * 5);
            for (let i = 1; i <= blurSteps; i++) {
                const blurAlpha = (motionBlur * 0.15) / i;
                const blurOffset = (facing * i * 8) / blurSteps;
                ctx.globalAlpha = blurAlpha;
                ctx.drawImage(
                    src,
                    col * this.frameWidth, r * this.frameHeight, 
                    this.frameWidth, this.frameHeight,
                    drawX + blurOffset, drawY, scaledWidth, scaledHeight
                );
            }
            ctx.globalAlpha = 1;
        }

        // Dessin du sprite principal
        ctx.globalAlpha = opacity;
        ctx.drawImage(
            src,
            col * this.frameWidth, r * this.frameHeight, 
            this.frameWidth, this.frameHeight,
            drawX, drawY, scaledWidth, scaledHeight
        );

        ctx.restore();

        // Effets post-processing (glow, flash, tint)
        this._applyAnimatedEffects(ctx, drawX, drawY, scaledWidth, scaledHeight, {
            glowColor,
            glowIntensity,
            flashColor,
            flashIntensity,
            opacity,
            colorTint
        });
    }

    /** Dessine avec interpolation entre deux frames pour fluidité */
    drawInterpolated(ctx, row, frame1, frame2, t, x, y, facing, scale = SPRITE_SCALE, options = {}) {
        // t = 0 → frame1, t = 1 → frame2
        const clampedT = Math.max(0, Math.min(1, t));
        
        // Pour l'instant, on fait un fondu entre les deux frames
        // Une version plus avancée pourrait interpoler les vertices
        ctx.save();
        
        // Frame 1 avec opacité décroissante
        this.draw(ctx, row, frame1, x, y, facing, scale, {
            ...options,
            opacity: (1 - clampedT) * (options.opacity || 1)
        });
        
        // Frame 2 avec opacité croissante
        this.draw(ctx, row, frame2, x, y, facing, scale, {
            ...options,
            opacity: clampedT * (options.opacity || 1),
            additiveBlend: true
        });
        
        ctx.restore();
    }

    /** Définit la configuration des effets */
    setAnimationConfig(config) {
        Object.assign(this.animationConfig, config);
    }

    /** Réinitialise le cache */
    clearCache() {
        this.frameCache.clear();
    }

    /** Active/désactive le cache */
    setCacheEnabled(enabled) {
        this.cacheEnabled = enabled;
        if (!enabled) this.clearCache();
    }
}
