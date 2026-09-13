// =============================================
// Fighter.js — un joueur. Machine à états + physique + attaques
// + coups spéciaux (motions/charges) + projection + gel + contre.
// États : idle, walk, jump, crouch, attack, hit, guard, ko, victory
// =============================================
import {
    ANIM_ROWS, FRAME_COUNT, ATTACKS, MAX_HP, THROW, SPECIAL,
    GRAVITY, MAX_FALL_SPEED, MOVE_SPEED, JUMP_VELOCITY, AIR_DRIFT,
    GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT, CROUCH_HEIGHT,
    SPRITE_SCALE, GUARD_CHIP, GUARD_STUN
} from './gameConstants.js';
import { matchSpecial } from './specialMoves.js';

const STRENGTH = { light: 0, medium: 1, heavy: 2 };

export class Fighter {
    constructor({ id, data, spriteManager, x, facing, input, motion, onProjectile }) {
        this.id = id;
        this.data = data;
        this.sprites = spriteManager;
        this.input = input;
        this.motion = motion;                  // MotionInput dédié
        this.onProjectile = onProjectile || null;   // callback Game (owner, def, level)
        this.slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');

        this.name = data.name;
        this.style = data.style || '';
        this.specialMoves = data.specialMoves || [];

        this.maxHp = MAX_HP;
        this.hp = MAX_HP;
        this.x = x;
        this.y = GROUND_Y;
        this.vx = 0;
        this.vy = 0;
        this.facing = facing;
        this.wins = 0;

        this.state = 'idle';
        this.grounded = true;
        this.animRow = ANIM_ROWS.IDLE;
        this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = 1;

        this.attack = null;        // attaque/special/projection en cours
        this.hitstun = 0;
        this.blockstun = 0;
        this.guardType = null;
        this.flashTimer = 0;
        this.guardFlash = 0;
        this.hitLag = 0;

        this.frozen = 0;           // gel (Rosaline)
        this._jumpPending = 0;     // saut différé (laisse passer les 360°)
        this.counterActive = null; // { def } pendant la fenêtre de contre
        this.invincible = 0;
        this.projectileImmune = 0;
    }

    get width() { return FIGHTER_WIDTH; }
    get alive() { return this.hp > 0; }
    get isCrouching() { return this.state === 'crouch' || this._downHeld(); }
    get busy() { return this.attack !== null || this.hitstun > 0 || this.blockstun > 0 || this.state === 'ko' || this.frozen > 0; }

    startAnim(row, speed = 1, reset = true) {
        this.animRow = row;
        if (reset) this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = speed;
    }

    // ---------- entrées ----------

    _downHeld() { return this.input.isDownAction(this.id, 'down') && this.grounded; }
    _backHeld() {
        const back = this.facing === 1 ? 'left' : 'right';
        return this.input.isDownAction(this.id, back);
    }

    // ---------- coups spéciaux ----------

    /** Tente de déclencher un spécial via la motion en cours. */
    trySpecial(level) {
        this._jumpPending = 0;   // un coup annule le saut différé
        if (this.busy) {
            // combo cancel : pendant les frames actives d'un coup normal
            if (this.attack && this.attack.type !== 'special' && this.attack.type !== 'throw') {
                const a = this.attack;
                if (a.frame < a.def.startup ||
                    a.frame > a.def.startup + a.def.active + SPECIAL.cancelWindow) return;
            } else return;
        }
        if (!this.grounded) return;
        const m = matchSpecial(this.slug, this.motion, level);
        if (!m) return;
        const { def, level: lvl } = m;
        const variant = def.variants ? def.variants[lvl] : null;

        this.attack = {
            type: 'special', def, level: lvl, variant,
            frame: 0, hasHit: false, hitsDone: 0, spawned: false
        };
        this.state = 'attack';
        this.startAnim(def.animRow, def.animationSpeed);
        this.vx = 0;
        this.motion.consume();

        // hooks immédiats
        if (def.type === 'counter') this.counterActive = { def, frames: def.counterWindow };
        if (def.type === 'antiair' && def.vy) {
            this.grounded = false;
            this.vy = def.vy;
        }
        if (def.invincible) this.invincible = def.invincible;
        if (def.projectileImmune) this.projectileImmune = def.projectileImmune;
    }

    // ---------- projection (3 boutons d'attaque en même temps) ----------

