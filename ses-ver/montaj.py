#!/usr/bin/env python3
"""Ses Ver: seslendirme + sentezlenmiş efektleri (tuş tıkları, Enter vuruşu, pop, whoosh, çan) miksler,
sessiz render ile birleştirir.

  python3 montaj.py            # cikti/ses_ver_sessiz.mp4 -> cikti/ses_ver.mp4
"""
import os, subprocess, numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR, DUR = 48000, 23.0
rng = np.random.default_rng(7)

def env(n, a=0.002, d=0.05):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def thock(gain=1.0, low=170):
    n = int(0.12 * SR); t = np.arange(n) / SR
    tick = rng.standard_normal(n) * env(n, 0.0005, 0.006)
    tick = np.convolve(tick, [1, -0.9], 'same')                 # tiz tık
    body = np.sin(2 * np.pi * low * t * (1 - 0.25 * t / 0.12)) * env(n, 0.001, 0.035)
    return gain * (0.55 * tick + 0.8 * body)

def slam():
    n = int(0.9 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 85 * t * (1 - 0.3 * t)) * env(n, 0.001, 0.16)
    noise = rng.standard_normal(n) * env(n, 0.001, 0.05)
    noise = np.convolve(noise, np.ones(12) / 12, 'same')
    return 1.3 * body + 0.6 * noise + np.pad(thock(1.2, 130), (0, n - int(0.12 * SR)))

def pop(f0=500, f1=1100, d=0.09):
    n = int(d * SR); t = np.arange(n) / SR
    f = np.linspace(f0, f1, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, d / 3)

def bell(freqs, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) / (i + 1) for i, f in enumerate(freqs)) * env(n, 0.003, d / 4)

def whoosh(d=0.6):
    n = int(d * SR)
    x = rng.standard_normal(n)
    x = np.convolve(x, np.ones(30) / 30, 'same')
    w = np.sin(np.pi * np.arange(n) / n) ** 2
    return x * w * 2.2

fx = np.zeros(int(DUR * SR))
def put(sig, t, g=1.0):
    i = int(t * SR); j = min(len(fx), i + len(sig)); fx[i:j] += g * sig[:j - i]

LAND = [0.45, 0.85, 1.28, 1.63, 2.3, 2.65, 2.97, 3.5, 7.3, 7.8, 8.2, 8.9, 9.28, 9.66, 10.08, 17.78]
for k, t in enumerate(LAND):
    put(thock(0.9 + 0.2 * rng.random(), 160 + 30 * rng.random()), t, 0.55)
for t in [0.15, 0.55, 1.0, 1.35, 2.0, 2.4, 2.72, 3.05, 7.5, 7.9, 8.6, 9.0, 9.38, 9.8]:
    put(pop(300, 520, 0.05), t, 0.08)                         # kalkış "hop"
put(whoosh(0.5), 3.05, 0.12)
put(pop(450, 950), 5.32, 0.22)                                # balon belirir
for i in range(3): put(pop(900, 1000, 0.04), 5.45 + i * 0.15, 0.1)
put(pop(1000, 380, 0.08), 6.25, 0.18)                         # balon söner
put(bell([1320, 1980, 2640], 0.9), 7.05, 0.12)                # fikir!
put(whoosh(0.7), 10.3, 0.2)                                   # büyük zıplama
put(slam(), 10.95, 0.5)                                       # Enter
put(bell([660, 990, 1320], 1.6), 10.98, 0.12)
put(bell([1046, 1568], 1.4), 19.95, 0.1)                      # logo
put(bell([1318, 1976], 1.4), 20.15, 0.08)
put(pop(700, 1400, 0.06), 20.75, 0.1)                         # göz kırpma

# basit oda yankısı
ir = np.zeros(int(0.35 * SR));
for d, g in [(0.031, 0.35), (0.053, 0.25), (0.089, 0.18), (0.137, 0.1), (0.21, 0.06)]: ir[int(d * SR)] = g
ir[0] = 1
fx = np.convolve(fx, ir)[:len(fx)]

voice = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "seslendirme_burcu.mp3"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True, check=True).stdout
voice = np.frombuffer(voice, np.float32)
mix = fx * 0.5
mix[:len(voice)] += voice[:len(mix)]
mix /= max(1.0, np.abs(mix).max() / 0.95)
wav = os.path.join(HERE, "cikti", "mix.wav")
pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(wav, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.join(HERE, "cikti", "ses_ver_sessiz.mp4"), "-i", wav,
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-shortest",
                os.path.join(HERE, "cikti", "ses_ver.mp4")], check=True)
print("hazır: cikti/ses_ver.mp4")
