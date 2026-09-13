// =============================================
// Game.js — orchestrateur : lancement de partie, mise en scène,
// rounds (best of 3), résolution des coups, projectiles,
// projections, gels et contres.
// =============================================
import { GAME_WIDTH, GROUND_Y, ROUND_TIME, WINS_NEEDED, FIGHTER_WIDTH, ANIM_ROWS }
    from './gameConstants.js';
import { Fighter } from './Fighter.js';
import { MotionInput } from './MotionInput.js';
import { Projectile } from './Projectile.js';
import { Stage } from './Stage.js';
import { HUD } from './HUD.js';

export class Game {
    constructor(canvas, ui, charData1, charData2, input) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ui = ui;
        this.input = input;

        this.stage = new Stage();
        this.hud = new HUD();
        this.projectiles = [];

        const spawn = (owner) => (fighter, p, level) => this._spawnProjectile(owner, fighter, p, level);

        this.f1 = new Fighter({
            id: 'p1', data: charData1,
            spriteManager: charData1.sprites, x: 300, facing: 1, input,
            motion: new MotionInput('p1'), onProjectile: spawn('p1')
        });
        this.f2 = new Fighter({
            id: 'p2', data: charData2,
            spriteManager: charData2.sprites, x: GAME_WIDTH - 300, facing: -1, input,
            motion: new MotionInput('p2'), onProjectile: spawn('p2')
        });
        this.f1.opponent = this.f2;
        this.f2.opponent = this.f1;

        this.state = 'INTRO';
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
        this.projectiles = [];
        this.f1.x = -100;
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
            f.blockstun = 0;
            f.frozen = 0;
            f.counterActive = null;
            f.invincible = 0;
            f.projectileImmune = 0;
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

        if (this.slowmo > 0) this.slowmo--;
        if (this.shake > 0) this.shake--;

        switch (this.state) {
            case 'INTRO': this._updateIntro(); break;
            case 'FIGHT': this._updateFight(); break;
            case 'KO': this._updateKo(); break;
            case 'MATCH_END': this._updateVictoryPose(); break;
        }

