/* Servidor de herramientas: sirve el proyecto y guarda los .glb que exporta el navegador.
   Uso:  node tools/save-server.js   ->  http://127.0.0.1:8099/
   POST /save?name=archivo.glb  (cuerpo binario)  ->  models/archivo.glb */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'models');
const PORT = 8099;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8'
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'POST' && url.pathname === '/save') {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      const name = path.basename(url.searchParams.get('name') || 'model.glb');
      if (!/\.(glb|png)$/i.test(name)) { res.writeHead(400); res.end('solo .glb o .png'); return; }
      if (!buf.length) { res.writeHead(400); res.end('vacio'); return; }
      fs.writeFileSync(path.join(OUT, name), buf);
      const head = buf.toString('ascii', 0, 4);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, file: name, bytes: buf.length, magic: head }));
    });
    return;
  }

  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/tools/build-trickster.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('no encontrado: ' + rel); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('Servidor: http://127.0.0.1:' + PORT + '/');
});
