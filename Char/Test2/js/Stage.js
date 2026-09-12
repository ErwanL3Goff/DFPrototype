// =============================================
// Stage.js — décor du combat (dessiné sur canvas, sans assets externes).
// =============================================
import { GAME_WIDTH, GAME_HEIGHT, GROUND_Y } from './gameConstants.js';

export class Stage {
    constructor(name = 'Dojo du Couchant') {
        this.name = name;
        this.time = 0;
    }

    update() { this.time++; }

    render(ctx) {
        // ciel
        const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        sky.addColorStop(0, '#1a1a3e');
        sky.addColorStop(0.55, '#5b3a7e');
        sky.addColorStop(1, '#e8734a');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // soleil couchant
        ctx.fillStyle = '#ffd27a';
        ctx.beginPath();
        ctx.arc(GAME_WIDTH / 2 + Math.sin(this.time * 0.002) * 30, GROUND_Y - 160, 70, 0, Math.PI * 2);
        ctx.fill();

        // silhouette de ville lointaine
        ctx.fillStyle = 'rgba(20,15,45,0.9)';
        let seed = 7;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let x = 0; x < GAME_WIDTH; x += 60) {
            const h = 60 + rand() * 140;
            ctx.fillRect(x, GROUND_Y - h, 52, h);
        }

        // sol / ring
        ctx.fillStyle = '#3b2f52';
        ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
        ctx.fillStyle = '#2c2340';
        for (let i = 0; i < GAME_WIDTH; i += 64) {
            ctx.fillRect(i, GROUND_Y, 4, GAME_HEIGHT - GROUND_Y);
        }
        // liseré du sol
        ctx.fillStyle = '#e8b04a';
        ctx.fillRect(0, GROUND_Y - 4, GAME_WIDTH, 4);
    }
}
