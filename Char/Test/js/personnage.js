import { animations, FRAME_COLS } from './animations.js';

export class Personnage {
  constructor(x, controls, tileset, tilesetFlip, attackData) {
    this.x = x;
    this.y = 450 - (4362 / 13);
    this.vx = 0;
    this.vy = 0;
    this.direction = 1;
    this.controls = controls;

    this.tileset = tileset;
    this.tilesetFlip = tilesetFlip;
    this.attackData = attackData;

    this.grounded = true;
    this.currentAnim = 'idle';
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameSpeed = 100;

    this.attackLocked = false;
    this.attackTimer = 0;
  }

  update(opponent, keys, delta) {
    if (this.attackLocked) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.attackLocked = false;
        this.currentAnim = this.grounded ? 'idle' : 'jump';
        this.frameIndex = 0;
      }
      this.updateAnimation(delta);
      return;
    }

    // Mouvements
    if (keys[this.controls.left]) {
      this.vx = -3;
      if (this.grounded) this.currentAnim = 'walk';
    } else if (keys[this.controls.right]) {
      this.vx = 3;
      if (this.grounded) this.currentAnim = 'walk';
    } else {
      this.vx = 0;
      if (this.grounded) this.currentAnim = 'idle';
    }

    if (keys[this.controls.down] && this.grounded) this.currentAnim = 'crouch';

    if (keys[this.controls.up] && this.grounded) {
      this.vy = -12;
      this.grounded = false;
      this.currentAnim = 'jump';
    }

    // Attaque
    if (keys[this.controls.attack1] || keys[this.controls.attack2] || keys[this.controls.attack3]) {
      let type = keys[this.controls.attack1] ? 'light' : keys[this.controls.attack2] ? 'medium' : 'heavy';
      let prefix = this.grounded ? (keys[this.controls.down] ? 'crouch_attack_' : 'attack_') : 'air_attack_';
      let attackName = prefix + type;

      if (this.attackData[attackName]) {
        this.currentAnim = attackName;
        this.frameIndex = 0;
        this.attackLocked = true;
        this.attackTimer = this.attackData[attackName].frames * this.frameSpeed;
      }
    }

    this.vy += 0.5;
    this.y += this.vy;
    if (this.y >= 450 - (4362 / 13)) {
      this.y = 450 - (4362 / 13);
      this.vy = 0;
      this.grounded = true;
    }

    this.x += this.vx;
    this.direction = this.x < opponent.x ? 1 : -1;

    this.updateAnimation(delta);
  }

  updateAnimation(delta) {
    this.frameTimer += delta;
    if (this.frameTimer > this.frameSpeed) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % FRAME_COLS[this.currentAnim];
    }
  }

  draw(ctx) {
    const row = animations[this.currentAnim];
    const col = this.frameIndex;
    const flipped = this.direction === -1;
    const img = flipped ? this.tilesetFlip : this.tileset;
    const frameWidth = 3129 / 7;
    const frameHeight = 4362 / 13;

    ctx.save();
    if (flipped) {
      ctx.scale(-1, 1);
      ctx.drawImage(img, col * frameWidth, row * frameHeight, frameWidth, frameHeight, -this.x - frameWidth, this.y, frameWidth, frameHeight);
    } else {
      ctx.drawImage(img, col * frameWidth, row * frameHeight, frameWidth, frameHeight, this.x, this.y, frameWidth, frameHeight);
    }

    // Debug hitbox
    if (this.attackLocked && this.attackData[this.currentAnim]) {
      const { startup, active } = this.attackData[this.currentAnim];
      if (this.frameIndex >= startup && this.frameIndex < startup + active) {
        ctx.fillStyle = 'red';
        const px = flipped ? -this.x - frameWidth / 2 - 5 : this.x + frameWidth / 2 - 5;
        ctx.fillRect(px, this.y + 50, 10, 10);
      }
    }

    ctx.restore();
  }
}
