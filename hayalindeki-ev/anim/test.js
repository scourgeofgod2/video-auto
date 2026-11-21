import { ciz } from './karakter.js';
export const DURATION = 1;
let bg;
export async function init() { bg = new Image(); bg.src = 'arkaplan/B1.png'; await bg.decode(); }
export function draw(ctx, t) {
  ctx.drawImage(bg, 0, 0, 1080, 1920);
  const poz = [['kerem','igrenme','kavusmus',0],['kerem','sirit','yumruk',0],['ozan','saskin','sasirma',0.8],['ozan','heyecan','heyecan',0]];
  poz.forEach(([ad,ifade,kollar,agiz],i)=> ciz(ctx, ad, {x: 150 + i*260, y: 1500 + (i%2)*300, olcek: 0.36, ifade, kollar, agiz, yon: i%2?-1:1}));
}
