// =============================================
// Projectile.js — projectiles des coups spéciaux
// (boules de feu, roquettes, glace, balles...)
// =============================================
export class Projectile {
    /** p : config du projectile, spawn : { x, y, vx, vy, facing } */
    constructor(owner, p, spawn) {
        this.owner = owner;
        this.x = spawn.x;
        this.y = spawn.y;
        this.vx = spawn.vx;
        this.vy = spawn.vy || 0;
        this.damage = p.damage;
        this.size = p.size;
        this.color = p.color;
        this.life = p.life;
        this.freeze = !!p.freeze;
        this.height = p.height || 'mid';
        this.dead = false;
        this.t = 0;
    }

    get top() { return this.y - this.size; }
    get bottom() { return this.y + this.size; }
    get left() { return this.x - this.size; }
    get right() { return this.x + this.size; }

    update() {
        this.t++;
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        if (this.life <= 0 || this.x < -60 || this.x > 1340) this.dead = true;
    }

    draw(ctx) {
        ctx.save();
        // halo
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.7, 0, Math.PI * 2);
        ctx.fill();
        // traînée
        ctx.globalAlpha = 0.6;
        const trail = Math.sign(this.vx) * this.size * 1.6;
        ctx.fillRect(this.x - trail / 2, this.y - this.size / 2, trail, this.size);
        // cœur
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(this.x - Math.sign(this.vx) * this.size * 0.25, this.y - this.size * 0.25,
                this.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
