/* =========================================================================
   Biblioteca de modelos del museo
   -------------------------------------------------------------------------
   Dos formas de tener TODOS tus .glb sin copiarlos al proyecto:

   1. Carpeta vinculada (File System Access API): eliges una carpeta del disco
      (por ejemplo D:\Modelos DBD) y el museo la lee directamente cada vez que
      se lo pidas. No se copia ni un byte.
   2. Biblioteca interna (IndexedDB): los archivos que anadas o arrastres quedan
      guardados en el almacenamiento del navegador y se cargan solos al abrir
      el museo. Tampoco ocupan espacio en la carpeta del proyecto.

   El proyecto solo guarda codigo: index.html, js/ y models/manifest.json.
   ========================================================================= */

const DB_NAME = 'dbd-museo';
const DB_VER = 1;
const ST_FILES = 'files';
const ST_KV = 'kv';
const MODEL_EXT = /\.(glb|gltf)$/i;
const ASSET_EXT = /\.(glb|gltf|bin|png|jpg|jpeg|webp|ktx2)$/i;

function openDB(){
  return new Promise(function(res, rej){
    let req;
    try{ req = indexedDB.open(DB_NAME, DB_VER); }
    catch(e){ rej(e); return; }
    req.onupgradeneeded = function(){
      const db = req.result;
      if(!db.objectStoreNames.contains(ST_FILES)) db.createObjectStore(ST_FILES, {keyPath:'path'});
      if(!db.objectStoreNames.contains(ST_KV)) db.createObjectStore(ST_KV, {keyPath:'key'});
    };
    req.onsuccess = function(){ res(req.result); };
    req.onerror = function(){ rej(req.error); };
    req.onblocked = function(){ rej(new Error('Base de datos bloqueada')); };
  });
}
function op(store, mode, fn){
  return openDB().then(function(db){
    return new Promise(function(res, rej){
      let t;
      try{ t = db.transaction(store, mode); }catch(e){ rej(e); return; }
      let rq;
      try{ rq = fn(t.objectStore(store)); }catch(e){ rej(e); return; }
      t.oncomplete = function(){ res(rq ? rq.result : undefined); };
      t.onerror = function(){ rej(t.error); };
      t.onabort = function(){ rej(t.error || new Error('transaccion abortada')); };
    });
  });
}
const dbAll   = function(st){ return op(st,'readonly', function(s){ return s.getAll(); }); };
const dbPut   = function(st,v){ return op(st,'readwrite',function(s){ return s.put(v); }); };
const dbDel   = function(st,k){ return op(st,'readwrite',function(s){ return s.delete(k); }); };
const dbClear = function(st){ return op(st,'readwrite',function(s){ return s.clear(); }); };

function fmtBytes(b){
  if(!b) return '0 B';
  if(b < 1024) return b + ' B';
  if(b < 1048576) return (b/1024).toFixed(0) + ' KB';
  if(b < 1073741824) return (b/1048576).toFixed(1) + ' MB';
  return (b/1073741824).toFixed(2) + ' GB';
}
function pad(x){ return String(x).padStart(2,'0'); }

