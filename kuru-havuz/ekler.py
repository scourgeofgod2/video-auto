#!/usr/bin/env python3
"""Bitmiş videoya filigran, 'Temsili canlandırma' etiketi ve kapanış kartı ekler.

Kullanım:
  python3 ekler.py klipler/kuru_havuz_tr_final.mp4 -o klipler/kuru_havuz_tr_yayin.mp4
"""
import argparse, os, subprocess, sys, tempfile

W, H, FPS = 1080, 1920, 24
KART = 3.0        # kapanış kartı süresi (sn)
GECIS = 0.5       # son kareden karta geçiş (sn)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit(f"komut başarısız: {' '.join(cmd)}\n{r.stderr[-2000:]}")
    return r.stdout


def dur(p):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))


def ts(t):
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--filigran", default="speechgenai.com")
    ap.add_argument("--etiket", default="", help="boş bırakılırsa eklenmez")
    ap.add_argument("--kart1", default="Bu videoyu Claude hazırladı")
    ap.add_argument("--kart2", default="Sesi: SpeechGenAI")
    a = ap.parse_args()

    d = dur(a.video)
    total = d + KART - GECIS
    tmp = tempfile.mkdtemp(prefix="ekler_")

    # kapanış arka planı: son kare, bulanık ve koyu
    last = os.path.join(tmp, "last.png")
    run(["ffmpeg", "-y", "-v", "error", "-sseof", "-0.1", "-i", a.video, "-frames:v", "1", "-update", "1", last])
    card = os.path.join(tmp, "card.mp4")
    run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", last, "-t", f"{KART}",
         "-vf", f"scale={W}:{H},boxblur=28:2,eq=brightness=-0.22:saturation=0.8,fps={FPS},setsar=1,format=yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", card])

    ass = os.path.join(tmp, "ekler.ass")
    end_t = total
    with open(ass, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Wm,Inter SemiBold,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,0,0,0,0,100,100,0,0,1,0,2,3,60,60,300,1
Style: Lbl,Inter SemiBold,34,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,0,1,0,0,100,100,0,0,1,0,2,1,60,60,302,1
Style: K1,Inter,88,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,0,3,5,80,80,0,1
Style: K2,Inter SemiBold,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,0,3,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,{ts(0)},{ts(end_t)},Wm,,0,0,0,,{a.filigran}
""")
        if a.etiket:
            f.write(f"Dialogue: 0,{ts(0)},{ts(d - GECIS)},Lbl,,0,0,0,,{a.etiket}\n")
        k0 = d - GECIS + 0.25
        f.write(f"Dialogue: 1,{ts(k0)},{ts(end_t)},K1,,0,0,0,,{{\\pos({W // 2},{H // 2 - 60})\\fad(350,0)}}{a.kart1}\n")
        f.write(f"Dialogue: 1,{ts(k0 + 0.35)},{ts(end_t)},K2,,0,0,0,,{{\\pos({W // 2},{H // 2 + 60})\\fad(350,0)}}{a.kart2}\n")

    run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-i", card,
         "-filter_complex",
         f"[0:v]fps={FPS},setsar=1,format=yuv420p,settb=1/{FPS}[v0];[1:v]fps={FPS},setsar=1,format=yuv420p,settb=1/{FPS}[v1];"
         f"[v0][v1]xfade=transition=fade:duration={GECIS}:offset={d - GECIS:.3f}[x];[x]ass={ass}[v];"
         f"[0:a]afade=t=out:st={d - GECIS:.3f}:d={GECIS},apad=whole_dur={total:.3f}[aa]",
         "-map", "[v]", "-map", "[aa]", "-t", f"{total:.3f}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.out])
    print(f"tamam: {a.out} ({dur(a.out):.1f}s)")


if __name__ == "__main__":
    main()
