# 🎨 Sprites Personnages - DF Prototype 2

## Sprites Générés Automatiquement

Des tilesets d'animation ont été générés pour les personnages suivants :

### ✅ Personnages Disponibles

| Personnage | Style | Couleurs Principales | Tileset |
|------------|-------|---------------------|---------|
| **Ike** | Héros dynamique | Orange vif, Blanc, Bleu foncé | `Char/Ike/sprites_generated/ike_tileset.png` |
| **Kafka** | Mystérieux/Sombre | Noir, Gris foncé, Rouge sang | `Char/Kafka/sprites_generated/kafka_tileset.png` |
| **Suzuki** | Samouraï | Rouge kimono, Noir hakama, Doré | `Char/Suzuki/sprites_generated/suzuki_tileset.png` |
| **Jane** | Combattante | Rouge bordeaux, Bleu nuit, Or | `Char/Jane/sprites_generated/jane_tileset.png` |
| **Tim** | Aventureur | Blond, Vert forêt, Marron | `Char/Tim/sprites_generated/tim_tileset.png` |
| **Asuka** | Artiste martial | Blanc gi, Rouge obi, Bleu | `Char/Asuka/sprites_generated/asuka_tileset.png` |
| **Baki** | Fighter intense | Noir, Gris anthracite, Orange | `Char/Baki/sprites_generated/baki_tileset.png` |

---

## 📐 Structure des Tilesets (format 16 lignes)

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

## 🛠️ Comment Utiliser dans le Jeu

### Dans `game.js` ou `char.js` :

```javascript
// Charger le tileset du personnage
const charTileset = {
    'Ike': 'Char/Ike/sprites_generated/ike_tileset.png',
    'Kafka': 'Char/Kafka/sprites_generated/kafka_tileset.png',
    'Suzuki': 'Char/Suzuki/sprites_generated/suzuki_tileset.png',
    // ... autres personnages
};

// Configuration d'animation
const animationConfig = {
    frameWidth: 50,
    frameHeight: 50,
    framesPerRow: 8,
    states: ['idle', 'walk', 'attack', 'special']
};

// Pour dessiner une frame spécifique
function drawSprite(ctx, tilesetImg, state, frameIndex, x, y) {
    const row = animationConfig.states.indexOf(state);
    const sx = frameIndex * animationConfig.frameWidth;
    const sy = row * animationConfig.frameHeight;
    
    ctx.drawImage(
        tilesetImg,
        sx, sy, animationConfig.frameWidth, animationConfig.frameHeight,
        x, y, animationConfig.frameWidth, animationConfig.frameHeight
    );
}
```

---

## 🎨 Personnalisation

Les sprites sont générés avec des couleurs basées sur le style de chaque personnage. Vous pouvez :

1. **Modifier les couleurs** dans le script de génération
2. **Ajouter de nouveaux personnages** en suivant le même modèle
3. **Ajuster les dimensions** si nécessaire (actuellement 50×50px)

### Exemple pour ajouter un nouveau personnage :

```python
characters['NouveauPerso'] = {
    'skin': (255, 200, 180),    # Couleur de peau
    'hair': (100, 50, 30),      # Couleur cheveux
    'shirt': (60, 90, 150),     # Couleur haut
    'pants': (40, 40, 60),      # Couleur bas
    'accent': (255, 100, 100),  # Couleur accent/spécial
    'name': 'NouveauPerso'
}
```

---

## 📁 Arborescence

```
/workspace/Char/
├── Ike/
│   └── sprites_generated/
│       ├── ike_tileset.png
│       ├── ike_idle.png
│       ├── ike_walk.png
│       ├── ike_attack.png
│       └── ike_special.png
├── Kafka/
│   └── sprites_generated/
│       └── ...
├── Suzuki/
│   └── sprites_generated/
│       └── ...
└── ... (autres personnages)
```

---

## ⚡ Notes Techniques

- Les sprites sont générés procéduralement avec Pillow (PIL)
- Style minimaliste mais distinctif pour chaque personnage
- Compatible avec les systèmes d'animation par tileset classiques
- Fond blanc pour faciliter l'intégration (peut être rendu transparent si besoin)

---

**Généré automatiquement pour DF Prototype 2** 🎮
