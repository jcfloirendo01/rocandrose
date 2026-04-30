const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Redirect /page.html → /page (canonical clean URLs, matches .htaccess)
  if (urlPath !== '/' && urlPath.endsWith('.html')) {
    const clean = urlPath.slice(0, -5) || '/';
    res.writeHead(301, { Location: clean });
    res.end();
    return;
  }

  // Resolve file path
  let filePath;
  if (urlPath === '/') {
    filePath = path.join(ROOT, 'index.html');
  } else if (!path.extname(urlPath)) {
    filePath = path.join(ROOT, urlPath + '.html');
  } else {
    filePath = path.join(ROOT, urlPath);
  }

  // Security: stay within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end(); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  Roc & Rose dev server → http://localhost:${PORT}\n`);
});
