// Servidor de desarrollo sin dependencias: node dev-server.js [puerto]
// Sirve la carpeta del proyecto sin caché, para ver los cambios al recargar.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2]) || 8080;
const ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.json': 'application/json'
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, url.endsWith('/') ? url + 'index.html' : url);
  // No sale de la carpeta del proyecto (../) ni sirve el repositorio o las dependencias
  if (!file.startsWith(ROOT + path.sep) || /[\\/](\.git|node_modules)([\\/]|$)/.test(file)) {
    res.writeHead(403).end('403');
    return;
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end('404');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}`));
