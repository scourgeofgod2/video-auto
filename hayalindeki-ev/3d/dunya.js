// Erkeklerin Hayalindeki Ev — 3D dünya (Three.js): 8 mekân, iki karakter, kamera planları, yazılar.
import * as THREE from 'three';
import { karakterYap } from './karakter3d.js';

const Z = await fetch('zaman.json').then(r => r.json());
const R = Object.fromEntries(Z.replikler.map(r => [r.id, r]));
const W = 1080, H = 1920;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const easeOut = k => { k = clamp(k); return 1 - (1 - k) ** 3; };
const back = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- dokular ----------
function ctex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); t.anisotropy = 8; return t;
}
const r0 = rng(5);
const speck = (g, w, h, n, cols, s0 = 1, s1 = 3) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; const s = s0 + r0() * (s1 - s0); g.fillRect(r0() * w, r0() * h, s, s); } };
const T = {
  grass: ctex(256, 256, (g, w, h) => { g.fillStyle = '#6aa84a'; g.fillRect(0, 0, w, h); speck(g, w, h, 3000, ['#5d9a40', '#79b657', '#64a345']); }, [30, 30]),
  asphalt: ctex(256, 256, (g, w, h) => { g.fillStyle = '#5b5e63'; g.fillRect(0, 0, w, h); speck(g, w, h, 4000, ['#51545a', '#676a70', '#4a4d52']); }, [10, 10]),
  paving: ctex(256, 256, (g, w, h) => { g.fillStyle = '#c9c3b8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a9a398'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } }, [20, 2]),
  cracked: ctex(512, 512, (g, w, h) => { g.fillStyle = '#9d9a91'; g.fillRect(0, 0, w, h); speck(g, w, h, 5000, ['#928f86', '#a8a59c', '#8a877e'], 1, 4); g.strokeStyle = 'rgba(40,38,34,0.7)'; for (let c = 0; c < 14; c++) { let x = r0() * w, y = r0() * h, a = r0() * 6; g.lineWidth = 2 + r0() * 2; g.beginPath(); g.moveTo(x, y); for (let i = 0; i < 18; i++) { a += (r0() - 0.5); x += Math.cos(a) * 12; y += Math.sin(a) * 12; g.lineTo(x, y); } g.stroke(); } for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(70,110,40,0.6)'; g.fillRect(r0() * w, r0() * h, 6 + r0() * 10, 3); } }, [3, 3]),
  polished: ctex(512, 512, (g, w, h) => { g.fillStyle = '#c6c8ca'; g.fillRect(0, 0, w, h); speck(g, w, h, 3000, ['#bfc1c3', '#cdcfd1', '#b8babc'], 1, 3); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * 256, 0); g.lineTo(i * 256, h); g.moveTo(0, i * 256); g.lineTo(w, i * 256); g.stroke(); } }, [4, 4]),
  rust: ctex(512, 512, (g, w, h) => { g.fillStyle = '#8f8f8c'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, 0, 5, h); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 7, 0, 3, h); } for (let i = 0; i < 90; i++) { const x = r0() * w, y = r0() * h * 0.6, l = 40 + r0() * 200; const gr = g.createLinearGradient(0, y, 0, y + l); gr.addColorStop(0, 'rgba(150,70,25,0.85)'); gr.addColorStop(1, 'rgba(150,70,25,0)'); g.fillStyle = gr; g.fillRect(x, y, 6 + r0() * 14, l); } }, [4, 1]),
  black: ctex(256, 256, (g, w, h) => { g.fillStyle = '#26282c'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x, 0, 3, h); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x + 4, 0, 4, h); } }, [6, 1]),
  shutterRust: ctex(256, 256, (g, w, h) => { g.fillStyle = '#7e5136'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 10) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, y, w, 3); } speck(g, w, h, 900, ['#9b6a44', '#6a3e26', '#a77a55'], 2, 8); }, [1, 1]),
  shutterBlack: ctex(256, 256, (g, w, h) => { g.fillStyle = '#1c1d20'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 10) { g.fillStyle = 'rgba(255,255,255,0.07)'; g.fillRect(0, y, w, 2); } }, [1, 1]),
  dirtyWall: ctex(512, 512, (g, w, h) => { g.fillStyle = '#a49c8c'; g.fillRect(0, 0, w, h); speck(g, w, h, 4000, ['#968e7e', '#b1aa9b', '#8c8473'], 2, 6); for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(80,60,40,${0.1 + r0() * 0.2})`; g.beginPath(); g.ellipse(r0() * w, r0() * h, 20 + r0() * 60, 10 + r0() * 40, 0, 0, 7); g.fill(); } for (let i = 0; i < 6; i++) { const x = r0() * w; g.fillStyle = 'rgba(60,110,40,0.75)'; for (let y = 0; y < h * (0.4 + r0() * 0.6); y += 6) g.fillRect(x + Math.sin(y * 0.05) * 10 + (r0() - 0.5) * 14, y, 8, 6); } }, [3, 1]),
  cleanWall: ctex(512, 512, (g, w, h) => { g.fillStyle = '#9fa1a3'; g.fillRect(0, 0, w, h); speck(g, w, h, 3000, ['#97999b', '#a8aaac', '#8f9193'], 2, 6); g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 2; for (let y = 0; y < h; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }, [3, 1]),
};
const M = (o) => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o });
const MAT = {
  white: M({ color: '#f3f1ec' }), offwhite: M({ color: '#e6e1d6' }), roofRed: M({ color: '#b5533a', flatShading: true }), wood: M({ color: '#7a5236' }),
  glass: M({ color: '#7fa7c4', roughness: 0.1, metalness: 0.2 }), darkGlass: M({ color: '#2c3d4d', roughness: 0.15, metalness: 0.3 }), black: M({ color: '#1e1f22' }),
  gold: M({ color: '#c9a23a', metalness: 0.6, roughness: 0.35 }), leaf: M({ color: '#7ab648', flatShading: true }), leafY: M({ color: '#c8b33f', flatShading: true }), trunk: M({ color: '#6a4b33' }),
  hedge: M({ color: '#4f8a3a', flatShading: true }), cypress: M({ color: '#3f7a35', flatShading: true }), pool: M({ color: '#3fb6d9', roughness: 0.1 }), stone: M({ color: '#d9d4c7' }),
  rustM: M({ map: T.rust }), blackM: M({ map: T.black, roughness: 0.6 }), shutterRust: M({ map: T.shutterRust }), shutterBlack: M({ map: T.shutterBlack, roughness: 0.5 }),
  grass: M({ map: T.grass }), asphalt: M({ map: T.asphalt }), paving: M({ map: T.paving }), cracked: M({ map: T.cracked }), polished: M({ map: T.polished, roughness: 0.25, metalness: 0.1 }),
  dirtyWall: M({ map: T.dirtyWall }), cleanWall: M({ map: T.cleanWall }), barrel: M({ color: '#a2552a' }), pallet: M({ color: '#9c7a55' }), debris: M({ color: '#8b8273', flatShading: true }),
  led: new THREE.MeshBasicMaterial({ color: '#fff7e0' }), warm: new THREE.MeshBasicMaterial({ color: '#ffd59a' }), screen: new THREE.MeshBasicMaterial({ color: '#5ab0ff' }),
  carGray: M({ color: '#8d9298', metalness: 0.6, roughness: 0.3 }), carWhite: M({ color: '#f2f2f2', metalness: 0.4, roughness: 0.25 }), tire: M({ color: '#1b1b1b' }), rim: M({ color: '#bfc3c7', metalness: 0.8, roughness: 0.3 }),
  rustCar: M({ color: '#7a5a43', flatShading: true }), bedGray: M({ color: '#8f9399' }), pillow: M({ color: '#dcdde0' }), plant: M({ color: '#4c8f3a', flatShading: true }), pot: M({ color: '#5b5f66' }),
};

function box(w, h, d, m, x, y, z, parent) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function cyl(rt, rb, h, m, x, y, z, parent, seg = 12) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function plane(w, d, m, x, y, z, parent, rep) { const mm = rep ? m.clone() : m; if (rep) { mm.map = m.map.clone(); mm.map.repeat.set(...rep); mm.map.needsUpdate = true; } const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mm); o.rotation.x = -Math.PI / 2; o.position.set(x, y, z); o.receiveShadow = true; parent.add(o); return o; }
function gable(w, h, d, m, x, y, z, parent) { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(0, h); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function tree(x, z, parent, s = 1, yellow = false) { cyl(0.18 * s, 0.25 * s, 2.4 * s, MAT.trunk, x, 1.2 * s, z, parent, 7); const r = rng(Math.round(x * 13 + z * 7)); for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry((1.1 + r() * 0.5) * s, 0), r() < 0.5 && yellow ? MAT.leafY : MAT.leaf); f.position.set(x + (r() - 0.5) * 1.4 * s, (2.8 + r() * 1.2) * s, z + (r() - 0.5) * 1.2 * s); f.rotation.set(r() * 3, r() * 3, 0); f.castShadow = true; parent.add(f); } }
function windowPane(w, h, x, y, z, parent, m = MAT.darkGlass, frame = MAT.white, ry = 0) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; box(w + 0.16, h + 0.16, 0.08, frame, 0, 0, 0, g); box(w, h, 0.1, m, 0, 0, 0.02, g); parent.add(g); return g; }

// ---------- mekânlar ----------
function sokak(p) { // ortak: yol, kaldırım, çim
  plane(60, 14, MAT.asphalt, 0, 0, 6, p, [8, 2]);
  box(60, 0.18, 3, MAT.paving, 0, 0.09, -2.5, p);
  plane(60, 40, MAT.grass, 0, 0.01, -24, p, [20, 14]);
  for (let x = -24; x <= 24; x += 6) box(1.6, 0.02, 0.18, MAT.white, x, 0.01, 4, p);
}
function L1_kucukEv(p) {
  sokak(p);
  const g = new THREE.Group(); g.position.set(0, 0, -10); p.add(g);
  box(7, 3, 6, MAT.white, 0, 1.6, 0, g); gable(7.8, 2, 6.6, MAT.roofRed, 0, 3.1, 0, g);
  box(1.1, 2, 0.12, MAT.wood, 0, 1.1, 3.02, g); windowPane(1.2, 1.1, -2.2, 1.9, 3.03, g, MAT.glass); windowPane(1.2, 1.1, 2.2, 1.9, 3.03, g, MAT.glass);
  cyl(0.25, 0.25, 1.2, MAT.roofRed, 2, 4.4, -1, g, 8);
  for (let x = -6; x <= 6; x += 0.5) if (Math.abs(x) > 0.9) box(0.12, 0.9, 0.06, MAT.white, x, 0.45, 4.6, g);
  box(12.4, 0.08, 0.06, MAT.white, 0, 0.7, 4.6, g);
  for (const x of [-3, -1.5, 1.5, 3]) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), MAT.hedge); b.position.set(x, 0.4, 3.6); g.add(b); }
  tree(-6.5, -6, p, 1.1, true); tree(7, -7, p, 1.2, true); tree(-12, -14, p, 1.3); tree(12, -16, p, 1.2, true);
}
function L2_kosk(p) {
  sokak(p);
  const g = new THREE.Group(); g.position.set(0, 0, -18); p.add(g);
  box(30, 11, 12, MAT.offwhite, 0, 5.5, 0, g); box(31, 0.6, 12.6, MAT.stone, 0, 11.2, 0, g);
  for (let x = -6; x <= 6; x += 2.4) cyl(0.45, 0.5, 10, MAT.white, x, 5.2, 6.6, g, 16);
  box(15, 0.8, 1.4, MAT.stone, 0, 10.6, 6.6, g); gable(15.5, 3.2, 1.6, MAT.white, 0, 11, 6.6, g);
  for (let row = 0; row < 3; row++) for (let x = -13.5; x <= 13.5; x += 2.25) if (Math.abs(x) > 7.5 || row === 2) windowPane(1.1, 1.9, x, 2.2 + row * 3.4, 6.05, g, MAT.darkGlass, MAT.stone);
  box(2.4, 3.6, 0.2, MAT.wood, 0, 1.8, 6.1, g);
  for (let x = -14; x <= 14; x += 0.35) if (Math.abs(x) > 2) cyl(0.04, 0.04, 2, MAT.black, x, 1, 10, g, 5);
  box(28, 0.1, 0.1, MAT.black, 0, 1.9, 10, g);
  for (const x of [-2.3, 2.3]) { box(1, 3, 1, MAT.stone, x, 1.5, 10, g); const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 10), MAT.stone); b.position.set(x, 3.35, 10); g.add(b); }
  for (let x = -1.8; x <= 1.8; x += 0.3) cyl(0.04, 0.04, 2.6, MAT.gold, x, 1.3, 10, g, 5);
  for (const x of [-11, -7.5, 7.5, 11]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.8, 4, 8), MAT.cypress); c.position.set(x, 2, 8); c.castShadow = true; g.add(c); }
  tree(-17, -6, p, 1.3, true); tree(17, -6, p, 1.3, true);
}
function L3_villa(p) {
  plane(60, 60, MAT.grass, 0, 0, -10, p, [24, 24]);
  const g = new THREE.Group(); g.position.set(1, 0, -14); p.add(g);
  box(12, 3.2, 8, MAT.white, -1.5, 1.6, 0, g); box(14, 3.2, 7, MAT.white, 1.5, 4.8, 0.6, g);
  box(10, 2.6, 0.1, MAT.glass, -1.5, 1.5, 4.05, g); box(12, 2.6, 0.1, MAT.glass, 1.5, 4.7, 4.15, g);
  for (let x = -6; x <= 3; x += 2.5) box(0.08, 2.6, 0.14, MAT.black, x, 1.5, 4.08, g);
  box(7, 0.06, 4, MAT.pool, -5, 0.05, 7, g); box(16, 0.12, 2.4, MAT.white, 0, 0.06, 4.8, g);
  for (const x of [-9, -7.8, 7, 8.4]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 8), MAT.hedge); b.position.set(x, 0.5, 5); g.add(b); }
  tree(-12, -6, p, 1.2); tree(13, -4, p, 1.1);
}
function depo(p) { // harabe ↔ yenilenmiş depo (dış + iç), tek bina
  const st = { yeni: false };
  const D = new THREE.Group(); D.position.set(0, 0, -12); p.add(D);
  const Wd = 22, Hd = 9, Dd = 20;
  const old = new THREE.Group(), neu = new THREE.Group(); D.add(old, neu);
  // dış cephe (ön duvar z=+Dd/2)
  const front = (m, grp) => {
    box(Wd, Hd, 0.3, m, 0, Hd / 2, Dd / 2, grp); box(0.3, Hd, Dd, m, -Wd / 2, Hd / 2, 0, grp); box(0.3, Hd, Dd, m, Wd / 2, Hd / 2, 0, grp);
    gable(Wd + 0.6, 3.5, 0.3, m, 0, Hd, Dd / 2, grp);
  };
  front(MAT.rustM, old); front(MAT.blackM, neu);
  // çatı
  for (const s of [-1, 1]) { const r = box(Wd / 2 + 0.8, 0.25, Dd + 0.6, s < 0 ? MAT.rustM : MAT.rustM, s * Wd / 4, Hd + 1.75, 0, D); r.rotation.z = -s * Math.atan(3.5 / (Wd / 2)); r.userData.roof = true; }
  // kepenk
  const shutterOld = box(7, 6, 0.2, MAT.shutterRust, 0, 3, Dd / 2 + 0.2, old);
  const shutterNew = box(7, 6, 0.2, MAT.shutterBlack, 0, 3, Dd / 2 + 0.38, neu);
  const glow = box(6.8, 5.9, 0.05, MAT.warm, 0, 3, Dd / 2 + 0.2, neu); // açılınca görünen iç ışık
  // pencereler: harabe kırık, yeni siyah çerçeve
  for (const x of [-7.5, 7.5]) { windowPane(4, 2.4, x, 5.6, Dd / 2 + 0.2, old, MAT.black, MAT.rustM); for (let i = 0; i < 4; i++) box(0.5 + r0(), 0.5 + r0() * 0.6, 0.12, MAT.glass, x - 1.4 + i * 0.9, 5 + r0() * 1.2, Dd / 2 + 0.28, old); }
  windowPane(9, 1.6, 0, 7.2, Dd / 2 + 0.2, neu, MAT.darkGlass, MAT.black);
  box(1.2, 2.4, 0.15, MAT.black, 5.5, 1.2, Dd / 2 + 0.25, neu);
  for (const x of [-4, 4]) { box(0.25, 0.4, 0.25, MAT.black, x, 4.6, Dd / 2 + 0.3, neu); const l = new THREE.PointLight('#ffcf8a', 6, 6); l.position.set(x, 4.4, Dd / 2 + 0.8); neu.add(l); }
  for (const x of [-9, 9]) { box(1.2, 0.8, 1.2, MAT.pot, x, 0.4, Dd / 2 + 1.4, neu); const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 0), MAT.plant); b.position.set(x, 1.4, Dd / 2 + 1.4); neu.add(b); }
  // dış zemin
  plane(70, 40, MAT.grass, 0, 0, -10, p, [25, 14]);
  const yardOld = plane(30, 16, MAT.cracked, 0, 0.02, Dd / 2 + 8, old, [3, 2]);
  const yardNew = plane(30, 16, MAT.paving, 0, 0.02, Dd / 2 + 8, neu, [6, 3]);
  for (const [x, z] of [[-8, 1], [-9, 2.5], [8.5, 1.5]]) cyl(0.45, 0.45, 1.1, MAT.barrel, x, 0.55, Dd / 2 + 1.5 + z, old);
  for (let i = 0; i < 30; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4 + r0() * 0.5, 5), MAT.hedge); c.position.set((r0() - 0.5) * 24, 0.2, Dd / 2 + 1 + r0() * 10 - 12 + 12); old.add(c); }
  box(1.4, 0.15, 1.2, MAT.pallet, -6, 0.3, Dd / 2 + 1.2, old).rotation.x = -1.2;
  tree(-15, -2, p, 1.3); tree(15, 2, p, 1.2, true);
  // ---- iç mekân (kamera içeride) ----
  const inOld = new THREE.Group(), inNew = new THREE.Group(); D.add(inOld, inNew);
  plane(Wd - 0.6, Dd - 0.6, MAT.cracked, 0, 0.03, 0, inOld, [3, 3]);
  plane(Wd - 0.6, Dd - 0.6, MAT.polished, 0, 0.03, 0, inNew, [3, 3]);
  const wallIn = (m, grp) => { box(Wd - 0.6, Hd, 0.1, m, 0, Hd / 2, -Dd / 2 + 0.25, grp); box(0.1, Hd, Dd - 0.6, m, -Wd / 2 + 0.25, Hd / 2, 0, grp); box(0.1, Hd, Dd - 0.6, m, Wd / 2 - 0.25, Hd / 2, 0, grp); box(Wd - 0.6, Hd, 0.1, m, 0, Hd / 2, Dd / 2 - 0.25, grp); };
  wallIn(MAT.dirtyWall, inOld); wallIn(MAT.cleanWall, inNew);
  for (let z = -8; z <= 8; z += 4) { box(Wd, 0.25, 0.25, MAT.black, 0, Hd + 0.2, z, D); }
  // arka duvar pencereleri
  for (const x of [-6, 0, 6]) { windowPane(4.2, 3.4, x, 4.5, -Dd / 2 + 0.35, inOld, MAT.glass, MAT.rustM); windowPane(4.2, 3.6, x, 4.5, -Dd / 2 + 0.35, inNew, new THREE.MeshBasicMaterial({ color: '#cfe8ff' }), MAT.black); }
  // harabe: moloz, hurda araba, variller
  for (let i = 0; i < 60; i++) { const d = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15 + r0() * 0.35, 0), MAT.debris); d.position.set((r0() - 0.5) * 18, 0.1, (r0() - 0.5) * 16); d.rotation.set(r0() * 3, r0() * 3, 0); d.castShadow = true; inOld.add(d); }
  const rc = new THREE.Group(); rc.position.set(-6, 0, -4); rc.rotation.y = 0.5; inOld.add(rc);
  box(4.2, 0.8, 1.8, MAT.rustCar, 0, 0.7, 0, rc); box(2.2, 0.6, 1.6, MAT.rustCar, -0.2, 1.35, 0, rc);
  for (const [x, z] of [[-1.4, 0.9], [1.4, 0.9], [-1.4, -0.9], [1.4, -0.9]]) { const w = cyl(0.38, 0.38, 0.25, MAT.tire, x, 0.35, z, rc, 12); w.rotation.x = Math.PI / 2; }
  for (const [x, z] of [[6, -6], [7, -5], [8, 3]]) cyl(0.45, 0.45, 1.1, MAT.barrel, x, 0.55, z, inOld);
  for (const x of [-9, -4, 3, 9]) { const v = box(0.6, Hd * (0.5 + r0() * 0.4), 0.05, MAT.hedge, x, Hd * 0.6, -Dd / 2 + 0.32, inOld); }
  // yeni: LED şeritler, arabalar, spor köşesi, yatak, masa
  for (let z = -7; z <= 7; z += 3.5) box(14, 0.06, 0.12, MAT.led, 0, Hd - 0.3, z, inNew);
  const pl = new THREE.PointLight('#fff2dd', 30, 30); pl.position.set(0, 7, 2); inNew.add(pl);
  const pl2 = new THREE.PointLight('#fff2dd', 20, 25); pl2.position.set(-5, 7, -5); inNew.add(pl2);
  const araba = (m, x, z, ry) => {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; inNew.add(c);
    const s = new THREE.Shape(); s.moveTo(-2.2, 0.3); s.lineTo(2.25, 0.3); s.quadraticCurveTo(2.4, 0.5, 2.2, 0.8); s.lineTo(1.1, 0.95); s.lineTo(0.4, 1.35); s.lineTo(-1.0, 1.35); s.lineTo(-2.1, 0.95); s.lineTo(-2.25, 0.5); s.lineTo(-2.2, 0.3);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.8, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.1, bevelSegments: 3 }); g.translate(0, 0, -0.9);
    const b = new THREE.Mesh(g, m); b.castShadow = true; c.add(b);
    box(1.45, 0.38, 1.72, MAT.darkGlass, -0.25, 1.15, 0, c);
    for (const [wx, wz] of [[-1.35, 0.92], [1.35, 0.92], [-1.35, -0.92], [1.35, -0.92]]) { const w = cyl(0.36, 0.36, 0.28, MAT.tire, wx, 0.36, wz, c, 18); w.rotation.x = Math.PI / 2; const rr = cyl(0.22, 0.22, 0.3, MAT.rim, wx, 0.36, wz, c, 12); rr.rotation.x = Math.PI / 2; }
    box(0.1, 0.12, 0.5, MAT.led, 2.28, 0.72, 0.55, c); box(0.1, 0.12, 0.5, MAT.led, 2.28, 0.72, -0.55, c);
  };
  araba(MAT.carGray, -3, -2, -0.35); araba(MAT.carWhite, 3.2, -2.5, 0.35);
  // spor köşesi (sol arka) + yatak + masa (sağ ön)
  const gym = new THREE.Group(); gym.position.set(-6.6, 0, -6.6); gym.rotation.y = 0.25; inNew.add(gym);
  for (const [x, z] of [[-1, -0.7], [1, -0.7], [-1, 0.7], [1, 0.7]]) box(0.12, 2.6, 0.12, MAT.black, x, 1.3, z, gym);
  box(2.2, 0.1, 0.1, MAT.black, 0, 2.6, -0.7, gym); box(2.2, 0.1, 0.1, MAT.black, 0, 2.6, 0.7, gym);
  const bar = cyl(0.04, 0.04, 2.8, MAT.rim, 0, 1.6, 0, gym, 8); bar.rotation.z = Math.PI / 2;
  for (const x of [-1.25, 1.25]) { const pl = cyl(0.42, 0.42, 0.12, MAT.black, x, 1.6, 0, gym, 18); pl.rotation.z = Math.PI / 2; }
  box(1.4, 0.15, 0.4, MAT.black, 0, 0.5, 1.6, gym);
  const bed = new THREE.Group(); bed.position.set(6.6, 0, -6.4); bed.rotation.y = 0; inNew.add(bed);
  box(2.4, 0.35, 3, MAT.black, 0, 0.18, 0, bed); box(2.2, 0.35, 2.7, MAT.bedGray, 0, 0.5, 0.05, bed);
  for (const x of [-0.55, 0.55]) box(0.8, 0.2, 0.5, MAT.pillow, x, 0.78, -1.05, bed);
  box(2.6, 1.2, 0.15, MAT.black, 0, 0.6, -1.5, bed); box(2.4, 0.03, 0.03, MAT.warm, 0, 0.02, 1.5, bed);
  const desk = new THREE.Group(); desk.position.set(1.2, 0, -8.6); desk.rotation.y = 0; inNew.add(desk);
  box(2.4, 0.08, 0.9, MAT.black, 0, 1.0, 0, desk); for (const x of [-1.1, 1.1]) box(0.08, 1, 0.8, MAT.black, x, 0.5, 0, desk);
  for (const x of [-0.6, 0.6]) { box(1.05, 0.62, 0.06, MAT.black, x, 1.5, -0.25, desk); box(0.97, 0.54, 0.02, MAT.screen, x, 1.5, -0.21, desk); }
  const plant = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 0), MAT.plant); plant.position.set(9, 1.4, -6); inNew.add(plant); box(0.9, 0.9, 0.9, MAT.pot, 9, 0.45, -6, inNew);

  const sahne = { D, old, neu, inOld, inNew, shutterNew, glow };
  st.set = (yeni, ic, kepenk = 0) => {
    old.visible = !yeni && !ic; neu.visible = yeni && !ic; inOld.visible = !yeni && ic; inNew.visible = yeni && ic;
    D.children.forEach(o => { if (o.userData.roof) { o.visible = !ic || yeni; o.material = yeni ? MAT.blackM : MAT.rustM; } });
    shutterNew.position.y = 3 + kepenk * 5.8; glow.visible = kepenk > 0.02;
  };
  st.D = D;
  return st;
}

// ---------- dünya ----------
export async function createWorld(renderer, aspect) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 600);
  // gökyüzü: dikey gradyan küre
  const skyM = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { top: { value: new THREE.Color('#4f9be0') }, bot: { value: new THREE.Color('#d8ecf8') } },
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vp; void main(){ float k = clamp(vp.y*1.6+0.1,0.0,1.0); gl_FragColor = vec4(mix(bot, top, k),1.0); }' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), skyM); scene.add(sky);
  // bulutlar
  const cloudM = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 });
  const cr = rng(9);
  for (let i = 0; i < 40; i++) { const g = new THREE.Group(); const a = cr() * Math.PI * 2, d = 120 + cr() * 120; g.position.set(Math.cos(a) * d, 40 + cr() * 50, Math.sin(a) * d); for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(5 + cr() * 5, 0), cloudM); b.position.set(j * 6 - 9, cr() * 2, cr() * 3); g.add(b); } scene.add(g); }
  scene.fog = new THREE.Fog('#d8ecf8', 90, 300);
  const hemi = new THREE.HemisphereLight('#e5f2ff', '#a89a7c', 1.25); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d6', 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: 1, far: 120 }); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const sunDir = v3(0.55, 1, 0.65).normalize();

  // mekânlar ayrı yerlerde
  const LOC = {};
  const yer = (ad, x, fn) => { const g = new THREE.Group(); g.position.set(x, 0, 0); scene.add(g); LOC[ad] = { g, x, st: fn(g) }; };
  yer('L1', 0, L1_kucukEv); yer('L2', 200, L2_kosk); yer('L3', 400, L3_villa); yer('D', 600, depo);
  const dep = LOC.D.st;

  const kerem = karakterYap('kerem'), ozan = karakterYap('ozan'); scene.add(kerem, ozan);

  // ---------- çekimler ----------
  const t = id => R[id];
  const mid = (a, b) => (t(a).t1 + t(b).t0) / 2;
  const k9 = R.k9.haplar;
  const C = {
    s1: [0, mid('k1', 'k2')], s2: [mid('k1', 'k2'), mid('k2', 'k3')], s3: [mid('k2', 'k3'), mid('k3', 'k4')], s4: [mid('k3', 'k4'), mid('k4', 'k5')],
    s5: [mid('k4', 'k5'), R.k5.t1 + 0.15], s6: [R.k5.t1 + 0.15, R.o6.t0 - 0.05], s7: [R.o6.t0 - 0.05, R.k7.t1 + 0.12],
    s8: [R.k7.t1 + 0.12, R.o8.t0 - 0.12], s9: [R.o8.t0 - 0.12, k9[1].t0 - 0.05], s10: [k9[1].t0 - 0.05, R.o10.t0 - 0.1], s11: [R.o10.t0 - 0.1, 999],
  };
  const DX = 600, DZ = -12; // depo merkezi (dünya)
  // kadraj: a = karakter(ler)in ortası (dünya), d = kamera mesafesi, h = kamera yüksekliği, ox = yatay kayma [baş, son], hedef yüksekliği ty, uzak bakış L
  const F = (ax, az, o = {}) => ({ ax, az, d: o.d ?? 4.2, d1: o.d1 ?? (o.d ?? 4.2) - 0.45, h: o.h ?? 1.55, ox: o.ox ?? [0.25, -0.1], ty: o.ty ?? 2.6, L: o.L ?? 12 });
  const SHOTS = [
    { c: C.s1, loc: 'L1', f: F(0, 6), kisi: [['kerem', 0.05, 0, 6, -0.15]] },
    { c: C.s2, loc: 'L2', f: F(200, 6.5, { ty: 3.6, ox: [-0.25, 0.1] }), kisi: [['kerem', 200.0, 0, 6.5, 0.15]] },
    { c: C.s3, loc: 'L3', f: F(400.3, 5.5, { ty: 3 }), kisi: [['kerem', 400.35, 0, 5.5, -0.2]] },
    { c: C.s4, loc: 'D', yeni: 0, f: F(DX, DZ + 22, { ty: 3.6, d: 4.6, d1: 3.6, L: 14 }), kisi: [['kerem', DX - 0.05, 0, DZ + 22, 0.25]] },
    { c: C.s5, loc: 'D', yeni: 0, ic: 1, f: F(DX, DZ + 3.5, { ty: 2.8, d: 4.9, d1: 4.4 }), kisi: [['kerem', DX, 0, DZ + 3.5, 0]] },
    { c: C.s6, loc: 'D', donusum: true, cam: [v3(DX + 9, 4, DZ + 30), v3(DX, 4.5, DZ + 8), v3(DX - 9, 4.5, DZ + 30)], kisi: [] },
    { c: C.s7, loc: 'D', yeni: 1, f: F(DX, DZ + 22.5, { d: 5.4, d1: 5.0, ty: 3.4, ox: [0.2, -0.2] }), kisi: [['kerem', DX - 0.62, 0, DZ + 22.5, 0.4], ['ozan', DX + 0.62, 0, DZ + 22.5, -0.4]] },
    { c: C.s8, loc: 'D', yeni: 1, kepenk: true, cam: [v3(DX, 2.6, DZ + 33), v3(DX, 3.4, DZ + 10), v3(DX, 2.8, DZ + 27.5)], kisi: [] },
    { c: C.s9, loc: 'D', yeni: 1, ic: 1, f: F(DX, DZ + 4.3, { d: 4.3, d1: 4.9, ty: 1.9, L: 10, ox: [0, 0.1] }), kisi: [['ozan', DX + 0.35, 0, DZ + 4.3, -0.1], ['kerem', DX - 0.75, 0, DZ + 4.6, 0.4, 'gir']] },
    { c: C.s10, loc: 'D', yeni: 1, ic: 1, cam: [v3(DX - 3.5, 2.3, DZ + 6), v3(DX - 6.5, 1.3, DZ - 6.6), v3(DX + 3.5, 2.3, DZ + 6), v3(DX + 6.6, 0.9, DZ - 6.4)], kisi: [] },
    { c: C.s11, loc: 'D', yeni: 1, ic: 1, f: F(DX + 1.2, DZ + 3.6, { d: 5.0, d1: 4.8, ty: 2.0, L: 10, ox: [-1.0, 0.9] }), kisi: [['kerem', DX + 0.6, 0, DZ + 3.6, 0.35], ['ozan', DX + 1.8, 0, DZ + 3.6, -0.35]] },
  ];

  const OYUN = {
    k1: { ifade: 'igrenme', kollar: 'belde' }, k2: { ifade: 'saskin', kollar: 'sasirma' }, k3: { ifade: 'igrenme', kollar: 'kavusmus', kafaY: -18 },
    k4: { ifade: 'dusunceli', kollar: 'cene' }, k5: { ifade: 'sirit', kollar: 'yumruk', zipla: 1 }, o6: { ifade: 'normal', kollar: 'omuz' },
    k7: { ifade: 'gozkirp', kollar: 'davet' }, o8: { ifade: 'saskin', kollar: 'sasirma', titre: 1 }, k9: { ifade: 'kendinden', kollar: 'isaret' }, o10: { ifade: 'heyecan', kollar: 'heyecan', zipla: 1 },
  };
  const DINLE = { kerem: { ifade: 'kendinden', kollar: 'belde' }, ozan: { ifade: 'saskin', kollar: 'asagi' } };
  function agiz(r, tt) { if (!r || tt < r.t0 || tt > r.t1) return 0; return r.agiz[Math.min(r.agiz.length - 1, Math.floor((tt - r.t0) * Z.fps))] || 0; }
  function durum(ad, tt) {
    const r = Z.replikler.find(r => r.kim === ad && tt >= r.t0 - 0.15 && tt <= r.t1 + 0.45);
    const d = DINLE[ad];
    if (!r) return { ...d, agiz: 0 };
    const o = OYUN[r.id], k = Math.min(ease((tt - r.t0 + 0.15) / 0.25), 1 - ease((tt - r.t1 - 0.15) / 0.3)), m = agiz(r, tt);
    return { ifade: k > 0.5 ? o.ifade : d.ifade, kollarOnce: d.kollar, kollar: o.kollar, kolK: k, agiz: m, kafaY: (o.kafaY || 0) * k, kafaX: -Math.sin(tt * 9) * 4 * m,
      zipla: o.zipla && tt > r.t0 && tt < r.t1 ? Math.abs(Math.sin((tt - r.t0) * 8)) * 0.22 : 0, titre: o.titre && tt > r.t0 && tt - r.t0 < 0.45 };
  }

  function camPath(sh, k) {
    const c = sh.cam;
    if (c.length === 4) { // iki noktalı yan kaydırma
      return [lerpV(c[0], c[2], k), lerpV(c[1], c[3], k)];
    }
    return [lerpV(c[0], c[2], k), c[1]];
  }
  function lerpV(a, b, k) { return a.clone().lerp(b, k); }

  function update(tt) {
    const sh = SHOTS.find(s => tt >= s.c[0] && tt < s.c[1]) || SHOTS[SHOTS.length - 1];
    const span = Math.min(sh.c[1], Z.sure) - sh.c[0], k = clamp((tt - sh.c[0]) / span);
    // depo durumu
    let yeni = sh.yeni, kepenk = 0;
    if (sh.donusum) yeni = k > 0.5 ? 1 : 0;
    if (sh.kepenk) kepenk = easeOut((k - 0.25) / 0.6);
    dep.set(!!yeni, !!sh.ic, kepenk);
    // kamera
    let pos, tgt;
    if (sh.f) {
      const f = sh.f, e = ease(k);
      pos = v3(f.ax + lerp(f.ox[0], f.ox[1], e), f.h, f.az + lerp(f.d, f.d1, e));
      tgt = v3(f.ax + lerp(f.ox[0], f.ox[1], e) * 0.3, f.ty, f.az - f.L);
    } else if (sh.cam.length === 4) [pos, tgt] = camPath(sh, ease(k));
    else [pos, tgt] = sh.kepenk ? [lerpV(sh.cam[0], sh.cam[2], easeOut(k)), sh.cam[1]] : [lerpV(sh.cam[0], sh.cam[2], ease(k)), sh.cam[1]];
    pos = pos.clone();
    const r8 = R.o8;
    if (tt > r8.t0 && tt < r8.t0 + 0.45) { const a = (1 - (tt - r8.t0) / 0.45) * 0.08; pos.x += Math.sin(tt * 90) * a; pos.y += Math.cos(tt * 77) * a; }
    camera.position.copy(pos); camera.lookAt(tgt);
    sky.position.copy(camera.position);
    const focus = sh.loc === 'D' ? v3(DX, 0, sh.ic ? DZ : DZ + 14) : v3(LOC[sh.loc].x, 0, 0);
    sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(sunDir, 60);
    // karakterler
    kerem.visible = ozan.visible = false;
    for (const [ad, x, y, z, ry, gir] of sh.kisi) {
      const ch = ad === 'kerem' ? kerem : ozan; ch.visible = true;
      const t0 = gir ? R.k9.t0 - 0.25 : sh.c[0];
      if (gir && tt < t0) { ch.visible = false; continue; }
      const pk = back((tt - t0) / 0.28);
      ch.position.set(x, y, z); ch.rotation.y = ry; ch.scale.setScalar(lerp(0.7, 1, pk));
      const s = durum(ad, tt), faz = ad === 'kerem' ? 0 : 1.7;
      if (s.titre) ch.position.x += Math.sin(tt * 80) * 0.04;
      ch.userData.guncelle({ ...s, kirp: ((tt + faz) % 3.1) < 0.12, egim: Math.sin(tt * 1.4 + faz) * 1.5, ziplama: (s.zipla || 0) + Math.abs(Math.sin(tt * 2.2 + faz)) * 0.015, bak: ad === 'kerem' ? 0 : 0, ezilme: (1 - pk) * 0.15 });
    }
  }

  // ---------- yazılar ----------
  function yuv(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function baslik(ctx) {
    const txt = 'ERKEKLERİN HAYALİNDEKİ EV';
    ctx.font = '800 50px Inter'; const w = ctx.measureText(txt).width + 60;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; yuv(ctx, (W - w) / 2 + 4, 156, w, 84, 18); ctx.fill();
    ctx.fillStyle = '#ffe600'; yuv(ctx, (W - w) / 2, 150, w, 84, 18); ctx.fill();
    ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, 194);
  }
  function hap(ctx, metin, tt, t0, buyuk, y = 1560) {
    const k = back((tt - t0) / 0.18), fs = buyuk ? 76 : 60;
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(0.6, 1, k), lerp(0.6, 1, k));
    ctx.font = `800 ${fs}px Inter`; const w = ctx.measureText(metin).width + 70, h = fs + 44;
    ctx.fillStyle = 'rgba(0,0,0,0.88)'; yuv(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
    ctx.fillStyle = buyuk ? '#ffe600' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(metin, 0, 3);
    ctx.restore();
  }
  function ui(ctx, tt) {
    // dönüşüm flaşı ve kepenk flaşı
    const s6 = C.s6, fl = (a) => Math.max(0, 1 - Math.abs(tt - a) / 0.18);
    const f = Math.max(fl((s6[0] + s6[1]) / 2), fl(C.s8[1]));
    if (f > 0) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); }
    baslik(ctx);
    if (tt >= s6[0] && tt < s6[1]) hap(ctx, '6 AY SONRA', tt, s6[0] + 0.05, true, 960);
    let son = null;
    for (const r of Z.replikler) for (const h of r.haplar) if (tt >= h.t0 && tt < h.t1 + 0.12) son = h;
    if (son) { const b = /!$/.test(son.metin) || /küçük/i.test(son.metin); hap(ctx, b ? son.metin.toLocaleUpperCase('tr') : son.metin, tt, son.t0, b); }
  }

  update(0);
  return { scene, camera, update, ui, duration: Z.sure };
}
