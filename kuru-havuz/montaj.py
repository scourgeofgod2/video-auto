#!/usr/bin/env python3
"""Kuru Havuz (TR) montajı.

Kullanım:
  python3 montaj.py --clips klipler/            # G1.mp4 ... G8.mp4
  python3 montaj.py --placeholder               # klip yokken düzeni test et

Çıktı: kuru_havuz_tr.mp4 (1080x1920, 24 fps), altyazi.ass, altyazi.srt
"""
import argparse, json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 24

# Seslendirmenin cümle zamanları (SpeechGenAI timings)
SEGMENTS = json.load(open(os.path.join(HERE, "zamanlama.json"), encoding="utf-8"))
VOICE = os.path.join(HERE, "seslendirme_erdem.mp3")
END = 66.5  # son cümleden sonra ~1.3 s nefes payı

# Üretim birimleri: ses aralığına göre
UNITS = [("G1", 0.0, 9.6), ("G2", 9.6, 16.7), ("G3", 16.7, 21.6), ("G4", 21.6, 26.8),
         ("G5", 26.8, 38.9), ("G6", 38.9, 51.4), ("G7", 51.4, 59.7), ("G8", 59.7, END)]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"komut başarısız: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r.stdout


def duration(path):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


# ---------- altyazı ----------
def chunks(text, start, end, max_chars=26):
    """Cümleyi en fazla 2 satırlık kısa parçalara böl, süreyi karakter sayısına göre paylaştır."""
    words, parts, cur = text.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > max_chars:
            parts.append(cur); cur = w
        else:
            cur = f"{cur} {w}".strip()
    parts.append(cur)
    # iki satırı bir ekrana koy
    screens = [parts[i:i + 2] for i in range(0, len(parts), 2)]
    total = sum(len(" ".join(s)) for s in screens)
    t, out = start, []
    for s in screens:
        d = (end - start) * len(" ".join(s)) / total
        out.append((t, t + d, s)); t += d
    return out


def ts_ass(t):
    h, m = int(t // 3600), int(t % 3600 // 60)
    return f"{h}:{m:02d}:{t % 60:05.2f}"


def ts_srt(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_subs():
    cues = []
    for i, s in enumerate(SEGMENTS):
        nxt = SEGMENTS[i + 1]["start"] if i + 1 < len(SEGMENTS) else END
        cues += chunks(s["text"], s["start"], min(nxt, s["end"] + 0.25))
    ass = os.path.join(HERE, "altyazi.ass")
    with open(ass, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Alt,Inter,76,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,5,2,2,90,90,640,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""")
        for a, b, lines in cues:
            body = "\\N".join(lines)
            f.write(f"Dialogue: 0,{ts_ass(a)},{ts_ass(b)},Alt,,0,0,0,,{{\\fad(80,0)}}{body}\n")
    with open(os.path.join(HERE, "altyazi.srt"), "w", encoding="utf-8") as f:
        for n, (a, b, lines) in enumerate(cues, 1):
            f.write(f"{n}\n{ts_srt(a)} --> {ts_srt(b)}\n" + "\n".join(lines) + "\n\n")
    return ass


# ---------- görüntü ----------
def fit_clip(src, target, out):
    """Klibi 9:16'ya kırp, hedef süreye oturt: uzunsa kırp, kısaysa 1.25x'e kadar yavaşlat, kalanı son kareyi dondurarak doldur."""
    d = duration(src)
    slow = min(max(target / d, 1.0), 1.25)
    pad = max(target - d * slow, 0) + 0.1
    vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
          f"setpts={slow:.4f}*PTS,fps={FPS},tpad=stop_mode=clone:stop_duration={pad:.3f},setsar=1")
    run(["ffmpeg", "-y", "-v", "error", "-i", src, "-vf", vf, "-t", f"{target:.3f}", "-an",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", out])


def placeholder(name, target, out):
    run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"testsrc2=s={W}x{H}:r={FPS}",
         "-vf", f"drawtext=text='{name}':fontsize=200:fontcolor=white:x=(w-tw)/2:y=300:box=1:boxcolor=black@0.6",
         "-t", f"{target:.3f}", "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", out])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clips", default=os.path.join(HERE, "klipler"))
    ap.add_argument("--placeholder", action="store_true", help="eksik klipleri test görüntüsüyle doldur")
    ap.add_argument("-o", "--out", default=os.path.join(HERE, "kuru_havuz_tr.mp4"))
    a = ap.parse_args()

    ass = write_subs()
    tmp = tempfile.mkdtemp(prefix="montaj_")
    parts = []
    for name, s, e in UNITS:
        out = os.path.join(tmp, f"{name}.mp4")
        src = next((os.path.join(a.clips, f"{name}{ext}") for ext in (".mp4", ".mov", ".webm")
                    if os.path.exists(os.path.join(a.clips, f"{name}{ext}"))), None)
        if src:
            fit_clip(src, e - s, out); print(f"{name}: {os.path.basename(src)} -> {e - s:.2f}s")
        elif a.placeholder:
            placeholder(name, e - s, out); print(f"{name}: (yer tutucu) {e - s:.2f}s")
        else:
            sys.exit(f"{name} klibi yok: {a.clips}/{name}.mp4  (test için --placeholder)")
        parts.append(out)

    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{p}'\n" for p in parts)
    vid = os.path.join(tmp, "video.mp4")
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", vid])
    run(["ffmpeg", "-y", "-v", "error", "-i", vid, "-i", VOICE,
         "-filter_complex", f"[0:v]ass={ass}[v];[1:a]apad=whole_dur={END}[a]",
         "-map", "[v]", "-map", "[a]", "-t", f"{END}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.out])
    print(f"tamam: {a.out} ({duration(a.out):.1f}s)")


if __name__ == "__main__":
    main()
