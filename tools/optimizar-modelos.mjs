import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { metalRough, prune, dedup, weld, resample, textureCompress, meshopt } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { statSync } from 'fs';
// Uso: npm i @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer draco3dgltf sharp
//      node tools/optimizar-modelos.mjs [id]   (desde la carpeta del proyecto)
const SRC='source/', OUT='models/';
const MAP={
 'chucky_dbd.glb':'goodguy','dbd_all_things_wicked_the_unknown_-_default.glb':'unknown','dbd_jason.glb':'slasher',
 'dbd_the_knight__sword.glb':'knight','dbd_the_singularity_complete.glb':'singularity','dead_by_daylight_-_demogorgon (1).glb':'demogorgon',
 'freddy_krueger.glb':'nightmare','ghostface_cod.glb':'ghostface','halloween_the_game_-_michael_myers_1978.glb':'shape',
 'ken_kaneki.glb':'ghoul','leatherface.glb':'cannibal','springtrap_dbd_aka_the_animatronic.glb':'animatronic'};
await MeshoptEncoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':await draco3d.createDecoderModule(),'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const only=process.argv[2];
for(const [f,id] of Object.entries(MAP)){
  if(only&&only!==id) continue;
  const doc=await io.read(SRC+f);
  const anims=doc.getRoot().listAnimations();
  const idle=anims.find(a=>/(^|\|)(QK_)?Idle$/i.test(a.getName()))||anims.find(a=>/idle/i.test(a.getName()));
  anims.forEach(a=>{ if(a!==idle){ a.listChannels().forEach(c=>c.dispose()); a.listSamplers().forEach(s=>s.dispose()); a.dispose(); } });
  await doc.transform(
    metalRough(), dedup(), prune(), weld(), resample(),
    textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:82}),
    meshopt({encoder:MeshoptEncoder,level:'medium'})
  );
  await io.write(OUT+id+'.glb',doc);
  console.log(id,(statSync(OUT+id+'.glb').size/1048576).toFixed(1)+'MB',idle?idle.getName():'-');
}
