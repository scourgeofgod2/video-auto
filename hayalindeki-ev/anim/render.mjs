// Kare kare render: node render.mjs --stills 1,4.5,7 [--scale 0.5]
//                   node render.mjs --start 0 --end 66.5 --fps 24 --out ../klipler/3d.mp4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
  return a;
}, []));
const scale = parseFloat(args.scale || '1');
const fps = parseFloat(args.fps || '24');

const types = { '.html': 'text/html', '.png': 'image/png', '.otf': 'font/otf', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Math.round(1080 * scale), height: Math.round(1920 * scale) } });
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?headless=1&scale=${scale}${args.sahne ? '&sahne=' + args.sahne : ''}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });

const frameJpg = async (t) => {
  await page.evaluate(t => window.renderAt(t), t);
  const url = await page.evaluate(() => window.grab(0.93));
  return Buffer.from(url.split(',')[1], 'base64');
};

if (args.stills) {
  const dir = args.dir || path.join(ROOT, 'stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of args.stills.split(',')) {
    const t = parseFloat(s), t0 = Date.now();
    fs.writeFileSync(path.join(dir, `t${t.toFixed(2)}.jpg`), await frameJpg(t));
    console.log(`still t=${t} (${Date.now() - t0} ms)`);
  }
} else {
  const start = parseFloat(args.start || '0');
  const end = parseFloat(args.end || String(await page.evaluate(() => window.DURATION)));
  const out = args.out || path.join(ROOT, 'render.mp4');
  const n = Math.round((end - start) * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await frameJpg(start + i / fps);
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 24 === 0) {
      const el = (Date.now() - t0) / 1000, eta = el / (i + 1) * (n - i - 1);
      console.log(`frame ${i}/${n}  t=${(start + i / fps).toFixed(2)}  ${el.toFixed(0)}s  eta ${eta.toFixed(0)}s`);
    }
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('done', out);
}
await browser.close();
server.close();
