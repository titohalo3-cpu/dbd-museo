window.addEventListener('error',function(e){window.__ERR__=String(e.message||(e.error&&e.error.message)||e);});

import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
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

function plateTexture(k){
  const c=document.createElement('canvas');
  c.width=512; c.height=170;
  const x=c.getContext('2d');
  x.fillStyle='#0a0a0c'; x.fillRect(0,0,512,170);
  x.strokeStyle=k.col[1]; x.globalAlpha=0.85; x.lineWidth=3; x.strokeRect(12,12,488,146); x.globalAlpha=1;
  x.textAlign='center';
  x.fillStyle=k.col[1];
  x.font='600 16px Inter, sans-serif';
  x.fillText(k.c.toUpperCase(),256,48);
  let fs=34;
  const name=k.n.toUpperCase();
  x.font='600 '+fs+'px Cinzel, Georgia, serif';
  while(x.measureText(name).width>452&&fs>17){fs-=2;x.font='600 '+fs+'px Cinzel, Georgia, serif';}
  x.fillStyle='#f0ede5';
  x.fillText(name,256,104);
  x.fillStyle='#7d7a74';
  x.font='400 12px Inter, sans-serif';
  x.fillText('DEAD BY DAYLIGHT',256,138);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=8;
  return t;
}

function buildPedestal(k,row){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1.14,0.18,32),std('#17171c',0.8,0.12));
  base.position.y=0.09; g.add(base);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.84,0.92,1.06,32),std('#1b1b21',0.72,0.16));
  col.position.y=0.71; g.add(col);
  const top=new THREE.Mesh(new THREE.CylinderGeometry(1.0,0.88,0.12,32),std('#23232a',0.6,0.22));
  top.position.y=1.3; g.add(top);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.93,0.017,8,64),new THREE.MeshBasicMaterial({color:k.col[1]}));
  ring.rotation.x=Math.PI/2; ring.position.y=1.245; g.add(ring);
  const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.5,0.5),new THREE.MeshBasicMaterial({map:plateTexture(k)}));
  plate.position.set(row?-0.9:0.9,0.78,0);
  plate.rotation.y=row?-Math.PI/2:Math.PI/2;
  g.add(plate);
  return g;
}

const perRow=Math.ceil(KILLERS.length/2);
const gap=4.7;
const startZ=(perRow-1)*gap/2;
const hallLen=startZ*2+16;

const stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.className='app-canvas';
stage.appendChild(renderer.domElement);

const scene=new THREE.Scene();
scene.background=new THREE.Color('#060608');
scene.fog=new THREE.FogExp2('#060608',0.0115);

const camera=new THREE.PerspectiveCamera(42,window.innerWidth/window.innerHeight,0.1,320);
camera.position.set(0,3.0,startZ+6.5);

const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=0.06;
controls.enablePan=false;
controls.minDistance=1.7;
controls.maxDistance=13;
controls.minPolarAngle=0.45;
controls.maxPolarAngle=1.53;
controls.target.set(0,2.0,startZ);

/* Limites del interior: la camara no puede atravesar muros, suelo ni techo. */
const ROOM={
  minX:-12.05,maxX:12.05,
  minY:0.55,maxY:8.45,
  minZ:-(startZ+7.65),maxZ:startZ+7.65
};
function clampCamera(){
  const p=camera.position;
  if(p.x<ROOM.minX)p.x=ROOM.minX; else if(p.x>ROOM.maxX)p.x=ROOM.maxX;
  if(p.y<ROOM.minY)p.y=ROOM.minY; else if(p.y>ROOM.maxY)p.y=ROOM.maxY;
  if(p.z<ROOM.minZ)p.z=ROOM.minZ; else if(p.z>ROOM.maxZ)p.z=ROOM.maxZ;
}

const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;

scene.add(new THREE.AmbientLight('#4b4b66',0.85));
scene.add(new THREE.HemisphereLight('#8f97b8','#0a0a0c',0.35));
const dir=new THREE.DirectionalLight('#ffd9a0',0.45);
dir.position.set(6,14,8);
scene.add(dir);
for(let z=startZ;z>-startZ-4;z-=13){
  const pl=new THREE.PointLight('#ffb877',26,30,2);
  pl.position.set(0,6.6,z);
  scene.add(pl);
}
const spot=new THREE.SpotLight('#ffd9b0',150,28,0.5,0.62,1.3);
spot.position.set(0,8.6,0);
scene.add(spot);
scene.add(spot.target);