    tryThrow() {
        this._jumpPending = 0;   // un coup annule le saut différé
        if (!this.grounded) return;
        if (this.busy) {
            const a = this.attack;
            if (!(a && a.type === 'normal' && a.frame <= 2)) return;   // écrase un coup qui démarre
        }
        this.attack = { type: 'throw', def: THROW, variant: null,
                        frame: 0, hasHit: false, hitsDone: 0, spawned: false };
        this.state = 'attack';
        this.startAnim(ANIM_ROWS.THROW, 0.9);
        this.vx = 0;
        this.motion.consume();
    }

    // ---------- attaques normales ----------

    tryAttack(type) {
        this._jumpPending = 0;   // un coup annule le saut différé
        if (this.busy) {
            // target combo : cancel léger -> moyen -> lourd sur un coup normal
            const a = this.attack;
            if (!a || a.type !== 'normal') return;
            const cur = STRENGTH[a.level], next = STRENGTH[type];
            if (next <= cur) return;
            if (a.frame < a.def.startup ||
                a.frame > a.def.startup + a.def.active + SPECIAL.cancelWindow) return;
        }
        const def = ATTACKS[type];
        if (!def) return;
        if (def.height === 'high' && this.grounded) return;
        if (def.height !== 'high' && !this.grounded) return;

        let damage = def.damage;
        if (type === 'heavy' && this.specialMoves.length > 0) {
            damage = this.specialMoves[0].damage || def.damage;
        }
        this.attack = { type: 'normal', def, level: type, variant: null,
                        frame: 0, hasHit: false, hitsDone: 0, spawned: false, damage };
        this.state = 'attack';
        this.startAnim(def.row, def.animationSpeed);
        if (this.grounded) this.vx = 0;
    }

    /** Bouton d'attaque pressé -> priorité spécial > projection > coup normal. */
    _onAttackButton(kind) {
        // détection des 3 boutons ensemble -> projection
        if (this.motion.threeAttackButtons()) { this.tryThrow(); return; }
        // pour les coups spéciaux, le bouton '3' correspond à la version lourde
        const lvl = kind === 'special' ? 'heavy' : kind;
        if (this.grounded) {
            const m = matchSpecial(this.slug, this.motion, lvl);
            if (m) { this.trySpecial(lvl); return; }
        }
        if (!this.grounded) {
            this.tryAttack(kind === 'special' ? 'air_heavy'
                : kind === 'medium' ? 'air_medium' : 'air_light');
        } else if (this.isCrouching) {
            this.tryAttack(kind === 'special' ? 'crouch_heavy'
                : kind === 'medium' ? 'crouch_medium' : 'crouch_light');
        } else {
            this.tryAttack(kind === 'special' ? 'heavy'
                : kind === 'medium' ? 'medium' : 'light');
        }
    }

    // ---------- réception des coups ----------

    _canBlock(height) {
        if (!this.grounded || this.busy) return false;
        if (!this._backHeld()) return false;
        const low = this._downHeld();
        if (height === 'low') return low;
        if (height === 'high') return !low;
        return true;
    }

    /** Retourne 'blocked' | 'hit' | 'countered' | 'invincible'. */
    takeHit(damage, { height = 'mid', knockback = 0, hitstun = 10,
                      ignoreGuard = false, launcher = false, freeze = false,
                      blockstun = GUARD_STUN, chip = GUARD_CHIP } = {}) {
        // gel : le prochain coup brise la glace
        if (this.frozen > 0) this.frozen = 0;

        // invincibilité (uppercuts invincibles)
        if (this.invincible > 0) return 'invincible';

        // contre actif : absorbe le coup et riposte
        if (this.counterActive && this.counterActive.frames > 0) {
            this.counterActive = null;
            const cd = this.attack?.def;
            const dmg = (cd && cd.counterDamage) || 60;
            this.state = 'attack';
            this.attack = { type: 'special', def: cd || { animRow: ANIM_ROWS.SPECIAL_3, frames: 18,
                           animationSpeed: 1 }, variant: null, frame: 0, hasHit: false,
                           hitsDone: 0, spawned: true, damage: dmg, riposte: true };
            this.startAnim((cd && cd.animRow) || ANIM_ROWS.SPECIAL_3, 1);
            return { countered: true, damage: dmg };
        }

        // garde
        if (!ignoreGuard && this._canBlock(height)) {
            this.hp = Math.max(0, this.hp - Math.max(1, Math.round(damage * chip)));
            this.state = 'guard';
            this.guardType = this._downHeld() ? 'low' : 'high';
            this.blockstun = blockstun;
            this.attack = null;
            this.vx = Math.sign(knockback || 1) * 3;
            this.guardFlash = 14;
            this.hitLag = 3;
            if (this.hp <= 0) this._onKO(knockback);
            return 'blocked';
        }

        // coup encaissé
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp <= 0) { this._onKO(knockback); return 'hit'; }

