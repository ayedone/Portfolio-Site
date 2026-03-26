const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname);
const mime = {
  '.html':'text/html','.css':'text/css','.js':'text/javascript',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg',
  '.gif':'image/gif','.webp':'image/webp','.ico':'image/x-icon',
  '.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav',
  '.json':'application/json','.woff':'font/woff','.woff2':'font/woff2'
};
http.createServer((req, res) => {
  let f = path.join(root, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('Not found: ' + f); return; }
    const ext = path.extname(f);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    res.end(d);
  });
}).listen(3000, () => console.log('Listening on 3000'));
