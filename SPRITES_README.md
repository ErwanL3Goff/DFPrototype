# 🎨 Sprites Personnages - DF Prototype 2

## ✨ NOUVEAU : Système de Sprites Animés Amélioré

Le système de sprites a été entièrement repensé pour offrir un style animé fluide et dynamique !

### 🎬 Fonctionnalités du Nouveau Système

#### 1. **Squash & Stretch Dynamique**
- Étirement du personnage pendant les sauts (effet de vitesse)
- Compression à l'atterrissage pour un impact visuel
- Respiration légère en idle pour donner vie au personnage

#### 2. **Effets de Glow et Auras**
- Aura pulsante pour les coups spéciaux (feu, glace, foudre, etc.)
- Scintillement doré pendant l'invincibilité
- Lueur verte pour le contre actif
- Flash blanc quand le personnage est touché

#### 3. **Motion Blur**
- Traînées de mouvement pendant les déplacements rapides
- Intensité proportionnelle à la vitesse

#### 4. **Interpolation entre Frames**
- Transition fluide entre les animations
- Méthode `drawInterpolated()` pour fondre deux frames

#### 5. **Ombres Portées Dynamiques**
- Ombre qui s'adapte à la hauteur du saut
- Direction ajustée selon l'orientation du personnage

#### 6. **Particules et Effets Spéciaux**
- Glaçons animés autour des personnages gelés
- Étincelles dorées pour l'invincibilité
- Aura pulsante pour les contres

---

## 📐 Structure des Tilesets (20 lignes x 8 frames)

Chaque tileset contient **20 lignes x 8 frames** de 50px (400x1000, fond
transparent), d'après le modèle GrandeTileset étendu :

| Ligne | Animation | Utilisée pour |
|-------|-----------|---------------|
| 1 | Pose statique (idle) | attente |
| 2 | Marche | déplacement |
| 3 | Saut | arc de saut (décollage/apogée/atterrissage) |
| 4 | Accroupi | touche bas |
| 5 | Attaque légère | touche 1 (K pour J2) |
| 6 | Attaque moyenne | touche 2 (L pour J2) |
| 7 | Attaque lourde / spécial | touche 3 (M pour J2) |
| 8 | Attaque aérienne légère | saut + touche 1 |
| 9 | Attaque aérienne moyenne | saut + touche 2 |
| 10 | Attaque aérienne lourde | saut + touche 3 |
| 11 | Attaque accroupie légère | bas + touche 1 |
| 12 | Attaque accroupie moyenne | bas + touche 2 |
| 13 | Attaque accroupie lourde | bas + touche 3 |
| 14 | Garde haute | maintenir arrière |
| 15 | Garde basse | maintenir arrière + bas |
| 16 | K.O. | fin de round |
| 17 | Projection | les 3 boutons d'attaque en même temps |
| 18 | Coup spécial n°1 (bas avant + attaque) | ex : lance roquette d'Ike |
| 19 | Coup spécial n°2 (bas arrière + attaque) | ex : dash mix-up d'Ike |
| 20 | Coup spécial n°3 (dragon punch, 360°, charge...) | ex : uppercut enflammé |

### État actuel de génération

- **Ike** : lignes 1-16 générées par IA (4 feuilles assemblées).
- **Tous les personnages** : lignes 17-20 (projection + coups spéciaux)
  générées procéduralement (teinte élément + aura : feu, glace, foudre...)
  en attendant la génération IA. Les backup 4 et 16 lignes sont
  sauvegardés dans `*_tileset_4rows_backup.png` et `*_tileset_16rows_backup.png`.
- Les coups spéciaux de chaque personnage sont définis dans
  `Char/Test2/js/specialMoves.js` (motions, dégâts, variantes par bouton).
- **Recadrage (outils/fix_tilesets.py)** : chaque frame est nettoyée puis
  recadrée automatiquement — cadres décoratifs des planches d'origine
  supprimés, plus grande figure conservée, personnage recentré et pieds
  calés en bas de la frame, échelle uniforme par ligne d'animation.
  Les frames vides (attaques aériennes, spéciaux) sont reconstruites à
  partir des frames voisines ou de la pose teintée de la ligne 17.

### Garde (nouvelle mécanique)

Maintenir la direction opposée à l'adversaire bloque les coups :
- garde haute bloque les coups moyens et aériens
- garde basse (arrière + bas) bloque les coups moyens et accroupis
- un coup bloqué ne fait subir que 15% des dégâts (chip damage)


## 🎮 États d'Animation

### 1. Idle (Repos)
- Position neutre du personnage
- Respiration légère
- Prêt à combattre

### 2. Walk (Marche/Déplacement)
- Animation de déplacement
- Jambes en mouvement alternatif
- Bras balançant naturellement

### 3. Attack (Attaque de base)
- Poing tendu ou coup porté
- Corps penché vers l'avant
- Posture agressive

### 4. Special (Coup spécial)
- Effets d'énergie/aura
- Cheveux dressés ou mouvements dramatiques
- Pose puissante caractéristique


