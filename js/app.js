window.addEventListener('error',function(e){window.__ERR__=String(e.message||(e.error&&e.error.message)||e);});

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { initLibrary } from './library.js';

const KILLERS = window.DBD_KILLERS;

function std(color,rough,metal){
  return new THREE.MeshStandardMaterial({color:color,roughness:rough===undefined?0.85:rough,metalness:metal||0,envMapIntensity:0.55});
}
function adj(hex,mul,sat){
  const c=new THREE.Color(hex);
  const hsl={h:0,s:0,l:0};
  c.getHSL(hsl);
  c.setHSL(hsl.h,Math.min(1,hsl.s*sat),Math.min(0.95,hsl.l*mul));
  return '#'+c.getHexString();
}
function paletteFor(k,vi){
  const cl=k.col[0],ac=k.col[1],me=k.col[2];
  if(vi===1) return {cloth:adj(cl,0.35,0.6),accent:adj(ac,1.05,1.15),metal:'#d8b45a',skin:k.sk||'#b8ab9c',glow:'#e8c46a'};
  if(vi===2) return {cloth:adj(cl,1.55,0.85),accent:adj(ac,1.45,1.7),metal:'#eef0f4',skin:k.sk||'#e6d9c9',glow:ac};
  return {cloth:cl,accent:ac,metal:me,skin:k.sk||'#c6b09c',glow:ac};
}

function buildWeapon(type,M){
  const g=new THREE.Group();
  const add=function(geo,mat,x,y,z,rx,ry,rz){
    const m=new THREE.Mesh(geo,mat);
    m.position.set(x||0,y||0,z||0);
    m.rotation.set(rx||0,ry||0,rz||0);
    g.add(m);
    return m;
  };
  switch(type){
    case 'axe':
      add(new THREE.CylinderGeometry(0.02,0.026,0.95,8),M.dark,0,0.38,0);
      add(new THREE.BoxGeometry(0.3,0.19,0.05),M.metal,0.12,0.8,0);
      add(new THREE.BoxGeometry(0.05,0.21,0.055),M.accent,0.27,0.8,0);
      break;
    case 'hatchet':
      add(new THREE.CylinderGeometry(0.018,0.022,0.55,8),M.dark,0,0.2,0);
      add(new THREE.BoxGeometry(0.2,0.14,0.045),M.metal,0.08,0.42,0);
      break;
    case 'machete':
      add(new THREE.CylinderGeometry(0.02,0.024,0.2,8),M.dark,0,0.06,0);
      add(new THREE.BoxGeometry(0.07,0.64,0.02),M.metal,0,0.44,0);
      break;
    case 'knife':
      add(new THREE.CylinderGeometry(0.017,0.02,0.16,8),M.dark,0,0.03,0);
      add(new THREE.BoxGeometry(0.045,0.32,0.014),M.metal,0,0.25,0);
      break;
    case 'knives':
      for(let i=0;i<3;i++){add(new THREE.BoxGeometry(0.035,0.28,0.012),M.metal,(i-1)*0.05,0.3,0,0,0,(i-1)*0.12);}
      break;
    case 'sword':
      add(new THREE.CylinderGeometry(0.022,0.026,0.2,8),M.dark,0,0.02,0);
      add(new THREE.BoxGeometry(0.17,0.035,0.035),M.metal,0,0.13,0);
      add(new THREE.BoxGeometry(0.05,0.98,0.018),M.metal,0,0.62,0);
      break;
    case 'greatknife':
      add(new THREE.CylinderGeometry(0.026,0.03,0.22,8),M.dark,0,0.02,0);
      add(new THREE.BoxGeometry(0.24,1.2,0.03),M.metal,0,0.72,0);
      add(new THREE.BoxGeometry(0.27,0.05,0.05),M.accent,0,0.14,0);
      break;
    case 'katana':
      add(new THREE.CylinderGeometry(0.018,0.02,0.26,8),M.dark,0,0.02,0);
      add(new THREE.TorusGeometry(0.062,0.012,6,12,Math.PI),M.metal,0,0.15,0);
      add(new THREE.BoxGeometry(0.032,1.0,0.012),M.metal,0,0.66,0);
      break;
    case 'staff':
      add(new THREE.CylinderGeometry(0.022,0.026,1.75,8),M.dark,0,0.72,0);
      add(new THREE.TorusGeometry(0.09,0.018,8,16),M.metal,0,1.6,0);
      add(new THREE.SphereGeometry(0.05,10,8),M.glow,0,1.6,0);
      break;
    case 'spear':
      add(new THREE.CylinderGeometry(0.02,0.024,2.0,8),M.dark,0,0.85,0);
      add(new THREE.ConeGeometry(0.05,0.25,8),M.metal,0,1.95,0);
      break;
    case 'cane':
      add(new THREE.CylinderGeometry(0.02,0.024,1.1,8),M.dark,0,0.45,0);
      add(new THREE.TorusGeometry(0.07,0.018,8,14,Math.PI),M.metal,0,1.0,0,Math.PI/2,0,0);
      break;
    case 'saw':
      add(new THREE.CylinderGeometry(0.02,0.024,0.18,8),M.dark,0,0.02,0);
      add(new THREE.BoxGeometry(0.05,0.55,0.02),M.metal,0,0.42,0);
      for(let i=0;i<6;i++){add(new THREE.BoxGeometry(0.03,0.03,0.02),M.metal,0.045,0.2+i*0.09,0);}
      break;
    case 'chainsaw':
      add(new THREE.BoxGeometry(0.26,0.34,0.16),M.accent,0,0.22,0);
      add(new THREE.BoxGeometry(0.08,0.85,0.06),M.metal,0,0.78,0);
      for(let i=0;i<8;i++){add(new THREE.BoxGeometry(0.1,0.03,0.07),M.dark,0.06,0.4+i*0.1,0);}
      break;
    case 'whip':
      for(let i=0;i<8;i++){add(new THREE.CylinderGeometry(0.014,0.012,0.16,6),M.dark,Math.sin(i*0.9)*0.16,0.1-i*0.13,Math.cos(i*0.9)*0.14,0,0,i*0.12);}
      break;
    case 'chain':
      for(let i=0;i<7;i++){add(new THREE.TorusGeometry(0.045,0.012,6,10),M.metal,Math.sin(i*0.6)*0.1,0.05-i*0.11,Math.cos(i*0.6)*0.1,i*0.4,0,0);}
      break;
    case 'fist':
      add(new THREE.SphereGeometry(0.13,10,8),M.skin,0,-0.02,0);
      break;
    case 'claws':
      for(let i=0;i<4;i++){add(new THREE.ConeGeometry(0.018,0.34,6),M.metal,(i-1.5)*0.045,-0.06,0,Math.PI,0,0);}
      break;
    default: break;
  }
  return g;
}