const matStone=std('#15151a',0.85,0.05);
const matDark=std('#0c0c10',0.9,0.05);
const matFloor=std('#0a0a0e',0.28,0.6);
matFloor.envMapIntensity=0.9;

const floor=new THREE.Mesh(new THREE.PlaneGeometry(26,hallLen+14),matFloor);
floor.rotation.x=-Math.PI/2;
scene.add(floor);
const ceil=new THREE.Mesh(new THREE.PlaneGeometry(26,hallLen+14),matStone);
ceil.rotation.x=Math.PI/2;
ceil.position.y=9;
scene.add(ceil);
for(let s=-1;s<=1;s+=2){
  const wall=new THREE.Mesh(new THREE.BoxGeometry(0.6,9,hallLen+14),matStone);
  wall.position.set(s*12.7,4.5,-3);
  scene.add(wall);
  const strip=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.08,hallLen+6),new THREE.MeshBasicMaterial({color:'#8a6a22'}));
  strip.position.set(s*12.35,4.6,-3);
  scene.add(strip);
}
const backWall=new THREE.Mesh(new THREE.BoxGeometry(26,9,0.6),matDark);
backWall.position.set(0,4.5,-startZ-8.2);
scene.add(backWall);
const frontWall=new THREE.Mesh(new THREE.BoxGeometry(26,9,0.6),matDark);
frontWall.position.set(0,4.5,startZ+8.2);
scene.add(frontWall);
for(let z=startZ+4;z>-startZ-6;z-=9.4){
  const beam=new THREE.Mesh(new THREE.BoxGeometry(25.4,0.3,0.32),matDark);
  beam.position.set(0,8.75,z);
  scene.add(beam);
}
for(let s=-1;s<=1;s+=2){
  for(let z=startZ+3;z>-startZ-6;z-=12){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.48,0.55,8.6,16),matStone);
    col.position.set(s*11.6,4.3,z);
    scene.add(col);
    const cap=new THREE.Mesh(new THREE.BoxGeometry(1.3,0.35,1.3),matDark);
    cap.position.set(s*11.6,8.5,z);
    scene.add(cap);
  }
}

const statues=[];
const pivots=[];
KILLERS.forEach(function(k,i){
  const row=i%2;
  const kk=Math.floor(i/2);
  const x=row?3.7:-3.7;
  const z=startZ-kk*gap;
  const ped=buildPedestal(k,row);
  ped.position.set(x,0,z);
  scene.add(ped);
  const pivot=new THREE.Group();
  pivot.position.set(x,1.36,z);
  pivot.rotation.y=row?-Math.PI/2:Math.PI/2;
  pivot.userData.i=i;
  scene.add(pivot);
  pivots.push(pivot);
  statues.push({pivot:pivot,x:x,z:z,row:row,ped:ped});
});

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
  else obj=buildStatue(k,0);
  pivot.add(obj);
  st.renderedKind=src?'glb':'proc';
  if(src && src.userData && src.userData.clips && src.userData.clips.length){
    const mixer=new THREE.AnimationMixer(obj);
    const ci=(src.userData.idle>=0?src.userData.idle:0);
    const act=mixer.clipAction(src.userData.clips[ci]);
    act.play();
    mixers.set(i,mixer);
  }
}
KILLERS.forEach(function(k,i){ renderStatue(i); });

const raycaster=new THREE.Raycaster();
let selected=0;
let flight=null;

