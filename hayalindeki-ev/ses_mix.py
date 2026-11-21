#!/usr/bin/env python3
"""Diyalog + sentez efektler (geçişlerde whoosh, vurgulu haplarda pop) -> ses/mix.wav"""
import json, os, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
rng = np.random.default_rng(3)


def oku(p):
    with wave.open(p) as w:
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def whoosh(d=0.45, f0=300, f1=3000):
    n = int(d * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # süpürülen bant geçiren: basit tek kutuplu filtre zinciri, kesim frekansı zamanla artar
    y = np.zeros(n); lp = 0; hp = 0
    for i in range(n):
        f = f0 * (f1 / f0) ** (i / n)
        a = 1 - np.exp(-2 * np.pi * f / SR)
        lp += a * (x[i] - lp); hp = lp - (hp * 0.97)
        y[i] = lp
    env = np.sin(np.pi * t / d) ** 2
    return y * env / (np.max(np.abs(y)) + 1e-9) * 0.35


def pop(f=900, d=0.09):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t * (1 - t * 3)) * np.exp(-t * 45) * 0.35


def main():
    Z = json.load(open(os.path.join(HERE, "anim", "zaman.json")))
    dia = oku(os.path.join(HERE, "ses", "diyalog.wav"))
    mix = np.zeros(int(Z["sure"] * SR) + SR, dtype=np.float32); mix[:len(dia)] += dia
    k9 = next(r for r in Z["replikler"] if r["id"] == "k9")
    cut_b8 = k9["haplar"][1]["t0"] - 0.05
    W = whoosh()
    for t in [4.6, 7.4, 9.5, 12.2, 14.5, 20.45, cut_b8]:
        i = max(0, int((t - 0.25) * SR)); mix[i:i + len(W)] += W[: len(mix) - i]
    # flaş anında düşük bir 'boom'
    n = int(0.6 * SR); tt = np.arange(n) / SR; boom = np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 6) * 0.5
    i = int(21.0 * SR); mix[i:i + n] += boom
    P = pop()
    for r in Z["replikler"]:
        for h in r["haplar"]:
            if h["metin"].endswith("!") or "küçük" in h["metin"].lower():
                i = int(h["t0"] * SR); mix[i:i + len(P)] += P
    i = int(14.45 * SR); mix[i:i + len(P)] += pop(650)  # 6 AY SONRA
    mix = np.clip(mix / max(1, np.max(np.abs(mix)) / 0.95), -1, 1)[: int(Z["sure"] * SR)]
    with wave.open(os.path.join(HERE, "ses", "mix.wav"), "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
    print("ses/mix.wav", len(mix) / SR)


if __name__ == "__main__":
    main()
