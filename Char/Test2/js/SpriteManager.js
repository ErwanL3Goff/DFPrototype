// =============================================
// SpriteManager.js — charge un tileset (16 lignes x 8 frames,
// compatible avec les anciens 4 lignes) et gère le miroir.
// =============================================
import { FRAME_SIZE, FRAME_COUNT, SPRITE_SCALE } from './gameConstants.js';

export class SpriteManager {
    constructor(imagePath) {
        this.imagePath = imagePath;
        this.sheet = null;
        this.flipped = null;   // canvas hors-écran avec le tileset miroir
        this.rows = 4;         // nombre de lignes détectées (4 ou 16)
        this.ready = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sheet = img;
                this.rows = Math.max(4, Math.round(img.height / FRAME_SIZE));
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
        const fh = this.sheet.height / this.rows;
        const r = Math.min(row, this.rows - 1);        // sécurité anciens tilesets
        const col = Math.min(frame, FRAME_COUNT - 1);
        ctx.drawImage(
            src,
            col * fw, r * fh, fw, fh,
            x - (fw * scale) / 2, y - fh * scale,  // centré, pieds sur y
            fw * scale, fh * scale
        );
    }
}
