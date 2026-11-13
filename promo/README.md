# Vidéo promo — Soleilenterrasse

`soleil-en-terrasse-promo.mp4` : 40 s, vertical 1080×1920, 30 i/s, H.264 + AAC (Reels, TikTok, Shorts, Stories).

Design épuré, fond blanc, centré sur la 3D en gros plan. Textes inspirés du Reel Soleilenterrasse. Toutes les images de l’app sont de vraies captures (carte 3D réelle, 21 juin, Bordeaux).

| Temps | Séquence |
|---|---|
| 0–4 s | Écran d’accueil : « Les terrasses au soleil, en temps réel. » |
| 4–8 s | Vraie terrasse bordelaise filmée (`public/terrasse.mp4`), le soleil de l’app se pose dessus : « Grand soleil. Reste à trouver la bonne terrasse. » |
| 8–14 s | Calcul d’ombres 3D : « Chaque immeuble. Chaque heure. », de 7h à 19h30 en gros plans (cathédrale Saint-André sous deux angles, flèche Saint-Michel) |
| 14–18 s | L’appli sur le centre-ville : « Toutes les terrasses autour de toi. » |
| 18–22 s | Filtre ce qui te fait envie : Un café. Un déj’. L’apéro. Au frais. |
| 22–26 s | Partout en France : compteur jusqu’à 11 482 terrasses et lieux, villes qui défilent |
| 26–30 s | Gratuit. Sans compte. Zéro donnée. |
| 30–35 s | Restaurateurs : La Mère Michel en étoile sur la 3D, sa fiche avec photo (badge Sélection, Réserver) puis « Rejoignez la Sélection. » |
| 35–40 s | « Le soleil, c’est maintenant. » · Lien en bio |

Le chiffre 11 482 est la somme des fichiers `data/*.json` (9 villes).

- `captures/` : une sélection des captures réelles.
- `remotion/` : le projet Remotion qui fabrique la vidéo.
  - `src/Promo.tsx` : les 9 scènes et leur minutage ; `src/components.tsx` et `src/theme.ts` : soleil, logo, téléphone, couleurs de l'app.
  - `public/` : captures 3D (`hero/`, `app/`), captures de La Mère Michel, dont sa fiche avec photo (`ui/`), musique.
  - `capture/` : scripts Playwright qui ont pris les captures de l'app (`sweep2.js`, `sweep5.js`, `sweep_app.js`, `lib.js`) et générateur de la musique (`music.py`).

Modifier et refaire la vidéo :
```bash
cd promo/remotion && npm install
npm run studio   # aperçu interactif
npm run render   # → out/soleil-en-terrasse-promo.mp4
```