export function initLibrary(deps){
  const onFiles = deps.onFiles;
  const toast = deps.toast || function(){};
  const labelFor = deps.labelFor || function(n){ return n; };
  const topbar = deps.topbar || document.getElementById('topbar');

  const st = { dirHandle:null, auto:true, busy:false };

  /* ---------------------------------------------------------------- estilos */
  const style = document.createElement('style');
  style.textContent = `
#libBackdrop{position:fixed;inset:0;z-index:79;background:rgba(3,3,5,.74);backdrop-filter:blur(3px);display:none}
#libBackdrop.open{display:block}
#libPanel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(780px,calc(100vw - 36px));max-height:min(80vh,780px);z-index:80;display:none;flex-direction:column;background:linear-gradient(160deg,rgba(16,16,20,.99),rgba(9,9,12,.99));border:1px solid rgba(201,162,39,.3);box-shadow:0 30px 90px rgba(0,0,0,.75);font-family:Inter,system-ui,sans-serif;color:#eae7e0}
#libPanel.open{display:flex}
.libHead{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,.07)}
.libTitle{font-family:Cinzel,Georgia,serif;font-size:19px;letter-spacing:.02em}
.libHead button{background:transparent;border:1px solid rgba(255,255,255,.14);color:#c9c6c0;width:30px;height:30px;cursor:pointer;font-size:11px}
.libHead button:hover{border-color:rgba(201,162,39,.6);color:#fff}
.libBody{padding:18px 22px;overflow:auto}
.libRow{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:9px}
.libRow button{flex:1 1 180px;background:transparent;border:1px solid rgba(255,255,255,.14);color:#c9c6c0;font:inherit;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:12px 10px;cursor:pointer;transition:.18s}
.libRow button:hover{border-color:rgba(201,162,39,.6);color:#fff;background:rgba(201,162,39,.1)}
.libRow button.pri{border-color:rgba(201,162,39,.5);color:#c9a227}
.libRow button:disabled{opacity:.4;cursor:default}
.libRow button.danger:hover{border-color:rgba(163,18,27,.85);background:rgba(163,18,27,.18);color:#fff}
.libChk{display:flex;align-items:center;gap:9px;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#8d8a85;margin:8px 0 14px;cursor:pointer}
.libStat{font-size:11px;color:#b9b6b0;line-height:1.75;border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);padding:12px 0;margin-bottom:12px}
.libStat b{color:#c9a227;font-weight:500}
.libList{display:flex;flex-direction:column;gap:5px}
.libItem{display:flex;align-items:center;gap:12px;padding:9px 12px;background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.05)}
.libItem .nm{flex:1 1 auto;min-width:0;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.libItem .to{flex:0 0 auto;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#8d8a85}
.libItem .sz{flex:0 0 auto;font-size:9.5px;color:#6f6d69;font-variant-numeric:tabular-nums}
.libItem button{flex:0 0 auto;background:transparent;border:1px solid rgba(255,255,255,.12);color:#a9a6a0;width:24px;height:24px;line-height:1;cursor:pointer;font-size:10px}
.libItem button:hover{border-color:rgba(163,18,27,.7);color:#fff}
.libNote{font-size:10px;color:#6f6d69;line-height:1.75;margin-top:12px}
.libNote b{color:#a7a49e;font-weight:500}
.libWarn{color:#c98a2a}
`;
  document.head.appendChild(style);

  /* ------------------------------------------------------------------ panel */
  const back = document.createElement('div'); back.id = 'libBackdrop';
  const panel = document.createElement('div'); panel.id = 'libPanel';
  panel.innerHTML =
    '<div class="libHead"><div class="libTitle">Biblioteca de modelos</div><button id="libClose" title="Cerrar">✕</button></div>' +
    '<div class="libBody">' +
      '<div class="libRow">' +
        '<button id="libDir" class="pri">Vincular carpeta del disco…</button>' +
        '<button id="libAdd">Añadir archivos…</button>' +
      '</div>' +
      '<div class="libRow">' +
        '<button id="libRescan">Re-escanear carpeta</button>' +
        '<button id="libClear" class="danger">Vaciar biblioteca</button>' +
      '</div>' +
      '<label class="libChk"><input type="checkbox" id="libAuto" checked> Guardar aquí lo que arrastre a la escena</label>' +
      '<div class="libStat" id="libStat">Sin modelos guardados.</div>' +
      '<div class="libList" id="libList"></div>' +
      '<div class="libNote" id="libNote"></div>' +
    '</div>';
  document.body.appendChild(back);
  document.body.appendChild(panel);

  const $ = function(id){ return document.getElementById(id); };
  const note = function(html){ $('libNote').innerHTML = html; };

  function open(){ panel.classList.add('open'); back.classList.add('open'); refresh(); }
  function close(){ panel.classList.remove('open'); back.classList.remove('open'); }

  $('libClose').addEventListener('click', close);
  back.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });

  const libBtn = document.createElement('button');
  libBtn.className = 'tbtn';
  libBtn.id = 'libBtn';
  libBtn.textContent = 'Biblioteca';
  libBtn.title = 'Guarda todos tus .glb en el navegador, sin copiarlos al proyecto';
  libBtn.addEventListener('click', open);
  if(topbar) topbar.insertBefore(libBtn, topbar.children[2] || null);

  /* ------------------------------------------------------------ utilidades */
  function filesFromRows(rows){
    return rows
      .filter(function(r){ return ASSET_EXT.test(r.name); })
      .map(function(r){ return new File([r.blob], r.name, {type: r.type || ''}); });
  }
  function modelNames(rows){
    return rows.filter(function(r){ return MODEL_EXT.test(r.name); }).map(function(r){ return r.name; });
  }

  async function refresh(){
    let rows = [];
    try{ rows = await dbAll(ST_FILES); }catch(e){ note('<span class="libWarn">IndexedDB no disponible en este navegador.</span>'); return; }
    const bytes = rows.reduce(function(a,r){ return a + (r.size || 0); }, 0);
    const models = modelNames(rows);
    const dirTxt = st.dirHandle ? ('<b>' + st.dirHandle.name + '</b>') : '<i>ninguna</i>';
    let quota = '';
    try{
      if(navigator.storage && navigator.storage.estimate){
        const q = await navigator.storage.estimate();
        if(q && q.quota) quota = ' de ' + fmtBytes(q.quota) + ' disponibles';
      }
    }catch(e){}
    $('libStat').innerHTML =
      'Carpeta vinculada: ' + dirTxt + '<br>' +
      'Guardados en el navegador: <b>' + models.length + '</b> modelo(s) · ' + rows.length + ' archivo(s) · <b>' + fmtBytes(bytes) + '</b>' + quota;
    const list = $('libList');
    list.innerHTML = '';
    rows.slice().sort(function(a,b){ return a.path.localeCompare(b.path); }).forEach(function(r){
      const isModel = MODEL_EXT.test(r.name);
      const el = document.createElement('div');
      el.className = 'libItem';
      el.innerHTML = '<span class="nm">' + r.name + '</span>' +
        (isModel ? '<span class="to">' + labelFor(r.name) + '</span>' : '<span class="to">recurso</span>') +
        '<span class="sz">' + fmtBytes(r.size) + '</span>' +
        '<button title="Quitar de la biblioteca">✕</button>';
      el.querySelector('button').addEventListener('click', async function(){
        try{ await dbDel(ST_FILES, r.path); }catch(e){}
        el.remove();
        refresh();
      });
      list.appendChild(el);
    });
    $('libRescan').disabled = !st.dirHandle;
  }

  /* ------------------------------------------------- 1. carpeta vinculada  */
  async function ensurePerm(handle, ask){
    if(!handle) return false;
    const opt = {mode:'read'};
    try{
      if(await handle.queryPermission(opt) === 'granted') return true;
      if(!ask) return false;
      return (await handle.requestPermission(opt)) === 'granted';
    }catch(e){ return false; }
  }

  async function scanDir(handle){
    const files = [];
    async function walk(h, prefix){
      for await (const entry of h.values()){
        const path = prefix ? prefix + '/' + entry.name : entry.name;
        if(entry.kind === 'directory'){ await walk(entry, path); }
        else if(ASSET_EXT.test(entry.name)){
          try{ const f = await entry.getFile(); files.push(f); }catch(e){}
        }
      }
    }
    await walk(handle, '');
    const models = files.filter(function(f){ return MODEL_EXT.test(f.name); });
    if(!models.length){ toast('Esa carpeta no tiene ningún .glb ni .gltf'); return 0; }
    toast('Cargando ' + models.length + ' modelo(s) de «' + handle.name + '»…');
    onFiles(files, {from:'carpeta'});
    return models.length;
  }

  $('libDir').addEventListener('click', async function(){
    if(!window.showDirectoryPicker){
      note('<span class="libWarn">Tu navegador no permite vincular carpetas. Usa «Añadir archivos» o arrastra los modelos a la escena.</span>');
      return;
    }
    try{
      const h = await window.showDirectoryPicker({id:'dbd-modelos', mode:'read'});
      st.dirHandle = h;
      try{ await dbPut(ST_KV, {key:'dir', handle:h}); }catch(e){}
      await refresh();
      await scanDir(h);
    }catch(e){
      if(e && e.name !== 'AbortError') note('<span class="libWarn">No se pudo vincular la carpeta: ' + e.message + '</span>');
    }
  });

  $('libRescan').addEventListener('click', async function(){
    if(!st.dirHandle) return;
    if(await ensurePerm(st.dirHandle, true)) await scanDir(st.dirHandle);
    else note('<span class="libWarn">Permiso denegado para «' + st.dirHandle.name + '».</span>');
  });

  /* ------------------------------------------------- 2. añadir archivos    */
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.multiple = true;
  picker.accept = '.glb,.gltf,.bin,.png,.jpg,.jpeg,.webp,.ktx2';
  picker.style.display = 'none';
  document.body.appendChild(picker);

  $('libAdd').addEventListener('click', function(){ picker.click(); });
  picker.addEventListener('change', async function(){
    if(this.files && this.files.length){
      const n = await save(this.files);
      onFiles(Array.prototype.slice.call(this.files), {from:'biblioteca'});
      if(n) note('Guardados <b>' + n + '</b> archivo(s) en el navegador. Se cargarán solos la próxima vez.');
    }
    this.value = '';
  });

  async function save(list){
    const arr = Array.prototype.slice.call(list).filter(function(f){ return ASSET_EXT.test(f.name); });
    let n = 0, failed = 0;
    for(const f of arr){
      try{
        await dbPut(ST_FILES, {path:f.name, name:f.name, size:f.size, type:f.type || '', blob:f, added:Date.now()});
        n++;
      }catch(e){
        failed++;
        if(e && (e.name === 'QuotaExceededError' || String(e).indexOf('Quota') >= 0)){
          note('<span class="libWarn">Sin espacio en el navegador: se han guardado ' + n + ' de ' + arr.length + ' archivos. Usa «Vincular carpeta» para no duplicar nada.</span>');
          break;
        }
      }
    }
    await refresh();
    return n;
  }

  $('libClear').addEventListener('click', async function(){
    try{ await dbClear(ST_FILES); }catch(e){}
    await refresh();
    note('Biblioteca vaciada. Los modelos que estén cargados siguen en la escena hasta que recargues.');
    toast('Biblioteca vaciada');
  });

  $('libAuto').addEventListener('change', function(){ st.auto = this.checked; });
  st.auto = $('libAuto').checked;

  /* ----------------------------------------------------------- arranque    */
  (async function startup(){
    // Carpeta recordada
    try{
      const kv = await op(ST_KV, 'readonly', function(s){ return s.get('dir'); });
      if(kv && kv.handle){
        st.dirHandle = kv.handle;
        await refresh();
        if(await ensurePerm(kv.handle, false)){
          await scanDir(kv.handle);
          return;
        }
        note('Carpeta recordada: <b>' + kv.handle.name + '</b>. Pulsa <b>Re-escanear carpeta</b> para volver a cargarla (el navegador pide permiso una vez por sesión).');
        return;
      }
    }catch(e){}

    // Modelos guardados en el navegador
    try{
      const rows = await dbAll(ST_FILES);
      await refresh();
      const models = modelNames(rows);
      if(!models.length) return;
      const files = filesFromRows(rows);
      toast('Cargando ' + models.length + ' modelo(s) de la biblioteca…');
      onFiles(files, {from:'biblioteca'});
    }catch(e){}
  })();

  if(navigator.storage && navigator.storage.persist){
    try{ navigator.storage.persist(); }catch(e){}
  }

  return {
    open: open,
    save: save,
    refresh: refresh,
    autoSave: function(){ return st.auto; },
    state: st
  };
}