        this.hud.update(this.f1, this.f2);
        this.input.endFrame();
    }

    _updateIntro() {
        const t1 = 300, t2 = GAME_WIDTH - 300;
        this.f1.x += (t1 - this.f1.x) * 0.08;
        this.f2.x += (t2 - this.f2.x) * 0.08;
        this.f1._advanceAnim(this.tick);
        this.f2._advanceAnim(this.tick);
        this.stateTimer++;

        const remaining = this.queuedAnnouncements.reduce((a, q) => a + q.frames, 0);
        if (remaining < 45) {
            this.f1.state = 'idle'; this.f2.state = 'idle';
        }
        if (this.queuedAnnouncements.length === 0) {
            this.state = 'FIGHT';
        }
    }

    _updateFight() {
        // reconnaissance des motions AVANT les fighters
        this.f1.motion.update(this.input, this.f1.facing);
        this.f2.motion.update(this.input, this.f2.facing);

        this.timeLeft -= 1 / 60;
        this.f1.update(this.tick);
        this.f2.update(this.tick);
        this._resolveHits();
        this._updateProjectiles();
        this._resolveBodies();
        this._updateFacing();

        if (this.f1.hp <= 0 || this.f2.hp <= 0) {
            this._onKO(this.f1.hp <= 0 ? this.f2 : this.f1);
        } else if (this.timeLeft <= 0) {
            const winner = this.f1.hp === this.f2.hp ? null : (this.f1.hp > this.f2.hp ? this.f1 : this.f2);
            this._onKO(winner, true);
        }
    }

    // ---------- projectiles ----------

    _spawnProjectile(ownerId, fighter, p, level) {
        const facing = fighter.facing;
        const x = fighter.x + facing * 45;
        const y = fighter.y + (p.yOff !== undefined ? p.yOff : -100);
        const proj = new Projectile(fighter, p, {
            x, y, vx: p.speed * facing, vy: p.vy || 0
        });
        this.projectiles.push(proj);
    }

    _updateProjectiles() {
        for (const pr of this.projectiles) {
            pr.update();
            const target = pr.owner === this.f1 ? this.f2 : this.f1;
            if (pr.dead || target.state === 'ko' || target.hp <= 0) continue;
            const body = target.getBodyBox();
            const hit = pr.right > body.x && pr.left < body.x + body.width &&
                        pr.bottom > body.yTop && pr.top < body.yBottom;
            if (!hit) continue;

            // immunité aux projectiles (Jin : poing crochet)
            if (target.projectileImmune > 0) { pr.dead = true; continue; }

            pr.dead = true;
            const res = target.takeHit(pr.damage, {
                height: pr.height,
                knockback: Math.sign(pr.vx) * 6,
                hitstun: 18,
                freeze: pr.freeze
            });
            if (res === 'hit') { this.shake = 7; this.slowmo = 4; }
            else if (res === 'blocked') this.shake = 3;
        }
        this.projectiles = this.projectiles.filter(p => !p.dead);
    }

    // ---------- résolution des coups ----------

    _resolveHits() {
        for (const [atk, def] of [[this.f1, this.f2], [this.f2, this.f1]]) {
            const hb = atk.getHitbox();
            if (!hb) continue;
            const a = atk.attack;
            if (a.hasHit && !(a.def.multi || a.def.type === 'multiHit')) continue;

            const body = def.getBodyBox();
            const overlapX = hb.x < body.x + body.width && hb.x + hb.width > body.x;
            const overlapY = hb.yTop < body.yBottom && hb.yBottom > body.yTop;
            if (!overlapX || !overlapY || def.state === 'ko') continue;

            // projection / grab : passe la garde, ne touche pas en l'air
            if (hb.grab) {
                if (!def.grounded) { a.hasHit = true; continue; }   // whiff sur un adverse aérien
                a.hasHit = true;
                const dmg = hb.damage || (a.def.grabDamage || 100);
                def.takeHit(dmg, {
                    height: 'mid', knockback: hb.knockback,
                    hitstun: 30, ignoreGuard: true, launcher: true
                });
                atk.vx = 0;
                this.shake = 9; this.slowmo = 8;
                continue;
            }

            a.hasHit = true;
            if (a.def.multi || a.def.type === 'multiHit') {
                a.hitsDone = (a.hitsDone || 0) + 1;
                a.lastHitFrame = a.frame;
                if (a.hitsDone < a.def.multi.hits) a.hasHit = false;
            }

            const res = def.takeHit(hb.damage, {
                height: hb.height,
                knockback: hb.knockback,
                hitstun: hb.hitstun,
                launcher: hb.launcher,
                freeze: hb.freeze,
                blockstun: hb.blockstun,
                chip: hb.chip
            });

            if (res === 'blocked') {
                this.shake = 3;
                atk.vx = -3 * atk.facing;
            } else if (res && res.countered) {
                // le défenseur a contré : l'attaquant encaisse la riposte
                atk.takeHit(res.damage, {
                    height: 'mid', knockback: def.facing * 10, hitstun: 26
                });
                this.shake = 8; this.slowmo = 6;
            } else if (res === 'hit') {
                this.shake = 8;
                this.slowmo = 6;
                atk.vx = -2 * atk.facing;
            }
        }
    }

    _resolveBodies() {
        const minDist = FIGHTER_WIDTH * 0.7;
        const dx = this.f2.x - this.f1.x;
        if (Math.abs(dx) < minDist) {
            const push = (minDist - Math.abs(dx)) / 2;
            const dir = dx >= 0 ? 1 : -1;
            this.f1.x -= push * dir;
            this.f2.x += push * dir;
        }
        for (const f of [this.f1, this.f2]) {
            f.x = Math.max(70, Math.min(GAME_WIDTH - 70, f.x));
        }
    }

    _updateFacing() {
        for (const [f, o] of [[this.f1, this.f2], [this.f2, this.f1]]) {
            if (!f.busy && f.grounded && f.state !== 'hit') f.facing = o.x >= f.x ? 1 : -1;
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
            this._koWinner.startAnim(ANIM_ROWS.IDLE, 0.8, false);
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
        this.f1.draw(ctx);
        this.f2.draw(ctx);
        for (const pr of this.projectiles) pr.draw(ctx);
        this.hud.render(ctx, this.f1, this.f2, this.timeLeft);
        ctx.restore();
    }
}
