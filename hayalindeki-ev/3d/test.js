import * as THREE from 'three';
import { karakterYap } from './karakter3d.js';
export async function createWorld(renderer, aspect) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#bfe0f5');
  const cam = new THREE.PerspectiveCamera(38, aspect, 0.1, 200); cam.position.set(0, 2.4, 11); cam.lookAt(0, 1.5, -1.5);
  scene.add(new THREE.HemisphereLight('#dff0ff', '#a89878', 1.4));
  const sun = new THREE.DirectionalLight('#fff3dd', 2.4); sun.position.set(4, 8, 6); sun.castShadow = true; scene.add(sun);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#9aa39a' })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  const list = [['kerem','igrenme','kavusmus',0],['ozan','saskin','sasirma',0.7],['kerem','sirit','yumruk',0],['ozan','heyecan','heyecan',0.4],['kerem','dusunceli','cene',0],['kerem','gozkirp','davet',0]];
  list.forEach(([ad,ifade,kollar,agiz],i)=>{ const c = karakterYap(ad); c.position.set(-1.3 + (i%3)*1.3, 0, i<3?0:-2.5); c.rotation.y = (i%3-1)*-0.2; c.userData.guncelle({ifade,kollar,agiz,bak:0}); scene.add(c); });
  return { scene, camera: cam, update(){}, duration: 1 };
}
