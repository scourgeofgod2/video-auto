#!/usr/bin/env python3
"""Replik zamanlarını kurar; diyalog sesini (ses/diyalog.wav) ve animasyonun okuduğu anim/zaman.json'u yazar."""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SES = os.path.join(HERE, "ses")
FPS = 24
SR = 44100

# (id, kim, metin, başlangıç)
REPLIKLER = [
    ("k1", "kerem", "Ev bakıyorum. Bu mu? Çok küçük.", 0.35),
    ("k2", "kerem", "Bu da saray gibi, fazla büyük.", 4.75),
    ("k3", "kerem", "Yok, hiç benim tarzım değil.", 7.55),
    ("k4", "kerem", "Dur dur dur…", 9.65),
    ("k5", "kerem", "İşte bu! Vurgun!", 12.35),
    ("o6", "ozan", "Kanka, yeni ev aldım demiştin, nerede?", 15.55),
    ("k7", "kerem", "Gel bakalım.", 18.8),
    ("o8", "ozan", "Bu ne ya!", 21.05),
    ("k9", "kerem", "Garaj, spor salonu, yatak odası. Hepsi tek odada.", 22.35),
    ("o10", "ozan", "Kanka, ben de taşınıyorum!", 27.05),
]
SURE = 29.3


def oku(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def parcalar(metin, t0, dur):
    """Repliği 1-3 kelimelik haplara böl; süreyi harf sayısına göre paylaştır."""
    kel = metin.split()
    gr, cur = [], []
    for k in kel:
        cur.append(k)
        if len(" ".join(cur)) >= 12 or k[-1] in ".,!?…":
            gr.append(" ".join(cur)); cur = []
    if cur: gr.append(" ".join(cur))
    tot = sum(len(g) for g in gr); t, out = t0, []
    for g in gr:
        d = dur * len(g) / tot
        out.append({"t0": round(t, 3), "t1": round(t + d, 3), "metin": g.rstrip(",")}); t += d
    return out


def main():
    mix = np.zeros(int(SURE * SR), dtype=np.float32)
    out = {"sure": SURE, "fps": FPS, "replikler": []}
    for rid, kim, metin, t0 in REPLIKLER:
        a = oku(os.path.join(SES, f"{rid}.wav"))
        i = int(t0 * SR); mix[i:i + len(a)] += a[: len(mix) - i]
        dur = len(a) / SR
        hop = SR // FPS
        env = [float(np.sqrt(np.mean(a[j:j + hop] ** 2))) for j in range(0, len(a), hop)]
        m = max(env) or 1
        env = [round(min(1.0, (e / m) ** 0.7 * 1.25), 3) for e in env]
        out["replikler"].append({"id": rid, "kim": kim, "metin": metin, "t0": t0, "t1": round(t0 + dur, 3),
                                 "agiz": env, "haplar": parcalar(metin, t0, dur)})
    peak = np.max(np.abs(mix)) or 1
    mix = np.clip(mix / peak * 0.89, -1, 1)
    with wave.open(os.path.join(SES, "diyalog.wav"), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    json.dump(out, open(os.path.join(HERE, "anim", "zaman.json"), "w"), ensure_ascii=False)
    for r in out["replikler"]:
        print(f'{r["id"]:4} {r["t0"]:6.2f}-{r["t1"]:6.2f}  {" | ".join(h["metin"] for h in r["haplar"])}')


if __name__ == "__main__":
    main()
