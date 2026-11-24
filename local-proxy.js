const http = require('http');
const { spawn } = require('child_process');

const PROXY = 'http://10.154.90.195:8080';
const PORT = 4873;

const server = http.createServer((req, res) => {
  const targetUrl = `https://registry.npmjs.org${req.url}`;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  const curl = spawn('curl.exe', [
    '-s', '-L', '--proxy', PROXY, '--max-time', '120',
    '-H', `Accept: ${req.headers.accept || '*/*'}`,
    targetUrl
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  let contentType = 'application/octet-stream';
  if (req.url.endsWith('.json')) contentType = 'application/json';
  
  res.writeHead(200, { 'Content-Type': contentType });
  curl.stdout.pipe(res);
  
  curl.stderr.on('data', (d) => {});
  curl.on('error', () => { res.end(); });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local proxy on http://127.0.0.1:${PORT}`);
});
