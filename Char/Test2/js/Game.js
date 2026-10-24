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
import { Achievements } from './Achievements.js';

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

        // succès hors-ligne + touches hôte (F2/F3/F7)
        this.achievements = new Achievements();
        window.__achievements = this.achievements;   // hooks Fighter (succès)
        this.paused = false;      // F7 : pause pendant l'overlay succès
        this.showFps = false;    // F2 : compteur de frames
        this.debugMode = false;  // F3 : infos debug + hitboxes
        this._fps = 0; this._fpsAcc = 0; this._fpsLast = performance.now();

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
        // compteur de FPS (F2)
        this._fpsAcc++;
        const now = performance.now();
        if (now - this._fpsLast >= 500) {
            this._fps = Math.round(this._fpsAcc * 1000 / (now - this._fpsLast));
            this._fpsAcc = 0; this._fpsLast = now;
        }
        if (this.paused) { this.input.endFrame(); return; }
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
                this.achievements.track('throw');
                if (a.def.input === 'Q360') this.achievements.track('throw360');
                this.shake = 9; this.slowmo = 8;
                continue;
            }

            a.hasHit = true;
            if (a.type === 'special') this.achievements.track('special_hit');
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
        if (winner) this.achievements.track('ko', { timeout, winnerHp: winner.hp });
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
                this.achievements.track('match', { winnerId: w.id });
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
        if (this.showFps) this._renderFps(ctx);
        if (this.debugMode) this._renderDebug(ctx);
        ctx.restore();
    }

    _renderFps(ctx) {
        ctx.save();
        ctx.font = '13px monospace';
        ctx.fillStyle = '#8f8';
        ctx.textAlign = 'right';
        ctx.fillText(`${this._fps} FPS — tick ${this.tick}`, GAME_WIDTH - 12, 20);
        ctx.restore();
    }

    _renderDebug(ctx) {
        ctx.save();
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(0,0,0,.45)';
        ctx.fillRect(10, 28, 240, 118);
        ctx.fillStyle = '#8cf';
        ctx.textAlign = 'left';
        let y = 44;
        for (const f of [this.f1, this.f2]) {
            const a = f.attack;
            const atk = a ? `${a.type} ${a.def?.name || ''} f${a.frame}/${a.def?.frames || '?'}` : '-';
            ctx.fillText(`${f.id} ${f.name}: ${f.state} x=${Math.round(f.x)} pv=${f.hp}`, 18, y);
            ctx.fillText(`  atk: ${atk}`, 18, y + 14);
            y += 32;
        }
        // hitbox (rouge) / corps (bleu)
        for (const f of [this.f1, this.f2]) {
            const b = f.getBodyBox();
            ctx.strokeStyle = 'rgba(80,140,255,.9)';
            ctx.strokeRect(b.x, b.yTop, b.width, b.yBottom - b.yTop);
            const hb = f.getHitbox();
            if (hb) {
                ctx.strokeStyle = 'rgba(255,60,60,.9)';
                ctx.strokeRect(hb.x, hb.yTop, hb.width, hb.yBottom - hb.yTop);
            }
        }
        for (const p of this.projectiles) {
            ctx.strokeStyle = 'rgba(255,200,60,.9)';
            ctx.strokeRect(p.left, p.top, p.right - p.left, p.bottom - p.top);
        }
        ctx.restore();
    }
}
