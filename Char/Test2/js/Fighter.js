// =============================================
// Fighter.js — un joueur. Machine à états + physique + attaques.
// États : idle, walk, jump, crouch, attack, hit, guard, ko, victory
// Attaques : debout (légère/moyenne/lourde), aériennes, accroupies
// Garde    : auto-garde en maintenant "arrière" (haute ou basse)
// =============================================
import {
    ANIM_ROWS, FRAME_COUNT, ATTACKS, MAX_HP,
    GRAVITY, MAX_FALL_SPEED, MOVE_SPEED, JUMP_VELOCITY, AIR_DRIFT,
    GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT, CROUCH_HEIGHT,
    SPRITE_SCALE, GUARD_CHIP, GUARD_STUN
} from './gameConstants.js';

export class Fighter {
    constructor({ id, data, spriteManager, x, facing, input }) {
        this.id = id;                    // 'p1' | 'p2'
        this.data = data;                // { name, style, tileset, specialMoves }
        this.sprites = spriteManager;
        this.input = input;              // instance partagée d'InputManager

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
        this.animSpeed = 1;              // vitesse de lecture (frames / tick logique)

        this.attack = null;              // attaque en cours { type, def, frame, hasHit, damage }
        this.hitstun = 0;
        this.blockstun = 0;
        this.guardType = null;           // 'high' | 'low' pendant la garde
        this.flashTimer = 0;             // clignotement après un coup reçu
        this.guardFlash = 0;             // flash bleu après un coup bloqué
        this.hitLag = 0;                 // micro-freeze à l'impact
    }

    get width() { return FIGHTER_WIDTH; }
    get alive() { return this.hp > 0; }
    get isCrouching() { return this.state === 'crouch' || this._downHeld(); }
    get busy() { return this.attack !== null || this.hitstun > 0 || this.blockstun > 0 || this.state === 'ko'; }

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

    // ---------- attaques ----------

    tryAttack(type) {
        if (this.busy) return;
        const def = ATTACKS[type];
        if (!def) return;
        // aériennes : uniquement en l'air ; au sol : interdites
        if (def.height === 'high' && this.grounded) return;
        if (def.height !== 'high' && !this.grounded) return;

        let damage = def.damage;
        if (type === 'heavy' && this.specialMoves.length > 0) {
            damage = this.specialMoves[0].damage || def.damage;
        }
        this.attack = { type, def, frame: 0, hasHit: false, damage };
        this.state = 'attack';
        this.startAnim(def.row, def.animationSpeed);
        if (this.grounded) this.vx = 0;       // en l'air on garde l'élan
    }

    /** Bouton d'attaque pressé -> choisit la variante selon la position. */
    _onAttackButton(kind) {                    // kind: 'light' | 'medium' | 'special'
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

    /** La garde actuelle peut-elle bloquer un coup de hauteur `height` ? */
    _canBlock(height) {
        if (!this.grounded || this.busy) return false;
        if (!this._backHeld()) return false;
        const low = this._downHeld();
        if (height === 'low') return low;        // coups bas -> garde basse obligatoire
        if (height === 'high') return !low;      // aériens -> garde haute obligatoire
        return true;                              // mid -> n'importe quelle garde
    }

    /** Retourne 'blocked' ou 'hit'. */
    takeHit(damage, { height = 'mid', knockback = 0, hitstun = 10 } = {}) {
        // --- garde : coup bloqué (chip damage seulement) ---
        if (this._canBlock(height)) {
            this.hp = Math.max(0, this.hp - Math.max(1, Math.round(damage * GUARD_CHIP)));
            this.state = 'guard';
            this.guardType = this._downHeld() ? 'low' : 'high';
            this.blockstun = GUARD_STUN;
            this.attack = null;
            this.vx = Math.sign(knockback || 1) * 3;
            this.guardFlash = 14;
            this.hitLag = 3;
            if (this.hp <= 0) this._onKO(knockback);
            return 'blocked';
        }

        // --- coup encaissé ---
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp <= 0) { this._onKO(knockback); return 'hit'; }

        this.state = 'hit';
        this.hitstun = hitstun;
        this.attack = null;
        this.vx = Math.sign(knockback || 1) * Math.abs(knockback || 4);
        this.flashTimer = 20;
        this.hitLag = 6;
        return 'hit';
    }

    _onKO(knockback) {
        this.state = 'ko';
        this.attack = null;
        this.hitstun = 0;
        this.blockstun = 0;
        this.vx = Math.sign(knockback || 1) * 5;
        this.vy = -7;                       // petit saut avant la chute
        this.grounded = false;
        this.hitLag = 12;
        this.startAnim(ANIM_ROWS.KO, 0.5);
    }

