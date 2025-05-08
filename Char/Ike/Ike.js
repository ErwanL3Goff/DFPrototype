import { Personnage } from '../personnage.js';
import { animations, FRAME_COLS } from '../animations.js';

export const tilesetIke = new Image();
tilesetIke.src = './assets/tileset.png';

export const tilesetIkeFlip = new Image();
tilesetIkeFlip.src = 'Tileset2.png';

export const attackDataIke = {
  attack_light: { frames: 3, startup: 1, active: 1, recovery: 1 },
  attack_medium: { frames: 4, startup: 1, active: 2, recovery: 1 },
  attack_heavy: { frames: 5, startup: 2, active: 2, recovery: 1 },
  air_attack_light: { frames: 3, startup: 1, active: 1, recovery: 1 },
  air_attack_medium: { frames: 4, startup: 1, active: 2, recovery: 1 },
  air_attack_heavy: { frames: 5, startup: 2, active: 2, recovery: 1 },
  crouch_attack_light: { frames: 3, startup: 1, active: 1, recovery: 1 },
  crouch_attack_medium: { frames: 4, startup: 1, active: 2, recovery: 1 },
  crouch_attack_heavy: { frames: 5, startup: 2, active: 2, recovery: 1 }
};

export class Ike extends Personnage {
  constructor(x, controls) {
    super(x, controls, tilesetIke, tilesetIkeFlip, attackDataIke);

    this.nom = "Ike";
    this.pointsDeVie = 200;
    this.defense = 100;
    this.coupsSpeciaux = [
      "Clint Eastwood",
      "Cassandra Tornado",
      "Herculeopercut"
    ];
  }

  utiliserCoupSpecial(index, cible) {
    if (index < 0 || index >= this.coupsSpeciaux.length) {
      console.log("Coup spécial invalide.");
      return;
    }

    const coup = this.coupsSpeciaux[index];
    const degats = this.defense * 0.5; // Exemple d'effet personnalisé
    cible.pointsDeVie -= degats;

    console.log(`${this.nom} utilise "${coup}" sur ${cible.nom} et inflige ${degats} points de dégâts.`);
  }

  criDeCombat() {
    console.log(`${this.nom} dit : "Mes chers salutation."`);
  }
}
