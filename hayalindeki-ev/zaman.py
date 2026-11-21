#!/usr/bin/env python3
"""Replik zamanlarını kurar; diyalog sesini (ses/diyalog.wav) ve animasyonun okuduğu anim/zaman.json'u yazar."""
import json, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SES = os.path.join(HERE, "ses2")
FPS = 24
SR = 44100

# (id, kim, metin, başlangıç)
# (id, kim, metin, önceki replikten sonraki boşluk)
REPLIKLER = [
    ("k1", "kerem", "Kanka bu ev mi, kulübe mi? Çok küçük ya.", 0.30),
    ("k2", "kerem", "Bu ne, saray mı? Fazla abartı kanka.", 0.30),
    ("k3", "kerem", "Yok yok, hiç benim tarzım değil valla.", 0.30),
    ("k4", "kerem", "Dur dur dur… Şuna bak.", 0.30),
    ("k5", "kerem", "İşte bu! Vurgun kanka!", 0.30),
    ("o6", "ozan", "Kanka ev aldım dedin, nerede bu ev?", 1.70),   # araya '6 AY SONRA' geçişi
    ("k7", "kerem", "Hazır mısın? Bak şimdi.", 0.25),
    ("o8", "ozan", "Oha! Bu ne ya!", 1.05),                          # araya kepenk açılışı
    ("k9", "kerem", "Garaj, spor salonu, yatak odası. Hepsi tek odada, efsane değil mi?", 0.25),
    ("o10", "ozan", "Kanka ben de taşınıyorum, kararımı verdim!", 0.25),
]
SURE = 0  # son replikten hesaplanır


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
    i = 1
    while i < len(gr):
        if len(gr[i]) <= 4:
            gr[i - 1] += " " + gr.pop(i)
        else:
            i += 1
    tot = sum(len(g) for g in gr); t, out = t0, []
    for g in gr:
        d = dur * len(g) / tot
        out.append({"t0": round(t, 3), "t1": round(t + d, 3), "metin": g.rstrip(",")}); t += d
    return out


def main():
    mix = np.zeros(int(60 * SR), dtype=np.float32)
    out = {"sure": 0, "fps": FPS, "replikler": []}
    t = 0.0
    for rid, kim, metin, bosluk in REPLIKLER:
        t0 = round(t + bosluk, 3)
        a = oku(os.path.join(SES, f"{rid}.wav"))
        i = int(t0 * SR); mix[i:i + len(a)] += a[: len(mix) - i]
        dur = len(a) / SR
        t = t0 + dur
        hop = SR // FPS
        env = [float(np.sqrt(np.mean(a[j:j + hop] ** 2))) for j in range(0, len(a), hop)]
        m = max(env) or 1
        env = [round(min(1.0, (e / m) ** 0.7 * 1.25), 3) for e in env]
        out["replikler"].append({"id": rid, "kim": kim, "metin": metin, "t0": t0, "t1": round(t0 + dur, 3),
                                 "agiz": env, "haplar": parcalar(metin, t0, dur)})
    out["sure"] = round(t + 0.8, 2)
    mix = mix[: int(out["sure"] * SR)]
    peak = np.max(np.abs(mix)) or 1
    mix = np.clip(mix / peak * 0.89, -1, 1)
    with wave.open(os.path.join(SES, "diyalog.wav"), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    json.dump(out, open(os.path.join(HERE, "anim", "zaman.json"), "w"), ensure_ascii=False)
    for r in out["replikler"]:
        print(f'{r["id"]:4} {r["t0"]:6.2f}-{r["t1"]:6.2f}  {" | ".join(h["metin"] for h in r["haplar"])}')


if __name__ == "__main__":
    main()