function buildHead(type,M,p){
  const g=new THREE.Group();
  const eyeMat=new THREE.MeshBasicMaterial({color:'#070708'});
  const glowMat=new THREE.MeshBasicMaterial({color:'#ffd27a'});
  const skull=new THREE.Mesh(new THREE.SphereGeometry(0.155,20,16),M.skin);
  skull.scale.set(1,1.08,0.98);
  g.add(skull);
  const add=function(geo,mat,x,y,z,rx,ry,rz){
    const m=new THREE.Mesh(geo,mat);
    m.position.set(x||0,y||0,z||0);
    m.rotation.set(rx||0,ry||0,rz||0);
    g.add(m);
    return m;
  };
  const eyes=function(y,z,m){
    add(new THREE.SphereGeometry(0.022,8,8),m||eyeMat,-0.058,y||0.02,z||0.142);
    add(new THREE.SphereGeometry(0.022,8,8),m||eyeMat,0.058,y||0.02,z||0.142);
  };
  const mask=function(color,w,h){
    const m=add(new THREE.SphereGeometry(0.16,18,14),std(color,0.5,0.03),0,0,0.055);
    m.scale.set(w||1.04,h||1.06,0.82);
    return m;
  };
  const horns=function(hgt,mat,x,rz){add(new THREE.ConeGeometry(0.035,hgt,8),mat||M.dark,x,0.16,0,0.1,0,rz);};
  switch(type){
    case 'burlap':
      mask('#8c7248'); eyes(0.02,0.19); add(new THREE.BoxGeometry(0.09,0.012,0.02),M.dark,0,-0.08,0.175); break;
    case 'hockey':
      mask('#e8e6e0'); eyes(0.02,0.19);
      add(new THREE.BoxGeometry(0.03,0.012,0.02),M.accent,-0.1,-0.05,0.17);
      add(new THREE.BoxGeometry(0.03,0.012,0.02),M.accent,0.1,-0.05,0.17); break;
    case 'whitemask':
      mask('#ece9de'); eyes(0.02,0.19);
      add(new THREE.SphereGeometry(0.163,18,14),M.dark,0,0.05,-0.02).scale.set(1,0.65,1); break;
    case 'ghostface':
      add(new THREE.ConeGeometry(0.24,0.5,18),M.dark,0,0.06,-0.05);
      mask('#f1efe9',0.92,1.18); eyes(0.025,0.19);
      add(new THREE.BoxGeometry(0.13,0.02,0.02),M.dark,0,-0.09,0.17); break;
    case 'pig':
      mask('#d7a49f',0.98,1); eyes(0.03,0.19);
      add(new THREE.CylinderGeometry(0.045,0.055,0.09,12),std('#c98f8a',0.6,0),0,-0.035,0.19,Math.PI/2,0,0); break;
    case 'leatherface':
      mask('#c9a070',1,1.1); eyes(0.02,0.19); add(new THREE.BoxGeometry(0.11,0.014,0.02),M.dark,0,-0.085,0.175);
      add(new THREE.SphereGeometry(0.16,16,12),M.dark,0,0.06,-0.03).scale.set(1.02,0.6,1); break;
    case 'skullmask':
      mask('#d8d2c0',1,1.08); eyes(0.03,0.19,new THREE.MeshBasicMaterial({color:'#111114'}));
      for(let i=0;i<4;i++){add(new THREE.BoxGeometry(0.02,0.02,0.015),M.dark,-0.05+i*0.033,-0.08,0.185);} break;
    case 'doll':
      add(new THREE.SphereGeometry(0.163,18,14),std('#3a2a24',0.9,0),0,0.045,-0.01).scale.set(1.02,0.8,1.02);
      eyes(0.03,0.15,new THREE.MeshBasicMaterial({color:'#f2ede2'}));
      add(new THREE.SphereGeometry(0.04,10,8),std('#c98a86',0.9,0),-0.095,-0.045,0.13).scale.set(1,0.7,0.4);
      add(new THREE.SphereGeometry(0.04,10,8),std('#c98a86',0.9,0),0.095,-0.045,0.13).scale.set(1,0.7,0.4);
      add(new THREE.BoxGeometry(0.1,0.01,0.02),M.dark,0,-0.085,0.15); break;
    case 'wrap':
      for(let i=0;i<3;i++){add(new THREE.TorusGeometry(0.158,0.022,8,20),std('#e9e5db',0.7,0),0,-0.09+i*0.09,0,Math.PI/2,0,0);}
      eyes(0.02,0.15); break;
    case 'hood':
      add(new THREE.ConeGeometry(0.235,0.55,18),M.cloth,0,0.06,-0.01); eyes(0.02,0.135); break;
    case 'hair':
      add(new THREE.SphereGeometry(0.163,18,14),M.dark,0,0.03,-0.015).scale.set(1.02,1.02,1.02);
      add(new THREE.BoxGeometry(0.3,0.8,0.12),M.dark,0,-0.42,-0.11);
      eyes(0.02,0.148); break;
    case 'veil':
      add(new THREE.ConeGeometry(0.3,0.75,20,1,true),M.cloth,0,0.1,0); eyes(0.02,0.145); break;
    case 'helmet':
      add(new THREE.SphereGeometry(0.172,18,14),M.metal,0,0.01,0);
      add(new THREE.BoxGeometry(0.24,0.045,0.04),M.dark,0,0.015,0.15);
      add(new THREE.BoxGeometry(0.03,0.1,0.3),M.accent,0,0.16,0); break;
    case 'robot':
      add(new THREE.BoxGeometry(0.27,0.24,0.25),M.metal,0,0.02,0);
      add(new THREE.BoxGeometry(0.15,0.03,0.03),glowMat,0,0.04,0.135); break;
    case 'pyramid':
      add(new THREE.ConeGeometry(0.34,0.82,4),std('#6e6a62',0.55,0.25),0,0.16,0,0,Math.PI/4,0); break;
    case 'alien':
      add(new THREE.SphereGeometry(0.155,18,14),M.dark,0,0.06,0.02).scale.set(0.82,0.85,2.3);
      add(new THREE.BoxGeometry(0.13,0.05,0.2),M.accent,0,-0.05,0.2);
      for(let i=0;i<5;i++){add(new THREE.ConeGeometry(0.012,0.05,5),std('#e8e4dc',0.4,0),-0.05+i*0.025,-0.075,0.26,Math.PI,0,0);} break;
    case 'flower':
      add(new THREE.SphereGeometry(0.14,16,12),M.dark,0,0.02,0);
      for(let i=0;i<9;i++){
        const a=(i/9)*Math.PI*2;
        const petal=add(new THREE.ConeGeometry(0.055,0.42,6),std('#8a4436',0.6,0),Math.sin(a)*0.2,0.06,Math.cos(a)*0.2);
        petal.rotation.set(Math.cos(a)*0.5,0,-Math.sin(a)*0.5);
      } break;
    case 'oni':
      mask('#8a2a22',1,1.05); eyes(0.03,0.19,glowMat);
      horns(0.26,M.metal,-0.11,-0.55); horns(0.26,M.metal,0.11,0.55);
      add(new THREE.BoxGeometry(0.04,0.14,0.02),std('#e8e4dc',0.5,0),0,-0.075,0.17); break;
    case 'mass':
      for(let i=0;i<12;i++){
        const a=i*0.52,r=0.16+((i%3)*0.03);
        const sp=add(new THREE.ConeGeometry(0.045,0.34+i*0.014,5),M.cloth,Math.sin(a)*r,0.06+Math.sin(i*1.7)*0.13,Math.cos(a)*r);
        sp.rotation.set(Math.cos(a)*0.9,0,-Math.sin(a)*0.9);
      }
      eyes(0.02,0.16,glowMat); break;
    case 'dracula':
      add(new THREE.SphereGeometry(0.163,18,14),M.dark,0,0.04,-0.02).scale.set(1.02,1.05,1.02);
      add(new THREE.BoxGeometry(0.2,0.34,0.1),M.dark,0,-0.24,-0.09);
      eyes(0.02,0.15,new THREE.MeshBasicMaterial({color:'#ff3b3b'})); break;
    case 'kagune':
      add(new THREE.SphereGeometry(0.163,18,14),std('#e8e4de',0.9,0),0,0.03,-0.01);
      eyes(0.02,0.15,new THREE.MeshBasicMaterial({color:'#c81f2c'}));
      for(let i=0;i<4;i++){
        const a=(i-1.5)*0.4;
        const tent=add(new THREE.ConeGeometry(0.045,0.7,6),std('#8a2030',0.6,0),Math.sin(a)*0.18,0.15,-0.18);
        tent.rotation.set(-0.5,a,0);
      } break;
    case 'hat':
      add(new THREE.CylinderGeometry(0.34,0.36,0.025,22),M.dark,0,0.15,0.01);
      add(new THREE.CylinderGeometry(0.15,0.18,0.2,18),M.dark,0,0.25,0.01);
      add(new THREE.CylinderGeometry(0.152,0.152,0.035,18),M.accent,0,0.16,0.01);
      eyes(0.02,0.148); break;
    case 'fedora':
      add(new THREE.CylinderGeometry(0.3,0.31,0.022,22),std('#4a382c',0.85,0),0,0.15,0.01);
      add(new THREE.CylinderGeometry(0.14,0.17,0.17,18),std('#4a382c',0.85,0),0,0.235,0.01);
      add(new THREE.CylinderGeometry(0.145,0.145,0.03,18),M.dark,0,0.16,0.01);
      eyes(0.02,0.148); break;
    case 'rabbit':
      add(new THREE.ConeGeometry(0.235,0.5,18),M.cloth,0,0.08,-0.01);
      add(new THREE.CapsuleGeometry(0.045,0.3,4,8),std('#cfc7bb',0.85,0),-0.09,0.34,-0.02,0,0,0.2);
      add(new THREE.CapsuleGeometry(0.045,0.3,4,8),std('#cfc7bb',0.85,0),0.09,0.34,-0.02,0,0,-0.2);
      eyes(0.02,0.14); break;
    case 'animatronic': {
      const cr=new THREE.Mesh(new THREE.SphereGeometry(0.165,18,14),M.cloth);
      cr.position.set(0,0.02,0); cr.scale.set(1.02,1.06,0.99); g.add(cr);
      add(new THREE.BoxGeometry(0.2,0.12,0.16),M.cloth,0,-0.055,0.115);
      add(new THREE.BoxGeometry(0.075,0.05,0.035),M.dark,0,-0.005,0.205);
      add(new THREE.BoxGeometry(0.18,0.05,0.14),M.metal,0,-0.12,0.11);
      for(let i=0;i<4;i++){add(new THREE.BoxGeometry(0.022,0.032,0.012),std('#d8d4c8',0.5,0.2),-0.06+i*0.04,-0.078,0.192);}
      add(new THREE.SphereGeometry(0.036,10,8),M.dark,-0.062,0.035,0.135);
      add(new THREE.SphereGeometry(0.036,10,8),M.dark,0.062,0.035,0.135);
      add(new THREE.SphereGeometry(0.022,8,8),glowMat,-0.062,0.035,0.158);
      add(new THREE.SphereGeometry(0.022,8,8),glowMat,0.062,0.035,0.158);
      add(new THREE.CapsuleGeometry(0.048,0.32,4,8),M.cloth,-0.1,0.37,-0.02,0,0,0.12);
      add(new THREE.CapsuleGeometry(0.042,0.26,4,8),M.cloth,0.11,0.31,-0.03,0,0,-0.4);
      add(new THREE.CapsuleGeometry(0.024,0.24,4,8),M.dark,-0.1,0.37,0.012,0,0,0.12);
      add(new THREE.CapsuleGeometry(0.02,0.2,4,8),M.dark,0.11,0.31,0.002,0,0,-0.4);
      add(new THREE.BoxGeometry(0.055,0.13,0.07),M.metal,0.15,-0.01,0.03);
      add(new THREE.CylinderGeometry(0.012,0.012,0.1,6),M.dark,0.16,0.06,0.04,0,0,0.3);
      break;
    }
    case 'pinhead':
      eyes(0.02,0.15,new THREE.MeshBasicMaterial({color:'#2a2a30'}));
      for(let r=0;r<4;r++){
        for(let c=0;c<3;c++){
          if(r===1&&c===1) continue;
          add(new THREE.CylinderGeometry(0.008,0.008,0.07,5),std('#b9b2a6',0.4,0.6),-0.05+c*0.05,0.11-r*0.075,0.15,Math.PI/2,0,0);
        }
      } break;
    case 'beak':
      add(new THREE.ConeGeometry(0.075,0.34,12),std('#4a3f33',0.6,0.05),0,-0.01,0.26,Math.PI/2,0,0);
      eyes(0.03,0.15,new THREE.MeshBasicMaterial({color:'#d8a24a'})); break;
    case 'sunglasses':
      add(new THREE.BoxGeometry(0.24,0.055,0.03),M.dark,0,0.02,0.15); break;
    case 'doctor':
      add(new THREE.BoxGeometry(0.13,0.02,0.02),std('#e8e4dc',0.4,0),0,-0.07,0.155);
      add(new THREE.CylinderGeometry(0.014,0.02,0.16,8),M.metal,-0.11,0.14,0,0,0,0.35);
      add(new THREE.CylinderGeometry(0.014,0.02,0.16,8),M.metal,0.11,0.14,0,0,0,-0.35);
      eyes(0.02,0.15,new THREE.MeshBasicMaterial({color:'#8fe3f5'})); break;
    case 'clown':
      add(new THREE.SphereGeometry(0.045,10,8),std('#c0392b',0.7,0),0,0,0.16);
      add(new THREE.BoxGeometry(0.12,0.012,0.02),std('#5a1f1f',0.8,0),0,-0.075,0.15);
      eyes(0.03,0.15); break;
    case 'tyrant':
      add(new THREE.SphereGeometry(0.17,16,12),std('#6a6a70',0.85,0.1),0,0.01,0);
      add(new THREE.BoxGeometry(0.2,0.06,0.05),M.dark,0,-0.02,0.14);
      add(new THREE.BoxGeometry(0.26,0.03,0.06),M.metal,0,0.13,0.02); break;
    default:
      eyes(); break;
  }
  return g;
}

