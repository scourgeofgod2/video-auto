// Kuru Havuz — tüm sahne, zaman çizelgesi ve kamera.
// Zaman (saniye) seslendirmenin cümle zamanlarına bağlı (../zamanlama.json).
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const DURATION = 66.5;
const OA = 8000, OB = 6000, OC = 7000; // kesit sahneleri ana dünyanın dışında

// ---------- yardımcılar ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const easeOut = k => { k = clamp(k); return 1 - (1 - k) ** 3; };
const easeIn = k => { k = clamp(k); return k ** 3; };
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lerpV = (a, b, k) => a.clone().lerp(b, k);

function rng(seed) { // mulberry32 — her render aynı sonucu verir
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  return t;
}

function speckle(g, w, h, n, colors, rmin, rmax, r) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(r() * colors.length)];
    const s = rmin + r() * (rmax - rmin);
    g.fillRect(r() * w, r() * h, s, s);
  }
}

// ---------- dokular ----------
function makeTextures() {
  const r = rng(7);
  const T = {};
  T.grass = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#4d8534'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 9000, ['#3f742a', '#5a963d', '#679f45', '#467d2f', '#73a84f'], 1, 3, r);
  }, [60, 60]);
  T.concreteTiles = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#b3b0a7'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 6000, ['#a8a59c', '#bcb9b0', '#a19e95', '#c4c1b8'], 1, 2, r);
    g.strokeStyle = 'rgba(70,65,60,0.35)'; g.lineWidth = 3;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); }
    for (let i = 0; i < 25; i++) { g.fillStyle = `rgba(90,85,75,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, 7); g.fill(); }
  }, [6, 30]);
  T.paving = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#bdbab2'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 5000, ['#b2afa7', '#c8c5bd', '#a9a69e'], 1, 2, r);
    g.strokeStyle = 'rgba(60,60,60,0.25)'; g.lineWidth = 2;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); }
  }, [1, 1]);
  T.wall = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#9a978f'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 5000, ['#8f8c84', '#a5a29a', '#86837b'], 1, 2, r);
    g.strokeStyle = 'rgba(60,58,55,0.35)'; g.lineWidth = 2;
    for (let y = 0; y <= h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let y = 0; y < h; y += 64) for (let x = (y / 64 % 2) * 128; x < w; x += 256) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 64); g.stroke(); }
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(60,70,60,0.25)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, [10, 1]);
  T.brick = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#cdbfae'; g.fillRect(0, 0, w, h);
    const bh = 16, bw = 40;
    for (let y = 0, row = 0; y < h; y += bh, row++) for (let x = -(row % 2) * bw / 2; x < w; x += bw) {
      const c = ['#9c3f2b', '#a8482f', '#8e3826', '#b04e33', '#94402c'][Math.floor(r() * 5)];
      g.fillStyle = c; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3);
    }
  }, [3, 2]);
  T.soil = canvasTex(256, 1024, (g, w, h) => {
    const bands = [[0, 0.02, '#5f9b3c'], [0.02, 0.22, '#6e4c30'], [0.22, 0.5, '#8a765c'], [0.5, 0.75, '#6a5442'], [0.75, 1, '#5a4a3c']];
    for (const [a, b, c] of bands) { g.fillStyle = c; g.fillRect(0, a * h, w, (b - a) * h + 1); }
    speckle(g, w, h, 4000, ['rgba(40,30,20,0.35)', 'rgba(150,135,110,0.5)', 'rgba(90,80,70,0.5)'], 1, 4, r);
    for (let i = 0; i < 160; i++) { g.fillStyle = ['#9d9282', '#7c7366', '#b3a996'][i % 3]; g.beginPath(); g.ellipse(r() * w, (0.22 + r() * 0.78) * h, 2 + r() * 6, 2 + r() * 4, r() * 3, 0, 7); g.fill(); }
  }, [1, 1]);
  T.soilDeep = canvasTex(256, 1024, (g, w, h) => {
    const bands = [[0, 0.3, '#6e4c30'], [0.3, 0.6, '#8a765c'], [0.6, 1, '#5f4c3d']];
    for (const [a, b, c] of bands) { g.fillStyle = c; g.fillRect(0, a * h, w, (b - a) * h + 1); }
    speckle(g, w, h, 4000, ['rgba(40,30,20,0.35)', 'rgba(150,135,110,0.5)', 'rgba(90,80,70,0.5)'], 1, 4, r);
    for (let i = 0; i < 200; i++) { g.fillStyle = ['#9d9282', '#7c7366', '#b3a996'][i % 3]; g.beginPath(); g.ellipse(r() * w, r() * h, 2 + r() * 6, 2 + r() * 4, r() * 3, 0, 7); g.fill(); }
  }, [1, 1]);
  T.sand = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7f8a6e'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 4000, ['#6f7a5e', '#8e9878', '#5f6a52'], 1, 3, r);
  }, [8, 8]);
  T.steel = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6b7178'; g.fillRect(0, 0, w, h);
    speckle(g, w, h, 3000, ['#626870', '#747a82', '#5a6068'], 1, 2, r);
    g.strokeStyle = '#555b62'; g.lineWidth = 10;
    for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    g.lineWidth = 6;
    for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 128, h * 0.5); g.moveTo(x + 128, 0); g.lineTo(x, h * 0.5); g.stroke(); }
    g.fillStyle = '#2f5f62'; g.fillRect(0, h * 0.55, w, h * 0.45);
    speckle(g, w, h * 0.45, 0, [], 0, 0, r);
  }, [3, 1]);
  T.gateLeaf = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#5d646c'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#4a5058'; g.lineWidth = 8;
    for (let y = 0; y <= h; y += 85) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    for (let x = 0; x <= w; x += 128) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    const grd = g.createLinearGradient(0, h * 0.6, 0, h); grd.addColorStop(0, 'rgba(40,70,60,0)'); grd.addColorStop(1, 'rgba(40,70,60,0.7)');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, [1, 1]);
  T.windows = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#f2f2ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2a3440';
    for (let y = 30; y < h; y += 64) for (let x = 12; x < w; x += 32) g.fillRect(x, y, 18, 16);
  }, [2, 1]);
  T.hatch = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8b3427'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#6e281e'; g.lineWidth = 6;
    for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  }, [1, 1]);

  // dalga normal haritası (döşenebilir sinüs toplamı)
  const N = 256, img = new ImageData(N, N), hgt = new Float32Array(N * N);
  const waves = [[3, 1, 0.0, 1], [1, 4, 1.3, 0.8], [5, -2, 2.1, 0.5], [-3, 6, 0.7, 0.35], [8, 3, 4.2, 0.25], [2, -9, 3.3, 0.2], [11, 7, 5.1, 0.12]];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    let s = 0; for (const [a, b, p, amp] of waves) s += amp * Math.sin(2 * Math.PI * (a * x + b * y) / N + p);
    hgt[y * N + x] = s;
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const dx = hgt[y * N + (x + 1) % N] - hgt[y * N + (x - 1 + N) % N], dy = hgt[((y + 1) % N) * N + x] - hgt[((y - 1 + N) % N) * N + x];
    const n = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize(), i = (y * N + x) * 4;
    img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  T.waterNormal = canvasTex(N, N, g => g.putImageData(img, 0, 0), [1, 1], false);
  T.waterNormal2 = T.waterNormal.clone(); T.waterNormal2.needsUpdate = true;

  T.cloud = canvasTex(256, 128, (g, w, h) => {
    for (let i = 0; i < 26; i++) {
      const x = w * (0.18 + r() * 0.64), y = h * (0.45 + r() * 0.3), rad = 18 + r() * 30;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.6, 'rgba(250,252,255,0.6)'); grd.addColorStop(1, 'rgba(240,245,255,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    }
    const grd = g.createLinearGradient(0, h * 0.55, 0, h); grd.addColorStop(0, 'rgba(180,190,205,0)'); grd.addColorStop(1, 'rgba(160,172,190,0.35)');
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = grd; g.fillRect(0, 0, w, h);
  }, [1, 1]);
  return T;
}

function hullTexture() {
  const r = rng(11), w = 2048, h = 256;
  return canvasTex(w, h, (g) => {
    const H = 14.5, draft = 6; // v = y / H
    const wl = h * (1 - draft / H);
    g.fillStyle = '#1b1d20'; g.fillRect(0, 0, w, wl);
    g.fillStyle = '#9c2a1c'; g.fillRect(0, wl, w, h - wl);
    speckle(g, w, h - wl, 0, [], 0, 0, r);
    for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${120 + r() * 40},${30 + r() * 15},${20},0.25)`; g.fillRect(r() * w, wl + r() * (h - wl), 3, 2); }
    // pas akıntıları
    for (let i = 0; i < 160; i++) {
      const x = r() * w, y0 = r() * wl * 0.5, len = 20 + r() * wl * 0.7, ww = 1 + r() * 4;
      const grd = g.createLinearGradient(0, y0, 0, y0 + len);
      grd.addColorStop(0, `rgba(${170 + r() * 40},${80 + r() * 30},30,${0.5 + r() * 0.4})`); grd.addColorStop(1, 'rgba(150,70,30,0)');
      g.fillStyle = grd; g.fillRect(x, y0, ww, len);
    }
    // su hattı çizgisi
    g.fillStyle = '#c23a28'; g.fillRect(0, wl - 4, w, 5);
    // çapa (pruvaya yakın: u≈0.93)
    const ax = w * 0.93, ay = wl * 0.28;
    g.strokeStyle = '#4a2a1a'; g.lineWidth = 7; g.beginPath(); g.arc(ax, ay, 16, 0, 7); g.stroke();
    g.fillStyle = '#7a3a1e'; g.fillRect(ax - 4, ay + 10, 8, 50);
    g.beginPath(); g.moveTo(ax - 26, ay + 48); g.quadraticCurveTo(ax, ay + 75, ax + 26, ay + 48); g.lineWidth = 8; g.strokeStyle = '#7a3a1e'; g.stroke();
    const grd = g.createLinearGradient(0, ay + 60, 0, wl); grd.addColorStop(0, 'rgba(180,90,30,0.8)'); grd.addColorStop(1, 'rgba(180,90,30,0)');
    g.fillStyle = grd; g.fillRect(ax - 6, ay + 60, 12, wl - ay - 60);
  }, [1, 1]);
}

