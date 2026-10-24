# Succès hors-ligne

Inspiré du portage PC de SSF2T HD Remix (12 succès, 200G, tout en local) :
tout est stocké dans `localStorage` sous la clé `dfproto_achievements_v1`,
aucune connexion n'est nécessaire.

## Liste (12)

| # | Succès | Condition |
|---|--------|-----------|
| 1 | Premier Sang | remporter un round |
| 2 | Sans une Égratignure | gagner un round à 100 % de PV |
| 3 | Spécialiste | toucher avec un coup spécial |
| 4 | Annulation Royale | couper un coup normal par un coup spécial (combo cancel) |
| 5 | Projection Implacable | projeter l'adversaire |
| 6 | Plein Tour | réussir une projection 360° |
| 7 | Œil du Tigre | absorber un coup et riposter avec un contre |
| 8 | Brise-Glace | briser le gel de Rosaline |
| 9 | Acrobatie | réussir un double saut en plein vol |
| 10 | Contre la Montre | gagner un round au Time Up |
| 11 | Champion | gagner un match complet |
| 12 | Vétéran | terminer 5 matchs |

## Fonctionnement

- `Char/Test2/js/Achievements.js` définit la liste, la persistance
  (`unlocked` + compteur `matches`) et l'interface.
- Déblocage : `game.achievements.track(event, data)` appelé par
  `Game.js` (K.O., fin de match, projection, coup spécial) et par
  `Fighter.js` via `window.__achievements` (cancel, contre, double
  saut, brise-gel).
- Notification toast en haut à droite à chaque déblocage.
- **F7** ouvre l'overlay (grille des succès, barre de progression) et
  **pause le jeu** ; F7 ou Échap referment.
