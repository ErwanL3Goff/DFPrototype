// =============================================
// SpriteManager.js — charge un tileset 4x8 (idle/walk/attack/special)
// et gère automatiquement la version miroir (retournement).
// =============================================
import { FRAME_SIZE, FRAME_COUNT, ANIM_ROWS, SPRITE_SCALE } from './gameConstants.js';

export class SpriteManager {
    constructor(imagePath) {
        this.imagePath = imagePath;
        this.sheet = null;
        this.flipped = null;   // canvas hors-écran avec le tileset miroir
        this.ready = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sheet = img;
                this.flipped = this._buildFlipped(img);
                resolve(this);
            };
            img.onerror = () => reject(new Error(`Tileset introuvable : ${imagePath}`));
            img.src = imagePath;
        });
    }

    /** Crée une copie horizontalement retournée du tileset (correction du
        bug de l'ancien système où tilesetFlip utilisait la même image). */
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

    /** Dessine la frame `frame` de la ligne `row`, ancrée aux pieds (x, y). */
    draw(ctx, row, frame, x, y, facing, scale = SPRITE_SCALE) {
        const src = facing === -1 ? this.flipped : this.sheet;
        const fw = this.sheet.width / FRAME_COUNT;
        const fh = this.sheet.height / 4;
        const col = Math.min(frame, FRAME_COUNT - 1);
        ctx.drawImage(
            src,
            col * fw, row * fh, fw, fh,
            x - (fw * scale) / 2, y - fh * scale,  // centré, pieds sur y
            fw * scale, fh * scale
        );
    }
}
