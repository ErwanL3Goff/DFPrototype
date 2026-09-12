// =============================================
// Fighter.js — un joueur. Machine à états + physique + attaques.
// États : idle, walk, jump, crouch, attack, special, hit, ko, victory
// =============================================
import {
    ANIM_ROWS, FRAME_COUNT, ATTACKS, MAX_HP,
    GRAVITY, MAX_FALL_SPEED, MOVE_SPEED, JUMP_VELOCITY,
    GROUND_Y, FIGHTER_WIDTH, FIGHTER_HEIGHT, SPRITE_SCALE
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

        this.attack = null;              // attaque en cours { type, def, frame, hasHit }
        this.hitstun = 0;
        this.flashTimer = 0;              // clignotement après un coup reçu
        this.hitLag = 0;                 // micro-freeze à l'impact
    }

    get width() { return FIGHTER_WIDTH; }
    get alive() { return this.hp > 0; }
    get busy() { return this.attack !== null || this.hitstun > 0 || this.state === 'ko'; }

    startAnim(row, speed = 1, reset = true) {
        this.animRow = row;
        if (reset) this.animFrame = 0;
        this.animTimer = 0;
        this.animSpeed = speed;
    }

    tryAttack(type) {
        if (this.busy || !this.grounded) return;
        const def = ATTACKS[type];
        let damage = def.damage;
        if (type === 'special' && this.specialMoves.length > 0) {
            damage = this.specialMoves[0].damage || def.damage;
        }
        this.attack = { type, def, frame: 0, hasHit: false, damage };
        this.state = 'attack';
        this.startAnim(def.row, def.animationSpeed);
        this.vx = 0;
    }

    takeHit(damage, knockback, hitstun) {
        this.hp = Math.max(0, this.hp - damage);
        if (this.hp <= 0) {
            this.state = 'ko';
            this.attack = null;
            this.vx = 0;
            this.hitLag = 12;
            return;
        }
        this.state = 'hit';
        this.hitstun = hitstun;
        this.attack = null;
        this.vx = knockback;              // repoussé
        this.flashTimer = 20;
        this.hitLag = 6;
    }

    update(tick) {
        if (this.hitLag > 0) { this.hitLag--; return; }

        // --- clignotement / timers ---
        if (this.flashTimer > 0) this.flashTimer--;
        if (this.hitstun > 0) { this.hitstun--; if (this.hitstun === 0 && this.state === 'hit') this.state = 'idle'; }

        // --- gravité ---
        if (!this.grounded) {
            this.vy = Math.min(this.vy + GRAVITY, MAX_FALL_SPEED);
            this.y += this.vy;
            if (this.y >= GROUND_Y) {
                this.y = GROUND_Y; this.vy = 0; this.grounded = true;
                if (!this.busy) this.state = 'idle';
            }
        }

        // --- attaque en cours : avancer les frames, rien d'autre ---
        if (this.attack) {
            const a = this.attack;
            a.frame++;
            if (a.frame >= a.def.frames) {
                this.attack = null;
                this.state = this.grounded ? 'idle' : 'jump';
            }
            this._advanceAnim(tick);
            this.x += this.vx * 0.4;       // petite glissade du coup
            return;
        }

        // --- KO : au sol, plus rien ---
        if (this.state === 'ko' || this.state === 'victory') {
            this._advanceAnim(tick);
            return;
        }

        // --- contrôles (uniquement si pas en hitstun) ---
        if (this.hitstun === 0) {
            const c = this.input;
            let moving = false;

            if (c.justPressedAction(this.id, 'special')) this.tryAttack('special');
            else if (c.justPressedAction(this.id, 'medium')) this.tryAttack('medium');
            else if (c.justPressedAction(this.id, 'light')) this.tryAttack('light');

            if (!this.busy) {
                if (c.isDownAction(this.id, 'down') && this.grounded) {
                    this.state = 'crouch';
                    this.vx = 0;
                } else {
                    if (c.isDownAction(this.id, 'left'))  { this.vx = -MOVE_SPEED; moving = true; }
                    else if (c.isDownAction(this.id, 'right')) { this.vx = MOVE_SPEED; moving = true; }
                    else this.vx = 0;

                    if (this.grounded && c.justPressedAction(this.id, 'up')) {
                        this.grounded = false;
                        this.vy = JUMP_VELOCITY;
                        this.state = 'jump';
                    } else if (this.grounded) {
                        this.state = moving ? 'walk' : 'idle';
                    }
                }
            }
        } else {
            this.vx *= 0.85;               // friction du hitstun
        }

        this.x += this.vx;
        this._advanceAnim(tick);
    }

    _advanceAnim(tick) {
        // Choisit la ligne d'animation selon l'état
        if (!this.attack) {
            if (this.state === 'walk') this.startAnim(ANIM_ROWS.WALK, 1, false);
            else if (this.state === 'ko') this.startAnim(ANIM_ROWS.IDLE, 0.15, false);
            else this.startAnim(ANIM_ROWS.IDLE, 1, false);
        }
        this.animTimer += this.animSpeed;
        while (this.animTimer >= 1) {
            this.animTimer -= 1;
            this.animFrame = (this.animFrame + 1) % FRAME_COUNT;
        }
    }

    /** Zone où le coup peut toucher, pendant les frames actives. */
    getHitbox() {
        if (!this.attack) return null;
        const a = this.attack;
        if (a.frame < a.def.startup || a.frame >= a.def.startup + a.def.active) return null;
        return {
            x: this.facing === 1 ? this.x + 20 : this.x - a.def.range - 20,
            width: a.def.range,
            damage: a.damage,
            knockback: a.def.knockback * this.facing,
            hitstun: a.def.hitstun,
            attacker: this
        };
    }

    getBodyBox() {
        return { x: this.x - FIGHTER_WIDTH / 2, y: this.y - FIGHTER_HEIGHT, width: FIGHTER_WIDTH, height: FIGHTER_HEIGHT };
    }

    draw(ctx) {
        const sc = SPRITE_SCALE;

        // ombre au sol
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        const shadowW = 70, airShrink = this.grounded ? 1 : 0.6;
        ctx.beginPath();
        ctx.ellipse(this.x, GROUND_Y - 5, shadowW * airShrink, 10 * airShrink, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // clignotement quand touché
        if (this.flashTimer > 0 && Math.floor(this.flashTimer / 3) % 2 === 0) return;

        ctx.save();
        // squashed si crouch ou KO
        if (this.state === 'crouch') {
            ctx.translate(this.x, this.y);
            ctx.scale(1, 0.75);
            ctx.translate(-this.x, -this.y);
        }
        this.sprites.draw(ctx, this.animRow, this.animFrame, this.x, this.y, this.facing, sc);

        // flash rouge léger quand KO
        if (this.state === 'ko') {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#ff2222';
            ctx.fillRect(this.x - 75, this.y - sc * 50, sc * 50, sc * 50);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }
}
