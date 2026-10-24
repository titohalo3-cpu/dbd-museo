# Modelos pendientes

Búsqueda del 2026-10-22 en Sketchfab (solo modelos **descargables**, revisados uno a uno).
Sketchfab exige iniciar sesión para descargar: entra en cada enlace → **Download 3D Model** →
**glTF Binary (.glb)** y guarda el archivo en `source/` con el nombre que propone Sketchfab.
Después: `node tools/optimizar-modelos.mjs` (o `... <id>` para uno solo) y se añade al manifest.

## Recomendados (12)

| Asesino | Modelo | Licencia | Notas |
|---|---|---|---|
| The Legion | [Legion - Dead By Daylight](https://sketchfab.com/3d-models/ca47609024d84802adade36fd2132be0) | CC BY | Rig propio, 38k caras |
| The Executioner | [Pyramid Head Dead By Daylight](https://sketchfab.com/3d-models/74e7e7806c50467d872aa60637986e46) | CC BY | 15k caras |
| The Skull Merchant | [Skull Merchant](https://sketchfab.com/3d-models/e8c646c35e8d405a9b4a05d840423e1c) | CC BY | 58k caras, pose en T |
| The Dredge | [Dead by Daylight - The Dredge](https://sketchfab.com/3d-models/c45ec674115a4c9ba3ed75c2ee23d430) | CC BY-NC | 124 MB, 86 animaciones (se queda el idle) |
| The Cenobite | [Pinhead model from dead by daylight](https://sketchfab.com/3d-models/75d23d62b70f4d89bbd02ebc01684551) | CC BY | 250k caras, se simplifica |
| The Mastermind | [Albert Wesker](https://sketchfab.com/3d-models/effd0662f9444ad7b6997a6dc33cb4b6) | CC BY | Extraído de DBD |
| The First (nuevo) | [Dead by Daylight - The First](https://sketchfab.com/3d-models/f7bf83b516dc40808d1ac29b6c49b033) | CC BY | 128 MB, 66 animaciones |
| The Onryō | [Samara (The Ring)](https://sketchfab.com/3d-models/57ab1a21d63744dfab12c54c7d139ddb) | CC BY | Fan art de la película, no de DBD |
| The Xenomorph | [Realistic Xenomorph Rig](https://sketchfab.com/3d-models/9b84acf1f7bf4ada867408a8d05c60d0) | CC BY | Fan art, con 8 animaciones |
| The Nemesis | [nemesis RE3 Remake](https://sketchfab.com/3d-models/297c78d1eb364a969667fe075d50d8e8) | CC BY | De Resident Evil 3 Remake |
| The Lich | [Lich - Dungeons and Dragons](https://sketchfab.com/3d-models/2062df03ba49431b8b18727a8f5a4143) | CC BY | Liche genérico de D&D, no Vecna exacto; 874k caras, se simplifica |
| The Wraith | [Wraith - Dead By Daylight](https://sketchfab.com/3d-models/44c044fb7b1445f19304984167041890) | CC BY | **Generado con IA** (Meshy); 648k caras, se simplifica |

## Sin modelo descargable (16)

Trapper, Hillbilly, Nurse, Hag, Doctor, Huntress, Pig, Clown, Spirit, Oni, Plague, Deathslinger,
Blight, Twins, Artist, Houndmaster y Dark Lord. En Sketchfab solo hay máscaras, armas, amuletos
o modelos generados con IA de baja calidad. Siguen como estatua procedural.

Otra fuente: **The Models Resource**
(<https://models.spriters-resource.com/pc_computer/deadbydaylight/>) tiene modelos extraídos
del juego sin registro, pero tiene verificación anti-bots (hay que abrirla a mano) y suelen
venir en `.dae`/`.fbx`, que hay que pasar a `.glb` (por ejemplo con Blender) antes de optimizar.

## Descartados

- "dbd 1" (etiquetado *nurse*): figura sentada sin texturas, no es la Enfermera.
- "Albert Wesker suit (DBD)": solo la ropa, sin cabeza.
- "Huntress - Dead By Daylight" y "Nemesis (2nd Form)": generados con IA, de baja calidad.
- "Huntress" (varumora): solo la máscara.

Todos son personajes de Behaviour Interactive y sus licenciantes; los de licencia CC BY piden
citar al autor y el CC BY-NC impide el uso comercial.