function buildStatue(def,vi){
  const p=paletteFor(def,vi);
  const M={
    cloth:std(p.cloth,0.94,0.02),
    accent:std(p.accent,0.58,0.08),
    metal:std(p.metal,0.34,0.72),
    skin:std(p.skin,0.9,0),
    dark:std('#08080a',1,0),
    glow:new THREE.MeshBasicMaterial({color:p.glow})
  };
  const root=new THREE.Group();
  const body=new THREE.Group();
  root.add(body);
  const b=def.l.b;
  const bulky=b==='brute',slim=b==='slim',beast=b==='beast';
  if(b==='small') body.scale.setScalar(0.58);
  const lr=bulky?0.14:(slim?0.086:0.108);
  const hipW=bulky?0.225:(slim?0.125:0.165);
  const legLen=(b==='small')?0.66:(beast?0.72:0.9);
  for(let i=0;i<2;i++){
    const s=i?1:-1;
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(lr,legLen,4,10),M.cloth);
    leg.position.set(s*hipW,legLen/2+lr,0);
    body.add(leg);
    const boot=new THREE.Mesh(new THREE.BoxGeometry(lr*2.6,0.14,lr*3.6),M.dark);
    boot.position.set(s*hipW,0.08,0.03);
    body.add(boot);
  }
  const torsoY=legLen+lr*1.1;
  const tw=bulky?0.4:(slim?0.24:0.3);
  const chest=new THREE.Mesh(new THREE.CylinderGeometry(tw,tw*0.78,beast?0.6:0.78,16),M.cloth);
  chest.position.set(0,torsoY+0.4,0);
  if(beast) chest.rotation.x=0.3;
  body.add(chest);
  const shoulders=new THREE.Mesh(new THREE.CapsuleGeometry(tw*0.5,tw*1.5,4,10),M.cloth);
  shoulders.rotation.z=Math.PI/2;
  shoulders.position.set(0,torsoY+0.7,0);
  body.add(shoulders);
  const belt=new THREE.Mesh(new THREE.TorusGeometry(tw*0.82,0.03,8,20),M.accent);
  belt.rotation.x=Math.PI/2;
  belt.position.set(0,torsoY+0.06,0);
  if(def.l.e==='bowtie') belt.material=M.dark;
  body.add(belt);
  for(let i=0;i<2;i++){
    const s=i?1:-1;
    const arm=new THREE.Group();
    arm.position.set(s*(tw+0.03),torsoY+0.66,0);
    arm.rotation.z=s*0.1;
    arm.rotation.x=(s>0?-0.38:0.06);
    body.add(arm);
    const limb=new THREE.Mesh(new THREE.CapsuleGeometry(bulky?0.09:(slim?0.066:0.078),0.5,4,8),M.cloth);
    limb.position.y=-0.33;
    arm.add(limb);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(0.078,10,8),M.skin);
    hand.position.y=-0.67;
    arm.add(hand);
  }
  const wtype=def.l.w;
  if(wtype!=='none'&&wtype!=='fist'){
    const wp=buildWeapon(wtype,M);
    wp.position.set(tw+0.08,torsoY-0.02,0.3);
    wp.rotation.x=0.06;
    wp.rotation.z=-0.1;
    body.add(wp);
    if(wtype==='claws'){
      const lc=buildWeapon('claws',M);
      lc.position.set(-(tw+0.06),torsoY-0.02,0.22);
      lc.rotation.z=0.1;
      body.add(lc);
    }
  }
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.085,0.16,10),M.skin);
  neck.position.set(0,torsoY+0.76,0);
  body.add(neck);
  const head=buildHead(def.l.h,M,p);
  head.position.set(0,torsoY+0.9,beast?0.1:0);
  body.add(head);
  const ex=def.l.e;
  if(ex==='cape'){
    const cape=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.85,1.5,20,1,true,Math.PI*1.35,Math.PI*1.3),M.dark);
    cape.material.side=THREE.DoubleSide;
    cape.position.set(0,torsoY+0.1,-0.12);
    body.add(cape);
  }
  if(ex==='tentacles'){
    for(let i=0;i<4;i++){
      const t=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.02,0.9,6),M.accent);
      t.position.set((i-1.5)*0.14,torsoY+0.7,-0.24);
      t.rotation.x=(i%2?0.5:0.35);
      t.rotation.z=(i-1.5)*0.22;
      body.add(t);
    }
  }
  if(ex==='tail'){
    for(let i=0;i<5;i++){
      const seg=new THREE.Mesh(new THREE.ConeGeometry(0.09-i*0.012,0.42,6),M.cloth);
      seg.position.set(0,torsoY+0.35-i*0.16,-0.34-i*0.14);
      seg.rotation.x=Math.PI/2+i*0.14;
      body.add(seg);
    }
  }
  if(ex==='shield'){
    const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.05,18),M.metal);
    sh.rotation.z=Math.PI/2;
    sh.position.set(-(tw+0.12),torsoY+0.3,0.05);
    body.add(sh);
    const boss=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),M.accent);
    boss.position.set(-(tw+0.16),torsoY+0.3,0.05);
    body.add(boss);
  }
  if(ex==='bowtie'){
    const k1=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.065,0.035),M.accent);
    k1.position.set(-0.06,torsoY+0.63,0.27); k1.rotation.z=0.22; body.add(k1);
    const k2=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.065,0.035),M.accent);
    k2.position.set(0.06,torsoY+0.63,0.27); k2.rotation.z=-0.22; body.add(k2);
    const kn=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,8),M.accent);
    kn.position.set(0,torsoY+0.63,0.285); body.add(kn);
    for(let i=0;i<2;i++){
      const bt=new THREE.Mesh(new THREE.SphereGeometry(0.022,8,6),M.dark);
      bt.position.set(0,torsoY+0.36-i*0.16,0.285); body.add(bt);
    }
  }
  if(ex==='ghost'){
    const aura=new THREE.Mesh(new THREE.ConeGeometry(0.5,1.7,20,1,true),new THREE.MeshBasicMaterial({color:'#dfe8ff',transparent:true,opacity:0.07,side:THREE.DoubleSide,depthWrite:false}));
    aura.position.set(0,0.85,0);
    body.add(aura);
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(0.62,24),new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:0.32,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=0.02;
  root.add(shadow);
  return root;
}

/* ==========================================================================
   Sala del museo: pasillo largo con dos filas de pedestales de piedra clara,
   placa dorada, cono de luz cenital y suelo oscuro brillante.
   ========================================================================== */
const PED_H=1.0;           // altura del pedestal (la figura se apoya encima)
const ROW_X=3.6;           // distancia de cada fila al centro del pasillo
const HALL_W=15;           // ancho interior de la sala
const HALL_H=9;            // altura del techo
const EYE=1.68;            // altura de los ojos del visitante

const plates=[];
function drawPlate(c,k){
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,512,170);
  g.addColorStop(0,'#8f6f2a'); g.addColorStop(0.48,'#dcbc6c'); g.addColorStop(1,'#87661f');
  x.fillStyle=g; x.fillRect(0,0,512,170);
  x.strokeStyle='rgba(42,28,6,.55)'; x.lineWidth=3; x.strokeRect(10,10,492,150);
  x.textAlign='center';
  x.fillStyle='#3d2c0f';
  x.font='600 15px Inter, sans-serif';
  x.fillText((k.c+' · '+k.y).toUpperCase(),256,46);
  let fs=36;
  const name=k.n.toUpperCase();
  x.font='700 '+fs+'px Cinzel, Georgia, serif';
  while(x.measureText(name).width>452&&fs>17){fs-=2;x.font='700 '+fs+'px Cinzel, Georgia, serif';}
  x.fillStyle='#1c1306';
  x.fillText(name,256,102);
  x.fillStyle='#4a3814';
  x.font='500 13px Inter, sans-serif';
  x.fillText(k.a.toUpperCase(),256,138);
}
function plateTexture(k){
  const c=document.createElement('canvas');
  c.width=512; c.height=170;
  drawPlate(c,k);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=8;
  plates.push({c:c,k:k,t:t});
  return t;
}
/* Las placas se dibujan antes de que carguen Cinzel e Inter: se repintan después. */
if(document.fonts&&document.fonts.ready){
  document.fonts.ready.then(function(){
    plates.forEach(function(p){ drawPlate(p.c,p.k); p.t.needsUpdate=true; });
  });
}

/* Cartel «Work In Progress» para los asesinos que aún no tienen modelo 3D:
   pizarra sobre caballete, con franjas de obra y un cono a sus pies. */
const wipBoards=[];
function drawWip(c,k){
  const x=c.getContext('2d'),W=c.width,H=c.height;
  x.fillStyle='#141316'; x.fillRect(0,0,W,H);
  x.save();
  x.beginPath(); x.rect(0,0,W,58); x.rect(0,H-58,W,58); x.clip();
  for(let s=-H;s<W+H;s+=44){
    x.fillStyle='#e2a72e';
    x.beginPath(); x.moveTo(s,0); x.lineTo(s+22,0); x.lineTo(s+22-H,H); x.lineTo(s-H,H); x.closePath(); x.fill();
  }
  x.restore();
  x.strokeStyle='rgba(226,167,46,.55)'; x.lineWidth=3; x.strokeRect(22,80,W-44,H-160);
  x.textAlign='center';
  x.fillStyle='#e2a72e';
  x.font='600 20px Inter, sans-serif';
  x.fillText('EN OBRAS',W/2,140);
  x.fillStyle='#efe9dc';
  x.font='700 64px Cinzel, Georgia, serif';
  x.fillText('WORK IN',W/2,250);
  x.fillText('PROGRESS',W/2,326);
  x.fillStyle='#e2a72e'; x.fillRect(W/2-60,360,120,3);
  let fs=34; const name=k.n.toUpperCase();
  x.font='600 '+fs+'px Cinzel, Georgia, serif';
  while(x.measureText(name).width>W-90&&fs>18){ fs-=2; x.font='600 '+fs+'px Cinzel, Georgia, serif'; }
  x.fillStyle='#efe9dc';
  x.fillText(name,W/2,420);
  x.fillStyle='#8d8a85';
  x.font='500 18px Inter, sans-serif';
  x.fillText('MODELO 3D EN CAMINO',W/2,470);
}
const matWipFrame=std('#2a2622',0.6,0.35);
const matConeOrange=std('#e0661f',0.55,0.0);
const matConeWhite=std('#eeeae0',0.5,0.0);
function buildWipSign(k){
  const g=new THREE.Group();
  const c=document.createElement('canvas');
  c.width=512; c.height=640;
  drawWip(c,k);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=8;
  wipBoards.push({c:c,k:k,t:t});
  const face=new THREE.MeshStandardMaterial({map:t,roughness:0.85,metalness:0});
  const board=new THREE.Mesh(new THREE.BoxGeometry(1.04,1.3,0.04),[matWipFrame,matWipFrame,matWipFrame,matWipFrame,face,matWipFrame]);
  board.position.set(0,1.2,0.05);
  board.rotation.x=-0.1;
  g.add(board);
  for(let s=-1;s<=1;s+=2){
    const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,1.9,8),matWipFrame);
    leg.position.set(s*0.42,0.92,-0.02);
    leg.rotation.x=-0.1;
    g.add(leg);
  }
  const back=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.75,8),matWipFrame);
  back.position.set(0,0.82,-0.3);
  back.rotation.x=0.32;
  g.add(back);
  const cone=new THREE.Group();
  const body=new THREE.Mesh(new THREE.ConeGeometry(0.15,0.42,20),matConeOrange);
  body.position.y=0.23; cone.add(body);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.105,0.07,20),matConeWhite);
  band.position.y=0.26; cone.add(band);
  const foot=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.03,0.34),matConeOrange);
  foot.position.y=0.015; cone.add(foot);
  cone.position.set(0.5,0,0.38);
  g.add(cone);
  return g;
}
if(document.fonts&&document.fonts.ready){
  document.fonts.ready.then(function(){
    wipBoards.forEach(function(p){ drawWip(p.c,p.k); p.t.needsUpdate=true; });
  });
}

const matPlinth=std('#cbbd9b',0.74,0.0);
const matPlinthDark=std('#17140f',0.55,0.25);
function buildPedestal(k,row){
  const g=new THREE.Group();
  const foot=new THREE.Mesh(new THREE.BoxGeometry(1.66,0.07,1.66),matPlinthDark);
  foot.position.y=0.035; g.add(foot);
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.5,PED_H-0.13,1.5),matPlinth);
  body.position.y=0.07+(PED_H-0.13)/2; g.add(body);
  const top=new THREE.Mesh(new THREE.BoxGeometry(1.62,0.06,1.62),matPlinth);
  top.position.y=PED_H-0.03; g.add(top);
  const s=row?-1:1;
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.32),new THREE.MeshStandardMaterial({map:plateTexture(k),metalness:0.55,roughness:0.38}));
  plate.position.set(s*0.752,PED_H*0.6,0);
  plate.rotation.y=s*Math.PI/2;
  g.add(plate);
  return g;
}

