# DFPrototype
Test : https://digital-fighter.onrender.com

Appuyez sur Entrée pour lancer l’écran de sélection des personnages.

Joueur 1 : déplacez-vous avec les flèches du clavier et validez votre choix avec la touche 1.
Joueur 2 : déplacez-vous avec les touches Z, Q, S, D et validez votre choix avec la touche K.

Une fois vos personnages choisis, cliquez sur Commencer le combat.

Pendant la partie :

Joueur 1 : se déplace avec les flèches et attaque avec 1, 2 ou 3.
Joueur 2 : se déplace avec Z, Q, S, D et attaque avec K, L ou M.

## Coups spéciaux et projections

Chaque personnage possède ses propres coups spéciaux (voir la liste dans
`Character Select/characters.json` et l'écran de sélection). Ils se
déclenchent avec des motions de direction + un bouton d'attaque :

- **Bas, Avant + attaque** (quart de cercle avant)
- **Bas, Arrière + attaque** (quart de cercle arrière)
- **Avant, Bas, Bas-Avant + attaque** (dragon punch)
- **Arrière, Bas, Avant + attaque**, **Avant, Arrière, Avant + attaque**,
  **Arrière, Avant + attaque**, **Bas, Bas, Bas + attaque**
- **360°** (les quatre directions) + attaque — Eva, Robert, Suzuki
- **Charges** (Robert) : maintenir Arrière puis Avant + attaque, ou
  maintenir Bas puis Haut + attaque

Le bouton d'attaque détermine la version du coup : **1 = légère,
2 = moyenne, 3 = lourde** (certains coups varient en portée, vitesse ou
hauteur selon la version).

### Projection

Appuyez sur **les trois boutons d'attaque en même temps** (1+2+3 / K+L+M)
près de l'adversaire : la projection traverse la garde et envoie au sol.
- Sans direction tenue : la victime est projetée **devant** (vers l'avant)
- **Arrière tenu** : la victime est projetée **derrière** (envol plus fort)

### Déplacements

- Saut plus haut, et **double saut** : relancez haut en plein vol
- Contrôle aérien renforcé
- Les dashes spéciaux (Grande Épée de Jaytoki, glissades, charges) foncent
  vers l'adversaire et s'arrêtent à portée de frappe
- Les ripostes (contres de Suzuki, Jin, Anni-Lisa, Morpheus) font foncer
  le personnage vers l'attaquant pour le punir
- Reconnaissance des motions très permissive : buffer de 40 frames, le
  bouton peut partir dès la diagonale (bas-avant / bas-arrière), la
  motion peut être jouée lentement

### Combos

- **Combo cancel** : pendant les frames actives d'un coup normal, une
  motion + bouton annule le coup et déclenche le spécial (comme sur
  Street Fighter).
- **Target combo** : léger -> moyen -> lourd s'enchaînent sur un coup qui
  touche.
- Les coups spéciaux peuvent donc suivre n'importe quel coup normal.

### Mécaniques par personnage (exemples)

- **Ike** : lance roquette, dash mix-up (feinte / coup bas / overhead),
  uppercut enflammé invincible
- **Rosaline** : projectiles de glace qui gèlent l'adversaire non gardé
  (le gel se brise au prochain coup reçu), glissade basse, clone de glace
- **Tim** : boule de feu (vitesse selon le bouton), coup de pied tornade,
  uppercut sauté, rafale de poings (projection)
- **Robert** : charges (coup de poing puissant, coup de tête sauté) et
  command grab 360°
- **Suzuki** : slash de katana (portée selon le bouton), frappe circulaire
  anti-air, contre-attaque
- **Eva** : vague sonic (vitesse variable), multi coup de pied, uppercut
  3 coups, command grab 360°