---

## 🛠️ Comment Utiliser le Nouveau Système

### Dans `Fighter.js` ou vos propres classes :

```javascript
// Utilisation basique (compatible ancien système)
this.sprites.draw(ctx, row, frame, x, y, facing, scale);

// Utilisation avancée avec effets de style animé
this.sprites.draw(ctx, row, frame, x, y, facing, scale, {
    squash: 1.1,              // Compression verticale (1 = normal)
    stretch: 0.9,             // Étirement horizontal (1 = normal)
    rotation: Math.PI / 8,    // Rotation en radians
    glowColor: '#ff6600',     // Couleur de l'aura (feu)
    glowIntensity: 0.7,       // Intensité du glow (0-1)
    flashColor: '#ffffff',    // Couleur de flash
    flashIntensity: 0.5,      // Intensité du flash (0-1)
    opacity: 1.0,             // Opacité globale
    motionBlur: 0.3,          // Traînée de mouvement (0-1)
    colorTint: '#aee6ff',     // Teinte de couleur (gel)
    additiveBlend: false      // Mode de fusion additif
});

// Interpolation fluide entre deux frames
this.sprites.drawInterpolated(ctx, row, frame1, frame2, t, x, y, facing, scale, {
    opacity: 0.8
});
// t = 0 → frame1, t = 1 → frame2
```

### Exemple dans la classe Fighter :

```javascript
_getAnimatedStyleOptions() {
    const options = {
        squash: 1.0,
        stretch: 1.0,
        glowColor: null,
        motionBlur: 0
    };

    // Squash & stretch basé sur la vitesse
    if (!this.grounded) {
        const speed = Math.abs(this.vy);
        options.stretch = 1 + Math.min(speed * 0.02, 0.15);
        options.squash = 1 - Math.min(speed * 0.015, 0.1);
    }

    // Motion blur pendant les déplacements rapides
    if (Math.abs(this.vx) > MOVE_SPEED * 0.8) {
        options.motionBlur = Math.abs(this.vx) / MOVE_SPEED * 0.4;
    }

    // Glow pour les coups spéciaux
    if (this.attack && this.attack.type === 'special') {
        options.glowColor = '#ff6600';
        options.glowIntensity = 0.5 + Math.sin(performance.now() / 100) * 0.2;
    }

    return options;
}

draw(ctx) {
    const animOptions = this._getAnimatedStyleOptions();
    this.sprites.draw(ctx, this.animRow, this.animFrame, 
                      this.x, this.y, this.facing, SPRITE_SCALE, animOptions);
}
```

---

## 🎨 Configuration des Effets

### Couleurs d'éléments pour les coups spéciaux :

```javascript
const elementColors = {
    fire: '#ff6600',      // Feu - orange rougeoyant
    ice: '#00ccff',       // Glace - bleu glacier
    lightning: '#ffcc00', // Foudre - jaune électrique
    dark: '#9900ff',      // Obscur - violet sombre
    holy: '#ffffaa'       // Sacré - blanc doré
};
```

### Paramètres de la classe SpriteManager :

```javascript
spriteManager.setAnimationConfig({
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowBlur: 8,
    shadowOffset: { x: 0, y: 5 },
    outlineColor: 'rgba(0, 0, 0, 0.3)',
    outlineWidth: 2,
    glowBlur: 15,
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.1
});
```

---

## ⚡ Optimisations

### Cache de Frames

Le système met automatiquement en cache les frames pré-rendues pour optimiser les performances :

```javascript
// Activer/désactiver le cache
spriteManager.setCacheEnabled(true);

// Vider le cache manuellement
spriteManager.clearCache();

// Le cache se vide automatiquement quand il dépasse 500 entrées
```

---

## 📁 Fichiers Modifiés

| Fichier | Description |
|---------|-------------|
| `Char/Test2/js/SpriteManager.js` | Nouveau système de rendu avec effets animés |
| `Char/Test2/js/Fighter.js` | Intégration des effets dans la classe Fighter |

---

## 🎮 Effets par Défaut dans Fighter.js

La classe `Fighter` intègre automatiquement les effets suivants :

| État | Effet | Description |
|------|-------|-------------|
| **Idle** | Respiration | Oscillation lente du squash/stretch |
| **Saut** | Stretch vertical | Étirement proportionnel à la vitesse |
| **Course rapide** | Motion blur | Traînées de mouvement |
| **Coup spécial** | Glow élémentaire | Aura pulsante colorée |
| **Invincibilité** | Étincelles dorées | Particules circulaires |
| **Contre actif** | Aura verte | Ellipse pulsante |
| **Gel** | Glaçons + teinte bleue | Particules triangulaires |
| **Garde** | Flash bleu | Lueur proportionnelle au blockstun |
| **Hit** | Flash blanc | Clignotement bref |
| **K.O.** | Teinte rouge | Overlay semi-transparent |

---

**Mis à jour pour DF Prototype 2 - Système de sprites animés amélioré** 🎮✨