    // ---------- update ----------

    update(tick) {
        if (this.hitLag > 0) { this.hitLag--; return; }

        // --- timers ---
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.guardFlash > 0) this.guardFlash--;
        if (this.hitstun > 0) {
            this.hitstun--;
            if (this.hitstun === 0 && this.state === 'hit') this.state = 'idle';
        }
        if (this.blockstun > 0) {
            this.blockstun--;
            if (this.blockstun === 0 && this.state === 'guard') this.state = 'idle';
        }

        // --- gravité ---
        if (!this.grounded) {
            this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);
            this.y += this.vy;
            if (this.y >= GROUND_Y) {
                this.y = GROUND_Y; this.vy = 0; this.grounded = true;
                // atterrissage : une attaque aérienne est annulée
                if (this.attack && this.attack.def.height === 'high') this.attack = null;
                if (this.state !== 'ko' && this.state !== 'victory') this.state = this.busy ? 'attack' : 'idle';
            }
        }

        // --- attaque en cours : avancer les frames ---
        if (this.attack) {
            const a = this.attack;
            a.frame++;
            if (a.frame >= a.def.frames) {
                this.attack = null;
                if (this.grounded) {
                    this.state = this.isCrouching && a.def.height === 'low' ? 'crouch' : 'idle';
                } else {
                    this.state = 'jump';
                }
            }
            if (this.grounded) this.x += this.vx * 0.4;    // petite glissée au sol
            else this.x += this.vx;                      // élan conservé en l'air
            this._advanceAnim(tick);
            return;
        }

        // --- K.O. / victoire : plus de contrôles ---
        if (this.state === 'ko' || this.state === 'victory') {
            if (!this.grounded) this.x += this.vx;
            this._advanceAnim(tick);
            return;
        }

        // --- contrôles (si pas en hitstun / blockstun) ---
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
                            this.grounded = false;
                            this.vy = JUMP_VELOCITY;
                            this.state = 'jump';
                            // saut directionnel
                            if (moving) this.vx = Math.sign(this.vx) * AIR_DRIFT * 1.4;
                        } else {
                            this.state = moving ? 'walk' : 'idle';
                        }
                    }
                } else {
                    // contrôle aérien
                    if (c.isDownAction(this.id, 'left')) this.vx = -AIR_DRIFT;
                    else if (c.isDownAction(this.id, 'right')) this.vx = AIR_DRIFT;
                    this.state = 'jump';
                }
            }
        } else {
            this.vx *= 0.85;               // friction du hitstun/blockstun
        }

        this.x += this.vx;
        this._advanceAnim(tick);
    }

    _advanceAnim(tick) {
        // Choisit la ligne d'animation selon l'état
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
        if (a.frame < a.def.startup || a.frame >= a.def.startup + a.def.active) return null;
        const h = a.def.height;
        let yTop, yBottom;
        if (h === 'low') { yTop = this.y - 70; yBottom = this.y; }
        else if (h === 'high') { yTop = this.y - 190; yBottom = this.y - 50; }
        else { yTop = this.y - 145; yBottom = this.y - 15; }
        return {
            x: this.facing === 1 ? this.x + 20 : this.x - a.def.range - 20,
            width: a.def.range,
            yTop, yBottom,
            height: h,
            damage: a.damage,
            knockback: a.def.knockback * this.facing,
            hitstun: a.def.hitstun,
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

        // ombre au sol (rétrécit quand on est en l'air)
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        const shadowW = 70, airShrink = this.grounded ? 1 : 0.6;
        ctx.beginPath();
        ctx.ellipse(this.x, GROUND_Y - 5, shadowW * airShrink, 10 * airShrink, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // clignotement quand touché
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) return;

        this.sprites.draw(ctx, this.animRow, this.animFrame, this.x, this.y, this.facing, sc);

        // flash bleu quand un coup est bloqué
        if (this.guardFlash > 0) {
            ctx.save();
            ctx.globalAlpha = this.guardFlash / 28;
            ctx.fillStyle = '#4ac0ff';
            ctx.fillRect(this.x - 75, this.y - 160, 150, 160);
            ctx.restore();
        }

        // surbrillance rouge quand K.O.
        if (this.state === 'ko') {
            ctx.save();
            ctx.globalAlpha = 0.25;
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(this.x - 75, this.y - 150, 150, 150);
            ctx.restore();
        }
    }
}
