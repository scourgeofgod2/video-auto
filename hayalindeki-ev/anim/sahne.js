// Erkeklerin Hayalindeki Ev — çekimler, kamera, karakterler, altyazı hapları.
import { ciz } from './karakter.js';

const Z = await fetch('zaman.json').then(r => r.json());
export const DURATION = Z.sure;
const W = 1080, H = 1920;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => { k = clamp(k); return k * k * (3 - 2 * k); };
const easeOut = k => { k = clamp(k); return 1 - (1 - k) ** 3; };
const back = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };

const R = Object.fromEntries(Z.replikler.map(r => [r.id, r]));

// ---------- replik başına ifade / kol ----------
const OYUN = {
  k1: { ifade: 'igrenme', kollar: 'belde' },
  k2: { ifade: 'saskin', kollar: 'sasirma' },
  k3: { ifade: 'igrenme', kollar: 'kavusmus', kafaEgim: -7 },
  k4: { ifade: 'dusunceli', kollar: 'cene' },
  k5: { ifade: 'sirit', kollar: 'yumruk', zipla: true },
  o6: { ifade: 'normal', kollar: 'omuz' },
  k7: { ifade: 'gozkirp', kollar: 'davet' },
  o8: { ifade: 'saskin', kollar: 'sasirma', titre: true },
  k9: { ifade: 'kendinden', kollar: 'isaret' },
  o10: { ifade: 'heyecan', kollar: 'heyecan', zipla: true },
};

// ---------- çekimler ----------
const k9 = R.k9.haplar;
const CUT_B8 = k9[1].t0 - 0.05;
const SHOTS = [
  { t0: 0, t1: 4.6, bg: 'B1', cam: [1.0, 1.07, 0.5, 0.42], kisi: [{ ad: 'kerem', x: 300, y: 2240, s: 1.18, yon: 1, bak: 1 }] },
  { t0: 4.6, t1: 7.4, bg: 'B2', cam: [1.0, 1.06, 0.5, 0.38], kisi: [{ ad: 'kerem', x: 770, y: 2240, s: 1.18, yon: -1, bak: -1 }] },
  { t0: 7.4, t1: 9.5, bg: 'B3', cam: [1.0, 1.05, 0.5, 0.35], kisi: [{ ad: 'kerem', x: 320, y: 2240, s: 1.18, yon: 1, bak: 1 }] },
  { t0: 9.5, t1: 12.2, bg: 'B4', cam: [1.0, 1.16, 0.66, 0.42], kisi: [{ ad: 'kerem', x: 760, y: 2240, s: 1.18, yon: -1, bak: -1 }] },
  { t0: 12.2, t1: 14.4, bg: 'B5', cam: [1.04, 1.12, 0.5, 0.5], kisi: [{ ad: 'kerem', x: 430, y: 2240, s: 1.2, yon: 1, bak: 0 }] },
  { t0: 14.4, t1: 15.35, bg: 'B4', wipe: 'B6', yazi: '6 AY SONRA', cam: [1.0, 1.04, 0.5, 0.45], kisi: [] },
  { t0: 15.35, t1: 20.45, bg: 'B6', cam: [1.0, 1.05, 0.45, 0.5], kisi: [
    { ad: 'kerem', x: 280, y: 2170, s: 1.0, yon: 1, bak: 1, dinle: { ifade: 'kendinden', kollar: 'belde' } },
    { ad: 'ozan', x: 800, y: 2170, s: 1.0, yon: -1, bak: -1, gir: 15.35, dinle: { ifade: 'saskin', kollar: 'asagi' } }] },
  { t0: 20.45, t1: 21.0, bg: 'B6', cam: [1.05, 1.9, 0.44, 0.47], kisi: [] },
  { t0: 21.0, t1: CUT_B8, bg: 'B7', cam: [1.0, 1.06, 0.5, 0.55], kisi: [
    { ad: 'ozan', x: 560, y: 2240, s: 1.15, yon: -1, bak: 0, git: [22.2, 820, 2190, 1.0], dinle: { ifade: 'saskin', kollar: 'asagi' } },
    { ad: 'kerem', x: 260, y: 2190, s: 1.0, yon: 1, bak: 1, gir: 22.15 }] },
  { t0: CUT_B8, t1: 99, bg: 'B8', cam: [1.12, 1.16, 0.5, 0.5], pan: [-70, 70], kisi: [
    { ad: 'kerem', x: 260, y: 2190, s: 1.0, yon: 1, bak: 1, dinle: { ifade: 'kendinden', kollar: 'belde' } },
    { ad: 'ozan', x: 820, y: 2190, s: 1.0, yon: -1, bak: -1, dinle: { ifade: 'saskin', kollar: 'asagi' } }] },
];

