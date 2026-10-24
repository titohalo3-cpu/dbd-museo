# El Museo de los Asesinos — proyecto Dead by Daylight 3D

Galería 3D por la que se camina, hecha con Three.js: un pasillo con 41 asesinos sobre
pedestales, cada uno con su foco y su placa. Los 13 que tienen modelo del juego
aparecen con su figura real; el resto, como estatua generada por código.

## Cómo moverse

- **Mirar**: arrastra (o desliza en el móvil).
- **Caminar**: clic/toque en el suelo, **WASD** o flechas (Mayús para correr), o la rueda.
- **Ver de cerca**: clic en una figura. Arrastra para girarla, rueda para acercarte,
  **Esc** o «Volver a pasear» para salir. «Anterior / Siguiente» recorre la sala.
- **Índice**: lista de asesinos; al elegir uno, caminas hasta él.

## Estructura

    dbd-museo/
      index.html                  Página del museo
      js/data.js                  Los 41 asesinos: id, capítulo, arma, colores y aspecto
      js/app.js                   Motor 3D: sala, pedestales, figuras, carga de modelos
      js/library.js               Biblioteca: modelos en el navegador o desde una carpeta
      models/<id>.glb             13 modelos optimizados (WebP + meshopt, ~39 MB en total)
      tools/optimizar-modelos.mjs Regenera models/ a partir de los originales de source/
      models/manifest.json        Carga automática de modelos (con servidor local)
      models/README.txt           Convención de nombres e ids válidos
      source/                     Descarga original de Sketchfab (sin tocar)
      textures/                   Texturas extraídas del .glb (el .glb ya las lleva dentro)
      servir.bat                  Servidor local (requiere Python)
      demogorgon-with-dbd-animations.zip   ZIP original de la descarga

## Cómo abrirlo

1. Doble clic en `index.html`. Funciona sin instalar nada: verás las estatuas
   volumétricas generadas por código.
2. Para los modelos reales:
   - **Biblioteca** (recomendado): botón en la barra superior. Puedes **vincular una
     carpeta** de tu disco (el museo la lee directamente, sin copiar nada) o
     **añadir archivos**, que quedan guardados en el navegador (IndexedDB) y se
     cargan solos la próxima vez. No ocupan espacio en el proyecto.
   - **Automático**: ejecuta `servir.bat` y abre <http://localhost:8080>. El museo
     lee `models/manifest.json` y carga los modelos incluidos (Demogorgon y Trickster).
     El hueco de The Animatronic ya existe y se dibuja con la figura procedural;
     para usar un modelo real, coloca `models/animatronic.glb` y añade
     `"animatronic": "models/animatronic.glb"` al manifest.
   - **A mano**: botón **Cargar .glb** (puedes seleccionar el `.glb` o el conjunto
     `.gltf` + `.bin` + texturas con `Ctrl+A`), botón **Cargar carpeta**, o
     arrastrando archivos/carpetas sobre la escena.

### Por qué no cargan solos al hacer doble clic
Los navegadores bloquean el acceso a archivos locales desde `file://` (CORS). Con
doble clic puedes usar los botones o arrastrar; el servidor local solo hace falta
para la carga automática y para la Biblioteca (IndexedDB y File System Access).

## Modelos

- Un solo modelo por asesino: el **modelo base**. Si arrastras dos archivos del mismo
  asesino, se queda el primero.
- Se cargan **con sus animaciones**: si el `.glb` trae clips, se reproduce el
  clip de *idle* en bucle (`Demo|QK_Idle` en el caso del Demogorgon, 92 clips).
- Al cargar uno, la cámara vuela automáticamente al asesino que lo recibe.
- Se **centran y escalan** a 2,05 m de alto y se apoyan sobre el pedestal.
- Los formatos **Draco / Meshopt / KTX2** están soportados.
- Modelos con esqueleto (SkinnedMesh) se clonan con `SkeletonUtils`, no con
  `clone(true)`, para que el esqueleto y las animaciones no se rompan.

### Convención de nombres

    models/<id-asesino>.glb

Ejemplos:

    demogorgon.glb             -> The Demogorgon
    huntress.glb               -> The Huntress
    slasher.glb                -> se empareja por nombre/alias (Jason)

Si el nombre lleva un sufijo de variante (`demogorgon__2.glb`, `huntress__ultra.glb`),
se ignora: cada asesino tiene un único modelo base. Los **ids válidos** son los del
campo `id` de `js/data.js` (trapper, wraith, hillbilly, nurse, shape, hag, doctor,
huntress, cannibal, nightmare, pig, clown, spirit, legion, plague, ghostface,
**demogorgon**, oni, deathslinger, executioner, blight, twins, trickster, nemesis,
cenobite, artist, onryo, dredge, mastermind, knight, merchant, singularity,
xenomorph, goodguy, darklord, lich, houndmaster, ghoul, animatronic, slasher).

Si el nombre del archivo no coincide con ningún asesino, se asigna al que tengas
seleccionado en ese momento.

## manifest.json (carga automática con servidor)

    {
      "killers": {
        "demogorgon": "models/demogorgon.glb",
        "nightmare":  "models/nightmare.glb?v=3",
        "trapper":    "models/trapper.glb"
      }
    }

Una URL por asesino. También se admite `{ "url": "models/trapper.glb" }` y una
lista (se usa el primer elemento), por compatibilidad. Si reemplazas un `.glb`
manteniendo el nombre, sube el `?v=` de su URL para saltar la caché del navegador.

## Editar el museo

- Añadir o cambiar asesinos: `js/data.js` (id, n, a, c, y, w, l, col).
- Estilo de la sala, luces y cámara: `js/app.js`.
- La carga de modelos vive al final de `js/app.js` (`loadModels`, `loadModelUrl`).
- La biblioteca (IndexedDB + carpetas vinculadas): `js/library.js`.
- Regenerar el modelo del Trickster: `node tools/save-server.js`, abre
  <http://localhost:8099/> y la página exporta `models/trickster.glb`.

## Subirlo a GitHub (con los modelos optimizados)

El repositorio lleva el código y los 13 `.glb` optimizados de `models/` (~39 MB;
el mayor pesa ~7 MB, muy por debajo del límite de 100 MB de GitHub). El
`.gitignore` sigue excluyendo `source/` (originales, ~600 MB), `textures/`, los
`.gltf`/`.bin` y los `.zip`.

```bash
git add -A
git commit -m "Museo caminable con 13 modelos optimizados"
git remote add origin https://github.com/titohalo3-cpu/dbd-museo.git
git push -u origin main
```

Crea antes el repositorio vacío en GitHub (sin README ni licencia). Git Credential
Manager se encarga del inicio de sesión.

### Publicarlo con GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`.
Quedará en `https://titohalo3-cpu.github.io/dbd-museo/`. Todas las rutas son
relativas, así que funciona bajo `/dbd-museo/` sin cambios: el museo lee
`models/manifest.json` y carga los modelos solos.

Si cambias un `.glb` conservando el nombre, sube el `?v=` de su URL en el manifest
para que los navegadores no sigan usando la versión en caché.

## Aviso legal

Los personajes y sus modelos originales pertenecen a Behaviour Interactive y a sus
respectivos licenciantes. Los `.glb` de `models/` son versiones optimizadas de
descargas de Sketchfab: antes de publicarlos, revisa la licencia de cada descarga.
Proyecto de fans sin ánimo de lucro.