// ---------- gemi ----------
const SHIP = { L: 90, B: 16, H: 11, draft: 6 };

function hullGeometry() {
  const { L, B, H } = SHIP, NU = 96;
  const hw = u => u < 0.1 ? B / 2 * (0.8 + 0.2 * u / 0.1) : u < 0.7 ? B / 2 : B / 2 * Math.max(0.025, Math.max(0, Math.cos(clamp((u - 0.7) / 0.3) * Math.PI / 2)) ** 0.85);
  const bf = u => u < 0.7 ? 1 : Math.max(0.02, 1 - (u - 0.7) / 0.3 * 1.15);
  const sheer = u => H + (u > 0.82 ? ((u - 0.82) / 0.18) ** 2 * 2 : 0);
  const keel = u => u < 0.07 ? (0.07 - u) / 0.07 * 3.5 : 0;
  const pos = [], uvs = [], idx = [], deck = [], deckIdx = [];
  let NS = 0;
  for (let i = 0; i <= NU; i++) {
    const u = i / NU, z = (u - 0.5) * L, wt = hw(u), wb = Math.max(0.03, hw(u) * bf(u)), top = sheer(u), ky = keel(u);
    const rr = Math.min(2.4, wb * 0.9, (top - ky) * 0.3);
    const prof = [];
    const side = (sgn) => { const pts = []; for (let k = 0; k <= 8; k++) { const y = lerp(top, ky + rr, k / 8); const f = (y - ky) / (top - ky); pts.push([sgn * lerp(wb, wt, f), y]); } return pts; };
    const arc = (sgn) => { const pts = []; for (let k = 1; k <= 7; k++) { const a = k / 8 * Math.PI / 2; pts.push([sgn * (wb - rr + rr * Math.cos(a)), ky + rr - rr * Math.sin(a)]); } return pts; };
    prof.push(...side(-1), ...arc(-1));
    for (let k = 0; k <= 6; k++) prof.push([lerp(-(wb - rr), wb - rr, k / 6), ky]);
    prof.push(...arc(1).reverse(), ...side(1).reverse());
    NS = prof.length;
    for (const [x, y] of prof) { pos.push(x, y, z); uvs.push(u, y / 14.5); }
    deck.push([-wt, top, z], [wt, top, z]);
  }
  for (let i = 0; i < NU; i++) for (let j = 0; j < NS - 1; j++) {
    const a = i * NS + j, b = a + 1, c = a + NS, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx); g.computeVertexNormals();
  // güverte
  const dp = [], di = [];
  deck.forEach(p => dp.push(...p));
  for (let i = 0; i < NU; i++) { const a = i * 2; di.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setIndex(di); dg.computeVertexNormals();
  // ayna kıç
  const tp = [], ti = []; const z0 = -L / 2;
  const first = []; for (let j = 0; j < NS; j++) first.push([pos[j * 3], pos[j * 3 + 1]]);
  tp.push(0, (first[0][1] + first[Math.floor(NS / 2)][1]) / 2, z0); first.forEach(([x, y]) => tp.push(x, y, z0));
  for (let j = 1; j < NS; j++) ti.push(0, j + 1, j);
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(tp, 3)); tg.setIndex(ti); tg.computeVertexNormals();
  return { hull: g, deck: dg, transom: tg, sheer, hw };
}

