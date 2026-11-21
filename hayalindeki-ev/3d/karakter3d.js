// Stilize 3D karakter: büyük kafa, kapsül gövde/kollar, canvas dokusuyla çizilen yüz (ifade + ağız).
import * as THREE from 'three';

export const TIPLER = {
  kerem: { cilt: '#f1c09a', sac: '#5b3920', ust: '#f26a1b', ust2: '#d9560f', pantolon: '#7d8592', ayakkabi: '#2b2b2b', sacTip: 'kisa', ic: null },
  ozan: { cilt: '#c88b5f', sac: '#1d1715', ust: '#3f6fb5', ust2: '#2f5791', pantolon: '#2e3440', ayakkabi: '#f2f2f2', sacTip: 'kivircik', ic: '#f4f4f4' },
};

// kol pozları: [omuzX, omuzZ, dirsekX, dirsekZ] derece (sol kol; sağ kol Z'leri ayna)
// omuzZ +: kolu yana aç; omuzX -: kolu öne kaldır; dirsekX -: önkolu öne bük; dirsekZ -: önkolu içe çevir
export const POZ = {
  asagi: [[0, 8, -8, 0], [0, 8, -8, 0]],
  belde: [[10, 38, 0, -105], [10, 38, 0, -105]],
  kavusmus: [[-38, 8, -15, -100], [-30, 12, -15, -105]],
  omuz: [[-15, 30, -85, 0], [-15, 30, -85, 0]],
  yumruk: [[0, 8, -8, 0], [-10, 165, 0, 15]],
  isaret: [[0, 8, -8, 0], [-70, 25, 0, 0]],
  davet: [[0, 8, -8, 0], [-40, 40, -70, 0]],
  sasirma: [[-20, 125, 0, 40], [-20, 125, 0, 40]],
  cene: [[0, 8, -8, 0], [-35, 10, -145, -10]],
  heyecan: [[-10, 165, 0, 10], [-10, 165, 0, 10]],
};

const rad = d => d * Math.PI / 180;

function mat(c, opts = {}) { return new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, ...opts }); }

function capsule(r, len, m) {
  const g = new THREE.CapsuleGeometry(r, len, 6, 16); g.translate(0, -len / 2 - r, 0);
  const o = new THREE.Mesh(g, m); o.castShadow = true; return o;
}

