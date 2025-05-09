import { 
    ANIMATION_STATES, 
    GROUND_LEVEL, 
    GRAVITY, 
    MAX_HP, 
    MAX_V_TRIGGER,
    ANIMATION_CONFIG,
    COMBAT_VALUES
} from './gameConstants.js';
import { SpriteManager } from './SpriteManager.js';

export class Player {
    constructor(x, y, isPlayer1) {
        // Position et taille
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 120;
        this.isPlayer1 = isPlayer1;
        this.name = isPlayer1 ? 'Ike (P1)' : 'Ike (P2)';
        this.facingRight = !isPlayer1; // P1 regarde à gauche par défaut

        // Mouvement
        this.speed = 5;
        this.jumpPower = 12;
        this.velocityY = 0;
        this.isGrounded = true;
        this.isCrouching = false;
        this.dashSpeed = 10;
        this.dashDuration = 0;

        // Combat
        this.hp = MAX_HP;
        this.vTrigger = 0;
        this.vTriggerActive = false;
        this.vTriggerTimer = 0;
        this.criticalArt = 0;
        this.invincible = false;
        this.hitStun = 0;
        this.hitStop = 0;
        this.comboCount = 0;

        // Animation
        this.state = ANIMATION_STATES.IDLE;
        this.prevState = ANIMATION_STATES.IDLE;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.spriteManager = new SpriteManager('./assets/GrandeTileset.png');
        this.currentSprite = null;

        // Input
        this.inputBuffer = [];
        this.specialMoveBuffer = [];
        this.lastInputTime = 0;
    }

    // ========================
    // MÉTHODES DE MISE À JOUR
    // ========================

    update(deltaTime, game) {
        // Gestion du hit stop (pause lors des impacts)
        if (this.hitStop > 0) {
            this.hitStop -= deltaTime;
            return;
        }

        // Mise à jour du V-Trigger
        this.updateVTrigger(deltaTime);

        // Physique et mouvement
        this.updatePhysics(deltaTime);

        // Gestion des entrées
        this.processInput(game);

        // Mise à jour de l'animation
        this.updateAnimation(deltaTime);

        // Détection des coups spéciaux
        this.checkSpecialMoves(game);

        // Mise à jour du sprite actuel
        this.updateSprite();
    }

    updatePhysics(deltaTime) {
        // Application de la gravité
        if (!this.isGrounded) {
            this.velocityY += GRAVITY;
            this.y += this.velocityY;

            // Vérifier l'atterrissage
            if (this.y >= GROUND_LEVEL - this.height) {
                this.land();
            }
        }

        // Limites de l'écran
        this.x = Math.max(this.width / 2, Math.min(GAME_WIDTH - this.width / 2, this.x));
    }

    updateVTrigger(deltaTime) {
        if (this.vTriggerActive) {
            this.vTriggerTimer -= deltaTime;
            if (this.vTriggerTimer <= 0) {
                this.deactivateVTrigger();
            } else {
                // Drainage progressif de la jauge
                this.vTrigger = Math.max(0, this.vTrigger - (deltaTime * 0.5));
            }
        }
    }

    // ========================
    // GESTION DES ENTRÉES
    // ========================

    processInput(game) {
        if (this.hitStun > 0) return;

        const keys = game.keys;
        const pressedKeys = game.pressedKeys;
        const isPlayer1 = this.isPlayer1;

        // Mouvement horizontal
        let moveX = 0;
        if (this.canMove()) {
            if ((isPlayer1 && keys[KEYS.P1_LEFT]) || (!isPlayer1 && keys[KEYS.P2_LEFT])) {
                moveX = -this.speed;
                this.facingRight = false;
            } else if ((isPlayer1 && keys[KEYS.P1_RIGHT]) || (!isPlayer1 && keys[KEYS.P2_RIGHT])) {
                moveX = this.speed;
                this.facingRight = true;
            }
        }

        // Saut
        if ((isPlayer1 && pressedKeys[KEYS.P1_UP]) || (!isPlayer1 && pressedKeys[KEYS.P2_UP])) {
            if (this.isGrounded && this.canJump()) {
                this.jump();
            }
        }

        // Accroupissement
        this.handleCrouch(keys, isPlayer1);

        // Garde
        this.handleGuard(keys, isPlayer1);

        // Attaques
        this.handleAttacks(pressedKeys, isPlayer1);

        // V-Trigger
        if ((isPlayer1 && pressedKeys[KEYS.P1_VTRIGGER]) || (!isPlayer1 && pressedKeys[KEYS.P2_VTRIGGER])) {
            this.activateVTrigger();
        }

        // Application du mouvement
        this.x += moveX;
    }