function makeShip(T) {
  const { L } = SHIP;
  const ship = new THREE.Group(), inner = new THREE.Group(); ship.add(inner);
  const geo = hullGeometry();
  const hullMat = new THREE.MeshStandardMaterial({ map: hullTexture(), roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide });
  const black = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x6f2a20, roughness: 0.8, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ color: 0xf1f1ec, roughness: 0.5 });
  const red = new THREE.MeshStandardMaterial({ color: 0x9c2a1c, roughness: 0.6 });
  const add = (m) => { m.castShadow = true; m.receiveShadow = true; inner.add(m); return m; };
  add(new THREE.Mesh(geo.hull, hullMat));
  add(new THREE.Mesh(geo.deck, deckMat));
  add(new THREE.Mesh(geo.transom, black));
  // ambar kapakları
  const hatchMat = new THREE.MeshStandardMaterial({ map: T.hatch, roughness: 0.7 });
  for (let i = 0; i < 5; i++) { const m = add(new THREE.Mesh(new THREE.BoxGeometry(11, 1.3, 9), hatchMat)); m.position.set(0, SHIP.H + 0.65, -22 + i * 12.5); }
  // köprüüstü
  const winMat = new THREE.MeshStandardMaterial({ map: T.windows, roughness: 0.4 });
  const sMat = [winMat, winMat, white, white, winMat, winMat];
  const s1 = add(new THREE.Mesh(new THREE.BoxGeometry(14, 8, 9), sMat)); s1.position.set(0, SHIP.H + 4, -L / 2 + 8);
  const s2 = add(new THREE.Mesh(new THREE.BoxGeometry(11, 3, 7), sMat)); s2.position.set(0, SHIP.H + 9.5, -L / 2 + 8);
  const s3 = add(new THREE.Mesh(new THREE.BoxGeometry(17, 2.4, 4.5), sMat)); s3.position.set(0, SHIP.H + 12.2, -L / 2 + 9);
  const fun = add(new THREE.Mesh(new THREE.BoxGeometry(3.2, 7, 4), black)); fun.position.set(0, SHIP.H + 12, -L / 2 + 3.5);
  const band = add(new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.2, 4.1), red)); band.position.set(0, SHIP.H + 13.5, -L / 2 + 3.5);
  const mast1 = add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 9, 8), white)); mast1.position.set(0, SHIP.H + 17, -L / 2 + 9);
  const mast2 = add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 12, 8), white)); mast2.position.set(0, SHIP.H + 7, L / 2 - 10);
  const yard = add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.3), white)); yard.position.set(0, SHIP.H + 11, L / 2 - 10);
  // bulb pruva
  const bulb = add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), red));
  bulb.scale.set(2.1, 2.3, 4.6); bulb.position.set(0, 2.5, L / 2 - 2.2);
  // midye kabukları
  const r = rng(21), n = 2600;
  const barn = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.11, 0), new THREE.MeshStandardMaterial({ roughness: 0.9 }), n);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  for (let i = 0; i < n; i++) {
    let p;
    if (i < 1700) { // bulb üzerinde
      let d; do { d = v3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1); } while (d.length() > 1 || d.length() < 0.2 || d.z < -0.5);
      d.normalize(); p = v3(d.x * 2.1 * 1.03, 2.5 + d.y * 2.3 * 1.03, L / 2 - 2.2 + d.z * 4.6 * 1.03);
    } else { // pruva altı gövde
      const z = L / 2 - 2 - r() * 22, side = r() < 0.5 ? -1 : 1, y = r() * 3.2;
      const u = z / L + 0.5, w = geo.hw(u) * Math.max(0.02, u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3 * 1.15);
      p = v3(side * (w + 0.05), y, z);
    }
    const s = 0.6 + r() * 1.3;
    m4.compose(p, q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)), v3(s, s * 0.7, s));
    barn.setMatrixAt(i, m4);
    barn.setColorAt(i, col.setHSL(0.12 + r() * 0.14, 0.25 + r() * 0.25, 0.2 + r() * 0.16));
  }
  barn.castShadow = true;
  inner.add(barn);
  ship.userData = { inner, barn };
  return ship;
}

// ---------- diğer modeller ----------
function makeCrane(mat, dark) {
  const g = new THREE.Group();
  const box = (w, h, d, x, y, z, m = mat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  for (const sx of [-3.5, 3.5]) for (const sz of [-3, 3]) box(0.9, 18, 0.9, sx, 9, sz);
  box(8, 1, 1, 0, 17.5, -3); box(8, 1, 1, 0, 17.5, 3); box(1, 1, 7, -3.5, 17.5, 0); box(1, 1, 7, 3.5, 17.5, 0);
  box(1, 1, 7, -3.5, 6, 0); box(1, 1, 7, 3.5, 6, 0);
  box(6, 4.5, 6, 0, 20.5, 0);
  const cab = box(2.5, 2.5, 2.5, 3.2, 20, 2.5, dark);
  const boom = new THREE.Group(); boom.position.set(2, 21, 0); g.add(boom);
  const bm = new THREE.Mesh(new THREE.BoxGeometry(24, 1, 1.2), mat); bm.position.set(12, 0, 0); bm.castShadow = true; boom.add(bm);
  boom.rotation.z = 0.35;
  const cw = box(3, 3, 4, -3.5, 21, 0, dark);
  const hook = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 12, 4), dark); hook.position.set(23, -6, 0); boom.add(hook);
  return g;
}

function makePumpHouse(T) {
  const g = new THREE.Group();
  const brick = new THREE.MeshStandardMaterial({ map: T.brick, roughness: 0.85 });
  const roof = new THREE.MeshStandardMaterial({ color: 0x59606a, roughness: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 9), brick); body.position.y = 3.5; g.add(body);
  const sh = new THREE.Shape(); sh.moveTo(-6.6, 0); sh.lineTo(0, 3.2); sh.lineTo(6.6, 0); sh.lineTo(-6.6, 0);
  const rg = new THREE.ExtrudeGeometry(sh, { depth: 9.8, bevelEnabled: false }); rg.translate(0, 0, -4.9);
  const rm = new THREE.Mesh(rg, roof); rm.position.y = 7; g.add(rm);
  const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.0, 20, 16), brick); ch.position.set(4.5, 10, -3); g.add(ch);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.6, 16), new THREE.MeshStandardMaterial({ color: 0x3a3a3a })); cap.position.set(4.5, 20.2, -3); g.add(cap);
  const door = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x2f6b4a })); door.position.set(0, 1.8, 4.55); g.add(door);
  const winMat = new THREE.MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.3 });
  for (const x of [-4, 4]) { const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.2), winMat); w.position.set(x, 3.6, 4.55); g.add(w); }
  for (const z of [-2.5, 2.5]) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 1.6), winMat); w.position.set(-6.05, 3.6, z); g.add(w); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function makeExcavator() {
  const g = new THREE.Group();
  const yellow = new THREE.MeshStandardMaterial({ color: 0xf0b414, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x223040, roughness: 0.2 });
  const box = (p, w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; p.add(b); return b; };
  box(g, 1.2, 1.1, 5, -1.6, 0.55, 0, dark); box(g, 1.2, 1.1, 5, 1.6, 0.55, 0, dark);
  const upper = new THREE.Group(); upper.position.y = 1.3; g.add(upper);
  box(upper, 3.6, 1.6, 4.2, 0, 0.8, -0.4, yellow);
  box(upper, 1.6, 1.8, 1.8, -0.9, 2.4, 0.6, yellow); box(upper, 1.5, 1.2, 0.1, -0.9, 2.6, 1.52, glass);
  const boom = new THREE.Group(); boom.position.set(0.8, 1.4, 1.2); upper.add(boom);
  box(boom, 0.6, 0.7, 5.2, 0, 0, 2.6, yellow);
  const stick = new THREE.Group(); stick.position.set(0, 0, 5.2); boom.add(stick);
  box(stick, 0.5, 0.5, 3.6, 0, 0, 1.8, yellow);
  const bucket = new THREE.Group(); bucket.position.set(0, 0, 3.6); stick.add(bucket);
  box(bucket, 1.3, 0.9, 0.9, 0, -0.3, 0.3, dark);
  g.userData = { upper, boom, stick, bucket };
  return g;
}

