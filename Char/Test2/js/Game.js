// =============================================
// Game.js — orchestrateur : lancement de partie, mise en scène,
// rounds (best of 3), résolution des coups, écrans d'annonce.
// =============================================
import { GAME_WIDTH, GROUND_Y, ROUND_TIME, WINS_NEEDED, FIGHTER_WIDTH } from './gameConstants.js';
import { Fighter } from './Fighter.js';
import { Stage } from './Stage.js';
import { HUD } from './HUD.js';

export class Game {
    constructor(canvas, ui, charData1, charData2, input) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = ui;                    // éléments DOM d'annonce (div overlay)
        this.input = input;

        this.stage = new Stage();
        this.hud = new HUD();

        this.f1 = new Fighter({
            id: 'p1', data: charData1,
            spriteManager: charData1.sprites, x: 300, facing: 1, input
        });
        this.f2 = new Fighter({
            id: 'p2', data: charData2,
            spriteManager: charData2.sprites, x: GAME_WIDTH - 300, facing: -1, input
        });

        this.state = 'INTRO';            // INTRO -> FIGHT -> KO -> ROUND_END -> MATCH_END
        this.stateTimer = 0;
        this.round = 1;
        this.timeLeft = ROUND_TIME;
        this.tick = 0;
        this.slowmo = 0;
        this.shake = 0;
        this.queuedAnnouncements = [];