    handleCrouch(keys, isPlayer1) {
        const crouchKey = isPlayer1 ? KEYS.P1_DOWN : KEYS.P2_DOWN;
        
        if (keys[crouchKey]) {
            if (this.isGrounded && this.canCrouch()) {
                if (this.state !== ANIMATION_STATES.CROUCH && 
                    !this.isAttacking() &&
                    !this.isGuarding()) {
                    this.setState(ANIMATION_STATES.CROUCH);
                }
            }
        } else if (this.state === ANIMATION_STATES.CROUCH) {
            this.setState(ANIMATION_STATES.IDLE);
        }
    }

    handleGuard(keys, isPlayer1) {
        const downKey = isPlayer1 ? KEYS.P1_DOWN : KEYS.P2_DOWN;
        const leftKey = isPlayer1 ? KEYS.P1_LEFT : KEYS.P2_LEFT;
        const rightKey = isPlayer1 ? KEYS.P1_RIGHT : KEYS.P2_RIGHT;
        
        if (keys[downKey] && (keys[leftKey] || keys[rightKey])) {
            if (this.isGrounded) {
                if (keys[downKey]) {
                    this.setState(ANIMATION_STATES.CROUCH_GUARD);
                } else {
                    this.setState(ANIMATION_STATES.STAND_GUARD);
                }
            }
        } else if (this.isGuarding()) {
            this.setState(ANIMATION_STATES.IDLE);
        }
    }

    handleAttacks(pressedKeys, isPlayer1) {
        if (this.canAttack()) {
            // Attaque légère
            if ((isPlayer1 && pressedKeys[KEYS.P1_LIGHT]) || (!isPlayer1 && pressedKeys[KEYS.P2_LIGHT])) {
                this.executeAttack('LIGHT');
            }
            // Attaque moyenne
            else if ((isPlayer1 && pressedKeys[KEYS.P1_MEDIUM]) || (!isPlayer1 && pressedKeys[KEYS.P2_MEDIUM])) {
                this.executeAttack('MEDIUM');
            }
            // Attaque lourde
            else if ((isPlayer1 && pressedKeys[KEYS.P1_HEAVY]) || (!isPlayer1 && pressedKeys[KEYS.P2_HEAVY])) {
                this.executeAttack('HEAVY');
            }
        }
    }

    executeAttack(type) {
        if (this.isGrounded) {
            if (this.state === ANIMATION_STATES.CROUCH || this.state === ANIMATION_STATES.CROUCH_GUARD) {
                this.setState(ANIMATION_STATES[`CROUCH_${type}_ATTACK`]);
            } else {
                this.setState(ANIMATION_STATES[`${type}_ATTACK`]);
            }
        } else {
            this.setState(ANIMATION_STATES[`AIR_${type}_ATTACK`]);
        }
    }

    // ========================
    // MÉTHODES DE COMBAT
    // ========================

    takeDamage(damage, isCounter = false, isCrushCounter = false) {
        if (this.invincible || this.hp <= 0) return;

        // Appliquer les multiplicateurs de dégâts
        let finalDamage = damage;
        if (isCrushCounter) {
            finalDamage *= COMBAT_VALUES.DAMAGE.CRUSH_COUNTER_MULTIPLIER;
        } else if (isCounter) {
            finalDamage *= COMBAT_VALUES.DAMAGE.COUNTER_MULTIPLIER;
        }

        // Réduire les dégâts en garde
        if (this.isGuarding()) {
            finalDamage *= 0.3; // 70% de réduction
            this.setState(ANIMATION_STATES.HIT); // Animation de garde
            this.hitStun = COMBAT_VALUES.RECOVERY.HIT_STUN * 0.5; // Moins de hitstun en garde
        } else {
            this.hp = Math.max(0, this.hp - finalDamage);
            this.setState(ANIMATION_STATES.HIT);
            this.hitStun = COMBAT_VALUES.RECOVERY.HIT_STUN;
        }

        // Gestion du KO
        if (this.hp <= 0) {
            this.hp = 0;
            this.setState(ANIMATION_STATES.KO);
            this.hitStun = 9999; // Empêche toute action
        }

        // Ajouter à la jauge de V-Trigger
        this.vTrigger = Math.min(MAX_V_TRIGGER, this.vTrigger + (finalDamage * 0.5));

        return finalDamage;
    }