function makeKeelBlocks(T) {
  const g = new THREE.Group();
  const conc = new THREE.MeshStandardMaterial({ color: 0x9a978f, roughness: 0.9 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.9 });
  const geoC = new THREE.BoxGeometry(1.8, 0.5, 1.4), geoW = new THREE.BoxGeometry(1.8, 0.25, 1.4);
  const rows = [];
  for (let z = 22; z <= 104; z += 3) { rows.push([0, z]); if (z > 28 && z < 96 && z % 6 === 4) { rows.push([-5.2, z]); rows.push([5.2, z]); } }
  const nC = rows.length * 2, nW = rows.length;
  const c = new THREE.InstancedMesh(geoC, conc, nC), w = new THREE.InstancedMesh(geoW, wood, nW);
  const m = new THREE.Matrix4(); let ic = 0, iw = 0;
  for (const [x, z] of rows) {
    m.makeTranslation(x, 0.25, z); c.setMatrixAt(ic++, m);
    m.makeTranslation(x, 0.75, z); c.setMatrixAt(ic++, m);
    m.makeTranslation(x, 1.125, z); w.setMatrixAt(iw++, m);
  }
  c.castShadow = c.receiveShadow = w.castShadow = w.receiveShadow = true;
  g.add(c, w);
  return g; // yükseklik 1.25 m; zeminin üstüne koy
}

function makeWorker() {
  const g = new THREE.Group();
  const vest = new THREE.MeshStandardMaterial({ color: 0xff7a1a }), dark = new THREE.MeshStandardMaterial({ color: 0x2c3340 }), skin = new THREE.MeshStandardMaterial({ color: 0xe0b090 }), hat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.3), vest); b.position.y = 1.15; g.add(b);
  const l = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.8, 0.25), dark); l.position.y = 0.4; g.add(l);
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), skin); h.position.y = 1.65; g.add(h);
  const ht = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hat); ht.position.y = 1.7; g.add(ht);
  g.traverse(o => o.isMesh && (o.castShadow = true));
  return g;
}

