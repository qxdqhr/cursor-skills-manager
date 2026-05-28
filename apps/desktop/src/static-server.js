const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

function proxyRequest(req, res, apiOrigin) {
  const target = new URL(req.url ?? '/', apiOrigin);
  const headers = { ...req.headers, host: target.host };

  const proxyReq = http.request(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('API sidecar unavailable');
  });

  req.pipe(proxyReq);
}

function sendFile(res, filePath) {
  res.writeHead(200, { 'Content-Type': contentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

function startStaticServer({ webRoot, apiOrigin, host, port }) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://${host}:${port}`);

    if (url.pathname.startsWith('/api')) {
      proxyRequest(req, res, apiOrigin);
      return;
    }

    let filePath = path.join(webRoot, decodeURIComponent(url.pathname));
    if (url.pathname === '/') {
      filePath = path.join(webRoot, 'index.html');
    }

    fs.stat(filePath, (err, stat) => {
      if (!err && stat.isDirectory()) {
        sendFile(res, path.join(filePath, 'index.html'));
        return;
      }
      if (!err && stat.isFile()) {
        sendFile(res, filePath);
        return;
      }

      const fallback = path.join(webRoot, 'index.html');
      fs.stat(fallback, (fallbackErr, fallbackStat) => {
        if (fallbackErr || !fallbackStat.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Not Found');
          return;
        }
        sendFile(res, fallback);
      });
    });
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, host, () => {
      const address = server.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      resolve({
        server,
        url: `http://${host}:${boundPort}`,
        close: () =>
          new Promise((closeResolve, closeReject) => {
            server.close((error) => (error ? closeReject(error) : closeResolve()));
          }),
      });
    });
  });
}

module.exports = { startStaticServer };
