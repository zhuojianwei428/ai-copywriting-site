/**
 * CopyTools Admin Server
 * A minimal local server for the admin panel.
 * Provides: GET /api/tools, POST /api/tools, POST /api/build
 *
 * Usage:
 *   node admin/server.js
 *   Then open http://localhost:3210/admin/index.html
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3210;
const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'tools-data.json');
const PYTHON = process.env.PYTHON || 'python';

// MIME types
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found');
  }
}

function corsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => body += c);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  corsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  // ---- API Routes ----
  if (url.pathname === '/api/tools') {
    if (req.method === 'GET') {
      try {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(body, null, 2), 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, message: 'Saved' }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  if (url.pathname === '/api/build' && req.method === 'POST') {
    try {
      // Run _gen_tools.py
      const output = execSync(
        `"${PYTHON}" "${path.join(ROOT, '_gen_tools.py')}"`,
        { cwd: ROOT, encoding: 'utf-8', timeout: 30000 }
      );
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, output }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: false,
        error: e.message,
        output: e.stderr || e.stdout || '',
      }));
    }
    return;
  }

  // ---- Static file serving ----
  // Security: only serve files within project root
  const safePath = path.normalize(url.pathname.replace(/^\//, '')).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  const stat = fs.statSync(filePath).catch(() => null);
  if (!stat || !stat.isFile()) {
    res.writeHead(404);
    return res.end('Not Found: ' + url.pathname);
  }

  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\n  CopyTools Admin Server`);
  console.log(`  ====================`);
  console.log(`  URL:  http://localhost:${PORT}/admin/index.html`);
  console.log(`  Data: ${DATA_FILE}`);
  console.log(`  Press Ctrl+C to stop\n`);
});
