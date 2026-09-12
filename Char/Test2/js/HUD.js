// =============================================
// HUD.js — barres de vie, noms, timer, pips de rounds.
// =============================================
import { GAME_WIDTH, MAX_HP, ROUND_TIME, WINS_NEEDED } from './gameConstants.js';

export class HUD {
    constructor() {
        this.displayedHp = { p1: MAX_HP, p2: MAX_HP }; // barre de vie "retard" (dégâts visibles)
    }

    update(f1, f2) {
        this.displayedHp.p1 += Math.max(0, f1.hp - this.displayedHp.p1) * 0.15;
        this.displayedHp.p2 += Math.max(0, f2.hp - this.displayedHp.p2) * 0.15;
        this.displayedHp.p1 = Math.max(this.displayedHp.p1, f1.hp);
        this.displayedHp.p2 = Math.max(this.displayedHp.p2, f2.hp);
    }

    _bar(ctx, x, dir, hp, shown, name, color, wins) {
        const w = 470, h = 26, y = 40;
        // fond
        ctx.fillStyle = '#151021';
        ctx.fillRect(x, y, w * dir, h);
        // dégâts récents (blanc)
        ctx.fillStyle = '#e8e2f0';
        ctx.fillRect(x, y, (w * shown / MAX_HP) * dir, h);
        // vie
        ctx.fillStyle = color;
        ctx.fillRect(x, y, (w * hp / MAX_HP) * dir, h);
        // liseré
        ctx.strokeStyle = '#f0e6d2';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w * dir, h);

        // nom
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = dir === 1 ? 'left' : 'right';
        ctx.fillText(name.toUpperCase(), dir === 1 ? x : x, y + 48);

        // pips de victoire
        for (let i = 0; i < WINS_NEEDED; i++) {
            ctx.beginPath();
            const px = dir === 1 ? x + 4 + i * 22 : x - 8 - i * 22;
            ctx.arc(px, y + 60, 7, 0, Math.PI * 2);
            ctx.fillStyle = i < wins ? '#ffd24a' : 'rgba(255,255,255,0.25)';
            ctx.fill();
        }
    }

    render(ctx, f1, f2, timeLeft) {
        this._bar(ctx, 40, 1, f1.hp, this.displayedHp.p1, f1.name, '#4ac0ff', f1.wins);
        this._bar(ctx, GAME_WIDTH - 40, -1, f2.hp, this.displayedHp.p2, f2.name, '#ff5a5a', f2.wins);

        // timer
        ctx.fillStyle = '#151021';
        ctx.fillRect(GAME_WIDTH / 2 - 45, 30, 90, 50);
        ctx.strokeStyle = '#f0e6d2';
        ctx.lineWidth = 2;
        ctx.strokeRect(GAME_WIDTH / 2 - 45, 30, 90, 50);
        ctx.fillStyle = timeLeft <= 10 ? '#ff5a5a' : '#fff';
        ctx.font = 'bold 32px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.max(0, Math.ceil(timeLeft))), GAME_WIDTH / 2, 68);
        ctx.textAlign = 'left';
    }
}
