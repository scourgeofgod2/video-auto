// Çizgi film karakter kuklası (canvas 2D): kalın kontur, düz renk.
// Koordinatlar karakter biriminde; (0,0) boyun, y aşağı. Ayaklar y≈760, saç üstü y≈-330.

export const KARAKTERLER = {
  kerem: { cilt: '#f2c29b', ciltGolge: '#dba57e', sac: '#5b3920', ust: '#f26a1b', ustGolge: '#d4550f', pantolon: '#8b909a', ayakkabi: '#2b2b2b', sacTip: 'kisa', ic: null },
  ozan: { cilt: '#c88b5f', ciltGolge: '#ab6f46', sac: '#1f1916', ust: '#3f6fb5', ustGolge: '#2f5791', pantolon: '#2f3440', ayakkabi: '#f1f1f1', sacTip: 'kivircik', ic: '#f4f4f4' },
};

// kol pozları: [omuz açısı, dirsek açısı] (derece; 0 = aşağı, + = dışa/yukarı)
export const KOLLAR = {
  asagi: [[8, 4], [8, 4]],
  belde: [[38, -95], [38, -95]],
  kavusmus: [[-35, 120], [-35, 120]],
  omuz: [[55, 70], [55, 70]],          // omuz silkme / "ne yapalım"
  yumruk: [[10, 5], [150, 25]],         // sağ kol yukarı yumruk
  isaret: [[8, 4], [95, 5]],            // sağ kol ileri işaret
  davet: [[8, 4], [70, -40]],           // sağ kol "gel" hareketi
  sasirma: [[120, 40], [120, 40]],      // iki el havada
  cene: [[8, 4], [25, 140]],            // eli çenede, düşünme
  heyecan: [[150, 30], [150, 30]],      // iki kol yukarı
};

const K = 9; // kontur kalınlığı

function yol(ctx, fill, cizim) {
  ctx.beginPath(); cizim(); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = K; ctx.strokeStyle = '#111'; ctx.lineJoin = 'round'; ctx.stroke();
}

function kalinCizgi(ctx, pts, w, renk) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.strokeStyle = '#111'; ctx.lineWidth = w + K * 2; ctx.stroke();
  ctx.strokeStyle = renk; ctx.lineWidth = w; ctx.stroke();
}

function kol(ctx, c, taraf, omuzA, dirsekA) {
  const sx = taraf * 128, sy = 30;
  const r = d => d * Math.PI / 180;
  const a1 = r(omuzA) * taraf, l1 = 165, l2 = 150;
  const ex = sx + Math.sin(a1) * l1, ey = sy + Math.cos(a1) * l1;
  const a2 = a1 + r(dirsekA) * taraf;
  const hx = ex + Math.sin(a2) * l2, hy = ey + Math.cos(a2) * l2;
  kalinCizgi(ctx, [[sx, sy], [ex, ey], [hx, hy]], 66, c.ust);
  // manşet + el
  yol(ctx, c.cilt, () => ctx.arc(hx + Math.sin(a2) * 12, hy + Math.cos(a2) * 12, 33, 0, Math.PI * 2));
  // başparmak
  const tx = hx + Math.sin(a2 - taraf * 1.2) * 34, ty = hy + Math.cos(a2 - taraf * 1.2) * 34;
  yol(ctx, c.cilt, () => ctx.ellipse(tx, ty, 13, 19, a2, 0, Math.PI * 2));
}

