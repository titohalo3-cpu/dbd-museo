"""Prepara un modelo para el museo con Blender.

Importa un .glb/.gltf/.fbx/.obj, lo reduce si es muy denso, baja los brazos si
viene en cruz y le graba una animación de reposo (respiración, brazos y cabeza)
dentro del propio archivo. Exporta un .glb listo para tools/optimizar-modelos.mjs.

Uso (sin abrir la interfaz):
  blender -b --factory-startup --python tools/blender/preparar_modelo.py -- ENTRADA SALIDA [opciones]

Opciones:
  --max-tris N     triángulos máximos (por defecto 150000)
  --brazos GRADOS  ángulo de los brazos bajo la horizontal (por defecto 75; 0 = no tocar)
  --sin-idle       no crear la animación de reposo
  --render PNG     guarda una captura del primer fotograma para revisarlo

Si el modelo ya trae animación, se conserva y no se crea otra.
"""
import bpy, math, sys, os, re
from mathutils import Vector, Quaternion, Matrix

args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(args) < 2:
    sys.exit('Uso: blender -b --python preparar_modelo.py -- ENTRADA SALIDA [opciones]')
src, dst = args[0], args[1]
def opt(name, default):
    return args[args.index(name) + 1] if name in args else default
MAX_TRIS = int(opt('--max-tris', 150000))
ARM_DEG = float(opt('--brazos', 75))
NO_IDLE = '--sin-idle' in args
RENDER = opt('--render', None)

NOT_MAIN = re.compile(r'twist|corrective|roll|_out|fwd|_in_|bck|pec|scap|lip|cheek|mouth|eye|jaw|brow|nose|tendril|ACC|(^|_)ear(_|$)', re.I)
UPPER_ARM = re.compile(r'upper_?arm|arm[ _](left|right)[ _]shoulder[ _]2|(left|right)arm$|^joint_Shoulder(LT|RT)_01|^(mixamorig:)?(Left|Right)Arm$', re.I)
FOREARM = re.compile(r'fore|elbow|lowerarm', re.I)

# --- Importar -----------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
ext = os.path.splitext(src)[1].lower()
if ext in ('.glb', '.gltf'):
    bpy.ops.import_scene.gltf(filepath=src)
elif ext == '.fbx':
    bpy.ops.import_scene.fbx(filepath=src, automatic_bone_orientation=True)
elif ext == '.obj':
    bpy.ops.wm.obj_import(filepath=src)
else:
    sys.exit(f'Formato no soportado: {ext} (Blender 5 ya no importa .dae; conviértelo antes a .fbx o .glb)')

meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
armatures = [o for o in bpy.context.scene.objects if o.type == 'ARMATURE']
print(f'[museo] {len(meshes)} mallas, esqueletos: {len(armatures)}')

# --- Reducir si es muy denso ---------------------------------------------------
tris = sum(sum(len(p.vertices) - 2 for p in m.data.polygons) for m in meshes)
if tris > MAX_TRIS:
    ratio = MAX_TRIS / tris
    for m in meshes:
        with bpy.context.temp_override(object=m, active_object=m):
            mod = m.modifiers.new('Reducir', 'DECIMATE')
            mod.ratio = ratio
            # La reducción va antes del esqueleto para que siga deformando bien.
            bpy.ops.object.modifier_move_to_index(modifier='Reducir', index=0)
            bpy.ops.object.modifier_apply(modifier='Reducir')
    print(f'[museo] reducido de {tris} a ~{MAX_TRIS} triángulos')

# --- Animación de reposo -------------------------------------------------------
def pick(bones, rx):
    return [b for b in bones if rx.search(b.name) and not NOT_MAIN.search(b.name)]

