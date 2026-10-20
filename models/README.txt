CARPETA DE MODELOS
==================

Coloca aqui tus archivos .glb / .gltf con este nombre:

    <id-asesino>.glb

    demogorgon.glb            The Demogorgon        <- YA INCLUIDO
    trickster.glb             The Trickster         <- YA INCLUIDO
    trapper.glb               The Trapper
    huntress.glb              The Huntress

Un unico modelo base por asesino. Si un nombre lleva sufijo de variante
(demogorgon__2.glb, huntress__ultra.glb) se ignora el sufijo: cada asesino
tiene un solo modelo.

COMO SE CARGAN
--------------
1. Biblioteca (boton en la barra superior): vincula una carpeta de tu disco
   (se lee directamente, sin copiar nada) o anade archivos, que quedan
   guardados en el navegador y se cargan solos la proxima vez.
2. Automatico: ejecuta servir.bat y abre http://localhost:8080
   El museo lee models/manifest.json y carga lo que haya apuntado ahi.
   Si reemplazas un .glb conservando el nombre, sube el numero de la url en
   manifest.json (por ejemplo trickster.glb?v=3) para que el navegador no
   siga mostrando la version antigua en cache.
3. Boton "Cargar carpeta" -> elige esta carpeta (o cualquier carpeta con tus .glb).
4. Boton "Cargar .glb"    -> elige los archivos (con Ctrl+A puedes coger el .gltf
   junto con su .bin y sus texturas: el cargador las empareja por nombre).
5. Arrastra los archivos o la carpeta sobre la escena (si la Biblioteca tiene
   activada la casilla, ademas se guardan en el navegador).

En file:// (abriendo index.html con doble clic) el navegador NO permite que la
pagina lea archivos del disco por su cuenta: usa servir.bat, o carga a mano con
los botones/arrastrando.

IDS VALIDOS
-----------
Es el campo "id" de cada asesino en js/data.js: trapper, wraith, hillbilly,
nurse, shape, hag, doctor, huntress, cannibal, nightmare, pig, clown, spirit,
legion, plague, ghostface, demogorgon, oni, deathslinger, executioner,
blight, twins, trickster, nemesis, cenobite, artist, onryo, dredge, mastermind,
knight, merchant, singularity, xenomorph, goodguy, darklord, lich, houndmaster,
ghoul, slasher.
