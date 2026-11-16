#!/usr/bin/env python3
"""Bitmiş videoya kapanış ekler: (1) bulanık son kare üstünde 'Bu videoyu Claude hazırladı' kartı,
(2) SpeechGenAI reklam görselinin parça parça açılan animasyonu; ikisi de seslendirmeli.
speechgenai.com filigranı reklam bölümüne kadar sağ altta durur.

  python3 kapanis.py klipler/kuru_havuz_tr_final.mp4 -o klipler/kuru_havuz_tr_yayin.mp4
"""
import argparse, os, subprocess, sys, tempfile
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 24
KD = os.path.join(HERE, "kapanis")
SES = os.path.join(KD, "kapanis_ses.mp3")
REKLAM = os.path.join(KD, "reklam.png")

# kapanış sesinin cümle zamanları (SpeechGenAI timings)
S1 = (0.31, 3.80)     # Bu videoyu Claude hazırladı, sesini SpeechGenAI verdi.
S2 = 4.05             # İçeriğine sen de ses ver.
S3 = 5.87             # Starter paketiyle ilk ay sadece bir dolar.
S4 = (8.96, 10.28)    # speechgenai.com

# reklam görselinin satır blokları (orijinal piksel, y0-y1) ve sesteki görünme anı (reklam başına göre)
PARCALAR = [  # (y0, y1, görünme)
    (85, 178, 0.00),    # logo
    (236, 383, 0.10),   # İçeriğine
    (404, 478, 0.35),   # ses ver.
    (512, 555, 0.65),   # Yapay zekâ ile Türkçe seslendirme.
    (574, 896, 0.95),   # ses dalgası
    (902, 951, None),   # Starter ile ilk ay   -> S3
    (970, 1146, None),  # $1 · 200.000 kredi   -> S3 + 0.25
    (1206, 1262, None), # speechgenai.com      -> S4
    (1280, 1313, None), # Yeni abonelere özel  -> S4 + 0.3
]
GECIS1, GECIS2 = 0.5, 0.3


def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, **kw)
    if r.returncode:
        sys.exit(f"komut başarısız: {' '.join(map(str, cmd))[:400]}\n{r.stderr[-2000:].decode(errors='ignore') if isinstance(r.stderr, bytes) else r.stderr[-2000:]}")
    return r.stdout


def dur(p):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))


def ts(t):
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def ease_out(k):
    k = min(1.0, max(0.0, k)); return 1 - (1 - k) ** 3


