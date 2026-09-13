// =============================================
// specialMoves.js — coups spéciaux par personnage.
// Inputs : QCF (bas avant), QCB (bas arrière), DP (avant bas avant),
//          HCF (arrière bas avant), FBF (avant arrière avant),
//          BF (arrière avant), DDD (bas bas bas), 360,
//          CHARGE_F (arrière maintenu puis avant), CHARGE_U (bas maintenu puis haut)
// Types   : projectile, dash, antiair, counter, teleport, grab, multiHit, strike
// Les coups spéciaux se déclenchent aussi en cancel sur les coups normaux.
// =============================================
import { ANIM_ROWS } from './gameConstants.js';

const SP1 = ANIM_ROWS.SPECIAL_1, SP2 = ANIM_ROWS.SPECIAL_2, SP3 = ANIM_ROWS.SPECIAL_3;
const GRABROW = ANIM_ROWS.THROW;

// helper : projectile standard
const P = (o) => ({ type: 'projectile', frames: 24, startup: 9, animationSpeed: 0.75,
    projectile: Object.assign({ speed: 7, damage: 60, size: 14, life: 130,
    color: '#66ccff', height: 'mid', yOff: -100, count: 1, interval: 6, freeze: false }, o) });

export const SPECIALS = {
    // ---------------- IKE ----------------
    ike: [
        { input: 'QCF', animRow: SP1, name: 'Lance Roquette',
          ...P({ speed: 6.5, damage: 90, size: 26, color: '#ff7733', life: 110 }) },
        { input: 'QCB', animRow: SP2, name: 'Dash Mix-Up', type: 'dash',
          frames: 26, startup: 6, animationSpeed: 0.9,
          dash: { speed: 11, duration: 14 },
          variants: {
              light:  { feint: true, damage: 0, range: 0, height: 'mid' },      // feinte
              medium: { damage: 80, range: 120, height: 'low', active: 4 },      // coup bas épée
              heavy:  { damage: 85, range: 130, height: 'high', active: 4 }      // overhead épée
          } },
        { input: 'DP', animRow: SP3, name: 'Uppercut Enflammé', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.8,
          vy: -13, invincible: 10, damage: 100, range: 115, height: 'high',
          active: 6, launcher: true, tint: '#ff5500' }
    ],

    // ---------------- SUZUKI ----------------
    suzuki: [
        { input: 'QCF', animRow: SP1, name: 'Slash Katana', type: 'strike',
          frames: 18, startup: 6, animationSpeed: 0.85,
          variants: { light: { damage: 60, range: 120 }, medium: { damage: 75, range: 160 },
                      heavy: { damage: 90, range: 200 } }, height: 'mid', active: 3 },
        { input: 'Q360', animRow: SP2, name: 'Frappe Circulaire Anti-Air', type: 'antiair',
          frames: 26, startup: 6, animationSpeed: 0.7,
          vy: -11, invincible: 6, multi: { hits: 2, interval: 5 },
          damage: 55, range: 130, height: 'high', active: 4 },
        { input: 'QCB', animRow: SP3, name: 'Contre Attaque', type: 'counter',
          frames: 22, startup: 2, animationSpeed: 0.8,
          counterWindow: 22, counterDamage: 80, counterRange: 140 }
    ],

    // ---------------- TIM ----------------
    tim: [
        { input: 'QCF', animRow: SP1, name: 'Boule de Feu',
          ...P({ variants: { light: { speed: 4.5, damage: 60 }, medium: { speed: 7, damage: 70 },
                             heavy: { speed: 11, damage: 80, life: 80 } }, color: '#ff9922' }) },
        { input: 'QCB', animRow: SP2, name: 'Coup de Pied Tornade', type: 'dash',
          frames: 24, startup: 6, animationSpeed: 0.8,
          dash: { speed: 7, duration: 10 },
          multi: { hits: 2, interval: 5 }, damage: 45, range: 110, height: 'mid', active: 4 },
        { input: 'DP', animRow: SP3, name: 'Uppercut Sauté', type: 'antiair',
          frames: 24, startup: 5, animationSpeed: 0.8,
          vy: -14, invincible: 8, damage: 90, range: 110, height: 'high',
          active: 5, launcher: true },
        { input: 'FBF', animRow: GRABROW, name: 'Rafale de Poings', type: 'grab',
          frames: 30, startup: 8, animationSpeed: 0.9,
          dash: { speed: 12, duration: 12 }, grabDamage: 100, range: 110 }
    ],

    // ---------------- JIN ----------------
    jin: [
        { input: 'DP', animRow: SP1, name: 'Poing Crochet', type: 'antiair',
          frames: 24, startup: 5, animationSpeed: 0.8,
          vy: -12, invincible: 8, projectileImmune: 16, damage: 85, range: 115,
          height: 'high', active: 5, launcher: true, perfect: true },
        { input: 'QCB', animRow: SP2, name: 'Double Pied Anti-Air', type: 'antiair',
          frames: 24, startup: 6, animationSpeed: 0.75,
          vy: -11, multi: { hits: 2, interval: 5 }, damage: 50, range: 115,
          height: 'high', active: 4 },
        { input: 'HCF', animRow: SP3, name: 'Poing Riposte', type: 'counter',
          frames: 20, startup: 2, animationSpeed: 0.85,
          counterWindow: 14, counterDamage: 75, counterRange: 130 }
    ],

    // ---------------- KIMIKO ----------------
    kimiko: [
        { input: 'QCF', animRow: SP1, name: 'Lancé de Tornade',
          ...P({ speed: 5, damage: 65, size: 20, color: '#88ffcc' }) },
        { input: 'QCB', animRow: SP2, name: 'Coup de Pied Tornade', type: 'dash',
          frames: 24, startup: 5, animationSpeed: 0.8,
          dash: { speed: 8, duration: 10 }, multi: { hits: 2, interval: 5 },
          damage: 40, range: 110, height: 'mid', active: 4 },
        { input: 'DP', animRow: SP3, name: 'Tornade Sautée Anti-Air', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -12, invincible: 8, multi: { hits: 2, interval: 4 }, damage: 50,
          range: 115, height: 'high', active: 5 }
    ],

    // ---------------- ROBERT (charges) ----------------
    robert: [
        { input: 'CHARGE_F', animRow: SP1, name: 'Coup de Poing Puissant', type: 'dash',
          frames: 28, startup: 8, animationSpeed: 0.7,
          dash: { speed: 14, duration: 12 }, damage: 90, range: 120,
          height: 'mid', active: 4 },
        { input: 'CHARGE_U', animRow: SP2, name: 'Coup de Tête Sauté', type: 'antiair',
          frames: 26, startup: 6, animationSpeed: 0.75,
          vy: -14, invincible: 6, damage: 95, range: 110, height: 'high',
          active: 5, launcher: true },
        { input: 'Q360', animRow: GRABROW, name: 'Command Grab', type: 'grab',
          frames: 28, startup: 6, animationSpeed: 0.8,
          grabDamage: 110, range: 115 }
    ],

    // ---------------- ROSALINE ----------------
    rosaline: [
        { input: 'QCF', animRow: SP1, name: 'Projectile Glace',
          ...P({ speed: 6, damage: 50, size: 20, color: '#aaddff', freeze: true }) },
        { input: 'BF', animRow: SP2, name: 'Glissade Basse', type: 'dash',
          frames: 26, startup: 6, animationSpeed: 0.8,
          dash: { speed: 12, duration: 12 }, damage: 70, range: 100,
          height: 'low', active: 4 },
        { input: 'DDD', animRow: SP3, name: 'Clone de Glace',
          ...P({ speed: 3.5, damage: 55, size: 30, color: '#ccf0ff', freeze: true, life: 170 }) }
    ],

    // ---------------- JANE ----------------
    jane: [
        { input: 'QCF', animRow: SP1, name: 'Main Électrique', type: 'grab',
          frames: 28, startup: 7, animationSpeed: 0.85,
          dash: { speed: 13, duration: 12 }, grabDamage: 100, range: 110 },
        { input: 'QCB', animRow: SP2, name: 'Rafale de Pieds Électriques', type: 'multiHit',
          frames: 30, startup: 6, animationSpeed: 1,
          multi: { hits: 4, interval: 4 }, damage: 22, range: 105,
          height: 'mid', active: 2, advance: 4 },
        { input: 'DP', animRow: SP3, name: 'Épée Électrique Furtive', type: 'strike',
          frames: 20, startup: 4, animationSpeed: 1,
          invincible: 4, damage: 80, range: 145, height: 'mid', active: 3 }
    ],

    // ---------------- EVA ----------------
    eva: [
        { input: 'QCB', animRow: SP1, name: 'Multi Coup de Pied', type: 'multiHit',
          frames: 30, startup: 6, animationSpeed: 1,
          multi: { hits: 4, interval: 4 }, damage: 20, range: 105,
          height: 'mid', active: 2, advance: 4, lowKnockback: true },
        { input: 'QCF', animRow: SP2, name: 'Vague Sonic',
          ...P({ variants: { light: { speed: 3 }, medium: { speed: 7.5 },
                             heavy: { speed: 12 } }, damage: 65, size: 18, color: '#dd88ff' }) },
        { input: 'DP', animRow: SP3, name: 'Uppercut Sauté 3 Coups', type: 'antiair',
          frames: 28, startup: 5, animationSpeed: 0.75,
          vy: -13, invincible: 6, multi: { hits: 3, interval: 4 }, damage: 30,
          range: 110, height: 'high', active: 4 },
        { input: 'Q360', animRow: GRABROW, name: 'Command Grab', type: 'grab',
          frames: 28, startup: 6, animationSpeed: 0.8,
          grabDamage: 105, range: 115 }
    ],

    // ---------------- PRISCILLA ----------------
    priscilla: [
        { input: 'QCF', animRow: SP1, name: 'Fusil Mitrailleur',
          ...P({ count: 5, interval: 5, speed: 11, damage: 14, size: 8,
                 color: '#ffcc44', life: 90 }) },
        { input: 'QCB', animRow: SP2, name: 'Double Pistolet Anti-Air',
          ...P({ count: 2, interval: 5, speed: 9, vy: -2.5, damage: 22, size: 8,
                 color: '#ffcc44', height: 'high', yOff: -170, life: 70 }) },
        { input: 'DP', animRow: SP3, name: 'Téléportation', type: 'teleport',
          frames: 18, startup: 5, animationSpeed: 1, recovery: 8 }
    ],

    // ---------------- EDOUARDO ----------------
    edouardo: [
        { input: 'QCF', animRow: SP1, name: 'Coup de Feu Revolver',
          ...P({ speed: 12, damage: 45, size: 8, color: '#ffee88', life: 90 }) },
        { input: 'QCB', animRow: SP2, name: 'Riposte Overhead', type: 'antiair',
          levels: ['heavy'],
          frames: 28, startup: 8, animationSpeed: 0.7,
          vy: -7, damage: 95, range: 120, height: 'high', active: 4 },
        { input: 'DP', animRow: SP3, name: 'Uppercut Invincible', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -13, invincible: 14, damage: 105, range: 115, height: 'high',
          active: 5, launcher: true }
    ],

    // ---------------- ANNI-LISA ----------------
    anni_lisa: [
        { input: 'QCB', animRow: SP1, name: 'Esquive Contre', type: 'counter',
          frames: 20, startup: 2, animationSpeed: 0.85,
          counterWindow: 30, counterDamage: 85, counterRange: 140 }
    ],

    // ---------------- JAYTOKI ----------------
    jaytoki: [
        { input: 'QCF', animRow: SP1, name: 'Grande Épée de Lumière', type: 'dash',
          frames: 26, startup: 6, animationSpeed: 0.8,
          dash: { speed: 12, duration: 12 }, damage: 85, range: 160,
          height: 'mid', active: 4 },
        { input: 'QCB', animRow: SP2, name: 'Coups de Feu Pistolet',
          ...P({ variants: {
              light:  { yOff: -45,  height: 'low',  damage: 40 },   // vise le bas
              medium: { yOff: -100, height: 'mid',  damage: 45 },   // tout droit
              heavy:  { yOff: -170, height: 'high', damage: 50 }    // anti-air
          }, speed: 10, size: 9, color: '#ffee88', life: 90, count: 3, interval: 5 }) }
    ],

    // ---------------- les autres personnages : trio par défaut ----------------
    forest: [
        { input: 'QCF', animRow: SP1, name: 'Avatar : Rafale de Poings', type: 'multiHit',
          frames: 30, startup: 6, animationSpeed: 1,
          multi: { hits: 5, interval: 3 }, damage: 18, range: 100,
          height: 'mid', active: 2, advance: 5 },
        { input: 'QCB', animRow: SP2, name: 'Avatar : Grand Poing', type: 'strike',
          frames: 22, startup: 8, animationSpeed: 0.75,
          damage: 80, range: 240, height: 'mid', active: 3 },
        { input: 'DP', animRow: SP3, name: 'Rafale de Poings Anti-Air', type: 'antiair',
          frames: 28, startup: 5, animationSpeed: 0.8,
          vy: -12, invincible: 6, multi: { hits: 3, interval: 4 }, damage: 30,
          range: 115, height: 'high', active: 4 }
    ],
    duke_nukem: [
        { input: 'QCF', animRow: SP1, name: 'Casse-Distance : Coup d\u00c9p\u00e9e', type: 'strike',
          frames: 18, startup: 4, animationSpeed: 1,
          damage: 70, range: 210, height: 'mid', active: 3,
          guardPressure: true, blockstun: 18, chip: 0.25 },
        { input: 'QCB', animRow: SP2, name: 'T\u00e9l\u00e9portation \u00c9clair', type: 'teleport',
          frames: 22, startup: 5, animationSpeed: 0.9, recovery: 8,
          hitDamage: 85, damage: 85, range: 130, active: 4,
          directionalHeight: true },
        { input: 'DP', animRow: SP3, name: '\u00c9p\u00e9e Saut\u00e9e Anti-Air', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -13, invincible: 6, damage: 95, range: 120, height: 'high', active: 5 }
    ],
    kafka: [
        { input: 'QCF', animRow: SP1, name: 'Soie Tranchante',
          ...P({ damage: 55, size: 12, color: '#cc88ff', speed: 8 }) },
        { input: 'QCB', animRow: SP2, name: 'Pirouette', type: 'multiHit',
          frames: 28, startup: 6, animationSpeed: 1,
          multi: { hits: 3, interval: 4 }, damage: 28, range: 100, height: 'mid', active: 2 },
        { input: 'DP', animRow: SP3, name: 'Élévation Gravitationnelle', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -12, invincible: 6, damage: 90, range: 110, height: 'high', active: 5 }
    ],
    jinwoo: [
        { input: 'QCF', animRow: SP1, name: 'Lames d’Ombre',
          ...P({ count: 3, interval: 6, damage: 25, size: 10, color: '#9966ff', speed: 9 }) },
        { input: 'QCB', animRow: SP2, name: 'Entaille Sombre', type: 'strike',
          frames: 20, startup: 5, animationSpeed: 0.85,
          damage: 80, range: 150, height: 'mid', active: 3 },
        { input: 'DP', animRow: SP3, name: 'Danse des Ombres', type: 'teleport',
          frames: 20, startup: 5, animationSpeed: 0.9, recovery: 8,
          hitDamage: 40, damage: 40, range: 110, active: 3 }
    ],
    asuka: [
        { input: 'QCF', animRow: SP1, name: 'Onde de Ki',
          ...P({ damage: 60, color: '#88c8ff', size: 16 }) },
        { input: 'QCB', animRow: SP2, name: 'Mawashi Geri', type: 'dash',
          frames: 24, startup: 5, animationSpeed: 0.8,
          dash: { speed: 8, duration: 10 }, damage: 75, range: 115, height: 'mid', active: 4 },
        { input: 'DP', animRow: SP3, name: 'Rising Dragon', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -13, invincible: 8, damage: 95, range: 110, height: 'high', active: 5 }
    ],
    morpheus: [
        { input: 'QCF', animRow: SP1, name: 'Distorsion',
          ...P({ damage: 55, size: 20, color: '#aaffee', speed: 6 }) },
        { input: 'QCB', animRow: SP2, name: 'Esquive du Néant', type: 'counter',
          frames: 20, startup: 2, animationSpeed: 0.85,
          counterWindow: 18, counterDamage: 80, counterRange: 130 },
        { input: 'DP', animRow: SP3, name: 'Ascension', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -13, invincible: 10, damage: 90, range: 110, height: 'high', active: 5 }
    ],
    baki: [
        { input: 'QCF', animRow: SP1, name: 'Dash Poing Tranchant', type: 'dash',
          frames: 24, startup: 5, animationSpeed: 0.85,
          dash: { speed: 13, duration: 10 }, damage: 80, range: 110, height: 'mid', active: 3 },
        { input: 'QCB', animRow: SP2, name: 'Balayage Sol', type: 'dash',
          frames: 24, startup: 6, animationSpeed: 0.8,
          dash: { speed: 9, duration: 10 }, damage: 70, range: 105, height: 'low', active: 4 },
        { input: 'DP', animRow: SP3, name: 'Cobra Uppercut', type: 'antiair',
          frames: 26, startup: 5, animationSpeed: 0.75,
          vy: -13, invincible: 8, damage: 95, range: 110, height: 'high', active: 5 }
    ]
};