/* Cono de luz falso: brillo según el ángulo de visión, se apaga hacia el suelo. */
const coneMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  uniforms:{uColor:{value:new THREE.Color('#ffcf93')},uOpacity:{value:0.13}},
  vertexShader:'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vY=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uColor;uniform float uOpacity;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float f=pow(abs(dot(normalize(vN),normalize(vV))),2.2);float a=f*pow(vY,1.6)*uOpacity;gl_FragColor=vec4(uColor,a);}'
});
const coneGeo=new THREE.CylinderGeometry(0.16,1.75,HALL_H-0.15,40,1,true);
function radialTexture(inner,outer){
  const c=document.createElement('canvas');
  c.width=c.height=256;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,inner); g.addColorStop(1,outer);
  x.fillStyle=g; x.fillRect(0,0,256,256);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  return t;
}
const poolMat=new THREE.MeshBasicMaterial({map:radialTexture('rgba(255,206,150,0.55)','rgba(255,206,150,0)'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
const lampMat=new THREE.MeshBasicMaterial({color:'#ffe6c2'});

const perRow=Math.ceil(KILLERS.length/2);
const gap=4.8;
const startZ=(perRow-1)*gap/2;
const hallLen=startZ*2+16;

const stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,window.innerWidth<880?1.5:2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.className='app-canvas';
stage.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color('#050506');
scene.fog=new THREE.FogExp2('#050506',0.026);

const camera=new THREE.PerspectiveCamera(60,window.innerWidth/window.innerHeight,0.05,220);
camera.rotation.order='YXZ';

const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;

scene.add(new THREE.AmbientLight('#3b3b52',0.6));
scene.add(new THREE.HemisphereLight('#8f97b8','#0a0a0c',0.22));
for(let z=startZ;z>-startZ-4;z-=12){
  const pl=new THREE.PointLight('#ffb877',18,24,2);
  pl.position.set(0,7.4,z);
  scene.add(pl);
}

const matWall=std('#100f12',0.9,0.04);
const matDark=std('#0a0a0d',0.9,0.05);
const matFloor=std('#09090b',0.2,0.55);
matFloor.envMapIntensity=0.8;

const floor=new THREE.Mesh(new THREE.PlaneGeometry(HALL_W,hallLen+14),matFloor);
floor.rotation.x=-Math.PI/2;
floor.position.z=0;
scene.add(floor);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(HALL_W,hallLen+14),matDark);
ceil.rotation.x=Math.PI/2;
ceil.position.y=HALL_H;
scene.add(ceil);
for(let s=-1;s<=1;s+=2){
  const wall=new THREE.Mesh(new THREE.BoxGeometry(0.6,HALL_H,hallLen+14),matWall);
  wall.position.set(s*(HALL_W/2+0.3),HALL_H/2,0);
  scene.add(wall);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.04,hallLen+12),new THREE.MeshBasicMaterial({color:'#6e5418'}));
  strip.position.set(s*(HALL_W/2-0.02),0.32,0);
  scene.add(strip);
  for(let z=startZ+5;z>-startZ-6;z-=9.6){
    const pil=new THREE.Mesh(new THREE.BoxGeometry(0.5,HALL_H,0.9),matDark);
    pil.position.set(s*(HALL_W/2-0.2),HALL_H/2,z);
    scene.add(pil);
  }
}
const backWall=new THREE.Mesh(new THREE.BoxGeometry(HALL_W+1.2,HALL_H,0.6),matDark);
backWall.position.set(0,HALL_H/2,-startZ-8.3);
scene.add(backWall);
const frontWall=new THREE.Mesh(new THREE.BoxGeometry(HALL_W+1.2,HALL_H,0.6),matDark);
frontWall.position.set(0,HALL_H/2,startZ+8.3);
scene.add(frontWall);
/* Rejillas de luz en el techo, en diagonal, como en una galería de arte. */
const barGeo=new THREE.BoxGeometry(0.07,0.03,2.6);
for(let z=startZ+6;z>-startZ-7;z-=3.2){
  for(let s=-1;s<=1;s+=2){
    const bar=new THREE.Mesh(barGeo,lampMat);
    bar.position.set(s*1.5,HALL_H-0.03,z);
    bar.rotation.y=s*0.55;
    scene.add(bar);
  }
}
/* Rótulo al fondo de la sala */
(function(){
  const c=document.createElement('canvas');
  c.width=1024; c.height=200;
  const draw=function(){
    const x=c.getContext('2d');
    x.clearRect(0,0,1024,200);
    x.textAlign='center';
    x.fillStyle='#c9a227';
    x.font='500 22px Inter, sans-serif';
    x.fillText('D E A D   B Y   D A Y L I G H T',512,46);
    x.fillStyle='#ece6da';
    x.font='600 74px Cinzel, Georgia, serif';
    x.fillText('EL MUSEO DE LOS ASESINOS',512,140);
  };
  draw();
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){draw();t.needsUpdate=true;});
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(9,1.76),new THREE.MeshBasicMaterial({map:t,transparent:true}));
  sign.position.set(0,5.6,-startZ-7.98);
  scene.add(sign);
})();

const statues=[];
const pivots=[];
const proxies=[];
const proxyMat=new THREE.MeshBasicMaterial({visible:false});
KILLERS.forEach(function(k,i){
  const row=i%2;
  const kk=Math.floor(i/2);
  const x=row?ROW_X:-ROW_X;
  const z=startZ-kk*gap;
  const ped=buildPedestal(k,row);
  ped.position.set(x,0,z);
  scene.add(ped);
  const cone=new THREE.Mesh(coneGeo,coneMat);
  cone.position.set(x,(HALL_H-0.15)/2,z);
  scene.add(cone);
  const pool=new THREE.Mesh(new THREE.PlaneGeometry(4.4,4.4),poolMat);
  pool.rotation.x=-Math.PI/2;
  pool.position.set(x,0.012,z);
  scene.add(pool);
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.08,20),lampMat);
  lamp.position.set(x,HALL_H-0.06,z);
  scene.add(lamp);
  const proxy=new THREE.Mesh(new THREE.BoxGeometry(1.7,PED_H+2.3,1.7),proxyMat);
  proxy.position.set(x,(PED_H+2.3)/2,z);
  proxy.userData.i=i;
  scene.add(proxy);
  proxies.push(proxy);
  const pivot=new THREE.Group();
  pivot.position.set(x,PED_H,z);
  pivot.rotation.y=row?-Math.PI/2:Math.PI/2;
  pivot.userData.i=i;
  scene.add(pivot);
  pivots.push(pivot);
  statues.push({pivot:pivot,x:x,z:z,row:row,ped:ped,base:pivot.rotation.y,spin:0,vel:0});
});

/* Solo las figuras cercanas reciben un foco real; el resto, cono y halo. */
const SPOT_I=95;
const SPOTS=[];
for(let n=0;n<6;n++){
  const sp=new THREE.SpotLight('#ffd9b0',0,0,0.36,0.6,1.25);
  sp.userData.i=-1;
  scene.add(sp);
  scene.add(sp.target);
  SPOTS.push(sp);
}

function disposeObj(o){
  o.traverse(function(n){
    if(n.geometry) n.geometry.dispose();
    if(n.material){
      const ms=Array.isArray(n.material)?n.material:[n.material];
      for(let i=0;i<ms.length;i++){ if(ms[i]&&ms[i].dispose) ms[i].dispose(); }
    }
  });
}
const mixers=new Map();
function cloneModel(src){
  let skinned=false;
  src.traverse(function(o){ if(o.isSkinnedMesh) skinned=true; });
  const c = skinned ? SkeletonUtils.clone(src) : src.clone(true);
  c.userData.clips = src.userData.clips;
  c.userData.idle = src.userData.idle;
  c.userData.fromModel = true;
  return c;
}
function renderStatue(i){
  const k=KILLERS[i];
  const st=statues[i];
  if(!st) return;
  const prev=mixers.get(i);
  if(prev){ try{ prev.stopAllAction(); }catch(e){} mixers.delete(i); }
  const pivot=st.pivot;
  const src=k.model;
  while(pivot.children.length){
    const c=pivot.children[0];
    pivot.remove(c);
    if(!c.userData||!c.userData.fromModel) disposeObj(c);
  }
  let obj;
  if(src) obj=cloneModel(src);
  else obj=buildWipSign(k);
  pivot.add(obj);
  pivot.scale.set(1,1,1);
  st.breath=null;
  st.arms=null;
  st.armU=null;
  st.waitIdle=false;
  st.renderedKind=src?'glb':'proc';
  if(src && src.userData && src.userData.clips && src.userData.clips.length){
    const mixer=new THREE.AnimationMixer(obj);
    const ci=(src.userData.idle>=0?src.userData.idle:0);
    const act=mixer.clipAction(src.userData.clips[ci]);
    act.play();
    mixers.set(i,mixer);
    /* El reposo de Springtrap sirve de molde para los demás asesinos del juego. */
    if(k.id==='animatronic'&&!IDLE_SRC){
      IDLE_SRC={clip:src.userData.clips[ci],rest:restPose(src)};
      statues.forEach(function(s,j){ if(s.waitIdle) renderStatue(j); });
    }
  } else if(src){
    giveIdle(i,obj);
  }
  const item=document.getElementById('roster');
  if(item&&item.children[i]) item.children[i].classList.toggle('real',!!src);
  updateCount();
}
/* ==========================================================================
   Reposo para los modelos que no traen animación.
   - Esqueleto del juego (huesos joint_*): se traslada el idle de Springtrap
     como diferencia sobre su pose de reposo, sin tocar piernas ni pelvis
     para que los pies sigan apoyados.
   - Otros esqueletos o sin huesos: brazos bajados si están en cruz, más
     respiración, balanceo suave y giro lento de la cabeza.
   ========================================================================== */
const DBD_BONE=/^(joint_(?:[A-Za-z0-9]+_)+?\d{2})(?=_|$)/;
/* Piernas y brazos no se copian: los pies siguen en la base y los brazos se
   bajan aparte con relaxArms, porque el reposo de Springtrap los deja en cruz. */
