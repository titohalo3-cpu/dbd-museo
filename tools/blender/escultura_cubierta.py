"""Genera la «escultura cubierta»: una figura humana genérica tapada con una sábana.

Es la pieza que el museo pone en los pedestales de los asesinos que aún no tienen
modelo 3D. La tela se construye por revolución alrededor de la silueta de un maniquí
neutro (cabeza, hombros, tronco y bajo acampanado) y se le añaden pliegues que nacen
en los hombros y se abren hacia el suelo, con un dobladillo ondulado. Es procedural y
determinista: no depende de la simulación de tela (que en modo sin interfaz no colisiona).

Uso:
  blender -b --factory-startup --python tools/blender/escultura_cubierta.py -- models/velada.glb [--render captura.png]
"""
import bpy, bmesh, math, random, sys, os

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
dst = args[0] if args else 'models/velada.glb'
RENDER = args[args.index('--render') + 1] if '--render' in args else None

bpy.ops.wm.read_factory_settings(use_empty=True)
rnd = random.Random(7)

# Silueta del maniquí: (altura, radio). La profundidad es el 70 % del ancho.
PROFILE = [(1.74, 0.0), (1.72, 0.08), (1.66, 0.135), (1.58, 0.15), (1.50, 0.15),
           (1.44, 0.19), (1.38, 0.28), (1.30, 0.33), (1.15, 0.33), (0.95, 0.31),
           (0.7, 0.33), (0.45, 0.38), (0.2, 0.46), (0.0, 0.52)]
def radius(z):
    for (z0, r0), (z1, r1) in zip(PROFILE, PROFILE[1:]):
        if z1 <= z <= z0:
            t = (z0 - z) / (z0 - z1)
            t = t * t * (3 - 2 * t)
            return r0 + (r1 - r0) * t
    return PROFILE[-1][1]

SEG, RINGS = 120, 90
# Pliegues: unas cuantas ondas con fase y fuerza aleatorias, más marcadas abajo.
folds = [(rnd.choice((5, 6, 7, 9, 11, 13)), rnd.uniform(0, 6.28), rnd.uniform(0.4, 1.0)) for _ in range(5)]
bm = bmesh.new()
rows = []
for j in range(RINGS + 1):
    z = PROFILE[0][0] * (1 - j / RINGS)
    r = radius(z)
    # Los pliegues empiezan en los hombros (z≈1.32) y crecen hasta el suelo.
    k = max(0.0, min(1.0, (1.62 - z) / 1.62)) ** 0.7
    row = []
    for i in range(SEG):
        a = 2 * math.pi * i / SEG
        # Crestas marcadas: 1-|sen| da pliegues afilados como los de una tela que cuelga.
        w = sum(s * (1 - 2 * abs(math.sin(0.5 * n * a + ph + z * 0.9))) for n, ph, s in folds) / len(folds)
        rr = r * (1 + 0.32 * k * w)
        if j == RINGS:  # dobladillo ondulado
            rr += 0.03 * math.sin(4 * a + 1.3) + 0.02 * math.sin(9 * a)
        zz = z + (0.02 * k * math.sin(3 * a + 0.5) if j > RINGS - 3 else 0)
        row.append(bm.verts.new((rr * math.cos(a), 0.7 * rr * math.sin(a), max(zz, 0.0))))
    rows.append(row)
for j in range(RINGS):
    for i in range(SEG):
        a, b = rows[j][i], rows[j][(i + 1) % SEG]
        c, d = rows[j + 1][(i + 1) % SEG], rows[j + 1][i]
        if j == 0:
            bm.faces.new((a, c, d)) if a is not b else None
        else:
            bm.faces.new((a, b, c, d))
bmesh.ops.remove_doubles(bm, verts=rows[0], dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
mesh = bpy.data.meshes.new('Sabana')
bm.to_mesh(mesh)
bm.free()
sheet = bpy.data.objects.new('Sabana', mesh)
bpy.context.scene.collection.objects.link(sheet)

for name, kind, setup in (('Grosor', 'SOLIDIFY', lambda m: setattr(m, 'thickness', 0.008)),):
    m = sheet.modifiers.new(name, kind)
    setup(m)
    with bpy.context.temp_override(object=sheet, active_object=sheet, selected_objects=[sheet]):
        bpy.ops.object.modifier_apply(modifier=name)
with bpy.context.temp_override(object=sheet, active_object=sheet, selected_objects=[sheet]):
    bpy.ops.object.shade_smooth()

mat = bpy.data.materials.new('Lino')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.78, 0.75, 0.68, 1)
bsdf.inputs['Roughness'].default_value = 0.95
sheet.data.materials.append(mat)

if RENDER:
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y = 600, 800
    cam = bpy.data.objects.new('Camara', bpy.data.cameras.new('Camara'))
    sc.collection.objects.link(cam)
    cam.location = (1.4, -3.6, 1.1)
    cam.rotation_euler = (math.radians(88), 0, math.radians(21))
    sc.camera = cam
    sc.render.filepath = RENDER
    bpy.ops.render.render(write_still=True)

os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_yup=True)
print(f'[museo] escultura cubierta exportada en {dst}, {len(sheet.data.polygons)} caras')