        this._startIntro();
        this._bindUi();
    }

    _bindUi() {
        const { announceEl, rematchBtn, quitBtn } = this.ui;
        rematchBtn.addEventListener('click', () => {
            if (this.state === 'MATCH_END') {
                this.f1.wins = 0; this.f2.wins = 0;
                this.round = 1;
                this._resetRound();
            }
        });
        quitBtn.addEventListener('click', () => {
            window.location.href = '../../Character Select/index.html';
        });
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.state === 'MATCH_END') rematchBtn.click();
            if (e.key === 'Escape') window.location.href = '../../Character Select/index.html';
        });
    }

    // ---------- mise en scène ----------

    _startIntro() {
        this.state = 'INTRO';
        this.stateTimer = 0;
        this.f1.x = -100;                 // entrent depuis les coulisses
        this.f2.x = GAME_WIDTH + 100;
        this.f1.state = 'walk';
        this.f2.state = 'walk';
        this._announce(`${this.f1.name.toUpperCase()}  VS  ${this.f2.name.toUpperCase()}`, 120);
        this._announce(`ROUND ${this.round}`, 70);
        this._announce('READY...', 60);
        this._announce('FIGHT !', 45);
    }

    _resetRound() {
        for (const f of [this.f1, this.f2]) {
            f.hp = f.maxHp;
            f.state = 'idle';
            f.attack = null;
            f.hitstun = 0;
            f.wins = f.wins;
            f.x = f.id === 'p1' ? 300 : GAME_WIDTH - 300;
            f.y = GROUND_Y;
            f.vx = 0; f.vy = 0; f.grounded = true;
            f.facing = f.id === 'p1' ? 1 : -1;
        }
        this.timeLeft = ROUND_TIME;
        this.hud = new HUD();
        this._startIntro();
    }

    _announce(text, frames) {
        this.queuedAnnouncements.push({ text, frames });
    }

    _renderAnnouncement() {
        const el = this.ui.announceEl;
        const current = this.queuedAnnouncements[0];
        if (!current) { el.classList.remove('visible'); return; }
        current.frames--;
        if (current.frames <= 0) { this.queuedAnnouncements.shift(); return; }
        if (el.textContent !== current.text) el.textContent = current.text;
        el.classList.add('visible');
    }

    // ---------- boucle principale ----------

    start() {
        const loop = () => {
            this.update();
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update() {
        this.tick++;
        this.stage.update();
        this._renderAnnouncement();

        const steps = this.slowmo > 0 ? 1 : 1;
        for (let s = 0; s < steps; s++) {
            if (this.slowmo > 0) this.slowmo--;
            if (this.shake > 0) this.shake--;

            switch (this.state) {
                case 'INTRO': this._updateIntro(); break;
                case 'FIGHT': this._updateFight(); break;
                case 'KO': this._updateKo(); break;
                case 'MATCH_END': this._updateVictoryPose(); break;
            }
        }

        this.hud.update(this.f1, this.f2);
        this.input.endFrame();
    }

    _updateIntro() {
        // les combattants marchent jusqu'à leur marque
        const t1 = 300, t2 = GAME_WIDTH - 300;
        this.f1.x += (t1 - this.f1.x) * 0.08;
        this.f2.x += (t2 - this.f2.x) * 0.08;
        this.f1._advanceAnim(this.tick);
        this.f2._advanceAnim(this.tick);
        this.stateTimer++;

        // les annonces se déroulent ; le combat démarre quand "FIGHT" est affiché
        const remaining = this.queuedAnnouncements.reduce((a, q) => a + q.frames, 0);
        if (remaining < 45) {
            this.f1.state = 'idle'; this.f2.state = 'idle';
        }
        if (this.queuedAnnouncements.length === 0) {
            this.state = 'FIGHT';
        }
    }

    _updateFight() {
        this.timeLeft -= 1 / 60;
        this.f1.update(this.tick);
        this.f2.update(this.tick);
        this._resolveHits();
        this._resolveBodies();
        this._updateFacing();

        if (this.f1.hp <= 0 || this.f2.hp <= 0) {
            this._onKO(this.f1.hp <= 0 ? this.f2 : this.f1);
        } else if (this.timeLeft <= 0) {
            // temps écoulé : le plus de PV gagne
            const winner = this.f1.hp === this.f2.hp ? null : (this.f1.hp > this.f2.hp ? this.f1 : this.f2);
            this._onKO(winner, true);
        }
    }

    _resolveHits() {
        for (const [atk, def] of [[this.f1, this.f2], [this.f2, this.f1]]) {
            const hb = atk.getHitbox();
            if (!hb || atk.attack.hasHit) continue;
            const body = def.getBodyBox();
            const hit = hb.x < body.x + body.width && hb.x + hb.width > body.x &&
                        hb.attacker.y - 40 < body.y + body.height;
            if (hit && def.state !== 'ko') {
                atk.attack.hasHit = true;
                def.takeHit(hb.damage, hb.knockback, hb.hitstun);
                this.shake = 8;
                this.slowmo = 6;
                // petit recul de l'attaquant pour la lisibilité
                atk.vx = -2 * atk.facing;
            }
        }
    }

    _resolveBodies() {
        // empêche les corps de se traverser
        const minDist = FIGHTER_WIDTH * 0.7;
        const dx = this.f2.x - this.f1.x;
        if (Math.abs(dx) < minDist) {
            const push = (minDist - Math.abs(dx)) / 2;
            const dir = dx >= 0 ? 1 : -1;
            this.f1.x -= push * dir;
            this.f2.x += push * dir;
        }
        // limites de l'écran
        for (const f of [this.f1, this.f2]) {
            f.x = Math.max(70, Math.min(GAME_WIDTH - 70, f.x));
        }
    }

    _updateFacing() {
        for (const [f, o] of [[this.f1, this.f2], [this.f2, this.f1]]) {
            if (!f.busy && f.grounded) f.facing = o.x >= f.x ? 1 : -1;
        }
    }

    _onKO(winner, timeout = false) {
        this.state = 'KO';
        this.stateTimer = 0;
        this.slowmo = 30;
        this._announce(timeout ? 'TIME UP !' : 'K.O. !', 60);
        this._koWinner = winner;
        if (winner) winner.wins++;
    }

    _updateKo() {
        this.f1.update(this.tick);
        this.f2.update(this.tick);
        this.stateTimer++;
        if (this.stateTimer === 40 && this._koWinner) {
            this._koWinner.state = 'victory';
        }
        if (this.stateTimer > 110) {
            const matchOver = this.f1.wins >= WINS_NEEDED || this.f2.wins >= WINS_NEEDED;
            if (matchOver) {
                this.state = 'MATCH_END';
                const w = this.f1.wins > this.f2.wins ? this.f1 : this.f2;
                this.ui.announceEl.classList.remove('visible');
                this.ui.overlayEl.classList.add('visible');
                this.ui.resultEl.textContent = `${w.name.toUpperCase()} GAGNE LE MATCH !`;
            } else if (this._koWinner) {
                this.round++;
                this._resetRound();
            }
        }
    }

    _updateVictoryPose() {
        this.f1._advanceAnim(this.tick);
        this.f2._advanceAnim(this.tick);
    }

    render() {
        const ctx = this.ctx;
        ctx.save();
        if (this.shake > 0) {
            ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
        }
        this.stage.render(ctx);
        // dessine d'abord le joueur le plus haut pour la lisibilité
        this.f1.draw(ctx);
        this.f2.draw(ctx);
        this.hud.render(ctx, this.f1, this.f2, this.timeLeft);
        ctx.restore();
    }
}
