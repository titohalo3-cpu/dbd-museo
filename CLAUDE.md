# dbd-museo

Museo 3D de Dead by Daylight por el que se camina: pasillo con 41 asesinos sobre pedestales, 13 con modelo real del juego.

## Datos

- Stack: HTML, CSS y JS sin build; Three.js 0.160 por CDN (importmap).
- Servidor local: `preview_start` → `dbd-museo` (puerto 5503, en `Proyectos/.claude/launch.json`), o `servir.bat` (8080).
- Publicación: GitHub Pages — URL: pendiente.

## Estructura

- `index.html` — página, estilos y HUD.
- `js/app.js` — sala, visitante (caminar/mirar/contemplar), focos y carga de modelos.
- `js/data.js` — los 41 asesinos (`id` es la clave del manifest).
- `js/library.js` — biblioteca de modelos (IndexedDB / carpeta vinculada).
- `models/manifest.json` — id → `.glb`; admite `{url, rot, h, hide}`.
- `source/` — originales de Sketchfab, sin tocar. `tools/optimizar-modelos.mjs` los pasa a `models/`.

## Interacción principal

Lo que `probador-web` debe poder hacer para dar el proyecto por bueno:
- Entrar, arrastrar para mirar y hacer clic en el suelo para caminar.
- Clic en una figura → camina hasta ella, muestra el panel y arrastrar la gira.
- «Volver a pasear», «Anterior/Siguiente» e Índice funcionan; sin errores en consola; a 375 px sin scroll horizontal.

## Reglas del proyecto

- Rutas relativas siempre (GitHub Pages sirve bajo `/<repo>/`).
- Modelos nuevos: optimizar con `tools/optimizar-modelos.mjs` (WebP 1024 + meshopt, solo el clip idle) antes de añadirlos al manifest.
- Móvil primero: sin scroll horizontal a 375 px.

## Estado

- Hecho: sala caminable, 13 modelos reales optimizados (~39 MB), resto con estatua procedural.
- Siguiente: decidir si los `.glb` se suben al repo (ahora `.gitignore` los excluye) y añadir más modelos.