function govde(ctx, c) {
  // bacaklar
  for (const s of [-1, 1]) {
    yol(ctx, c.pantolon, () => { ctx.moveTo(s * 18, 320); ctx.lineTo(s * 118, 320); ctx.lineTo(s * 104, 735); ctx.lineTo(s * 30, 735); });
    yol(ctx, c.ayakkabi, () => ctx.ellipse(s * 72, 745, 62, 26, 0, Math.PI, Math.PI * 2, false));
  }
  // gövde
  yol(ctx, c.ust, () => {
    ctx.moveTo(-120, 0); ctx.quadraticCurveTo(-160, 10, -158, 70);
    ctx.lineTo(-142, 345); ctx.quadraticCurveTo(0, 365, 142, 345);
    ctx.lineTo(158, 70); ctx.quadraticCurveTo(160, 10, 120, 0); ctx.quadraticCurveTo(0, -20, -120, 0);
  });
  if (c.ic) { // ceketin içindeki tişört
    yol(ctx, c.ic, () => { ctx.moveTo(-48, 0); ctx.lineTo(48, 0); ctx.lineTo(34, 352); ctx.lineTo(-34, 352); });
    ctx.strokeStyle = '#111'; ctx.lineWidth = 6;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 50, 0); ctx.lineTo(s * 95, 90); ctx.lineTo(s * 60, 120); ctx.stroke(); }
  } else { // kapüşon ipleri + cep
    ctx.strokeStyle = '#111'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 26, 8); ctx.lineTo(s * 30, 110); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-85, 230); ctx.lineTo(85, 230); ctx.lineTo(70, 300); ctx.lineTo(-70, 300); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = c.ustGolge; ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1;
  }
}

function kafa(ctx, c, p) {
  // boyun
  yol(ctx, c.ciltGolge, () => ctx.rect(-36, -60, 72, 70));
  if (!c.ic) yol(ctx, c.ustGolge, () => ctx.ellipse(0, 0, 100, 34, 0, 0, Math.PI * 2)); // kapüşon yakası
  // kulaklar
  for (const s of [-1, 1]) yol(ctx, c.cilt, () => ctx.ellipse(s * 112, -165, 24, 34, 0, 0, Math.PI * 2));
  // yüz
  yol(ctx, c.cilt, () => {
    ctx.moveTo(-110, -250); ctx.quadraticCurveTo(-118, -120, -86, -70);
    ctx.quadraticCurveTo(-40, -28, 0, -26); ctx.quadraticCurveTo(40, -28, 86, -70);
    ctx.quadraticCurveTo(118, -120, 110, -250); ctx.quadraticCurveTo(0, -300, -110, -250);
  });
  // saç
  if (c.sacTip === 'kisa') {
    yol(ctx, c.sac, () => {
      ctx.moveTo(-118, -175); ctx.quadraticCurveTo(-140, -300, -40, -330); ctx.quadraticCurveTo(60, -350, 120, -300);
      ctx.quadraticCurveTo(140, -250, 118, -180); ctx.lineTo(100, -235); ctx.lineTo(60, -250); ctx.lineTo(70, -280);
      ctx.lineTo(10, -262); ctx.lineTo(-30, -285); ctx.lineTo(-50, -255); ctx.lineTo(-95, -245);
    });
  } else {
    ctx.save();
    for (const [x, y, r] of [[-95, -230, 42], [-60, -285, 46], [0, -305, 50], [60, -288, 46], [98, -235, 42], [-20, -270, 40], [40, -265, 40]])
      yol(ctx, c.sac, () => ctx.arc(x, y, r, 0, Math.PI * 2));
    ctx.fillStyle = c.sac; ctx.beginPath(); ctx.ellipse(0, -255, 105, 45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  yuz(ctx, c, p);
}

function yuz(ctx, c, p) {
  const e = p.ifade || 'normal', m = p.agiz || 0;
  const blink = p.kirp ? 1 : 0;
  // kaşlar
  const kas = { normal: [0, 0], gulumse: [-4, 0], sirit: [-6, 0], igrenme: [14, -8], saskin: [-22, 0], kizgin: [16, 10], kendinden: [6, -6], gozkirp: [0, 0], heyecan: [-18, 0], dusunceli: [-10, 8] }[e] || [0, 0];
  ctx.strokeStyle = '#111'; ctx.lineCap = 'round'; ctx.lineWidth = 13;
  for (const s of [-1, 1]) {
    const tilt = (s === 1 ? kas[1] : -kas[1]);
    ctx.beginPath(); ctx.moveTo(s * 22, -222 + kas[0] + tilt * 0.5); ctx.lineTo(s * 78, -226 + kas[0] * 0.6 - tilt); ctx.stroke();
  }
  // gözler
  for (const s of [-1, 1]) {
    const x = s * 50, y = -180;
    const kapali = blink || (e === 'gozkirp' && s === 1);
    const yari = ['igrenme', 'kendinden', 'kizgin'].includes(e);
    if (kapali || e === 'sirit') {
      ctx.lineWidth = 9; ctx.beginPath();
      if (e === 'sirit' && !kapali) ctx.arc(x, y + 6, 18, Math.PI * 1.15, Math.PI * 1.85); else { ctx.moveTo(x - 20, y); ctx.quadraticCurveTo(x, y + 10, x + 20, y); }
      ctx.stroke(); continue;
    }
    const ry = e === 'saskin' || e === 'heyecan' ? 30 : 24;
    yol(ctx, '#fff', () => ctx.ellipse(x, y, 22, ry, 0, 0, Math.PI * 2));
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + (p.bak || 0) * 6, y + 2, e === 'saskin' ? 8 : 11, 0, Math.PI * 2); ctx.fill();
    if (yari) { ctx.fillStyle = c.cilt; ctx.beginPath(); ctx.rect(x - 26, y - ry - 6, 52, ry * 0.95); ctx.fill(); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - 24, y - ry * 0.1); ctx.lineTo(x + 24, y - ry * 0.1); ctx.stroke(); }
  }
  // burun
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(4, -165); ctx.quadraticCurveTo(-14, -130, 8, -125); ctx.stroke();
  // ağız
  const y = -88;
  if (m > 0.08) {
    const w = e === 'sirit' || e === 'heyecan' ? 46 : 32, h = 8 + m * 34;
    yol(ctx, '#6b1d1d', () => ctx.ellipse(0, y, w, h, 0, 0, Math.PI * 2));
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, y - h + 7, w * 0.75, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e0676b'; ctx.beginPath(); ctx.ellipse(0, y + h * 0.55, w * 0.5, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  } else if (e === 'sirit' || e === 'heyecan') {
    yol(ctx, '#fff', () => { ctx.moveTo(-52, y - 12); ctx.quadraticCurveTo(0, y + 40, 52, y - 12); ctx.quadraticCurveTo(0, y - 2, -52, y - 12); });
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, y - 4); ctx.quadraticCurveTo(0, y + 8, 40, y - 4); ctx.stroke();
  } else if (e === 'saskin') {
    yol(ctx, '#6b1d1d', () => ctx.ellipse(0, y, 20, 26, 0, 0, Math.PI * 2));
  } else if (e === 'igrenme' || e === 'kizgin') {
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-34, y + 4); ctx.quadraticCurveTo(0, y - 16, 34, y + 8); ctx.stroke();
  } else {
    const k = e === 'gulumse' || e === 'kendinden' || e === 'gozkirp' ? 18 : 6;
    ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-36, y - 4); ctx.quadraticCurveTo(0, y + k, 38, y - 8); ctx.stroke();
  }
}

