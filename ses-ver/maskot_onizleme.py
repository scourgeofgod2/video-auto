#!/usr/bin/env python3
"""DALGA maskotunun 2D piksel önizlemesi (18x16 ızgara). Üç ağız durumu: sessiz, konuşuyor, kızarmış."""
from PIL import Image, ImageDraw
G, Y, K, B, P = (0x0A,0xA7,0x59), (0xFF,0xD8,0x4D), (0x0F,0x0F,0x0F), (0xF4,0xF5,0xEE), (0xFF,0x8F,0xA3)
W, H, S = 18, 16, 20

def sprite(agiz, kizarma=False):
    px = {}
    def rect(x, y, w, h, c):
        for i in range(x, x+w):
            for j in range(y, y+h): px[(i, j)] = c
    rect(8, 0, 2, 2, Y)            # anten ucu
    rect(8, 2, 2, 1, G)            # anten sapı
    rect(2, 3, 14, 10, G)          # gövde
    for c in [(2,3),(15,3),(2,12),(15,12)]: px.pop(c)   # yuvarlak köşeler
    rect(0, 6, 2, 2, G); rect(16, 6, 2, 2, G)           # kollar
    rect(2, 13, 2, 1, G); rect(1, 14, 1, 1, G)          # konuşma balonu kuyruğu
    rect(6, 13, 2, 3, G); rect(10, 13, 2, 3, G)         # bacaklar
    rect(5, 5, 2, 2, K); rect(11, 5, 2, 2, K)           # gözler
    for i, h in enumerate(agiz):                        # ekolayzer ağız x=6..11, merkez satır 9
        rect(6+i, 9-(h-1)//2 - (1 if h == 4 else 0), 1, h, B) if h else None
    if kizarma: rect(4, 8, 1, 1, P); rect(13, 8, 1, 1, P)
    im = Image.new("RGB", (W*S, H*S), (0x1B,0x1A,0x1F))
    d = ImageDraw.Draw(im)
    for (x, y), c in px.items(): d.rectangle([x*S, y*S, x*S+S-2, y*S+S-2], fill=c)
    return im

kare = [sprite([1,1,1,1,1,1]), sprite([1,2,3,3,2,1]), sprite([1,3,2,3,1,2], True)]
out = Image.new("RGB", (len(kare)*(W*S+40)+40, H*S+80), (0x1B,0x1A,0x1F))
for i, k in enumerate(kare): out.paste(k, (40+i*(W*S+40), 40))
out.save("maskot_onizleme.png"); print("ok")