def lower_arms(arm_obj, deg):
    """Gira cada brazo, en el espacio del mundo, hasta `deg` grados bajo la horizontal."""
    done = []
    for pb in pick(arm_obj.pose.bones, UPPER_ARM):
        # El antebrazo puede colgar de huesos de torsión: se busca en toda la rama.
        child = next((c for c in pb.children_recursive if FOREARM.search(c.name) and not NOT_MAIN.search(c.name)), None)
        if not child:
            continue
        mw = arm_obj.matrix_world
        d = ((mw @ child.head) - (mw @ pb.head)).normalized()
        done.append(pb)
        if d.z < -math.sin(math.radians(deg - 10)):
            continue
        out = Vector((d.x, d.y, 0)).normalized()
        target = (out * math.cos(math.radians(deg)) + Vector((0, 0, -math.sin(math.radians(deg))))).normalized()
        m3 = mw.to_3x3().normalized()
        qa = (m3.inverted() @ d.rotation_difference(target).to_matrix() @ m3).to_4x4()
        head = pb.head.copy()
        pb.matrix = Matrix.Translation(head) @ qa @ Matrix.Translation(-head) @ pb.matrix
        bpy.context.view_layer.update()
    return done

def make_idle(arm_obj):
    pbs = arm_obj.pose.bones
    for pb in pbs:
        pb.rotation_mode = 'QUATERNION'
    arms = lower_arms(arm_obj, ARM_DEG) if ARM_DEG > 0 else pick(pbs, UPPER_ARM)
    elbows = [next((c for c in a.children_recursive if FOREARM.search(c.name) and not NOT_MAIN.search(c.name)), None) for a in arms]
    elbows = [e for e in elbows if e]
    spine = sorted(pick(pbs, re.compile(r'spine|chest|torso', re.I)), key=lambda b: -b.head.z)[:2]
    clav = pick(pbs, re.compile(r'clavicle|shoulder[ _]1', re.I))
    heads = sorted(pick(pbs, re.compile(r'head', re.I)), key=lambda b: len(b.name))[:1]
    base = {pb.name: pb.rotation_quaternion.copy() for pb in pbs}
    L = 144  # 4,8 s a 30 fps: un ciclo de respiración que encadena sin salto
    arm_obj.animation_data_create().action = bpy.data.actions.new('Idle_' + arm_obj.name)
    bpy.context.scene.render.fps = 30
    for f in range(0, L + 1, 4):
        t = 2 * math.pi * f / L
        br = math.sin(t)
        def put(pb, axis, ang):
            pb.rotation_quaternion = base[pb.name] @ Quaternion(axis, ang)
            pb.keyframe_insert('rotation_quaternion', frame=f + 1)
        for pb in spine: put(pb, (1, 0, 0), 0.03 * br)
        for pb in clav: put(pb, (1, 0, 0), 0.03 * (br + 1) / 2)
        for pb in heads: put(pb, (0, 1, 0), 0.14 * math.sin(t))
        for i, pb in enumerate(arms): put(pb, (1, 0, 0), (0.06 if i % 2 else -0.06) * math.sin(t) + 0.015 * br)
        for pb in elbows: put(pb, (1, 0, 0), 0.05 * br)
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = 1, L + 1
    print(f'[museo] idle en {arm_obj.name}: brazos {len(arms)}, columna {len(spine)}, clavículas {len(clav)}, cabeza {len(heads)}')

if armatures and not NO_IDLE:
    if bpy.data.actions:
        print(f'[museo] el modelo ya trae {len(bpy.data.actions)} animación(es): se conservan')
    else:
        # Algunos modelos traen varios esqueletos (cuerpo, cabeza…): se animan todos
        # y al exportar se funden en una sola animación.
        for a in armatures:
            make_idle(a)
elif not armatures:
    print('[museo] sin esqueleto: el museo le pondrá la respiración por código')

# --- Captura opcional -----------------------------------------------------------
if RENDER:
    sc = bpy.context.scene
    sc.frame_set(1)
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y = 600, 800
    pts = [o.matrix_world @ Vector(c) for o in sc.objects if o.type == 'MESH' for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    c, size = (lo + hi) / 2, max((hi - lo).length, 0.01)
    cam = bpy.data.objects.new('Camara', bpy.data.cameras.new('Camara'))
    sc.collection.objects.link(cam)
    cam.location = c + Vector((0, -size * 1.6, 0))
    cam.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = cam
    sc.render.filepath = RENDER
    bpy.ops.render.render(write_still=True)
    print(f'[museo] captura en {RENDER}')

# --- Exportar ---------------------------------------------------------------
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', export_animations=True, export_yup=True,
                          export_animation_mode='ACTIVE_ACTIONS')
print(f'[museo] exportado {dst}')
