# Blender para el museo

Blender 5.3 está instalado en `C:\Program Files\Blender Foundation\Blender 5.3\` (con winget,
paquete `BlenderFoundation.Blender`). Para actualizarlo: `winget upgrade BlenderFoundation.Blender`.

## Flujo de un modelo nuevo

1. Consigue el modelo (Sketchfab, The Models Resource…) en `.glb`, `.gltf`, `.fbx` u `.obj`.
   Blender 5 ya no abre `.dae`: si solo hay `.dae`, conviértelo antes a `.fbx`
   (por ejemplo con Blender 4.2 LTS).
2. Prepáralo con Blender: lo reduce si es muy pesado, baja los brazos si viene en cruz y le graba la
   animación de reposo dentro del archivo.

   ```
   "C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python tools/blender/preparar_modelo.py -- ENTRADA.glb source/<id>.glb --render captura.png
   ```

   | Opción | Qué hace |
   |---|---|
   | `--max-tris N` | Triángulos máximos (150000 por defecto) |
   | `--brazos G` | Ángulo de los brazos bajo la horizontal (75 por defecto; 0 = no tocar) |
   | `--sin-idle` | No crea la animación de reposo |
   | `--render PNG` | Guarda una captura para revisarlo sin abrir Blender |

   Si el modelo ya trae animaciones (como Springtrap o el Demogorgon), las conserva.
   `<id>` es el campo `id` del asesino en `js/data.js` (por ejemplo `trapper`, `skull-merchant`).
3. Optimízalo para la web: `node tools/optimizar-modelos.mjs <id>` (WebP + meshopt, en `models/`).
4. Añádelo a `models/manifest.json`. El museo reproduce su animación propia y el cartel
   «Work In Progress» desaparece solo.

## Escultura cubierta

`tools/blender/escultura_cubierta.py` genera `models/velada.glb`: una figura genérica tapada con una
sábana (diseño propio, sin imitar a ningún asesino). El museo la pone en los pedestales que no
tienen modelo y le añade respiración.

```
"C:\Program Files\Blender Foundation\Blender 5.3\blender.exe" -b --factory-startup --python tools/blender/escultura_cubierta.py -- models/velada.glb --render captura.png
```

## Retocar a mano en la interfaz

1. **File → Import → glTF 2.0** y elige el modelo.
2. Selecciona el esqueleto → **Pose Mode** para ajustar la pose; la animación «Idle» está en el
   **Dope Sheet → Action Editor**.
3. **File → Export → glTF 2.0**: formato *glTF Binary (.glb)*, *+Y Up* activado y *Animation*
   marcado. Sin compresión: la hace `optimizar-modelos.mjs`.

## Ajustes recomendados

- **Edit → Preferences → Interface → Translation**: Español, si lo prefieres.
- **Scene Properties → Units**: Metric, escala 1 (el museo normaliza la altura a 2,05 m).
- **Render**: Workbench basta para revisar poses; Eevee para materiales.

## Límites

- Blender trabaja sobre modelos que ya existen: aquí no se modelan desde cero los asesinos
  del juego, porque son diseños protegidos por derechos de autor.
- Los modelos sin esqueleto (Chucky, Wraith) no reciben animación en Blender; el museo les
  pone la respiración por código.
- Los modelos con varios esqueletos (Knight, Singularity, The Unknown, Myers) se descolocan al
  pasar por Blender: se quedan con su versión original y la animación por código del museo.
  Revisa siempre la captura (`--render`) y la posición en el museo antes de dar uno por bueno.