const LEG_BONE=/Pelvis|Hip|Knee|Ankle|Foot|Toe|Leg|Thigh|Calf|Root|Clavicle|Shoulder|Elbow|ForArm|Wrist|Hand|Finger|Thumb/i;
let IDLE_SRC=null;
function boneBase(name){ const m=DBD_BONE.exec(name); return m?m[1]:null; }
function restPose(model){
  const m=new Map();
  model.traverse(function(n){ if(n.isBone) m.set(n.name,n.quaternion.clone()); });
  return m;
}
function isGameRig(model){
  let found=false;
  model.traverse(function(n){ if(!found&&n.isBone&&boneBase(n.name)==='joint_Pelvis_01') found=true; });
  return found;
}
function retargetIdle(model){
  const tgt=new Map();
  model.traverse(function(n){ if(n.isBone){ const b=boneBase(n.name); if(b&&!tgt.has(b)) tgt.set(b,n); } });
  const qa=new THREE.Quaternion(),qr=new THREE.Quaternion(),qt=new THREE.Quaternion();
  const tracks=[];
  IDLE_SRC.clip.tracks.forEach(function(t){
    if(!t.name.endsWith('.quaternion')) return;
    const sn=t.name.slice(0,-11),b=boneBase(sn);
    if(!b||LEG_BONE.test(b)||!tgt.has(b)||!IDLE_SRC.rest.has(sn)) return;
    const bone=tgt.get(b);
    qr.copy(IDLE_SRC.rest.get(sn)).invert();
    const v=new Float32Array(t.values.length);
    for(let j=0;j<v.length;j+=4){
      qa.fromArray(t.values,j);
      qt.copy(qr).multiply(qa).premultiply(bone.quaternion).toArray(v,j);
    }
    tracks.push(new THREE.QuaternionKeyframeTrack(bone.name+'.quaternion',t.times,v));
  });
  return tracks.length?new THREE.AnimationClip('Idle Springtrap',IDLE_SRC.clip.duration,tracks):null;
}
const NOT_MAIN=/twist|corrective|roll|_out|fwd|_in_|bck|pec|scap|lip|cheek|mouth|eye|jaw|brow|nose|tendril|ACC|(^|_)ear(_|$)/i;
/* Baja los brazos en cruz girando cada brazo hacia abajo en el espacio del mundo. */
function relaxArms(obj){
  const arms=[],recs=[];
  obj.traverse(function(n){
    if(n.isBone&&/upper_?arm|arm_(left|right)_shoulder_2|(left|right)arm$|^joint_Shoulder(LT|RT)_01/i.test(n.name)&&!NOT_MAIN.test(n.name)) arms.push(n);
  });
  const a=new THREE.Vector3(),b=new THREE.Vector3(),pw=new THREE.Quaternion(),qw=new THREE.Quaternion();
  arms.forEach(function(bone){
    const kids=bone.children.filter(function(c){ return c.isBone&&!NOT_MAIN.test(c.name); });
    const child=kids.find(function(c){ return /fore|elbow|lowerarm/i.test(c.name); })||kids[0];
    if(!child) return;
    obj.updateMatrixWorld(true);
    bone.getWorldPosition(a); child.getWorldPosition(b);
    const d=b.clone().sub(a).normalize();
    if(d.y>-0.75){
      const out=new THREE.Vector3(d.x,0,d.z).normalize().multiplyScalar(0.3);
      const target=out.add(new THREE.Vector3(0,-1,0)).normalize();
      qw.setFromUnitVectors(d,target);
      bone.parent.getWorldQuaternion(pw);
      bone.quaternion.premultiply(pw.clone().invert().multiply(qw).multiply(pw));
    }
    recs.push({bone:bone,elbow:child});
  });
  obj.updateMatrixWorld(true);
  /* Ejes para el balanceo: lateral (adelante/atrás) y de flexión del codo,
     pasados al espacio del padre de cada hueso. */
  const front=new THREE.Vector3(0,0,1).applyQuaternion(obj.parent.getWorldQuaternion(new THREE.Quaternion()));
  const lat=new THREE.Vector3(0,1,0).cross(front).normalize();
  const bend=new THREE.Vector3(0,-1,0).cross(front).normalize();
  const center=obj.getWorldPosition(new THREE.Vector3());
  const toLocal=function(w,parent){ return w.clone().applyQuaternion(parent.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize(); };
  return recs.map(function(r){
    const side=r.bone.getWorldPosition(new THREE.Vector3()).sub(center).dot(lat)<0?-1:1;
    return {bone:r.bone,rest:r.bone.quaternion.clone(),swing:toLocal(lat,r.bone.parent),flare:toLocal(front,r.bone.parent),
      elbow:r.elbow,elbowRest:r.elbow.quaternion.clone(),bend:toLocal(bend,r.bone),side:side};
  });
}
/* Respiración y brazos, inspirados en los showcases y tráilers de Behaviour:
   el asesino quieto pero vivo, con respiración pesada que levanta pecho y
   hombros, brazos que acompañan cada inspiración con un vaivén lento y la
   cabeza que vigila. Myers inclina la cabeza, como en sus películas.
   Los huesos que ya mueve una animación reciben el gesto encima (rest=null);
   el resto se recalcula desde su pose de reposo en cada fotograma. */
const BREATH=1.35;
const qArm=new THREE.Quaternion(),qTmp=new THREE.Quaternion();
function applyRot(rec,angle){
  qTmp.setFromAxisAngle(rec.axis,angle);
  if(rec.rest) rec.bone.quaternion.copy(qTmp).multiply(rec.rest);
  else rec.bone.quaternion.premultiply(qTmp);
}
function swingArms(st,t){
  const p=t+st.breath.ph,br=Math.sin(p*BREATH);
  st.arms.forEach(function(r){
    qArm.setFromAxisAngle(r.swing,r.side*0.06*Math.sin(p*0.55)+0.02*br);
    qTmp.setFromAxisAngle(r.flare,r.side*0.035*(br+1));
    r.bone.quaternion.copy(qTmp).multiply(qArm).multiply(r.rest);
    qArm.setFromAxisAngle(r.bend,0.24+0.07*Math.sin(p*BREATH+0.6));
    r.elbow.quaternion.copy(qArm).multiply(r.elbowRest);
  });
}
function breathRig(obj,animated,id){
  obj.updateMatrixWorld(true);
  const front=new THREE.Vector3(0,0,1).applyQuaternion(obj.parent.getWorldQuaternion(new THREE.Quaternion()));
  const lat=new THREE.Vector3(0,1,0).cross(front).normalize();
  const center=obj.getWorldPosition(new THREE.Vector3());
  const rec=function(bone,axisW,amp){
    const pw=bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    return {bone:bone,axis:axisW.clone().applyQuaternion(pw).normalize(),amp:amp,
      rest:animated.has(bone.name)?null:bone.quaternion.clone()};
  };
  const wy=function(b){ return b.getWorldPosition(new THREE.Vector3()).y; };
  const spine=[],clav=[];
  let head=null;
  obj.traverse(function(n){
    if(!n.isBone||!n.parent||NOT_MAIN.test(n.name)||/latissimus/i.test(n.name)) return;
    if(/spine|chest|torso/i.test(n.name)) spine.push(n);
    else if(/clavicle|shoulder_1/i.test(n.name)) clav.push(n);
    else if(/head/i.test(n.name)&&(!head||n.name.length<head.name.length)) head=n;
  });
  spine.sort(function(a,b){ return wy(b)-wy(a); });
  return {chest:spine.slice(0,2).map(function(b){ return rec(b,lat,0.03); }),
    clav:clav.map(function(b){
      const side=b.getWorldPosition(new THREE.Vector3()).sub(center).dot(lat)<0?-1:1;
      return rec(b,front,side*0.05);
    }),
    head:head?rec(head,new THREE.Vector3(0,1,0),0.16):null,
    tilt:head&&id==='shape'?rec(head,front,0.3):null};
}
function giveIdle(i,obj){
  const k=KILLERS[i],src=k.model,st=statues[i];
  const animated=new Set();
  if(isGameRig(src)){
    if(!IDLE_SRC){ st.waitIdle=true; return; }
    if(src.userData.retClip===undefined) src.userData.retClip=retargetIdle(src);
    const clip=src.userData.retClip;
    if(clip){
      const mixer=new THREE.AnimationMixer(obj);
      const act=mixer.clipAction(clip);
      act.time=Math.random()*clip.duration;
      act.play();
      mixers.set(i,mixer);
      clip.tracks.forEach(function(t){ animated.add(t.name.split('.')[0]); });
    }
  }
  st.arms=relaxArms(obj);
  st.armU=src.userData.armU||null;
  st.breath=Object.assign({ph:Math.random()*6.28},breathRig(obj,animated,k.id));
}
function breathe(st,t){
  const b=st.breath,p=t+b.ph,br=Math.sin(p*BREATH);
  st.pivot.scale.set(1+0.005*br,1+0.008*br,1+0.005*br);
  st.pivot.rotation.y+=0.025*Math.sin(p*0.37);
  b.chest.forEach(function(r){ applyRot(r,r.amp*br); });
  b.clav.forEach(function(r){ applyRot(r,r.amp*(br+1)*0.5); });
  if(b.head) applyRot(b.head,b.head.amp*Math.sin(p*0.45)*(b.tilt?0.4:1));
  if(b.tilt) applyRot(b.tilt,b.tilt.amp*(0.6+0.4*Math.sin(p*0.21)));
  if(st.arms&&st.arms.length) swingArms(st,t);
  if(st.armU) st.armU.value=Math.sin(p*0.55)*0.6+br*0.4;
}
function updateCount(){
  const el=document.getElementById('footCount');
  if(!el) return;
  const n=KILLERS.filter(function(k){return !!k.model;}).length;
  el.textContent=KILLERS.length+' asesinos';
  const s=document.querySelectorAll('.sidefoot span')[1];
  if(s) s.textContent=n+' con modelo 3D';
}
KILLERS.forEach(function(k,i){ renderStatue(i); });

const raycaster=new THREE.Raycaster();
let selected=0;

function norm(s){
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,' ').trim();
}
function measureBox(obj){
  obj.updateMatrixWorld(true);
  const box=new THREE.Box3();
  const v=new THREE.Vector3();
  let any=false;
  obj.traverse(function(n){
    if(!n.isMesh||!n.visible) return;
    /* Vértice a vértice (con huesos si los hay): la caja del glTF es aproximada
       en modelos cuantizados y dejaba la figura unos centímetros en el aire. */
    const pos=n.geometry&&n.geometry.attributes&&n.geometry.attributes.position;
    if(!pos) return;
    const skin=n.isSkinnedMesh&&n.applyBoneTransform;
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);
      if(skin) n.applyBoneTransform(i,v);
      v.applyMatrix4(n.matrixWorld);
      box.expandByPoint(v);
    }
    any=true;
  });
  if(!any) box.setFromObject(obj);
  return box;
}
/* Ajustes de rendimiento: sin transmisión (pasada extra de render) y sin
   recorte de mallas con esqueleto (su caja no sigue a los huesos). */
function prepModel(obj){
  obj.traverse(function(n){
    if(!n.isMesh) return;
    if(n.isSkinnedMesh) n.frustumCulled=false;
    const ms=Array.isArray(n.material)?n.material:[n.material];
    ms.forEach(function(m){
      if(!m) return;
      if(m.transmission>0){ m.transmission=0; m.transparent=true; m.opacity=Math.min(m.opacity,0.6); }
      m.envMapIntensity=0.9;
    });
  });
}
/* Algunos modelos traen piezas sueltas lejos del cuerpo (armas o accesorios en
   su posición de exportación): el manifest puede ocultarlas por nombre. */
function hideParts(obj,names){
  if(!names||!names.length) return;
  obj.traverse(function(n){ if(n.isMesh&&names.indexOf(n.name)>=0) n.visible=false; });
}
function normalizeModel(obj,opts){
  opts=opts||{};
  prepModel(obj);
  if(opts.rot) obj.rotation.y+=opts.rot*Math.PI/180;
  hideParts(obj,opts.hide);
  let box=measureBox(obj);
  const size=box.getSize(new THREE.Vector3());
  const k=(opts.h||2.05)/(size.y||1);
  obj.scale.multiplyScalar(k);
  box=measureBox(obj);
  const c=box.getCenter(new THREE.Vector3());
  obj.position.x-=c.x;
  obj.position.z-=c.z;
  obj.position.y-=box.min.y;
  obj.userData.h=opts.h||2.05;
  if(opts.armsDown) lowerArmsMesh(obj,obj.userData.h,opts.armsDown);
  return obj;
}
/* Modelos en cruz sin huesos de brazo (Jason): se doblan los vértices de cada
   brazo hacia abajo alrededor del hombro, con una transición suave en la axila.
   Se hace una vez sobre la plantilla, en el espacio del modelo (pies en y=0).
   deg: ángulo final del brazo bajo la horizontal. */
