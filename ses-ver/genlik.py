#!/usr/bin/env python3
"""Seslendirmenin genlik zarfını 100 Hz'de çıkarır (ağız ekolayzeri için) -> 3d/genlik.json"""
import json, subprocess, numpy as np
SR = 16000
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "seslendirme_burcu.mp3", "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = SR // 100
n = len(x) // hop
rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1))
rms = rms / np.percentile(rms, 98)
rms = np.clip(rms, 0, 1)
# hafif yumuşatma (atak hızlı, sönüm yavaş)
out, v = [], 0.0
for r in rms:
    v = r if r > v else v * 0.82 + r * 0.18
    out.append(round(float(v), 3))
json.dump({"hz": 100, "v": out}, open("3d/genlik.json", "w"))
print(n, "örnek")