function norm(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,' ').trim();
}
function matchKiller(name){
  const n=norm(name);
  let best=selected,bestScore=0;
  for(let i=0;i<KILLERS.length;i++){
    const k=KILLERS[i];
    const cands=[norm(k.n),norm(k.a),norm(k.n.replace('The ',''))];
    for(let c=0;c<cands.length;c++){
      const t=cands[c];
      if(t.length>2&&n.indexOf(t)>=0&&t.length>bestScore){bestScore=t.length;best=i;}
    }
  }
  return best;
}
function measureBox(obj){
  obj.updateMatrixWorld(true);
  const box=new THREE.Box3();
  const v=new THREE.Vector3();
  let any=false;
  obj.traverse(function(n){
    if(!n.isMesh) return;
    if(n.isSkinnedMesh&&n.geometry&&n.geometry.attributes&&n.geometry.attributes.position&&n.applyBoneTransform){
      const pos=n.geometry.attributes.position;
      const step=Math.max(1,Math.floor(pos.count/2500));
      for(let i=0;i<pos.count;i+=step){
        v.fromBufferAttribute(pos,i);
        n.applyBoneTransform(i,v);
        v.applyMatrix4(n.matrixWorld);
        box.expandByPoint(v);
      }
      any=true;
      return;
    }
    if(n.geometry){
      if(!n.geometry.boundingBox) n.geometry.computeBoundingBox();
      box.union(n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld));
      any=true;
    }
  });
  if(!any) box.setFromObject(obj);
  return box;
}
function normalizeModel(obj){
  let box=measureBox(obj);
  const size=box.getSize(new THREE.Vector3());
  const k=2.05/(size.y||1);
  obj.scale.multiplyScalar(k);
  box=measureBox(obj);
  const c=box.getCenter(new THREE.Vector3());
  obj.position.x-=c.x;
  obj.position.z-=c.z;
  obj.position.y-=box.min.y;
  return obj;
}

