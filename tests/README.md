# Tests Playwright du moteur de combat

Tests automatisés qui pilotent le jeu dans un vrai navigateur Chromium.
Ils simulent les touches exactement comme un joueur.

## Lancer les tests

```bash
npm i playwright           # puis npx playwright install chromium
python3 -m http.server 8080   # à la racine du dépôt
node tests/test_specials.mjs    # coups spéciaux, projections, gels, contres (12 tests)
node tests/test_physics.mjs     # saut, double saut, projections avant/arrière, dashes (6 tests)
node tests/test_forest_duke.mjs # spéciaux d'Enkidou (Forest) et Gilgamesh (Duke Nukem) (6 tests)
node tests/test_game.mjs        # sélection, lancement de partie, dégâts
node tests/test_guard.mjs       # garde haute/basse, overhead, K.O.
```

Le serveur doit rester actif dans un autre terminal. Chaque suite ouvre
l'écran de sélection, force deux personnages via localStorage, passe
l'intro (8,5 s) et vérifie les états internes du jeu (`window.__game`).

## Ce qui est vérifié

- motions de quart de cercle, dragon punch, 360°, charges, téléportations
- projection (3 boutons ensemble) qui traverse la garde, avant ou arrière
- combo cancel (coup normal -> spécial dans les frames actives)
- gel de Rosaline, brisure du gel, contre-riposte de Suzuki qui fonce
- invincibilité de l'uppercut, variantes par bouton (léger/moyen/lourd)
- garde haute vs coup bas, overhead vs garde basse, K.O. animé