    activateVTrigger() {
        if (!this.vTriggerActive && this.vTrigger >= MAX_V_TRIGGER) {
            this.vTriggerActive = true;
            this.vTriggerTimer = 10000; // 10 secondes
            this.setState(ANIMATION_STATES.V_TRIGGER);
            return true;
        }
        return false;
    }

    deactivateVTrigger() {
        this.vTriggerActive = false;
        this.vTrigger = 0;
    }

    // ========================
    // MÉTHODES D'ANIMATION
    // ========================

    updateAnimation(deltaTime) {
        if (!this.spriteManager.isLoaded) return;

        this.animationTimer += deltaTime;
        const frameCount = this.spriteManager.getFrameCount(this.state);
        const frameDuration = this.getFrameDuration();

        if (this.animationTimer >= frameDuration) {
            this.animationTimer = 0;
            this.animationFrame = (this.animationFrame + 1) % frameCount;

            // Gestion des animations non bouclées
            if (this.animationFrame === 0 && !this.isLoopingAnimation()) {
                this.animationFrame = frameCount - 1;
                this.handleAnimationEnd();
            }
        }
    }

    getFrameDuration() {
        const durations = ANIMATION_CONFIG.FRAME_DURATIONS[this.state];
        
        // Si tableau, durée spécifique par frame
        if (Array.isArray(durations)) {
            return durations[Math.min(this.animationFrame, durations.length - 1)];
        }
        
        // Sinon durée fixe pour toute l'animation
        return durations || 100; // Valeur par défaut
    }

    handleAnimationEnd() {
        switch(this.state) {
            case ANIMATION_STATES.HIT:
                if (this.hp <= 0) {
                    this.setState(ANIMATION_STATES.KO);
                } else {
                    this.setState(ANIMATION_STATES.IDLE);
                }
                break;
                
            case ANIMATION_STATES.LIGHT_ATTACK:
            case ANIMATION_STATES.MEDIUM_ATTACK:
            case ANIMATION_STATES.HEAVY_ATTACK:
                this.setState(ANIMATION_STATES.IDLE);
                break;
                
            // ... autres transitions
        }
    }

    updateSprite() {
        if (this.spriteManager.isLoaded) {
            this.currentSprite = this.spriteManager.getSprite(
                this.state,
                this.animationFrame,
                this.facingRight
            );
        }
    }

    setState(newState) {
        if (this.state === newState) return;

        this.prevState = this.state;
        this.state = newState;
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    // ========================
    // MÉTHODES DE MOUVEMENT
    // ========================

    jump() {
        if (!this.isGrounded || !this.canJump()) return;

        this.velocityY = -this.jumpPower;
        this.isGrounded = false;
        this.setState(ANIMATION_STATES.JUMP);
    }

    land() {
        this.y = GROUND_LEVEL - this.height;
        this.isGrounded = true;
        this.velocityY = 0;

        if (this.state === ANIMATION_STATES.JUMP) {
            this.setState(ANIMATION_STATES.IDLE);
        }
    }

    // ========================
    // MÉTHODES DE VÉRIFICATION
    // ========================

    canMove() {
        return !this.isAttacking() && 
               !this.isGuarding() && 
               this.hitStun <= 0 &&
               !this.isCrouching;
    }

    canJump() {
        return this.isGrounded && 
               this.hitStun <= 0 &&
               !this.isAttacking() &&
               !this.isGuarding();
    }

    canCrouch() {
        return this.isGrounded && 
               this.hitStun <= 0 &&
               !this.isAttacking();
    }

    canAttack() {
        return this.hitStun <= 0 && 
               !this.isGuarding() &&
               !this.isInSpecialMove();
    }

    isAttacking() {
        return [
            ANIMATION_STATES.LIGHT_ATTACK,
            ANIMATION_STATES.MEDIUM_ATTACK,
            ANIMATION_STATES.HEAVY_ATTACK,
            // ... autres états d'attaque
        ].includes(this.state);
    }

    isGuarding() {
        return [
            ANIMATION_STATES.STAND_GUARD,
            ANIMATION_STATES.CROUCH_GUARD
        ].includes(this.state);
    }

    isInSpecialMove() {
        return [
            ANIMATION_STATES.CLINT_EASTWOOD,
            ANIMATION_STATES.CASSANDRA_TORNADO,
            ANIMATION_STATES.HERCULEOPERCUT,
            ANIMATION_STATES.CRITICAL_ART
        ].includes(this.state);
    }

    isLoopingAnimation() {
        return ANIMATION_CONFIG.LOOPING_ANIMATIONS.includes(this.state);
    }

    hitFrameActive() {
        const attackFrames = ANIMATION_CONFIG.ATTACK_FRAMES;
        return attackFrames[this.state] === this.animationFrame;
    }

    // ========================
    // MÉTHODES DE RENDU
    // ========================

    render(ctx) {
        if (!this.currentSprite) {
            this.drawDebug(ctx);
            return;
        }

        ctx.save();
        
        // Positionnement du sprite
        const drawX = this.x - this.width / 2;
        const drawY = this.y - this.height;
        
        // Dessin du sprite
        ctx.drawImage(
            this.currentSprite,
            drawX, drawY, 
            this.width, this.height
        );

        // Debug: hitbox
        if (DEBUG_MODE) {
            this.drawHitbox(ctx);
        }

        ctx.restore();
    }

    drawDebug(ctx) {
        ctx.fillStyle = this.isPlayer1 ? 'blue' : 'red';
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height,
            this.width,
            this.height
        );
    }