        this.state = 'hit';
        this.hitstun = hitstun;
        this.attack = null;
        this.counterActive = null;
        this.vx = Math.sign(knockback || 1) * Math.abs(knockback || 4);
        if (launcher) { this.vy = -10; this.grounded = false; }
        this.flashTimer = 20;
        this.hitLag = 6;
        if (freeze) this.frozen = SPECIAL.maxFreeze;
        return 'hit';
    }

    _onKO(knockback) {
        this.state = 'ko';
        this.attack = null;
        this.counterActive = null;
        this.hitstun = 0;
        this.blockstun = 0;
        this.frozen = 0;
        this.vx = Math.sign(knockback || 1) * 5;
        this.vy = -7;
        this.grounded = false;
        this.hitLag = 12;
        this.startAnim(ANIM_ROWS.KO, 0.5);
    }

    // ---------- update ----------

    update(tick) {
        if (this.hitLag > 0) { this.hitLag--; return; }

        // timers
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.guardFlash > 0) this.guardFlash--;
        if (this.invincible > 0) this.invincible--;
        if (this.projectileImmune > 0) this.projectileImmune--;
        if (this.hitstun > 0) {
            this.hitstun--;
            if (this.hitstun === 0 && this.state === 'hit') this.state = 'idle';
        }
        if (this.blockstun > 0) {
            this.blockstun--;
            if (this.blockstun === 0 && this.state === 'guard') this.state = 'idle';
        }
        if (this.frozen > 0) { this.frozen--; this._advanceAnim(tick); return; }

        // saut différé : 3 frames pour laisser les 360° passer avant le saut
        if (this._jumpPending > 0 && this.grounded) {
            this._jumpPending--;
            if (this._jumpPending === 0 && this.hitstun === 0 && this.blockstun === 0) {
                this.grounded = false;
                this.vy = JUMP_VELOCITY;
                this.state = 'jump';
            }
        }

        // gravité
        if (!this.grounded) {
            this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);
            this.y += this.vy;
            if (this.y >= GROUND_Y) {
                this.y = GROUND_Y; this.vy = 0; this.grounded = true;
                const a = this.attack;
                if (a && (a.def.height === 'high' || (a.type === 'special' && a.def.type === 'antiair'))) {
                    this.attack = null;   // atterrissage : les attaques aériennes s'annulent
                }
                if (this.state !== 'ko' && this.state !== 'victory') {
                    this.state = this.busy ? 'attack' : 'idle';
                }
            }
        }

        // contre : fenêtre active
        if (this.counterActive) {
            this.counterActive.frames--;
            if (this.counterActive.frames <= 0) {
                this.counterActive = null;
                if (this.state === 'attack') { this.attack = null; this.state = 'idle'; }
            }
        }

        // attaque / spécial / projection en cours
        if (this.attack) {
            const a = this.attack;
            const def = a.def;
            a.frame++;

            // cancel : un bouton pressé pendant un coup normal peut le couper
            // (combo cancel vers un spécial, target combo vers un coup plus fort)
            if (a.type === 'normal') {
                const c2 = this.input;
                if (c2.justPressedAction(this.id, 'special')) this._onAttackButton('special');
                else if (c2.justPressedAction(this.id, 'medium')) this._onAttackButton('medium');
                else if (c2.justPressedAction(this.id, 'light')) this._onAttackButton('light');
            }
            // (le mapping lourd est fait dans _onAttackButton)

            this._specialHooks(a, def);

            const total = a.type === 'throw' && !a.hasHit && a.frame > def.startup + 2
                ? def.whiffFrames : def.frames;
            if (a.frame >= total || (a.riposte && a.frame >= 16)) {
                this.attack = null;
                if (this.grounded) this.state = this.isCrouching && def.height === 'low' ? 'crouch' : 'idle';
                else this.state = 'jump';
            }
            this._advanceAnim(tick);
            return;
        }

        // K.O. / victoire
        if (this.state === 'ko' || this.state === 'victory') {
            if (!this.grounded) this.x += this.vx;
            this._advanceAnim(tick);
            return;
        }

        // contrôles
        if (this.hitstun === 0 && this.blockstun === 0) {
            const c = this.input;

            if (c.justPressedAction(this.id, 'special')) this._onAttackButton('special');
            else if (c.justPressedAction(this.id, 'medium')) this._onAttackButton('medium');
            else if (c.justPressedAction(this.id, 'light')) this._onAttackButton('light');

            if (!this.busy) {
                if (this.grounded) {
                    if (c.isDownAction(this.id, 'down')) {
                        this.state = 'crouch';
                        this.vx = 0;
                    } else {
                        let moving = false;
                        if (c.isDownAction(this.id, 'left'))  { this.vx = -MOVE_SPEED; moving = true; }
                        else if (c.isDownAction(this.id, 'right')) { this.vx = MOVE_SPEED; moving = true; }
                        else this.vx = 0;

                        if (c.justPressedAction(this.id, 'up')) {
                            this._jumpPending = 3;    // 360° : le spécial passe avant le saut
                            if (moving) this.vx = Math.sign(this.vx) * AIR_DRIFT * 1.4;
                            this.state = moving ? 'walk' : 'idle';
                        } else {
                            this.state = moving ? 'walk' : 'idle';
                        }
                    }
                } else {
                    if (c.isDownAction(this.id, 'left')) this.vx = -AIR_DRIFT;
                    else if (c.isDownAction(this.id, 'right')) this.vx = AIR_DRIFT;
                    this.state = 'jump';
                }
            }
        } else {
            this.vx *= 0.85;
        }

        this.x += this.vx;
        this._advanceAnim(tick);
    }

    /** Effets propres aux coups spéciaux pendant leur exécution. */
    _specialHooks(a, def) {
        if (a.type !== 'special') return;

        // projectile(s)
        if (def.type === 'projectile' && !a.spawned && a.frame >= def.startup) {
            a.spawned = true;
            const p = Object.assign({}, def.projectile);
            const v = a.variant || (def.projectile.variants && def.projectile.variants[a.level]) || {};
            if (v.speed) p.speed = v.speed;
            if (v.damage) p.damage = v.damage;
            if (v.height) p.height = v.height;
            if (v.yOff !== undefined) p.yOff = v.yOff;
            p.count = p.count || 1;
            a.pendingShots = p;
            a.nextShot = 0;
        }
        if (a.pendingShots && a.frame >= def.startup + a.nextShot &&
            (a.shotsFired || 0) < a.pendingShots.count) {
            a.shotsFired = (a.shotsFired || 0) + 1;
            a.nextShot += a.pendingShots.interval;
            this.onProjectile?.(this, a.pendingShots, a.level);
        }

        // dash (Ike, dashes, glissades, grabs fonceurs)
        if (def.dash && a.frame >= def.startup &&
            a.frame < def.startup + def.dash.duration) {
            this.vx = def.dash.speed * this.facing;
        }

        // téléportation derrière l'adversaire
        if (def.type === 'teleport' && !a.spawned && a.frame >= def.startup) {
            a.spawned = true;
            const opp = this.opponent;
            if (opp) {
                this.x = opp.x - (opp.facing === 1 ? 1 : -1) * -1 * 85;   // derrière
                this.x = opp.x + (opp.facing === 1 ? -85 : 85);
                this.facing = opp.x >= this.x ? 1 : -1;
            }
            this.vx = 0;
        }
    }

    _advanceAnim(tick) {
        if (!this.attack) {
            switch (this.state) {
                case 'walk':   this.startAnim(ANIM_ROWS.WALK, 1, false); break;
                case 'jump':   this.startAnim(ANIM_ROWS.JUMP, 0.8, false); break;
                case 'crouch': this.startAnim(ANIM_ROWS.CROUCH, 1, false); break;
                case 'guard':  this.startAnim(this.guardType === 'low' ? ANIM_ROWS.GUARD_LOW : ANIM_ROWS.GUARD_HIGH, 1, false); break;
                case 'ko':     this.startAnim(ANIM_ROWS.KO, 0.5, false); break;
                case 'victory':this.startAnim(ANIM_ROWS.IDLE, 0.8, false); break;
                default:      this.startAnim(ANIM_ROWS.IDLE, 1, false);
            }
        }
        this.animTimer += this.animSpeed;
        while (this.animTimer >= 1) {
            this.animTimer -= 1;
            this.animFrame = (this.animFrame + 1) % FRAME_COUNT;
        }
    }

    // ---------- hitboxes ----------

    /** Zone où le coup peut toucher, pendant les frames actives. */
    getHitbox() {
        if (!this.attack) return null;
        const a = this.attack;
        const def = a.def;
        const v = a.variant || {};

        // paramètres par type de spécial
        let range = def.range, damage = a.damage || def.damage || (v.damage), height = def.height;
        let startup = def.startup, active = def.active || 3;
        if (a.type === 'throw') { startup = def.startup; active = 3; }
        if (v.range) range = v.range;
        if (v.feint) return null;                       // feinte d'Ike : pas de hitbox
        if (a.riposte) { range = def.counterRange || 140; startup = 4; active = 4; damage = a.damage || def.counterDamage; }

        // fenêtre active (multi-hits : fenêtres répétées)
        if (def.multi) {
            const rel = a.frame - startup;
            if (rel < 0 || rel >= def.multi.interval * def.multi.hits) return null;
            if (rel % def.multi.interval >= active + 2) return null;
            if (a.hitsDone >= def.multi.hits) return null;
            if (a.lastHitFrame !== undefined && a.frame - a.lastHitFrame < def.multi.interval) return null;
        } else {
            if (a.frame < startup || a.frame >= startup + active) return null;
            if (a.hasHit) return null;
        }
        if (a.type === 'throw' && a.hasHit) return null;

        // dash : hitbox active pendant toute la course (casse distance / pression)
        if (def.dash && def.type !== 'grab') active = Math.max(active, def.dash.duration);

        // téléportation de Duke : la hauteur dépend de la direction tenue
        if (def.directionalHeight) {
            const inp = this.input;
            if (inp.isDownAction(this.id, 'down')) height = 'low';
            else if (inp.isDownAction(this.id, 'up')) height = 'high';
            else height = 'mid';
        }

        // hauteur du coup
        let yTop, yBottom;
        if (height === 'low') { yTop = this.y - 70; yBottom = this.y; }
        else if (height === 'high') { yTop = this.y - 190; yBottom = this.y - 50; }
        else { yTop = this.y - 145; yBottom = this.y - 15; }

        const grab = a.type === 'throw' || def.type === 'grab';
        if (grab) damage = def.grabDamage || THROW.damage || damage;
        return {
            x: this.facing === 1 ? this.x + 20 : this.x - range - 20,
            width: range,
            yTop, yBottom,
            height: height || 'mid',
            damage: damage || 40,
            knockback: (def.knockback || 6) * this.facing,
            hitstun: def.hitstun || 16,
            grab,
            ignoreGuard: grab,
            launcher: !!def.launcher,
            freeze: !!def.projectile?.freeze,
            blockstun: def.blockstun || GUARD_STUN,
            chip: def.chip,
            attacker: this
        };
    }

    getBodyBox() {
        const h = this.grounded ? (this.isCrouching ? CROUCH_HEIGHT : FIGHTER_HEIGHT) : FIGHTER_HEIGHT;
        const feetY = this.grounded ? GROUND_Y : this.y;
        return {
            x: this.x - FIGHTER_WIDTH / 2,
            yTop: feetY - h, yBottom: feetY,
            width: FIGHTER_WIDTH, height: h
        };
    }

    // ---------- rendu ----------

    draw(ctx) {
        const sc = SPRITE_SCALE;

        // ombre
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        const shadowW = 70, airShrink = this.grounded ? 1 : 0.6;
        ctx.beginPath();
        ctx.ellipse(this.x, GROUND_Y - 5, shadowW * airShrink, 10 * airShrink, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) return;

        this.sprites.draw(ctx, this.animRow, this.animFrame, this.x, this.y, this.facing, sc);

        // gel : teinte bleutée + glaçons
        if (this.frozen > 0) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#aee6ff';
            ctx.fillRect(this.x - 70, this.y - 150, 140, 150);
            ctx.restore();
        }
        // invincibilité : scintillement doré
        if (this.invincible > 0) {
            ctx.save();
            ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.frozen + performance.now() / 60);
            ctx.fillStyle = '#ffd700';
            ctx.fillRect(this.x - 70, this.y - 150, 140, 150);
            ctx.restore();
        }
        // contre actif : aura verte
        if (this.counterActive) {
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#66ff88';
            ctx.fillRect(this.x - 70, this.y - 150, 140, 150);
            ctx.restore();
        }
        if (this.guardFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.guardFlash / 28;
            ctx.fillStyle = '#4ac0ff';
            ctx.fillRect(this.x - 75, this.y - 160, 150, 160);
            ctx.restore();
        }
        if (this.state === 'ko') {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(this.x - 75, this.y - 150, 150, 150);
            ctx.restore();
        }
    }
}