/** Motion prioritaire quand plusieurs patterns matchent. */
const MOTION_PRIORITY = ['Q360', 'DDD', 'DP', 'HCF', 'FBF', 'BF', 'QCF', 'QCB', 'CHARGE_F', 'CHARGE_U'];

/** Trouve le coup spécial correspondant aux motions actuelles du joueur.
    Retourne { def, level } ou null. */
export function matchSpecial(slug, motion, level) {
    const list = SPECIALS[slug];
    if (!list) return null;
    const candidates = list.filter(d => d.levels?.includes(level) || !d.levels || d.levels.includes(level));
    for (const input of MOTION_PRIORITY) {
        const ok =
            (input === 'Q360' && motion.full360()) ||
            (input === 'DDD' && motion.ddd()) ||
            (input === 'DP' && motion.dp()) ||
            (input === 'HCF' && motion.hcf()) ||
            (input === 'FBF' && motion.fbf()) ||
            (input === 'BF' && motion.bf()) ||
            (input === 'QCF' && motion.qcf()) ||
            (input === 'QCB' && motion.qcb()) ||
            (input === 'CHARGE_F' && motion.chargeForward()) ||
            (input === 'CHARGE_U' && motion.chargeUp());
        if (!ok) continue;
        const def = list.find(d => d.input === input &&
            (!d.levels || d.levels.includes(level)));
        if (def) return { def, level };
    }
    return null;
}
