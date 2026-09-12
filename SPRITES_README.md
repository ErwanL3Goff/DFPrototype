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

## 📐 Structure des Tilesets

Chaque tileset contient **4 lignes × 8 frames** :

```
┌─────────────────────────────────────────┐
│ Ligne 1: IDLE (repos) - 8 frames        │
├─────────────────────────────────────────┤
│ Ligne 2: WALK (marche) - 8 frames       │
├─────────────────────────────────────────┤
│ Ligne 3: ATTACK (attaque) - 8 frames    │
├─────────────────────────────────────────┤
│ Ligne 4: SPECIAL (coup spécial) - 8     │
└─────────────────────────────────────────┘
```

- **Dimensions par frame** : 50×50 pixels
- **Dimensions totales** : 400×200 pixels
- **Format** : PNG avec fond blanc

---

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
