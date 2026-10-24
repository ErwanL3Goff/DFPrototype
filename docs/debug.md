# Overlay debug (touches hôte)

Comme le portage SSF2T HD Remix expose des touches hôte pour le
diagnostic, le moteur de DFPrototype en fournit trois :

| Touche | Effet |
|--------|-------|
| **F2** | compteur de frames : FPS et tick de jeu en haut à droite |
| **F3** | overlay debug : état, position, PV et frame data de chaque combattant, hitboxes (rouge = coup, bleu = corps, orange = projectile) |
| **F7** | overlay des succès (le jeu se met en pause) |

Ces touches n'affectent pas les entrées des joueurs (P1 : flèches,
P2 : ZQSD). Elles servent au réglage du gameplay (fenêtres actives,
portées, timings de frame) et au test automatisé.