function lowerArmsMesh(obj,h,deg){
  obj.updateMatrixWorld(true);
  const meshes=[];
  obj.traverse(function(n){ if(n.isMesh&&n.visible&&!n.isSkinnedMesh&&n.geometry.attributes.position) meshes.push(n); });
  const v=new THREE.Vector3();
  /* Eje lateral: el horizontal con más anchura a la altura de los brazos. */
  let ex=0,ez=0;
  const arm=[];
  meshes.forEach(function(n){
    const pos=n.geometry.attributes.position;
    for(let i=0;i<pos.count;i+=7){
      v.fromBufferAttribute(pos,i).applyMatrix4(n.matrixWorld);
      if(v.y>h*0.6&&v.y<h*0.92){ ex=Math.max(ex,Math.abs(v.x)); ez=Math.max(ez,Math.abs(v.z)); }
      arm.push(v.x,v.y,v.z);
    }
  });
  const lx=ex>=ez;
  /* Perfil por franjas de distancia al centro: donde la franja deja de ser alta
     (tronco) empieza el brazo; su línea central da el hombro y la inclinación. */
  const bw=h*0.025,bins=[];
  for(let i=0;i<arm.length;i+=3){
    if(arm[i+1]<h*0.35) continue;
    const b=Math.floor(Math.abs(lx?arm[i]:arm[i+2])/bw);
    const r=bins[b]||(bins[b]=[1e9,-1e9]);
    r[0]=Math.min(r[0],arm[i+1]); r[1]=Math.max(r[1],arm[i+1]);
  }
  let start=-1;
  for(let b=Math.ceil(h*0.08/bw);b<bins.length;b++){ if(bins[b]&&bins[b][1]-bins[b][0]<h*0.3){ start=b; break; } }
  if(start<0) return;
  let sx=0,sy=0,sxx=0,sxy=0,cnt=0,halfT=0;
  for(let b=start;b<bins.length;b++){
    if(!bins[b]) continue;
    const xm=(b+0.5)*bw,ym=(bins[b][0]+bins[b][1])/2;
    sx+=xm; sy+=ym; sxx+=xm*xm; sxy+=xm*ym; cnt++;
    halfT=Math.max(halfT,(bins[b][1]-bins[b][0])/2);
  }
  if(cnt<3) return;
  const slope=(cnt*sxy-sx*sy)/(cnt*sxx-sx*sx),icpt=(sy-slope*sx)/cnt;
  const centerY=function(l){ return icpt+slope*l; };
  const px=start*bw,py=centerY(px);
  const phi=Math.max(0,deg*Math.PI/180-Math.atan(-slope));
  const ss=function(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  const nv=new THREE.Vector3(),nm=new THREE.Matrix3(),nmi=new THREE.Matrix3(),inv=new THREE.Matrix4();
  meshes.forEach(function(n){
    const g=n.geometry;
    const pos=new THREE.Float32BufferAttribute(g.attributes.position.count*3,3);
    const nor=g.attributes.normal?new THREE.Float32BufferAttribute(g.attributes.normal.count*3,3):null;
    inv.copy(n.matrixWorld).invert();
    nm.getNormalMatrix(n.matrixWorld); nmi.copy(nm).invert();
    /* Datos para el balanceo en el shader: hombro y eje lateral en espacio local. */
    const piv=new THREE.Float32BufferAttribute(pos.count*3,3),axw=new THREE.Float32BufferAttribute(pos.count*4,4);
    const pivL=[-1,1].map(function(s){ return (lx?new THREE.Vector3(s*px,py,0):new THREE.Vector3(0,py,s*px)).applyMatrix4(inv); });
    const axL=(lx?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1)).transformDirection(inv);
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(g.attributes.position,i).applyMatrix4(n.matrixWorld);
      if(nor) nv.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm);
      const lat=lx?v.x:v.z,s=lat<0?-1:1;
      const w=v.y>centerY(s*lat)-halfT-h*0.02?ss(px-h*0.02,px+h*0.03,s*lat):0;
      if(w>0){
        const a=-s*phi*w,ca=Math.cos(a),sa=Math.sin(a);
        const rl=lat-s*px,ry=v.y-py;
        const nl=s*px+rl*ca-ry*sa,ny=py+rl*sa+ry*ca;
        if(lx) v.x=nl; else v.z=nl;
        v.y=ny;
        if(nor){
          const nl2=(lx?nv.x:nv.z)*ca-nv.y*sa,ny2=(lx?nv.x:nv.z)*sa+nv.y*ca;
          if(lx) nv.x=nl2; else nv.z=nl2;
          nv.y=ny2;
        }
      }
      v.applyMatrix4(inv);
      pos.setXYZ(i,v.x,v.y,v.z);
      if(nor){ nv.applyMatrix3(nmi).normalize(); nor.setXYZ(i,nv.x,nv.y,nv.z); }
      const pl=pivL[s<0?0:1];
      piv.setXYZ(i,pl.x,pl.y,pl.z);
      axw.setXYZW(i,axL.x,axL.y,axL.z,w*s);
    }
    const ng=g.clone();
    ng.setAttribute('position',pos);
    if(nor) ng.setAttribute('normal',nor);
    ng.setAttribute('armPivot',piv);
    ng.setAttribute('armAxisW',axw);
    ng.computeBoundingBox(); ng.computeBoundingSphere();
    n.geometry=ng;
  });
  /* El vaivén lo hace la GPU: cada vértice del brazo gira alrededor del hombro
     según su peso; uArm (−1..1) lo mueve updateStatues cada fotograma. */
  const armU={value:0};
  meshes.forEach(function(n){
    (Array.isArray(n.material)?n.material:[n.material]).forEach(function(m){
      if(!m||m.userData.armSway) return;
      m.userData.armSway=true;
      m.customProgramCacheKey=function(){ return 'armsway'; };
      m.onBeforeCompile=function(sh){
        sh.uniforms.uArm=armU;
        sh.vertexShader=sh.vertexShader
          .replace('#include <common>','#include <common>\nattribute vec3 armPivot;\nattribute vec4 armAxisW;\nuniform float uArm;\nvec3 armRot(vec3 p,vec3 k,float a){ return p*cos(a)+cross(k,p)*sin(a)+k*dot(k,p)*(1.0-cos(a)); }')
          .replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nfloat armA=armAxisW.w*0.1*uArm;\nobjectNormal=armRot(objectNormal,armAxisW.xyz,armA);')
          .replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=armPivot+armRot(transformed-armPivot,armAxisW.xyz,armA);');
      };
    });
  });
  obj.userData.armU=armU;
}

const roster=document.getElementById('roster');
KILLERS.forEach(function(k,i){
  const d=document.createElement('div');
  d.className='k'+(k.model?' real':'');
  d.dataset.i=i;
  const num=String(i+1).padStart(2,'0');
  d.innerHTML='<span class="num">'+num+'</span><span class="txt"><span class="nm">'+k.n+'</span><span class="ch">'+k.c+'</span></span><span class="dot" title="Modelo 3D"></span>';
  roster.appendChild(d);
});
updateCount();

let toastTimer=null;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(function(){t.classList.remove('show');},2800);
}
function updatePanel(i){
  const k=KILLERS[i];
  document.getElementById('pName').textContent=k.n;
  document.getElementById('pAlias').textContent=k.a;
  document.getElementById('pQuote').textContent=k.q?'«'+k.q+'»':'';
  document.getElementById('pChapter').textContent=k.c+' · '+k.y;
  document.getElementById('pNum').textContent=String(i+1).padStart(2,'0')+' / '+KILLERS.length;
  document.getElementById('pWeapon').textContent=k.w;
  document.getElementById('pVariants').textContent=k.model?'Modelo 3D':'En preparación';
  document.getElementById('modelState').textContent=k.model?'Modelo 3D del juego':'Work in progress · modelo 3D en camino';
  document.getElementById('modelState').parentNode.classList.toggle('hasReal',!!k.model);
}
function markActive(i){
  const items=roster.children;
  for(let n=0;n<items.length;n++){ items[n].classList.toggle('active',n===i); }
  if(items[i]&&items[i].scrollIntoView) items[i].scrollIntoView({block:'nearest'});
}
function ensureRendered(i){
  const st=statues[i];
  if(!st) return;
  const kind=KILLERS[i].model?'glb':'proc';
  if(st.renderedKind!==kind) renderStatue(i);
}

/* ==========================================================================
   Visitante: camina por la sala (teclado, clic en el suelo o rueda), mira
   arrastrando y contempla una figura al hacer clic sobre ella. Mientras la
   contempla, arrastrar gira la figura sobre su pedestal.
   ========================================================================== */
const ROOM={minX:-HALL_W/2+0.6,maxX:HALL_W/2-0.6,minZ:-(startZ+7.4),maxZ:startZ+7.4};
const player={x:0,z:startZ+7,y:EYE,yaw:0,pitch:-0.02,vx:0,vz:0,bob:0};
const keys=new Set();
const MOVE_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
let walk=null;      // destino: {x,z,look,then,left}
let inspect=null;   // figura contemplada: {i,dist,h}

function clamp(v,a,b){return v<a?a:v>b?b:v;}
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}
function collide(p){
  p.x=clamp(p.x,ROOM.minX,ROOM.maxX);
  p.z=clamp(p.z,ROOM.minZ,ROOM.maxZ);
  for(let i=0;i<statues.length;i++){
    const s=statues[i],dx=p.x-s.x,dz=p.z-s.z,d2=dx*dx+dz*dz;
    if(d2<1.69&&d2>1e-6){const k=1.3/Math.sqrt(d2);p.x=s.x+dx*k;p.z=s.z+dz*k;}
  }
}
/* Altura del punto de mira y distancia de contemplación según la figura. */
function figH(i){ const m=KILLERS[i].model; return (m&&m.userData.h)||2.05; }
function lookY(i){ return PED_H+figH(i)*0.5; }
function viewPoint(i,dist){
  const s=statues[i];
  return {x:s.x+(s.x<0?1:-1)*dist,z:s.z};
}
function lookAngles(fx,fy,fz,tx,ty,tz){
  const dx=tx-fx,dy=ty-fy,dz=tz-fz;
  return {yaw:Math.atan2(-dx,-dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))};
}
function startInspect(i){
  inspect={i:i,dist:1.35+figH(i)*0.95,h:PED_H+0.25+figH(i)*0.4};
  selected=i;
  updatePanel(i);
  markActive(i);
  document.body.classList.add('inspecting');
  setTag(null);
}
function exitInspect(){
  if(!inspect) return;
  inspect=null;
  document.body.classList.remove('inspecting');
}
function focusKiller(i,instant){
  if(i<0||i>=statues.length) return;
  selected=i;
  ensureRendered(i);
  exitInspect();
  const vp=viewPoint(i,1.35+figH(i)*0.95);
  if(instant){
    /* Salto directo (índice): ya colocado y mirando a la figura, sin caminar. */
    const st=statues[i];
    player.x=vp.x; player.z=vp.z; player.y=PED_H+0.25+figH(i)*0.4;
    player.vx=player.vz=0; walk=null;
    const a=lookAngles(player.x,player.y,player.z,st.x,lookY(i),st.z);
    const wide=camera.aspect>1.15;
    player.yaw=a.yaw+(wide?0.2:0); player.pitch=a.pitch+(wide?0:-0.2);
    startInspect(i);
    return;
  }
  const st=statues[i];
  walk={x:vp.x,z:vp.z,look:{x:st.x,y:lookY(i),z:st.z},then:function(){startInspect(i);},left:14};
  markActive(i);
}
function walkTo(x,z){
  const t={x:x,z:z};
  collide(t);
  walk={x:t.x,z:t.z,look:null,then:null,left:8};
  marker.position.set(t.x,0.015,t.z);
}
function updatePlayer(dt){
  if(inspect){
    const st=statues[inspect.i];
    const vp=viewPoint(inspect.i,inspect.dist);
    const k=1-Math.exp(-dt*5);
    player.x+=(vp.x-player.x)*k;
    player.z+=(vp.z-player.z)*k;
    player.y+=(inspect.h-player.y)*k;
    const a=lookAngles(player.x,player.y,player.z,st.x,lookY(inspect.i),st.z);
    /* Encuadre: la figura se desplaza a la derecha en pantallas anchas y hacia
       arriba en vertical, para que el panel de información no la tape. */
    const wide=camera.aspect>1.15;
    player.yaw+=angDiff(player.yaw,a.yaw+(wide?0.2:0))*k;
    player.pitch+=(a.pitch+(wide?0:-0.2)-player.pitch)*k;
    player.vx=player.vz=0;
    return;
  }
  const fwd=((keys.has('KeyW')||keys.has('ArrowUp'))?1:0)-((keys.has('KeyS')||keys.has('ArrowDown'))?1:0);
  const side=((keys.has('KeyD')||keys.has('ArrowRight'))?1:0)-((keys.has('KeyA')||keys.has('ArrowLeft'))?1:0);
  const sy=Math.sin(player.yaw),cy=Math.cos(player.yaw);
  let tx=0,tz=0;
  if(fwd||side){
    walk=null;
    const sp=(keys.has('ShiftLeft')||keys.has('ShiftRight'))?6.2:3.4;
    tx=-sy*fwd+cy*side; tz=-cy*fwd-sy*side;
    const l=Math.hypot(tx,tz)||1;
    tx=tx/l*sp; tz=tz/l*sp;
  } else if(walk){
    const dx=walk.x-player.x,dz=walk.z-player.z,d=Math.hypot(dx,dz);
    walk.left-=dt;
    if(d<0.06||walk.left<0){
      const then=walk.then;
      walk=null;
      if(then) then();
    } else {
      const sp=clamp(d*1.7,0.5,walk.look?13:4.6);
      tx=dx/d*sp; tz=dz/d*sp;
      if(walk.look){
        const k=1-Math.exp(-dt*3.2);
        let ty;
        if(d>3.5){ ty=Math.atan2(-dx,-dz); player.pitch+=(-0.02-player.pitch)*k; }
        else{
          const a=lookAngles(player.x,player.y,player.z,walk.look.x,walk.look.y,walk.look.z);
          ty=a.yaw; player.pitch+=(a.pitch-player.pitch)*k;
        }
        player.yaw+=angDiff(player.yaw,ty)*k;
      }
    }
  }
  const kv=1-Math.exp(-dt*9);
  player.vx+=(tx-player.vx)*kv;
  player.vz+=(tz-player.vz)*kv;
  player.x+=player.vx*dt;
  player.z+=player.vz*dt;
  collide(player);
  player.bob+=dt*Math.min(Math.hypot(player.vx,player.vz),5)*2.3;
  player.y+=(EYE-player.y)*(1-Math.exp(-dt*5));
}

