# El Museo de los Asesinos — proyecto Dead by Daylight 3D

Galería interactiva con 38 asesinos, un único **modelo base** por asesino, hecha con Three.js.
Cada figura se puede girar (arrastrar) y acercar (rueda); el modelo base se sustituye
cargando un `.glb` real.

## Estructura

    dbd-museo/
      index.html                  Página del museo
      js/data.js                  Los 38 asesinos: id, capítulo, arma, colores y aspecto
      js/app.js                   Motor 3D: sala, pedestales, figuras, carga de modelos
      js/library.js               Biblioteca: modelos en el navegador o desde una carpeta
      models/demogorgon.glb       Modelo real (Sketchfab) — ya integrado
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
     lee `models/manifest.json` y carga el Demogorgon solo.
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
xenomorph, goodguy, darklord, lich, houndmaster, ghoul, slasher).

Si el nombre del archivo no coincide con ningún asesino, se asigna al que tengas
seleccionado en ese momento.

## manifest.json (carga automática con servidor)

    {
      "killers": {
        "demogorgon": "models/demogorgon.glb",
        "trapper":    "models/trapper.glb"
      }
    }

Una URL por asesino. También se admite `{ "url": "models/trapper.glb" }` y una
lista (se usa el primer elemento), por compatibilidad.

## Editar el museo

- Añadir o cambiar asesinos: `js/data.js` (id, n, a, c, y, w, l, col).
- Estilo de la sala, luces y cámara: `js/app.js`.
- La carga de modelos vive al final de `js/app.js` (`loadModels`, `loadModelUrl`).
- La biblioteca (IndexedDB + carpetas vinculadas): `js/library.js`.

## Subirlo a GitHub (sin los modelos)

El repositorio lleva solo el código. El `.gitignore` excluye `*.glb`, `*.gltf`,
`*.bin`, `source/`, `textures/` y los `.zip`; de `models/` solo se suben
`manifest.json` y `README.txt`, que son texto.

```bash
git init -b main
git add -A
git commit -m "Museo DBD 3D"
git remote add origin https://github.com/TU-USUARIO/dbd-museo.git
git push -u origin main
```

Crea antes el repositorio vacío en GitHub (sin README ni licencia). Si te pide
contraseña, usa un token personal (Settings → Developer settings → Personal access
tokens) o GitHub Desktop.

### Publicarlo con GitHub Pages

Settings → Pages → Source: `Deploy from a branch` → `main` / `/ (root)`.
Quedará en `https://TU-USUARIO.github.io/dbd-museo/`.

Los modelos no viajan con el repositorio: quien entre verá las estatuas
procedurales y podrá añadir los suyos con **Biblioteca** (por https también
funciona "Vincular carpeta"). Si algún día quieres publicar un modelo concreto,
adjúntalo a un *Release* en vez de al código (GitHub rechaza archivos de más de
100 MB).

## Aviso legal

Los personajes y sus modelos originales pertenecen a Behaviour Interactive y a sus
respectivos licenciantes. Este proyecto no incluye ninguna malla del juego: solo la
reconstrucción volumétrica generada por código y el cargador para tus propios
archivos (el Demogorgon incluido es una descarga de Sketchfab).
