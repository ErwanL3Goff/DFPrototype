// =============================================
// InputManager.js — clavier multi-joueurs, détection front montant.
// Utilise e.key (caractère produit) donc compatible AZERTY.
// =============================================
import { CONTROLS } from './gameConstants.js';

export class InputManager {
    constructor() {
        this.down = new Set();     // touches maintenues
        this.pressed = new Set();  // touches pressées cette frame (front montant)

        window.addEventListener('keydown', (e) => {
            const k = e.key.toLowerCase();
            if (!this.down.has(k)) this.pressed.add(k);
            this.down.add(k);
            if (k.startsWith('arrow') || ['q','d','z','s'].includes(k)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.down.delete(e.key.toLowerCase());
        });
        window.addEventListener('blur', () => this.down.clear());
    }

    isDown(key) { return this.down.has(key); }

    /** Le joueur `player` ('p1' | 'p2') appuie-t-il sur l'action `action` ? */
    isDownAction(player, action) {
        return this.isDown(CONTROLS[player][action]);
    }

    /** Front montant : l'action vient d'être pressée cette frame. */
    justPressedAction(player, action) {
        return this.pressed.has(CONTROLS[player][action]);
    }

    /** À appeler en fin de frame pour vider les fronts montants. */
    endFrame() { this.pressed.clear(); }
}
