// =============================================
// MotionInput.js — reconnaissance des motions de coups spéciaux.
// Quart de cercle avant/arrière, dragon punch, demi-cercle, 360°,
// doubles directions, triple bas, charges (arrière...avant / bas...haut).
// Les directions sont relatives au sens du personnage (6 = avant).
// =============================================
import { CONTROLS, SPECIAL } from './gameConstants.js';

// pavé numérique : 1=bas-arrière 2=bas 3=bas-avant 4=arrière 6=avant 7=haut-arrière 8=haut 9=haut-avant
export class MotionInput {
    constructor(playerId) {
        this.player = playerId;
        this.history = [];          // [{ dir, frame }] sans doublons consécutifs
        this.frame = 0;
        this.chargeBack = 0;        // frames de charge arrière
        this.chargeDown = 0;        // frames de charge bas
        this.chargeFwdReady = 0;    // frames restantes pour activer charge avant
        this.chargeUpReady = 0;     // frames restantes pour activer charge haut
        this.pressTimes = {};       // action -> frame du dernier front montant
        this.downFrames = {};       // action -> frames maintenues
    }

    /** Direction numpad courante selon les touches et le facing. */
    static directionOf(input, player, facing) {
        const c = CONTROLS[player];
        const left = input.isDown(c.left), right = input.isDown(c.right);
        const up = input.isDown(c.up), down = input.isDown(c.down);
        const fwd = facing === 1 ? right : left;
        const back = facing === 1 ? left : right;
        let d = 5;                                  // neutre
        if (down) { d = fwd ? 3 : (back ? 1 : 2); }
        else if (up) { d = fwd ? 9 : (back ? 7 : 8); }
        else if (fwd) d = 6;
        else if (back) d = 4;
        return d;
    }

    /** À appeler chaque frame logique, avant les fighters. */
    update(input, facing) {
        this.frame++;
        const dir = MotionInput.directionOf(input, this.player, facing);
        const last = this.history[this.history.length - 1];
        if (!last || last.dir !== dir) this.history.push({ dir, frame: this.frame });
        while (this.history.length && this.frame - this.history[0].frame > SPECIAL.bufferFrames) this.history.shift();

        // charges (la charge survit au neutre, perdue si on repart en arrière/avant)
        if (dir === 4) this.chargeBack++;
        else if (dir === 6) {
            if (this.chargeBack >= SPECIAL.chargeFrames) this.chargeFwdReady = 9;
            this.chargeBack = 0;
        }
        if (dir === 2 || dir === 1 || dir === 3) this.chargeDown++;
        else if (dir >= 7) {
            if (this.chargeDown >= SPECIAL.chargeFrames) this.chargeUpReady = 9;
            this.chargeDown = 0;
        }
        if (this.chargeFwdReady > 0) this.chargeFwdReady--;
        if (this.chargeUpReady > 0) this.chargeUpReady--;

        // fronts montants par action (pour la projection 3 boutons)
        for (const a of ['light', 'medium', 'special']) {
            if (input.justPressedAction(this.player, a)) this.pressTimes[a] = this.frame;
        }
    }

    /** Dernières directions en ordre (sans le neutre). */
    _dirs() {
        return this.history.filter(h => h.dir !== 5).map(h => h.dir);
    }

    _match(...seq) {
        const d = this._dirs();
        if (d.length < seq.length) return false;
        const tail = d.slice(-seq.length);
        return seq.every((v, i) => tail[i] === v);
    }

    /** bas -> bas-avant -> avant (2,3,6) — le bouton peut partir dès la diagonale 3 */
    qcf() {
        const d = this._dirs();
        return this._match(2, 3, 6) || this._match(2, 6) ||
               (d.length >= 2 && d[d.length-1] === 6 && d[d.length-2] === 3) ||
               (d.length >= 2 && d[d.length-1] === 3 && d[d.length-2] === 2);
    }

    /** bas -> bas-arrière -> arrière (2,1,4) — le bouton peut partir dès la diagonale 1 */
    qcb() {
        const d = this._dirs();
        return this._match(2, 1, 4) || this._match(2, 4) ||
               (d.length >= 2 && d[d.length-1] === 4 && d[d.length-2] === 1) ||
               (d.length >= 2 && d[d.length-1] === 1 && d[d.length-2] === 2);
    }

    /** avant -> bas -> avant (6,2,3) ou (6,2,6) : dragon punch */
    dp() {
        return this._match(6, 2, 3) || this._match(6, 2, 6) || this._match(6, 2, 9);
    }

    /** arrière -> bas -> avant (4,2,6) : demi-cercle avant */
    hcf() {
        return this._match(4, 2, 6) || this._match(4, 2, 3);
    }

    /** avant -> arrière -> avant (6,4,6) */
    fbf() { return this._match(6, 4, 6); }

    /** arrière -> avant (4,6) : glissade */
    bf() { return this._match(4, 6); }

    /** triple appui bas (2,2,2) */
    ddd() {
        const d = this._dirs();
        let n = 0, lastF = -99;
        for (const { dir, frame } of this.history) {
            if (dir === 2 && frame - lastF >= 3) { n++; lastF = frame; }
        }
        return n >= 3;
    }

    /** 360° : les 4 directions cardinales dans le buffer */
    full360() {
        const d = new Set(this._dirs());
        return d.has(6) && d.has(2) && d.has(4) && d.has(8);
    }

    /** charges Robert : arrière maintenu puis avant pressé */
    chargeForward() { return this.chargeFwdReady > 0; }
    /** bas maintenu puis haut pressé */
    chargeUp() { return this.chargeUpReady > 0; }

    /** Les 3 boutons d'attaque pressés dans une fenêtre de 3 frames ? */
    threeAttackButtons() {
        const t = this.pressTimes;
        if (t.light === undefined || t.medium === undefined || t.special === undefined) return false;
        const now = this.frame;
        const ts = [t.light, t.medium, t.special];
        return ts.every(x => now - x <= 3) && Math.max(...ts) - Math.min(...ts) <= 3;
    }

    /** Consomme la motion (vide l'historique) pour éviter les doublons. */
    consume() { this.history = []; this.pressTimes = {}; }
}