// ---------- yüz dokusu ----------
function yuzCiz(g, c, p) {
  const W = 512, H = 512, e = p.ifade || 'normal', m = p.agiz || 0;
  g.clearRect(0, 0, W, H);
  g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#141414';
  const ol = (fill, fn, lw = 10) => { g.beginPath(); fn(); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.stroke(); };
  // kaşlar
  const kas = { normal: [0, 0], gulumse: [-4, 0], sirit: [-8, 0], igrenme: [14, -10], saskin: [-30, 0], kizgin: [16, 14], kendinden: [6, -8], gozkirp: [0, 0], heyecan: [-24, 0], dusunceli: [-12, 10] }[e] || [0, 0];
  g.lineWidth = 18;
  for (const s of [-1, 1]) {
    const tilt = s === 1 ? kas[1] : -kas[1];
    g.beginPath(); g.moveTo(256 + s * 34, 150 + kas[0] + tilt * 0.5); g.lineTo(256 + s * 112, 156 + kas[0] * 0.6 - tilt); g.stroke();
  }
  // gözler
  for (const s of [-1, 1]) {
    const x = 256 + s * 72, y = 215;
    const kapali = p.kirp || (e === 'gozkirp' && s === 1);
    if (kapali || e === 'sirit') {
      g.lineWidth = 12; g.beginPath();
      if (e === 'sirit' && !kapali) g.arc(x, y + 12, 26, Math.PI * 1.15, Math.PI * 1.85); else { g.moveTo(x - 28, y); g.quadraticCurveTo(x, y + 14, x + 28, y); }
      g.stroke(); continue;
    }
    const ry = e === 'saskin' || e === 'heyecan' ? 44 : 36;
    ol('#fff', () => g.ellipse(x, y, 30, ry, 0, 0, Math.PI * 2));
    g.fillStyle = '#141414'; g.beginPath(); g.arc(x + (p.bak || 0) * 8, y + 4, e === 'saskin' ? 11 : 16, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + (p.bak || 0) * 8 + 5, y - 2, 4, 0, Math.PI * 2); g.fill();
    if (['igrenme', 'kendinden', 'kizgin'].includes(e)) {
      g.fillStyle = c.cilt; g.fillRect(x - 36, y - ry - 8, 72, ry * 0.95);
      g.lineWidth = 11; g.beginPath(); g.moveTo(x - 33, y - ry * 0.1); g.lineTo(x + 33, y - ry * 0.1); g.stroke();
    }
  }
  // ağız
  const y = 375;
  if (m > 0.08) {
    const w = e === 'sirit' || e === 'heyecan' ? 66 : 48, h = 12 + m * 50;
    ol('#6b1d1d', () => g.ellipse(256, y, w, h, 0, 0, Math.PI * 2));
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(256, y - h + 10, w * 0.72, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#e0676b'; g.beginPath(); g.ellipse(256, y + h * 0.55, w * 0.5, h * 0.3, 0, 0, Math.PI * 2); g.fill();
  } else if (e === 'sirit' || e === 'heyecan') {
    ol('#fff', () => { g.moveTo(180, y - 18); g.quadraticCurveTo(256, y + 58, 332, y - 18); g.quadraticCurveTo(256, y - 2, 180, y - 18); });
  } else if (e === 'saskin') {
    ol('#6b1d1d', () => g.ellipse(256, y, 28, 36, 0, 0, Math.PI * 2));
  } else if (e === 'igrenme' || e === 'kizgin') {
    g.lineWidth = 13; g.beginPath(); g.moveTo(206, y + 6); g.quadraticCurveTo(256, y - 22, 306, y + 12); g.stroke();
  } else {
    const k = ['gulumse', 'kendinden', 'gozkirp', 'dusunceli'].includes(e) ? 26 : 8;
    g.lineWidth = 13; g.beginPath(); g.moveTo(204, y - 6); g.quadraticCurveTo(256, y + k, 310, y - 12); g.stroke();
  }
}

export function karakterYap(ad) {
  const c = TIPLER[ad];
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const mSkin = mat(c.cilt), mTop = mat(c.ust), mTop2 = mat(c.ust2), mPant = mat(c.pantolon), mShoe = mat(c.ayakkabi), mHair = mat(c.sac, { roughness: 0.9 });
  // bacaklar
  for (const s of [-1, 1]) {
    const leg = capsule(0.13, 0.55, mPant); leg.position.set(s * 0.15, 0.95, 0); body.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10), mShoe); shoe.scale.set(1, 0.55, 1.5); shoe.position.set(s * 0.15, 0.08, 0.06); shoe.castShadow = true; body.add(shoe);
  }
  // gövde
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.42, 6, 20), mTop); torso.scale.set(1, 1, 0.72); torso.position.y = 1.3; torso.castShadow = true; body.add(torso);
  if (c.ic) { const tee = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.36, 6, 16), mat(c.ic)); tee.scale.set(1, 1, 0.45); tee.position.set(0, 1.32, 0.2); body.add(tee); }
  else { const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.04), mTop2); pocket.position.set(0, 1.12, 0.235); body.add(pocket); }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.07, 10, 20), c.ic ? mTop2 : mTop2); collar.rotation.x = Math.PI / 2; collar.position.y = 1.66; body.add(collar);
  // kollar
  const arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.38, 1.56, 0); body.add(sh);
    const up = capsule(0.095, 0.26, mTop); sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.45; sh.add(el);
    const fo = capsule(0.085, 0.22, mTop); el.add(fo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), mSkin); hand.position.y = -0.42; hand.castShadow = true; el.add(hand);
    arms.push({ s, sh, el });
  }
  // kafa
  const head = new THREE.Group(); head.position.y = 1.78; body.add(head);
  const R = 0.42;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(R, 40, 28), mSkin); skull.scale.set(1, 1.06, 0.95); skull.position.y = R; skull.castShadow = true; head.add(skull);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), mSkin); ear.scale.set(0.6, 1, 0.8); ear.position.set(s * R * 0.98, R * 0.95, 0); head.add(ear); }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mSkin); nose.position.set(0, R * 0.9, R * 0.93); head.add(nose);
  // yüz dokusu: kafanın önünde ince kabuk
  const cv = document.createElement('canvas'); cv.width = cv.height = 512;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const faceGeo = new THREE.SphereGeometry(R * 1.012, 40, 24, Math.PI / 2 - 0.72, 1.44, 0.78, 1.3);
  const face = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.8, depthWrite: false }));
  face.scale.copy(skull.scale); face.position.copy(skull.position); face.renderOrder = 2; head.add(face);
  // saç
  if (c.sacTip === 'kisa') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.06, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), mHair);
    cap.scale.set(1.02, 1.1, 1.02); cap.position.y = R + 0.03; cap.rotation.x = -0.18; cap.castShadow = true; head.add(cap);
    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), mHair);
      const a = -0.9 + i * 0.36; sp.position.set(Math.sin(a) * 0.3, R * 1.75, Math.cos(a) * 0.3 + 0.05); sp.rotation.set(0.9, 0, -Math.sin(a) * 0.6); head.add(sp);
    }
  } else {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 * 2.3, h = 0.15 + (i % 5) * 0.06;
      const bl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), mHair);
      const rr = R * (0.75 + 0.25 * Math.cos(h * 3));
      bl.position.set(Math.cos(a) * rr, R + R * 0.45 + h * 0.9, Math.sin(a) * rr * 0.9 - 0.06);
      if (bl.position.z > 0.2 && bl.position.y < R * 1.6) continue;
      bl.castShadow = true; head.add(bl);
    }
    const top = new THREE.Mesh(new THREE.SphereGeometry(R * 1.04, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.38), mHair); top.position.y = R + 0.05; top.rotation.x = -0.25; head.add(top);
  }
  root.traverse(o => { if (o.isMesh && o !== face) { o.castShadow = true; o.receiveShadow = true; } });

  let lastKey = '';
  function guncelle(p) {
    // kollar
    const A = typeof p.kollar === 'string' ? POZ[p.kollar] : p.kollar || POZ.asagi;
    const B = p.kollarOnce ? (POZ[p.kollarOnce] || p.kollarOnce) : A;
    const k = p.kolK ?? 1;
    arms.forEach(({ s, sh, el }, i) => {
      const a = A[i], b = B[i], v = j => b[j] + (a[j] - b[j]) * k;
      sh.rotation.set(rad(v(0)), 0, rad(v(1)) * (s < 0 ? -1 : 1));
      el.rotation.set(rad(v(2)), 0, rad(v(3)) * (s < 0 ? -1 : 1));
    });
    head.rotation.set(rad(p.kafaX || 0), rad(p.kafaY || 0), rad(p.kafaZ || 0));
    body.rotation.z = rad(p.egim || 0);
    body.position.y = p.ziplama || 0;
    const sq = p.ezilme || 0; body.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    const key = [p.ifade, Math.round((p.agiz || 0) * 12), p.kirp ? 1 : 0, p.bak || 0].join('|');
    if (key !== lastKey) { yuzCiz(cv.getContext('2d'), c, p); tex.needsUpdate = true; lastKey = key; }
  }
  guncelle({});
  root.userData.guncelle = guncelle;
  return root;
}