function kolLerp(a, b, k) {
  return a.map((arm, i) => arm.map((v, j) => v + (b[i][j] - v) * k));
}

// p: {x, y (ayak), olcek, yon (1/-1), ifade, agiz 0..1, kollar: ad veya [[..],[..]], kollarOnce, kolK, kirp, egim, ziplama}
export function ciz(ctx, ad, p) {
  const c = KARAKTERLER[ad];
  let arms = typeof p.kollar === 'string' ? KOLLAR[p.kollar] : p.kollar || KOLLAR.asagi;
  if (p.kollarOnce) arms = kolLerp(KOLLAR[p.kollarOnce] || p.kollarOnce, arms, p.kolK ?? 1);
  ctx.save();
  ctx.translate(p.x, p.y - (p.ziplama || 0));
  ctx.scale(p.olcek * (p.yon || 1), p.olcek * (p.ezilme ? 1 - p.ezilme : 1));
  ctx.translate(0, -760);
  ctx.rotate((p.egim || 0) * Math.PI / 180);
  const onde = arms[0][0] < -10 || arms[0][1] > 100; // kavuşmuş kollar gövdenin önünde
  if (!onde) { kol(ctx, c, -1, ...arms[0]); kol(ctx, c, 1, ...arms[1]); }
  govde(ctx, c);
  ctx.save(); ctx.translate(0, 0); ctx.rotate((p.kafaEgim || 0) * Math.PI / 180); kafa(ctx, c, p); ctx.restore();
  if (onde) { kol(ctx, c, -1, ...arms[0]); kol(ctx, c, 1, ...arms[1]); }
  ctx.restore();
}