const roster=document.getElementById('roster');
KILLERS.forEach(function(k,i){
  const d=document.createElement('div');
  d.className='k';
  d.dataset.i=i;
  const num=String(i+1).padStart(2,'0');
  d.innerHTML='<span class="num">'+num+'</span><span class="txt"><span class="nm">'+k.n+'</span><span class="ch">'+k.c+'</span></span>';
  roster.appendChild(d);
});
document.getElementById('footCount').textContent=KILLERS.length+' asesinos';
document.querySelectorAll('.sidefoot span')[1].textContent='un modelo base';

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
  document.getElementById('pChapter').textContent=k.c+' · '+k.y;
  document.getElementById('pNum').textContent=String(i+1).padStart(2,'0')+' / '+KILLERS.length;
  document.getElementById('pWeapon').textContent=k.w;
  document.getElementById('pVariants').textContent='Modelo base';
  document.getElementById('modelState').textContent=k.model?(k.model.userData.origen||'Modelo 3D cargado'):'Estatua procedural';
  document.getElementById('modelState').parentNode.classList.toggle('hasReal',!!k.model);
}
function markActive(i){
  const items=roster.children;
  for(let n=0;n<items.length;n++){ items[n].classList.toggle('active',n===i); }
  if(items[i]&&items[i].scrollIntoView) items[i].scrollIntoView({block:'nearest'});
}
function ease(t){return t<0.5?2*t*t:-1+(4-2*t)*t;}
function ensureRendered(i){
  const st=statues[i];
  if(!st) return;
  const kind=KILLERS[i].model?'glb':'proc';
  if(st.renderedKind!==kind) renderStatue(i);
}
function focusKiller(i,instant){
  if(i<0||i>=statues.length) return;
  selected=i;
  ensureRendered(i);
  const st=statues[i];
  const inward=st.x<0?1:-1;
  const to=new THREE.Vector3(st.x,2.05,st.z);
  const pc=new THREE.Vector3(st.x+inward*3.2,2.6,st.z+2.6);
  if(instant){camera.position.copy(pc);controls.target.copy(to);flight=null;controls.enabled=true;}
  else{flight={t:0,p0:camera.position.clone(),p1:pc,t0:controls.target.clone(),t1:to};controls.enabled=false;}
  updatePanel(i);
  markActive(i);
}
roster.addEventListener('click',function(e){
  const el=e.target.closest?e.target.closest('.k'):null;
  if(!el) return;
  focusKiller(parseInt(el.dataset.i,10),false);
  if(window.innerWidth<=880) document.getElementById('sidebar').classList.remove('open');
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
    if(id&&(n===id||words.indexOf(id)>=0)) return i;
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
function loadModelUrl(url,id,quiet){
  let idx=-1;
  for(let i=0;i<KILLERS.length;i++){ if(KILLERS[i].id===id) idx=i; }
  if(idx<0) return;
  const key=claimLoad(idx,url);
  if(!key) return;
  gltfLoader.load(url,function(g){
    loadingKeys.delete(key);
    const obj=normalizeModel(g.scene);
    obj.userData.clips=g.animations||[];
    obj.userData.idle=pickIdle(obj.userData.clips);
    obj.userData.origen=url;
    KILLERS[idx].model=obj;
    renderStatue(idx);
    if(selected===idx) updatePanel(idx);
    if(!quiet) focusKiller(idx,false);
  },undefined,function(err){
    loadingKeys.delete(key);
    if(!quiet) toast('No se pudo cargar '+url);
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
renderer.domElement.addEventListener('dragover',function(e){e.preventDefault();});
renderer.domElement.addEventListener('drop',function(e){
  e.preventDefault();
  if(!e.dataTransfer) return;
  filesFromDT(e.dataTransfer).then(function(files){
    if(!files||!files.length) return;
    loadFiles(files);
    if(LIB&&LIB.autoSave()) LIB.save(files);
  });
});

let downPos=null;
renderer.domElement.addEventListener('pointerdown',function(e){downPos={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',function(e){
  if(!downPos) return;
  const dx=e.clientX-downPos.x,dy=e.clientY-downPos.y;
  downPos=null;
  if(dx*dx+dy*dy>36) return;
  const rect=renderer.domElement.getBoundingClientRect();
  const pointer=new THREE.Vector2(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(pivots,true);
  if(hits.length){
    let o=hits[0].object;
    while(o&&o.userData.i===undefined) o=o.parent;
    if(o&&o.userData.i!==undefined) focusKiller(o.userData.i,false);
  }
});
window.addEventListener('keydown',function(e){
  if(e.target&&e.target.tagName==='INPUT') return;
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){focusKiller((selected+1)%KILLERS.length,false);e.preventDefault();}
  if(e.key==='ArrowLeft'||e.key==='ArrowUp'){focusKiller((selected-1+KILLERS.length)%KILLERS.length,false);e.preventDefault();}
});
window.addEventListener('resize',function(){
  camera.aspect=window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});

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
  focusKiller(0,false);
});

const clock=new THREE.Clock();
let __sched=false;
function animate(){
  if(!__sched){__sched=true;requestAnimationFrame(function(){__sched=false;animate();});}
  const dt=Math.min(clock.getDelta(),0.05);
  if(flight){
    flight.t=Math.min(1,flight.t+dt/0.85);
    const e=ease(flight.t);
    camera.position.lerpVectors(flight.p0,flight.p1,e);
    controls.target.lerpVectors(flight.t0,flight.t1,e);
    if(flight.t>=1){flight=null;controls.enabled=true;}
  }
  const s=statues[selected];
  if(s){
    const inward=s.x<0?1:-1;
    spot.position.set(s.x+inward*1.7,8.6,s.z+1.7);
    spot.target.position.set(s.x,1.9,s.z);
    spot.target.updateMatrixWorld();
  }
  mixers.forEach(function(m){ m.update(dt); });
  controls.update();
  clampCamera();
  renderer.render(scene,camera);
}
animate();
window.__MUSEUM__={scene:scene,camera:camera,controls:controls,statues:statues,KILLERS:KILLERS,focus:focusKiller,mixers:mixers,loadFiles:loadFiles,clamp:clampCamera,debug:{match:matchKillerSmart,idle:pickIdle},who:function(){return selected;}};
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
  btn.className='tbtn';
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
    var n=0;
    Object.keys(m.killers).forEach(function(id){
      var entry=m.killers[id];
      if(Array.isArray(entry)) entry=entry[0];
      if(!entry) return;
      var url=(typeof entry==='string')?entry:entry.url;
      if(!url) return;
      loadModelUrl(url,id,true);
      n++;
    });
    if(n) setTimeout(function(){ toast(n+' modelo(s) del manifest cargados'); },1200);
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