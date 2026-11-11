# Vidéo promo — Soleilenterrasse

`soleil-en-terrasse-promo.mp4`: 32 s, vertical 1080×1920, 30 fps, H.264 + AAC (Reels, TikTok, Shorts, Stories).

**Storyboard** (cuts land on the beat of a 120 BPM track)
| Time | Scene |
|---|---|
| 0–4 s | Hook: "Il fait beau." then "Mais quelle terrasse est au soleil ?" |
| 4–8 s | Drop: app icon + wordmark + "La terrasse au soleil, avant même d'y aller." |
| 8–14 s | Real 3D map of Bordeaux, shadows from 8h to 19h30 |
| 14–18 s | Place bubble and the La Pointe place sheet |
| 18–22 s | List, then the "Bars" filter |
| 22–26 s | City search, "Partout en France" |
| 26–32 s | End card: icon, "Trouve ta place au soleil.", App Store |

- `screenshots/`: real captures of the app (iPhone 393×852 @3x, 21 June, Bordeaux).
- `source/cap.js`: captures the screens (serve the repo on :8080 first).
- `source/music.py`: generates the music (original, synthesized with numpy, no rights to clear).
- `source/composition.html` + `source/render.js`: animation and frame-by-frame rendering.

Re-render:
```bash
cd promo/source && python3 music.py && node render.js ../screenshots frames 30
ffmpeg -framerate 30 -i frames/%05d.jpg -i music.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest ../soleil-en-terrasse-promo.mp4
```