def reklam_video(out, sure, ses_ofset):
    """ses_ofset: reklam başladığında kapanış sesinin kaçıncı saniyesindeyiz."""
    src = Image.open(REKLAM).convert("RGB")
    bg = src.getpixel((5, 5))
    s = W / src.width
    oy = (H - src.height * s) / 2
    times = []
    for (y0, y1, t), i in zip(PARCALAR, range(len(PARCALAR))):
        if t is None:
            t = {5: S3, 6: S3 + 0.25, 7: S4[0], 8: S4[0] + 0.3}[i] - ses_ofset
        times.append(t)
    pieces = []
    for (y0, y1, _), t in zip(PARCALAR, times):
        a, b = max(0, y0 - 6), min(src.height, y1 + 6)
        p = src.crop((0, a, src.width, b)).resize((W, round((b - a) * s)), Image.LANCZOS)
        pieces.append((p, oy + a * s, t))
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    n = round(sure * FPS)
    for f in range(n):
        t = f / FPS
        frame = Image.new("RGB", (W, H), bg)
        for p, y, t0 in pieces:
            k = ease_out((t - t0) / 0.45)
            if k <= 0:
                continue
            dy = (1 - k) * 50
            if k >= 1:
                frame.paste(p, (0, round(y)))
            else:
                layer = Image.new("RGB", p.size, bg)
                frame.paste(Image.blend(layer, p, k), (0, round(y + dy)))
        # çok hafif genel yakınlaşma
        z = 1 + 0.025 * (t / sure)
        if z > 1.001:
            zw, zh = round(W * z), round(H * z)
            frame = frame.resize((zw, zh), Image.BILINEAR).crop(((zw - W) // 2, (zh - H) // 2, (zw - W) // 2 + W, (zh - H) // 2 + H))
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--filigran", default="speechgenai.com")
    ap.add_argument("--kart1", default="Bu videoyu\\NClaude hazırladı")
    ap.add_argument("--kart2", default="Sesi: SpeechGenAI")
    a = ap.parse_args()

    d = dur(a.video)
    ses0 = d - 0.3                       # kapanış sesi ana videonun bitiminden hemen önce başlar
    reklam0 = ses0 + S2 - 0.25           # reklam 'İçeriğine...' cümlesiyle başlar
    son = ses0 + S4[1] + 1.4
    kart_sure = reklam0 + GECIS2 - (d - GECIS1)
    reklam_sure = son - reklam0
    tmp = tempfile.mkdtemp(prefix="kapanis_")

    last = os.path.join(tmp, "last.png")
    run(["ffmpeg", "-y", "-v", "error", "-sseof", "-0.1", "-i", a.video, "-frames:v", "1", "-update", "1", last])
    card = os.path.join(tmp, "card.mp4")
    run(["ffmpeg", "-y", "-v", "error", "-loop", "1", "-i", last, "-t", f"{kart_sure:.3f}",
         "-vf", f"scale={W}:{H},boxblur=28:2,eq=brightness=-0.22:saturation=0.8,fps={FPS},setsar=1,format=yuv420p",
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", card])
    ad = os.path.join(tmp, "ad.mp4")
    reklam_video(ad, reklam_sure, reklam0 - ses0)

    ass = os.path.join(tmp, "k.ass")
    with open(ass, "w", encoding="utf-8") as f:
        f.write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Wm,Inter SemiBold,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,0,0,0,0,100,100,0,0,1,0,2,3,60,60,300,1
Style: K1,Inter,88,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,0,0,1,0,3,5,80,80,0,1
Style: K2,Inter SemiBold,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,0,0,0,0,100,100,0,0,1,0,3,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,{ts(0)},{ts(reklam0)},Wm,,0,0,0,,{a.filigran}
Dialogue: 1,{ts(d - 0.2)},{ts(reklam0 + 0.1)},K1,,0,0,0,,{{\\pos({W // 2},{H // 2 - 70})\\fad(350,200)}}{a.kart1}
Dialogue: 1,{ts(ses0 + 1.9)},{ts(reklam0 + 0.1)},K2,,0,0,0,,{{\\pos({W // 2},{H // 2 + 120})\\fad(350,200)}}{a.kart2}
""")

    tb = f"fps={FPS},setsar=1,format=yuv420p,settb=1/{FPS}"
    run(["ffmpeg", "-y", "-v", "error", "-i", a.video, "-i", card, "-i", ad, "-i", SES,
         "-filter_complex",
         f"[0:v]{tb}[v0];[1:v]{tb}[v1];[2:v]{tb}[v2];"
         f"[v0][v1]xfade=transition=fade:duration={GECIS1}:offset={d - GECIS1:.3f}[x1];"
         f"[x1][v2]xfade=transition=fade:duration={GECIS2}:offset={reklam0:.3f}[x2];[x2]ass={ass}[v];"
         f"[0:a]apad=whole_dur={son:.3f}[a0];[3:a]adelay={round(ses0 * 1000)}:all=1,apad=whole_dur={son:.3f}[a1];"
         f"[a0][a1]amix=inputs=2:normalize=0:duration=first[aa]",
         "-map", "[v]", "-map", "[aa]", "-t", f"{son:.3f}",
         "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
         "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", a.out])
    print(f"tamam: {a.out} ({dur(a.out):.1f}s)  kapanış sesi {ses0:.2f}s, reklam {reklam0:.2f}s")


if __name__ == "__main__":
    main()