    drawHitbox(ctx) {
        const hitbox = this.getHitbox();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            hitbox.x,
            hitbox.y,
            hitbox.width,
            hitbox.height
        );
    }

    getHitbox() {
        const baseHitbox = {
            x: this.x - this.width / 2,
            y: this.y - this.height,
            width: this.width,
            height: this.height
        };

        // Ajustements spécifiques selon l'état
        switch(this.state) {
            case ANIMATION_STATES.CROUCH:
            case ANIMATION_STATES.CROUCH_GUARD:
                baseHitbox.y += this.height / 2;
                baseHitbox.height /= 2;
                break;
                
            case ANIMATION_STATES.LIGHT_ATTACK:
                if (this.hitFrameActive()) {
                    baseHitbox.width += 30;
                    if (this.facingRight) {
                        baseHitbox.x -= 15;
                    } else {
                        baseHitbox.x -= 15;
                    }
                }
                break;
                
            // ... autres ajustements de hitbox
        }

        return baseHitbox;
    }

    // ========================
    // MÉTHODES DE COUPS SPÉCIAUX
    // ========================

    checkSpecialMoves(game) {
        if (this.inputBuffer.length < 3) return;

        // Vérifier Clint Eastwood (Hadouken: ↓ ↘ → + attaque)
        if (this.checkInputSequence(['down', 'forward', 'attack'])) {
            this.executeSpecialMove(ANIMATION_STATES.CLINT_EASTWOOD);
        }
        
        // Vérifier Cassandra Tornado (Tatsumaki: ↓ ↙ ← + attaque)
        else if (this.checkInputSequence(['down', 'back', 'attack'])) {
            this.executeSpecialMove(ANIMATION_STATES.CASSANDRA_TORNADO);
        }
        
        // Vérifier Herculeopercut (Shoryuken: → ↓ ↘ + attaque)
        else if (this.checkInputSequence(['forward', 'down', 'forward', 'attack'])) {
            this.executeSpecialMove(ANIMATION_STATES.HERCULEOPERCUT);
        }
    }

    checkInputSequence(sequence) {
        // Implémentation simplifiée - à compléter avec une vraie détection de mouvements
        const recentInputs = this.inputBuffer.slice(-sequence.length);
        return sequence.every((input, i) => recentInputs[i] === input);
    }

    executeSpecialMove(moveState) {
        if (this.canAttack() && this.criticalArt >= 100) {
            this.criticalArt -= 100;
            this.setState(moveState);
            return true;
        }
        return false;
    }

    // ========================
    // MÉTHODES UTILITAIRES
    // ========================

    reset() {
        this.hp = MAX_HP;
        this.vTrigger = 0;
        this.vTriggerActive = false;
        this.criticalArt = 0;
        this.setState(ANIMATION_STATES.IDLE);
        this.animationFrame = 0;
        this.hitStun = 0;
        this.hitStop = 0;
    }
}

// Pour le débogage
const DEBUG_MODE = true;