// ---------- görseller ----------
const BG = {};
async function yukle(ad) {
  for (const f of [`arkaplan/${ad}.png`, `arkaplan/${ad}_gecici.png`]) {
    const ok = await fetch(f, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
    if (!ok) continue;
    const im = new Image(); im.src = f; await im.decode(); return im;
  }
  throw new Error('görsel yok: ' + ad);
}
export async function init() {
  for (const b of ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']) BG[b] = await yukle(b);
}

function arkaplan(ctx, im, z, fx, fy, px = 0, py = 0) {
  const s = Math.max(W / im.width, H / im.height) * z;
  const w = im.width * s, h = im.height * s;
  let x = fx * W - fx * w + px, y = fy * H - fy * h + py;
  x = clamp(x, W - w, 0); y = clamp(y, H - h, 0);
  ctx.drawImage(im, x, y, w, h);
}

// ---------- karakter durumu ----------
function konusma(ad, t) {
  for (const r of Z.replikler) if (r.kim === ad && t >= r.t0 - 0.15 && t <= r.t1 + 0.45) return r;
  return null;
}
function agiz(r, t) {
  if (!r || t < r.t0 || t > r.t1) return 0;
  const i = Math.floor((t - r.t0) * Z.fps);
  return r.agiz[Math.min(i, r.agiz.length - 1)] || 0;
}
function durum(k, sh, t) {
  const r = konusma(k.ad, t);
  const dinle = k.dinle || { ifade: 'normal', kollar: 'asagi' };
  if (!r) return { ...dinle, agiz: 0 };
  const o = OYUN[r.id];
  const giris = ease((t - (r.t0 - 0.15)) / 0.25), cikis = 1 - ease((t - r.t1 - 0.15) / 0.3);
  const k2 = Math.min(giris, cikis);
  return {
    ifade: k2 > 0.5 ? o.ifade : dinle.ifade, kollarOnce: dinle.kollar, kollar: o.kollar, kolK: k2, agiz: agiz(r, t),
    kafaEgim: (o.kafaEgim || 0) * k2 + Math.sin(t * 9) * 3 * agiz(r, t),
    zipla: o.zipla && t >= r.t0 && t <= r.t1 ? Math.abs(Math.sin((t - r.t0) * 9)) * 40 : 0,
    titre: o.titre && t - r.t0 < 0.4 && t > r.t0,
  };
}

// ---------- yazılar ----------
function yuvarlak(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function baslik(ctx) {
  const txt = 'ERKEKLERİN HAYALİNDEKİ EV';
  ctx.font = '800 50px Inter'; const w = ctx.measureText(txt).width + 60;
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; yuvarlak(ctx, (W - w) / 2 + 4, 156, w, 84, 18); ctx.fill();
  ctx.fillStyle = '#ffe600'; yuvarlak(ctx, (W - w) / 2, 150, w, 84, 18); ctx.fill();
  ctx.fillStyle = '#111'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, 194);
}

function hap(ctx, metin, t, t0, buyuk = false, y = 1530) {
  const k = back((t - t0) / 0.18);
  const fs = buyuk ? 76 : 60;
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(0.6, 1, k), lerp(0.6, 1, k));
  ctx.font = `800 ${fs}px Inter`; const w = ctx.measureText(metin).width + 70, h = fs + 44;
  ctx.fillStyle = 'rgba(0,0,0,0.88)'; yuvarlak(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = buyuk ? '#ffe600' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(metin, 0, 3);
  ctx.restore();
}

function haplar(ctx, t) {
  for (const r of Z.replikler) for (const h of r.haplar) {
    if (t >= h.t0 && t < h.t1 + 0.12) {
      const buyuk = /!$/.test(h.metin) || /küçük|VURGUN|Vurgun/i.test(h.metin);
      hap(ctx, buyuk ? h.metin.toLocaleUpperCase('tr') : h.metin, t, h.t0, buyuk);
    }
  }
}

// ---------- çiz ----------
export function draw(ctx, t) {
  const sh = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  const k = clamp((t - sh.t0) / (Math.min(sh.t1, DURATION) - sh.t0));
  let [z0, z1, fx, fy] = sh.cam;
  const kz = sh.t0 === 20.45 ? easeOut(k) * easeOut(k) : ease(k);
  let px = sh.pan ? lerp(sh.pan[0], sh.pan[1], ease(k)) : 0, py = 0;
  // titreme (BU NE YA)
  const o8 = R.o8; if (t > o8.t0 && t < o8.t0 + 0.4) { const a = (1 - (t - o8.t0) / 0.4) * 22; px += Math.sin(t * 90) * a; py += Math.cos(t * 75) * a; }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  arkaplan(ctx, BG[sh.bg], lerp(z0, z1, kz), fx, fy, px, py);
  if (sh.wipe) { // önce/sonra silmesi
    const kw = ease((t - sh.t0 - 0.2) / 0.55), xw = kw * W;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, xw, H); ctx.clip(); arkaplan(ctx, BG[sh.wipe], lerp(z0, z1, kz), fx, fy); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillRect(xw - 6, 0, 12, H);
    hap(ctx, sh.yazi, t, sh.t0 + 0.05, true, 960);
  }
  // karakterler
  for (const p of sh.kisi) {
    if (p.gir && t < p.gir) continue;
    const st = durum(p, sh, t);
    const pk = back((t - (p.gir || sh.t0)) / 0.25);
    let x = p.x, y = p.y, s = p.s;
    if (p.git) { const g = ease((t - p.git[0]) / 0.35); x = lerp(p.x, p.git[1], g); y = lerp(p.y, p.git[2], g); s = lerp(p.s, p.git[3], g); }
    const faz = p.ad === 'kerem' ? 0 : 1.7;
    const kirp = ((t + faz) % 3.1) < 0.12;
    ciz(ctx, p.ad, {
      x: x + (st.titre ? Math.sin(t * 80) * 8 : 0), y: y + (1 - pk) * 120, olcek: s * lerp(0.85, 1, pk), yon: p.yon, bak: p.bak,
      ifade: st.ifade, agiz: st.agiz, kollar: st.kollar, kollarOnce: st.kollarOnce, kolK: st.kolK ?? 1,
      kirp, egim: Math.sin(t * 1.4 + faz) * 1.6, kafaEgim: st.kafaEgim || 0,
      ziplama: (st.zipla || 0) + Math.sin(t * 2.3 + faz) * 5,
    });
  }
  // flaş geçiş (kepenk → loft)
  if (t > 20.85 && t < 21.2) { ctx.fillStyle = `rgba(255,255,255,${1 - Math.abs(t - 21.0) / 0.2})`; ctx.fillRect(0, 0, W, H); }
  baslik(ctx);
  haplar(ctx, t);
}