/* Marcador del suelo y etiqueta que sigue al cursor (solo sobre las figuras). */
const marker=new THREE.Mesh(new THREE.RingGeometry(0.2,0.25,48),new THREE.MeshBasicMaterial({color:'#e2c36b',transparent:true,opacity:0,depthWrite:false}));
marker.rotation.x=-Math.PI/2;
scene.add(marker);
const tagEl=document.getElementById('tag');
const tagTxt=tagEl.querySelector('span');
let tagText='';
function setTag(text,x,y){
  if(!text){ tagEl.classList.remove('show'); return; }
  if(text!==tagText){ tagTxt.textContent=text; tagText=text; }
  tagEl.style.transform='translate('+x+'px,'+y+'px)';
  tagEl.classList.add('show');
}

const canvas=renderer.domElement;
const ndc=new THREE.Vector2();
function pick(cx,cy){
  const rect=canvas.getBoundingClientRect();
  ndc.set(((cx-rect.left)/rect.width)*2-1,-((cy-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(ndc,camera);
  const h=raycaster.intersectObjects(proxies,false)[0];
  const f=raycaster.intersectObject(floor,false)[0];
  if(h&&(!f||h.distance<f.distance)) return {type:'statue',i:h.object.userData.i,d:h.distance};
  if(f) return {type:'floor',p:f.point,d:f.distance};
  return null;
}
let drag=null;
const hover={x:0,y:0,dirty:false,mouse:false};
canvas.addEventListener('pointerdown',function(e){
  if(drag) return;
  drag={id:e.pointerId,lx:e.clientX,ly:e.clientY,moved:0,t:performance.now()};
  try{ canvas.setPointerCapture(e.pointerId); }catch(err){}
});
canvas.addEventListener('pointermove',function(e){
  hover.x=e.clientX; hover.y=e.clientY; hover.dirty=true; hover.mouse=(e.pointerType==='mouse');
  if(!drag||e.pointerId!==drag.id) return;
  const dx=e.clientX-drag.lx,dy=e.clientY-drag.ly;
  drag.lx=e.clientX; drag.ly=e.clientY;
  drag.moved+=Math.abs(dx)+Math.abs(dy);
  if(drag.moved<5) return;
  if(inspect){
    const st=statues[inspect.i];
    const now=performance.now(),dt=Math.max(8,now-drag.t)/1000;
    drag.t=now;
    st.spin+=dx*0.011;
    st.vel=clamp(dx*0.011/dt,-7,7);
    inspect.h=clamp(inspect.h-dy*0.006,1.2,3.4);
  } else {
    player.yaw+=dx*0.0036;
    player.pitch=clamp(player.pitch+dy*0.003,-0.8,0.8);
  }
});
function endDrag(e,click){
  if(!drag||e.pointerId!==drag.id) return;
  const wasClick=click&&drag.moved<8;
  drag=null;
  if(wasClick) handleClick(e.clientX,e.clientY);
}
canvas.addEventListener('pointerup',function(e){ endDrag(e,true); });
canvas.addEventListener('pointercancel',function(e){ endDrag(e,false); });
canvas.addEventListener('pointerleave',function(e){ if(e.pointerType==='mouse'){ setTag(null); marker.material.opacity=walk&&!walk.look?0.9:0; } });
function handleClick(cx,cy){
  const p=pick(cx,cy);
  if(!p) return;
  if(p.type==='statue'){
    if(inspect&&inspect.i===p.i) return;
    focusKiller(p.i,false);
  } else {
    exitInspect();
    walkTo(p.p.x,p.p.z);
  }
}
canvas.addEventListener('wheel',function(e){
  e.preventDefault();
  if(inspect){ inspect.dist=clamp(inspect.dist+e.deltaY*0.0025,1.4,5.0); return; }
  walk=null;
  const imp=clamp(-e.deltaY,-120,120)*0.03;
  player.vx+=-Math.sin(player.yaw)*imp;
  player.vz+=-Math.cos(player.yaw)*imp;
},{passive:false});
function updateHover(){
  if(!hover.dirty||drag||!hover.mouse) return;
  hover.dirty=false;
  const p=pick(hover.x,hover.y);
  if(p&&p.type==='statue'){
    canvas.style.cursor='pointer';
    if(inspect&&inspect.i===p.i){ setTag('Arrastra para girar',hover.x,hover.y); }
    else setTag('Ver de cerca · '+KILLERS[p.i].n,hover.x,hover.y);
    if(!walk||walk.look) marker.material.opacity=0;
  } else if(p&&p.type==='floor'&&p.d<40){
    canvas.style.cursor='';
    setTag(null);
    marker.position.set(p.p.x,0.015,p.p.z);
    marker.material.opacity=0.9;
  } else {
    canvas.style.cursor='';
    setTag(null);
    if(!walk) marker.material.opacity=0;
  }
}

window.addEventListener('keydown',function(e){
  if(e.target&&e.target.tagName==='INPUT') return;
  if(e.code==='Escape'){ exitInspect(); walk=null; return; }
  if(MOVE_KEYS.has(e.code)||e.code==='ShiftLeft'||e.code==='ShiftRight'){
    keys.add(e.code);
    if(MOVE_KEYS.has(e.code)){ exitInspect(); e.preventDefault(); }
  }
});
window.addEventListener('keyup',function(e){ keys.delete(e.code); });
window.addEventListener('blur',function(){ keys.clear(); });

roster.addEventListener('click',function(e){
  const el=e.target.closest?e.target.closest('.k'):null;
  if(!el) return;
  focusKiller(parseInt(el.dataset.i,10),true);
  document.getElementById('sidebar').classList.remove('open');
});
document.getElementById('search').addEventListener('input',function(){
  const q=norm(this.value);
  const items=roster.children;
  for(let i=0;i<items.length;i++){
    const k=KILLERS[i];
    const hay=norm(k.n+' '+k.a+' '+k.c);
    items[i].style.display=(!q||hay.indexOf(q)>=0)?'':'none';
  }
});
document.getElementById('menuBtn').addEventListener('click',function(){
  document.getElementById('sidebar').classList.toggle('open');
});
document.getElementById('fsBtn').addEventListener('click',function(){
  if(!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
document.getElementById('backBtn').addEventListener('click',function(){ exitInspect(); });
document.getElementById('nextBtn').addEventListener('click',function(){ focusKiller((selected+1)%KILLERS.length,false); });
document.getElementById('prevBtn').addEventListener('click',function(){ focusKiller((selected-1+KILLERS.length)%KILLERS.length,false); });

const gltfLoader=new GLTFLoader();
const dracoLoader=new DRACOLoader().setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/');
const ktx2Loader=new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/basis/');
try{ ktx2Loader.detectSupport(renderer); }catch(e){}
gltfLoader.setDRACOLoader(dracoLoader);
gltfLoader.setKTX2Loader(ktx2Loader);
try{ gltfLoader.setMeshoptDecoder(MeshoptDecoder); }catch(e){}

function pickIdle(clips){
  if(!clips||!clips.length) return -1;
  const re=[/idle/i,/breath/i,/loop/i];
  for(let r=0;r<re.length;r++){
    for(let i=0;i<clips.length;i++){ if(re[r].test(clips[i].name||'')) return i; }
  }
  return 0;
}
function matchKillerSmart(name){
  const n=norm(name);
  const words=n.split(' ');
  for(let i=0;i<KILLERS.length;i++){
    const id=KILLERS[i].id?norm(KILLERS[i].id):'';
    if(id&&(n===id||words.indexOf(id)>=0||n.replace(/ /g,'')===id.replace(/ /g,''))) return i;
  }
  let best=selected,bestScore=0;
  for(let i=0;i<KILLERS.length;i++){
    const k=KILLERS[i];
    const cands=[norm(k.n),norm(k.a),norm(k.n.replace('The ',''))];
    for(let c=0;c<cands.length;c++){
      const t=cands[c];
      if(t&&t.length>3&&n.indexOf(t)>=0&&t.length>bestScore){bestScore=t.length;best=i;}
    }
  }
  return best;
}
function makeLoader(map){
  const manager=new THREE.LoadingManager();
  manager.setURLModifier(function(u){
    const s=String(u).split('?')[0].split('#')[0];
    const b=s.substring(s.lastIndexOf('/')+1).toLowerCase();
    return map[b]||u;
  });
  const loader=new GLTFLoader(manager);
  loader.setDRACOLoader(dracoLoader);
  loader.setKTX2Loader(ktx2Loader);
  try{ loader.setMeshoptDecoder(MeshoptDecoder); }catch(e){}
  return loader;
}
function modelKey(name){
  return name.replace(/\.(glb|gltf)$/i,'').replace(/[_\s-]*\([0-9]+\)$/,'').split('__')[0].trim();
}
function killerForFile(name){
  return matchKillerSmart(modelKey(name).replace(/[-_]+/g,' '));
}
/* Evita cargar dos veces el mismo modelo (manifest + biblioteca). */
const loadingKeys=new Set();
function claimLoad(idx,src){
  const base=String(src).split('/').pop().toLowerCase();
  const key=idx+'|'+base;
  const prev=KILLERS[idx]&&KILLERS[idx].model;
  if(prev&&prev.userData.origen&&String(prev.userData.origen).split('/').pop().toLowerCase()===base) return null;
  if(loadingKeys.has(key)) return null;
  loadingKeys.add(key);
  return key;
}
function groupModels(files){
  const arr=Array.prototype.slice.call(files);
  const map={};
  arr.forEach(function(f){ map[f.name.toLowerCase()]=URL.createObjectURL(f); });
  const byBase=new Map();
  arr.forEach(function(f){
    if(!/\.(glb|gltf)$/i.test(f.name)) return;
    const key=modelKey(f.name).toLowerCase();
    const prev=byBase.get(key);
    if(!prev) byBase.set(key,f);
    else if(/\.glb$/i.test(f.name)&&!/\.glb$/i.test(prev.name)) byBase.set(key,f);
  });
  return {map:map,list:Array.from(byBase.values())};
}
function loadOne(file,map,opts){
  return new Promise(function(resolve){
    const url=map[file.name.toLowerCase()];
    if(!url){ resolve(-1); return; }
    const idx=killerForFile(file.name);
    const key=claimLoad(idx,file.name);
    if(!key){ resolve(idx); return; }
    makeLoader(map).load(url,function(g){
      loadingKeys.delete(key);
      const obj=normalizeModel(g.scene);
      obj.userData.clips=g.animations||[];
      obj.userData.idle=pickIdle(obj.userData.clips);
      obj.userData.origen=file.name;
      obj.userData.bytes=file.size;
      KILLERS[idx].model=obj;
      renderStatue(idx);
      if(selected===idx) updatePanel(idx);
      resolve(idx);
    },undefined,function(err){
      loadingKeys.delete(key);
      console.warn('[museo] no se pudo leer '+file.name,err);
      if(!opts.silent) toast('No se pudo leer '+file.name);
      resolve(-1);
    });
  });
}
function loadModels(files,opts){
  opts=opts||{};
  const g=groupModels(files);
  if(!g.list.length){
    if(!opts.silent) toast('No hay ningún archivo .glb o .gltf');
    return Promise.resolve([]);
  }
  const total=g.list.length;
  toast(total===1?('Leyendo '+g.list[0].name+'…'):('Cargando '+total+' modelos…'));
  let done=0,lastIdx=-1;
  return g.list.reduce(function(p,file){
    return p.then(function(){
      return loadOne(file,g.map,opts).then(function(idx){
        if(idx>=0) lastIdx=idx;
        done++;
        if(total>1) toast('Modelos cargados: '+done+'/'+total+(idx>=0?' · '+KILLERS[idx].n:''));
      });
    });
  },Promise.resolve()).then(function(){
    Object.keys(g.map).forEach(function(k){ URL.revokeObjectURL(g.map[k]); });
    if(opts.focus!==false&&lastIdx>=0) focusKiller(lastIdx,false);
    if(!opts.silent){
      if(total===1&&lastIdx>=0){
        const k=KILLERS[lastIdx];
        const clips=(k.model&&k.model.userData.clips)||[];
        toast('Cargado en '+k.n+(clips.length?' · '+clips.length+' anim.':''));
      } else {
        toast(done+' modelo(s) cargados'+(lastIdx>=0?' · último: '+KILLERS[lastIdx].n:''));
      }
    }
    return g.list;
  });
}
function loadFiles(files,opts){ return loadModels(files,opts); }
function loadModelUrl(url,id,quiet,opts){
  return new Promise(function(resolve){
    let idx=-1;
    for(let i=0;i<KILLERS.length;i++){ if(KILLERS[i].id===id) idx=i; }
    if(idx<0){ resolve(-1); return; }
    const key=claimLoad(idx,url);
    if(!key){ resolve(idx); return; }
    gltfLoader.load(url,function(g){
      loadingKeys.delete(key);
      const obj=normalizeModel(g.scene,opts);
      obj.userData.clips=g.animations||[];
      obj.userData.idle=pickIdle(obj.userData.clips);
      obj.userData.origen=url;
      KILLERS[idx].model=obj;
      renderStatue(idx);
      if(selected===idx) updatePanel(idx);
      if(!quiet) focusKiller(idx,false);
      resolve(idx);
    },undefined,function(err){
      loadingKeys.delete(key);
      console.warn('[museo] no se pudo cargar '+url,err);
      if(!quiet) toast('No se pudo cargar '+url);
      resolve(-1);
    });
  });
}
const fileInput=document.getElementById('fileInput');
document.getElementById('loadBtn').addEventListener('click',function(){fileInput.click();});
fileInput.addEventListener('change',function(){ if(this.files&&this.files.length) loadFiles(this.files); this.value=''; });

function walkEntry(entry){
  return new Promise(function(res){
    if(!entry){ res([]); return; }
    if(entry.isFile){ entry.file(function(f){res([f]);},function(){res([]);}); return; }
    const reader=entry.createReader(),acc=[];
    (function step(){
      reader.readEntries(function(ents){
        if(!ents||!ents.length){
          Promise.all(acc.map(walkEntry)).then(function(l){let o=[];l.forEach(function(x){o=o.concat(x);});res(o);});
          return;
        }
        acc.push.apply(acc,Array.prototype.slice.call(ents));
        step();
      },function(){res([]);});
    })();
  });
}
function filesFromDT(dt){
  const entries=[];
  if(dt.items){
    for(let i=0;i<dt.items.length;i++){
      const it=dt.items[i];
      if(it.kind!=='file') continue;
      const e=it.webkitGetAsEntry?it.webkitGetAsEntry():null;
      if(e) entries.push(e);
    }
  }
  const plain=dt.files?Array.prototype.slice.call(dt.files):[];
  if(!entries.length) return Promise.resolve(plain);
  return Promise.all(entries.map(walkEntry)).then(function(l){
    let o=[];l.forEach(function(x){o=o.concat(x);});
    return o.length?o:plain;
  });
}
let LIB=null;
canvas.addEventListener('dragover',function(e){e.preventDefault();});
canvas.addEventListener('drop',function(e){
  e.preventDefault();
  if(!e.dataTransfer) return;
  filesFromDT(e.dataTransfer).then(function(files){
    if(!files||!files.length) return;
    loadFiles(files);
    if(LIB&&LIB.autoSave()) LIB.save(files);
  });
});

function onResize(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.fov=camera.aspect<1?74:60;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
}
window.addEventListener('resize',onResize);
onResize();

document.getElementById('saveBtn').addEventListener('click',function(){
  const clone=document.documentElement.cloneNode(true);
  const cvs=clone.querySelectorAll('canvas');
  for(let i=0;i<cvs.length;i++){ if(cvs[i].parentNode) cvs[i].parentNode.removeChild(cvs[i]); }
  const stg=clone.querySelector('#stage'); if(stg) stg.innerHTML='';
  const ld=clone.querySelector('#loading'); if(ld) ld.classList.remove('gone');
  const it=clone.querySelector('#intro'); if(it) it.classList.remove('hidden');
  const ts=clone.querySelector('#toast'); if(ts) ts.classList.remove('show');
  const blob=new Blob(['<!DOCTYPE html>\n'+clone.outerHTML],{type:'text/html;charset=utf-8'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='museo-dbd.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
  toast('Guardado como museo-dbd.html');
});
document.getElementById('enterBtn').addEventListener('click',function(){
  document.getElementById('intro').classList.add('hidden');
  document.body.classList.add('inside');
  walk={x:0,z:startZ+3.2,look:null,then:null,left:6};
});

/* Focos reales: se reparten entre las figuras más cercanas al visitante. */
function updateSpots(dt){
  const order=statues.map(function(s,i){const dx=s.x-player.x,dz=s.z-player.z;return [i,dx*dx+dz*dz];})
    .sort(function(a,b){return a[1]-b[1];}).slice(0,SPOTS.length).map(function(a){return a[0];});
  const want=new Set(order);
  SPOTS.forEach(function(sp){ if(sp.userData.i>=0&&!want.has(sp.userData.i)) sp.userData.i=-1; });
  order.forEach(function(i){
    if(SPOTS.some(function(sp){return sp.userData.i===i;})) return;
    const sp=SPOTS.find(function(sp){return sp.userData.i<0&&sp.intensity<3;})||SPOTS.find(function(sp){return sp.userData.i<0;});
    if(!sp) return;
    const s=statues[i],inward=s.x<0?1:-1;
    sp.userData.i=i;
    sp.intensity=0;
    sp.position.set(s.x+inward*0.9,HALL_H-0.2,s.z+0.5);
    sp.target.position.set(s.x,PED_H+0.9,s.z);
    sp.target.updateMatrixWorld();
  });
  const k=1-Math.exp(-dt*4);
  SPOTS.forEach(function(sp){
    const t=sp.userData.i<0?0:(inspect&&inspect.i===sp.userData.i?SPOT_I*1.45:SPOT_I);
    sp.intensity+=(t-sp.intensity)*k;
  });
}
function updateStatues(dt){
  for(let i=0;i<statues.length;i++){
    const st=statues[i];
    if(inspect&&inspect.i===i){
      if(!drag){ st.spin+=st.vel*dt; st.vel*=Math.exp(-dt*2.6); }
    } else if(st.spin!==0){
      st.vel=0;
      st.spin=Math.atan2(Math.sin(st.spin),Math.cos(st.spin));
      st.spin*=Math.exp(-dt*2.2);
      if(Math.abs(st.spin)<1e-3) st.spin=0;
    }
    st.pivot.rotation.y=st.base+st.spin;
  }
  mixers.forEach(function(m,i){
    const s=statues[i],dx=s.x-player.x,dz=s.z-player.z;
    if(dx*dx+dz*dz<900) m.update(dt);
  });
  /* Después de las animaciones: la respiración se suma a lo que dejan. */
  for(let i=0;i<statues.length;i++){
    const st=statues[i];
    if(!st.breath) continue;
    const dx=st.x-player.x,dz=st.z-player.z;
    if(dx*dx+dz*dz<900) breathe(st,clock.elapsedTime);
  }
}

const clock=new THREE.Clock();
let __sched=false;
function animate(){
  if(!__sched){__sched=true;requestAnimationFrame(function(){__sched=false;animate();});}
  const dt=Math.min(clock.getDelta(),0.05);
  updatePlayer(dt);
  updateHover();
  updateSpots(dt);
  updateStatues(dt);
  if(walk&&!walk.look){ marker.material.opacity=0.55+0.35*Math.sin(performance.now()*0.008); }
  camera.position.set(player.x,player.y+(inspect?0:Math.sin(player.bob)*0.02),player.z);
  camera.rotation.set(player.pitch,player.yaw,0);
  renderer.render(scene,camera);
}
animate();
window.__MUSEUM__={scene:scene,camera:camera,player:player,statues:statues,KILLERS:KILLERS,focus:focusKiller,walkTo:walkTo,exit:exitInspect,mixers:mixers,loadFiles:loadFiles,debug:{match:matchKillerSmart,idle:pickIdle},who:function(){return inspect?inspect.i:-1;}};
(function(){var l=document.getElementById('loading');if(l)l.classList.add('gone');window.__READY__=true;setInterval(function(){if(document.hidden)animate();},100);})();

/* ==========================================================================
   Carga de modelos reales
   1. Boton "Biblioteca": guarda los .glb en el navegador o los lee de una
      carpeta del disco, sin copiarlos al proyecto.
   2. Boton "Cargar carpeta": selecciona la carpeta models entera.
   3. Arrastra .glb sobre la escena.
   4. Si sirves el proyecto por http (servir.bat), se lee models/manifest.json
      automaticamente al arrancar.
   Convencion de nombres:  <id-asesino>.glb   (un unico modelo base)
   ========================================================================== */
(function(){
  var di=document.createElement('input');
  di.type='file';
  di.multiple=true;
  di.style.display='none';
  if('webkitdirectory' in di) di.webkitdirectory=true;
  document.body.appendChild(di);
  di.addEventListener('change',function(){ if(this.files&&this.files.length) loadFiles(this.files); this.value=''; });
  var btn=document.createElement('button');
  btn.className='tbtn desk';
  btn.textContent='Cargar carpeta';
  btn.title='Selecciona la carpeta models, o la carpeta que descargaste de Sketchfab';
  btn.addEventListener('click',function(){ di.click(); });
  var tb=document.getElementById('topbar');
  tb.insertBefore(btn,tb.children[1]||null);

  if(location.protocol==='file:'){
    console.warn('[museo] En file:// el navegador no puede leer archivos locales por su cuenta: ejecuta servir.bat, o carga el modelo con "Cargar .glb" o arrastrandolo.');
    return;
  }
  fetch('models/manifest.json',{cache:'no-store'}).then(function(r){ return r.ok?r.json():null; }).then(function(m){
    if(!m||!m.killers) return;
    /* De uno en uno y por orden de sala: primero los más cercanos a la entrada. */
    var list=[];
    Object.keys(m.killers).forEach(function(id){
      var entry=m.killers[id];
      if(Array.isArray(entry)) entry=entry[0];
      if(!entry) return;
      var url=(typeof entry==='string')?entry:entry.url;
      var idx=KILLERS.findIndex(function(k){ return k.id===id; });
      if(url&&idx>=0) list.push({id:id,url:url,idx:idx,opts:(typeof entry==='object')?entry:null});
    });
    list.sort(function(a,b){ return a.idx-b.idx; });
    list.reduce(function(p,e){
      return p.then(function(){ return loadModelUrl(e.url,e.id,true,e.opts); });
    },Promise.resolve()).then(function(){
      if(list.length) toast(list.length+' modelos 3D en la sala');
    });
  }).catch(function(){});
})();

/* ==========================================================================
   Biblioteca de modelos: guarda todos tus .glb en el navegador (IndexedDB)
   o los lee de una carpeta de tu disco (File System Access), sin copiarlos
   dentro del proyecto. Boton "Biblioteca" en la barra superior.
   ========================================================================== */
try{
  LIB=initLibrary({
    KILLERS:KILLERS,
    toast:toast,
    topbar:document.getElementById('topbar'),
    labelFor:function(name){
      return KILLERS[killerForFile(name)].n;
    },
    onFiles:function(files){
      const has=Array.prototype.some.call(files,function(f){ return /\.(glb|gltf)$/i.test(f.name); });
      if(has) loadFiles(files,{focus:false});
    }
  });
  window.__MUSEUM__.library=LIB;
}catch(e){
  console.warn('[museo] biblioteca no disponible:',e);
}