// ---------- dünya ----------
export function createWorld(renderer, aspect) {
  const T = makeTextures();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.3, 6000);

  // gökyüzü
  const sky = new Sky(); sky.scale.setScalar(5000);
  const su = sky.material.uniforms;
  su.turbidity.value = 2.2; su.rayleigh.value = 1.1; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
  const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(38), THREE.MathUtils.degToRad(215));
  su.sunPosition.value.copy(sunDir);
  scene.add(sky);
  const pm = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(1000); sky2.material.uniforms.sunPosition.value.copy(sunDir);
  Object.assign(sky2.material.uniforms.turbidity, { value: 2.2 }); envScene.add(sky2);
  scene.environment = pm.fromScene(envScene, 0.02).texture;
  scene.fog = new THREE.Fog(0xa9c6df, 700, 3800);

  // bulutlar
  const cloudMat = new THREE.SpriteMaterial({ map: T.cloud, transparent: true, depthWrite: false, fog: false });
  const cr = rng(5);
  for (let i = 0; i < 70; i++) {
    const s = new THREE.Sprite(cloudMat.clone());
    const a = cr() * Math.PI * 2, d = 700 + cr() * 1500;
    const sc = 160 + cr() * 260;
    s.scale.set(sc, sc * 0.5, 1);
    s.position.set(Math.cos(a) * d, 120 + cr() * 260, Math.sin(a) * d);
    s.material.opacity = 0.75 + cr() * 0.25;
    scene.add(s);
  }

  // ışık
  const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x6a7a55, 0.9); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff3df, 2.6);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -110, right: 110, top: 110, bottom: -110, near: 1, far: 600 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
  scene.add(sun, sun.target);
  const setSunFocus = (p, size = 110) => {
    sun.target.position.copy(p); sun.position.copy(p).addScaledVector(sunDir, 300);
    const c = sun.shadow.camera; if (c.right !== size) { c.left = c.bottom = -size; c.right = c.top = size; c.updateProjectionMatrix(); }
  };

  // malzemeler
  const M = {
    grass: new THREE.MeshStandardMaterial({ map: T.grass, roughness: 0.95 }),
    soil: new THREE.MeshStandardMaterial({ map: T.soil, roughness: 1 }),
    wall: new THREE.MeshStandardMaterial({ map: T.wall, roughness: 0.9 }),
    floor: new THREE.MeshStandardMaterial({ map: T.concreteTiles, roughness: 0.85 }),
    paving: new THREE.MeshStandardMaterial({ map: T.paving, roughness: 0.9 }),
    coping: new THREE.MeshStandardMaterial({ color: 0xd2cfc6, roughness: 0.85 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xf2c014, roughness: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.7 }),
    gate: new THREE.MeshStandardMaterial({ map: T.gateLeaf, roughness: 0.6, metalness: 0.3 }),
    caisson: new THREE.MeshStandardMaterial({ map: T.steel, roughness: 0.6, metalness: 0.3 }),
    sand: new THREE.MeshStandardMaterial({ map: T.sand, roughness: 1 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xb8b5ad, roughness: 0.9 }),
  };
  const seaMat = new THREE.MeshPhysicalMaterial({ color: 0x0b4a78, roughness: 0.12, metalness: 0, normalMap: T.waterNormal, normalScale: new THREE.Vector2(0.25, 0.25), envMapIntensity: 0.55 });
  T.waterNormal.repeat.set(220, 220);
  const dockWaterMat = new THREE.MeshPhysicalMaterial({ color: 0x168e96, envMapIntensity: 0.6, roughness: 0.1, normalMap: T.waterNormal2, normalScale: new THREE.Vector2(0.3, 0.3), transparent: true, opacity: 0.92 });
  T.waterNormal2.repeat.set(4, 18);

  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (shadow) { m.castShadow = true; m.receiveShadow = true; } parent.add(m); return m; };
  // kutu: [x0,x1],[y0,y1],[z0,z1], yüz malzemeleri {px,nx,py,ny,pz,nz}
  const block = (x0, x1, y0, y1, z0, z1, mats, parent = scene, uvScale = null) => {
    const geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
    const arr = ['px', 'nx', 'py', 'ny', 'pz', 'nz'].map(k => mats[k] || mats.all || M.soil);
    return mesh(geo, arr, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent);
  };

  // ===== ANA DÜNYA =====
  const DOCK = { x: 13, z1: 130, floor: -14, sea: -3 };
  const main = new THREE.Group(); scene.add(main);
  const wallMat = M.wall, soil = M.soil;
  block(-4000, -DOCK.x, -40, 0, 0, 4000, { py: M.grass, px: wallMat, nz: wallMat }, main);
  block(DOCK.x, 4000, -40, 0, 0, 4000, { py: M.grass, nx: wallMat, nz: wallMat }, main);
  block(-DOCK.x, DOCK.x, -40, 0, DOCK.z1, 4000, { py: M.grass, nz: wallMat }, main);
  block(-DOCK.x, DOCK.x, -41, DOCK.floor, -6, DOCK.z1, { py: M.floor }, main);
  // kenar betonları ve apron
  block(-DOCK.x - 7, -DOCK.x, 0, 0.12, 0, DOCK.z1 + 7, { all: M.coping }, main);
  block(DOCK.x, DOCK.x + 7, 0, 0.12, 0, DOCK.z1 + 7, { all: M.coping }, main);
  block(-DOCK.x, DOCK.x, 0, 0.12, DOCK.z1, DOCK.z1 + 7, { all: M.coping }, main);
  const apron = block(DOCK.x + 7, DOCK.x + 40, 0, 0.1, 0, 40, { all: M.paving }, main);
  block(-200, 200, 0, 0.1, 0, 5, { all: M.coping }, main); // rıhtım şeridi
  // sarı kenar çizgisi
  for (const sx of [-1, 1]) block(sx * (DOCK.x + 0.4) - 0.2, sx * (DOCK.x + 0.4) + 0.2, 0.12, 0.15, 0, DOCK.z1, { all: M.yellow }, main);
  // deniz
  const sea = mesh(new THREE.PlaneGeometry(8000, 4000), seaMat, 0, DOCK.sea, -2000, main, false); sea.rotation.x = -Math.PI / 2; sea.receiveShadow = true;
  // havuz suyu
  const dockWater = mesh(new THREE.PlaneGeometry(2 * DOCK.x, DOCK.z1 + 6), dockWaterMat, 0, DOCK.sea, (DOCK.z1 - 6) / 2, main, false);
  dockWater.rotation.x = -Math.PI / 2; dockWater.receiveShadow = true;
  // köpük
  const foamTex = canvasTex(256, 512, (g, w, h) => { const r = rng(3); for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 5, 0, 7); g.fill(); } });
  const foamMat = new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0, depthWrite: false });
  const foam = mesh(new THREE.PlaneGeometry(2 * DOCK.x, 40), foamMat, 0, DOCK.sea + 0.05, 20, main, false); foam.rotation.x = -Math.PI / 2;

  // kanat kapılar (mitre)
  const leafGeo = new THREE.BoxGeometry(DOCK.x + 0.2, 15.5, 1.4); leafGeo.translate((DOCK.x + 0.2) / 2, 0, 0);
  const leafL = new THREE.Group(), leafR = new THREE.Group();
  leafL.position.set(-DOCK.x, DOCK.floor + 7.75, 0); leafR.position.set(DOCK.x, DOCK.floor + 7.75, 0);
  mesh(leafGeo, M.gate, 0, 0, 0, leafL); const lr = mesh(leafGeo, M.gate, 0, 0, 0, leafR); lr.rotation.y = Math.PI;
  main.add(leafL, leafR);
  // yüzer kapı (caisson)
  const caisson = new THREE.Group(); main.add(caisson);
  const cMats = [M.caisson, M.caisson, new THREE.MeshStandardMaterial({ color: 0x8c9198, roughness: 0.7 }), M.caisson, M.caisson, M.caisson];
  mesh(new THREE.BoxGeometry(2 * DOCK.x + 2, 15, 6), cMats, 0, 7.5, 0, caisson);
  const hut = mesh(new THREE.BoxGeometry(6, 3.5, 4.5), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, roughness: 0.6 }), 0, 16.75, 0, caisson);
  for (const sx of [-1, 1]) { const rail = mesh(new THREE.BoxGeometry(2 * DOCK.x, 0.15, 0.15), M.yellow, 0, 16, sx * 2.9, caisson); }
  // sızıntı jetleri
  const LEAK_N = 900;
  const leakGeo = new THREE.BufferGeometry(); leakGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(LEAK_N * 3), 3));
  const leakTex = canvasTex(32, 32, (g) => { const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 32, 32); });
  const leakMat = new THREE.PointsMaterial({ size: 0.28, map: leakTex, transparent: true, depthWrite: false, color: 0xdff4ff, opacity: 0.9 });
  const leaks = new THREE.Points(leakGeo, leakMat); main.add(leaks);
  const leakSrc = []; { const r = rng(9); for (let i = 0; i < LEAK_N; i++) { const k = i % 6; const src = k < 2 ? [-12.6 + r() * 0.3, DOCK.floor + 2 + r() * 12] : k < 4 ? [12.3 + r() * 0.3, DOCK.floor + 2 + r() * 12] : [-0.15 + r() * 0.3, DOCK.floor + 1 + r() * 13]; leakSrc.push({ x: src[0], y: src[1], ph: r(), vz: 3 + r() * 2, vx: (r() - 0.5) * 0.6 }); } }

  // havuz zemini: takozlar, destekler, çatlaklar
  const blocks = makeKeelBlocks(T); blocks.position.y = DOCK.floor; main.add(blocks);
  const props = new THREE.Group(); main.add(props);
  const propMat = new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 });
  const propList = [];
  for (let z = 30; z <= 98; z += 7) for (const sx of [-1, 1]) {
    const a = v3(sx * 12.6, DOCK.floor + 0.2, z), b = v3(sx * 8.15, DOCK.floor + 6.5, z + (sx > 0 ? 1.5 : -1.5));
    const len = a.distanceTo(b);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.45, len, 0.45), propMat);
    p.geometry.translate(0, len / 2, 0); p.position.copy(a);
    p.quaternion.setFromUnitVectors(v3(0, 1, 0), b.clone().sub(a).normalize());
    p.castShadow = p.receiveShadow = true; props.add(p); propList.push(p);
  }
  // çatlak + kabarma yaması (pruva önü)
  const bulgeGeo = new THREE.PlaneGeometry(26, 22, 60, 50); bulgeGeo.rotateX(-Math.PI / 2);
  const bulgeBase = bulgeGeo.attributes.position.array.slice();
  const crackCanvas = document.createElement('canvas'); crackCanvas.width = 512; crackCanvas.height = 512;
  const crackTex = new THREE.CanvasTexture(crackCanvas); crackTex.colorSpace = THREE.SRGBColorSpace;
  const tileTex = T.concreteTiles.clone(); tileTex.repeat.set(26 / (26 / 6), 22 / (136 / 30)); tileTex.needsUpdate = true;
  const bulgeMat = new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.85 });
  const bulge = mesh(bulgeGeo, bulgeMat, 0, DOCK.floor + 0.02, 118, main);
  const crackMat = new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, depthWrite: false });
  const crackMesh = new THREE.Mesh(bulgeGeo, crackMat); crackMesh.position.set(0, DOCK.floor + 0.05, 118); main.add(crackMesh);
  const cracks = []; { const r = rng(33); for (let c = 0; c < 9; c++) { let x = 256 + (r() - 0.5) * 120, y = 256 + (r() - 0.5) * 120, a = r() * Math.PI * 2; const pts = [[x, y]]; for (let i = 0; i < 40; i++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 9; y += Math.sin(a) * 9; pts.push([x, y]); } cracks.push(pts); } }
  let lastCrack = -1;
  const drawCracks = (p) => {
    const q = Math.round(p * 100); if (q === lastCrack) return; lastCrack = q;
    const g = crackCanvas.getContext('2d'); g.clearRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(35,30,25,0.9)'; g.lineCap = 'round';
    for (const pts of cracks) { const n = Math.floor(pts.length * p); if (n < 2) continue; g.lineWidth = 3; g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i < n; i++) { g.lineWidth = 3 - i / pts.length * 2; g.lineTo(...pts[i]); } g.stroke(); }
    crackTex.needsUpdate = true;
  };
  drawCracks(0);
  const setBulge = (a) => {
    const p = bulgeGeo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) { const x = bulgeBase[i], z = bulgeBase[i + 2]; p[i + 1] = bulgeBase[i + 1] + a * Math.exp(-(x * x + z * z) / 30); }
    bulgeGeo.attributes.position.needsUpdate = true; bulgeGeo.computeVertexNormals();
  };

  // pompa binası, borular, vinçler
  const pump = makePumpHouse(T); pump.position.set(30, 0.1, 18); pump.rotation.y = -Math.PI / 2; main.add(pump);
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x9a3b24, roughness: 0.7 });
  for (let i = 0; i < 9; i++) { const p = mesh(new THREE.CylinderGeometry(0.45, 0.45, 9, 12), pipeMat, 23 + (i % 5) * 1.0 + (i >= 5 ? 0.5 : 0), 0.55 + (i >= 5 ? 0.85 : 0), 32, main); p.rotation.x = Math.PI / 2; }
  const c1 = makeCrane(M.yellow, M.dark); c1.position.set(-19, 0.1, 42); main.add(c1);
  const c2 = makeCrane(M.yellow, M.dark); c2.position.set(19, 0.1, 86); c2.rotation.y = Math.PI; main.add(c2);
  // ekskavatör ve kazı çukuru
  const EX = v3(-46, 0, 30);
  const pit = mesh(new THREE.CircleGeometry(7, 40), new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 1 }), EX.x + 7, 0.04, EX.z + 6, main); pit.rotation.x = -Math.PI / 2;
  const pit2 = mesh(new THREE.CircleGeometry(4.5, 32), new THREE.MeshStandardMaterial({ color: 0x2f2016, roughness: 1 }), EX.x + 7, 0.06, EX.z + 6, main); pit2.rotation.x = -Math.PI / 2;
  const mound = mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 1 }), EX.x - 6, 0, EX.z + 10, main); mound.scale.set(5, 2.6, 4);
  const exc = makeExcavator(); exc.position.copy(EX); exc.rotation.y = 0.9; main.add(exc);
  // işçi
  const worker = makeWorker(); main.add(worker);
  // gemi
  const ship = makeShip(T); main.add(ship);

  // ===== KESİT A: su hattı (midyeli pruva) =====
  const A = new THREE.Group(); A.position.set(OA, 0, 0); scene.add(A);
  const seaA = mesh(new THREE.PlaneGeometry(1800, 2000), seaMat, 0, -3, 50 - 1000, A, false); seaA.rotation.x = -Math.PI / 2;
  const aqMat = new THREE.MeshPhysicalMaterial({ color: 0x167884, transparent: true, opacity: 0.62, roughness: 0.2, depthWrite: false, side: THREE.FrontSide });
  const noFace = new THREE.MeshBasicMaterial({ visible: false });
  const aq = new THREE.Mesh(new THREE.BoxGeometry(140, 19, 140), [aqMat, aqMat, noFace, noFace, aqMat, aqMat]); aq.position.set(0, -12.5, -20); A.add(aq);
  block(-70, 70, -26, -22, -90, 50, { all: M.sand }, A);
  const shipA = makeShip(T); shipA.position.set(0, -3 - SHIP.draft, -12); A.add(shipA);
  const bubR = rng(4), bubN = 220; const bubGeo = new THREE.BufferGeometry(); const bubBase = [];
  for (let i = 0; i < bubN; i++) bubBase.push([(bubR() - 0.5) * 30, -21 + bubR() * 17, 20 + bubR() * 28, bubR()]);
  bubGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(bubN * 3), 3));
  const bubbles = new THREE.Points(bubGeo, new THREE.PointsMaterial({ size: 0.25, map: leakTex, transparent: true, depthWrite: false, color: 0xcff6ff, opacity: 0.7 })); A.add(bubbles);

  // ===== KESİT B: kapı kesiti (deniz yüksek, havuz boş) =====
  const B = new THREE.Group(); B.position.set(OB, 0, 0); scene.add(B);
  const seaB = mesh(new THREE.PlaneGeometry(2013, 2000), seaMat, -993.5, -3, -1003, B, false); seaB.rotation.x = -Math.PI / 2;
  block(-13, 13, -60, -20, -80, 80, { all: new THREE.MeshStandardMaterial({ map: T.soilDeep, roughness: 1 }) }, B); // temel
  block(-13, 13, -20, -16.5, -80, -6, { px: M.sand, py: M.sand, all: M.sand }, B); // deniz tabanı
  block(-13, 13, -20, -14, -6, 80, { px: M.concrete, py: M.floor, all: M.concrete }, B); // eşik + havuz tabanı
  block(-13, 13, -16.5, -14.5, -6, -3.4, { all: M.concrete }, B);                // yuva önü
  const waterB = new THREE.Mesh(new THREE.BoxGeometry(26, 13.5, 77), [aqMat, aqMat, noFace, noFace, aqMat, aqMat]); waterB.position.set(0, -9.75, -41.5); B.add(waterB);
  block(-14, -13, -14, 0, -6, 80, { all: wallMat }, B);                          // arka duvar
  block(-60, -14, -60, 0, 3, 80, { py: M.grass, all: soil }, B);
  const caissonB = new THREE.Group(); B.add(caissonB);
  mesh(new THREE.BoxGeometry(26.5, 15, 6), cMats, 0, 7.5, 0, caissonB);
  const gapJet = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(300 * 3), 3)), leakMat); B.add(gapJet);
  block(13, 14, -60, -20, -80, 80, { px: soil }, B);

  // ===== KESİT C: zemin altı (yeraltı suyu, yeni beton) =====
  const C = new THREE.Group(); C.position.set(OC, 0, 0); scene.add(C);
  const deepTex = T.soilDeep.clone(); deepTex.repeat.set(6, 1); deepTex.needsUpdate = true;
  const deep = new THREE.MeshStandardMaterial({ map: deepTex, roughness: 1 });
  block(-13, 13, -50, -3, -40, 40, { all: deep }, C);
  const gw = new THREE.Mesh(new THREE.BoxGeometry(26.2, 1, 80.2), new THREE.MeshBasicMaterial({ color: 0x2f8fe0, transparent: true, opacity: 0.45, depthWrite: false })); C.add(gw);
  const slabGeo = new THREE.BoxGeometry(26, 3, 80, 1, 1, 60); const slabBase = slabGeo.attributes.position.array.slice();
  const slab = mesh(slabGeo, [M.concrete, M.concrete, M.floor, M.concrete, M.concrete, M.concrete], 0, -1.5, 0, C);
  const newSlab = mesh(new THREE.BoxGeometry(26, 1, 80), new THREE.MeshStandardMaterial({ color: 0x9d9a92, roughness: 0.95 }), 0, 0, 0, C);
  for (const sx of [-1]) block(-14, -13, -50, 14, -40, 40, { all: wallMat }, C);
  block(-60, -14, -50, 14, -40, 40, { py: M.grass, all: soil }, C);
  const shipC = makeShip(T); C.add(shipC); shipC.scale.setScalar(1);
  const blocksC = makeKeelBlocks(T); C.add(blocksC);

  // ---------- zaman çizelgesi ----------
  const shipState = (t) => {
    // döndürür: {vis, z, base, roll, barn}
    const st = { vis: true, z: 62, base: DOCK.floor + 1.25, roll: 0, barn: true };
    if (t < 2.4) { st.vis = false; }
    else if (t < 5.2) { st.z = lerp(-185, -85, ease(ramp(t, 2.4, 5.2))); st.base = DOCK.sea - SHIP.draft; }
    else if (t < 13.6) { st.z = -150; st.base = DOCK.sea - SHIP.draft; }
    else if (t < 16.7) { st.z = lerp(-150, 60, easeOut(ramp(t, 13.8, 16.7))); st.base = DOCK.sea - SHIP.draft; }
    else if (t < 21.6) {
      const lv = level(t); st.base = Math.max(lv - SHIP.draft, DOCK.floor); st.z = 60;
      st.roll = clamp((-8.2 - lv) / 4.5) * 0.42;
    }
    else if (t < 26.8) st.vis = false;
    else if (t < 30.5) { const lv = level(t); st.base = Math.max(lv - SHIP.draft, DOCK.floor + 1.25); }
    if (t > 22) st.barn = false;
    return st;
  };
  function level(t) { // havuzdaki su seviyesi
    if (t < 2.4) return DOCK.sea;
    if (t < 9.6) return DOCK.sea;
    if (t < 13.2) return DOCK.floor - 1;
    if (t < 16.7) return lerp(DOCK.floor - 1, DOCK.sea, ease(ramp(t, 13.6, 15.4)));
    if (t < 21.6) return lerp(DOCK.sea, -12.6, ease(ramp(t, 17.3, 21.6)));
    if (t < 26.8) return lerp(DOCK.floor - 1, -6, easeOut(ramp(t, 24.4, 26.8)));
    if (t < 30.5) return lerp(DOCK.sea, DOCK.floor - 1, ease(ramp(t, 26.9, 29.0)));
    return DOCK.floor - 1;
  }
  const gateAngle = (t) => {
    if (t < 2.4) return 1.35;
    if (t < 9.6) return 1.35;
    if (t < 13.2) return 0;
    if (t < 16.7) return 1.35 * ease(ramp(t, 13.25, 14.1));
    if (t < 21.6) return 1.35 * (1 - ease(ramp(t, 16.7, 17.5)));
    return 0;
  };

  // ---------- kamera planları ----------
  const S = [];
  const shot = (t0, t1, fn) => S.push({ t0, t1, fn });
  const look = (pos, tgt, fov = 50, focus = null, size = 110) => ({ pos, tgt, fov, focus, size });
  const shipBow = () => v3(0, DOCK.floor + 4, 62 + SHIP.L / 2);
  shot(0, 2.4, (k, t) => { // ekskavatör, hızlı savrulma ile giriş
    const w = easeOut(k / 0.25);
    const tgt = lerpV(v3(-110, 6, -60), v3(EX.x + 2, 2.5, EX.z + 4), w);
    return look(lerpV(v3(-24, 8, 10), v3(-27, 7.5, 13), ease(k)), tgt, 50, v3(EX.x, 0, EX.z), 60);
  });
  shot(2.4, 5.2, (k, t) => look(lerpV(v3(14, 62, 48), v3(10, 55, 36), ease(k)), v3(0, -3, -95), 50, v3(0, 0, -40), 140));
  shot(5.2, 9.6, (k) => look(lerpV(v3(OA + 7, -2.2, 66), v3(OA + 4.5, -2.5, 57), ease(k)), v3(OA, -4.8, 30), 50, v3(OA, 0, 20), 60));
  shot(9.6, 13.2, (k) => look(lerpV(v3(62, 78, 168), v3(48, 66, 150), ease(k)), v3(0, -8, 48), 50, v3(0, 0, 40), 140));
  shot(13.2, 15.0, (k) => look(lerpV(v3(0, 4, 46), v3(0, 3, 38), ease(k)), v3(0, -7, 0), 55, v3(0, 0, 20), 90));
  shot(15.0, 16.7, (k, t) => { const z = shipState(t).z; return look(v3(12, 18, z - 115), v3(0, 0, z + 30), 50, v3(0, 0, z), 110); });
  shot(16.7, 19.6, (k) => look(lerpV(v3(58, 34, -12), v3(52, 30, -4), ease(k)), v3(8, -6, 38), 50, v3(15, 0, 30), 100));
  shot(19.6, 21.6, (k) => look(lerpV(v3(3, -3.5, 127), v3(2, -4.5, 125), ease(k)), v3(0, -7, 62), 55, v3(0, 0, 80), 80));
  shot(21.6, 26.8, (k, t) => { const z = lerp(16, 92, ease(k)); const y = Math.max(DOCK.floor + 2.4, level(t) + 2.2); return look(v3(2.6, y, z), v3(1.5, y - 1.6, z + 22), 55, v3(0, 0, z + 20), 60); });
  shot(26.8, 28.8, (k) => look(lerpV(v3(30, 9, 36), v3(28, 7, 40), ease(k)), v3(0, -10, 64), 50, v3(0, 0, 60), 80));
  shot(28.8, 30.5, (k) => look(lerpV(v3(10.5, -12.2, 116), v3(10.5, -11.8, 112), ease(k)), v3(7.5, -8, 60), 55, v3(0, 0, 80), 70));
  shot(30.5, 36.5, (k) => { const a = lerp(0.5, 1.9, ease(k)), c = v3(0, -10, 104); return look(v3(c.x + Math.sin(a) * 19, -11.6, c.z + Math.cos(a) * 19), v3(0, -7.5, 103), 55, v3(0, 0, 95), 60); });
  shot(36.5, 39.2, (k) => look(lerpV(v3(7, -10.5, 12), v3(4.5, -10.5, 8), ease(k)), v3(0, -7.5, 0), 60, v3(0, 0, 10), 50));
  shot(39.2, 43.5, (k) => look(lerpV(v3(26, 12, 32), v3(21, 10, 24), ease(k)), v3(0, -1, -8), 50, v3(0, 0, 0), 70));
  shot(43.5, 51.4, (k) => look(lerpV(v3(OB + 68, -4, 12), v3(OB + 50, -6, 6), ease(k)), v3(OB, -9, 0), 50, v3(OB, 0, 0), 70));
  shot(51.4, 55.6, (k) => look(lerpV(v3(6, -12.4, 129), v3(4.5, -12.7, 126), ease(k)), v3(0, -10.5, 104), 55, v3(0, 0, 110), 50));
  shot(55.6, 59.7, (k) => look(lerpV(v3(OC + 60, -3, 8), v3(OC + 50, -5, 5), ease(k)), v3(OC, -10, 0), 45, v3(OC, 0, 0), 60));
  shot(59.7, 63.0, (k) => look(lerpV(v3(OC + 50, -2, 6), v3(OC + 56, 6, 14), ease(k)), v3(OC, -1, 0), 45, v3(OC, 0, 0), 60));
  shot(63.0, DURATION + 1, (k) => look(lerpV(v3(46, 64, 182), v3(34, 52, 162), ease(k)), v3(0, -8, 66), 50, v3(0, 0, 60), 140));

  // ---------- güncelle ----------
  function update(t) {
    t = clamp(t, 0, DURATION);
    // su dokusu akışı
    T.waterNormal.offset.set(t * 0.004, t * 0.006); T.waterNormal2.offset.set(t * 0.02, -t * 0.035);
    // gemi
    const st = shipState(t);
    ship.visible = st.vis; ship.position.set(0, st.base, st.z); ship.rotation.z = st.roll;
    ship.userData.barn.visible = st.barn;
    // su
    const lv = level(t);
    dockWater.visible = lv > DOCK.floor - 0.5; dockWater.position.y = lv;
    const flooding = (t > 13.4 && t < 15.6) || (t > 24.3 && t < 26.8);
    foam.visible = flooding; foam.position.y = lv + 0.05;
    foamMat.opacity = flooding ? 0.7 * Math.sin(Math.PI * (t > 20 ? ramp(t, 24.3, 26.8) : ramp(t, 13.4, 15.6))) : 0;
    foam.position.z = t > 20 ? lerp(5, 100, ramp(t, 24.3, 26.8)) : lerp(5, 60, ramp(t, 13.4, 15.6));
    foamTex.offset.y = -t * 0.6;
    // kapılar
    const mitre = t < 39.2; leafL.visible = leafR.visible = mitre;
    const ga = gateAngle(t); leafL.rotation.y = ga; leafR.rotation.y = -ga;
    caisson.visible = !mitre;
    if (!mitre) {
      const mv = ease(ramp(t, 39.4, 41.2)), sk = ease(ramp(t, 41.0, 43.3));
      caisson.position.set(0, lerp(-9.2, DOCK.floor - 1.2, sk), lerp(-34, 0, mv));
      caisson.rotation.z = Math.sin(t * 1.3) * 0.01 * (1 - sk);
    }
    // sızıntılar
    leaks.visible = t > 36.4 && t < 39.3;
    if (leaks.visible) {
      const p = leakGeo.attributes.position.array, s = ease(ramp(t, 36.5, 37.3));
      leakSrc.forEach((L, i) => { const age = ((t * 0.9 + L.ph) % 1) * 1.6; p[i * 3] = L.x + L.vx * age; p[i * 3 + 1] = L.y - 4.9 * age * age; p[i * 3 + 2] = 0.9 + L.vz * age * s; if (p[i * 3 + 1] < DOCK.floor) p[i * 3 + 1] = DOCK.floor + 0.05; });
      leakGeo.attributes.position.needsUpdate = true;
    }
    // takozlar / destekler
    blocks.visible = t > 21.6;
    const pg = t < 26.8 ? 0 : ease(ramp(t, 28.8, 30.4));
    props.visible = pg > 0.001;
    propList.forEach((p, i) => { const k = clamp(pg * 1.6 - (i / propList.length) * 0.6); p.scale.set(1, Math.max(0.001, k), 1); });
    // çatlak / kabarma
    const cp = ease(ramp(t, 51.6, 54.2)), bp = ease(ramp(t, 53.0, 55.6));
    bulge.visible = crackMesh.visible = t > 51.2 && t < 63;
    if (bulge.visible) { drawCracks(cp); setBulge(bp * 1.4); }
    // ekskavatör kazı döngüsü
    const e = exc.userData, cyc = (t * 0.9) % 1;
    e.upper.rotation.y = Math.sin(t * 1.2) * 0.25;
    e.boom.rotation.x = 0.35 + Math.sin(cyc * Math.PI * 2) * 0.25;
    e.stick.rotation.x = 0.6 + Math.cos(cyc * Math.PI * 2) * 0.35;
    e.bucket.rotation.x = 0.8 + Math.sin(cyc * Math.PI * 2 + 1) * 0.5;
    // işçi
    worker.visible = t > 62.9;
    worker.position.set(-4 + (t - 63) * 0.9, DOCK.floor, 118); worker.rotation.y = Math.PI / 2;
    // kesit A: kabarcıklar
    const bp2 = bubGeo.attributes.position.array;
    bubBase.forEach(([x, y, z, ph], i) => { const yy = -21 + ((y + 21 + t * (1.2 + ph)) % 17.5); bp2[i * 3] = x + Math.sin(t * 2 + ph * 9) * 0.3; bp2[i * 3 + 1] = yy; bp2[i * 3 + 2] = z; });
    bubGeo.attributes.position.needsUpdate = true;
    shipA.position.y = -3 - SHIP.draft + Math.sin(t * 0.9) * 0.15; shipA.rotation.z = Math.sin(t * 0.7) * 0.01;
    // kesit B: deniz kapıyı bastırıyor
    const push = ease(ramp(t, 46.5, 49.5));
    caissonB.position.set(0, -16.5 + 0.0, -0.7 + push * 0.7);
    const gj = gapJet.geometry.attributes.position.array, jetOn = (1 - push);
    for (let i = 0; i < 300; i++) { const ph = (i * 0.618) % 1, age = ((t * 1.1 + ph) % 1) * 1.2; gj[i * 3] = (ph - 0.5) * 24; gj[i * 3 + 1] = -15.6 + (Math.sin(i) * 0.3) - 4.9 * age * age * 0.2; gj[i * 3 + 2] = 3 + age * 5 * jetOn - (jetOn < 0.05 ? 100 : 0); }
    gapJet.geometry.attributes.position.needsUpdate = true;
    // kesit C: yeraltı suyu + yeni döşeme
    const rise = ease(ramp(t, 56.0, 59.0));
    const gwTop = lerp(-30, -3.2, rise);
    gw.scale.y = gwTop + 50; gw.position.y = (-50 + gwTop) / 2;
    const sp = slabGeo.attributes.position.array, lift = rise * 0.9 * (1 - ease(ramp(t, 59.7, 61)));
    for (let i = 0; i < sp.length; i += 3) sp[i + 1] = slabBase[i + 1] + lift * Math.exp(-(sp[i + 2] ** 2) / 300);
    slabGeo.attributes.position.needsUpdate = true;
    const pour = ease(ramp(t, 60.0, 62.8)), th = Math.max(0.01, pour * 5.2);
    newSlab.visible = t > 59.9; newSlab.scale.y = th; newSlab.position.y = th / 2;
    shipC.visible = false; blocksC.visible = false;

    // kamera
    const sh = S.find(s => t >= s.t0 && t < s.t1) || S[S.length - 1];
    const k = (t - sh.t0) / (sh.t1 - sh.t0);
    const L = sh.fn(k, t);
    camera.position.copy(L.pos); camera.lookAt(L.tgt);
    sky.position.copy(camera.position);
    if (camera.fov !== L.fov) { camera.fov = L.fov; camera.updateProjectionMatrix(); }
    setSunFocus(L.focus || L.tgt, L.size);
  }

  update(0);
  return { scene, camera, update, duration: DURATION };
}
