import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough, prune, dedup, weld, resample, simplify, textureCompress, meshopt } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync, existsSync, readdirSync } from 'fs';
// Uso: npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer draco3dgltf sharp
//      node tools/optimizar-modelos.mjs [id]   (desde la carpeta del proyecto)
// Lee source/<nombre de Sketchfab>.glb (tabla MAP) o source/<id>.glb y escribe models/<id>.glb.
const SRC='source/', OUT='models/';
const MAP={
 'chucky_dbd.glb':'goodguy','dbd_all_things_wicked_the_unknown_-_default.glb':'unknown','dbd_jason.glb':'slasher',
 'dbd_the_knight__sword.glb':'knight','dbd_the_singularity_complete.glb':'singularity','dead_by_daylight_-_demogorgon (1).glb':'demogorgon',
 'freddy_krueger.glb':'nightmare','ghostface_cod.glb':'ghostface','halloween_the_game_-_michael_myers_1978.glb':'shape',
 'ken_kaneki.glb':'ghoul','leatherface.glb':'cannibal','springtrap_dbd_aka_the_animatronic.glb':'animatronic',
 // Segunda tanda: nombre con el que Sketchfab descarga cada .glb
 'legion_-_dead_by_daylight.glb':'legion','pyramid_head_dead_by_daylight.glb':'executioner','skull_merchant.glb':'skull-merchant',
 'dead_by_daylight_-_the_dredge.glb':'dredge','pinhead_model_from_dead_by_daylight_or_dbd.glb':'cenobite','samara_the_ring.glb':'onryo',
 'realistic_xenomorph_rig.glb':'xenomorph','nemesis_re3_remake.glb':'nemesis','albert_wesker.glb':'mastermind',
 'lich_-_dungeons_and_dragons.glb':'lich','dead_by_daylight_-_the_first.glb':'first','wraith_-_dead_by_daylight.glb':'wraith'};
/* También vale source/<id>.glb, con los ids de js/data.js. */
for(const f of readdirSync(SRC)) if(/^[a-z-]+\.glb$/.test(f)&&!MAP[f]) MAP[f]=f.slice(0,-4);
const MAX_TRIS=150000;
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const only=process.argv[2];
for(const [f,id] of Object.entries(MAP)){
  if(only&&only!==id) continue;
  if(!existsSync(SRC+f)) continue;
  const doc=await io.read(SRC+f);
  let tris=0;
  doc.getRoot().listMeshes().forEach(m=>m.listPrimitives().forEach(p=>{ const i=p.getIndices(),a=p.getAttribute('POSITION'); tris+=(i?i.getCount():(a?a.getCount():0))/3; }));
  const anims=doc.getRoot().listAnimations();
  const idle=anims.find(a=>/(^|\|)(QK_)?Idle$/i.test(a.getName()))||anims.find(a=>/idle/i.test(a.getName()));
  anims.forEach(a=>{ if(a!==idle){ a.listChannels().forEach(c=>c.dispose()); a.listSamplers().forEach(s=>s.dispose()); a.dispose(); } });
  await doc.transform(
    metalRough(), dedup(), prune(), weld(), resample(),
    /* Modelos muy densos (escaneos, IA): se reducen a unos 150k triángulos. */
    ...(tris>MAX_TRIS?[simplify({simplifier:MeshoptSimplifier,ratio:MAX_TRIS/tris,error:0.002})]:[]),
    textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:82}),
    meshopt({encoder:MeshoptEncoder,level:'medium'})
  );
  await io.write(OUT+id+'.glb',doc);
  console.log(id,(statSync(OUT+id+'.glb').size/1048576).toFixed(1)+'MB',Math.round(tris)+' tri',idle?idle.getName():'-');
}
